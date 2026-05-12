# Local Security Review Issue: Relay Gateway v0.1.3

**Date:** 2026-05-12  
**Reviewer:** Internal Security Review  
**Scope:** Full repository (`/Users/achumukundan/workspace/git/relay`)  
**Risk Level:** High (bordering on Critical in default Docker/systemd configurations)

---

## 1. Executive Summary

Relay is a lightweight OpenAI/Anthropic-compatible compatibility shim for local llama.cpp inference. The codebase demonstrates thoughtful protocol normalization and careful auth key handling (SHA256 + timingSafeEqual). However, **several dangerous default choices and missing production boundaries expose local inference to unauthorized clients, memory exhaustion, and cross-origin abuse.**

### Top 3 Risks
1. **Default zero-auth exposure on `0.0.0.0`** — The Docker image and systemd examples bind to all interfaces with no API key required by default.
2. **Unbounded in-memory completion/response stores** — `CompletionStore` and `ResponseStore` lack entry ceilings. An attacker (or a runaway agent) can exhaust memory in minutes.
3. **Blind cross-origin inference amplification** — CORS preflight reflects arbitrary origins and allows `authorization`/`x-api-key` headers, while actual POST responses omit `Access-Control-Allow-Origin`, creating a blind cross-origin DoS/amplification vector.

### Deployment Verdicts
| Scenario | Verdict |
|---|---|
| **Localhost-only dev shim** | Acceptable *if* operator sets `API_KEY` and monitors memory. Still needs store limits and CORS fixes. |
| **LAN exposure** | **Not safe today.** Missing auth defaults, unbounded stores, and no request-depth limits. |
| **Cloudflare Tunnel / Access** | **Not safe without fixes.** CF Access headers are explicitly CORS-allowed; unbounded stores remain exploitable. |
| **Autonomous coding agents** | **Not safe without fixes.** Agents send large tool schemas, images, and long streams. No caps on schema size, image base64, or JSON depth. |

---

## 2. Architecture / Trust Boundary Map

| Layer | Detail |
|---|---|
| **Entrypoints** | Node `http.createServer` on `HOST:PORT` (default `127.0.0.1:1234` bare metal; `0.0.0.0:1234` Docker) |
| **Accepted protocols** | HTTP/1.1; OpenAI `/v1/*`; Anthropic `/v1/messages`; Relay admin `/relay/*` |
| **Untrusted inputs** | Full HTTP request (body, headers, URL, method); upstream SSE chunks; upstream JSON responses; upstream error text; environment variables |
| **Trusted config** | `AppConfig` derived from env (upstream URL, API key, CORS origin, body-size limit, timeouts) |
| **Privileged sinks** | `fetch()` to upstream llama-server; in-memory `Map`s (`CompletionStore`, `ResponseStore`, `ObservabilityStore`); `process.stdout`/`stderr` logging |
| **Upstream dependencies** | Single configurable llama.cpp / llama-server instance |
| **Deployment assumptions** | Localhost-only; operator reads `.env.example`; no reverse proxy misconfiguration; upstream is benign |
| **Security-critical invariants** | `apiKey` check gates OpenAI/Anthropic endpoints when set; `maxRequestBodyBytes` caps incoming body size; `structuredClone` isolates stored state |

---

## 3. Detailed Findings

### Finding 1: Docker and systemd default to `0.0.0.0` with no API key required
- **Severity:** Critical
- **Confidence:** High
- **Category:** Unsafe deployment / Authentication
- **Affected files:** `Dockerfile` (lines 12–15), `docker-compose.yml` (line 12), `deploy/relay.service.example`, `deploy/relay.env.example` (line 10)
- **Description:** The Dockerfile and compose file default `HOST` to `0.0.0.0` and do not require `API_KEY`. The `.env.example` leaves `API_KEY` empty with a comment calling it “optional.” A naive `docker run` or `docker-compose up` exposes an unauthenticated OpenAI-compatible inference API on all interfaces.
- **Attack scenario:** Engineer runs `docker-compose up` on a laptop at a coffee shop. Anyone on the same network can call `/v1/chat/completions`.
- **Impact:** Unauthorized inference access; resource theft; potential data exfil via prompt injection.
- **Minimal fix:** Set `HOST=127.0.0.1` and `API_KEY=change-me-in-production` in Dockerfile/compose. Add fatal startup log if `HOST=0.0.0.0` and `API_KEY` is empty.
- **Stronger fix:** Separate dev/production compose profiles; add `--require-auth` CLI flag.

