export type LlmJobKind = 'openai.chat' | 'anthropic.messages' | string;

export type LlmJobRequest = {
  id?: string;
  source: string;
  kind?: LlmJobKind;
  priority?: 'low' | 'normal' | 'high';
  request: Record<string, unknown>;
  stream?: boolean;
  timeoutMs?: number;
};

export type LlmJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

export type LlmJobSnapshot = {
  id: string;
  source: string;
  kind: LlmJobKind;
  priority: 'low' | 'normal' | 'high';
  stream: boolean;
  status: LlmJobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  response?: unknown;
  error?: {
    code: string;
    message: string;
    upstreamStatus?: number;
  };
};

type JobRecord = LlmJobSnapshot & {
  request: Record<string, unknown>;
  timeoutMs: number;
};

type JobProcessor = (
  job: LlmJobRequest & { kind: LlmJobKind; stream: boolean },
  signal: AbortSignal,
) => Promise<{
  response?: unknown;
  error?: LlmJobSnapshot['error'];
}>;

export type LlmJobQueueEvents = {
  onJobEnqueued?: (job: LlmJobSnapshot) => void;
  onJobStarted?: (job: LlmJobSnapshot) => void;
  onJobFinished?: (job: LlmJobSnapshot) => void;
  onJobCancelled?: (job: LlmJobSnapshot) => void;
};

export type LlmJobQueueOptions = {
  maxEntries?: number;
  events?: LlmJobQueueEvents;
};

export type JobQueueCounts = {
  pending: number;
  active: number;
  completedRecent: number;
  failedRecent: number;
};

const RECENT_WINDOW_MS = 5 * 60_000;

export class LlmJobQueue {
  private readonly processor: JobProcessor;
  private readonly maxEntries: number;
  private readonly events: LlmJobQueueEvents;
  private readonly jobs = new Map<string, JobRecord>();
  private readonly queue: string[] = [];
  private running = false;
  private completedRecent: number[] = [];
  private failedRecent: number[] = [];
  private readonly idempotencyKeys = new Map<string, { job: LlmJobSnapshot; createdAt: number }>();
  private readonly idempotencyTtlMs = 86_400_000; // 24 hours

  constructor(processor: JobProcessor, options: LlmJobQueueOptions | number = {}) {
    this.processor = processor;
    if (typeof options === 'number') {
      this.maxEntries = options;
      this.events = {};
    } else {
      this.maxEntries = options.maxEntries ?? 1000;
      this.events = options.events ?? {};
    }
  }

  /**
   * Submit a job with optional idempotency key. If the key was used before
   * within the retention window, return the cached job snapshot without
   * re-enqueuing.
   */
  submitWithIdempotency(input: LlmJobRequest, idempotencyKey?: string): LlmJobSnapshot {
    if (idempotencyKey) {
      this.pruneIdempotencyKeys();
      const cached = this.idempotencyKeys.get(idempotencyKey);
      if (cached) return structuredClone(cached.job);
      const result = this.submit(input);
      this.idempotencyKeys.set(idempotencyKey, { job: structuredClone(result), createdAt: Date.now() });
      return result;
    }
    return this.submit(input);
  }

