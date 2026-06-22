/**
 * Terminal capabilities + degradable theme for the Relay setup TUI.
 *
 * One detection at module load; everything downstream asks `caps`. The goal is
 * an identical rich look on capable terminals, and a clean, legible fallback on
 * dumb ones:
 *   - colors degrade by depth   (truecolor → 256 → 16 → none)
 *   - glyphs degrade by unicode (rich unicode → ASCII)
 *   - piped / TERM=dumb output emits no escape codes at all
 *
 * Overrides: `--ascii` / RELAY_ASCII force ASCII glyphs; `--no-color` / NO_COLOR
 * force monochrome; `--plain` forces bare text. FORCE_COLOR/NO_COLOR/TERM=dumb
 * are honored for free via Node's getColorDepth().
 *
 * The color helpers (a, g, c, b, d …) deliberately close with attribute-specific
 * resets (`\x1b[39m` fg-default, `\x1b[22m` intensity-normal) instead of a full
 * `\x1b[0m`. A full reset clears the background too, which shreds the shaded
 * cards into ragged stripes. Attribute-specific resets keep a card's background
 * continuous across every colored span.
 */

type ColorLevel = 'none' | '16' | '256' | 'truecolor';

export interface Caps {
  /** Color fidelity available on this terminal. */
  color: ColorLevel;
  /** Whether unicode glyphs (block logo, box-drawing, emoji) render safely. */
  unicode: boolean;
  /** No escape codes at all — piped output or TERM=dumb. */
  plain: boolean;
}

function hasFlag(argv: string[], ...names: string[]): boolean {
  return names.some((n) => argv.includes(n));
}

function envTruthy(v: string | undefined): boolean {
  return v !== undefined && v !== '' && v !== '0' && v.toLowerCase() !== 'false';
}

function detectColor(argv: string[], plain: boolean): ColorLevel {
  if (plain) return 'none';
  if (hasFlag(argv, '--no-color', '--no-colour')) return 'none';
  if ((process.env.NO_COLOR ?? '') !== '') return 'none';
  // Node honors FORCE_COLOR / NO_COLOR / TERM=dumb in getColorDepth().
  let depth = 4;
  try {
    const out = process.stdout as { getColorDepth?: () => number };
    if (typeof out.getColorDepth === 'function') depth = out.getColorDepth();
  } catch {
    depth = 4;
  }
  if (depth >= 24) return 'truecolor';
  if (depth >= 8) return '256';
  if (depth >= 4) return '16';
  return 'none';
}

function detectUnicode(argv: string[]): boolean {
  if (hasFlag(argv, '--ascii')) return false;
  if (envTruthy(process.env.RELAY_ASCII)) return false;
  const env = process.env;
  const locale = `${env.LC_ALL ?? ''}:${env.LC_CTYPE ?? ''}:${env.LANG ?? ''}`;
  if (/utf-?8/i.test(locale)) return true;
  // Known UTF-8-clean hosts even when the locale is unset over SSH.
  if (env.WT_SESSION || env.TERM_PROGRAM || env.KITTY_WINDOW_ID || env.ALACRITTY_WINDOW_ID || env.GHOSTTY_RESOURCES_DIR) {
    return true;
  }
  if (/kitty|alacritty|wezterm|ghostty/i.test(env.TERM ?? '')) return true;
  // Conservative default: unknown locale → assume ASCII-only.
  return false;
}

function detectCaps(argv: string[] = process.argv.slice(2)): Caps {
  const isTTY = Boolean(process.stdout.isTTY);
  const plain = !isTTY || (process.env.TERM ?? '') === 'dumb' || hasFlag(argv, '--plain');
  const color = detectColor(argv, plain);
  const unicode = plain ? false : detectUnicode(argv);
  return { color, unicode, plain };
}

export const caps: Caps = detectCaps();

// ── Color codes (degraded by level) ───────────────────────────────────────

const lvl = caps.color;

/** 256/truecolor code, or its nearest 16-color equivalent. */
function pick(code256: string, code16: string): string {
  if (caps.plain || lvl === 'none') return '';
  return lvl === '16' ? code16 : code256;
}

