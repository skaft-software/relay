/**
 * Injects SSE loading events during model cold-start so clients can
 * display a loading indicator instead of dead air.
 *
 * When the upstream llama.cpp server is loading/unloading a model,
 * the TCP connection is accepted but no data flows for 10-60s.
 * This wrapper detects the silence and emits periodic loading SSE
 * chunks so the client knows the request is still alive.
 */

const LOADING_PROBE_MS = 1500; // how long to wait before emitting first loading event
const LOADING_INTERVAL_MS = 3000; // how often to emit subsequent loading events

type LoadingEventOpts = {
  model: string;
  probeMs?: number;
  intervalMs?: number;
};

/**
 * Wrap a ReadableStream<Uint8Array> so that if no data arrives within
 * probeMs, periodic loading SSE events are emitted. Once real data
 * arrives, loading events stop and the real stream is forwarded.
 */
export function injectLoadingEvents(
  upstream: ReadableStream<Uint8Array>,
  opts: LoadingEventOpts,
): ReadableStream<Uint8Array> {
  const { model, probeMs = LOADING_PROBE_MS, intervalMs = LOADING_INTERVAL_MS } = opts;
  const encoder = new TextEncoder();
  const startTime = Date.now();
  let firstByteReceived = false;
  let loadingTimer: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();

      const emitLoading = () => {
        if (firstByteReceived) return;
        const elapsedMs = Date.now() - startTime;
        const payload = JSON.stringify({ event: 'loading', model, elapsed_ms: elapsedMs });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      // Probe: after probeMs, start emitting loading events if nothing arrived
      const probeTimer = setTimeout(() => {
        if (!firstByteReceived) {
          emitLoading();
          loadingTimer = setInterval(emitLoading, intervalMs);
        }
      }, probeMs);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (!firstByteReceived) {
            firstByteReceived = true;
            clearTimeout(probeTimer);
            if (loadingTimer) {
              clearInterval(loadingTimer);
              loadingTimer = null;
            }
          }

          controller.enqueue(value);
        }
        controller.close();
      } catch (err) {
        clearTimeout(probeTimer);
        if (loadingTimer) clearInterval(loadingTimer);
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
