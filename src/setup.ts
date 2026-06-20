import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

type CatalogEntry = {
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
};

type EnvMap = Map<string, string>;
type GpuProbe = {
  gpu_type: string;
  driver: string;
  vram_total_gb: number;
  vram_free_gb: number;
};

type FitClass = 'full-gpu' | 'partial-offload' | 'too-large' | 'unknown';

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = resolve(DIR, '.env');
const EXAMPLE_PATH = resolve(DIR, '.env.example');
const CATALOG_PATH = resolve(DIR, 'docs', 'model-catalog.json');
const START_SCRIPTS_DIR = resolve(DIR, 'start-scripts');
const PROBE_GPU_PATH = resolve(DIR, 'scripts', 'probe-gpu.sh');

const MODEL_VRAM_ESTIMATES: Record<string, number> = {
  'devstral-2-24b': 14,
  'gemma-4-26b': 14,
  'gemma-4-26b-q2': 10,
  'gemma-4-26b-q4': 16,
  'gemma-4-31b': 18,
  'glm-4.7-flash': 9,
  'glm-4.7-flash-iq3': 7,
  'glm-4.7-flash-q2': 8,
  'glm-4.7-flash-q4km': 13,
  'glm-4.7-flash-q4xl': 14,
  'hypernova-60b-q2': 29,
  'north-mini-code': 6,
  'qwen3.6-27b': 11,
  'qwen3-thinking-30b': 12,
  'qwen3.6-35b-a3b': 8,
  'qwen3.6-35b-a3b-mtp': 9,
  'qwen3.6-35b-a3b-q2': 12,
  'qwen3.6-35b-a3b-q3': 16,
  'qwen3.6-35b-a3b-q4': 21,
  'qwen3-coder-30b': 13,
  'qwen3-coder-30b-q3': 14,
  'qwen3-coder-30b-q4': 17,
  'qwen3-coder-next': 18,
  'qwen3-coder-next-iq2': 22,
  'qwen3-next-80b': 25,
};

const SYSTEM_RAM_GB = detectSystemRamGb();

// ── ANSI helpers ────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function line(text = ''): void {
  output.write(text + '\n');
}

function section(title: string): void {
  line();
  line(`  ${C.bold}${C.cyan}◆ ${title}${C.reset}`);
  line(`  ${C.dim}${'─'.repeat(Math.min(title.length + 4, 56))}${C.reset}`);
}

function check(text: string): void {
  line(`  ${C.green}✔${C.reset} ${text}`);
}

function warn(text: string): void {
  line(`  ${C.yellow}⚠${C.reset} ${text}`);
}

function info(text: string): void {
  line(`  ${C.blue}ｉ${C.reset} ${text}`);
}

function fail(text: string): void {
  line(`  ${C.red}✘${C.reset} ${text}`);
}

// ── Main ────────────────────────────────────────────────────────────────

export async function runSetup(): Promise<void> {
  const rl = createInterface({ input, output });
  try {
    banner();

    // Seed .env from example if missing
    if (!existsSync(ENV_PATH) && existsSync(EXAMPLE_PATH)) {
      copyFileSync(EXAMPLE_PATH, ENV_PATH);
      check('.env created from .env.example');
    }

    const env = parseEnv(readFileSync(ENV_PATH, 'utf8'));

    const mode = await choose(rl, 'How do you want to use Relay?', [
      { label: 'Quick start — pick a model, auto-configure', value: 'quickstart' },
      { label: 'Connect an existing OpenAI-compatible server', value: 'byo' },
      { label: 'Cloud fallback (Gemini, etc.)', value: 'cloud' },
      { label: 'Exit', value: 'exit' },
    ]);
    if (mode === 'exit') {
      line(`\n  ${C.dim}Bye!${C.reset}\n`);
      return;
    }

    section('Configuration');
    if (mode === 'quickstart') {
      await setupQuickstart(rl, env);
    } else if (mode === 'byo') {
      await setupBYO(rl, env);
    } else if (mode === 'cloud') {
      await setupCloud(rl, env);
    }

    if (await askYes(rl, 'Set up a Cloudflare Tunnel endpoint after this?', 'n')) {
      setupCloudflareTunnel(env);
    }

    writeEnv(ENV_PATH, env);
    printSummary(mode, env);
  } finally {
    rl.close();
  }
}

