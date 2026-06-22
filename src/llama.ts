/**
 * Relay llama.cpp provisioner — detect, verify, and build a *working*
 * llama-server for the host GPU.
 *
 * The setup TUI used to merely *detect* a binary on disk by path existence.
 * That is not enough: a stale or ABI-mismatched binary exists on disk but dies
 * with a symbol-lookup error the moment it runs (we have seen exactly this with
 * a leftover /usr/local/bin/llama-server). This module therefore *runs* every
 * candidate (`--version` / `--list-devices`) and only trusts binaries that
 * actually start and can see the GPU.
 *
 * Backend policy (deliberate):
 *   • NVIDIA → CUDA
 *   • AMD    → Vulkan          (HIP/ROCm is intentionally NOT used — it is not
 *                               recommended right now and is hard to get right)
 *   • Apple  → Metal
 *   • else   → CPU
 *
 * Building is real: we clone llama.cpp if needed, configure with the right
 * GGML_* flag, build the `llama-server` target, then verify the result.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, availableParallelism } from 'node:os';

import { detectHardware, buildPlanLlamaCpp, type Backend, type Hardware } from './provision.ts';

const HOME = homedir() || process.env.HOME || '';
const LLAMA_REPO = 'https://github.com/ggml-org/llama.cpp';

/** Backends Relay will provision. HIP/ROCm is excluded on purpose. */
export type SupportedBackend = 'cuda' | 'vulkan' | 'metal' | 'cpu';

export type LlamaDevice = {
  id: string;          // e.g. "Vulkan0", "CUDA0"
  name: string;        // e.g. "AMD Radeon RX 9070 XT (RADV GFX1201)"
  vramMib?: number;
  freeMib?: number;
};

export type VerifyResult = {
  path: string;
  exists: boolean;
  runs: boolean;          // process started and produced sane output (no symbol/loader error)
  backend: Backend;       // inferred from devices/path
  version?: string;       // e.g. "9634 (fd5869fb6)"
  devices: LlamaDevice[];
  hasGpu: boolean;
  error?: string;
};

export type PrereqCheck = {
  ok: boolean;
  present: string[];
  missing: string[];
  installHint: string;
};

export type BuildResult = {
  ok: boolean;
  backend: SupportedBackend;
  buildDir: string;
  binary: string;
  verify?: VerifyResult;
  error?: string;
};

// ── Backend selection ─────────────────────────────────────────────────────

/** Map detected hardware to the backend Relay will actually build/use.
 *  AMD always maps to Vulkan (never HIP/ROCm). */
export function chooseBackend(hw: Hardware): SupportedBackend {
  switch (hw.vendor) {
    case 'nvidia': return 'cuda';
    case 'amd':    return 'vulkan';
    case 'apple':  return 'metal';
    default:       return 'cpu';
  }
}

/** Human label for a backend, with the reason where it helps a novice. */
export function backendLabel(b: Backend): string {
  switch (b) {
    case 'cuda':   return 'CUDA (NVIDIA)';
    case 'vulkan': return 'Vulkan (AMD / cross-vendor)';
    case 'metal':  return 'Metal (Apple)';
    case 'hip':    return 'HIP/ROCm (unsupported)';
    case 'cpu':    return 'CPU only';
    default:       return String(b);
  }
}

// ── Running a candidate binary ─────────────────────────────────────────────

type Run = { code: number | null; out: string; err: string; failedToStart: boolean };

function run(cmd: string, args: string[], timeoutMs = 15_000): Run {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: timeoutMs, stdio: ['ignore', 'pipe', 'pipe'] });
  return {
    code: r.status,
    out: r.stdout ?? '',
    err: r.stderr ?? '',
    // ENOENT / spawn error, or the binary died at load time
    failedToStart: Boolean(r.error),
  };
}

/** Strip the noisy non-error banner RADV prints on every invocation. */
function stripBanners(s: string): string {
  return s
    .split('\n')
    .filter((l) => !/radv is not a conformant/i.test(l))
    .join('\n');
}

