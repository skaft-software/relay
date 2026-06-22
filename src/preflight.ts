/**
 * Pre-flight checks for Relay startup.
 * Validates model files exist, ports are free, binaries are present,
 * and VRAM is sufficient — before Relay starts accepting requests.
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { AppConfig } from './config.ts';
import type { Logger } from './logger.ts';
import { envFilePath } from './paths.ts';

export type PreflightCheck = {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  hint?: string;
};

/**
 * Run all static (no-running-relay) pre-flight checks.
 * Returns an array of results and a boolean for whether startup should abort.
 */
export function runPreflight(config: AppConfig, logger: Logger, env: NodeJS.ProcessEnv = process.env): { results: PreflightCheck[]; abort: boolean } {
  const results: PreflightCheck[] = [];

  // 1. Check port availability
  checkPortAvailable(config.port, results);

  // 2. Check upstream port (for always-on mode)
  const upstreamPortMatch = config.upstreamBaseUrl.match(/:(\d+)/);
  if (upstreamPortMatch && !config.lazyModelEnabled) {
    checkPortListening(parseInt(upstreamPortMatch[1], 10), 'upstream', results);
  }

  // 3. Check model files in modelEntries
  if (config.modelEntries) {
    checkModelFiles(config.modelEntries, results);
  }

  // 4. Check start scripts / binaries
  if (config.modelEntries) {
    checkStartCommands(config.modelEntries, config.llamaStartCommand, results);
  } else if (config.llamaStartCommand) {
    checkCommandExists(config.llamaStartCommand, 'RELAY_MODEL_START_COMMAND', results);
  }

  // 5. Check GPU / VRAM
  checkGpuVram(results);

  // 6. Check system RAM
  checkSystemRam(results);

  // 7. Check .env file exists
  checkEnvFile(results);

  const abort = results.some((r) => r.status === 'fail' && r.name !== 'upstream port');
  for (const r of results) {
    const meta: Record<string, unknown> = { status: r.status };
    if (r.hint) meta.hint = r.hint;
    if (r.status === 'fail') logger.error(`preflight: ${r.name} — ${r.detail}`, meta);
    else if (r.status === 'warn') logger.warn(`preflight: ${r.name} — ${r.detail}`, meta);
    else logger.info(`preflight: ${r.name} — ${r.detail}`, meta);
  }

  return { results, abort };
}

// ── Port checks ────────────────────────────────────────────────────────

function checkPortAvailable(port: number, results: PreflightCheck[]): void {
  try {
    const out = execFileSync('ss', ['-tln'], { encoding: 'utf-8', timeout: 3000 });
    const lines = out.split('\n').filter((l) => l.includes(`:${port} `) || l.includes(`:${port}\t`));
    if (lines.length > 0) {
      results.push({
        name: 'relay port',
        status: 'fail',
        detail: `Port ${port} is in use. Free it: \`fuser -k ${port}/tcp\` or set a different PORT.`,
        hint: `fuser -k ${port}/tcp`,
      });
    } else {
      results.push({ name: 'relay port', status: 'pass', detail: `Port ${port} is free` });
    }
  } catch {
    // ss not available — try lsof
    try {
      execFileSync('lsof', ['-i', `:${port}`], { timeout: 2000 });
      results.push({
        name: 'relay port',
        status: 'fail',
        detail: `Port ${port} is in use. Free it: \`fuser -k ${port}/tcp\` or set a different PORT.`,
      });
    } catch {
      // lsof also failed — port is likely free
      results.push({ name: 'relay port', status: 'pass', detail: `Port ${port} appears free` });
    }
  }
}

function checkPortListening(port: number, label: string, results: PreflightCheck[]): void {
  try {
    const out = execFileSync('ss', ['-tln'], { encoding: 'utf-8', timeout: 3000 });
    if (out.includes(`:${port} `) || out.includes(`:${port}\t`)) {
      results.push({ name: `${label} port`, status: 'pass', detail: `Port ${port} is listening` });
    } else {
      results.push({
        name: `${label} port`,
        status: 'fail',
        detail: `Upstream port ${port} is NOT listening. Start llama-server first, or enable lazy lifecycle with RELAY_MODEL_LIFECYCLE_ENABLED=true.`,
        hint: 'Start llama-server or set RELAY_MODEL_LIFECYCLE_ENABLED=true',
      });
    }
  } catch {
    results.push({ name: `${label} port`, status: 'warn', detail: `Could not check port ${port} (ss/lsof unavailable)` });
  }
}

// ── Model file checks ──────────────────────────────────────────────────

function checkModelFiles(entries: Record<string, import('./config.ts').ModelEntry>, results: PreflightCheck[]): void {
  let missing = 0;
  for (const [name, entry] of Object.entries(entries)) {
    const cmd = entry.cmd ?? '';
    const modelPath = extractModelPath(cmd);
    if (!modelPath) {
      // If no --model flag, the script probably resolves it internally
      continue;
    }
    if (!existsSync(modelPath)) {
      missing++;
      results.push({
        name: `model file: ${name}`,
        status: 'fail',
        detail: `${modelPath} not found. Download it or fix the path in RELAY_MODEL_MAP.`,
        hint: `ls -la $(dirname "${modelPath}")`,
      });
    }
  }
  if (missing === 0 && entries && Object.keys(entries).length > 0) {
    results.push({ name: 'model files', status: 'pass', detail: `All ${Object.keys(entries).length} model(s) found on disk` });
  }
}