export const ACCENT = pick('\x1b[38;5;75m', '\x1b[94m'); // steel blue → bright blue
export const ACCENT_BG = pick('\x1b[48;5;24m', '\x1b[44m'); // dark teal → blue background

const basic = (code: string) => (caps.plain || lvl === 'none' ? '' : code);
export const GREEN = basic('\x1b[32m');
export const YELLOW = basic('\x1b[33m');
export const RED = basic('\x1b[31m');
export const CYAN = basic('\x1b[36m');

// Attributes survive monochrome (NO_COLOR) — only fully-plain output drops them.
export const BOLD = caps.plain ? '' : '\x1b[1m';
export const DIM = caps.plain ? '' : '\x1b[2m';
export const INVERSE = caps.plain ? '' : '\x1b[7m';
export const RESET = caps.plain ? '' : '\x1b[0m';

// Attribute-specific closers — preserve background across colored spans.
const FG_OFF = caps.plain || lvl === 'none' ? '' : '\x1b[39m';
const ATTR_OFF = caps.plain ? '' : '\x1b[22m';

export const a = (s: string) => (ACCENT ? `${ACCENT}${s}${FG_OFF}` : s);
export const g = (s: string) => (GREEN ? `${GREEN}${s}${FG_OFF}` : s);
export const y = (s: string) => (YELLOW ? `${YELLOW}${s}${FG_OFF}` : s);
export const r = (s: string) => (RED ? `${RED}${s}${FG_OFF}` : s);
export const c = (s: string) => (CYAN ? `${CYAN}${s}${FG_OFF}` : s);
export const b = (s: string) => (BOLD ? `${BOLD}${s}${ATTR_OFF}` : s);
export const d = (s: string) => (DIM ? `${DIM}${s}${ATTR_OFF}` : s);

// ── Glyphs (degraded by unicode support) ──────────────────────────────────

/** The wordmark. Crisp block figlet on unicode terminals; plain on ASCII ones. */
export const LOGO: string[] = caps.unicode
  ? [
      '     ██████╗  ███████╗ ██╗       █████╗ ██╗   ██╗',
      '     ██╔══██╗ ██╔════╝ ██║      ██╔══██╗╚██╗ ██╔╝',
      '     ██████╔╝ █████╗   ██║      ███████║ ╚████╔╝ ',
      '     ██╔══██╗ ██╔══╝   ██║      ██╔══██║  ╚██╔╝  ',
      '     ██║  ██║ ███████╗ ███████╗ ██║  ██║   ██║   ',
      '     ╚═╝  ╚═╝ ╚══════╝ ╚══════╝ ╚═╝  ╚═╝   ╚═╝   ',
    ]
  : ['     R E L A Y'];

/** The horizontal rule character (box-drawing → ASCII dash). */
export const RULE_CH = caps.unicode ? '─' : '-';

/**
 * Fold rich glyphs down to ASCII when unicode is unavailable. Applied once at
 * the leaf render points, so call sites keep using readable unicode literals.
 * Emoji are paired with words everywhere, so dropping them never loses meaning.
 * Order matters: longer matches (emoji + trailing spaces) come first.
 */
const GLYPH_FOLD: Array<[string, string]> = [
  ['🖥  ', ''], ['📡  ', ''], ['☁  ', ''], ['🔒  ', ''], ['🌐  ', ''],
  ['🖥 ', ''], ['📡 ', ''], ['☁ ', ''], ['🔒 ', ''], ['🌐 ', ''],
  ['🎉 ', ''], ['🎉', ''], ['✨', ''], ['👋', ''],
  ['❯', '>'], ['→', '->'], ['←', '<-'], ['↑', '^'], ['↓', 'v'],
  ['⚠', '!'], ['ｉ', 'i'], ['ℹ', 'i'],
  ['★', '*'], ['●', 'o'], ['○', '.'], ['·', '-'], ['└', '`'],
  ['─', '-'], ['—', '-'], ['–', '-'], ['…', '...'],
];

export function fold(line: string): string {
  if (caps.unicode) return line;
  let out = line;
  for (const [from, to] of GLYPH_FOLD) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}
