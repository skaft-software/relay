/**
 * Relay setup logic — pure functions for config, model catalog, GPU probing,
 * and start-script generation. No UI code. Imported by both the TUI (setup.ts)
 * and tests.
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { packageDir, envFilePath, startScriptsDir, ensureDataDir } from './paths.ts';
import { sizeModel, buildLaunchFlags, GB } from './sizing/size-model.ts';

// ── Types ───────────────────────────────────────────────────────────────

export type CatalogEntry = {
  id: string;
  label: string;
  family: string;
  lane: string;
  ctx: number;
  vision: boolean;
  thinking: 'off' | 'on' | 'toggle';
  quant: string;
  size_gb?: number;
  download_url?: string;
  filename?: string;
  moe?: boolean;
  arch?: string;
  expert_count?: number;
  active_experts?: number;
};

export type EnvMap = Map<string, string>;

export type GpuProbe = {
  gpu_type: string;
  driver: string;
  vram_total_gb: number;
  vram_free_gb: number;
};

export type FitClass = 'full-gpu' | 'partial-offload' | 'too-large' | 'unknown';

export type CloudflareInfo = {
  installed: boolean;
  version?: string;
  certPresent: boolean;
  tunnels: Array<{ id: string; name: string }>;
  serviceActive: boolean;
};

export type Deployment = { serviceActive: boolean; dockerPresent: boolean };

// ── Constants ───────────────────────────────────────────────────────────

export const PKG = packageDir();
export const ENV_PATH = envFilePath();
export const EXAMPLE_PATH = resolve(PKG, '.env.example');
export const CATALOG_PATH = resolve(PKG, 'docs', 'model-catalog.json');
export const START_SCRIPTS_DIR = startScriptsDir();
export const PROBE_GPU_PATH = resolve(PKG, 'scripts', 'probe-gpu.sh');
export const PKG_PATH = resolve(PKG, 'package.json');
export const DOCTOR_SCRIPT = resolve(PKG, 'scripts', 'doctor.ts');

export const SYSTEM_RAM_GB = detectSystemRamGb();

// ── Version ─────────────────────────────────────────────────────────────

export function relayVersion(): string {
  try {
    return (JSON.parse(readFileSync(PKG_PATH, 'utf8')) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// ── Env file I/O ────────────────────────────────────────────────────────

export function parseEnv(text: string): EnvMap {
  const env = new Map<string, string>();
  for (const line of text.split('\n')) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    env.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return env;
}

export function writeEnv(path: string, env: EnvMap): void {
  const original = readFileSync(path, 'utf8').split('\n');
  const seen = new Set<string>();
  const next = original.map((line) => {
    if (!line || line.trimStart().startsWith('#')) return line;
    const idx = line.indexOf('=');
    if (idx <= 0) return line;
    const key = line.slice(0, idx);
    if (!env.has(key)) return line;
    seen.add(key);
    return `${key}=${env.get(key) ?? ''}`;
  });
  for (const [key, value] of env.entries()) {
    if (!seen.has(key)) next.push(`${key}=${value}`);
  }
  writeFileSync(path, `${next.join('\n').replace(/\n+$/, '')}\n`);
}

export function seedEnv(): EnvMap {
  if (!existsSync(ENV_PATH) && existsSync(EXAMPLE_PATH)) {
    ensureDataDir();
    copyFileSync(EXAMPLE_PATH, ENV_PATH);
  }
  return existsSync(ENV_PATH) ? parseEnv(readFileSync(ENV_PATH, 'utf8')) : new Map<string, string>();
}

export function endpoint(env: EnvMap): string {
  return `http://${env.get('HOST') ?? '127.0.0.1'}:${env.get('PORT') ?? '1234'}/v1`;
}

// ── Catalog ─────────────────────────────────────────────────────────────

export function readCatalog(): CatalogEntry[] {
  if (!existsSync(CATALOG_PATH)) return [];
  return JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as CatalogEntry[];
}

// ── GPU probing ─────────────────────────────────────────────────────────

export function probeGpu(): GpuProbe | undefined {
  if (!existsSync(PROBE_GPU_PATH)) return undefined;
  try {
    const raw = execFileSync('bash', [PROBE_GPU_PATH], { cwd: PKG, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const parsed = JSON.parse(raw) as GpuProbe;
    if (!parsed || typeof parsed.vram_total_gb !== 'number') return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function classifyFit(model: CatalogEntry, gpu: GpuProbe): FitClass {
  return classifyFitFromCatalog(model, gpu);
}

/** Catalog-aware classifier. Uses moe/arch/expert_count when available for
  * expert-offloading awareness, falling back to simple VRAM+RAM buckets. */
