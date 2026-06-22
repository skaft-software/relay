#!/usr/bin/env node
// relay — CLI entrypoint. Dispatches subcommands to src/main.ts (run via
// --experimental-strip-types, no build step). Loads the resolved .env so the
// same config works from a dev checkout, a global `npm i -g` install, or an
// explicit RELAY_ENV_FILE. Path logic mirrors src/paths.ts — keep in sync.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, '..');
const SRC = resolve(ROOT, 'src');
const args = process.argv.slice(2);

// ── Node version guard ──────────────────────────────────────────────────
// Relay runs .ts directly via --experimental-strip-types, which requires
// Node 22+. Fail fast with a clear message instead of a cryptic runtime error.
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (!Number.isFinite(nodeMajor) || nodeMajor < 22) {
  console.error(`relay requires Node.js 22 or newer (found ${process.versions.node}).`);
  console.error('Install it from https://nodejs.org and retry.');
  process.exit(1);
}

// ── Help ────────────────────────────────────────────────────────────────

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  relay — local AI gateway for coding agents

  Usage:
    relay                  start the gateway server
    relay setup            interactive setup wizard (TUI)
    relay keys             list API keys
    relay keys create      create a new API key
    relay keys rotate      roll the default API key
    relay keys delete <l>  delete a key by label
    relay doctor           run health & preflight checks
    relay provision        bootstrap/provision a host for relay
    relay --version        print version
    relay --help           show this help

  Config location:
    Dev checkout     ./.env (repo root)
    Global install   ~/.relay/.env
    Override         RELAY_HOME=…  or  RELAY_ENV_FILE=…

  Docs:  https://github.com/achuthanmukundan00/relay
`);
  process.exit(0);
}

// ── Version ─────────────────────────────────────────────────────────────

if (args.includes('--version') || args.includes('-v')) {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  console.log(pkg.version);
  process.exit(0);
}

// ── Resolve .env (mirrors src/paths.ts) ─────────────────────────────────

function resolveEnvFile() {
  const explicit = (process.env.RELAY_ENV_FILE || '').trim();
  if (explicit) return resolve(explicit);
  const dataOverride = (process.env.RELAY_HOME || process.env.RELAY_DATA_DIR || '').trim();
  const dataDir = dataOverride
    ? resolve(dataOverride)
    : existsSync(join(ROOT, '.git'))
      ? ROOT
      : resolve(homedir() || process.env.HOME || process.cwd(), '.relay');
  return resolve(dataDir, '.env');
}

const nodeArgs = ['--experimental-strip-types'];
const envFile = resolveEnvFile();
if (existsSync(envFile)) {
  nodeArgs.push(`--env-file=${envFile}`);
}

// ── Route ───────────────────────────────────────────────────────────────

let script;
let scriptArgs = [];

if (args[0] === 'setup') {
  script = resolve(SRC, 'main.ts');
  scriptArgs = ['setup', ...args.slice(1)];
} else if (args[0] === 'keys') {
  script = resolve(SRC, 'main.ts');
  scriptArgs = ['keys', ...args.slice(1)];
} else if (args[0] === 'doctor') {
  script = resolve(ROOT, 'scripts', 'doctor.ts');
} else if (args[0] === 'provision') {
  script = resolve(SRC, 'main.ts');
  scriptArgs = ['provision', ...args.slice(1)];
} else if (args[0] === 'start' || args.length === 0) {
  script = resolve(SRC, 'main.ts');
  scriptArgs = [];
} else {
  console.error(`Unknown command: ${args[0]}`);
  console.error('Run `relay --help` for usage.');
  process.exit(1);
}

// ── Spawn ───────────────────────────────────────────────────────────────

const child = spawn(process.execPath, [...nodeArgs, script, ...scriptArgs], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code) => process.exit(code ?? 1));
