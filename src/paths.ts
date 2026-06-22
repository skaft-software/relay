/**
 * Relay path resolution — single source of truth for where Relay reads and
 * writes its mutable data (.env, start-scripts, keys, logs).
 *
 * Two modes:
 *   • Dev checkout (a `.git` dir sits next to package.json): data lives in the
 *     repo root so `npm run dev` / `npm start` keep working unchanged.
 *   • Global npm install (no `.git`): data lives in `~/.relay`, which is
 *     writable and survives `npm update -g`. This is what makes
 *     `npm i -g @skaft/relay` work without writing into the read-only install.
 *
 * Override knobs (any wins over the defaults):
 *   RELAY_HOME        base directory for all Relay data
 *   RELAY_DATA_DIR    alias for RELAY_HOME
 *   RELAY_ENV_FILE    explicit .env path (wins over everything for the env file)
 *
 * `bin/relay.js` replicates this logic in plain JS (it runs before TS stripping
 * is available). Keep the two in sync.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Root of the installed package — read-only bundled assets (src, docs, scripts). */
export function packageDir(): string {
  return PKG_DIR;
}

/** True when Relay runs from a source checkout (dev mode). */
export function isDevCheckout(): boolean {
  return existsSync(join(PKG_DIR, '.git'));
}

function home(): string {
  return homedir() || process.env.HOME || process.cwd();
}

/**
 * Base directory for mutable Relay data. Override with RELAY_HOME or
 * RELAY_DATA_DIR. Defaults to the repo root in a dev checkout, otherwise
 * `~/.relay`.
 */
export function dataDir(): string {
  const override = (process.env.RELAY_HOME || process.env.RELAY_DATA_DIR || '').trim();
  if (override) return resolve(override);
  return isDevCheckout() ? PKG_DIR : resolve(home(), '.relay');
}

/** `dataDir()`, created if missing. */
export function ensureDataDir(): string {
  const dir = dataDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Path to the .env Relay reads/writes. Override with RELAY_ENV_FILE. */
export function envFilePath(): string {
  const override = (process.env.RELAY_ENV_FILE || '').trim();
  if (override) return resolve(override);
  return resolve(dataDir(), '.env');
}

/** Directory for generated model start scripts. */
export function startScriptsDir(): string {
  return resolve(dataDir(), 'start-scripts');
}