function looksBroken(text: string): boolean {
  return /symbol lookup error|undefined symbol|error while loading shared libraries|cannot open shared object|GLIBC_\S+ not found/i.test(text);
}

const DEVICE_RE = /^\s*([A-Za-z]+)(\d+):\s*(.+?)\s*(?:\((\d+)\s*MiB(?:,\s*(\d+)\s*MiB free)?\))?\s*$/;

function backendFromDeviceId(id: string): Backend {
  const t = id.toLowerCase();
  if (t.startsWith('cuda')) return 'cuda';
  if (t.startsWith('vulkan')) return 'vulkan';
  if (t.startsWith('rocm') || t.startsWith('hip')) return 'hip';
  if (t.startsWith('metal')) return 'metal';
  return 'cpu';
}

/** Run a candidate llama-server and report whether it works + what it sees. */
export function verifyLlamaServer(path: string): VerifyResult {
  const base: VerifyResult = { path, exists: false, runs: false, backend: 'unknown', devices: [], hasGpu: false };
  if (!path) return { ...base, error: 'no path' };
  if (!existsSync(path)) return { ...base, error: 'not found on disk' };
  base.exists = true;

  const ver = run(path, ['--version']);
  const verText = stripBanners(ver.out + '\n' + ver.err);
  if (ver.failedToStart || looksBroken(verText)) {
    return { ...base, error: looksBroken(verText) ? 'binary is broken (loader/symbol error)' : 'failed to start' };
  }
  const vm = /version:\s*([0-9]+\s*\([0-9a-f]+\))/i.exec(verText);
  const version = vm?.[1]?.trim();

  // --list-devices is the authoritative backend + VRAM probe.
  const dev = run(path, ['--list-devices']);
  const devText = stripBanners(dev.out + '\n' + dev.err);
  if (looksBroken(devText)) {
    return { ...base, version, error: 'binary is broken (loader/symbol error)' };
  }

  const devices: LlamaDevice[] = [];
  let backend: Backend = 'cpu';
  let inList = false;
  for (const line of devText.split('\n')) {
    if (/available devices/i.test(line)) { inList = true; continue; }
    if (!inList) continue;
    const m = DEVICE_RE.exec(line);
    if (!m) continue;
    const id = `${m[1]}${m[2]}`;
    const b = backendFromDeviceId(id);
    if (b !== 'cpu') backend = b;
    devices.push({
      id,
      name: (m[3] ?? '').trim(),
      vramMib: m[4] ? Number(m[4]) : undefined,
      freeMib: m[5] ? Number(m[5]) : undefined,
    });
  }
  const hasGpu = devices.some((d) => backendFromDeviceId(d.id) !== 'cpu');
  // Path hint as a fallback when device list is empty but the build dir names the backend.
  if (backend === 'cpu') {
    const hay = path.toLowerCase();
    if (hay.includes('cuda')) backend = 'cuda';
    else if (hay.includes('vulkan')) backend = 'vulkan';
    else if (hay.includes('metal')) backend = 'metal';
  }
  return { path, exists: true, runs: true, backend, version, devices, hasGpu };
}

// ── Detection across candidate paths ───────────────────────────────────────

