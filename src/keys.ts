/**
 * Relay API Key Store — create, list, verify, roll, delete API keys.
 *
 * Keys are 256-bit random, prefixed with "relay_" for easy identification.
 * Stored as SHA-256(key + pepper) hashes with per-key metadata.
 * Pepper lives in .env (RELAY_KEY_PEPPER) — separate file from keys.json.
 *
 * Verification is O(1): key ID prefix → map lookup → one SHA-256 compare.
 *
 * Zero external dependencies — uses only node:crypto.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

// ── Types ──────────────────────────────────────────────────────────────

export type KeyEntry = {
  /** Human-readable label (e.g. "default", "vscode-agent") */
  label: string;
  /** First 12 chars of the key (incl. "relay_" prefix) for O(1) lookup */
  id: string;
  /** SHA-256(key + pepper) as lowercase hex */
  hash: string;
  /** ISO-8601 creation timestamp */
  created: string;
  /** ISO-8601 expiry timestamp, or null for no expiry */
  expires: string | null;
  /** ISO-8601 timestamp of last successful use, or null */
  last_used: string | null;
};

export type KeyStoreFile = {
  /** Schema version for forward-compat */
  version: 1;
  keys: KeyEntry[];
};

export type KeyCreateResult = {
  /** The raw key — shown ONCE, never stored in plaintext */
  raw: string;
  /** The stored entry (without hash) */
  entry: Omit<KeyEntry, 'hash'>;
};

export type VerifyResult =
  | { ok: true; label: string }
  | { ok: false };

// ── Constants ───────────────────────────────────────────────────────────

const KEY_PREFIX = 'relay_';
const SECRET_BYTES = 32; // 256 bits
const KEY_ID_LENGTH = 4; // hex chars after prefix (16 bits of ID space)

// ── KeyStore ────────────────────────────────────────────────────────────

export class KeyStore {
  private readonly path: string;
  private pepper: string;

  constructor(storePath?: string, pepper?: string) {
    this.path = storePath ?? resolve(homedir(), '.relay', 'keys.json');
    this.pepper = pepper ?? process.env.RELAY_KEY_PEPPER ?? '';
  }

  // ── File I/O ──────────────────────────────────────────────────────────