// ── Quickstart (preset model) ──────────────────────────────────────────

async function setupQuickstart(rl: ReturnType<typeof createInterface>, env: EnvMap): Promise<void> {
  const catalog = readCatalog();
  const gpu = probeGpu();
  const modelDir = resolveHome(await ask(rl, 'Model directory', env.get('RELAY_MODEL_DIR') ?? resolveHome('~/models')));
  const llamaServerPath = resolveHome(await ask(
    rl,
    'Path to llama-server',
    env.get('RELAY_LLAMA_SERVER_PATH') ?? detectLlamaServerPath(),
  ));

  if (gpu) {
    info(`Detected ${gpu.gpu_type}/${gpu.driver} with ${gpu.vram_total_gb} GB VRAM; system RAM estimate ${SYSTEM_RAM_GB} GB`);
  } else {
    warn('GPU probe unavailable; showing the full model catalog');
  }

  const topology = await choose(rl, 'Relay model topology', [
    { label: 'Single model — simplest, one default model', value: 'single' },
    { label: 'Multi model — cold-start and switch by requested model', value: 'multi' },
  ]);
  if (topology === 'exit') return;

  const lanes = [
    { label: 'General purpose', value: 'general' },
    { label: 'Coding', value: 'code' },
    { label: 'Reasoning', value: 'reasoning' },
    { label: 'Vision', value: 'vision' },
    { label: 'Long context', value: 'long' },
    { label: 'All models', value: '__all__' },
  ];

  const laneChoice = await choose(rl, 'Pick a category', lanes);
  if (laneChoice === 'exit') return;

  let filtered = laneChoice === '__all__' ? catalog : catalog.filter((m) => m.lane === laneChoice || m.lane.startsWith(laneChoice));
  if (filtered.length === 0) {
    filtered = catalog;
    info(`No models in "${laneChoice}", showing all`);
  }
  if (gpu?.vram_total_gb && laneChoice !== '__all__') {
    const fitting = filtered.filter((m) => classifyFit(m, gpu) !== 'too-large');
    if (fitting.length > 0) {
      filtered = fitting;
      info(`Filtered to ${filtered.length} model(s) that should fit full-GPU or partial-offload on this machine`);
    }
  }

  const selections = topology === 'multi'
    ? await chooseMultiModelSet(rl, filtered, gpu)
    : [await chooseOneModel(rl, 'Pick a model', filtered, gpu)].filter((m): m is CatalogEntry => Boolean(m));
  if (selections.length === 0) return;

  const modelEntries: Record<string, { cmd: string; ctx_size: number; multimodal: boolean; thinking_levels?: string[] }> = {};
  let defaultModel = selections[0]!;
  for (const model of selections) {
    const defaultModelPath = resolve(modelDir, model.filename ?? `${model.id}.gguf`);
    const shouldDownload = model.download_url
      ? await askYes(rl, `Download ${model.label} now${model.size_gb ? ` (~${model.size_gb} GB)` : ''}?`, 'n')
      : false;
    const modelPath = shouldDownload
      ? await downloadModel(model, modelDir)
      : await ask(rl, `Path to ${model.id} GGUF`, defaultModelPath);
    const ctxSize = recommendedContext(model, gpu);
    const scriptPath = generateStartScript({
      modelId: model.id,
      modelLabel: model.label,
      modelPath,
      llamaServerPath,
      ctxSize,
      multimodal: model.vision,
      fit: gpu ? classifyFit(model, gpu) : 'unknown',
    });

    modelEntries[model.id] = {
      cmd: scriptPath,
      ctx_size: ctxSize,
      multimodal: model.vision,
      ...(model.thinking === 'on' ? { thinking_levels: ['on'] } : {}),
      ...(model.thinking === 'toggle' ? { thinking_levels: ['on', 'off'] } : {}),
    };
  }

  env.set('RELAY_MODE', 'gateway');
  env.set('RELAY_MODEL_LIFECYCLE_ENABLED', 'true');
  env.set('RELAY_SWITCH_POLICY', 'eager');
  env.set('DEFAULT_MODEL', defaultModel.id);
  env.set('UPSTREAM_CTX_SIZE', String(recommendedContext(defaultModel, gpu)));
  env.set('RELAY_REPO_DIR', DIR);
  env.set('RELAY_MODEL_DIR', modelDir);
  env.set('RELAY_LLAMA_SERVER_PATH', llamaServerPath);
  env.set('RELAY_MODEL_FILE_HINT', resolve(modelDir, defaultModel.filename ?? `${defaultModel.id}.gguf`));
  env.set('RELAY_SWITCH_MAX_WARM_MODELS', '1');
  ensureApiKey(env);
  env.set('RELAY_MODEL_MAP', JSON.stringify(modelEntries));

  check(`Default model set to ${C.bold}${defaultModel.id}${C.reset}`);
  check(`Lifecycle enabled (idle shutdown after 10 min)`);
  check(`${selections.length} model map entr${selections.length === 1 ? 'y' : 'ies'} configured`);
  if (selections.some((m) => m.vision)) {
    warn('Vision models usually need an mmproj file; add it to the generated script before first run');
  }
  info(`Change models later by editing ${ENV_PATH} or re-running setup`);
}