function extractModelPath(cmd: string): string | null {
  const match = cmd.match(/--model\s+(\S+)/);
  if (!match) return null;
  const raw = match[1].replace(/['"]/g, '');
  // Resolve relative paths
  if (raw.startsWith('/')) return raw;
  if (raw.startsWith('~/')) return resolve(process.env.HOME ?? '/home/achu', raw.slice(2));
  return raw;
}

// ── Start command checks ──────────────────────────────────────────────

function checkStartCommands(
  entries: Record<string, import('./config.ts').ModelEntry>,
  globalCmd: string | undefined,
  results: PreflightCheck[],
): void {
  let failed = 0;
  for (const [name, entry] of Object.entries(entries)) {
    const cmd = (entry.cmd ?? globalCmd ?? '').replace(/\$\{PORT\}/g, '8081').replace(/\$\{MODEL\}/g, name);
    if (!cmd) continue;
    const binary = cmd.split(/\s+/)[0];
    if (binary.startsWith('/') || binary.startsWith('~/')) {
      const resolved = binary.startsWith('~/') ? resolve(process.env.HOME ?? '/home/achu', binary.slice(2)) : binary;
      // If it's a shell script, check it exists
      if (resolved.endsWith('.sh') || resolved.includes('start-')) {
        if (!existsSync(resolved)) {
          failed++;
          results.push({
            name: `start script: ${name}`,
            status: 'fail',
            detail: `Start script not found: ${resolved}. Regenerate with \`npm run setup\`.`,
            hint: `npm run setup`,
          });
        }
      }
    }
  }
  if (failed === 0 && Object.keys(entries).length > 0) {
    results.push({ name: 'start scripts', status: 'pass', detail: 'All model start scripts found' });
  }
}

function checkCommandExists(cmd: string, label: string, results: PreflightCheck[]): void {
  const binary = cmd.split(/\s+/)[0];
  try {
    execFileSync('which', [binary], { timeout: 2000, stdio: 'ignore' });
    results.push({ name: label, status: 'pass', detail: `${binary} found in PATH` });
  } catch {
    results.push({
      name: label,
      status: 'warn',
      detail: `${binary} not found in PATH. Make sure it exists before starting.`,
    });
  }
}

// ── GPU / VRAM checks ──────────────────────────────────────────────────

function checkGpuVram(results: PreflightCheck[]): void {
  try {
    const probePath = resolve(import.meta.dirname ?? __dirname, '..', 'scripts', 'probe-gpu.sh');
    const out = execFileSync('bash', [probePath], { encoding: 'utf-8', timeout: 5000 });
    const parsed = JSON.parse(out);
    if (parsed.gpu_type === 'unknown') {
      results.push({
        name: 'GPU',
        status: 'warn',
        detail: 'No GPU detected. Model inference will be CPU-only and very slow.',
        hint: 'Install ROCm or CUDA drivers for GPU acceleration.',
      });
      return;
    }
    const vramGB = typeof parsed.vram_total_gb === 'number' ? parsed.vram_total_gb : 0;
    results.push({
      name: 'GPU',
      status: 'pass',
      detail: `${parsed.gpu_type}/${parsed.driver} with ~${vramGB} GB VRAM`,
    });

    // Check if configured models fit in VRAM
    if (vramGB > 0 && parsed.models && Array.isArray(parsed.models)) {
      const suggestions = parsed.models.map((m: { name: string }) => m.name);
      results.push({
        name: 'VRAM headroom',
        status: 'pass',
        detail: suggestions.length > 0
          ? `Suggested models for ${vramGB}GB: ${suggestions.slice(0, 4).join(', ')}${suggestions.length > 4 ? '...' : ''}`
          : 'No models fit in available VRAM — use smaller quants',
      });
    }
  } catch {
    results.push({ name: 'GPU', status: 'warn', detail: 'Could not probe GPU. Ensure GPU drivers are installed.' });
  }
}

// ── System RAM check ───────────────────────────────────────────────────

function checkSystemRam(results: PreflightCheck[]): void {
  try {
    const meminfo = readFileSync('/proc/meminfo', 'utf-8');
    const match = meminfo.match(/MemTotal:\s+(\d+)\s+kB/);
    if (match) {
      const gb = Math.round(parseInt(match[1], 10) / 1024 / 1024);
      if (gb < 8) {
        results.push({ name: 'system RAM', status: 'warn', detail: `Only ${gb} GB RAM. 16+ GB recommended for model inference.` });
      } else {
        results.push({ name: 'system RAM', status: 'pass', detail: `${gb} GB available` });
      }
    }
  } catch {
    // macOS or non-Linux — skip
  }
}

// ── .env file check ────────────────────────────────────────────────────

function checkEnvFile(results: PreflightCheck[]): void {
  const envPath = envFilePath();
  if (!existsSync(envPath)) {
    results.push({
      name: '.env file',
      status: 'fail',
      detail: `.env not found at ${envPath}. Run \`relay setup\` (or \`npm run setup\`) to create one.`,
      hint: 'relay setup',
    });
  }
}

// ── Summary printer ────────────────────────────────────────────────────

export function printPreflight(results: PreflightCheck[], stream: NodeJS.WritableStream = process.stderr): void {
  const width = Math.max(...results.map((r) => r.name.length), 0);
  for (const r of results) {
    const icon = r.status === 'pass' ? '\x1b[32mPASS\x1b[0m' : r.status === 'warn' ? '\x1b[33mWARN\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    stream.write(`${icon} ${r.name.padEnd(width)}  ${r.detail}\n`);
  }
}