  private pruneIdempotencyKeys(): void {
    const now = Date.now();
    for (const [key, entry] of this.idempotencyKeys) {
      if (now - entry.createdAt > this.idempotencyTtlMs) this.idempotencyKeys.delete(key);
    }
    // Hard cap to prevent unbounded memory growth from idempotency key churn.
    if (this.idempotencyKeys.size > 10_000) {
      const entries = [...this.idempotencyKeys.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
      for (const [key] of entries.slice(0, entries.length - 5000)) {
        this.idempotencyKeys.delete(key);
      }
    }
  }

  submit(input: LlmJobRequest): LlmJobSnapshot {
    if (!input || typeof input !== 'object') {
      const err: any = new Error('job body must be an object');
      err.status = 400;
      err.type = 'invalid_request_error';
      throw err;
    }
    if (!input.request || typeof input.request !== 'object') {
      const err: any = new Error('job.request must be an object');
      err.status = 400;
      err.type = 'invalid_request_error';
      throw err;
    }
    // Reject excessively large job payloads (default 1 MiB) to prevent memory exhaustion.
    const bodyBytes = Buffer.byteLength(JSON.stringify(input.request));
    if (bodyBytes > 1_048_576) {
      const err: any = new Error(`job.request exceeds maximum size of 1 MiB (${Math.round(bodyBytes / 1024)} KiB)`);
      err.status = 413;
      err.type = 'invalid_request_error';
      err.code = 'request_too_large';
      throw err;
    }
    const id = input.id || crypto.randomUUID();
    const kind: LlmJobKind = input.kind ?? 'openai.chat';
    const job: JobRecord = {
      id,
      source: input.source || 'unknown',
      kind,
      priority: input.priority ?? 'normal',
      stream: Boolean(input.stream),
      status: 'queued',
      createdAt: new Date().toISOString(),
      request: input.request,
      timeoutMs: input.timeoutMs ?? defaultTimeoutForKind(kind),
    };
    this.jobs.set(id, job);
    this.queue.push(id);
    // Prune completed/failed recent timestamps on insert so reads are cheap.
    this.pruneRecentTimestamps();
    this.prune();
    const snap = snapshot(job);
    try {
      this.events.onJobEnqueued?.(snap);
    } catch {
      // event listeners must not break submission
    }
    void this.drain();
    return snap;
  }

  get(id: string): LlmJobSnapshot | undefined {
    const job = this.jobs.get(id);
    return job ? snapshot(job) : undefined;
  }

  list(): LlmJobSnapshot[] {
    return [...this.jobs.values()].map(snapshot);
  }

  counts(): JobQueueCounts {
    let pending = 0;
    let active = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'queued') pending += 1;
      else if (job.status === 'running') active += 1;
    }
    // Timestamps are pruned on insert, so this is a cheap read.
    const now = Date.now();
    const completedCount = this.completedRecent.filter((t) => now - t <= RECENT_WINDOW_MS).length;
    const failedCount = this.failedRecent.filter((t) => now - t <= RECENT_WINDOW_MS).length;
    return {
      pending,
      active,
      completedRecent: completedCount,
      failedRecent: failedCount,
    };
  }

  cancel(id: string): LlmJobSnapshot | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    if (job.status !== 'queued') return snapshot(job);
    job.status = 'cancelled';
    job.finishedAt = new Date().toISOString();
    const snap = snapshot(job);
    try {
      this.events.onJobCancelled?.(snap);
    } catch {
      // event listeners must not break processing
    }
    return snap;
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const id = this.nextQueuedId();
        if (!id) break;
        const job = this.jobs.get(id);
        if (!job || job.status !== 'queued') continue;
        await this.run(job);
      }
    } finally {
      this.running = false;
    }
  }

  private nextQueuedId(): string | undefined {
    this.queue.sort(
      (a, b) =>
        priorityRank(this.jobs.get(b)?.priority) - priorityRank(this.jobs.get(a)?.priority),
    );
    return this.queue.shift();
  }

  private async run(job: JobRecord): Promise<void> {
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    try {
      this.events.onJobStarted?.(snapshot(job));
    } catch {
      // listener errors must not abort processing
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), job.timeoutMs);
    try {
      const result = await this.processor(
        { ...job, kind: job.kind, stream: job.stream },
        controller.signal,
      );
      if (result.error) {
        job.status = 'failed';
        job.error = result.error;
      } else {
        job.status = 'completed';
        job.response = result.response;
      }
    } catch (error) {
      job.status = controller.signal.aborted ? 'timeout' : 'failed';
      job.error = {
        code: controller.signal.aborted ? 'timeout' : 'job_failed',
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timeout);
      job.finishedAt = new Date().toISOString();
      if (job.status === 'completed') this.completedRecent.push(Date.now());
      else if (job.status === 'failed' || job.status === 'timeout') this.failedRecent.push(Date.now());
      try {
        this.events.onJobFinished?.(snapshot(job));
      } catch {
        // listener errors must not abort processing
      }
      // Prune after completion so finished jobs are cleaned up promptly.
      this.prune();
    }
  }

  private pruneRecentTimestamps(): void {
    const now = Date.now();
    // Cap arrays to prevent unbounded growth.
    if (this.completedRecent.length > 1000) {
      this.completedRecent = this.completedRecent.slice(-500);
    }
    if (this.failedRecent.length > 1000) {
      this.failedRecent = this.failedRecent.slice(-500);
    }
  }

  private prune(): void {
    // TTL-based pruning: remove finished jobs older than RECENT_WINDOW_MS
    const ttlCutoff = Date.now() - RECENT_WINDOW_MS;
    const ttlThreshold = new Date(ttlCutoff).toISOString();
    for (const [id, job] of this.jobs) {
      if (job.status === 'queued' || job.status === 'running') continue;
      if (job.finishedAt && job.finishedAt < ttlThreshold) {
        this.jobs.delete(id);
      }
    }
    // Count-based pruning: if still over maxEntries, remove oldest finished jobs.
    if (this.jobs.size <= this.maxEntries) return;
    const finished = [...this.jobs.values()]
      .filter((job) => job.status !== 'queued' && job.status !== 'running')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const job of finished) {
      if (this.jobs.size <= this.maxEntries) break;
      this.jobs.delete(job.id);
    }
  }
}

function defaultTimeoutForKind(kind: LlmJobKind): number {
  // Embeddings and rerank are typically fast; chat/messages need longer.
  if (kind === 'openai.embeddings' || kind === 'openai.rerank') return 120_000;
  return 600_000;
}

function priorityRank(priority: LlmJobSnapshot['priority'] | undefined): number {
  if (priority === 'high') return 2;
  if (priority === 'low') return 0;
  return 1;
}

function snapshot(job: JobRecord): LlmJobSnapshot {
  const { request: _request, timeoutMs: _timeoutMs, ...out } = job;
  return structuredClone(out);
}