// ── Bring your own server ──────────────────────────────────────────────

async function setupBYO(rl: ReturnType<typeof createInterface>, env: EnvMap): Promise<void> {
  const baseUrl = await ask(rl, 'Upstream URL (e.g. http://127.0.0.1:8080/v1)', env.get('UPSTREAM_BASE_URL') ?? 'http://127.0.0.1:8080/v1');
  const model = await ask(rl, 'Default model name', env.get('DEFAULT_MODEL') ?? 'local-model');
  const ctx = await ask(rl, 'Context size (tokens)', env.get('UPSTREAM_CTX_SIZE') ?? '32768');

  env.set('RELAY_MODE', 'gateway');
  env.set('RELAY_MODEL_LIFECYCLE_ENABLED', 'false');
  env.set('RELAY_MODEL_MAP', '{}');
  env.set('UPSTREAM_BASE_URL', trimSlash(baseUrl));
  env.set('DEFAULT_MODEL', model);
  env.set('UPSTREAM_CTX_SIZE', ctx);
  ensureApiKey(env);

  check(`Upstream: ${C.bold}${baseUrl}${C.reset}`);
  check(`Default model: ${C.bold}${model}${C.reset}`);
  check(`Lifecycle disabled (always-on server mode)`);
}

// ── Cloud fallback (Gemini) ────────────────────────────────────────────

async function setupCloud(rl: ReturnType<typeof createInterface>, env: EnvMap): Promise<void> {
  const model = await ask(rl, 'Model name', env.get('DEFAULT_MODEL') ?? 'gemini-2.5-flash');
  const apiKey = await ask(rl, 'API key', env.get('GEMINI_API_KEY') ?? '');
  if (!apiKey.trim()) {
    fail('API key is required');
    return;
  }

  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
  env.set('RELAY_MODE', 'cloud');
  env.set('GEMINI_API_KEY', apiKey.trim());
  ensureApiKey(env);
  env.set('RELAY_CLOUD_MODELS', JSON.stringify({
    [model]: { base_url: baseUrl, auth_env: 'GEMINI_API_KEY', ctx_size: 1_048_576 },
  }));
  env.set('DEFAULT_MODEL', model);

  check(`Model: ${C.bold}${model}${C.reset}`);
  check(`Cloud mode enabled (Gemini)`);
}

function setupCloudflareTunnel(env: EnvMap): void {
  ensureApiKey(env);
  env.set('HOST', '0.0.0.0');
  env.set('TRUST_PROXY', 'true');
  if (!env.get('RELAY_ALLOWED_HOSTS')) {
    env.set('RELAY_ALLOWED_HOSTS', '');
  }
  check('Cloudflare Tunnel profile enabled in docker-compose.yml');
  check('API key required for public access');
  info('Quick tunnel: docker compose --profile public up -d tunnel');
  info('Permanent DNS tunnel: cloudflared tunnel login && cloudflared tunnel create relay');
}

// ── Output ─────────────────────────────────────────────────────────────

function banner(): void {
  line();
  line(`  ${C.bold}${C.cyan}  ╭──────────────────────╮${C.reset}`);
  line(`  ${C.bold}${C.cyan}  │  Relay Setup Wizard   │${C.reset}`);
  line(`  ${C.bold}${C.cyan}  ╰──────────────────────╯${C.reset}`);
  line();
  line(`  ${C.dim}Configure your local AI gateway in a few steps.${C.reset}`);
  line();
}

