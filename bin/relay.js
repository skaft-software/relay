#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, '..');
const SRC = resolve(ROOT, 'src');
const args = process.argv.slice(2);

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
    relay --version        print version
    relay --help           show this help

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

// ── Build node args ─────────────────────────────────────────────────────

const nodeArgs = ['--experimental-strip-types'];

// Load .env if present in cwd
const envFile = resolve(process.cwd(), '.env');
if (existsSync(envFile)) {
  nodeArgs.push(`--env-file=${envFile}`);
}

// ── Route ───────────────────────────────────────────────────────────────

let script;
let scriptArgs = [];

if (args[0] === 'setup') {
  script = resolve(SRC, 'main.ts');
  scriptArgs = ['setup'];
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