### Finding 2: Unbounded in-memory `CompletionStore` and `ResponseStore`
- **Severity:** Critical
- **Confidence:** High
- **Category:** Denial of Service / Request validation
- **Affected files:** `src/openai/chat.ts` (`CompletionStore.save()`), `src/openai/responses.ts` (`ResponseStore.save()`)
- **Description:** `save()` inserts into a `Map` with a TTL, but `prune()` only removes *expired* entries. There is no maximum number of live entries. An attacker or runaway agent can send thousands of `store: true` requests within the 1-hour TTL window and exhaust process memory.
- **Attack scenario:** Coding agent in a loop calls `POST /v1/chat/completions` with `store: true` and unique metadata. Heap grows by hundreds of megabytes.
- **Impact:** Denial of service via memory exhaustion; OOM kill of Relay and potentially the inference server.
- **Minimal fix:** Add `maxStoreEntries` limit (default 1,000) to both stores; reject new saves with `429` or silently drop oldest when full.
- **Stronger fix:** Move stored completions to optional SQLite/LevelDB backend with disk quotas.

### Finding 3: CORS preflight reflects arbitrary origin, enabling blind cross-origin inference DoS
- **Severity:** High
- **Confidence:** High
- **Category:** CORS
- **Affected files:** `src/server.ts` `optionsResponse()` (~lines 357–368)
- **Description:** When `config.corsOrigin` is unset (default), `optionsResponse` returns `access-control-allow-origin: <request Origin header>`. Non-OPTIONS responses omit ACAO, so browsers block reading the response, but the preflight *succeeds*, allowing the browser to send the actual POST with `Authorization` or `X-Api-Key` headers. If `API_KEY` is unset, any website can burn compute. If `API_KEY` is set, a phishing page that tricks the user into pasting their key can do the same.
- **Impact:** Blind cross-origin DoS / resource amplification. Cloudflare Access headers in the allow-list make this especially dangerous for CF Access deployments.
- **Minimal fix:** Never reflect `Origin`; default to no ACAO at all if `corsOrigin` is unset. Remove `cf-access-client-id` and `cf-access-client-secret` from `CORS_ALLOWED_HEADERS` unless explicitly enabled.
- **Stronger fix:** Add `corsCredentials` toggle; default `corsOrigin` to `null` and require explicit configuration.

### Finding 4: `clientIp` blindly trusts `X-Forwarded-For` / `X-Real-IP`
- **Severity:** High
- **Confidence:** High
- **Category:** Authentication / Request validation
- **Affected files:** `src/server.ts` `clientIp()` (~line 373)
- **Description:** `clientIp` extracts the leftmost value of `X-Forwarded-For` with no validation. When Relay is exposed directly (no trusted reverse proxy), an attacker can spoof any IP address, bypassing the `AuthRateLimiter` and gaining unlimited auth guesses per spoofed IP.
- **Impact:** Auth brute-force rate limiting neutralized when Relay is directly exposed.
- **Minimal fix:** Add `trustProxy` config (default `false`). When `false`, ignore `X-Forwarded-For`/`X-Real-IP` entirely and use the actual TCP remote address.
- **Stronger fix:** Accept `TRUSTED_PROXY_RANGES` env var (CIDR list).

### Finding 5: No size/depth limits on tool schemas, image base64, or JSON nesting
- **Severity:** High
- **Confidence:** High
- **Category:** Denial of Service / Request validation
- **Affected files:** `src/normalize/tools.ts`, `src/internal/anthropic-messages.ts`, `src/anthropic/messages.ts`, `src/json.ts`, `src/normalize/messages.ts`
- **Description:** Within the 1 MB default body limit, an attacker can send: (a) a tool `parameters` JSON Schema nested thousands of levels deep, (b) an Anthropic `image` block with a 1 MB base64 string, (c) a `messages` array with thousands of entries and deeply nested content parts. `sanitizeLoneSurrogates` recursively walks the entire tree; extreme depth causes stack overflow.
- **Impact:** CPU exhaustion, stack overflow, or memory pressure leading to crash.
- **Minimal fix:**
  1. Cap tool schema keys at 10,000 and depth at 32; reject with `400`.
  2. Cap total base64 image data per request at 8 MB; reject with `413`.
  3. Cap `messages` length at 10,000 and content parts per message at 100.
  4. Add JSON depth limit in `parseJson` (throw if nesting > 128).
- **Stronger fix:** Streaming/pipeline request normalization so giant payloads are rejected during parse.