function printSummary(mode: string, env: EnvMap): void {
  section('All set!');

  const host = env.get('HOST') ?? '127.0.0.1';
  const port = env.get('PORT') ?? '1234';
  const defaultModel = env.get('DEFAULT_MODEL') ?? '(none)';
  const relayMode = env.get('RELAY_MODE') ?? 'gateway';
  const lifecycle = env.get('RELAY_MODEL_LIFECYCLE_ENABLED') === 'true' ? 'on' : 'off';
  const apiKey = env.get('API_KEY') ?? '(unset)';

  line(`  ${C.bold}Summary${C.reset}`);
  line(`    Mode:       ${relayMode}`);
  line(`    Endpoint:   ${C.cyan}http://${host}:${port}/v1${C.reset}`);
  line(`    Model:      ${defaultModel}`);
  line(`    Lifecycle:  ${lifecycle === 'on' ? `${C.green}on${C.reset}` : 'off'}`);
  line(`    API key:    ${apiKey === '(unset)' ? apiKey : `${apiKey.slice(0, 8)}…`}`);

  line();
  line(`  ${C.bold}${C.green}▶ Next steps${C.reset}`);
  line();

  if (mode === 'quickstart') {
    line(`    ${C.dim}1.${C.reset} Place the GGUF file at: ${C.cyan}${env.get('RELAY_MODEL_FILE_HINT') ?? resolve(env.get('RELAY_MODEL_DIR') ?? resolveHome('~/models'), `${defaultModel}.gguf`)}${C.reset}`);
    line(`    ${C.dim}2.${C.reset} Review the script:      ${C.cyan}${resolve(START_SCRIPTS_DIR, `start-${defaultModel}.sh`)}${C.reset}`);
    line(`    ${C.dim}3.${C.reset} Start Relay locally:    ${C.bold}npm start${C.reset}`);
    line(`    ${C.dim}4.${C.reset} Optional Docker proxy:  ${C.bold}docker compose up -d${C.reset}`);
  } else if (mode === 'byo') {
    line(`    ${C.dim}1.${C.reset} Make sure your server is running at ${C.cyan}${env.get('UPSTREAM_BASE_URL')}${C.reset}`);
    line(`    ${C.dim}2.${C.reset} Start Relay:            ${C.bold}npm start${C.reset}`);
  } else if (mode === 'cloud') {
    line(`    ${C.dim}1.${C.reset} Start Relay:            ${C.bold}npm start${C.reset}`);
  }

  line();
  line(`    ${C.dim}Then point your agent to:${C.reset}`);
  line(`    ${C.cyan}    http://${host}:${port}/v1${C.reset}`);
  line();
  line(`    ${C.dim}Run setup again anytime:${C.reset}`);
  line(`    ${C.dim}    node src/main.ts setup${C.reset}`);
  line();
}

// ── Helpers ────────────────────────────────────────────────────────────