export function classifyFitFromCatalog(model: CatalogEntry, gpu: GpuProbe): FitClass {
  const estimate = model.size_gb;
  if (!estimate || !gpu.vram_total_gb) return 'unknown';
  const gpuBudget = Math.max(0, gpu.vram_total_gb - 2);
  const ramBudget = Math.max(0, SYSTEM_RAM_GB - 8);

  // Full GPU fit (dense or small MoE) — whole file fits
  if (estimate <= gpuBudget) return 'full-gpu';

  // MoE-aware check: can we offload experts via --cpu-moe / --n-cpu-moe?
  if (model.moe === true) {
    const nonexRatio: number = (model.active_experts != null && model.expert_count != null && model.expert_count > 0)
      ? model.active_experts / model.expert_count
      : (model.active_experts != null && model.active_experts <= 8 ? 0.10
        : (model.expert_count != null && model.expert_count >= 128 ? 0.06 : 0.10));
    const nonexGb = estimate * nonexRatio;
    // The non-expert (shared) portion stays on GPU; experts go to DRAM.
    if (nonexGb <= gpuBudget && estimate <= gpuBudget + ramBudget) {
      return 'partial-offload';
    }
    return 'too-large';
  }

  // Dense model: traditional VRAM + RAM bucket logic
  const combinedBudget = Math.max(gpuBudget, gpuBudget + ramBudget);
  return estimate <= combinedBudget ? 'partial-offload' : 'too-large';
}

export function recommendedContext(model: CatalogEntry, gpu?: GpuProbe): number {
  if (!gpu) return model.ctx;
  const fit = classifyFit(model, gpu);
  if (fit === 'full-gpu') return model.ctx;
  if (fit === 'partial-offload') return Math.min(model.ctx, 65_536);
  return Math.min(model.ctx, 32_768);
}

export function fitLabel(fit: FitClass): string {
  if (fit === 'full-gpu') return 'fits GPU';
  if (fit === 'partial-offload') return 'partial offload';
  if (fit === 'too-large') return 'too large';
  return 'fit unknown';
}

export function fmtCtx(ctx: number): string {
  return ctx >= 1024 ? `${Math.round(ctx / 1024)}k` : String(ctx);
}

// ── System detection ────────────────────────────────────────────────────

export function detectSystemRamGb(): number {
  try {
    if (process.platform === 'linux') {
      const meminfo = readFileSync('/proc/meminfo', 'utf8');
      const match = /^MemTotal:\s+(\d+)\s+kB/m.exec(meminfo);
      if (match) return Math.round(Number(match[1]) / 1024 / 1024);
    }
    if (process.platform === 'darwin') {
      const bytes = Number(execFileSync('sysctl', ['-n', 'hw.memsize'], { encoding: 'utf8' }).trim());
      if (Number.isFinite(bytes)) return Math.round(bytes / 1024 / 1024 / 1024);
    }
  } catch { /* best-effort */ }
  return 0;
}

