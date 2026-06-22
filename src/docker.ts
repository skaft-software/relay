/**
 * Relay Docker manager — build, run and manage the gateway as a container.
 *
 * Architecture (matches docker-compose.yml's intent, but with *detected* host
 * paths instead of placeholders): Relay runs inside the container while
 * llama.cpp runs on the host. We mount the models dir, the llama.cpp build dir
 * and the start-scripts dir into the container at their **identical host
 * paths**, and share the host network + PID namespaces. That way the exact same
 * RELAY_MODEL_MAP (whose `cmd`/`MODEL`/`LLAMA_SERVER` are host paths) works
 * whether Relay runs bare-metal or in the container — no path rewriting.
 *
 * GPU passthrough is vendor-correct:
 *   • AMD (Vulkan): pass /dev/dri (and /dev/kfd if present) + the render/video
 *     group GIDs so the container user can open the device.
 *   • NVIDIA (CUDA): the compose `deploy.resources` GPU reservation (needs the
 *     NVIDIA Container Toolkit on the host).
 *   • CPU/none: no device passthrough.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

import { packageDir, dataDir, envFilePath, startScriptsDir } from './paths.ts';
import { detectHardware, type Hardware } from './provision.ts';
import { detectWorkingLlamaServer, chooseBackend, llamaRoot, type SupportedBackend } from './llama.ts';

const HOME = homedir() || process.env.HOME || '';
export const IMAGE_NAME = 'skaft-relay:local';
export const CONTAINER_NAME = 'relay';

// ── Docker detection ───────────────────────────────────────────────────────

export type DockerInfo = {
  installed: boolean;
  version?: string;
  daemonRunning: boolean;
  compose: 'v2' | 'legacy' | null; // `docker compose` vs `docker-compose`
  inDockerGroup: boolean;
  reason?: string;                 // why daemon/compose unavailable (for the novice)
};

function which(cmd: string): string | undefined {
  try { return execFileSync('which', [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined; }
  catch { return undefined; }
}

export function detectDocker(): DockerInfo {
  const info: DockerInfo = { installed: false, daemonRunning: false, compose: null, inDockerGroup: false };
  info.installed = Boolean(which('docker'));
  if (!info.installed) { info.reason = 'docker is not installed'; return info; }

  try {
    info.version = execFileSync('docker', ['--version'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* ignore */ }

  // Daemon reachable?
  const di = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'pipe'] });
  info.daemonRunning = (di.status === 0) && Boolean((di.stdout ?? '').trim());
  if (!info.daemonRunning) {
    const err = (di.stderr ?? '').toLowerCase();
    info.reason = err.includes('permission denied') ? 'permission denied — add user to docker group, re-login'
      : 'daemon not running — sudo systemctl start docker';
  }

  // Compose flavour
  if (spawnSync('docker', ['compose', 'version'], { timeout: 6000, stdio: 'ignore' }).status === 0) info.compose = 'v2';
  else if (which('docker-compose')) info.compose = 'legacy';

  // docker group membership (informational)
  try {
    const groups = execFileSync('id', ['-nG'], { encoding: 'utf8' }).split(/\s+/);
    info.inDockerGroup = groups.includes('docker');
  } catch { /* ignore */ }

  return info;
}

// ── Host path resolution ───────────────────────────────────────────────────

export function modelsDir(env: NodeJS.ProcessEnv = process.env): string {
  return (env.RELAY_MODEL_DIR && existsSync(env.RELAY_MODEL_DIR)) ? env.RELAY_MODEL_DIR : join(HOME, 'models');
}

/** The llama.cpp build directory to mount (contains bin/llama-server + *.so). */
export function llamaBuildDir(backend: SupportedBackend, env: NodeJS.ProcessEnv = process.env): string {
  const working = detectWorkingLlamaServer(backend, env);
  if (working?.path) return dirname(dirname(working.path)); // .../build-vulkan/bin/llama-server → .../build-vulkan
  return join(llamaRoot(), backend === 'cpu' ? 'build' : `build-${backend}`);
}

/** GIDs that own /dev/dri/* — needed so the container user can open the GPU. */
function driGids(): number[] {
  const gids = new Set<number>();
  for (const dev of ['/dev/dri/renderD128', '/dev/dri/card0', '/dev/dri/card1']) {
    try { if (existsSync(dev)) gids.add(statSync(dev).gid); } catch { /* ignore */ }
  }
  return [...gids];
}

// ── Compose rendering ──────────────────────────────────────────────────────

export type ComposeOpts = {
  backend: SupportedBackend;
  context: string;       // docker build context (the package dir)
  envFile: string;
  modelsDir: string;
  buildDir: string;
  scriptsDir: string;
};

function yamlList(indent: string, items: string[]): string {
  return items.map((i) => `${indent}- ${i}`).join('\n');
}