async function choose(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  options: Array<{ label: string; value: string }>,
): Promise<string> {
  const exitOption = { label: `${C.dim}(exit)${C.reset}`, value: 'exit' };
  const allOptions = [...options, exitOption];

  line(`  ${C.bold}${prompt}${C.reset}`);
  allOptions.forEach((opt, i) => {
    const label = opt.label.replace(/\x1b\[[0-9;]*m/g, '').length > 60
      ? opt.label
      : opt.label;
    line(`    ${C.dim}${i + 1}.${C.reset} ${label}`);
  });

  while (true) {
    const raw = await rl.question(`  ${C.cyan}›${C.reset} `);
    const index = Number.parseInt(raw.trim(), 10);
    if (Number.isFinite(index) && index >= 1 && index <= allOptions.length) return allOptions[index - 1]!.value;
    if (raw.trim().toLowerCase() === 'exit' || raw.trim() === 'q') return 'exit';
  }
}

async function ask(rl: ReturnType<typeof createInterface>, label: string, fallback: string): Promise<string> {
  const raw = await rl.question(`  ${label} ${C.dim}[${fallback}]${C.reset}: `);
  return raw.trim() || fallback;
}

async function askYes(rl: ReturnType<typeof createInterface>, label: string, fallback: 'y' | 'n' = 'n'): Promise<boolean> {
  const suffix = fallback === 'y' ? '[Y/n]' : '[y/N]';
  const raw = await rl.question(`  ${label} ${C.dim}${suffix}${C.reset}: `);
  const answer = (raw.trim() || fallback).toLowerCase();
  return answer === 'y' || answer === 'yes';
}

// ── File I/O ──────────────────────────────────────────────────────────

function readCatalog(): CatalogEntry[] {
  if (!existsSync(CATALOG_PATH)) {
    warn(`Model catalog not found at ${CATALOG_PATH}`);
    return [];
  }
  return JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as CatalogEntry[];
}

function parseEnv(text: string): EnvMap {
  const env = new Map<string, string>();
  for (const line of text.split('\n')) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    env.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return env;
}

function writeEnv(path: string, env: EnvMap): void {
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

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function fmtCtx(ctx: number): string {
  return ctx >= 1024 ? `${Math.round(ctx / 1024)}k` : String(ctx);
}

async function chooseOneModel(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  models: CatalogEntry[],
  gpu?: GpuProbe,
): Promise<CatalogEntry | undefined> {
  const modelId = await choose(rl, prompt, models.map((m) => ({
    label: modelLabel(m, gpu),
    value: m.id,
  })));
  if (!modelId || modelId === 'exit') return undefined;
  return models.find((m) => m.id === modelId);
}

async function chooseMultiModelSet(
  rl: ReturnType<typeof createInterface>,
  models: CatalogEntry[],
  gpu?: GpuProbe,
): Promise<CatalogEntry[]> {
  const mode = await choose(rl, 'How should multi-model setup choose models?', [
    { label: 'Recommended set — general + code + reasoning when available', value: 'recommended' },
    { label: 'Manual picks — choose models one at a time', value: 'manual' },
  ]);
  if (mode === 'exit') return [];

  if (mode === 'recommended') {
    const lanes = ['general', 'code', 'reasoning', 'vision'];
    const picked = new Map<string, CatalogEntry>();
    for (const lane of lanes) {
      const match = models.find((m) =>
        !picked.has(m.id) &&
        (m.lane === lane || m.lane.startsWith(lane)) &&
        (!gpu || classifyFit(m, gpu) !== 'too-large')
      );
      if (match) picked.set(match.id, match);
    }
    const selected = [...picked.values()];
    if (selected.length > 0) {
      info(`Recommended set: ${selected.map((m) => m.id).join(', ')}`);
      return selected;
    }
    warn('No recommended models fit; switching to manual selection');
  }

  const selected: CatalogEntry[] = [];
  const remaining = [...models];
  while (remaining.length > 0) {
    const next = await chooseOneModel(
      rl,
      selected.length === 0 ? 'Pick first model' : 'Pick another model',
      remaining,
      gpu,
    );
    if (!next) break;
    selected.push(next);
    const index = remaining.findIndex((m) => m.id === next.id);
    if (index >= 0) remaining.splice(index, 1);
    if (!(await askYes(rl, 'Add another model?', selected.length < 3 ? 'y' : 'n'))) break;
  }
  return selected;
}

function modelLabel(model: CatalogEntry, gpu?: GpuProbe): string {
  const estimate = model.size_gb ?? MODEL_VRAM_ESTIMATES[model.id];
  const fit = gpu ? fitLabel(classifyFit(model, gpu)) : 'fit unknown';
  return `${model.label}  ${C.dim}${fmtCtx(model.ctx)} ctx  ${model.quant}  ~${estimate ?? '?'} GB  ${fit}${model.vision ? '  vision' : ''}${model.thinking !== 'off' ? '  thinking' : ''}${C.reset}`;
}

function fitLabel(fit: FitClass): string {
  if (fit === 'full-gpu') return 'full GPU';
  if (fit === 'partial-offload') return 'partial GPU';
  if (fit === 'too-large') return 'too large';
  return 'fit unknown';
}

function probeGpu(): GpuProbe | undefined {
  if (!existsSync(PROBE_GPU_PATH)) return undefined;
  try {
    const raw = execFileSync('bash', [PROBE_GPU_PATH], { cwd: DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const parsed = JSON.parse(raw) as GpuProbe;
    if (!parsed || typeof parsed.vram_total_gb !== 'number') return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function classifyFit(model: CatalogEntry, gpu: GpuProbe): FitClass {
  const estimate = model.size_gb ?? MODEL_VRAM_ESTIMATES[model.id];
  if (!estimate || !gpu.vram_total_gb) return 'unknown';
  const gpuBudget = Math.max(0, gpu.vram_total_gb - 2);
  if (estimate <= gpuBudget) return 'full-gpu';
  const combinedBudget = Math.max(gpuBudget, gpu.vram_total_gb + Math.max(0, SYSTEM_RAM_GB - 8));
  return estimate <= combinedBudget ? 'partial-offload' : 'too-large';
}

function recommendedContext(model: CatalogEntry, gpu?: GpuProbe): number {
  if (!gpu) return model.ctx;
  const fit = classifyFit(model, gpu);
  if (fit === 'full-gpu') return model.ctx;
  if (fit === 'partial-offload') return Math.min(model.ctx, model.ctx >= 98_304 ? 65_536 : model.ctx);
  return Math.min(model.ctx, 32_768);
}

async function downloadModel(model: CatalogEntry, modelDir: string): Promise<string> {
  if (!model.download_url) throw new Error(`No download_url configured for ${model.id}`);
  mkdirSync(modelDir, { recursive: true });
  const filename = model.filename ?? model.download_url.split('/').pop() ?? `${model.id}.gguf`;
  const destination = resolve(modelDir, filename);
  if (existsSync(destination)) {
    check(`Model already exists at ${destination}`);
    return destination;
  }
  const downloader = commandPath('curl') ? 'curl' : commandPath('wget') ? 'wget' : undefined;
  if (!downloader) throw new Error('curl or wget is required to download models');
  info(`Downloading ${model.label} to ${destination}`);
  if (downloader === 'curl') {
    execFileSync('curl', ['-fL', '--continue-at', '-', '-o', destination, model.download_url], { stdio: 'inherit' });
  } else {
    execFileSync('wget', ['-c', '-O', destination, model.download_url], { stdio: 'inherit' });
  }
  return destination;
}

function commandPath(command: string): string | undefined {
  try {
    return execFileSync('which', [command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

function detectSystemRamGb(): number {
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
  } catch {
    // Best-effort sizing only.
  }
  return 0;
}

function detectLlamaServerPath(): string {
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

function ensureApiKey(env: EnvMap): void {
  if (!env.get('API_KEY') || env.get('API_KEY') === 'change-me-in-production') {
    env.set('API_KEY', randomBytes(24).toString('hex'));
  }
}

function resolveHome(inputPath: string): string {
  if (inputPath === '~') return process.env.HOME ?? inputPath;
  if (inputPath.startsWith('~/')) return resolve(process.env.HOME ?? '', inputPath.slice(2));
  return inputPath;
}

function shEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function generateStartScript(input: {
  modelId: string;
  modelLabel: string;
  modelPath: string;
  llamaServerPath: string;
  ctxSize: number;
  multimodal: boolean;
  fit: FitClass;
}): string {
  mkdirSync(START_SCRIPTS_DIR, { recursive: true });
  const scriptPath = resolve(START_SCRIPTS_DIR, `start-${input.modelId}.sh`);
  const maybeVisionComment = input.multimodal ? '# Vision model: add --mmproj /path/to/mmproj.gguf before first real use.\n' : '';
  const maybePartialComment = input.fit === 'partial-offload'
    ? '# Partial-offload profile: tune -ngl after first successful load if VRAM has headroom.\n'
    : '';
  const gpuLayers = input.fit === 'partial-offload' ? 35 : 99;
  const script = `#!/usr/bin/env bash
set -euo pipefail

# Relay generated start script for ${input.modelLabel}
LLAMA_PORT="\${LLAMA_PORT:-8080}"
MODEL=${shEscape(input.modelPath)}
LLAMA_SERVER=${shEscape(input.llamaServerPath)}
${maybeVisionComment}
${maybePartialComment}

if [[ ! -f "$MODEL" ]]; then
  echo "Relay model file not found: $MODEL" >&2
  exit 1
fi

exec "$LLAMA_SERVER" \\
  --model "$MODEL" \\
  --host 127.0.0.1 \\
  --port "$LLAMA_PORT" \\
  --ctx-size ${input.ctxSize} \\
  --jinja \\
  --parallel 1 \\
  -ngl ${gpuLayers}
`;
  writeFileSync(scriptPath, script);
  chmodSync(scriptPath, 0o755);
  return scriptPath;
}