export function detectLlamaServerPath(): string {
  const candidates = [
    process.env.RELAY_LLAMA_SERVER_PATH,
    '/usr/local/bin/llama-server',
    resolveHome('~/llama.cpp/build/bin/llama-server'),
    resolveHome('~/llama.cpp/build-vulkan/bin/llama-server'),
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return 'llama-server';
}

export function detectCloudflare(): CloudflareInfo {
  const info: CloudflareInfo = { installed: false, certPresent: false, tunnels: [], serviceActive: false };
  info.installed = Boolean(commandPath('cloudflared'));
  info.certPresent = existsSync(resolve(process.env.HOME ?? '', '.cloudflared', 'cert.pem'));
  if (info.installed) {
    try {
      const v = execFileSync('cloudflared', ['--version'], { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] });
      info.version = v.trim().split(/\s+/)[2];
    } catch { /* ignore */ }
    try {
      const raw = execFileSync('cloudflared', ['tunnel', 'list', '--output', 'json'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
      const parsed = JSON.parse(raw) as Array<{ id: string; name: string }>;
      if (Array.isArray(parsed)) info.tunnels = parsed.map((t) => ({ id: t.id, name: t.name }));
    } catch { /* not logged in or none */ }
  }
  try {
    const state = execFileSync('systemctl', ['is-active', 'cloudflared'], { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    info.serviceActive = state === 'active';
  } catch { /* inactive / not present */ }
  return info;
}

export function detectDeployment(): Deployment {
  const out: Deployment = { serviceActive: false, dockerPresent: Boolean(commandPath('docker')) };
  try {
    const state = execFileSync('systemctl', ['is-active', 'relay'], { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    out.serviceActive = state === 'active';
  } catch { /* inactive / not present */ }
  return out;
}

// ── Helpers ─────────────────────────────────────────────────────────────

export function resolveHome(inputPath: string): string {
  if (inputPath === '~') return process.env.HOME ?? inputPath;
  if (inputPath.startsWith('~/')) return resolve(process.env.HOME ?? '', inputPath.slice(2));
  return inputPath;
}

export function commandPath(command: string): string | undefined {
  try {
    return execFileSync('which', [command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

export function ensureApiKey(env: EnvMap): void {
  if (!env.get('API_KEY') || env.get('API_KEY') === 'change-me-in-production') {
    env.set('API_KEY', randomBytes(24).toString('hex'));
  }
}

export function shEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

// ── Start script generation ─────────────────────────────────────────────

export function generateStartScript(input: {
  modelId: string;
  modelLabel: string;
  modelPath: string;
  llamaServerPath: string;
  ctxSize: number;
  multimodal: boolean;
  fit: FitClass;
  launchFlags?: string[];
}): string {
  mkdirSync(START_SCRIPTS_DIR, { recursive: true });
  const scriptPath = resolve(START_SCRIPTS_DIR, `start-${input.modelId}.sh`);
  const maybeVisionComment = input.multimodal ? '# Vision model: add --mmproj /path/to/mmproj.gguf before first real use.\n' : '';

  let flagsBlock: string;
  if (input.launchFlags && input.launchFlags.length > 0) {
    // Real flags from size-model.py — the single source of truth
    const lines: string[] = [
      '--model "$MODEL" \\',
      '--host 127.0.0.1 \\',
      '--port "$LLAMA_PORT" \\',
    ];
    // Re-pair flags: size-model.py emits flat [--flag, value, ...]
    let i = 0;
    while (i < input.launchFlags.length) {
      const flag = input.launchFlags[i]!;
      if (flag.startsWith('--') && i + 1 < input.launchFlags.length && !input.launchFlags[i + 1]!.startsWith('--')) {
        lines.push(`  ${flag} ${input.launchFlags[i + 1]} \\`);
        i += 2;
      } else {
        lines.push(`  ${flag} \\`);
        i += 1;
      }
    }
    flagsBlock = lines.join('\n');
  } else {
    // Fallback template — model not yet downloaded. Uses sensible defaults.
    const maybeMoEComment = input.fit === 'partial-offload'
      ? '# Relay: after downloading, run \'relay provision --apply\' or re-run setup to tune flags\n'
      : '';
    flagsBlock = `${maybeMoEComment}  --model "$MODEL" \\
  --host 127.0.0.1 \\
  --port "$LLAMA_PORT" \\
  --ctx-size ${input.ctxSize} \\
  -ngl 99 \\
  --parallel 1 \\
  --flash-attn on \\
  --cache-type-k q4_0 \\
  --cache-type-v q4_0 \\
  --jinja`;
  }

  const script = `#!/usr/bin/env bash
set -euo pipefail

# Relay generated start script for ${input.modelLabel}
LLAMA_PORT="\${LLAMA_PORT:-8080}"
MODEL=${shEscape(input.modelPath)}
LLAMA_SERVER=${shEscape(input.llamaServerPath)}
${maybeVisionComment}
if [[ ! -f "$MODEL" ]]; then
  echo "Relay model file not found: $MODEL" >&2
  exit 1
fi

exec "$LLAMA_SERVER" \\
${flagsBlock}
`;
  writeFileSync(scriptPath, script);
  chmodSync(scriptPath, 0o755);
  return scriptPath;
}

// ── Model download ──────────────────────────────────────────────────────

export function downloadModel(model: CatalogEntry, modelDir: string): string {
  if (!model.download_url) throw new Error(`No download_url configured for ${model.id}`);
  mkdirSync(modelDir, { recursive: true });
  const filename = model.filename ?? model.download_url.split('/').pop() ?? `${model.id}.gguf`;
  const destination = resolve(modelDir, filename);
  if (existsSync(destination)) return destination;
  const downloader = commandPath('curl') ? 'curl' : commandPath('wget') ? 'wget' : undefined;
  if (!downloader) throw new Error('curl or wget is required to download models');
  if (downloader === 'curl') {
    execFileSync('curl', ['-fL', '--continue-at', '-', '-o', destination, model.download_url], { stdio: 'inherit' });
  } else {
    execFileSync('wget', ['-c', '-O', destination, model.download_url], { stdio: 'inherit' });
  }
  return destination;
}

// ── Hardware-aware sizing (pure TS, no Python dependency) ──────────────

export type SizeModelResult = {
  maxCtx: number;
  launchFlags: string[];
  expertFlag: string;
  nCpuMoe: number;
  headroomPct: number;
  kvGb: number;
};

/** Call the TS sizing engine against a downloaded GGUF. Returns null on failure. */
export function sizeModelTS(ggufPath: string, vramGb: number, dramGb: number): SizeModelResult | null {
  try {
    const { result } = sizeModel(ggufPath, Math.trunc(vramGb * GB), Math.trunc(dramGb * GB));
    if (!result.ok) return null;
    const { launchFlags, expertFlag } = buildLaunchFlags(result);
    return {
      maxCtx: result.bestCtx,
      launchFlags,
      expertFlag,
      nCpuMoe: result.nCpuMoe,
      headroomPct: Math.round(result.headroomPct * 100) / 100,
      kvGb: Math.round(result.kvGb * 10000) / 10000,
    };
  } catch {
    return null;
  }
}

// ── Config actions (pure env manipulation, no UI) ───────────────────────

export function configureQuickstart(
  env: EnvMap,
  selections: CatalogEntry[],
  modelPaths: Map<string, string>,
  llamaServerPath: string,
  modelDir: string,
  gpu?: GpuProbe,
): void {
  const modelEntries: Record<string, { cmd: string; ctx_size: number; multimodal: boolean; thinking_levels?: string[]; expert_flag?: string }> = {};
  const defaultModel = selections[0]!;
  for (const model of selections) {
    const modelPath = modelPaths.get(model.id)!;
    let ctxSize = recommendedContext(model, gpu);
    let launchFlags: string[] | undefined;
    let expertFlag: string | undefined;

    // If the GGUF is on disk, use the real TS sizing engine for optimal flags
    if (existsSync(modelPath)) {
      const vramGb = gpu?.vram_total_gb ?? 0;
      const dramGb = SYSTEM_RAM_GB - (gpu ? 2 : 0); // keep OS headroom
      const tuned = sizeModelTS(modelPath, vramGb, dramGb);
      if (tuned) {
        ctxSize = tuned.maxCtx;
        launchFlags = tuned.launchFlags;
        expertFlag = tuned.expertFlag || undefined;
      }
    }

    const scriptPath = generateStartScript({
      modelId: model.id,
      modelLabel: model.label,
      modelPath,
      llamaServerPath,
      ctxSize,
      multimodal: model.vision,
      fit: gpu ? classifyFit(model, gpu) : 'unknown',
      launchFlags,
    });
    const entry: Record<string, unknown> = {
      cmd: scriptPath,
      ctx_size: ctxSize,
      multimodal: model.vision,
      ...(model.thinking === 'on' ? { thinking_levels: ['on'] } : {}),
      ...(model.thinking === 'toggle' ? { thinking_levels: ['on', 'off'] } : {}),
    };
    if (expertFlag) entry.expert_flag = expertFlag;
    modelEntries[model.id] = entry as typeof modelEntries[string];
  }

  env.set('RELAY_MODE', 'gateway');
  env.set('RELAY_MODEL_LIFECYCLE_ENABLED', 'true');
  env.set('RELAY_SWITCH_POLICY', 'eager');
  env.set('DEFAULT_MODEL', defaultModel.id);
  env.set('UPSTREAM_CTX_SIZE', String(recommendedContext(defaultModel, gpu)));
  env.set('RELAY_REPO_DIR', PKG);
  env.set('RELAY_MODEL_DIR', modelDir);
  env.set('RELAY_LLAMA_SERVER_PATH', llamaServerPath);
  env.set('RELAY_MODEL_FILE_HINT', resolve(modelDir, defaultModel.filename ?? `${defaultModel.id}.gguf`));
  env.set('RELAY_SWITCH_MAX_WARM_MODELS', '1');
  ensureApiKey(env);
  env.set('RELAY_MODEL_MAP', JSON.stringify(modelEntries));
}

export function configureBYO(env: EnvMap, baseUrl: string, model: string, ctx: string): void {
  env.set('RELAY_MODE', 'gateway');
  env.set('RELAY_MODEL_LIFECYCLE_ENABLED', 'false');
  env.set('RELAY_MODEL_MAP', '{}');
  env.set('UPSTREAM_BASE_URL', baseUrl.replace(/\/+$/, ''));
  env.set('DEFAULT_MODEL', model);
  env.set('UPSTREAM_CTX_SIZE', ctx);
  ensureApiKey(env);
}

export function configureCloud(env: EnvMap, model: string, apiKey: string): void {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
  env.set('RELAY_MODE', 'cloud');
  env.set('GEMINI_API_KEY', apiKey.trim());
  ensureApiKey(env);
  env.set('RELAY_CLOUD_MODELS', JSON.stringify({
    [model]: { base_url: baseUrl, auth_env: 'GEMINI_API_KEY', ctx_size: 1_048_576 },
  }));
  env.set('DEFAULT_MODEL', model);
}

export function configureNetwork(env: EnvMap, mode: 'local' | 'expose'): void {
  if (mode === 'expose') {
    ensureApiKey(env);
    env.set('HOST', '0.0.0.0');
    env.set('TRUST_PROXY', 'true');
    if (!env.get('RELAY_ALLOWED_HOSTS')) env.set('RELAY_ALLOWED_HOSTS', '');
  } else {
    env.set('HOST', '127.0.0.1');
  }
}

// ── Model label helpers ─────────────────────────────────────────────────

export function modelCapabilities(model: CatalogEntry): string {
  const caps: string[] = [];
  if (model.lane === 'code') caps.push('coding');
  if (model.lane === 'reasoning') caps.push('reasoning');
  if (model.lane === 'general') caps.push('general');
  if (model.lane === 'long') caps.push('long context');
  if (model.vision) caps.push('vision');
  if (model.thinking !== 'off') caps.push('thinking');
  return caps.join(', ');
}

export function fitIcon(fit: FitClass): { icon: string; color: string } {
  if (fit === 'full-gpu') return { icon: '✓', color: '\x1b[32m' };
  if (fit === 'partial-offload') return { icon: '⚠', color: '\x1b[33m' };
  if (fit === 'too-large') return { icon: '✗', color: '\x1b[31m' };
  return { icon: '○', color: '\x1b[2m' };
}
