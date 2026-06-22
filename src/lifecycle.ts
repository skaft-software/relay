/**
 * ModelLifecycle — manages model processes for local llama.cpp backends.
 *
 * v2 changes:
 *  - Multi-process bookkeeping: activeProcesses Map tracks running models
 *  - Eager switching only: kill old model before starting the new one
 *  - Port allocation: each model gets a dedicated port from modelPortBase
 *  - Idle shutdown: per-model idle timers, cascading (least-recently-used first)
 */

import { execFileSync, spawn, type ChildProcess } from 'node:child_process';

import type { AppConfig, ModelEntry } from './config.ts';

export type ModelAvailability = {
  ok: boolean;
  code?: string;
  message?: string;
  /** Port the model is running on (for upstream routing). */
  port?: number;
};

export type LifecycleHooks = {
  log?: (level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) => void;
  spawnProcess?: (command: string, argv?: string[]) => ChildProcess | null;
  probe?: (port?: number, signal?: AbortSignal) => Promise<boolean>;
  now?: () => number;
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
  childPid?: number;
  startCount?: number;
  stopCount?: number;
  startFailureCount?: number;
  lastHealthyAt?: string;
  currentModel?: string | null;
  modelEntries?: string[];
  /** Model currently being loaded (name of the target of an in-progress switch). */
  loadingModel?: string | null;
  /** Active model processes (v2: multi-model support). */
  activeModels?: Array<{ name: string; port: number; healthy: boolean; pid?: number }>;
};

// ─── Model process tracking ─────────────────────────────────────────────

interface ModelProcess {
  name: string;
  port: number;
  child: ChildProcess;
  pid?: number;
  healthy: boolean;
  startedAt: string;
  lastUsedAt: number;
  /** Whether this model should be kept warm (not killed during normal idle shutdown). */
  keepWarm: boolean;
  entry?: ModelEntry;
  ringBuffer: Buffer;
  startCount: number;
  startFailureCount: number;
  circuitBreakerFailures: number[];
  circuitBreakerCooldownUntil: number | null;
  /** True once the child process has exited (before it is removed from activeProcesses). */
  exited: boolean;
  exitCode: number | null;
  exitSignal: string | null;
}

