/**
 * Cloudflare Tunnel — install cloudflared. expose relay to internet.
 *
 * Two paths:
 *   • Quick — anonymous trycloudflare.com subdomain. No account. One command.
 *   • Named — your domain. Login → tunnel create → DNS route → config → run.
 *     Requires Cloudflare account + zone.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, chmodSync, writeFileSync, renameSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const HOME = homedir() || process.env.HOME || '';

export type CloudflaredInfo = {
  installed: boolean;
  path: string | null;
  version?: string;
  loggedIn: boolean;                       // ~/.cloudflared/cert.pem present
  tunnels: Array<{ id: string; name: string }>;
  serviceActive: boolean;
  outdated?: string;                       // newer version string if cloudflared says so
};

function which(cmd: string): string | undefined {
  try { return execFileSync('which', [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined; }
  catch { return undefined; }
}

/** Where we install cloudflared when it is missing (no sudo needed). */
export function installDir(): string { return join(HOME, '.local', 'bin'); }
function installedPath(): string { return join(installDir(), 'cloudflared'); }

/** Resolve a cloudflared binary: PATH, our user dir, or common locations. */
export function resolveCloudflared(): string | null {
  return which('cloudflared')
    ?? [installedPath(), '/usr/local/bin/cloudflared', '/usr/bin/cloudflared'].find((p) => existsSync(p))
    ?? null;
}

