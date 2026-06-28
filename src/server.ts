import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import { hasValidApiKey, KeyRateLimiter } from "./auth.ts";
import { parseJson } from "./json.ts";
import { CapabilityRegistry } from "./capabilities.ts";
import type { AppConfig } from "./config.ts";
import {
  errorResponse,
  GatewayError,
  invalidJsonError,
  jsonResponse,
  openAIError,
  requestTooLargeError,
  unsupportedEndpoint,
} from "./errors.ts";
import {
  handleAnthropicCountTokens,
  handleAnthropicMessages,
} from "./anthropic/messages.ts";
import {
  createChatCompletion,
  createCompletionShim,
  CompletionStore,
  deleteStoredCompletion,
  getStoredCompletion,
  getStoredMessages,
  listStoredCompletions,
  updateStoredCompletion,
} from "./openai/chat.ts";
import { createEmbedding, createRerank } from "./openai/embeddings.ts";
import { handleModels } from "./openai/models.ts";
import {
  createResponse,
  deleteResponse,
  getResponse,
  ResponseStore,
} from "./openai/responses.ts";
import { createLogger } from "./logger.ts";
import { LlmJobQueue } from "./jobs.ts";
import type { JobQueueCounts } from "./jobs.ts";
import { ModelLifecycle } from "./lifecycle.ts";
import { CloudModelRegistry } from "./cloud.ts";
import { RequestMutex } from "./mutex.ts";
import {
  captureRequest,
  classifyErrorSource,
  classifyFailure,
  detectProtocol,
  ObservabilityStore,
  routeLabel,
} from "./observability.ts";
import { activeProfile } from "./profile.ts";
import {
  detectProviderFormat,
  logInboundDiagnostics,
  logNonStreamingResponseDiagnostics,
} from "./truncation-diagnostics.ts";
import { encodeSSE } from "./normalize/stream.ts";

type AppFetchInit = Omit<RequestInit, "body"> & { body?: unknown };
type StreamingProtocol = "anthropic" | "openai_chat" | "openai_responses";

export type App = {
  fetch: (path: string, init?: AppFetchInit) => Promise<Response>;
  handler: (request: Request, externalSignal?: AbortSignal) => Promise<Response>;
  listen: () => Promise<{ close: () => Promise<void>; url: string; server: import('node:http').Server }>;
  counts: () => JobQueueCounts;
  shutdown: () => void;
};