const DEFAULT_IDLE_SHUTDOWN_MS = 600_000;
const DEFAULT_START_TIMEOUT_MS = 120_000;
const DEFAULT_SWITCH_GRACE_MS = 300_000; // 5 min grace period for old model after switch

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
  private startCount = 0;
  private stopCount = 0;
  private startFailureCount = 0;
  private lastHealthyAt: string | undefined;
  private state: LifecycleState = 'idle';
  private ringBuffer: Buffer = Buffer.alloc(0);
  private readonly ringBufferMaxBytes: number;

  // ── Legacy circuit breaker (instance-level for non-modelEntries path) ──
  private legacyCircuitBreakerFailures: number[] = [];
  private legacyCircuitBreakerCooldownUntil: number | null = null;

  // ── v2: Multi-model support ──────────────────────────────────────────

  /** All active model processes, keyed by model name. */
  private activeProcesses = new Map<string, ModelProcess>();
  /** Currently active model (the one serving requests). */
  private currentModelName: string | null = null;
  /** Guard to serialize model switches. */
  private switchInFlight: Promise<ModelAvailability> | null = null;
  /** Target model name for the in-progress switch. */
  private switchTargetModel: string | null = null;
  /** Next available port for dynamic allocation. */
  private nextPort: number;
  /** Session ID currently associated with each loaded model. */
  private modelSessions = new Map<string, string>();
  constructor(config: AppConfig, hooks: LifecycleHooks = {}) {
    this.config = config;
    this.hooks = hooks;
    this.lastIdleAt = this.now();
    this.ringBufferMaxBytes = config.lifecycleRingBufferBytes ?? 65536;
    this.nextPort = config.modelPortBase ?? 8081;
    // ── Startup orphan cleanup ─────────────────────────────────────
    // Kill any llama-server processes from previous Relay instances
    // that survived as init orphans (detached spawn). These would
    // otherwise consume VRAM and collide with our port allocations.
    // Skip when a spawnProcess hook is provided (test harness) — the
    // hook owns process lifecycle and fuser -k would be destructive.
    if (config.lazyModelEnabled && !hooks.spawnProcess) {
      try {
        const portBase = config.modelPortBase ?? 8081;
        const portArgs: string[] = [];
        for (let p = portBase - 1; p < portBase + 10; p++) {
          portArgs.push(`${p}/tcp`);
        }
        execFileSync('fuser', ['-k', ...portArgs], { timeout: 3000, stdio: 'ignore' });
      } catch (error) {
        if (isFuserNoMatch(error)) return;
        // Best-effort — orphan cleanup failure shouldn't block startup.
        // Log at warn so permission/missing-binary issues are visible.
        if (this.hooks.log) this.hooks.log('warn', 'startup orphan cleanup via fuser failed', {});
      }
    }
  }

  // ── Public: upstream URL resolution ──────────────────────────────────

  /**
   * Get the upstream base URL for a given model.
   * Returns the model's dedicated port URL if it's running,
   * falls back to config.upstreamBaseUrl otherwise.
   */
  getUpstreamUrl(modelName?: string): string {
    if (modelName) {
      // Resolve via modelEntries (case-insensitive)
      const entries = this.config.modelEntries;
      if (entries) {
        const lower = modelName.toLowerCase();
        const match = Object.entries(entries).find(([k]) => k.toLowerCase() === lower);
        if (match) modelName = match[0];
      }
      const proc = this.activeProcesses.get(modelName);
      if (proc?.healthy) {
        return `http://127.0.0.1:${proc.port}/v1`;
      }
    }
    return this.config.upstreamBaseUrl;
  }

  /**
   * Get the port for a specific model, or undefined if not running.
   */
  getModelPort(modelName: string): number | undefined {
    return this.activeProcesses.get(modelName)?.port;
  }

  // ── Public: ensure model available ───────────────────────────────────

  async ensureModelAvailable(modelName?: string, externalSignal?: AbortSignal, sessionId?: string): Promise<ModelAvailability> {
    if (modelName && this.config.modelEntries) {
      return this.ensureModelWithSwitching(modelName, externalSignal, sessionId);
    }

    const reachable = await this.probeDefault(externalSignal);
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

    if (!this.config.llamaStartCommand && !this.config.modelStartArgv) {
      this.modelAvailable = false;
      this.state = 'idle';
      const message = 'Lazy lifecycle is enabled but no start command is configured.';
      this.lastError = message;
      return { ok: false, code: 'model_start_not_configured', message };
    }

    // Check legacy circuit breaker cooldown
    if (this.checkCircuitBreaker()) {
      return { ok: false, code: 'model_start_disabled', message: 'Too many recent start failures. Circuit breaker active.' };
    }

    // Reject overlapping starts — if a start is already in-flight, don't wait for it
    if (this.startInFlight) {
      return { ok: false, code: 'model_start_in_progress', message: 'A model start is already in progress' };
    }

    this.state = 'starting';
    this.startInFlight = this.startAndWait(undefined, externalSignal).finally(() => {
      this.startInFlight = null;
    });
    return this.startInFlight;
  }

  // ── v2: Model switching ─────────────────────────────────────────────

  private async ensureModelWithSwitching(modelName: string, externalSignal?: AbortSignal, sessionId?: string): Promise<ModelAvailability> {
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
      const reachable = await this.probeDefault(externalSignal);
      if (reachable) {
        this.modelAvailable = true;
        this.state = 'running';
        return { ok: true };
      }
      return {
        ok: false,
        code: 'model_unknown',
        message: `Unknown model "${modelName}". Known: ${Object.keys(entries).join(', ')}`,
      };
    }

    // Fast path: requested model is already loaded and healthy
    const existing = this.activeProcesses.get(modelName);
    if (existing?.healthy) {
      const prevSession = this.modelSessions.get(modelName);
      if (sessionId && prevSession && prevSession !== sessionId) {
        this.log('info', 'session changed, restarting model to clear context', {
          model: modelName,
          fromSession: prevSession,
          toSession: sessionId,
        });
        return this.eagerSwitch(modelName, entry, externalSignal, sessionId);
      }
      existing.lastUsedAt = this.now();
      this.currentModelName = modelName;
      this.modelAvailable = true;
      this.state = 'running';
      this.lastHealthyAt = new Date().toISOString();

      return { ok: true, port: existing.port };
    }

    // If a switch is already in progress for this model, wait for it
    if (this.switchInFlight && this.switchTargetModel === modelName) {
      this.log('info', 'waiting for in-progress switch', { model: modelName });
      try {
        return await this.switchInFlight;
      } catch {
        // switch failed — fall through to start logic
      }
    }

    // If a different model switch is in progress, reject to avoid ping-pong
    if (this.switchInFlight && this.switchTargetModel !== modelName) {
      return {
        ok: false,
        code: 'model_switching',
        message: `Switch to ${this.switchTargetModel} in progress. Retry ${modelName} after.`,
      };
    }

    return this.eagerSwitch(modelName, entry, externalSignal, sessionId);
  }

  /**
   * Eager switch (legacy behavior): kill old model, then start new one.
   */
  private async eagerSwitch(
    modelName: string,
    entry: ModelEntry,
    externalSignal?: AbortSignal,
    sessionId?: string,
  ): Promise<ModelAvailability> {
    this.log('info', 'eager switch: killing old model first', {
      from: this.currentModelName,
      to: modelName,
    });

    this.switchInFlight = (async (): Promise<ModelAvailability> => {
      this.switchTargetModel = modelName;
      this.state = 'stopping';

      try {
        // Kill all running models
        await this.killAllProcesses();
        this.currentModelName = null;
        this.modelAvailable = false;
        this.stopCount += this.activeProcesses.size || 1;

        this.state = 'starting';
        const port = this.allocatePort(modelName);
        const proc = await this.startModelProcess(modelName, entry, port);
        if (!proc) {
          this.state = 'failed';
          return { ok: false, code: 'model_start_failed', message: `Failed to start ${modelName}` };
        }

        const startedProc = this.activeProcesses.get(modelName);
        const healthy = await this.waitForHealthy(port,
          entry.timeout_sec ? entry.timeout_sec * 1000 : (this.config.modelStartTimeoutMs ?? DEFAULT_START_TIMEOUT_MS),
          startedProc ?? undefined,
          externalSignal,
        );

        if (!healthy) {
          await this.killProcess(modelName);
          this.state = 'failed';
          return { ok: false, code: 'model_start_timeout', message: `${modelName} unhealthy` };
        }

        const newProc = this.activeProcesses.get(modelName);
        if (newProc) newProc.healthy = true;

        this.currentModelName = modelName;
        this.modelAvailable = true;
        this.state = 'running';
        this.lastHealthyAt = new Date().toISOString();
        this.startCount += 1;
        if (sessionId) {
          this.modelSessions.set(modelName, sessionId);
        }

        return { ok: true, port };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.lastError = message;
        this.state = 'failed';
        return { ok: false, code: 'model_switch_failed', message };
      }
    })();

    try {
      return await this.switchInFlight;
    } finally {
      this.switchInFlight = null;
      this.switchTargetModel = null;
    }
  }

  // ── Process management ───────────────────────────────────────────────

  private allocatePort(modelName: string): number {
    // Use fixed port from model entry if configured
    const entry = this.config.modelEntries?.[modelName];
    if (entry?.port) return entry.port;

    // Check if this model already has a port assigned
    const existing = this.activeProcesses.get(modelName);
    if (existing) return existing.port;

    // Allocate next available port
    const port = this.nextPort++;
    // Ensure we don't collide with existing processes
    for (const proc of this.activeProcesses.values()) {
      if (proc.port === port) return this.allocatePort(modelName);
    }
    // Kill any orphaned process from a previous Relay instance on this port.
    // Detached child processes survive restarts as init orphans — fuser -k
    // cleans them up before we bind.
    try {
      execFileSync('fuser', ['-k', `${port}/tcp`], { timeout: 2000, stdio: 'ignore' });
    } catch (error) {
      if (isFuserNoMatch(error)) return port;
      // Best-effort — orphan cleanup failure shouldn't block startup.
      // Log at warn so permission/missing-binary issues are visible.
      if (this.hooks.log) this.hooks.log('warn', 'per-port orphan cleanup via fuser failed', { port });
    }
    return port;
  }

  private async startModelProcess(
    modelName: string,
    entry: ModelEntry,
    port: number,
  ): Promise<ModelProcess | null> {
    const startCmd = entry.cmd ?? this.config.llamaStartCommand;
    const argv = !entry.cmd ? this.config.modelStartArgv : undefined;

    if (!startCmd && !argv) {
      this.log('error', 'no start command for model', { model: modelName });
      return null;
    }

    // Inject port into command/args
    const resolvedCmd = startCmd
      ? startCmd.replace(/\$\{PORT\}/g, String(port)).replace(/\$\{MODEL\}/g, modelName)
      : '';
    const resolvedArgv = argv
      ? argv.map((a) => a.replace(/\$\{PORT\}/g, String(port)).replace(/\$\{MODEL\}/g, modelName))
      : undefined;

    this.log('info', 'starting model process', {
      model: modelName,
      port,
      cmd: resolvedCmd || '(argv)',
    });

    try {
      const child = this.runCommand(resolvedCmd, resolvedArgv, {
        LLAMA_PORT: String(port),
        MODEL: modelName,
      });
      if (!child) {
        this.log('error', 'start command produced no child process', { model: modelName });
        return null;
      }

      const proc: ModelProcess = {
        name: modelName,
        port,
        child,
        pid: child.pid,
        healthy: false,
        startedAt: new Date().toISOString(),
        lastUsedAt: this.now(),
        keepWarm: true,
        entry,
        ringBuffer: Buffer.alloc(0),
        startCount: 1,
        startFailureCount: 0,
        circuitBreakerFailures: [],
        circuitBreakerCooldownUntil: null,
        exited: false,
        exitCode: null,
        exitSignal: null,
      };

      this.captureProcessStdio(proc);

      if (typeof child.once === 'function') {
        child.once('error', (err) => {
          this.log('error', 'model process error', {
            model: modelName,
            error: redact(err.message),
          });
          proc.healthy = false;
        });
        child.on('exit', (code, signal) => {
          proc.exited = true;
          proc.exitCode = code ?? null;
          proc.exitSignal = signal ?? null;
          const tail = proc.ringBuffer.toString('utf-8').slice(-1024);
          this.log('info', 'model process exited', {
            model: modelName,
            pid: child.pid,
            exitCode: code,
            exitSignal: signal,
            stdioTail: tail ? redact(tail) : undefined,
          });
          proc.healthy = false;
          if (this.currentModelName === modelName) {
            this.modelAvailable = false;
            if (this.state === 'running') this.state = 'idle';
          }
        });
      }

      this.activeProcesses.set(modelName, proc);
      this.lastStartAt = new Date().toISOString();
      this.lastError = undefined;
      return proc;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = `start failed: ${redact(message)}`;
      this.log('error', 'model start exception', { model: modelName, error: redact(message) });
      return null;
    }
  }

  private async waitForHealthy(
    port: number,
    timeoutMs: number,
    proc?: ModelProcess,
    externalSignal?: AbortSignal,
  ): Promise<boolean> {
    const deadline = this.now() + timeoutMs;
    while (this.now() < deadline) {
      if (externalSignal?.aborted) return false;
      if (proc?.exited) {
        const tail = proc.ringBuffer.toString('utf-8').slice(-1024);
        this.lastError = `model process exited before becoming healthy (code=${proc.exitCode}, signal=${proc.exitSignal}); stdio tail: ${redact(tail)}`;
        this.log('error', 'model process exited during startup', {
          model: proc.name,
          exitCode: proc.exitCode,
          exitSignal: proc.exitSignal,
          stdioTail: tail ? redact(tail) : undefined,
        });
        return false;
      }
      const ok = await this.probePort(port, externalSignal);
      if (ok) return true;
      await sleep(500);
    }
    return false;
  }


  private async killProcess(modelName: string): Promise<void> {
    const proc = this.activeProcesses.get(modelName);
    if (!proc) return;

    const pid = proc.child.pid;
    const port = proc.port;
    this.log('info', 'killing model process', { model: modelName, pid, port });


    // Phase 1: Graceful SIGTERM
    if (typeof (proc.child as any).kill === 'function' && pid) {
      try {
        (proc.child as any).kill('SIGTERM');
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 3000);
          if (typeof proc.child.on === 'function') {
            proc.child.once('exit', () => { clearTimeout(timeout); resolve(); });
          } else {
            setTimeout(() => resolve(), 100);
          }
        });
      } catch {
        // already dead
      }
    }

    // Phase 2: Verify death + escalate via fuser on port
    // shell:true + detached:true leaves model process alive in its own
    // process group after the shell parent dies. fuser -k is the
    // ground truth for whether anything is still listening.
    if (port) {
      try {
        execFileSync('fuser', ['-k', '-TERM', port + '/tcp'], { timeout: 2000, stdio: 'ignore' });
      } catch { /* fuser may not exist in Docker */ }
      await sleep(500);
      try {
        execFileSync('fuser', ['-k', '-KILL', port + '/tcp'], { timeout: 2000, stdio: 'ignore' });
      } catch { /* best-effort */ }
    }
    // Also kill the process group (negative PID) as last resort
    if (pid) {
      try { process.kill(-pid, 'SIGKILL'); } catch { /* already dead */ }
    }

    this.activeProcesses.delete(modelName);
    this.stopCount += 1;
    this.lastStopAt = new Date().toISOString();
  }

  private async killAllProcesses(): Promise<void> {
    const names = [...this.activeProcesses.keys()];
    for (const name of names) {
      await this.killProcess(name);
    }
  }

  // ── Idle shutdown (v2: per-model) ────────────────────────────────────

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

  maybeShutdownWhenIdle(): { attempted: boolean; reason: string } {
    if (!this.config.lazyModelEnabled) return { attempted: false, reason: 'lazy lifecycle disabled' };
    if (this.activeJobs > 0) return { attempted: false, reason: 'jobs are active' };
    if (this.pendingJobs > 0) return { attempted: false, reason: 'jobs are queued' };
    if (this.state === 'stopping') return { attempted: false, reason: 'already stopping' };

    // v2: only kill non-warm models on idle; keep warm models alive
    const idleMs = this.config.llamaIdleShutdownMs ?? DEFAULT_IDLE_SHUTDOWN_MS;
    if (this.idleTimer) {
      return { attempted: false, reason: 'idle shutdown already scheduled' };
    }
    this.idleScheduledAt = this.now();
    const timer = (this.hooks.setTimer ?? setTimeout)(() => {
      this.idleTimer = null;
      this.idleScheduledAt = null;
      void this.shutdownIdleModels();
    }, idleMs);
    this.idleTimer = timer;
    const maybeUnref = (timer as { unref?: () => void } | null)?.unref;
    if (typeof maybeUnref === 'function') maybeUnref.call(timer);
    return { attempted: true, reason: 'idle shutdown scheduled' };
  }

  private async shutdownIdleModels(): Promise<void> {
    if (this.activeJobs > 0 || this.pendingJobs > 0) return;

    // Kill all non-current, non-warm v2 model processes
    for (const [name, proc] of this.activeProcesses) {
      if (name === this.currentModelName) continue;
      if (proc.keepWarm) continue;
      this.log('info', 'idle shutdown: killing inactive model', { model: name });
      await this.killProcess(name);
    }

    // If current model has no keepWarm flag (default model from legacy config), kill it too
    const current = this.currentModelName ? this.activeProcesses.get(this.currentModelName) : null;
    if (current && !current.keepWarm && !this.config.modelEntries) {
      await this.killProcess(this.currentModelName!);
      this.state = 'idle';
      this.modelAvailable = false;
      this.currentModelName = null;
      return;
    }

    // Legacy idle shutdown: run stop command if no v2 processes remain
    if (
      this.activeProcesses.size === 0 &&
      (this.config.llamaStopCommand || this.config.modelShutdownArgv)
    ) {
      this.log('info', 'idle shutdown: running legacy stop command');
      this.state = 'stopping';
      await this.attemptShutdown();
    }
  }

  forceShutdown(): { ok: boolean; reason?: string } {
    if (this.state === 'stopping') return { ok: false, reason: 'already stopping' };

    // Fast path: kill active v2 model processes
    if (this.activeProcesses.size > 0) {
      void this.killAllProcesses().then(() => {
        this.state = 'idle';
        this.modelAvailable = false;
        this.currentModelName = null;
      });
      return { ok: true };
    }

    // Legacy path: run stop command if configured
    if (this.config.llamaStopCommand || this.config.modelShutdownArgv) {
      this.state = 'stopping';
      void this.attemptShutdown();
      return { ok: true };
    }

    return { ok: false, reason: 'no shutdown command configured' };
  }

  getLifecycleStatus(): LifecycleStatus {
    const activeModels = [...this.activeProcesses.entries()].map(([name, proc]) => ({
      name,
      port: proc.port,
      healthy: proc.healthy,
      pid: proc.pid,
    }));

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
      childPid: [...this.activeProcesses.values()][0]?.pid,
      startCount: this.startCount,
      stopCount: this.stopCount,
      startFailureCount: this.startFailureCount,
      lastHealthyAt: this.lastHealthyAt,
      currentModel: this.currentModelName,
      loadingModel: this.switchTargetModel,
      modelEntries: this.config.modelEntries ? Object.keys(this.config.modelEntries) : undefined,
      activeModels: activeModels.length > 0 ? activeModels : undefined,
    };
  }

  status(): Record<string, unknown> {
    return this.getLifecycleStatus();
  }

  // ── Internal helpers ─────────────────────────────────────────────────

  private cancelIdleShutdown(reason: string): void {
    if (!this.idleTimer) return;
    this.clearTimer(this.idleTimer);
    this.idleTimer = null;
    this.idleScheduledAt = null;
  }

  // ── Legacy start/wait (for non-modelEntries path) ────────────────

  private async startAndWait(_entry: undefined, externalSignal?: AbortSignal): Promise<ModelAvailability> {
    const startCmd = this.config.llamaStartCommand;
    const argv = this.config.modelStartArgv;
    const timeoutMs = this.config.modelStartTimeoutMs ?? DEFAULT_START_TIMEOUT_MS;

    if (!startCmd && !argv) {
      this.state = 'idle';
      return { ok: false, code: 'model_start_not_configured', message: 'start command missing' };
    }

    this.log('info', 'lifecycle start command dispatched', { cmd: startCmd ? '(script)' : 'argv' });

    try {
      const proc = this.runCommand(startCmd ?? '', argv);
      if (!proc) {
        const message = 'start command did not produce a child process';
        this.lastError = message;
        this.state = 'failed';
        this.recordStartFailure();
        return { ok: false, code: 'model_start_failed', message };
      }

      this.startCount += 1;

      // Capture child stdio to instance-level ring buffer
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
            this.state = 'failed';
            this.lastError = `process exited unexpectedly with code ${code ?? 'null'}`;
            this.log('error', 'lifecycle child process exited unexpectedly', { exitCode: code });
          }
        });
      }

      this.lastStartAt = new Date().toISOString();
      this.lastError = undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = `start failed: ${redact(message)}`;
      this.state = 'failed';
      this.recordStartFailure();
      return { ok: false, code: 'model_start_failed', message: this.lastError };
    }

    // Health polling loop
    const deadline = this.now() + timeoutMs;
    while (this.now() < deadline) {
      if (externalSignal?.aborted) {
        this.state = 'idle';
        return { ok: false, code: 'model_start_aborted', message: 'start aborted by client' };
      }
      const ok = await this.probeDefault(externalSignal);
      if (ok) {
        this.modelAvailable = true;
        this.state = 'running';
        this.lastHealthyAt = new Date().toISOString();
        this.legacyCircuitBreakerFailures = [];
        this.legacyCircuitBreakerCooldownUntil = null;
        return { ok: true };
      }
      await sleep(500);
    }

    const message = `model did not become healthy within ${timeoutMs}ms`;
    this.lastError = message;
    this.modelAvailable = false;
    this.state = 'failed';
    this.recordStartFailure();
    return { ok: false, code: 'model_start_timeout', message };
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

  private recordStartFailure(): void {
    this.startFailureCount += 1;
    const now = this.now();
    this.legacyCircuitBreakerFailures.push(now);

    // Prune failures outside the window
    const windowMs = this.config.lifecycleCircuitBreakerWindowMs ?? 300_000;
    this.legacyCircuitBreakerFailures = this.legacyCircuitBreakerFailures.filter(
      (t) => now - t <= windowMs,
    );

    // Check threshold
    const threshold = this.config.lifecycleCircuitBreakerThreshold ?? 3;
    if (this.legacyCircuitBreakerFailures.length >= threshold) {
      const cooldownMs = this.config.lifecycleCircuitBreakerCooldownMs ?? 120_000;
      this.legacyCircuitBreakerCooldownUntil = now + cooldownMs;
      this.log('warn', 'circuit breaker activated', {
        failures: this.legacyCircuitBreakerFailures.length,
        cooldownMs,
      });
    }
  }

  private checkCircuitBreaker(): boolean {
    if (!this.legacyCircuitBreakerCooldownUntil) return false;
    const now = this.now();
    if (now < this.legacyCircuitBreakerCooldownUntil) return true;
    // Cooldown expired — reset
    this.legacyCircuitBreakerCooldownUntil = null;
    this.legacyCircuitBreakerFailures = [];
    return false;
  }

  // ── Legacy shutdown (for llamaStopCommand path) ─────────────────

  private async attemptShutdown(): Promise<void> {
    if (this.state === 'stopping' && this.config.llamaStopCommand === undefined && !this.config.modelShutdownArgv) return;
    if (!this.config.llamaStopCommand && !this.config.modelShutdownArgv) return;

    this.log('info', 'lifecycle shutdown command dispatched');
    try {
      const proc = this.runCommand(
        this.config.llamaStopCommand ?? '',
        this.config.modelShutdownArgv,
      );
      if (proc) {
        this.killChildOnTimeout(proc, this.config.lifecycleShutdownConfirmTimeoutMs ?? 10_000);
        await new Promise<number | null>((resolve) => {
          if (typeof proc.on === 'function') {
            proc.on('exit', (code) => resolve(code));
          } else {
            resolve(null);
          }
        });
      }

      this.lastStopAt = new Date().toISOString();
      this.modelAvailable = false;
      this.lastError = undefined;

      const confirmed = await this.confirmShutdown();
      if (confirmed) {
        this.state = 'idle';
        this.stopCount += 1;
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
    const timeoutMs = this.config.lifecycleShutdownConfirmTimeoutMs ?? 10_000;
    const deadline = this.now() + timeoutMs;
    while (this.now() < deadline) {
      const ok = await this.probeDefault();
      if (!ok) return true;
      await sleep(200);
    }
    return false;
  }

  private killChildOnTimeout(proc: ChildProcess, timeoutMs: number): void {
    if (timeoutMs <= 0) return;
    const timer = setTimeout(() => {
      if (typeof (proc as any).killed === 'boolean' && (proc as any).killed) return;
      this.log('warn', 'killing process that exceeded timeout', { pid: proc.pid, timeoutMs });
      if (typeof (proc as any).kill === 'function') {
        (proc as any).kill('SIGKILL');
      }
    }, timeoutMs);
    timer.unref();
  }

  private captureProcessStdio(proc: ModelProcess): void {
    const append = (chunk: Buffer) => {
      proc.ringBuffer = Buffer.concat([proc.ringBuffer, chunk]);
      if (proc.ringBuffer.length > this.ringBufferMaxBytes) {
        proc.ringBuffer = proc.ringBuffer.slice(proc.ringBuffer.length - this.ringBufferMaxBytes);
      }
    };
    proc.child.stdout?.on('data', (chunk: Buffer) => append(chunk));
    proc.child.stderr?.on('data', (chunk: Buffer) => append(chunk));
  }

  private async probeDefault(externalSignal?: AbortSignal): Promise<boolean> {
    if (this.hooks.probe) {
      try {
        // For backward compat, probe with port from upstreamBaseUrl
        const port = parseInt(new URL(this.config.upstreamBaseUrl).port || '8080', 10);
        return await this.hooks.probe(port, externalSignal);
      } catch {
        return false;
      }
    }
    return defaultProbe(this.config, undefined, externalSignal);
  }

  private async probePort(port: number, externalSignal?: AbortSignal): Promise<boolean> {
    if (this.hooks.probe) {
      try {
        return await this.hooks.probe(port, externalSignal);
      } catch {
        return false;
      }
    }
    return defaultProbePort(port, externalSignal);
  }

  private runCommand(command: string, argv?: string[], env?: Record<string, string>): ChildProcess | null {
    if (this.hooks.spawnProcess) {
      return this.hooks.spawnProcess(command, argv);
    }
    const childEnv = env ? { ...process.env, ...env } : process.env;
    if (argv && argv.length > 0) {
      const [cmd, ...args] = argv;
      const child = spawn(cmd, args, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        env: childEnv,
      });
      child.unref();
      return child;
    }
    const child = spawn(command, {
      shell: true,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: childEnv,
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

  private clearTimer(handle: unknown): void {
    const clear = this.hooks.clearTimer ?? ((h: unknown) => clearTimeout(h as NodeJS.Timeout));
    clear(handle);
  }
}

// ─── Probe helpers ──────────────────────────────────────────────────────

async function defaultProbe(config: AppConfig, _healthUrlOverride?: string, externalSignal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.probeTimeoutMs);
  const signal = externalSignal ? AbortSignal.any([controller.signal, externalSignal]) : controller.signal;
  try {
    // Resolve health URL, stripping /v1 suffix since llama.cpp serves /health at root
    const cleanBase = config.upstreamBaseUrl.replace(/\/+$/, '');
    const rootBase = cleanBase.endsWith('/v1') ? cleanBase.slice(0, -3) : cleanBase;
    const healthUrl = config.modelHealthUrl ?? `${rootBase}/health`;
    try {
      const res = await fetch(healthUrl, { signal });
      if (res.ok) return true;
    } catch { /* try /v1/models */ }
    try {
      const res = await fetch(`${cleanBase}/models`, { signal });
      return res.ok;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function defaultProbePort(port: number, externalSignal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const signal = externalSignal ? AbortSignal.any([controller.signal, externalSignal]) : controller.signal;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, { signal });
    return res.ok;
  } catch {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/models`, { signal });
      return res.ok;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function redact(value: string): string {
  return value
    .replace(/(api[_-]?key|token|secret|password|bearer)\s*[:=]\s*['\"]?[A-Za-z0-9._\-+/=]+/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REDACTED]');
}

function isFuserNoMatch(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'status' in error
    && (error as { status?: number }).status === 1,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