### Finding 6: Upstream non-streaming responses are fully buffered with no size cap
- **Severity:** High
- **Confidence:** High
- **Category:** Upstream forwarding / DoS
- **Affected files:** `src/upstream/llama.ts` (`upstreamJson`, `upstreamHttpError`, `readUpstreamErrorDetail`), `src/openai/chat.ts`, `src/openai/embeddings.ts`, `src/anthropic/messages.ts`
- **Description:** Relay calls `.text()` or `.json()` on upstream responses without any size limit. If the upstream is compromised, misconfigured, or emits a huge error/debug page, Relay buffers the entire payload into memory. A 100 MB upstream response would OOM Relay.
- **Impact:** Denial of service via upstream-induced memory exhaustion.
- **Minimal fix:** Add `maxUpstreamResponseBytes` config (default 16 MB). Wrap upstream body reading with a size counter; abort if exceeded.
- **Stronger fix:** Use streaming JSON parser for large upstream responses where possible.

### Finding 7: SSE parser fails on `\r\n\r\n` separators, causing stream interruption DoS
- **Severity:** High
- **Confidence:** High
- **Category:** Streaming / SSE injection
- **Affected files:** `src/normalize/stream.ts` `splitFrames()` (~lines 215–225)
- **Description:** `splitFrames` splits SSE frames by looking for `\n\n` only. The SSE spec and some servers (including certain nginx/llama.cpp configurations) use `\r\n\r\n` (CRLF CRLF) as frame delimiters. Relay never splits on `\r\n\r\n`, so it buffers the entire stream and then throws `stream_interrupted` when the connection closes.
- **Impact:** All streaming requests fail with 502/`stream_interrupted`. Clients retry, amplifying load.
- **Minimal fix:** Update `splitFrames` to treat `\r\n\r\n` equivalently to `\n\n`.
- **Regression test:** SSE fixture with `\r\n\r\n` separators must parse correctly.

### Finding 8: `three` declared as production dependency
- **Severity:** High
- **Confidence:** High
- **Category:** Supply-chain
- **Affected files:** `package.json`
- **Description:** `three` (Three.js) is a large 3D graphics library with zero relevance to the gateway runtime. It is listed in `dependencies`, so `npm ci --omit=dev` installs it in production images. This bloats the attack surface and introduces supply-chain risk.
- **Impact:** Larger Docker layer, more files on disk, unnecessary postinstall/package-script attack surface, harder vulnerability scanning.
- **Minimal fix:** Move `three` to `devDependencies` alongside `vitepress`.
- **Regression test:** `npm ci --omit=dev` must not install `three`.

### Finding 9: Systemd unit runs `npm start` instead of `node` directly
- **Severity:** Medium
- **Confidence:** High
- **Category:** Unsafe deployment
- **Affected files:** `deploy/relay.service.example` (line 9)
- **Description:** `npm start` executes npm, which may run lifecycle scripts (`prestart`, `poststart`) and adds npm's own process tree. If npm or the project scripts are tampered with, the service runs attacker-controlled code. The Dockerfile correctly runs `node` directly; the systemd unit should too.
- **Minimal fix:** `ExecStart=/usr/bin/node --experimental-strip-types /opt/relay/src/main.ts`
- **Regression test:** systemd syntax validation with `systemd-analyze verify`.

### Finding 10: Missing backpressure and client-disconnect cleanup in streaming
- **Severity:** Medium
- **Confidence:** High
- **Category:** Streaming / DoS
- **Affected files:** `src/server.ts` `writeWebResponse()` (~lines 447–458)
- **Description:** `writeWebResponse` loops over the Web ReadableStream and calls `res.write(value)` without checking the return value (backpressure) and without handling `res`'s `'drain'` event. If the downstream client is slow or stalls, data accumulates in Node's internal buffer. There is also no detection of client disconnect; if the client closes the connection, Relay keeps reading the upstream SSE stream to completion.
- **Impact:** Memory pressure during slow streams; wasted upstream compute after client abandonment.
- **Minimal fix:** Handle backpressure (`if (!res.write(value)) await once(res, 'drain')`). Add an abort signal tied to the HTTP request `close` event to cancel upstream fetch when the client disconnects.
- **Regression tests:** Stream test with a 1-byte-per-second client; assert memory stays flat. Client disconnect mid-stream; assert upstream fetch is aborted.