export function createApp(config: AppConfig): App {
  const logger = createLogger(config.logLevel);
  const store = new CompletionStore(config.maxStoreEntries, config.maxStoreBytes);
  const responseStore = new ResponseStore(config.maxStoreEntries, config.maxStoreBytes);
  const capabilities = new CapabilityRegistry(config);
  const observability = new ObservabilityStore(config);
  const cloudRegistry = config.relayMode === "cloud" ? new CloudModelRegistry(config) : undefined;
  const lifecycle = new ModelLifecycle(config, {
    log: (level, msg, meta) => {
      if (level === "error") logger.error(`lifecycle: ${msg}`, meta);
      else logger.info(`lifecycle: ${msg}`, { level, ...(meta ?? {}) });
    },
  });
  const isCloud = config.relayMode === "cloud";
  const mutex = config.serializeRequests ? new RequestMutex() : undefined;
  const jobs = new LlmJobQueue(async (job, signal) => {
    const jobModel = typeof job.request?.model === 'string' ? job.request.model : undefined;
    const availability = await lifecycle.ensureModelAvailable(jobModel, signal);
    if (!availability.ok) {
      lifecycle.markJobDequeued();
      return {
        error: {
          code: availability.code ?? "model_unavailable",
          message: availability.message ?? "Model is unavailable",
        },
      };
    }

    lifecycle.markJobDequeued();
    lifecycle.markJobStarted();
    // Serialize with direct endpoint callers when mutex is enabled.
    if (mutex) await mutex.acquire(signal);
    try {
      if (job.kind === "anthropic.messages") {
        const headers = new Headers({ "content-type": "application/json" });
        const url = `http://${formatHostForUrl(config.host)}:${config.port}/v1/messages`;
        const upstreamReq = new Request(url, {
          method: "POST",
          headers,
          body: JSON.stringify(job.request),
        });
        const response = await handleAnthropicMessages(config, upstreamReq, signal, lifecycle);
        const payload: any = await response.clone().json().catch(async () => ({ text: await response.text() }));
        if (!response.ok) {
          return {
            error: {
              code: "upstream_error",
              message: typeof payload?.error?.message === "string" ? payload.error.message : `HTTP ${response.status}`,
              upstreamStatus: readUpstreamStatus(response) ?? undefined,
            },
          };
        }
        return { response: payload };
      }
      const response = await createChatCompletion(config, store, job.request, signal, lifecycle);
      const payload: any = await response.clone().json().catch(async () => ({ text: await response.text() }));
      if (!response.ok) {
        return {
          error: {
            code: "upstream_error",
            message: typeof payload?.error?.message === "string" ? payload.error.message : `HTTP ${response.status}`,
            upstreamStatus: readUpstreamStatus(response) ?? undefined,
          },
        };
      }
      return { response: payload };
    } finally {
      if (mutex) mutex.release();
      lifecycle.markJobFinished();
      lifecycle.maybeShutdownWhenIdle();
    }
  }, {
    maxEntries: config.maxStoreEntries,
    events: {
      onJobEnqueued: (job) => {
        lifecycle.markJobEnqueued();
        logger.info('job enqueued', { job_id: job.id, source: job.source, kind: job.kind, status: job.status });
      },
      onJobStarted: (job) => {
        logger.info('job started', { job_id: job.id, source: job.source, kind: job.kind });
      },
      onJobFinished: (job) => {
        logger.info('job finished', { job_id: job.id, source: job.source, kind: job.kind, status: job.status, duration_ms: job.startedAt && job.finishedAt ? new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime() : undefined });
      },
      onJobCancelled: () => lifecycle.markJobDequeued(),
    },
  });
  // Per-key rate limiters — each unique API key gets its own bucket,
  // so shared tokens don't interfere with each other.
  const authRateLimiter = new KeyRateLimiter(
    config.rateLimitAuthMax ?? 20,
    config.rateLimitAuthWindowMs ?? 60_000,
  );
  const refreshRateLimiter = new KeyRateLimiter(1, 60_000);
  const relayPostRateLimiter = new KeyRateLimiter(
    config.rateLimitRelayPostMax ?? 50,
    config.rateLimitRelayPostWindowMs ?? 60_000,
  );

  let shuttingDown = false;
  const bindHost = `${config.host}:${config.port}`;

  /**
   * Wrap a handler with mutex serialization when enabled.
   * Non-streaming responses release the mutex immediately after the response
   * is produced. Streaming responses wrap the body so the mutex is released
   * only after the SSE stream completes (or the client disconnects).
   */
  async function withMutex(
    handler: () => Promise<Response>,
    signal?: AbortSignal,
  ): Promise<Response> {
    if (!mutex) return handler();

    await mutex.acquire(signal);

    let response: Response;
    try {
      response = await handler();
    } catch (e) {
      mutex.release();
      throw e;
    }

    const isStream = (response.headers.get('content-type') ?? '').includes('text/event-stream');
    if (!isStream || !response.body) {
      mutex.release();
      return response;
    }

    // Wrap the stream body so the mutex isn't released until the SSE stream
    // finishes (or the client disconnects).
    const reader = response.body.getReader();
    let mutexReleased = false;
    const releaseMutex = () => {
      if (mutexReleased) return;
      mutexReleased = true;
      mutex.release();
    };
    const wrappedStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        } finally {
          reader.releaseLock();
          releaseMutex();
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
        releaseMutex();
      },
    });

    return new Response(wrappedStream, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  async function handler(request: Request, externalSignal?: AbortSignal): Promise<Response> {
    if (config.host !== "0.0.0.0" && config.host !== "::") {
      const requestUrl = new URL(request.url);
      const hostHeader = (
        request.headers.get("host") ??
        requestUrl.host ??
        ""
      ).toLowerCase();
      const isLocalhost =
        hostHeader.startsWith("127.0.0.1:") ||
        hostHeader.startsWith("localhost:") ||
        hostHeader.startsWith("[::1]:");
      const isAllowedHost = config.allowedHosts?.some(
        (h) => hostHeader === h.toLowerCase() || hostHeader.startsWith(h.toLowerCase() + ':')
      );
      if (
        !isLocalhost &&
        hostHeader !== bindHost.toLowerCase() &&
        !isAllowedHost
      ) {
        const rejectId = crypto.randomUUID();
        const rejectRes = new Response("Bad Request", { status: 400 });
        rejectRes.headers.set("x-request-id", rejectId);
        return rejectRes;
      }
    }
    const requestId =
      request.headers.get("x-request-id") ?? crypto.randomUUID();
    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();
    const url = new URL(request.url);
    const path = url.pathname;
    const requestCapturePromise = captureRequest(
      request.clone(),
      requestId,
      startedAt,
      config.observabilityCaptureBody ?? false,
    );
    let requestModel: string | undefined;
    let response: Response;
    try {
      if (request.method === "OPTIONS") {
        response = optionsResponse(request, config);
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "GET" && path === "/") {
        if (config.apiKey) {
          const relayAuthError = authorizeRelay(
            config,
            request,
            path,
            authRateLimiter,
          );
          if (relayAuthError)
            return finalizeResponse(
              relayAuthError,
              requestId,
              path,
              request.method,
              startedAt,
              startedAtMs,
              requestModel,
            );
        }
        const accept = request.headers.get("accept") ?? "";
        if (accept.includes("text/html")) {
          response = htmlResponse(renderStatusPage(config, lifecycle, jobs, mutex));
        } else {
          response = jsonResponse({
            object: "gateway",
            name: "relay",
            endpoints: [
              "/health",
              "/relay/jobs",
              "/relay/lifecycle",
              "/relay/status",
              "/relay/metrics",
              "/v1/models",
              "/v1/chat/completions",
              "/v1/completions",
              "/v1/responses",
              "/v1/messages",
              "/v1/embeddings",
              "/v1/rerank",
            ],
          });
        }
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "GET" && path === "/health") {
        if (config.apiKey) {
          const relayAuthError = authorizeRelay(
            config,
            request,
            path,
            authRateLimiter,
          );
          if (relayAuthError)
            return finalizeResponse(
              relayAuthError,
              requestId,
              path,
              request.method,
              startedAt,
              startedAtMs,
              requestModel,
            );
        }
        response = jsonResponse({ ok: true });
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (config.apiKey) {
        const relayAuthError = authorizeRelay(
          config,
          request,
          path,
          authRateLimiter,
        );
        if (relayAuthError)
          return finalizeResponse(
            relayAuthError,
            requestId,
            path,
            request.method,
            startedAt,
            startedAtMs,
            requestModel,
          );
      }
      if (request.method === "GET" && path === "/relay/capabilities") {
        response = jsonResponse(capabilities.get());
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "POST" && path === "/relay/lifecycle/shutdown") {
        const result = lifecycle.forceShutdown();
        response = jsonResponse(result, result.ok ? 200 : 409);
        return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
      }
      if (request.method === "GET" && path === "/relay/lifecycle") {
        response = jsonResponse(lifecycle.getLifecycleStatus());
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "GET" && path === "/relay/status") {
        const lifecycleStatus = lifecycle.getLifecycleStatus();
        response = jsonResponse({
          queue: jobs.counts(),
          lifecycle: lifecycleStatus,
          mutex: mutex ? { active: mutex.active, waiting: mutex.waiting } : undefined,
        });
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }

      if (request.method === "GET" && path === "/relay/metrics") {
        const qCounts = jobs.counts();
        const lStatus = lifecycle.getLifecycleStatus();
        const lines: string[] = [
          '# HELP relay_queue_pending Number of pending jobs in the queue',
          '# TYPE relay_queue_pending gauge',
          `relay_queue_pending ${qCounts.pending}`,
          '',
          '# HELP relay_queue_active Number of actively running jobs',
          '# TYPE relay_queue_active gauge',
          `relay_queue_active ${qCounts.active}`,
          '',
          '# HELP relay_queue_completed_recent Number of recently completed jobs',
          '# TYPE relay_queue_completed_recent gauge',
          `relay_queue_completed_recent ${qCounts.completedRecent}`,
          '',
          '# HELP relay_queue_failed_recent Number of recently failed jobs',
          '# TYPE relay_queue_failed_recent gauge',
          `relay_queue_failed_recent ${qCounts.failedRecent}`,
          '',
          '# HELP relay_lifecycle_state Current lifecycle state',
          '# TYPE relay_lifecycle_state gauge',
          `relay_lifecycle_state{state="${lStatus.state}"} 1`,
          '',
          '# HELP relay_lifecycle_model_available Whether the model is available (1=yes, 0=no)',
          '# TYPE relay_lifecycle_model_available gauge',
          `relay_lifecycle_model_available ${lStatus.modelAvailable === true ? 1 : 0}`,
          '',
          '# HELP relay_lifecycle_start_count Total number of model starts',
          '# TYPE relay_lifecycle_start_count counter',
          `relay_lifecycle_start_count ${lStatus.startCount ?? 0}`,
          '',
          '# HELP relay_lifecycle_stop_count Total number of model stops',
          '# TYPE relay_lifecycle_stop_count counter',
          `relay_lifecycle_stop_count ${lStatus.stopCount ?? 0}`,
          '',
          '# HELP relay_lifecycle_start_failure_count Total number of failed start attempts',
          '# TYPE relay_lifecycle_start_failure_count counter',
          `relay_lifecycle_start_failure_count ${lStatus.startFailureCount ?? 0}`,
          '',
        ];
        response = new Response(lines.join('\n'), {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
        return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
      }
      if (request.method === "GET" && path === "/relay/jobs") {
        response = jsonResponse({ object: "list", data: jobs.list() });
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "POST" && path === "/relay/jobs") {
        if (shuttingDown) {
          response = jsonResponse({ error: 'shutting_down', message: 'Server is shutting down, not accepting new jobs' }, 503);
          return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
        }
        const relayIp = clientIp(request, config);
        if (!relayPostRateLimiter.allow(relayIp)) {
          response = openAIError(429, 'Too many requests to /relay/jobs', 'rate_limit_exceeded');
          return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
        }
        if (config.jobQueueMaxPending && jobs.counts().pending >= config.jobQueueMaxPending) {
          response = jsonResponse({ error: 'queue_full', message: `Job queue is full (max ${config.jobQueueMaxPending} pending)` }, 429);
          return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
        }
        const body = await readJson(request, logger, path);
        const idempotencyKey = request.headers.get('idempotency-key') ?? undefined;
        response = jsonResponse(jobs.submitWithIdempotency(body as any, idempotencyKey), 202);
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      const jobMatch = path.match(/^\/relay\/jobs\/([^/]+)$/);
      if (jobMatch) {
        const jobId = decodeURIComponent(jobMatch[1]);
        if (request.method === "DELETE") {
          const cancelled = jobs.cancel(jobId);
          if (!cancelled) throw new GatewayError(404, `Job ${jobId} was not found`);
          response = jsonResponse(cancelled);
          return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
        }
        if (request.method === "GET") {
          // Long-poll support: ?wait=ms blocks until terminal or timeout.
          const waitParam = parseInt(url.searchParams.get('wait') ?? '', 10);
          if (Number.isFinite(waitParam) && waitParam > 0) {
            const deadline = Date.now() + Math.min(waitParam, 60_000);
            while (Date.now() < deadline) {
              const snap = jobs.get(jobId);
              if (!snap) throw new GatewayError(404, `Job ${jobId} was not found`);
              if (snap.status === 'completed' || snap.status === 'failed' || snap.status === 'cancelled' || snap.status === 'timeout') {
                response = jsonResponse(snap);
                return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
              }
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
            // Timeout — return current state
            const snap = jobs.get(jobId);
            if (!snap) throw new GatewayError(404, `Job ${jobId} was not found`);
            response = jsonResponse(snap);
            return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
          }
          const job = jobs.get(jobId);
          if (!job) throw new GatewayError(404, `Job ${jobId} was not found`);
          response = jsonResponse(job);
          return finalizeResponse(response, requestId, path, request.method, startedAt, startedAtMs, requestModel);
        }
        if (request.method !== "GET" && request.method !== "DELETE") {
          throw new GatewayError(405, `Method ${request.method} not allowed`);
        }
      }
      if (request.method === "POST" && path === "/relay/capabilities/refresh") {
        const ip = clientIp(request, config);
        if (!refreshRateLimiter.allow(ip)) {
          return finalizeResponse(
            openAIError(429, "Too many requests", "rate_limit_exceeded"),
            requestId,
            path,
            request.method,
            startedAt,
            startedAtMs,
            requestModel,
          );
        }
        response = jsonResponse(await capabilities.refresh(externalSignal));
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "GET" && path === "/relay/stats") {
        response = jsonResponse(observability.stats());
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "GET" && path === "/relay/requests") {
        response = jsonResponse({ object: "list", data: observability.list() });
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      const requestMatch = path.match(/^\/relay\/requests\/([^/]+)$/);
      if (request.method === "GET" && requestMatch) {
        const requestEntryId = decodeURIComponent(requestMatch[1]);
        const entry = observability.get(requestEntryId);
        if (!entry)
          throw new GatewayError(
            404,
            `Request ${requestEntryId} was not found`,
          );
        response = jsonResponse(entry);
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (path === "/v1/messages/count_tokens") {
        if (request.method === "POST")
          response = await handleAnthropicCountTokens(config, request, externalSignal);
        else
          response = jsonResponse(
            {
              type: "error",
              error: { type: "not_found_error", message: "Not found" },
            },
            404,
          );
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (path === "/v1/messages") {
        if (request.method === "POST") {
          // Read body clone for stream detection and model extraction before handleAnthropicMessages consumes it.
          const bodyPreview = await request.clone().text().catch(() => '');
          let isStream = false;
          let anthropicModel: string | undefined;
          let parsedBody: unknown;
          try {
            const parsed = JSON.parse(bodyPreview);
            parsedBody = parsed;
            isStream = parsed?.stream === true;
            anthropicModel = typeof parsed?.model === 'string' ? parsed.model : undefined;
          } catch { /* ignore */ }
          // Gateway: forward unknown models to cloud fallback
          if (!isCloud && config.cloudFallbackUrl && anthropicModel && !config.modelEntries?.[anthropicModel]) {
            response = await forwardToCloud(parsedBody ?? {}, path);
            return finalizeResponse(
              response, requestId, path, request.method, startedAt, startedAtMs, requestModel,
            );
          }
          // Cloud mode: resolve upstream overrides per model (thread-safe — passed as args, not config mutation)
          let upstreamBaseUrlOverride: string | undefined;
          let upstreamAuthHeaderOverride: string | undefined;
          if (isCloud && cloudRegistry && anthropicModel) {
            const overrides = cloudRegistry.upstreamOptionsFor(anthropicModel);
            if (overrides) {
              upstreamBaseUrlOverride = overrides.baseUrl;
              upstreamAuthHeaderOverride = overrides.authHeader;
            }
          }
          if (isCloud) {
            response = await withMutex(
              () => handleAnthropicMessages(config, request, externalSignal, lifecycle, upstreamBaseUrlOverride, upstreamAuthHeaderOverride),
              externalSignal,
            );
          } else {
            const anthropicSessionId = extractSessionId(request);
            response = await withMutex(
              () => withLifecycleForStreaming(
                lifecycle,
                anthropicModel,
                () => handleAnthropicMessages(config, request, externalSignal, lifecycle, upstreamBaseUrlOverride, upstreamAuthHeaderOverride),
                isStream,
                "anthropic",
                externalSignal,
                anthropicSessionId,
              ),
              externalSignal,
            );
          }
        }
        else
          response = jsonResponse(
            {
              type: "error",
              error: { type: "not_found_error", message: "Not found" },
            },
            404,
          );
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (config.apiKey) {
        const authError = authorizeOpenAI(
          config,
          request,
          path,
          authRateLimiter,
        );
        if (authError)
          return finalizeResponse(
            authError,
            requestId,
            path,
            request.method,
            startedAt,
            startedAtMs,
            requestModel,
          );
      }
      if (isUnsupportedOpenAIEndpoint(path)) {
        return finalizeResponse(
          unsupportedEndpoint(path),
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (request.method === "GET" && path === "/v1/models") {
        response = await handleModels(config, undefined, externalSignal);
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      const modelMatch = path.match(/^\/v1\/models\/([^/]+)$/);
      if (request.method === "GET" && modelMatch) {
        response = await handleModels(
          config,
          decodeURIComponent(modelMatch[1]),
          externalSignal,
        );
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (path === "/v1/chat/completions") {
        if (request.method === "POST") {
          const body = await readJson(request, logger, path);
          requestModel = readRequestModel(body);
          // Gateway: forward unknown models to cloud fallback
          if (!isCloud && config.cloudFallbackUrl && requestModel && !config.modelEntries?.[requestModel]) {
            response = await forwardToCloud(body, path);
            return finalizeResponse(
              response, requestId, path, request.method, startedAt, startedAtMs, requestModel,
            );
          }
          // Cloud mode: resolve upstream overrides per model (thread-safe — passed as args, not config mutation)
          let upstreamBaseUrlOverride: string | undefined;
          let upstreamAuthHeaderOverride: string | undefined;
          if (isCloud && cloudRegistry && requestModel) {
            const overrides = cloudRegistry.upstreamOptionsFor(requestModel);
            if (overrides) {
              upstreamBaseUrlOverride = overrides.baseUrl;
              upstreamAuthHeaderOverride = overrides.authHeader;
            }
          }
          const isStream = isObject(body) && body.stream === true;
          if (isCloud) {
            // Cloud mode: no lifecycle, call handler directly
            response = await withMutex(
              () => createChatCompletion(config, store, body, externalSignal, lifecycle, upstreamBaseUrlOverride, upstreamAuthHeaderOverride),
              externalSignal,
            );
          } else {
            const chatSessionId = extractSessionId(request);
            response = await withMutex(
              () => withLifecycleForStreaming(
                lifecycle,
                requestModel,
                () => createChatCompletion(config, store, body, externalSignal, lifecycle, upstreamBaseUrlOverride, upstreamAuthHeaderOverride),
                isStream,
                "openai_chat",
                externalSignal,
                chatSessionId,
              ),
              externalSignal,
            );
          }
          return finalizeResponse(
            response,
            requestId,
            path,
            request.method,
            startedAt,
            startedAtMs,
            requestModel,
          );
        }
        if (request.method === "GET") {
          response = listStoredCompletions(store, url);
          return finalizeResponse(
            response,
            requestId,
            path,
            request.method,
            startedAt,
            startedAtMs,
            requestModel,
          );
        }
      }
      if (path === "/v1/completions" && request.method === "POST") {
        const body = await readJson(request, logger, path);
        requestModel = readRequestModel(body);
        // Gateway: forward unknown models to cloud fallback
        if (!isCloud && config.cloudFallbackUrl && requestModel && !config.modelEntries?.[requestModel]) {
          response = await forwardToCloud(body, path);
          return finalizeResponse(
            response, requestId, path, request.method, startedAt, startedAtMs, requestModel,
          );
        }
        response = await withMutex(
          () => createCompletionShim(config, store, body, externalSignal),
          externalSignal,
        );
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (path === "/v1/responses" && request.method === "POST") {
        const body = await readJson(request, logger, path);
        requestModel = readRequestModel(body);
        // Gateway: forward unknown models to cloud fallback
        if (!isCloud && config.cloudFallbackUrl && requestModel && !config.modelEntries?.[requestModel]) {
          const upstream = await forwardToCloud(body, path);
          // Save response to local store so previous_response_id lookups work.
          try {
            const cloned = upstream.clone();
            const payload = await cloned.json();
            if (payload?.id && payload?.object === 'response') {
              responseStore.save(payload, config.completionTtlMs);
            }
          } catch { /* best effort */ }
          return finalizeResponse(
            upstream, requestId, path, request.method, startedAt, startedAtMs, requestModel,
          );
        }
        // Cloud mode: resolve upstream overrides per model (thread-safe — passed as args, not config mutation)
        let upstreamBaseUrlOverride: string | undefined;
        let upstreamAuthHeaderOverride: string | undefined;
        if (isCloud && cloudRegistry && requestModel) {
          const overrides = cloudRegistry.upstreamOptionsFor(requestModel);
          if (overrides) {
            upstreamBaseUrlOverride = overrides.baseUrl;
            upstreamAuthHeaderOverride = overrides.authHeader;
          }
        }
        const isStream = isObject(body) && body.stream === true;
        if (isCloud) {
          response = await withMutex(
            () => createResponse(config, responseStore, body, externalSignal, lifecycle, upstreamBaseUrlOverride, upstreamAuthHeaderOverride),
            externalSignal,
          );
        } else {
          const respSessionId = extractSessionId(request);
          response = await withMutex(
              () => withLifecycleForStreaming(
                lifecycle,
                requestModel,
                () => createResponse(config, responseStore, body, externalSignal, lifecycle, upstreamBaseUrlOverride, upstreamAuthHeaderOverride),
                isStream,
                "openai_responses",
                externalSignal,
                respSessionId,
              ),
            externalSignal,
          );
        }
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (path === "/v1/embeddings" && request.method === "POST") {
        const body = await readJson(request, logger, path);
        requestModel = readRequestModel(body);
        response = await withMutex(
          () => createEmbedding(config, body, externalSignal),
          externalSignal,
        );
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      if (
        (path === "/v1/rerank" || path === "/rerank") &&
        request.method === "POST"
      ) {
        const body = await readJson(request, logger, path);
        requestModel = readRequestModel(body);
        response = await withMutex(
          () => createRerank(config, {
            ...(isObject(body) ? body : {}),
            upstream_path: path,
          }, externalSignal),
          externalSignal,
        );
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      const responseMatch = path.match(/^\/v1\/responses\/([^/]+)$/);
      if (responseMatch) {
        const id = decodeURIComponent(responseMatch[1]);
        if (request.method === "GET") response = getResponse(responseStore, id);
        else if (request.method === "DELETE")
          response = deleteResponse(responseStore, id);
        else response = openAIError(404, "Not found");
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      const messageMatch = path.match(
        /^\/v1\/chat\/completions\/([^/]+)\/messages$/,
      );
      if (request.method === "GET" && messageMatch) {
        response = getStoredMessages(
          store,
          decodeURIComponent(messageMatch[1]),
          url,
        );
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      const completionMatch = path.match(/^\/v1\/chat\/completions\/([^/]+)$/);
      if (completionMatch) {
        const id = decodeURIComponent(completionMatch[1]);
        if (request.method === "GET") response = getStoredCompletion(store, id);
        else if (request.method === "POST")
          response = await updateStoredCompletion(
            store,
            id,
            await readJson(request, logger, path),
          );
        else if (request.method === "DELETE")
          response = deleteStoredCompletion(store, id);
        else response = openAIError(404, "Not found");
        return finalizeResponse(
          response,
          requestId,
          path,
          request.method,
          startedAt,
          startedAtMs,
          requestModel,
        );
      }
      return finalizeResponse(
        openAIError(404, "Not found"),
        requestId,
        path,
        request.method,
        startedAt,
        startedAtMs,
        requestModel,
      );
    } catch (error) {
      logger.error("request failed", {
        request_id: requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      response = errorResponse(error);
      return finalizeResponse(
        response,
        requestId,
        path,
        request.method,
        startedAt,
        startedAtMs,
        requestModel,
      );
    }

  /**
   * Forward an already-parsed request body to the cloud fallback container.
   * Used by gateway mode when a requested model is not in the local model map.
   * The body parameter is the pre-parsed JSON object (request.body is already consumed).
   */
  async function forwardToCloud(body: unknown, path: string): Promise<Response> {
    try {
      const cloudPath = config.cloudFallbackUrl!.endsWith("/v1") && path.startsWith("/v1/")
        ? path.slice(3)
        : path;
      const cloudUrl = config.cloudFallbackUrl!.replace(/\/+$/, "") + (cloudPath.startsWith("/") ? cloudPath : "/" + cloudPath);
      logger.info("forwarding to cloud", { model: (body as any)?.model, cloudUrl, path });
      const upstream = await fetch(cloudUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.requestTimeoutMs),
      });
      logger.info("cloud response", { status: upstream.status });
      // Convert to plain headers object and clone to avoid immutable fetch Headers.
      const plainHeaders: Record<string, string> = {};
      upstream.headers.forEach((value, key) => { plainHeaders[key] = value; });
      if (upstream.body) {
        return new Response(upstream.body, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: plainHeaders,
        });
      }
      // Read body with timeout — the fetch signal fires on headers, but body read can hang.
      let bodyTimeoutId: ReturnType<typeof setTimeout> | undefined;
      const bodyText = await Promise.race([
        upstream.text(),
        new Promise<string>((_, reject) => {
          bodyTimeoutId = setTimeout(() => reject(new Error('Cloud forward body read timed out')), config.requestTimeoutMs);
        }),
      ]);
      clearTimeout(bodyTimeoutId);
      return new Response(bodyText, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: plainHeaders,
      });
    } catch (err) {
      logger.error("cloud forward failed", { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

        async function finalizeResponse(
      currentResponse: Response,
      currentRequestId: string,
      currentPath: string,
      method: string,
      startedIso: string,
      startedMs: number,
      model: string | undefined,
    ): Promise<Response> {
      const finalResponse = withRelayHeaders(
        currentResponse,
        currentRequestId,
        config,
        undefined, // request available but not threaded through finalizeResponse params
      );
      await recordObservation(
        finalResponse.clone(),
        currentRequestId,
        currentPath,
        method,
        startedIso,
        startedMs,
        model,
      );
      return finalResponse;
    }

    async function recordObservation(
      currentResponse: Response,
      currentRequestId: string,
      currentPath: string,
      method: string,
      startedIso: string,
      startedMs: number,
      model: string | undefined,
    ): Promise<void> {
      try {
        const durationMs = Date.now() - startedMs;
        const streaming = (
          currentResponse.headers.get("content-type") ?? ""
        ).includes("text/event-stream");
        const requestCapture = await requestCapturePromise;
        const summaryBase = {
          request_id: currentRequestId,
          endpoint: currentPath,
          started_at: startedIso,
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          client: requestCapture.client,
          client_protocol: detectProtocol(currentPath),
          route: routeLabel(currentPath),
          method,
          model,
          model_profile: config.modelProfile,
          http_status: currentResponse.status,
          streaming,
          tool_call_count: 0,
          tool_parse_error_count: 0,
          stripped_field_count: currentResponse.headers.has("x-relay-warning")
            ? 1
            : 0,
        } as const;
        let payload: any;
        if (!streaming) {
          payload = await currentResponse.json().catch(() => undefined);
          const downstreamBytes =
            payload === undefined
              ? 0
              : Buffer.byteLength(JSON.stringify(payload));
          const upstreamBytes =
            parseHeaderInt(
              currentResponse.headers.get("x-relay-internal-upstream-bytes"),
            ) ?? 0;
          logNonStreamingResponseDiagnostics(logger, {
            route: currentPath,
            upstream_response_bytes: upstreamBytes,
            downstream_response_bytes: downstreamBytes,
          });
        }
        const detail = extractObservabilityFields(payload);
        const errorSource = classifyErrorSource(
          detail.error_type,
          detail.error_code,
        );
        const failureClassification = classifyFailure(
          detail.error_type,
          detail.error_code,
          currentResponse.status,
        );
        const upstreamStatus = readUpstreamStatus(currentResponse);
        const summary = {
          ...summaryBase,
          ...detail,
          upstream_status: upstreamStatus,
          failure_classification: failureClassification,
          request: requestCapture,
          response: {
            status_code: currentResponse.status,
            upstream_status: upstreamStatus,
            streaming,
            error_type: detail.error_type,
            error_code: detail.error_code ?? null,
            error_source: errorSource,
            failure_classification: failureClassification,
          },
        };
        observability.record(summary);
      } catch (err) {
        logger.error("observability record failed", {
          request_id: currentRequestId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return {
    handler,
    async fetch(path, init = {}) {
      const url = path.startsWith("http")
        ? path
        : `http://${config.host}:${config.port}${path}`;
      const headers = new Headers(init.headers);
      let body: BodyInit | undefined;
      if (init.body !== undefined) {
        if (
          typeof init.body === "string" ||
          init.body instanceof Uint8Array ||
          init.body instanceof ReadableStream
        ) {
          body = init.body as BodyInit;
        } else {
          headers.set("content-type", "application/json");
          body = JSON.stringify(init.body);
        }
      }
      return handler(new Request(url, { ...init, headers, body }));
    },
    async listen() {
      if (config.probeOnStartup) {
        const probed = await capabilities.refresh();
        if (config.strictStartup && !probed.upstream.reachable) {
          throw new Error(`Upstream ${config.upstreamBaseUrl} is unreachable`);
        }
      }
      const server = createServer(async (req, res) => {
        const requestId =
          nodeHeaderValue(req.headers["x-request-id"]) ?? crypto.randomUUID();
        const abortController = new AbortController();
        const onClose = () => { if (!res.writableEnded) abortController.abort(); };
        res.once('close', onClose);
        try {
          const response = await handler(
            await nodeRequestToWebRequest(req, config),
            abortController.signal,
          );
          await writeWebResponse(res, response);
        } catch (error) {
          logger.error("request failed", {
            request_id: requestId,
            error: error instanceof Error ? error.message : String(error),
          });
          await writeWebResponse(
            res,
            withRelayHeaders(errorResponse(error), requestId, config, undefined),
          );
        } finally {
          res.removeListener('close', onClose);
        }
      });
      await new Promise<void>((resolve) =>
        server.listen(config.port, config.host, resolve),
      );
      const url = `http://${formatHostForUrl(config.host)}:${config.port}`;
      logger.info("server started", { url });

      // Exposed so main.ts can close for graceful shutdown.
      const origClose = () =>
        new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      return {
        url,
        close: origClose,
        server,
      };
    },
    counts: () => jobs.counts(),
    shutdown: () => { shuttingDown = true; },
  };
}

const CORS_ALLOWED_HEADERS =
  "authorization,content-type,x-api-key,x-request-id,anthropic-version,anthropic-beta,session-id,session_id,x-session-affinity,x-client-request-id,idempotency-key";

/** Wrap an IPv6 literal in brackets for URL construction.
 *  IPv4 and hostnames are returned as-is. */
function formatHostForUrl(host: string): string {
  if (host.includes(':') && !host.startsWith('[')) {
    return `[${host}]`;
  }
  return host;
}

function optionsResponse(request: Request, config: AppConfig): Response {
  const headers: Record<string, string> = {
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": CORS_ALLOWED_HEADERS,
    "access-control-max-age": "86400",
  };
  if (config.corsOrigin) {
    headers["access-control-allow-origin"] = config.corsOrigin;
  }
  return new Response(null, {
    status: 204,
    headers,
  });
}

function withRelayHeaders(
  response: Response,
  requestId: string,
  config: AppConfig,
  request?: Request,
): Response {
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-relay-request-id", requestId);
  response.headers.set("x-relay-model-profile", activeProfile(config).id);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "no-referrer");
  // Apply CORS origin to all responses, not just OPTIONS preflight.
  if (config.corsOrigin) {
    response.headers.set("access-control-allow-origin", config.corsOrigin);
    // Reflect allowed headers when the client requests them (for preflight).
    if (request) {
      const reqHeaders = request.headers.get("access-control-request-headers");
      if (reqHeaders) {
        response.headers.set("access-control-allow-headers", CORS_ALLOWED_HEADERS);
      }
    }
  }
  return response;
}

function isUnsupportedOpenAIEndpoint(path: string): boolean {
  return [
    /^\/v1\/images(?:\/|$)/,
    /^\/v1\/audio(?:\/|$)/,
    /^\/v1\/files$/,
    /^\/v1\/batches$/,
    /^\/v1\/fine_tuning(?:\/|$)/,
    /^\/v1\/vector_stores(?:\/|$)/,
    /^\/v1\/assistants(?:\/|$)/,
    /^\/v1\/threads(?:\/|$)/,
    /^\/v1\/realtime(?:\/|$)/,
  ].some((pattern) => pattern.test(path));
}

function authorizeOpenAI(
  config: AppConfig,
  request: Request,
  path: string,
  rateLimiter?: KeyRateLimiter,
): Response | undefined {
  if (!config.apiKey || (!path.startsWith("/v1/") && path !== "/rerank"))
    return undefined;
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  const xKey = request.headers.get("x-api-key");
  const credentials = bearer ?? xKey ?? clientIp(request, config);
  if (hasValidApiKey(config.apiKey, bearer, xKey)) {
    return undefined;
  }
  if (rateLimiter && !rateLimiter.allow(credentials)) {
    return openAIError(429, "Too many requests", "rate_limit_exceeded");
  }
  return openAIError(401, "Unauthorized", "authentication_error");
}

function authorizeRelay(
  config: AppConfig,
  request: Request,
  path: string,
  rateLimiter?: KeyRateLimiter,
): Response | undefined {
  if (!config.apiKey) return undefined;
  // Protect all /relay/* paths with auth. Also protect / and /health.
  if (!path.startsWith("/relay/") && path !== "/" && path !== "/health") return undefined;
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  const xKey = request.headers.get("x-api-key");
  const credentials = bearer ?? xKey ?? clientIp(request, config);
  if (hasValidApiKey(config.apiKey, bearer, xKey)) {
    return undefined;
  }
  if (rateLimiter && !rateLimiter.allow(credentials)) {
    return openAIError(429, "Too many requests", "rate_limit_exceeded");
  }
  return openAIError(401, "Unauthorized", "authentication_error");
}

function clientIp(request: Request, config: AppConfig): string {
  if (config.trustProxy) {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      request.headers.get("x-relay-internal-remote-address") ??
      "unknown"
    );
  }
  return request.headers.get("x-relay-internal-remote-address") ?? "unknown";
}

async function readJson(
  request: Request,
  logger: ReturnType<typeof createLogger>,
  path: string,
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  const mime = contentType.split(';')[0].trim();
  if (mime !== 'application/json') {
    throw new GatewayError(400, "Content-Type must be application/json");
  }
  const text = await request.text();
  try {
    const body = parseJson(text);
    logInboundDiagnostics(logger, {
      route: path,
      provider_format: detectProviderFormat(path),
      content_length_header: request.headers.get("content-length"),
      raw_body_bytes: parseHeaderInt(
        request.headers.get("x-relay-internal-raw-body-bytes"),
      ),
      parsed_body: body,
    });
    return body;
  } catch {
    // Log diagnostics even on parse failure for debugging truncated/malformed payloads.
    logInboundDiagnostics(logger, {
      route: path,
      provider_format: detectProviderFormat(path),
      content_length_header: request.headers.get("content-length"),
      raw_body_bytes: parseHeaderInt(
        request.headers.get("x-relay-internal-raw-body-bytes"),
      ),
      raw_body_first_bytes: text.slice(0, 200),
      raw_body_last_bytes: text.slice(-200),
    } as any);
    throw invalidJsonError();
  }
}

async function nodeRequestToWebRequest(
  req: IncomingMessage,
  config: AppConfig,
): Promise<Request> {
  const chunks: Buffer[] = [];
  let totalBytes = contentLength(req);
  if (totalBytes !== undefined && totalBytes > config.maxRequestBodyBytes) {
    throw requestTooLargeError();
  }
  totalBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > config.maxRequestBodyBytes) {
      throw requestTooLargeError();
    }
    chunks.push(buffer);
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
  const headers = new Headers(req.headers as HeadersInit);
  headers.set("x-relay-internal-raw-body-bytes", String(totalBytes));
  headers.set("x-relay-internal-remote-address", req.socket?.remoteAddress ?? "unknown");
  return new Request(`http://${formatHostForUrl(config.host)}:${config.port}${req.url ?? "/"}`, {
    method: req.method,
    headers,
    body,
  });
}

function contentLength(req: IncomingMessage): number | undefined {
  const value = nodeHeaderValue(req.headers["content-length"]);
  if (!value) return undefined;
  const length = Number.parseInt(value, 10);
  return Number.isFinite(length) && length >= 0 ? length : undefined;
}

function nodeHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readRequestModel(body: unknown): string | undefined {
  return isObject(body) && typeof body.model === "string"
    ? body.model
    : undefined;
}

function extractObservabilityFields(payload: any) {
  if (!payload || typeof payload !== "object") return {};
  if (payload.error && typeof payload.error === "object") {
    return {
      error_type: payload.error.type,
      error_code: payload.error.code ?? null,
    };
  }
  if (
    payload.type === "error" &&
    payload.error &&
    typeof payload.error === "object"
  ) {
    return {
      error_type: payload.error.type,
      error_code: null,
    };
  }
  const usage =
    payload.usage && typeof payload.usage === "object"
      ? payload.usage
      : undefined;
  return {
    prompt_tokens: usage?.prompt_tokens ?? usage?.input_tokens,
    completion_tokens: usage?.completion_tokens ?? usage?.output_tokens,
    total_tokens: usage?.total_tokens,
    stop_reason:
      payload.stop_reason ?? payload.choices?.[0]?.finish_reason ?? null,
    tool_call_count: Array.isArray(payload.choices?.[0]?.message?.tool_calls)
      ? payload.choices[0].message.tool_calls.length
      : 0,
  };
}

function readUpstreamStatus(response: Response): number | null {
  const header = response.headers.get("x-relay-upstream-status");
  if (!header) return null;
  const value = Number.parseInt(header, 10);
  return Number.isFinite(value) ? value : null;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractSessionId(request: Request): string | undefined {
  return request.headers.get("session-id")
    ?? request.headers.get("session_id")
    ?? request.headers.get("x-session-affinity")
    ?? request.headers.get("x-client-request-id")
    ?? undefined;
}

function parseHeaderInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

// ── Status page ────────────────────────────────────────────────────────

/** Wraps an HTML string in a Response with text/html Content-Type. */
function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Render a human-readable status dashboard returned at the root endpoint. */
function renderStatusPage(
  config: AppConfig,
  lifecycle: ModelLifecycle,
  jobs: LlmJobQueue,
  mutex: RequestMutex | undefined,
): string {
  const status = lifecycle.getLifecycleStatus();
  const counts = jobs.counts();

  const modelRows = config.modelEntries
    ? Object.entries(config.modelEntries).map(([name, entry]) => {
        const active = status.activeModels?.find((m) => m.name === name);
        return `
          <tr>
            <td>${escHtml(name)}</td>
            <td>${active ? escHtml(active.healthy ? "\u{1F7E2} loaded" : "\u{1F7E1} loading") : "\u26AA unloaded"}</td>
            <td>${active ? escHtml(String(active.port)) : "\u2014"}</td>
            <td>${entry.ctx_size ? escHtml(formatCtx(entry.ctx_size)) : "\u2014"}</td>
            <td>${entry.multimodal ? "\u2705" : "\u274C"}</td>
          </tr>`;
      }).join("\n")
    : '<tr><td colspan="5">No model entries configured</td></tr>';

  const queueCards = [
    { label: "Pending", value: counts.pending },
    { label: "Active", value: counts.active },
    { label: "Completed (5m)", value: counts.completedRecent },
    { label: "Failed (5m)", value: counts.failedRecent },
  ];

  const lifecycleCards = [
    { label: "State", value: status.state },
    { label: "Current Model", value: status.currentModel ?? "\u2014" },
    { label: "Loading", value: status.loadingModel ?? "\u2014" },
    { label: "Starts / Stops", value: `${status.startCount ?? 0} / ${status.stopCount ?? 0}` },
    { label: "Start Failures", value: String(status.startFailureCount ?? 0) },
    { label: "Last Error", value: status.lastError ? escHtml(status.lastError) : "none" },
    { label: "Idle Shutdown", value: status.idleShutdownScheduled ? escHtml(formatDuration(status.idleShutdownMs)) : "disabled" },
    { label: "Mutex", value: mutex ? (mutex.active ? `busy (${mutex.waiting} waiting)` : "free") : "disabled" },
  ];

  const authBadge = config.apiKey ? "\u{1F510} key required" : "\u26A0\uFE0F no API key";
  const lifecycleBadge = status.enabled ? "\u2705" : "\u274C";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relay \u00B7 ${escHtml(config.host)}:${config.port}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0d1117; color: #e6edf3; margin: 0; padding: 2rem 1rem;
    line-height: 1.5;
  }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.6rem; margin: 0 0 0.5rem; color: #f0f6fc; }
  .subtitle { color: #8b949e; margin-bottom: 2rem; }
  .subtitle span { margin-right: 1rem; }
  h2 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: #f0f6fc;
       border-bottom: 1px solid #30363d; padding-bottom: 0.4rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #21262d; }
  th { color: #8b949e; font-weight: 500; font-size: 0.8rem; text-transform: uppercase; }
  td { font-size: 0.9rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.75rem; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 0.75rem; }
  .card-label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.03em; }
  .card-value { font-size: 1.25rem; font-weight: 600; margin-top: 0.15rem; }
  .card-value.small { font-size: 0.85rem; font-weight: 400; word-break: break-word; }
  .links { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #30363d; }
  .links a { color: #58a6ff; text-decoration: none; margin-right: 1rem; font-size: 0.9rem; }
  .links a:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="container">

<h1>Relay \u00B7 ${escHtml(config.host)}:${config.port}</h1>
<div class="subtitle">
  <span>${authBadge}</span>
  <span>lifecycle ${lifecycleBadge}</span>
  <span>switch: ${escHtml(config.switchPolicy ?? 'eager')}</span>
</div>

<h2>Queue</h2>
<div class="grid">
${queueCards.map((c) => `<div class="card"><div class="card-label">${escHtml(c.label)}</div><div class="card-value">${escHtml(String(c.value))}</div></div>`).join("\n")}
</div>

<h2>Models</h2>
<table>
<thead><tr><th>Model</th><th>Status</th><th>Port</th><th>Ctx</th><th>Vision</th></tr></thead>
<tbody>${modelRows}</tbody>
</table>

<h2>Lifecycle</h2>
<div class="grid">
${lifecycleCards.map((c) => `<div class="card"><div class="card-label">${escHtml(c.label)}</div><div class="card-value small">${c.value}</div></div>`).join("\n")}
</div>

<div class="links">
  <a href="/health">health</a>
  <a href="/v1/models">models</a>
  <a href="/relay/status">status</a>
  <a href="/relay/metrics">metrics</a>
  <a href="/relay/jobs">jobs</a>
  <a href="/relay/lifecycle">lifecycle</a>
  <a href="/relay/stats">stats</a>
</div>

</div>
</body>
</html>`;
}

function escHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCtx(n: number): string {
  return n >= 1024 ? `${Math.round(n / 1024)}K` : String(n);
}

function formatDuration(ms: number): string {
  if (ms >= 3_600_000) return `${Math.round(ms / 3_600_000)}h`;
  if (ms >= 60_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 1000)}s`;
}

/**
 * Wrap a streaming or non-streaming API handler with lifecycle hooks:
 * ensureModelAvailable before processing, mark started/finished around the
 * actual work, and schedule idle shutdown after completion.
 * When lifecycle is disabled, we pass through without any lifecycle overhead.
 */
async function withLifecycleForStreaming(
  lifecycle: ModelLifecycle,
  modelName: string | undefined,
  handler: () => Promise<Response>,
  isStream: boolean,
  protocol: StreamingProtocol,
  externalSignal?: AbortSignal,
  sessionId?: string,
): Promise<Response> {
  const enabled = lifecycle.getLifecycleStatus().enabled;

  // Streaming with lifecycle: send loading SSE events during model cold-start.
  // If the model is already hot, skip loading events and stream directly.
  if (enabled && isStream && modelName) {
    const status = lifecycle.getLifecycleStatus();
    // If a different model is currently loading via a graceful/eager switch,
    // reject early to avoid ping-pong switches and potential OOM on single-GPU.
    if (status.loadingModel && status.loadingModel !== modelName && status.state === 'starting') {
      return jsonResponse({
        error: {
          message: `Model "${status.loadingModel}" is currently loading. Retry "${modelName}" later.`,
          code: 'model_switching',
        },
      }, 503);
    }
    // Hot path: model is already loaded.  But we must verify session isolation
    // first — ensureModelAvailable checks session-id and restarts the model if
    // the session changed (preventing cross-session KV-cache leaks).
    if (status.modelAvailable && status.state === 'running' && status.currentModel === modelName) {
      const availability = await lifecycle.ensureModelAvailable(modelName, externalSignal, sessionId);
      // If ensureModelAvailable restarted the model (session change), fall through
      // to streamWithModelLoading so the client gets loading events.
      if (!availability.ok || status.currentModel !== modelName || status.state !== 'running') {
        return streamWithModelLoading(lifecycle, modelName, handler, protocol, externalSignal, sessionId);
      }
      lifecycle.markJobStarted();
      const response = await handler();
      // Wrap the response body so markJobFinished/maybeShutdownWhenIdle
      // fire when the SSE stream actually ends, not when the Response
      // object is returned (which happens immediately for streaming).
      if (response.body) {
        const reader = response.body.getReader();
        let streamDone = false;
        const finish = () => {
          if (streamDone) return;
          streamDone = true;
          lifecycle.markJobFinished();
          lifecycle.maybeShutdownWhenIdle();
        };
        const wrapped = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
              controller.close();
            } finally {
              reader.releaseLock();
              finish();
            }
          },
          cancel() {
            reader.cancel();
            finish();
          },
        });
        return new Response(wrapped, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      // Non-streaming fallback: no body to wrap, fire immediately.
      lifecycle.markJobFinished();
      lifecycle.maybeShutdownWhenIdle();
      return response;
    }
    return streamWithModelLoading(lifecycle, modelName, handler, protocol, externalSignal, sessionId);
  }

  // Non-streaming with lifecycle: ensure model is available first.
  // Pass the caller abort signal so a disconnected client cancels an
  // in-progress cold start (avoids wasting GPU time on orphaned starts).
  if (enabled && !isStream) {
    const availability = await lifecycle.ensureModelAvailable(modelName, externalSignal, sessionId);
    if (!availability.ok) {
      return jsonResponse({
        error: {
          message: availability.message ?? 'Model is unavailable',
          code: availability.code ?? 'model_unavailable',
        },
      }, 503);
    }
    lifecycle.markJobStarted();
    try {
      return await handler();
    } finally {
      lifecycle.markJobFinished();
      lifecycle.maybeShutdownWhenIdle();
    }
  }

  // Lifecycle disabled or no model name: simple passthrough
  return handler();
}

async function writeWebResponse(res: ServerResponse, response: Response) {
  res.writeHead(
    response.status,
    Object.fromEntries(response.headers.entries()),
  );
  if (!response.body) {
    res.end();
    return;
  }
  const reader = response.body.getReader();
  let disconnected = false;
  const onClose = () => {
    disconnected = true;
    reader.cancel().catch(() => {});
  };
  res.once('close', onClose);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || disconnected) break;
      const ok = res.write(value);
      if (!ok) {
        await new Promise<void>((resolve) => res.once('drain', resolve));
      }
    }
  } finally {
    res.removeListener('close', onClose);
    reader.releaseLock();
    if (!res.writableEnded) {
      res.end();
    }
  }
}

/**
 * For streaming requests: immediately return an SSE response that emits
 * loading events while the lifecycle ensures the model is available.
 * Once ready, the real upstream stream is piped through transparently.
 */
async function streamWithModelLoading(
  lifecycle: ModelLifecycle,
  modelName: string,
  handler: () => Promise<Response>,
  protocol: StreamingProtocol,
  externalSignal?: AbortSignal,
  sessionId?: string,
): Promise<Response> {
  const encoder = new TextEncoder();
  let loadingTimer: ReturnType<typeof setInterval> | null = null;
  const startTime = Date.now();

  const streamAbortController = new AbortController();
  let cancelled = false;

  if (externalSignal) {
    if (externalSignal.aborted) {
      streamAbortController.abort();
      cancelled = true;
    } else {
      externalSignal.addEventListener('abort', () => {
        streamAbortController.abort();
        cancelled = true;
      }, { once: true });
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emitRelayEvent = (phase: "error" | "loaded" | "loading", message?: string) => {
        const elapsedMs = Date.now() - startTime;
        controller.enqueue(encoder.encode(`: relay loading model=${modelName} elapsed_ms=${elapsedMs}\n\n`));
        controller.enqueue(encoder.encode(encodeLifecycleFrame(protocol, phase, modelName, elapsedMs, message)));
      };

      emitRelayEvent("loading");
      loadingTimer = setInterval(() => emitRelayEvent("loading"), 3000);

      try {
        const availability = await lifecycle.ensureModelAvailable(modelName, streamAbortController.signal, sessionId);

        if (loadingTimer) clearInterval(loadingTimer);

        if (streamAbortController.signal.aborted) {
          controller.close();
          return;
        }

        if (!availability.ok) {
          emitRelayEvent("error", availability.message ?? "Model unavailable");
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        emitRelayEvent("loaded");
        lifecycle.markJobStarted();
        try {
          const response = await handler();
          if (streamAbortController.signal.aborted) {
            response.body?.cancel();
            controller.close();
            return;
          }
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (streamAbortController.signal.aborted) {
                reader.cancel();
                controller.close();
                return;
              }
              controller.enqueue(value);
            }
            controller.close();
          } finally {
            reader.releaseLock();
          }
        } finally {
          lifecycle.markJobFinished();
          lifecycle.maybeShutdownWhenIdle();
        }
      } catch (err) {
        if (loadingTimer) clearInterval(loadingTimer);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          try {
            emitRelayEvent("error", message);
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch { /* stream may already be closed */ }
          try { controller.close(); } catch { /* already closed */ }
        } else {
          try { controller.close(); } catch { /* already closed */ }
        }
      }
    },

    cancel() {
      cancelled = true;
      if (loadingTimer) clearInterval(loadingTimer);
      streamAbortController.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'x-relay-loading': '1',
    },
  });
}

function encodeLifecycleFrame(
  protocol: StreamingProtocol,
  phase: "error" | "loaded" | "loading",
  model: string,
  elapsedMs: number,
  message?: string,
): string {
  const event = `relay.${phase}`;
  if (protocol === "openai_chat") {
    return encodeSSE({
      event,
      data: {
        id: `relay-${phase}-${crypto.randomUUID()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: {}, finish_reason: null }],
        relay: {
          type: event,
          model,
          elapsed_ms: elapsedMs,
          ...(message ? { message } : {}),
        },
      },
    });
  }
  return encodeSSE({
    event,
    data: {
      type: event,
      model,
      elapsed_ms: elapsedMs,
      ...(message ? { message } : {}),
    },
  });
}