/** Produce a docker-compose.yml tailored to this host + GPU. Pure. */
export function renderCompose(o: ComposeOpts): string {
  const volumes: string[] = [];
  // Mount at IDENTICAL host paths so host-path model maps resolve in-container.
  if (existsSync(o.modelsDir)) volumes.push(`${o.modelsDir}:${o.modelsDir}:ro`);
  if (existsSync(o.buildDir)) volumes.push(`${o.buildDir}:${o.buildDir}:ro`);
  volumes.push(`${o.scriptsDir}:${o.scriptsDir}:ro`);

  let gpuBlock = '';
  if (o.backend === 'vulkan') {
    const devices = ['/dev/dri:/dev/dri'];
    if (existsSync('/dev/kfd')) devices.push('/dev/kfd:/dev/kfd');
    const gids = driGids();
    gpuBlock =
      `    devices:\n${yamlList('      ', devices)}\n` +
      (gids.length ? `    group_add:\n${yamlList('      ', gids.map(String))}\n` : '');
  } else if (o.backend === 'cuda') {
    gpuBlock =
      '    deploy:\n' +
      '      resources:\n' +
      '        reservations:\n' +
      '          devices:\n' +
      '            - driver: nvidia\n' +
      '              count: all\n' +
      '              capabilities: [gpu]\n' +
      '    environment:\n' +
      '      - NVIDIA_VISIBLE_DEVICES=all\n' +
      '      - NVIDIA_DRIVER_CAPABILITIES=compute,utility\n';
  }

  return (
`# Generated by \`relay docker\` for this host — re-run to regenerate.
# Relay runs in this container; llama.cpp runs on the host, mounted in at
# identical paths so one RELAY_MODEL_MAP works in-container and bare-metal.
# Backend: ${o.backend}
services:
  ${CONTAINER_NAME}:
    build:
      context: ${o.context}
      dockerfile: Dockerfile
    image: ${IMAGE_NAME}
    container_name: ${CONTAINER_NAME}
    restart: unless-stopped
    network_mode: host
    pid: host
    env_file:
      - ${o.envFile}
    volumes:
${yamlList('      ', volumes)}
${gpuBlock}`.replace(/\n+$/, '') + '\n'
  );
}

export function composeFilePath(): string {
  return join(dataDir(), 'docker-compose.yml');
}

/** Resolve all host paths and write the compose file. Returns its path + body. */
export function writeCompose(env: NodeJS.ProcessEnv = process.env): { path: string; content: string; backend: SupportedBackend } {
  const hw = detectHardware();
  const backend = chooseBackend(hw);
  const scriptsDir = startScriptsDir();
  mkdirSync(scriptsDir, { recursive: true });
  const content = renderCompose({
    backend,
    context: packageDir(),
    envFile: envFilePath(),
    modelsDir: modelsDir(env),
    buildDir: llamaBuildDir(backend, env),
    scriptsDir,
  });
  const path = composeFilePath();
  writeFileSync(path, content);
  return { path, content, backend };
}

// ── Compose / container operations ─────────────────────────────────────────

function composeArgv(d: DockerInfo, file: string, rest: string[]): { cmd: string; args: string[] } {
  if (d.compose === 'legacy') return { cmd: 'docker-compose', args: ['-f', file, ...rest] };
  return { cmd: 'docker', args: ['compose', '-f', file, ...rest] };
}

/** Run a compose subcommand, inheriting the terminal (for build/up/logs). */
export function runCompose(rest: string[], opts: { inherit?: boolean } = {}): { code: number; out?: string } {
  const d = detectDocker();
  if (!d.installed) throw new Error('docker is not installed');
  if (!d.daemonRunning) throw new Error(d.reason ?? 'docker daemon not available');
  if (!d.compose) throw new Error('docker compose is not available (install the docker compose plugin)');
  const file = composeFilePath();
  if (!existsSync(file)) writeCompose();
  const { cmd, args } = composeArgv(d, file, rest);
  if (opts.inherit) {
    const r = spawnSync(cmd, args, { stdio: 'inherit', timeout: 3_600_000 });
    return { code: r.status ?? 1 };
  }
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe'] });
  return { code: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

export type ContainerState = { exists: boolean; running: boolean; status?: string };

export function containerState(): ContainerState {
  const r = spawnSync('docker', ['ps', '-a', '--filter', `name=^/${CONTAINER_NAME}$`, '--format', '{{.State}}\t{{.Status}}'],
    { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] });
  const line = (r.stdout ?? '').trim();
  if (!line) return { exists: false, running: false };
  const [state, status] = line.split('\t');
  return { exists: true, running: state === 'running', status };
}

export function imageExists(): boolean {
  const r = spawnSync('docker', ['images', '-q', IMAGE_NAME], { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] });
  return Boolean((r.stdout ?? '').trim());
}