function which(cmd: string): string | undefined {
  try { return execFileSync('which', [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined; }
  catch { return undefined; }
}

/** Candidate llama-server paths, backend-specific builds first. */
export function candidatePaths(env: NodeJS.ProcessEnv = process.env): string[] {
  const c = [
    env.RELAY_LLAMA_SERVER_PATH,
    join(HOME, 'llama.cpp/build-cuda/bin/llama-server'),
    join(HOME, 'llama.cpp/build-vulkan/bin/llama-server'),
    join(HOME, 'llama.cpp/build-metal/bin/llama-server'),
    join(HOME, 'llama.cpp/build/bin/llama-server'),
    which('llama-server'),
    '/usr/local/bin/llama-server',
    '/opt/llama.cpp/build/bin/llama-server',
  ].filter((p): p is string => Boolean(p));
  // de-dupe, preserve order
  return [...new Set(c)];
}

/** Find the best *working* llama-server, preferring one that matches the
 *  desired backend and can see the GPU. Returns null if none run. */
export function detectWorkingLlamaServer(
  desired: SupportedBackend,
  env: NodeJS.ProcessEnv = process.env,
): VerifyResult | null {
  const results = candidatePaths(env).map(verifyLlamaServer).filter((r) => r.runs);
  if (results.length === 0) return null;
  const score = (r: VerifyResult): number => {
    let s = 0;
    if (r.backend === desired) s += 100;
    if (r.hasGpu) s += 50;
    if (r.backend !== 'cpu' && r.backend !== 'unknown') s += 10;
    return s;
  };
  return results.sort((a, b) => score(b) - score(a))[0] ?? null;
}

// ── Build prerequisites ────────────────────────────────────────────────────

function hasHeader(p: string): boolean { return existsSync(p); }

/** Check the toolchain needed to build llama.cpp for `backend`. */
export function checkBuildPrereqs(backend: SupportedBackend): PrereqCheck {
  const present: string[] = [];
  const missing: string[] = [];
  const need = (label: string, ok: boolean) => (ok ? present : missing).push(label);

  const cxx = Boolean(which('g++') || which('clang++'));
  need('cmake', Boolean(which('cmake')));
  need('git', Boolean(which('git')));
  need('C++ compiler (g++/clang++)', cxx);
  need('make', Boolean(which('make') || which('ninja')));

  let hint = 'sudo apt update && sudo apt install -y cmake git build-essential';
  if (backend === 'vulkan') {
    const headers = hasHeader('/usr/include/vulkan/vulkan.h');
    const glslc = Boolean(which('glslc'));
    need('Vulkan headers (libvulkan-dev)', headers);
    need('glslc (shader compiler)', glslc);
    hint = 'sudo apt update && sudo apt install -y cmake git build-essential libvulkan-dev glslc libshaderc-dev';
  } else if (backend === 'cuda') {
    const nvcc = Boolean(which('nvcc'));
    need('nvcc (CUDA Toolkit)', nvcc);
    hint = 'Install the NVIDIA CUDA Toolkit (provides nvcc): https://developer.nvidia.com/cuda-downloads — then: sudo apt install -y cmake git build-essential';
  } else if (backend === 'metal') {
    hint = 'Install Xcode command line tools: xcode-select --install';
  }

  return { ok: missing.length === 0, present, missing, installHint: hint };
}

// ── Building ───────────────────────────────────────────────────────────────

export function llamaRoot(): string { return join(HOME, 'llama.cpp'); }

function jobs(): number {
  try { return Math.max(1, availableParallelism()); } catch { return 4; }
}

/** The exact shell-free commands Relay will run to build llama-server.
 *  Exposed so the TUI/CLI can show the novice precisely what will happen. */
export function buildCommands(backend: SupportedBackend, root = llamaRoot()): {
  buildDir: string;
  steps: Array<{ cmd: string; args: string[] }>;
  cloneNeeded: boolean;
} {
  const plan = buildPlanLlamaCpp(backend, root);
  const buildDir = plan.buildDir;
  const cloneNeeded = !existsSync(join(root, 'CMakeLists.txt'));
  const steps: Array<{ cmd: string; args: string[] }> = [];
  if (cloneNeeded) {
    steps.push({ cmd: 'git', args: ['clone', '--depth', '1', LLAMA_REPO, root] });
  }
  steps.push({ cmd: 'cmake', args: ['-S', root, '-B', buildDir, ...plan.cmakeFlags, '-DCMAKE_BUILD_TYPE=Release', '-DLLAMA_CURL=OFF'] });
  steps.push({ cmd: 'cmake', args: ['--build', buildDir, '--target', 'llama-server', '-j', String(jobs())] });
  return { buildDir, steps, cloneNeeded };
}

/**
 * Build llama-server for `backend`. Streams each command's output to `onLine`
 * (or inherits the terminal when `onLine` is omitted). Returns the verified
 * result. This is the real thing — it clones, configures and compiles.
 */
export function buildLlamaCpp(opts: {
  backend: SupportedBackend;
  root?: string;
  onLine?: (line: string) => void;
  buildTimeoutMs?: number;
}): BuildResult {
  const backend = opts.backend;
  const root = opts.root ?? llamaRoot();
  const { buildDir, steps } = buildCommands(backend, root);
  const binary = join(buildDir, 'bin', 'llama-server');
  const log = opts.onLine ?? ((l: string) => process.stdout.write(l + '\n'));

  const prereq = checkBuildPrereqs(backend);
  if (!prereq.ok) {
    return { ok: false, backend, buildDir, binary, error: `Missing build tools: ${prereq.missing.join(', ')}. Install them with:\n  ${prereq.installHint}` };
  }

  for (const step of steps) {
    log(`$ ${step.cmd} ${step.args.join(' ')}`);
    const isBuild = step.args[0] === '--build' || step.args[0] === 'clone';
    const r = spawnSync(step.cmd, step.args, {
      encoding: 'utf8',
      timeout: opts.buildTimeoutMs ?? 3_600_000, // up to 1h for a cold compile
      // Pipe so we can forward, but also echo big build output live for the CLI.
      stdio: opts.onLine ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
      maxBuffer: 64 * 1024 * 1024,
    });
    if (opts.onLine) {
      for (const l of ((r.stdout ?? '') + (r.stderr ?? '')).split('\n')) if (l) log(l);
    }
    if (r.error) {
      return { ok: false, backend, buildDir, binary, error: `${step.cmd} failed to start: ${r.error.message}` };
    }
    if ((r.status ?? 1) !== 0) {
      return { ok: false, backend, buildDir, binary, error: `${step.cmd} ${step.args.slice(0, 2).join(' ')} exited with code ${r.status}` };
    }
    void isBuild;
  }

  const verify = verifyLlamaServer(binary);
  if (!verify.runs) {
    return { ok: false, backend, buildDir, binary, verify, error: `Built binary did not run: ${verify.error ?? 'unknown'}` };
  }
  if (backend !== 'cpu' && !verify.hasGpu) {
    return { ok: false, backend, buildDir, binary, verify, error: 'Built binary runs but does not see a GPU. Check drivers.' };
  }
  return { ok: true, backend, buildDir, binary, verify };
}

// ── High-level status ──────────────────────────────────────────────────────

export type LlamaStatus = {
  hw: Hardware;
  desiredBackend: SupportedBackend;
  working: VerifyResult | null;   // best working binary, or null if none
  needsBuild: boolean;            // no working binary, or backend mismatch
  prereqs: PrereqCheck;
};

export function llamaStatus(env: NodeJS.ProcessEnv = process.env): LlamaStatus {
  const hw = detectHardware();
  const desiredBackend = chooseBackend(hw);
  const working = detectWorkingLlamaServer(desiredBackend, env);
  // Need a build if nothing works, or the only working binary can't use the GPU
  // we actually have (e.g. a CPU-only build on a GPU box).
  const needsBuild = !working || (desiredBackend !== 'cpu' && !working.hasGpu);
  const prereqs = checkBuildPrereqs(desiredBackend);
  return { hw, desiredBackend, working, needsBuild, prereqs };
}

// ── CLI ────────────────────────────────────────────────────────────────────

function printStatus(s: LlamaStatus): void {
  console.log('\nllama.cpp runtime');
  console.log('─────────────────');
  console.log(`  hardware    ${s.hw.vendor}${s.hw.gpuName ? ' ' + s.hw.gpuName : ''} · ${s.hw.vramGb}GB VRAM · ${s.hw.ramGb}GB RAM`);
  console.log(`  backend     ${backendLabel(s.desiredBackend)}`);
  if (s.working) {
    console.log(`  llama-server ${s.working.path}`);
    console.log(`               runs ✓  ·  backend ${s.working.backend}  ·  ${s.working.version ?? 'version ?'}`);
    for (const d of s.working.devices) {
      console.log(`               ${d.id}: ${d.name}${d.vramMib ? ` (${(d.vramMib / 1024).toFixed(1)} GB, ${d.freeMib ? (d.freeMib / 1024).toFixed(1) + ' GB free' : ''})` : ''}`);
    }
  } else {
    console.log('  binary      (none working — needs build)');
  }
  if (s.needsBuild) {
    console.log(`\n  → No working ${s.desiredBackend} llama-server. Build it with: relay llama build`);
    if (!s.prereqs.ok) {
      console.log(`    Missing tools: ${s.prereqs.missing.join(', ')}`);
      console.log(`    ${s.prereqs.installHint}`);
    }
  } else {
    console.log('\n  ✓ Ready.');
  }
  console.log('');
}

export function runLlamaCli(args: string[]): void {
  const sub = args[0] ?? 'status';

  if (sub === '--help' || sub === '-h' || sub === 'help') {
    console.log('\nUsage: relay llama [status|build|verify] [flags]');
    console.log('  status            Probe GPU, list working llama-server + devices');
    console.log('  build             Clone + cmake + make llama-server for detected GPU backend');
    console.log('  verify [path]     Run binary, parse --list-devices, report backend + VRAM');
    console.log('\nFlags:');
    console.log('  --backend <vulkan|cuda|metal|cpu>   Override backend (default: auto from GPU)');
    console.log('  --force                              Build even if a working binary exists');
    console.log('');
    return;
  }

  if (sub === 'verify') {
    const path = args[1] ?? (detectWorkingLlamaServer(chooseBackend(detectHardware()))?.path ?? '');
    if (!path) { console.log('No llama-server path given and none detected.'); process.exit(1); }
    const v = verifyLlamaServer(path);
    console.log(JSON.stringify(v, null, 2));
    process.exit(v.runs ? 0 : 1);
  }

  const status = llamaStatus();

  if (sub === 'status') { printStatus(status); return; }

  if (sub === 'build') {
    let backend = status.desiredBackend;
    const bi = args.indexOf('--backend');
    if (bi >= 0 && args[bi + 1]) {
      const b = args[bi + 1]!;
      if (b === 'rocm' || b === 'hip') {
        console.error('HIP/ROCm is not supported. Use Vulkan for AMD GPUs: relay llama build --backend vulkan');
        process.exit(1);
      }
      if (['vulkan', 'cuda', 'metal', 'cpu'].includes(b)) backend = b as SupportedBackend;
    }
    const force = args.includes('--force');

    if (!force && !status.needsBuild && status.working?.backend === backend) {
      console.log(`\n✓ A working ${backend} llama-server already exists: ${status.working.path}`);
      console.log('  Use --force to rebuild.\n');
      return;
    }

    const prereq = checkBuildPrereqs(backend);
    if (!prereq.ok) {
      console.error(`\nCannot build — missing tools: ${prereq.missing.join(', ')}`);
      console.error(`  ${prereq.installHint}\n`);
      process.exit(1);
    }

    const { buildDir, steps, cloneNeeded } = buildCommands(backend);
    console.log(`\nBuilding llama-server [${backendLabel(backend)}]`);
    console.log(`  repo:  ${llamaRoot()}${cloneNeeded ? ' (will clone)' : ''}`);
    console.log(`  build: ${buildDir}`);
    for (const s of steps) console.log(`  $ ${s.cmd} ${s.args.join(' ')}`);
    console.log('');

    const res = buildLlamaCpp({ backend });
    if (!res.ok) {
      console.error(`\n✗ Build failed: ${res.error}\n`);
      process.exit(1);
    }
    console.log(`\n✓ Built and verified: ${res.binary}`);
    if (res.verify) {
      for (const d of res.verify.devices) console.log(`  ${d.id}: ${d.name}`);
      console.log('\n  Tip: point Relay at it with');
      console.log(`    RELAY_LLAMA_SERVER_PATH=${res.binary}\n`);
    }
    return;
  }

  console.error(`Unknown llama subcommand: ${sub}. Try: relay llama --help`);
  process.exit(1);
}

// Standalone entry for direct execution / debugging.
if (process.argv[1] && process.argv[1].endsWith('llama.ts')) {
  runLlamaCli(process.argv.slice(2));
}