### Finding 11: Upstream error detail can leak file paths and system info
- **Severity:** Medium
- **Confidence:** High
- **Category:** Secret leakage / Upstream forwarding
- **Affected files:** `src/upstream/llama.ts` (`readUpstreamErrorDetail`, `truncateAndRedact`), `src/redact.ts` (`redactText`)
- **Description:** When `exposeUpstreamErrors` is `true`, upstream error text is truncated to 200 chars and passed through `redactText`. `redactText` only strips bearer tokens, CF headers, API keys, and cookies. It does **not** strip file paths, hostnames, stack traces, or environment details that llama.cpp might include in error messages (e.g., `"unable to load model /home/alice/projects/secret.gguf"`).
- **Impact:** Information disclosure about host filesystem layout, user names, model file names.
- **Minimal fix:** Add a stricter redaction pass for paths (`replace(/(\/[\w/.-]{3,})/g, '[PATH]')`) or whitelist only expected upstream error patterns.
- **Regression test:** Upstream returns error containing `/home/user/.ssh/id_rsa`; Relay response must not contain the path.

### Finding 12: Request body shape is logged for malformed JSON when capture is enabled
- **Severity:** Medium
- **Confidence:** High
- **Category:** Logging / Secret leakage
- **Affected files:** `src/observability.ts` (`captureRequest`, `summarizeRawBody`), `src/server.ts` (`nodeRequestToWebRequest`)
- **Description:** When `observabilityCaptureBody` is `true`, invalid JSON bodies are summarized with `raw.slice(0, 200)` as a preview. If a client accidentally sends a raw secret in the first 200 bytes, it is logged to stdout. `captureRequest` redacts headers but not body previews.
- **Impact:** Secret leakage into logs / `journalctl`.
- **Minimal fix:** Do not include raw text previews in observability captures. Use `kind: 'invalid_json'` without a preview, or hash the preview.
- **Regression test:** Send malformed JSON starting with `secret-token-123`; assert log output does not contain the token.

### Finding 13: Capability refresh endpoint probes upstream aggressively
- **Severity:** Medium
- **Confidence:** Medium
- **Category:** DoS / Upstream forwarding
- **Affected files:** `src/capabilities.ts` `refresh()`, `src/server.ts` route `POST /relay/capabilities/refresh`
- **Description:** Refreshing capabilities makes multiple POST probes to the upstream. If called repeatedly (even by an authenticated client), it creates redundant upstream load. There is no rate limit on this endpoint distinct from the auth rate limiter.
- **Impact:** Upstream DoS via repeated capability refresh.
- **Minimal fix:** Add a separate rate limit for `/relay/capabilities/refresh` (e.g., 1 per minute per IP).
- **Regression test:** 3 rapid refreshes from same IP; 3rd must return 429.

### Finding 14: Anthropic streaming tool-call index mapping trusts upstream `index`
- **Severity:** Medium
- **Confidence:** Medium
- **Category:** Tool-call normalization
- **Affected files:** `src/anthropic/messages.ts` `streamAnthropicMessage()` (~line 204)
- **Description:** The block index for Anthropic `content_block_start` is computed as `(textStarted ? 1 : 0) + (typeof toolCall.index === 'number' ? toolCall.index : 0)`. A malicious upstream can emit inconsistent `toolCall.index` values (duplicates, negatives, gaps) causing `startedBlocks` to emit duplicate or out-of-order events.
- **Impact:** Tool-call confusion in downstream agents; potential for attacker-controlled upstream to smuggle tool calls.
- **Minimal fix:** Sanitize `toolCall.index`: reject negative values, enforce monotonic increase per stream, deduplicate `content_block_start` emissions.
- **Regression tests:** Malicious upstream emits duplicate `toolCall.index=0` twice; Relay must emit only one `content_block_start`. Negative index must be clamped/rejected.

### Finding 15: No explicit `Content-Type` enforcement on POST bodies
- **Severity:** Low
- **Confidence:** Medium
- **Category:** Request validation
- **Affected files:** `src/server.ts` `readJson()`
- **Description:** `readJson` calls `request.text()` then `parseJson()` without checking whether `content-type` is `application/json`. A request with `text/xml` or no `Content-Type` is still parsed as JSON.
- **Impact:** Low direct impact; defense-in-depth gap.
- **Minimal fix:** Reject POSTs to JSON endpoints with missing or non-JSON `Content-Type` with `400`.
- **Regression test:** POST `/v1/chat/completions` with `Content-Type: text/plain` must return 400.

### Finding 16: Gateway root endpoint lists all internal paths without auth
- **Severity:** Low
- **Confidence:** High
- **Category:** Authentication / Information disclosure
- **Affected files:** `src/server.ts` `GET /` handler
- **Description:** `GET /` returns a JSON catalog of every endpoint, including admin paths like `/relay/stats` and `/relay/requests`. This aids reconnaissance for targeted probing.
- **Impact:** Information disclosure.
- **Minimal fix:** Require auth for `/` when `apiKey` is set, or omit `/relay/*` paths from the public listing.