  private read(): KeyStoreFile {
    if (!existsSync(this.path)) return { version: 1, keys: [] };
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as KeyStoreFile;
    } catch {
      return { version: 1, keys: [] };
    }
  }

  private write(data: KeyStoreFile): void {
    const dir = resolve(this.path, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this.path, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
  }

  // ── Operations ────────────────────────────────────────────────────────

  /**
   * Generate a new API key. Returns the raw key ONCE.
   * The caller must display it to the user — it is never stored in plaintext.
   */
  create(label: string, expiresAt?: Date): KeyCreateResult {
    const secret = randomBytes(SECRET_BYTES).toString('hex');
    const raw = KEY_PREFIX + secret;
    const id = raw.slice(0, KEY_PREFIX.length + KEY_ID_LENGTH); // "relay_a1b2"

    const store = this.read();

    // Check for ID collision (2^16 space — extremely unlikely with few keys)
    if (store.keys.some((k) => k.id === id)) {
      // Regenerate with new random bytes
      return this.create(label, expiresAt);
    }

    const entry: KeyEntry = {
      label,
      id,
      hash: this.hash(raw),
      created: new Date().toISOString(),
      expires: expiresAt ? expiresAt.toISOString() : null,
      last_used: null,
    };

    store.keys.push(entry);
    this.write(store);

    return {
      raw,
      entry: { label, id, created: entry.created, expires: entry.expires, last_used: null },
    };
  }

  /**
   * Verify a candidate key against all active (non-expired) entries.
   * O(1): extracts key ID prefix → map lookup → one SHA-256 compare.
   */
  verify(candidate: string): VerifyResult {
    if (!candidate || typeof candidate !== 'string') return { ok: false };
    if (!candidate.startsWith(KEY_PREFIX)) return { ok: false };

    const id = candidate.slice(0, KEY_PREFIX.length + KEY_ID_LENGTH);
    const store = this.read();
    const entry = store.keys.find((k) => k.id === id);
    if (!entry) return { ok: false };

    // Check expiry
    if (entry.expires && new Date(entry.expires) <= new Date()) {
      return { ok: false };
    }

    const candidateHash = this.hash(candidate);
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    const storedBuf = Buffer.from(entry.hash, 'hex');

    if (candidateBuf.length !== storedBuf.length) return { ok: false };
    if (!timingSafeEqual(candidateBuf, storedBuf)) return { ok: false };

    // Update last_used
    entry.last_used = new Date().toISOString();
    this.write(store);

    return { ok: true, label: entry.label };
  }

  /**
   * List all keys (without hashes). Safe to display.
   */
  list(): Omit<KeyEntry, 'hash'>[] {
    return this.read().keys.map(({ hash: _, ...rest }) => rest);
  }

  /**
   * Delete a key by its ID prefix.
   * Returns true if a key was found and deleted.
   */
  delete(id: string): boolean {
    const store = this.read();
    const index = store.keys.findIndex((k) => k.id === id);
    if (index === -1) return false;
    store.keys.splice(index, 1);
    this.write(store);
    return true;
  }

  /**
   * Delete a key by its label.
   * Returns true if a key was found and deleted.
   */
  deleteByLabel(label: string): boolean {
    const store = this.read();
    const index = store.keys.findIndex((k) => k.label === label);
    if (index === -1) return false;
    store.keys.splice(index, 1);
    this.write(store);
    return true;
  }

  /**
   * Roll a key: create a new one, optionally expire the old one.
   * If oldId is provided, that key gets a 7-day expiry (overlap window).
   * Returns the new raw key.
   */
  roll(label: string, oldId?: string, expiresAt?: Date): KeyCreateResult {
    if (oldId) {
      const store = this.read();
      const entry = store.keys.find((k) => k.id === oldId);
      if (entry) {
        entry.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        this.write(store);
      }
    }
    return this.create(label, expiresAt);
  }

  /**
   * Check whether the key store has any active (non-expired) keys.
   */
  hasActiveKeys(): boolean {
    const store = this.read();
    const now = new Date();
    return store.keys.some((k) => !k.expires || new Date(k.expires) > now);
  }

  // ── Internal ──────────────────────────────────────────────────────────

  private hash(key: string): string {
    return createHash('sha256').update(key + this.pepper).digest('hex');
  }
}

/**
 * Resolve the pepper value.
 * Checks RELAY_KEY_PEPPER env var or generates a warning.
 */
export function resolvePepper(env: NodeJS.ProcessEnv = process.env): string {
  const pepper = env.RELAY_KEY_PEPPER?.trim();
  if (!pepper) {
    // Generate a random pepper for this session (won't persist across restarts)
    const generated = randomBytes(32).toString('hex');
    console.error(
      '\x1b[33m⚠  RELAY_KEY_PEPPER not set. Generated a session-only pepper.\n' +
      '   Keys created in this session will NOT survive a restart.\n' +
      '   Add RELAY_KEY_PEPPER=<random 32 hex bytes> to your .env file.\x1b[0m\n'
    );
    return generated;
  }
  return pepper;
}

/**
 * Bootstrap a pepper if none exists. Reads from .env, writes if missing or empty.
 * Returns the pepper value (existing or newly generated).
 */
export function bootstrapPepper(envPath: string): string {
  const content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  // Check if a non-empty pepper already exists
  const match = content.match(/^RELAY_KEY_PEPPER=(.+)$/m);
  if (match && match[1] && match[1].trim()) {
    return match[1].trim();
  }

  // Generate and write
  const pepper = randomBytes(32).toString('hex');

  if (content.includes('RELAY_KEY_PEPPER=')) {
    // Replace the existing (empty) line
    const updated = content.replace(/^RELAY_KEY_PEPPER=.*$/m, `RELAY_KEY_PEPPER=${pepper}`);
    writeFileSync(envPath, updated);
  } else {
    const append = `\n# API key pepper — do not share. Generated by relay setup.\nRELAY_KEY_PEPPER=${pepper}\n`;
    writeFileSync(envPath, content.trimEnd() + '\n' + append);
  }
  return pepper;
}
