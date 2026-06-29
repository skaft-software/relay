/**
 * Lightweight serialization mutex for LLM request paths.
 *
 * When a single caller hits Relay, the mutex grants immediate access
 * (zero additional latency). When callers overlap, subsequent requests
 * are queued FCFS and woken in order as the active request completes.
 *
 * AbortSignals are respected: if a queued caller disconnects before
 * its turn, it is removed from the queue without affecting other waiters.
 */
export class RequestMutex {
  private running = false;
  private waiters: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    cleanup?: () => void;
  }> = [];

  /**
   * Acquire the mutex. Resolves immediately if no request is in-flight;
   * otherwise queues the caller FCFS behind any existing waiters.
   *
   * The optional AbortSignal removes the waiter from the queue and rejects
   * if the client disconnects while waiting.
   */
  async acquire(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw new Error('aborted');
    }
    if (!this.running) {
      this.running = true;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        const idx = this.waiters.indexOf(entry);
        if (idx >= 0) {
          this.waiters.splice(idx, 1);
        }
        reject(new Error('aborted'));
      };

      const entry = { resolve, reject, cleanup: () => { signal?.removeEventListener('abort', onAbort); } };
      signal?.addEventListener('abort', onAbort, { once: true });

      this.waiters.push(entry);
    });
  }

  /**
   * Release the mutex so the next queued caller (if any) can proceed.
   * If no waiters remain the mutex returns to the idle (free) state.
   */
  release(): void {
    // Drain until we find a waiter that hasn't been removed via abort.
    while (this.waiters.length > 0) {
      const next = this.waiters.shift()!;
      // Clean up the abort listener to prevent memory leaks.
      if (next.cleanup) next.cleanup();
      next.resolve();
      return;
    }
    this.running = false;
  }

  /** Whether a request is currently holding the mutex. */
  get active(): boolean {
    return this.running;
  }

  /** Number of callers waiting in the queue. */
  get waiting(): number {
    return this.waiters.length;
  }
}