---

## 4. HTTP/API Surface Review

| Item | Evaluation |
|---|---|
| **Route registration** | Centralized in `server.ts` `handler`. Clean dispatch. |
| **Method handling** | Explicit per-route; unsupported methods fall through to 404. Good. |
| **Body-size limits** | `maxRequestBodyBytes` enforced in `nodeRequestToWebRequest`. Good. |
| **JSON parser behavior** | `parseJson` sanitizes lone surrogates. Good. No depth limit. **Bad.** |
| **Malformed JSON behavior** | Returns `400` with OpenAI-shaped error. Good. |
| **Unknown field handling** | Configurable (`pass_through` / `strip` / `reject`). Good. |
| **Model name handling** | Passed through without validation. No length/charset checks. |
| **Request timeout behavior** | Single global timeout (`requestTimeoutMs`, default 600 s). Very long. No per-endpoint override. |
| **Client disconnect behavior** | **Not handled.** Upstream streams continue even if client disappears. |
| **Concurrency limits** | **None.** Unlimited concurrent requests to upstream. |
| **Rate limits** | Only auth brute-force rate limiter (20/min/IP). No general request rate limiting. |
| **Health/readiness** | `GET /health` returns `{ok:true}`. No upstream health check in readiness. |
| **Error status codes** | Generally correct (400, 401, 404, 413, 502, 504). |
| **Error body leakage** | Upstream errors sanitized unless `exposeUpstreamErrors=true`. Partial redaction only. |

---

## 5. Authentication, Authorization, and Exposure Review

| Item | Evaluation |
|---|---|
| **Relay auth boundary** | Optional `apiKey`. If set, both OpenAI and Anthropic endpoints require it. Admin endpoints (`/relay/*`) require it. |
| **API key handling** | SHA256-digest comparison via `timingSafeEqual`. Good. |
| **Bearer token handling** | `Authorization: Bearer <key>` and `X-Api-Key` both accepted. Good flexibility, minor risk of `X-Api-Key` being logged in proxy logs. |
| **Cloudflare Access assumptions** | Headers explicitly CORS-allowed. No explicit CF Access validation logic. Assumes upstream or outer proxy handles CF Access. |
| **Reverse proxy header trust** | `X-Forwarded-For` and `X-Real-IP` are trusted unconditionally. **Dangerous when exposed directly.** |
| **CORS policy** | **Broken by default.** Preflight reflects any origin; actual responses omit ACAO. Blind CSRF/DoS possible. |
| **localhost vs LAN binding** | Bare metal defaults to `127.0.0.1`. **Docker/compose default to `0.0.0.0`.** |
| **Default host/port behavior** | `1234`. Well-known port makes scanning trivial. |
| **Docs encouraging unsafe exposure** | `.env.example` and `deploy/relay.env.example` say `API_KEY=` (empty). Quickstart does not scream “set API_KEY before exposing.” |
| **Upstream llama-server protection** | Assumed to be localhost-only. No auth enforcement by Relay. |

---

## 6. Upstream Forwarding / SSRF Review

| Item | Evaluation |
|---|---|
| **Upstream base URL config** | Env var `UPSTREAM_BASE_URL`. Fully trusted. |
| **Request input influencing upstream URL/path** | **No SSRF.** Paths are hardcoded constants. Only user-influenced path is `/rerank` vs `/v1/rerank`, strictly whitelisted. |
| **Arbitrary header forwarding** | Relay does **not** forward client headers to upstream. Constructs its own `RequestInit`. Good. |
| **Auth headers/secrets forwarded** | Only Relay-internal headers (`accept`, `content-type`). Client secrets are **not** forwarded. Good. |
| **Timeout/retry behavior** | Single abort timeout. No retries. |
| **Upstream error propagation** | Sanitized by default. `exposeUpstreamErrors` bypasses sanitization. |
| **Upstream status/header leakage** | `x-relay-upstream-status` header is set. Minimal leakage. |
| **Dead/malicious upstream handling** | `upstreamUnavailable` / `upstreamTimeout` returned. `strictStartup` can fail process startup. |

---

## 7. Streaming and SSE Review