export type DockerStatus = {
  docker: DockerInfo;
  composeFile: string;
  composeExists: boolean;
  image: boolean;
  container: ContainerState;
  backend: SupportedBackend;
  buildDir: string;
  buildDirExists: boolean;
  modelsDir: string;
};

export function dockerStatus(env: NodeJS.ProcessEnv = process.env): DockerStatus {
  const docker = detectDocker();
  const hw = detectHardware();
  const backend = chooseBackend(hw);
  const buildDir = llamaBuildDir(backend, env);
  return {
    docker,
    composeFile: composeFilePath(),
    composeExists: existsSync(composeFilePath()),
    image: docker.daemonRunning ? imageExists() : false,
    container: docker.daemonRunning ? containerState() : { exists: false, running: false },
    backend,
    buildDir,
    buildDirExists: existsSync(buildDir),
    modelsDir: modelsDir(env),
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────

function printStatus(s: DockerStatus): void {
  console.log('\nRelay Docker');
  console.log('────────────');
  if (!s.docker.installed) { console.log('  docker        not installed'); console.log('  Install Docker: https://docs.docker.com/engine/install/\n'); return; }
  console.log(`  docker        ${s.docker.version ?? 'installed'}${s.docker.daemonRunning ? ' · daemon up' : ' · ' + (s.docker.reason ?? 'daemon down')}`);
  console.log(`  compose       ${s.docker.compose ?? 'not available'}`);
  console.log(`  backend       ${s.backend}`);
  console.log(`  llama build   ${s.buildDir}${s.buildDirExists ? '' : '  (missing — run: relay llama build)'}`);
  console.log(`  models        ${s.modelsDir}`);
  console.log(`  compose file  ${s.composeFile}${s.composeExists ? '' : ' (not written yet)'}`);
  console.log(`  image         ${s.image ? IMAGE_NAME + ' ✓' : 'not built'}`);
  console.log(`  container     ${s.container.exists ? (s.container.running ? 'running ✓ · ' + (s.container.status ?? '') : 'stopped · ' + (s.container.status ?? '')) : 'none'}`);
  console.log('\n  Commands: relay docker [render|build|up|down|restart|logs|status|rm]\n');
}

export function runDockerCli(args: string[]): void {
  const sub = args[0] ?? 'status';

  if (sub === '--help' || sub === '-h' || sub === 'help') {
    console.log('\nUsage: relay docker [command]');
    console.log('  status     Show docker + compose + container state (default)');
    console.log('  render     Write a docker-compose.yml tailored to this host + GPU');
    console.log('  build      Build the Relay gateway image');
    console.log('  up         Start the gateway container (builds if needed)');
    console.log('  down       Stop and remove the container');
    console.log('  restart    Restart the container');
    console.log('  logs       Follow container logs (Ctrl+C to stop)');
    console.log('  rm         Remove the container and image');
    console.log('');
    return;
  }

  if (sub === 'status') { printStatus(dockerStatus()); return; }

  if (sub === 'render') {
    const { path, backend } = writeCompose();
    console.log(`\n✓ Wrote ${path}  (backend: ${backend})`);
    console.log('  Review it, then: relay docker up\n');
    return;
  }

  const d = detectDocker();
  if (!d.installed) { console.error('\ndocker is not installed. See https://docs.docker.com/engine/install/\n'); process.exit(1); }
  if (!d.daemonRunning) { console.error(`\n${d.reason ?? 'docker daemon not available'}\n`); process.exit(1); }

  try {
    if (sub === 'build') {
      const { path, backend } = writeCompose();
      console.log(`\nBuilding ${IMAGE_NAME} (backend: ${backend}) from ${path}…\n`);
      const { code } = runCompose(['build'], { inherit: true });
      process.exit(code);
    }
    if (sub === 'up') {
      writeCompose();
      console.log('\nStarting Relay container…\n');
      const { code } = runCompose(['up', '-d', '--build'], { inherit: true });
      if (code === 0) console.log('\n✓ Relay is running in Docker. Check: relay docker status · Logs: relay docker logs\n');
      process.exit(code);
    }
    if (sub === 'down') { process.exit(runCompose(['down'], { inherit: true }).code); }
    if (sub === 'restart') { process.exit(runCompose(['restart'], { inherit: true }).code); }
    if (sub === 'logs') { process.exit(runCompose(['logs', '-f', '--tail', '100'], { inherit: true }).code); }
    if (sub === 'rm') {
      runCompose(['down', '--rmi', 'local'], { inherit: true });
      process.exit(0);
    }
  } catch (err) {
    console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }

  console.error(`Unknown docker subcommand: ${sub}. Try: relay docker --help`);
  process.exit(1);
}

// Standalone entry for direct execution / debugging.
if (process.argv[1] && process.argv[1].endsWith('docker.ts')) {
  runDockerCli(process.argv.slice(2));
}