export function detectCloudflared(): CloudflaredInfo {
  const path = resolveCloudflared();
  const info: CloudflaredInfo = {
    installed: Boolean(path), path,
    loggedIn: existsSync(join(HOME, '.cloudflared', 'cert.pem')),
    tunnels: [], serviceActive: false,
  };
  if (!path) return info;
  try {
    const v = execFileSync(path, ['--version'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
    info.version = v.trim().split(/\s+/)[2];
  } catch { /* ignore */ }
  try {
    const raw = execFileSync(path, ['tunnel', 'list', '--output', 'json'], { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'pipe'] });
    const parsed = JSON.parse(raw) as Array<{ id: string; name: string }>;
    if (Array.isArray(parsed)) info.tunnels = parsed.map((t) => ({ id: t.id, name: t.name }));
  } catch { /* not logged in / none */ }
  try {
    const state = execFileSync('systemctl', ['is-active', 'cloudflared'], { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    info.serviceActive = state === 'active';
  } catch { /* not present */ }
  return info;
}

// ── Install ──────────────────────────────────────────────────────────────

function assetName(): string {
  const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
  if (process.platform === 'darwin') return `cloudflared-darwin-${arch}.tgz`;
  return `cloudflared-linux-${arch}`;
}

/** Download + install cloudflared into ~/.local/bin (no sudo). Returns the path. */
export function installCloudflared(log: (l: string) => void = (l) => process.stdout.write(l + '\n')): string {
  const dir = installDir();
  mkdirSync(dir, { recursive: true });
  const asset = assetName();
  const url = `https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`;
  const dest = installedPath();
  const curl = which('curl'); const wget = which('wget');
  if (!curl && !wget) throw new Error('curl or wget is required to install cloudflared');

  log(`Downloading ${asset} …`);
  if (asset.endsWith('.tgz')) {
    const tgz = join(tmpdir(), asset);
    dl(url, tgz, log);
    const r = spawnSync('tar', ['xzf', tgz, '-C', dir], { stdio: 'inherit' });
    if ((r.status ?? 1) !== 0) throw new Error('failed to extract cloudflared');
  } else {
    const tmp = dest + '.part';
    dl(url, tmp, log);
    renameSync(tmp, dest);
  }
  chmodSync(dest, 0o755);
  log(`Installed: ${dest}`);
  return dest;
}

function dl(url: string, out: string, log: (l: string) => void): void {
  const curl = which('curl');
  const r = curl
    ? spawnSync('curl', ['-fL', '--retry', '3', '-o', out, url], { stdio: 'inherit' })
    : spawnSync('wget', ['-O', out, url], { stdio: 'inherit' });
  if ((r.status ?? 1) !== 0) throw new Error(`download failed: ${url}`);
  void log;
}

// ── Quick Tunnel (no account) ──────────────────────────────────────────────

export function quickTunnelArgs(port: number | string): string[] {
  return ['tunnel', '--url', `http://127.0.0.1:${port}`];
}

// ── Named Tunnel ────────────────────────────────────────────────────────────

export function configPath(name: string): string { return join(HOME, '.cloudflared', `${name}.yml`); }

/** Find the credentials JSON cloudflared wrote for a tunnel (by id). */
function credentialsFile(id: string): string | null {
  const p = join(HOME, '.cloudflared', `${id}.json`);
  return existsSync(p) ? p : null;
}

/** Write an ingress config mapping hostname → the local gateway. */
export function writeTunnelConfig(name: string, hostname: string, port: number | string): string {
  const info = detectCloudflared();
  const t = info.tunnels.find((x) => x.name === name);
  const id = t?.id ?? name;
  const cred = t ? credentialsFile(t.id) : null;
  const cfg = configPath(name);
  mkdirSync(join(HOME, '.cloudflared'), { recursive: true });
  const body =
`# Generated by relay — Cloudflare named tunnel for the gateway.
tunnel: ${id}
${cred ? `credentials-file: ${cred}\n` : ''}ingress:
  - hostname: ${hostname}
    service: http://127.0.0.1:${port}
  - service: http_status:404
`;
  writeFileSync(cfg, body);
  return cfg;
}

export type NamedResult = { ok: boolean; steps: string[]; config?: string; error?: string };

/** Best-effort named-tunnel setup: create (if needed) → route DNS → write config.
 *  Requires the user to be logged in (cert.pem). Returns the steps run + the
 *  command to actually run the tunnel. */
export function setupNamedTunnel(name: string, hostname: string, port: number | string,
  log: (l: string) => void = (l) => process.stdout.write(l + '\n')): NamedResult {
  const info = detectCloudflared();
  const bin = info.path;
  const steps: string[] = [];
  if (!bin) return { ok: false, steps, error: 'cloudflared is not installed (run: relay tunnel install)' };
  if (!info.loggedIn) return { ok: false, steps, error: 'not logged in — run: relay tunnel login (opens a browser)' };

  if (!info.tunnels.some((t) => t.name === name)) {
    log(`Creating tunnel "${name}" …`);
    const r = spawnSync(bin, ['tunnel', 'create', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if ((r.status ?? 1) !== 0) return { ok: false, steps, error: `create failed: ${(r.stderr ?? '').trim()}` };
    steps.push(`created tunnel ${name}`);
  } else {
    steps.push(`tunnel ${name} already exists`);
  }

  log(`Routing DNS ${hostname} → ${name} …`);
  const rd = spawnSync(bin, ['tunnel', 'route', 'dns', name, hostname], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if ((rd.status ?? 1) !== 0 && !/already exists|record with that host/i.test(rd.stderr ?? '')) {
    return { ok: false, steps, error: `route dns failed: ${(rd.stderr ?? '').trim()}` };
  }
  steps.push(`routed ${hostname}`);

  const cfg = writeTunnelConfig(name, hostname, port);
  steps.push(`wrote ${cfg}`);
  return { ok: true, steps, config: cfg };
}

// ── CLI ──────────────────────────────────────────────────────────────────

function argVal(args: string[], flag: string, dflt: string): string {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1]! : dflt;
}

function printStatus(info: CloudflaredInfo, port: string): void {
  console.log('\nCloudflare Tunnel');
  console.log('─────────────────');
  console.log(`  cloudflared   ${info.installed ? (info.path + (info.version ? ' · ' + info.version : '')) : 'not installed'}`);
  if (!info.installed) { console.log('\n  Install it:  relay tunnel install\n'); return; }
  console.log(`  account       ${info.loggedIn ? 'logged in ✓' : 'not logged in (relay tunnel login)'}`);
  console.log(`  tunnels       ${info.tunnels.length ? info.tunnels.map((t) => t.name).join(', ') : 'none'}`);
  console.log(`  service       ${info.serviceActive ? 'active' : 'not running'}`);
  console.log('\n  Instant public URL (no account):');
  console.log(`    relay tunnel quick --port ${port}`);
  console.log('  Custom domain:');
  console.log('    relay tunnel login   →   relay tunnel named <name> <hostname>\n');
}

export function runTunnelCli(args: string[], env: NodeJS.ProcessEnv = process.env): void {
  const sub = args[0] ?? 'status';
  const port = argVal(args, '--port', env.PORT ?? '1234');
  const bin = resolveCloudflared();

  if (sub === '--help' || sub === '-h' || sub === 'help') {
    console.log('\nUsage: relay tunnel [command]');
    console.log('  status                     Show cloudflared + tunnels (default)');
    console.log('  install                    Download cloudflared into ~/.local/bin');
    console.log('  quick [--port N]           Instant public URL via trycloudflare (no account)');
    console.log('  login                      Authenticate cloudflared with your Cloudflare account');
    console.log('  named <name> <hostname> [--port N]   Create+route+configure a tunnel on your domain');
    console.log('  run <name>                 Run a configured named tunnel in the foreground');
    console.log('');
    return;
  }

  if (sub === 'status') { printStatus(detectCloudflared(), port); return; }

  if (sub === 'install') {
    try { const p = installCloudflared(); console.log(`\n✓ ${p}`);
      if (!process.env.PATH?.includes(installDir())) console.log(`  (add ${installDir()} to PATH, or relay will find it automatically)`);
      console.log('');
    } catch (e) { console.error(`\n✗ ${e instanceof Error ? e.message : String(e)}\n`); process.exit(1); }
    return;
  }

  if (!bin) { console.error('\ncloudflared is not installed. Run: relay tunnel install\n'); process.exit(1); }

  if (sub === 'quick') {
    console.log(`\nOpening an instant public tunnel to http://127.0.0.1:${port} …`);
    console.log('Look for the https://<something>.trycloudflare.com URL below. Ctrl+C to stop.\n');
    const r = spawnSync(bin, quickTunnelArgs(port), { stdio: 'inherit' });
    process.exit(r.status ?? 0);
  }

  if (sub === 'login') {
    const r = spawnSync(bin, ['tunnel', 'login'], { stdio: 'inherit' });
    process.exit(r.status ?? 0);
  }

  if (sub === 'named') {
    const name = args[1]; const hostname = args[2];
    if (!name || !hostname) { console.error('Usage: relay tunnel named <name> <hostname> [--port N]'); process.exit(1); }
    const res = setupNamedTunnel(name, hostname, port);
    if (!res.ok) { console.error(`\n✗ ${res.error}\n`); process.exit(1); }
    console.log(`\n✓ Named tunnel ready:`);
    for (const s of res.steps) console.log(`   - ${s}`);
    console.log(`\n  Run it:        relay tunnel run ${name}`);
    console.log(`  Install svc:   sudo ${bin} --config ${res.config} service install   (starts on boot)`);
    console.log(`  Public URL:    https://${hostname}\n`);
    return;
  }

  if (sub === 'run') {
    const name = args[1];
    if (!name) { console.error('Usage: relay tunnel run <name>'); process.exit(1); }
    const cfg = configPath(name);
    const runArgs = existsSync(cfg) ? ['--config', cfg, 'tunnel', 'run', name] : ['tunnel', 'run', name];
    const r = spawnSync(bin, runArgs, { stdio: 'inherit' });
    process.exit(r.status ?? 0);
  }

  console.error(`Unknown tunnel subcommand: ${sub}. Try: relay tunnel --help`);
  process.exit(1);
}

// Standalone entry for direct execution / debugging.
if (process.argv[1] && process.argv[1].endsWith('cloudflare.ts')) {
  runTunnelCli(process.argv.slice(2));
}