| Item | Evaluation |
|---|---|
| **SSE framing correctness** | `encodeSSE` uses `\n\n`. Good for LF. **No CRLF support.** |
| **Chunk parsing** | `parseSSEStream` decodes UTF-8 and splits on `\n\n`. |
| **Malformed chunk handling** | `parseSSEJson` throws `upstreamError('bad_response')`. Caught and converted to stream error events in Anthropic/Responses streams. OpenAI stream silently swallows and closes with `[DONE]`. |
| **`[DONE]` handling** | Deduped in `ensureOpenAIStreamDone` (`!sawDone`). Good. |
| **Client disconnect cleanup** | **None.** `writeWebResponse` ignores `res` close/drain. |
| **Backpressure** | **None.** `res.write()` return value ignored. |
| **Unbounded buffering** | `splitFrames` buffer can grow to the size of one SSE frame. With no frame limit, a malicious upstream could withhold `\n\n` forever, but the fetch timeout eventually fires. |
| **Newline injection** | `encodeSSE` uses `JSON.stringify` for data, which escapes newlines. `frame.event` is hardcoded in all callers except parsed upstream events. In `parseSSEBlock`, event lines are split by `\n`, so embedded newlines in an upstream `event:` field would be parsed as separate lines. Low risk because event is trimmed. |
| **Event/data field injection** | Low risk; `parseSSEBlock` only recognizes `event:` and `data:` prefixes. |
| **Anthropic vs OpenAI stream compatibility** | Generally correct. Tool-call deltas are normalized. |
| **Reasoning/tool-call chunk corruption** | No explicit reasoning-token handling in stream path. Tool indices from upstream are trusted. |

---

## 8. Tool-Call Normalization Review

| Item | Evaluation |
|---|---|
| **OpenAI tool schema acceptance** | Accepts standard function tools. Rejects `custom` tools. |
| **Anthropic tool_use normalization** | Maps to OpenAI `function` tools. `input_schema` becomes `parameters`. |
| **Forced tool_choice handling** | Supports `auto`, `none`, `required`, and named function/tool. Good. |
| **Malformed arguments** | `parseToolArguments` validates JSON and object shape. Good. |
| **Huge tool schemas** | **No size or depth validation.** |
| **Duplicate tool names** | **Not checked.** |
| **Invalid JSON arguments** | Returns 502 with clean message. Good. |
| **Tool-call ID handling** | Missing IDs are synthesized as `call_<name>_<index>` with sanitized names. Good. |
| **Streamed tool-call deltas** | OpenAI deltas forwarded. Anthropic deltas converted to `input_json_delta`. |
| **Attacker masquerading as trusted tool calls** | Upstream tool calls are normalized but not validated against the request tool list. A malicious upstream could return arbitrary tool names. |
| **Downstream agent safety** | Relay preserves enough structure for agents to enforce safety, but does not validate that returned tool names match declared tools. |

---

## 9. Reasoning / Thinking Token Handling Review

| Item | Evaluation |
|---|---|
| **Hidden reasoning preservation** | `reasoningMode` config exists (`off`, `raw`, `parsed`, `preserve`). Default is `off`. |
| **Reasoning content leakage** | Profile and config define modes, but the actual **stream and non-stream paths do not implement reasoning extraction** from upstream responses. Reasoning content is either passed through or dropped depending on upstream template, not Relay logic. |
| **Reasoning markers confusing parsers** | Not explicitly handled. If upstream embeds `\n\n` tags in text, they are forwarded verbatim. |
| **Model output spoofing reasoning/tool boundaries** | No validation of reasoning markers. A model could emit fake `\n\n` blocks that downstream agents interpret as reasoning. |
| **Config mode safety** | Default `off` is safe. `preserve` may leak reasoning to clients. |
| **Test coverage** | No tests found for reasoning preserve/strip/normalize behavior in reviewed test files. |

---

## 10. Logging and Observability Review

| Item | Evaluation |
|---|---|
| **Request logging** | JSON-line structured logging via `logger.ts`. |
| **Response logging** | Observability store captures status, streaming flag, error types. |
| **Header logging** | Headers are redacted via `redactForLogs` before logging. Good. |
| **Secret redaction** | Bearer, CF Access, API keys, cookies redacted. **File paths and stack traces are not.** |
| **API key redaction** | Good in headers; good in nested objects. |
| **Cloudflare Access header redaction** | Explicitly handled in `isSensitiveKey`. Good. |
| **Prompt/body logging** | `logPrompts` flag exists. `observabilityCaptureBody` logs body *shape* but not full content for valid JSON. **Invalid JSON previews leak first 200 chars.** |
| **Terminal ANSI escape injection** | `JSON.stringify` escapes control characters. Safe from direct injection. |
| **Log forging through newlines** | `JSON.stringify` escapes newlines. Safe. |
| **Correlation/request IDs** | `x-request-id` / `x-relay-request-id` propagated. Good. |
| **Metrics exposure** | `/relay/stats` and `/relay/requests` expose aggregated data. Protected by auth when key is set. |

