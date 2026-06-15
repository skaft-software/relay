import { spawn, type ChildProcess } from 'node:child_process';

import type { AppConfig, ModelEntry } from './config.ts';

export type ModelAvailability = {
  ok: boolean;
  code?: string;
  message?: string;
};

export type LifecycleHooks = {
  log?: (level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) => void;
  /**
   * Override the process spawner. Used in tests.
   */
  spawnProcess?: (command: string, argv?: string[]) => ChildProcess | null;
  /**
   * Override the upstream probe. Used in tests.
   */
  probe?: (signal?: AbortSignal) => Promise<boolean>;
  /**
   * Override the wall clock. Used in tests.
   */
  now?: () => number;
  /**
   * Override the timer scheduling so tests can advance time deterministically.
   */
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export type LifecycleState = 'idle' | 'starting' | 'running' | 'stopping' | 'failed';

export type LifecycleStatus = {
  enabled: boolean;
  state: LifecycleState;
  modelAvailable: boolean | null;
  activeJobs: number;
  idleShutdownScheduled: boolean;
  idleShutdownMs: number;
  startCommandConfigured: boolean;
  shutdownCommandConfigured: boolean;
  healthUrlConfigured: boolean;
  startTimeoutMs: number;
  lastStartAt?: string;
  lastStopAt?: string;
  lastError?: string;
  /** Child PID if a start command produced one. */
  childPid?: number;
  /** Count of successful starts. */
  startCount?: number;
  /** Count of successful stops. */
  stopCount?: number;
  /** Count of failed start attempts. */
  startFailureCount?: number;
  /** ISO timestamp of last successful health check. */
  lastHealthyAt?: string;
  /** Name of the currently loaded model, if known. */
  currentModel?: string | null;
  /** Configured model entries from RELAY_MODEL_MAP. */
  modelEntries?: string[];
};

const DEFAULT_IDLE_SHUTDOWN_MS = 600_000;
const DEFAULT_START_TIMEOUT_MS = 120_000;

export class ModelLifecycle {
  private readonly config: AppConfig;
  private readonly hooks: LifecycleHooks;
  private activeJobs = 0;
  private pendingJobs = 0;
  private lastIdleAt: number;
  private idleTimer: unknown = null;
  private idleScheduledAt: number | null = null;
  private modelAvailable: boolean | null = null;
  private lastStartAt: string | undefined;
  private lastStopAt: string | undefined;
  private lastError: string | undefined;
  private startInFlight: Promise<ModelAvailability> | null = null;
  private child: ChildProcess | null = null;
  private childPid: number | undefined;
  private startCount = 0;
  private stopCount = 0;
  private startFailureCount = 0;
  private lastHealthyAt: string | undefined;
  private state: LifecycleState = 'idle';
  private ringBuffer: Buffer = Buffer.alloc(0);
  private readonly ringBufferMaxBytes: number;
  private circuitBreakerFailures: number[] = [];
  private circuitBreakerCooldownUntil: number | null = null;
  private shutdownConfirmTimeoutMs: number;
  /** Name of the currently loaded model, if managed by modelEntries. */
  private currentModelName: string | null = null;
  /** Guard to serialize model switches. */
  private switchInFlight: Promise<ModelAvailability> | null = null;
  /** Target model name for the in-progress switch (null when no switch active). */
  private switchTargetModel: string | null = null;

  constructor(config: AppConfig, hooks: LifecycleHooks = {}) {
    this.config = config;
    this.hooks = hooks;
    this.lastIdleAt = this.now();
    this.ringBufferMaxBytes = config.lifecycleRingBufferBytes ?? 65536;
    this.shutdownConfirmTimeoutMs = config.lifecycleShutdownConfirmTimeoutMs ?? 10_000;
  }

  /**
   * Verify the upstream is reachable. When lifecycle is enabled and the upstream
   * is unavailable, attempt to start it via the configured start command and
   * poll the health endpoint until the start timeout elapses.
   *
   * If `modelName` is provided and `modelEntries` is configured, the lifecycle
   * will automatically switch to the requested model if necessary (stopping the
   * current one and starting the new one). Requests that arrive during a switch
   * are queued transparently.
   */
  async ensureModelAvailable(modelName?: string, externalSignal?: AbortSignal): Promise<ModelAvailability> {
    // If model switching is configured and a model name is given, handle it.
    if (modelName && this.config.modelEntries) {
      return this.ensureModelWithSwitching(modelName, externalSignal);
    }

    const reachable = await this.probe(externalSignal);
    if (reachable) {
      this.modelAvailable = true;
      this.state = 'running';
      this.lastError = undefined;
      this.lastHealthyAt = new Date().toISOString();
      return { ok: true };
    }

    if (!this.config.lazyModelEnabled) {
      this.modelAvailable = false;
      this.state = 'idle';
      return {
        ok: false,
        code: 'model_unavailable',
        message: 'Upstream model server is unavailable and lazy lifecycle is disabled.',
      };
    }

    // Check circuit breaker.
    if (this.circuitBreakerCooldownUntil !== null && this.now() < this.circuitBreakerCooldownUntil) {
      const remaining = Math.ceil((this.circuitBreakerCooldownUntil - this.now()) / 1000);
      return {
        ok: false,
        code: 'model_start_disabled',
        message: `Start attempts are temporarily disabled after repeated failures. Retry in ${remaining}s.`,
      };
    }

    // Reject overlapping starts.
    if (this.state === 'starting') {
      return {
        ok: false,
        code: 'model_start_in_progress',
        message: 'A model start is already in progress.',
      };
    }

    if (!this.config.llamaStartCommand && !this.config.modelStartArgv) {
      this.modelAvailable = false;
      this.state = 'idle';
      const message =
        'Lazy lifecycle is enabled but no start command is configured. Configure RELAY_MODEL_START_COMMAND or RELAY_MODEL_START_ARGV to launch the upstream model server.';
      this.lastError = message;
      return { ok: false, code: 'model_start_not_configured', message };
    }

    // Serialize concurrent start attempts.
    if (!this.startInFlight) {
      this.state = 'starting';
      this.startInFlight = this.startAndWait(undefined, externalSignal).finally(() => {
        this.startInFlight = null;
      });
    }
    return this.startInFlight;
  }

  /** Handle model switching through modelEntries config. */
  private async ensureModelWithSwitching(modelName: string, externalSignal?: AbortSignal): Promise<ModelAvailability> {
    const entries = this.config.modelEntries!;
    let entry: ModelEntry | undefined = entries[modelName];
    if (!entry) {
      const lower = modelName.toLowerCase();
      const match = Object.entries(entries).find(([k]) => k.toLowerCase() === lower);
      if (match) {
        modelName = match[0];
        entry = match[1];
      }
    }

    if (!entry) {
      // Unknown model — if something is running, allow it through.
      const reachable = await this.probe(externalSignal);
      if (reachable) {
        this.modelAvailable = true;
        this.state = 'running';
        return { ok: true };
      }
      return {
        ok: false,
        code: 'model_unknown',
        message: `Unknown model "${modelName}". Known models: ${Object.keys(entries).join(', ')}`,
      };
    }

    // Fast path: requested model is already loaded and healthy.
    if (this.currentModelName === modelName && this.modelAvailable && this.state === 'running') {
      const reachable = await this.probe(externalSignal);
      if (reachable) {
        this.lastHealthyAt = new Date().toISOString();
        return { ok: true };
      }
      this.modelAvailable = false;
      this.state = 'idle';
    }

    // If a different model is running, shut it down first.
    if (this.currentModelName !== null && this.currentModelName !== modelName) {
      if (this.switchInFlight) {
        return this.switchInFlight;
      }
      this.switchInFlight = this.switchModel(modelName, entry, externalSignal).finally(() => {
        this.switchInFlight = null;
        this.switchTargetModel = null;
      });
      return this.switchInFlight;
    }

    // If a model switch is in progress:
    // - Requests for the switch TARGET model wait for the switch to complete.
    // - Requests for any OTHER model get a retryable error to avoid
    //   ping-pong switching (switch A->B completes, request for A triggers
    //   switch B->A, killing the in-progress model load).
    if (this.switchInFlight) {
      if (this.switchTargetModel === modelName) {
        try {
          await this.switchInFlight;
        } catch {
          // switch failed — fall through to normal start logic
        }
        return this.ensureModelWithSwitching(modelName, externalSignal);
      }
      return {
        ok: false,
        code: 'model_switching',
        message: `Model switch to ${this.switchTargetModel} is in progress. Retry switching to ${modelName} after the switch completes.`,
      };
    }

    // Same model (or no model loaded) — start or restart it.
    // If no model is tracked but upstream is reachable, kill the stale server
    // first (e.g. leftover from a previous relay instance on same port).
    if (this.currentModelName === null) {
      const staleReachable = await this.probe(externalSignal);
      if (staleReachable) {
        this.log('info', 'lifecycle: stale upstream detected, killing before first start');
        await this.killCurrentModel();
        // Wait for the port to free up.
        const deadline = this.now() + 10_000;
        while (this.now() < deadline) {
          const stillUp = await this.probe(externalSignal);
          if (!stillUp) break;
          await sleep(500);
        }
      }
    }
    if (this.startInFlight) {
      return this.startInFlight;
    }
    this.state = 'starting';
    this.log('info', 'starting model', { model: modelName });
    this.startInFlight = this.startAndWait(entry, externalSignal).finally(() => {
      this.startInFlight = null;
    });
    const result = await this.startInFlight;
    if (result.ok) {
      this.currentModelName = modelName;
    }
    return result;
  }

  /** Shut down current model and start the requested one. */
  private async switchModel(modelName: string, entry: ModelEntry, externalSignal?: AbortSignal): Promise<ModelAvailability> {
    this.log('info', 'switching model', { from: this.currentModelName, to: modelName });
    this.switchTargetModel = modelName;
    this.state = 'stopping';

    try {
      await this.killCurrentModel();
    } catch (error) {
      this.log('warn', 'error during model stop', { error: error instanceof Error ? error.message : String(error) });
    }

    this.currentModelName = null;
    this.modelAvailable = false;
    this.stopCount += 1;
    this.lastStopAt = new Date().toISOString();
    this.child = null;
    this.childPid = undefined;

    const confirmed = await this.confirmShutdown();
    if (!confirmed) {
      this.log('warn', 'shutdown confirmation timed out, proceeding anyway');
    }

    this.state = 'starting';
    this.lastError = undefined;
    const result = await this.startAndWait(entry, externalSignal);
    if (result.ok) {
      this.currentModelName = modelName;
    }
    return result;
  }

  /** Kill the currently running model process. */
  private async killCurrentModel(): Promise<void> {
    if (this.child && typeof (this.child as any).kill === 'function') {
      this.log('info', 'killing current model process', { pid: this.childPid });
      try {
        (this.child as any).kill('SIGTERM');
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 3000);
          if (typeof this.child!.on === 'function') {
            this.child!.once('exit', () => { clearTimeout(timeout); resolve(); });
          } else {
            setTimeout(() => resolve(), 100);
          }
        });
      } catch {
        // already dead
      }
    }

    // Fallback: kill any remaining llama-server processes.
    try {
      const proc = spawn('pkill', ['-f', 'llama-server'], {
        detached: true,
        stdio: 'ignore',
      });
      proc.unref();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch {
      // pkill may not exist or may fail; that's fine.
    }
  }

  /**
   * Signal that a job has been accepted into the queue. Cancels any pending
   * idle-shutdown timer immediately so the model is not torn down while work
   * is waiting.
   */
  markJobEnqueued(): void {
    this.pendingJobs += 1;
    this.cancelIdleShutdown('job enqueued');
  }

  markJobDequeued(): void {
    this.pendingJobs = Math.max(0, this.pendingJobs - 1);
  }

  markJobStarted(): void {
    this.activeJobs += 1;
    this.cancelIdleShutdown('job started');
  }

  markJobFinished(): void {
    this.activeJobs = Math.max(0, this.activeJobs - 1);
    if (this.activeJobs === 0) this.lastIdleAt = this.now();
  }

  /**
   * Schedule a deferred shutdown if everything is idle. The shutdown only fires
   * if no new jobs have arrived by the time the timer elapses.
   */
  maybeShutdownWhenIdle(): { attempted: boolean; reason: string } {
    if (!this.config.lazyModelEnabled) return { attempted: false, reason: 'lazy lifecycle disabled' };
    if (this.activeJobs > 0) return { attempted: false, reason: 'jobs are active' };
    if (this.pendingJobs > 0) return { attempted: false, reason: 'jobs are queued' };
    if (!this.config.llamaStopCommand && !this.config.modelShutdownArgv)
      return { attempted: false, reason: 'shutdown command is not configured' };
    if (this.state === 'stopping') return { attempted: false, reason: 'already stopping' };
    const idleMs = this.config.llamaIdleShutdownMs ?? DEFAULT_IDLE_SHUTDOWN_MS;
    if (this.idleTimer) {
      return { attempted: false, reason: 'idle shutdown already scheduled' };
    }
    this.idleScheduledAt = this.now();
    const timer = (this.hooks.setTimer ?? setTimeout)(() => {
      this.idleTimer = null;
      this.idleScheduledAt = null;
      void this.attemptShutdown();
    }, idleMs);
    this.idleTimer = timer;
    const maybeUnref = (timer as { unref?: () => void } | null)?.unref;
    if (typeof maybeUnref === 'function') {
      maybeUnref.call(timer);
    }
    return { attempted: true, reason: 'idle shutdown scheduled' };
  }

  /**
   * Force an immediate shutdown. Used by POST /relay/lifecycle/shutdown.
   * Returns { ok: true } if shutdown was initiated, or { ok: false, reason } if
   * not possible.
   */
  forceShutdown(): { ok: boolean; reason?: string } {
    if (!this.config.llamaStopCommand && !this.config.modelShutdownArgv) {
      return { ok: false, reason: 'no shutdown command configured' };
    }
    if (this.state === 'stopping') {
      return { ok: false, reason: 'already stopping' };
    }
    void this.attemptShutdown();
    return { ok: true };
  }

  getLifecycleStatus(): LifecycleStatus {
    return {
      enabled: Boolean(this.config.lazyModelEnabled),
      state: this.state,
      modelAvailable: this.modelAvailable,
      activeJobs: this.activeJobs,
      idleShutdownScheduled: this.idleTimer !== null,
      idleShutdownMs: this.config.llamaIdleShutdownMs ?? DEFAULT_IDLE_SHUTDOWN_MS,
      startCommandConfigured: Boolean(this.config.llamaStartCommand) || Boolean(this.config.modelStartArgv),
      shutdownCommandConfigured: Boolean(this.config.llamaStopCommand) || Boolean(this.config.modelShutdownArgv),
      healthUrlConfigured: Boolean(this.config.modelHealthUrl),
      startTimeoutMs: this.config.modelStartTimeoutMs ?? DEFAULT_START_TIMEOUT_MS,
      lastStartAt: this.lastStartAt,
      lastStopAt: this.lastStopAt,
      lastError: this.lastError,
      childPid: this.childPid,
      startCount: this.startCount,
      stopCount: this.stopCount,
      startFailureCount: this.startFailureCount,
      lastHealthyAt: this.lastHealthyAt,
      currentModel: this.currentModelName,
      modelEntries: this.config.modelEntries ? Object.keys(this.config.modelEntries) : undefined,
    };
  }

  /** Back-compat alias used by older internal callers. */
  status(): Record<string, unknown> {
    return this.getLifecycleStatus();
  }

  // --- internals -----------------------------------------------------------

  private cancelIdleShutdown(reason: string): void {
    if (!this.idleTimer) return;
    const clear = this.hooks.clearTimer ?? ((h: unknown) => clearTimeout(h as NodeJS.Timeout));
    clear(this.idleTimer);
    this.idleTimer = null;
    this.idleScheduledAt = null;
    this.log('info', 'idle shutdown cancelled', { reason });
  }

  private async attemptShutdown(): Promise<void> {
    if (this.activeJobs > 0 || this.pendingJobs > 0) return;
    if (this.state === 'stopping') return;
    if (!this.config.llamaStopCommand && !this.config.modelShutdownArgv) return;

    this.state = 'stopping';
    this.log('info', 'lifecycle shutdown command dispatched');
    try {
      const proc = this.runCommand(
        this.config.llamaStopCommand ?? '',
        this.hooks.spawnProcess ? undefined : this.config.modelShutdownArgv,
      );
      if (!proc) {
        if (!this.hooks.spawnProcess) {
          this.log('warn', 'shutdown command produced no child process');
        }
      } else {
        this.child = proc;
        this.childPid = proc.pid;
        this.killChildOnTimeout(proc, this.shutdownConfirmTimeoutMs);
        const exitCode = await new Promise<number | null>((resolve) => {
          if (typeof proc.on === 'function') {
            proc.on('exit', (code) => resolve(code));
          } else {
            resolve(null); // mock/no process — no exit code
          }
        });
        this.log('info', 'lifecycle shutdown process exited', { exitCode });
      }

      this.lastStopAt = new Date().toISOString();
      this.modelAvailable = false;
      this.lastError = undefined; // clear on successful shutdown

      // Post-shutdown health confirmation: poll until health goes red.
      const confirmed = await this.confirmShutdown();
      if (confirmed) {
        this.state = 'idle';
        this.stopCount += 1;
        this.child = null;
        this.childPid = undefined;
        this.log('info', 'lifecycle shutdown confirmed (health went red)');
      } else {
        this.state = 'running';
        this.modelAvailable = true;
        this.log('warn', 'lifecycle shutdown confirmation timed out — model still appears healthy');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = `shutdown failed: ${redact(message)}`;
      this.log('error', 'lifecycle shutdown failed', { error: redact(message) });
      this.state = 'failed';
    }
  }

  private async confirmShutdown(): Promise<boolean> {
    const deadline = this.now() + this.shutdownConfirmTimeoutMs;
    while (this.now() < deadline) {
      const ok = await this.probe();
      if (!ok) return true;
      await sleep(200);
    }
    return false;
  }

  private killChildOnTimeout(proc: ChildProcess, timeoutMs: number): void {
    const timer = setTimeout(() => {
      if (typeof (proc as any).killed === 'boolean' && (proc as any).killed) return;
      this.log('warn', 'killing shutdown process that exceeded timeout', { pid: proc.pid, timeoutMs });
      if (typeof (proc as any).kill === 'function') {
        (proc as any).kill('SIGKILL');
      }
    }, timeoutMs);
    timer.unref();
  }

  private async startAndWait(entry?: ModelEntry, externalSignal?: AbortSignal): Promise<ModelAvailability> {
    const startCmd = entry?.cmd ?? this.config.llamaStartCommand;
    const argv = !entry ? this.config.modelStartArgv : undefined;
    const timeoutMs = (entry?.timeout_sec != null ? entry.timeout_sec * 1000 : undefined)
      ?? this.config.modelStartTimeoutMs
      ?? DEFAULT_START_TIMEOUT_MS;
    const healthUrl = entry?.health_url ?? this.config.modelHealthUrl;

    if (!startCmd && !argv) {
      this.state = 'idle';
      return { ok: false, code: 'model_start_not_configured', message: 'start command missing' };
    }
    this.log('info', 'lifecycle start command dispatched', { cmd: startCmd ? '(script)' : 'argv' });
    try {
      const proc = this.runCommand(startCmd ?? '', entry ? undefined : argv);
      if (!proc) {
        const message = 'start command did not produce a child process';
        this.lastError = message;
        this.state = 'failed';
        this.recordStartFailure();
        return { ok: false, code: 'model_start_failed', message };
      }
      this.child = proc;
      this.childPid = proc.pid;
      this.startCount += 1;

      // Capture child stdio to ring buffer.
      this.captureStdio(proc);

      if (typeof proc.once === 'function') {
        proc.once('error', (err) => {
          this.lastError = `start failed: ${redact(err.message)}`;
          this.log('error', 'lifecycle start process error', { error: redact(err.message) });
        });
      }
      if (typeof proc.on === 'function') {
        proc.on('exit', (code) => {
          this.log('info', 'lifecycle start process exited', { pid: proc.pid, exitCode: code });
          if (this.state === 'starting' || this.state === 'running') {
            const prev = this.state;
            this.state = 'failed';
            this.lastError = `process exited unexpectedly with code ${code ?? 'null'}`;
            this.log('error', 'lifecycle child process exited unexpectedly', { prevState: prev, exitCode: code });
          }
        });
      }

      this.lastStartAt = new Date().toISOString();
      this.lastError = undefined; // clear previous errors
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = `start failed: ${redact(message)}`;
      this.state = 'failed';
      this.recordStartFailure();
      return { ok: false, code: 'model_start_failed', message: this.lastError };
    }

    const startTimeoutMs = timeoutMs;
    const deadline = this.now() + startTimeoutMs;
    while (this.now() < deadline) {
      if (externalSignal?.aborted) {
        await this.killCurrentModel();
        this.state = 'idle';
        return { ok: false, code: 'model_start_aborted', message: 'start aborted by client' };
      }
      const ok = healthUrl
        ? await this.probeUrl(healthUrl, externalSignal)
        : await this.probe(externalSignal);
      if (ok) {
        this.modelAvailable = true;
        this.state = 'running';
        this.lastHealthyAt = new Date().toISOString();
        this.circuitBreakerFailures = []; // reset on success
        this.circuitBreakerCooldownUntil = null;
        return { ok: true };
      }
      await sleep(500);
    }
    const message = `model did not become healthy within ${startTimeoutMs}ms`;
    this.lastError = message;
    this.modelAvailable = false;
    this.state = 'failed';
    this.recordStartFailure();
    return { ok: false, code: 'model_start_timeout', message };
  }

  private recordStartFailure(): void {
    this.startFailureCount += 1;
    const now = this.now();
    this.circuitBreakerFailures.push(now);

    // Prune failures outside the window.
    const windowMs = this.config.lifecycleCircuitBreakerWindowMs ?? 300_000;
    this.circuitBreakerFailures = this.circuitBreakerFailures.filter((t) => now - t <= windowMs);

    // Check threshold.
    const threshold = this.config.lifecycleCircuitBreakerThreshold ?? 3;
    if (this.circuitBreakerFailures.length >= threshold) {
      const cooldownMs = this.config.lifecycleCircuitBreakerCooldownMs ?? 120_000;
      this.circuitBreakerCooldownUntil = now + cooldownMs;
      this.log('warn', 'circuit breaker activated', {
        failures: this.circuitBreakerFailures.length,
        cooldownMs,
      });
    }
  }

  private captureStdio(proc: ChildProcess): void {
    const append = (chunk: Buffer) => {
      this.ringBuffer = Buffer.concat([this.ringBuffer, chunk]);
      if (this.ringBuffer.length > this.ringBufferMaxBytes) {
        this.ringBuffer = this.ringBuffer.slice(this.ringBuffer.length - this.ringBufferMaxBytes);
      }
    };
    proc.stdout?.on('data', (chunk: Buffer) => append(chunk));
    proc.stderr?.on('data', (chunk: Buffer) => append(chunk));
  }

  private async probe(externalSignal?: AbortSignal): Promise<boolean> {
    if (this.hooks.probe) {
      try {
        return await this.hooks.probe(externalSignal);
      } catch {
        return false;
      }
    }
    return defaultProbe(this.config, undefined, externalSignal);
  }

  /** Probe a specific health URL. */
  private async probeUrl(healthUrl: string, externalSignal?: AbortSignal): Promise<boolean> {
    if (this.hooks.probe) {
      try {
        return await this.hooks.probe(externalSignal);
      } catch {
        return false;
      }
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.probeTimeoutMs);
    const signal = externalSignal
      ? AbortSignal.any([controller.signal, externalSignal])
      : controller.signal;
    try {
      const res = await fetch(healthUrl, { signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private runCommand(command: string, argv?: string[]): ChildProcess | null {
    if (this.hooks.spawnProcess) {
      return this.hooks.spawnProcess(command, argv);
    }
    // Prefer argv form when available (more secure, avoids shell injection).
    if (argv && argv.length > 0) {
      const [cmd, ...args] = argv;
      const child = spawn(cmd, args, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      child.unref();
      return child;
    }
    // Fall back to shell string form.
    const child = spawn(command, {
      shell: true,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    child.unref();
    return child;
  }

  private now(): number {
    return this.hooks.now ? this.hooks.now() : Date.now();
  }

  private log(level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>): void {
    if (this.hooks.log) this.hooks.log(level, msg, meta);
  }
}

async function defaultProbe(config: AppConfig, healthUrlOverride?: string, externalSignal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.probeTimeoutMs);
  const signal = externalSignal ? AbortSignal.any([controller.signal, externalSignal]) : controller.signal;
  try {
    if (healthUrlOverride ?? config.modelHealthUrl) {
      try {
        const res = await fetch((healthUrlOverride ?? config.modelHealthUrl)!, { signal });
        if (res.ok) return true;
      } catch {
        return false;
      }
    }
    try {
      const health = await fetch(upstreamUrl(config.upstreamBaseUrl, '/health'), { signal });
      if (health.ok) return true;
    } catch {
      // try /v1/models below
    }
    try {
      const models = await fetch(upstreamUrl(config.upstreamBaseUrl, '/v1/models'), { signal });
      return models.ok;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(timeout);
  }
}

function upstreamUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/v1') && path.startsWith('/v1/')) {
    return `${cleanBase}${path.slice('/v1'.length)}`;
  }
  if (cleanBase.endsWith('/v1') && path === '/health') {
    return `${cleanBase.slice(0, -3)}/health`;
  }
  return `${cleanBase}${path}`;
}

/**
 * Best-effort redaction for error/log strings. Strips obvious secret-looking
 * fragments before they reach logs or the status endpoint. The lifecycle
 * subsystem never logs the raw start/shutdown command verbatim.
 */
export function redact(value: string): string {
  return value
    .replace(/(api[_-]?key|token|secret|password|bearer)\s*[:=]\s*['\"]?[A-Za-z0-9._\-+/=]+/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REDACTED]');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