---

## 11. Deployment / systemd / Ops Review

| Item | Evaluation |
|---|---|
| **systemd hardening** | **Minimal.** No `PrivateTmp`, `NoNewPrivileges`, `ProtectSystem`, `ProtectHome`, `RestrictAddressFamilies`. |
| **Service user permissions** | Runs as `relay` user. Good. |
| **Filesystem access** | `WorkingDirectory=/opt/relay`. No explicit read-only restrictions. |
| **Env file permissions** | Example comments say `chmod 600`. Not enforced by scripts. |
| **Restart behavior** | `Restart=always`. Good for availability, bad if crash-looping under attack. |
| **Network binding** | `ExecStart=/usr/bin/npm start`. Should be `node` directly. |
| **Firewall assumptions** | None documented. |
| **Reverse proxy examples** | Not present in reviewed docs. |
| **Scripts touching `/etc`** | `render-systemd.sh` tells user to `sudo cp`. Safe. `deploy-to-opt.sh` syncs to `/opt/relay`. Should verify git ref. |
| **Smoke scripts leaking secrets** | `doctor.ts` shows `api_key: 'configured'` not the raw key. Good. But it sends the raw key in HTTP headers to the Relay endpoint. |
| **Production readiness** | **Not production-ready.** Missing: rate limits, memory bounds, proxy header trust, HSTS, CSP, readiness probe checking upstream health. |

---

## 12. Dependency and Supply-Chain Review

| Item | Evaluation |
|---|---|
| **package manager lockfiles** | `package-lock.json` present. |
| **Dependency risk** | `three` in `dependencies` is unnecessary and high-surface-area. |
| **Package scripts** | `npm start` uses `node --env-file=.env --experimental-strip-types src/main.ts`. No postinstall scripts in runtime deps. |
| **Postinstall behavior** | `npm ci --ignore-scripts` used in Dockerfile. Good. |
| **Dynamic imports** | None observed in runtime code. |
| **Dev dependencies used in runtime** | `vitepress`, `@chenglou/pretext`, `@types/*` are dev-only. Good. |
| **GitHub Actions** | `docs.yml` only builds docs. Low risk. |
| **Release scripts** | None observed. |
| **Generated docs** | Vitepress static site. Standard. |
| **Vendored code** | None. |

---

## 13. Prioritized Fix Plan

| Priority | Fix | Risk Reduced | Estimated Effort | Files Likely Touched |
|---|---|---|---|---|
| **P0** | Default Docker/systemd to `HOST=127.0.0.1` and fatal-startup if `0.0.0.0` without `API_KEY` | Critical exposure eliminated | 30 min | `Dockerfile`, `docker-compose.yml`, `src/config.ts`, `src/main.ts` |
| **P0** | Add `maxStoreEntries` cap to `CompletionStore` and `ResponseStore` | Memory DoS eliminated | 1 hr | `src/openai/chat.ts`, `src/openai/responses.ts`, `src/config.ts` |
| **P0** | Cap image base64 size and tool schema depth/keys in request validation | Memory/stack DoS eliminated | 2 hrs | `src/normalize/tools.ts`, `src/internal/anthropic-messages.ts`, `src/anthropic/messages.ts`, `src/config.ts` |
| **P1** | Stop reflecting `Origin` in CORS preflight; default to no ACAO unless configured | Blind cross-origin DoS eliminated | 30 min | `src/server.ts` |
| **P1** | Trust-proxy toggle for `X-Forwarded-For`; default `false` | Rate limit bypass eliminated | 1 hr | `src/server.ts`, `src/config.ts` |
| **P1** | Add `maxUpstreamResponseBytes` and abort on oversized upstream bodies | Upstream-induced OOM eliminated | 1 hr | `src/upstream/llama.ts`, `src/config.ts` |
| **P1** | Move `three` to `devDependencies` | Supply-chain bloat removed | 5 min | `package.json` |
| **P2** | Fix SSE parser to handle `\r\n\r\n` | Stream compatibility restored | 30 min | `src/normalize/stream.ts` |
| **P2** | Handle backpressure and client disconnect in `writeWebResponse` | Resource exhaustion reduced | 1 hr | `src/server.ts` |
| **P2** | Harden systemd unit (`ProtectSystem`, `PrivateTmp`, `ExecStart=node`) | Host compromise blast radius reduced | 30 min | `deploy/relay.service.example` |
| **P2** | Add rate limit to `/relay/capabilities/refresh` | Upstream probing DoS reduced | 30 min | `src/server.ts` |
| **P3** | Add Content-Type enforcement on JSON endpoints | Protocol confusion reduced | 30 min | `src/server.ts` |
| **P3** | Redact file paths in upstream error messages | Info leak reduced | 30 min | `src/redact.ts` |

---

## 14. Security Regression Test Plan

```typescript
// 1. unauthenticated request exposure test
test('docker defaults require auth or bind localhost', async () => { ... });

// 2. CORS preflight test
test('CORS preflight does not reflect arbitrary origin', async () => {
  const res = await app.fetch('/v1/chat/completions', { method: 'OPTIONS', headers: { origin: 'https://evil.com' } });
  assert.notEqual(res.headers.get('access-control-allow-origin'), 'https://evil.com');
});

// 3. oversized JSON body test
test('body > maxRequestBodyBytes returns 413', async () => { ... });

// 4. malformed JSON test
test('malformed JSON returns 400 without calling upstream', async () => { ... });

// 5. malformed OpenAI chat request
test('invalid role returns 400', async () => { ... });

// 6. malformed Anthropic messages request
test('anthropic invalid max_tokens missing returns 400', async () => { ... });

// 7. malicious model name test
test('model name with control chars is rejected or sanitized', async () => { ... });

// 8. huge tools array test
test('tools array > 100 entries rejected', async () => { ... });

// 9. duplicate tool names test
test('duplicate tool names rejected', async () => { ... });

// 10. malformed streamed tool-call deltas
test('duplicate upstream toolCall.index does not emit duplicate content_block_start', async () => { ... });

// 11. upstream timeout test
test('upstream timeout returns 504', async () => { ... });

// 12. malicious upstream SSE chunk test
test('upstream CRLF separators parse correctly', async () => { ... });
test('upstream sends 100 MB response; relay returns 502 without OOM', async () => { ... });

// 13. client disconnect during stream
test('client disconnect aborts upstream fetch', async () => { ... });

// 14. newline/SSE injection test
test('upstream data containing \\n\\n does not split frames incorrectly', async () => { ... });

// 15. ANSI/log injection test
test('upstream error containing ANSI escapes is escaped in JSON log line', async () => { ... });

// 16. secret-bearing header redaction test
test('logs do not contain bearer token or x-api-key', async () => { ... });

// 17. Cloudflare Access header handling test
test('CF Access headers are redacted in logs and not forwarded upstream', async () => { ... });

// 18. reasoning preservation/stripping tests
test('reasoningMode=off strips reasoning blocks from upstream text', async () => { ... });

// 19. upstream error leakage test
test('upstream error with file path is redacted in client response', async () => { ... });
```

---

## 15. Final Verdict

### What must be fixed before using Relay as a localhost-only dev shim?
- Set `API_KEY` and do not commit `.env` with a real key.
- Cap `CompletionStore`/`ResponseStore` entries (unbounded memory growth is unacceptable even on localhost).
- Cap tool schema size and image base64 size (agent tools can be huge).

### What must be fixed before using Relay with coding agents?
- All localhost fixes, plus:
- Fix CORS origin reflection (agents may run in browser extensions or web UIs).
- Add JSON depth limit (agents send deeply nested tool schemas).
- Fix SSE CRLF handling (some proxy chains transform LF to CRLF).
- Add client disconnect/backpressure handling (agents open long streams).

### What must be fixed before exposing Relay on LAN?
- All agent fixes, plus:
- Docker/systemd **must not** default to `0.0.0.0` without auth.
- Add `trustProxy` toggle and ignore `X-Forwarded-For` by default.
- Add general request rate limiting (not just auth brute-force).
- Harden systemd unit with `ProtectSystem`, `PrivateTmp`, etc.

### What must be fixed before exposing Relay through Cloudflare Tunnel?
- All LAN fixes, plus:
- Remove CF Access headers from default CORS allow-list (or make it opt-in).
- Add `maxUpstreamResponseBytes` (tunnel exposure means upstream errors can be weaponized remotely).

### What must be fixed before calling Relay production-ready?
- All tunnel fixes, plus:
- Separate read-only filesystem enforcement.
- Structured readiness/liveness probes that check upstream health.
- Metrics endpoint with no sensitive data.
- Production-grade logging without any raw body previews.
- Automated security regression tests in CI.
- Dependency audit (remove `three`, review lockfile integrity).

---

*This issue is filed locally and should not be disclosed publicly until maintainers have triaged and remediated the Critical/High findings.*
