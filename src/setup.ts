/**
 * Relay Setup TUI — probe gpu, pick quant, size context, no oom.
 *
 * Differential rendering via sexy-tui-rs. Horizontal rules + shaded cards.
 * Personality: precise, succinct — assumes you know your hardware, fills in
 * the gaps (quant tier, KV sizing, expert offload flags).
 */
import { createHash } from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { TUI, ProcessTerminal, Container, Text, Box, Spacer, Input, type Component, type Focusable, CURSOR_MARKER, matchesKey } from './tui/index.ts';
import { truncateToWidth, visibleWidth, wrapTextWithAnsi } from './tui/utils.ts';

import * as L from './setup-logic.ts';
import { resolve } from 'node:path';
import type { CatalogEntry, EnvMap, GpuProbe, FitClass } from './setup-logic.ts';
import { llamaStatus, backendLabel, type LlamaStatus } from './llama.ts';
import { dockerStatus, type DockerStatus } from './docker.ts';
import { listModels, downloadModel as downloadModelToDisk, installedPath, type ModelRow } from './models.ts';
import { cachedTestedCtx } from './probe.ts';
import { detectCloudflared, type CloudflaredInfo } from './cloudflare.ts';

// ── Theme ───────────────────────────────────────────────────────────────
// Colors, glyphs, and the logo all degrade with terminal capabilities; see
// setup-theme.ts. Color helpers close with attribute-specific resets so shaded
// card backgrounds stay continuous across colored spans.

import {
  ACCENT_BG, GREEN, YELLOW, RED, DIM, RESET, INVERSE,
  a, g, y, r, c, b, d, LOGO, RULE_CH, fold,
} from './setup-theme.ts';

// ── Fit label ─────────────────────────────────────────────────────────────
// Provenance-tagged, color-coded fit label for a model row. Green = a real fit
// (architectural max or empirically tested); yellow = calculated-but-untested;
// red = won't fit / RAM-tight. Honest by construction (see buildFitLabel).
function coloredFit(est: L.CatalogFitEstimate): string {
  const lbl = L.buildFitLabel(est);
  if (est.fit === 'too-large' || est.maxCtx <= 0) return r(lbl);   // ✗ no fit
  if (est.provenance === 'tested') return g(lbl);                  // ✓ confirmed
  if (est.ramTight || est.expertStrategy === 'partial-ngl') return y(lbl); // ⚠ tight
  return g(lbl);                                                   // ✓ runs (estimate)
}

// ── Plain-language legends ──────────────────────────────────────────────────
// Shown under dense tables so the symbols + acronyms mean something to a beginner.
function fitLegendLine(): string {
  return `  ${g('✓')} fit   ${y('⚠')} tight ${d('(try less ctx)')}   ${r('✗')} no   ${d('· number = how much ctx your vram hold · tested = we launched it')}`;
}
function glossaryLines(): string[] {
  return [
    `  ${d('MoE')} ${d('= big model. many expert parts inside. gpu use few at a time. rest wait in ram. so big model fit small gpu.')}`,
    `  ${d('Dense')} ${d('= no experts. whole model on gpu. simple. heavy.')}  ${d('·')}  ${d('A3B')} ${d('= ~3B params active. model maybe 30B but only 3B awake.')}`,
    `  ${d('Quant')} ${d('= squish model smaller. Q2 lot squish (rough). Q8 little squish (sharp). IQ = smart squish. K-quants = mix squish levels in one file.')}`,
  ];
}

// ── Custom components ───────────────────────────────────────────────────

/** Horizontal separator line. */
class HRule implements Component {
  private ch: string;
  private color: string;
  constructor(ch = RULE_CH, color = DIM) {
    this.ch = ch;
    this.color = color;
  }
  invalidate(): void {}
  render(width: number): string[] {
    return [fold(`${this.color}${this.ch.repeat(width)}${RESET}`)];
  }
}

/** Menu list — arrow-key navigation with inverse-video selection bar. */
class MenuList implements Component, Focusable {
  private items: Array<{ label: string; desc?: string; value: string }>;
  private idx = 0;
  private maxVisible: number;
  focused = false;
  onSelect?: (value: string) => void;
  onCancel?: () => void;

  constructor(items: Array<{ label: string; desc?: string; value: string }>, maxVisible = 10) {
    this.items = items;
    this.maxVisible = maxVisible;
    // Start on the first selectable item (skip headers / separators).
    this.idx = items.findIndex(it => it.value !== '');
    if (this.idx < 0) this.idx = 0;
  }

  invalidate(): void {}

  render(width: number): string[] {
    const lines: string[] = [];
    const vis = Math.min(this.maxVisible, this.items.length);
    const start = Math.max(0, Math.min(this.idx - Math.floor(vis / 3), this.items.length - vis));
    const end = start + vis;

    for (let i = start; i < end; i++) {
      const item = this.items[i]!;
      const selected = i === this.idx;
      const pointer = selected ? `${a(b('❯'))}` : ' ';
      const label = selected ? `${INVERSE} ${item.label} ${RESET}` : item.label;
      const raw = `  ${pointer} ${label}`;
      lines.push(truncateToWidth(raw, width, ''));
      if (item.desc) {
        lines.push(fold(`     ${d(truncateToWidth(item.desc, width - 5, ''))}`));
      }
    }

    if (this.items.length > this.maxVisible) {
      lines.push(d(`  (${this.idx + 1}/${this.items.length})`));
    }

    return lines.map(fold);
  }

  handleInput(data: string): void {
    if (matchesKey(data, 'up') || matchesKey(data, 'k')) {
      let next = this.idx;
      do { next = (next - 1 + this.items.length) % this.items.length; }
      while (next !== this.idx && !this.items[next]!.value);
      if (this.items[next]!.value) this.idx = next;
    } else if (matchesKey(data, 'down') || matchesKey(data, 'j')) {
      let next = this.idx;
      do { next = (next + 1) % this.items.length; }
      while (next !== this.idx && !this.items[next]!.value);
      if (this.items[next]!.value) this.idx = next;
    } else if (matchesKey(data, 'enter')) {
      this.onSelect?.(this.items[this.idx]!.value);
    } else if (matchesKey(data, 'escape') || matchesKey(data, 'q') || matchesKey(data, 'ctrl+c')) {
      this.onCancel?.();
    }
  }
}

/** Labeled input field with prompt text. */
class LabeledInput implements Component, Focusable {
  private input: Input;
  private label: string;
  focused = false;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;

  constructor(label: string, placeholder = '') {
    this.label = label;
    this.input = new Input();
    if (placeholder) this.input.setValue(placeholder);
    this.input.onSubmit = (v) => this.onSubmit?.(v);
    this.input.onEscape = () => this.onCancel?.();
  }

  getValue(): string {
    return this.input.getValue();
  }

  setValue(v: string): void {
    this.input.setValue(v);
  }

  setFocused(v: boolean): void {
    this.input.focused = v;
  }
  getFocused(): boolean {
    return this.input.focused;
  }

  invalidate(): void {
    this.input.invalidate();
  }

  handleInput(data: string): void {
    this.input.handleInput(data);
  }

  render(width: number): string[] {
    const inputLines = this.input.render(width);
    if (!this.label) return inputLines;
    return [fold(`  ${b(this.label)}`), ...inputLines];
  }
}

/** Static text block with padding. */
class Block implements Component {
  private lines: string[];
  constructor(lines: string[]) {
    this.lines = lines;
  }
  invalidate(): void {}
  render(width: number): string[] {
    // Word-wrap each line to the terminal width so narrow terminals don't break
    // text mid-word (or run it off the edge). fold first, then wrap, so width is
    // measured on the glyphs actually emitted.
    const w = Math.max(8, width || 80);
    const out: string[] = [];
    for (const line of this.lines) {
      const folded = fold(line);
      if (visibleWidth(folded) <= w) { out.push(folded); continue; }
      const indent = /^(\s*)/.exec(folded)?.[1] ?? '';
      const wrapped = wrapTextWithAnsi(folded, w);
      out.push(wrapped[0] ?? '');
      for (let i = 1; i < wrapped.length; i++) {
        // Re-indent continuations to match, but never re-overflow.
        const cont = indent + (wrapped[i] ?? '');
        out.push(visibleWidth(cont) <= w ? cont : (wrapped[i] ?? ''));
      }
    }
    return out;
  }
}

// ── TUI App ─────────────────────────────────────────────────────────────

type Screen =
  | 'welcome'
  | 'menu'
  | 'setup-mode'
  | 'setup-models'
  | 'setup-network'
  | 'setup-summary'
  | 'models'
  | 'runtime'
  | 'docker'
  | 'tunnel'
  | 'config'
  | 'params'
  | 'logs'
  | 'doctor'
  | 'about';

class RelayTUI {
  private tui: TUI;
  private terminal: ProcessTerminal;
  private screen: Screen = 'welcome';
  private gpu: GpuProbe | undefined;
  private hwLabel = 'your machine';
  private env: EnvMap;
  private setupMode: 'quickstart' | 'byo' | 'cloud' = 'quickstart';
  private selectedModels: CatalogEntry[] = [];
  private modelDir = '';
  private llamaServerPath = '';
  private networkMode: 'local' | 'expose' = 'local';
  private backend: L.FitBackend = 'cpu';
  private dramGb = 0;
  private diskCache: { ids: Set<string>; pathById: Map<string, string> } | null = null;
  private modelListEntries: CatalogEntry[] = [];

  constructor() {
    this.terminal = new ProcessTerminal();
    this.tui = new TUI(this.terminal);
    this.env = L.seedEnv();
    this.gpu = L.probeGpu();
    this.backend = this.gpu ? L.backendForGpu(this.gpu) : 'cpu';
    this.dramGb = L.detectAvailableRamGb();
    this.hwLabel = this.detectHwLabel();
    this.modelDir = this.env.get('RELAY_MODEL_DIR') ?? L.resolveHome('~/models');
    this.llamaServerPath = this.env.get('RELAY_LLAMA_SERVER_PATH') ?? L.detectLlamaServerPath();

    // Ctrl+C exits from anywhere
    this.tui.addInputListener((data) => {
      if (matchesKey(data, 'ctrl+c')) {
        this.quit();
        return { consume: true };
      }
      return undefined;
    });
  }

  private detectHwLabel(): string {
    if (this.gpu) {
      const vram = this.gpu.vram_total_gb;
      return `${this.gpu.gpu_type} (${vram} GB VRAM)`;
    }
    return 'CPU only';
  }

  private hwVerdict(): string {
    if (!this.gpu) return 'modest — we\'ll find a small model that runs great.';
    const budget = this.gpu.vram_total_gb;
    if (budget >= 22) return 'plenty of room — you can run big, smart models.';
    if (budget >= 12) return 'a comfy amount — solid coding models will fly.';
    if (budget >= 7) return 'enough for a capable everyday model.';
    return 'modest, but we\'ll find a small model that runs great.';
  }

  private vramStr(): string {
    return this.gpu ? `${this.gpu.vram_total_gb} GB GPU memory` : 'no dedicated GPU';
  }

  /** Fit estimate for a catalog row: model-dependent (GGUF kv_ptok/non-expert
   *  fraction) + hardware-dependent (VRAM + this.backend overhead), upgraded to
   *  "tested" when an on-disk model has a cached successful probe. */
  /** One disk walk per render, cached: catalog-id → on-disk path (+ id set).
   *  Avoids re-scanning the models dir for every row (1000+ entries). */
  private disk(): { ids: Set<string>; pathById: Map<string, string> } {
    if (this.diskCache) return this.diskCache;
    const files: Array<{ base: string; full: string }> = [];
    const walk = (dir: string, depth: number): void => {
      if (depth < 0) return;
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = resolve(dir, e.name);
        if (e.isDirectory()) walk(full, depth - 1);
        else if (e.isFile() && e.name.toLowerCase().endsWith('.gguf')) files.push({ base: e.name.toLowerCase(), full });
      }
    };
    walk(this.modelDir, 4);
    const ids = new Set<string>();
    const pathById = new Map<string, string>();
    for (const m of L.readCatalog()) {
      const fn = (m.filename ?? '').toLowerCase();
      const idStem = m.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const repo = (m.download_url ?? '').match(/huggingface\.co\/[^/]+\/([^/]+)/i)?.[1]?.toLowerCase();
      for (const f of files) {
        const clean = f.base.replace(/\.gguf$/i, '').replace(/[^a-z0-9]/g, '');
        const nameMatch = fn && f.base === fn;
        const stemMatch = idStem.length > 6 && clean.includes(idStem);
        if (nameMatch || stemMatch) {
          // Repo check: MTP and non-MTP share filenames. If the file path
          // contains a repo-like directory, it must match the catalog entry's
          // repo. Flat-dir downloads pass through (no repo in path to check).
          const pathLower = f.full.toLowerCase();
          const pathHasRepo = /unsloth\/[^/]+/.test(pathLower) || /mradermacher\/[^/]+/.test(pathLower);
          if (!repo || !pathHasRepo || pathLower.includes(repo)) { ids.add(m.id); pathById.set(m.id, f.full); break; }
        }
      }
    }
    this.diskCache = { ids, pathById };
    return this.diskCache;
  }

  private estFor(m: CatalogEntry): L.CatalogFitEstimate {
    if (!this.gpu || !m.size_gb) return { fit: 'unknown', maxCtx: 0, expertStrategy: 'none', ctxLabel: '?', provenance: 'calc', ramTight: false };
    const est = L.estimateContextFromCatalog(m, this.gpu, this.dramGb, undefined, this.backend);
    const path = this.disk().pathById.get(m.id);
    if (path) {
      const tested = cachedTestedCtx(path, this.gpu.vram_total_gb);
      if (tested) {
        return { ...est, provenance: 'tested', maxCtx: tested, ctxLabel: L.fmtCtx(tested),
          fit: est.fit === 'too-large' || est.fit === 'unknown' ? 'partial-offload' : est.fit, ramTight: false };
      }
    }
    return est;
  }

  /** Colored fit label for a catalog row. */
  private fitLabel(m: CatalogEntry): string {
    if (!this.gpu || !m.size_gb) return d('?');
    return coloredFit(this.estFor(m));
  }

  /** Sort score for "best fit first": comfortable fits (most ctx) rank highest,
   *  tight below, won't-fit last. */
  private fitScore(m: CatalogEntry): number {
    const est = this.estFor(m);
    if (est.fit === 'too-large' || est.maxCtx <= 0) return -1;
    const tight = est.ramTight || est.expertStrategy === 'partial-ngl';
    return (tight ? 0 : 1e12) + est.maxCtx;
  }

  // ── Screen rendering ──────────────────────────────────────────────────

  private renderScreen(): void {
    this.tui.clear();
    const build = this.screenBuilder();
    for (const comp of build) {
      this.tui.addChild(comp);
    }
    // Focus the last focusable component (usually the menu/input)
    const focusable = build.findLast((c): c is Component & Focusable => 'focused' in c);
    this.tui.setFocus(focusable ?? null);
    this.tui.requestRender(true);
  }

  private screenBuilder(): Component[] {
    switch (this.screen) {
      case 'welcome': return this.screenWelcome();
      case 'menu': return this.screenMenu();
      case 'setup-mode': return this.screenSetupMode();
      case 'setup-models': return this.screenSetupModels();
      case 'setup-network': return this.screenSetupNetwork();
      case 'setup-summary': return this.screenSetupSummary();
      case 'models': return this.screenModels();
      case 'runtime': return this.screenRuntime();
      case 'docker': return this.screenDocker();
      case 'tunnel': return this.screenTunnel();
      case 'config': return this.screenConfig();
      case 'params': return this.screenParams();
      case 'logs': return this.screenLogs();
      case 'doctor': return this.screenDoctor();
      case 'about': return this.screenAbout();
    }
  }

  private navigate(screen: Screen): void {
    this.screen = screen;
    this.renderScreen();
  }

  // ── Welcome ───────────────────────────────────────────────────────────

  private screenWelcome(): Component[] {
    const comps: Component[] = [];
    // Logo — accent only, never bold: bolding block/box-drawing glyphs makes
    // most terminal fonts double-strike them into a ghosted smear. The block
    // figlet is ~48 cols wide; on a narrower terminal it would wrap into garbage,
    // so fall back to a compact wordmark.
    const logoW = Math.max(...LOGO.map((l) => visibleWidth(l)));
    if (this.terminal.columns >= logoW + 4) {
      for (const ln of LOGO) comps.push(new Block([`  ${a(ln)}`]));
    } else {
      comps.push(new Block([`  ${a(b('⚡ relay'))}`]));
    }
    comps.push(new Block([`  ${c('local gpu inference — vram probe, quant pick, kv budget, no crash')}`]));
    comps.push(new Spacer(1));

    // Hardware — plain text, no colored backgrounds. Works on headless terminals.
    comps.push(new Block([
      `  ${b(this.hwLabel)}   ${this.vramStr()}   ${L.SYSTEM_RAM_GB} GB RAM`,
      `  ${d(this.hwVerdict())}`,
    ]));
    comps.push(new Spacer(1));

    // Greeting
    comps.push(new Block([
      `  ${a(b('relay — local gpu inference'))}`,
      ``,
      `  ${d('gpu → model → api. probe your vram. pick quant that fit. set ctx that no crash.')}`,
      `  ${d('proxy cloud apis through same port if you want.')}`,
      `  ${d('we do math first. no oom.')}`,
      ``,
      `  ${d('Press ')}${a(b('Enter'))}${d(' to begin.')}`,
    ]));

    // Input to proceed
    const proceed = new LabeledInput('', '');
    proceed.onSubmit = () => this.navigate('menu');
    proceed.onCancel = () => this.quit();
    comps.push(proceed);

    return comps;
  }

  // ── Main menu ─────────────────────────────────────────────────────────

  private miniHeader(): string[] {
    const mode = this.env.get('RELAY_MODE') ?? 'gateway';
    const model = this.env.get('DEFAULT_MODEL') || '—';
    const life = this.env.get('RELAY_MODEL_LIFECYCLE_ENABLED') === 'true' ? 'lazy' : 'always-on';
    return [
      `  ${a('⚡')} ${b('relay')} ${d('·')} ${this.hwLabel} ${d('·')} ${this.vramStr()} ${d('·')} ${L.SYSTEM_RAM_GB} GB RAM`,
      `  ${d(mode)} ${d('→')} ${c(L.endpoint(this.env))} ${d('·')} ${model} ${d('·')} lazy ${life}`,
    ];
  }

  private screenMenu(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));

    comps.push(new Block([`  ${a(b('What do you want to do?'))}`]));
    comps.push(new Spacer(1));

    const menu = new MenuList([
      { label: 'Setup', desc: 'guided model & endpoint configuration — start here', value: 'setup' },
      { label: 'Models', desc: 'download, delete, and see what\'s on disk', value: 'models' },
      { label: 'GPU runtime', desc: 'check or build llama.cpp for your GPU backend', value: 'runtime' },
      { label: 'Docker', desc: 'run & manage Relay as a container', value: 'docker' },
      { label: 'Tunnel', desc: 'expose Relay publicly (instant URL or your domain)', value: 'tunnel' },
      { label: 'Config', desc: '.env — bind, model map, api key, lazy start', value: 'config' },
      { label: 'Parameters', desc: 'temp, top_p, top_k, penalties — unset = model default', value: 'params' },
      { label: 'Logs', desc: 'tail of RELAY_LOG_FILE', value: 'logs' },
      { label: 'Doctor', desc: 'health & preflight checks', value: 'doctor' },
      { label: 'About', desc: `Relay v${L.relayVersion()}`, value: 'about' },
      { label: 'Quit', desc: 'exit relay setup', value: 'quit' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'quit') { this.quit(); return; }
      if (v === 'setup') { this.navigate('setup-mode'); return; }
      this.navigate(v as Screen);
    };
    menu.onCancel = () => this.quit();
    comps.push(menu);

    comps.push(new Spacer(1));
    comps.push(new Block([`  ${d('↑↓ move · Enter pick · q back/quit')}`]));

    return comps;
  }

  // ── Setup wizard: mode select ─────────────────────────────────────────

  private screenSetupMode(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));

    comps.push(new Block([`  ${a(b('How do you want to use Relay?'))}  ${d('(Step 1)')}`]));
    comps.push(new Spacer(1));

    const menu = new MenuList([
      { label: '🖥  Local model — run on my GPU', desc: 'pick from a catalog, auto-tune flags for your hardware', value: 'quickstart' },
      { label: '📡  Use a server I already have', desc: 'point relay at Ollama or an existing llama.cpp server', value: 'byo' },
      { label: '☁  Cloud — proxy Gemini, OpenAI, etc.', desc: 'one tidy endpoint in front of cloud APIs. No local GPU needed.', value: 'cloud' },
      { label: '← Back to menu', desc: '', value: 'back' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
      this.setupMode = v as 'quickstart' | 'byo' | 'cloud';
      if (this.setupMode === 'byo') { this.showByoConfig(); }
      else if (this.setupMode === 'cloud') { this.showCloudConfig(); }
      else { this.navigate('setup-models'); }
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);

    return comps;
  }

  // ── Setup wizard: model picker (quickstart) ───────────────────────────

  private screenSetupModels(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));

    comps.push(new Block([`  ${a(b('Pick a model'))}  ${d('(Step 2)')}`]));
    comps.push(new Spacer(1));

    if (this.gpu) {
      comps.push(new Block([
        `  ${g('●')} ${this.gpu.gpu_type}/${this.gpu.driver} · ${this.gpu.vram_total_gb} GB VRAM · ${L.SYSTEM_RAM_GB} GB RAM`,
      ]));
    } else {
      comps.push(new Block([
        `  ${y('⚠')} No GPU. Showing catalog. MoE --cpu-moe still works.`,
      ]));
    }
    comps.push(new Spacer(1));

    const catalog = L.readCatalog();
    if (catalog.length === 0) {
      comps.push(new Block([`  ${r('No model catalog found.')} ${d('Check that docs/model-catalog.json exists.')}`]));
      const back = new MenuList([{ label: '← Back', value: 'back' }]);
      back.onSelect = () => this.navigate('setup-mode');
      back.onCancel = () => this.navigate('setup-mode');
      comps.push(back);
      return comps;
    }

    // Lane filter — built dynamically from the catalog's actual lanes so it can
    // never go stale as the registry grows.
    const laneLabels: Record<string, string> = {
      code: 'Coding', reasoning: 'Reasoning', text: 'General / chat',
      vision: 'Vision (image input)', dense: 'Dense', moe: 'Mixture of Experts',
      function: 'Function calling', long: 'Long context',
    };
    const laneCounts = new Map<string, number>();
    for (const m of catalog) laneCounts.set(m.lane, (laneCounts.get(m.lane) ?? 0) + 1);
    const laneItems = [...laneCounts.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([lane, n]) => ({ label: laneLabels[lane] ?? (lane.charAt(0).toUpperCase() + lane.slice(1)), value: lane, desc: `${n} options` }));
    laneItems.push({ label: 'All models', value: '__all__', desc: `${catalog.length} options` });
    laneItems.push({ label: '← Back', value: 'back', desc: '' });

    const laneMenu = new MenuList(laneItems);
    laneMenu.onSelect = (lane) => {
      if (lane === 'back') { this.navigate('setup-mode'); return; }
      this.showModelList(lane === '__all__' ? catalog : catalog.filter(m => m.lane === lane));
    };
    laneMenu.onCancel = () => this.navigate('setup-mode');
    comps.push(laneMenu);

    return comps;
  }

  // ── Level 2: model list (one row per model; drill into quants) ──────────
  // 1000+ catalog entries is unusable as a flat list, so we group by model
  // (hf_repo) and let the user pick a model, THEN its quant.
  private modelKey(m: CatalogEntry): string {
    const repo = (m as unknown as { hf_repo?: string }).hf_repo;
    return repo || `${m.family}\x00${L.stripQuantForDisplay(m.label, m.quant)}`;
  }

  private showModelList(entries: CatalogEntry[]): void {
    this.diskCache = null; // fresh disk scan for this view
    this.modelListEntries = entries;
    const ids = this.disk().ids;

    const groups = new Map<string, CatalogEntry[]>();
    for (const m of entries) {
      const k = this.modelKey(m);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(m);
    }
    type Model = { key: string; name: string; moe: boolean; quants: CatalogEntry[]; installed: boolean; score: number; best: CatalogEntry };
    const models: Model[] = [...groups.entries()].map(([key, quants]) => {
      const best = quants.reduce((bq, q) => this.fitScore(q) > this.fitScore(bq) ? q : bq, quants[0]!);
      return {
        key, name: L.stripQuantForDisplay(quants[0]!.label, quants[0]!.quant),
        moe: quants.some(q => q.moe), quants, installed: quants.some(q => ids.has(q.id)),
        score: this.fitScore(best), best,
      };
    });
    models.sort((x, y) => (y.installed ? 1 : 0) - (x.installed ? 1 : 0) || y.score - x.score || x.name.localeCompare(y.name));

    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Choose a model'))}  ${d(`(${models.length} models — pick one, then its quant)`)}`]));
    if (this.gpu) comps.push(new Block([`  ${d(`VRAM: ${this.gpu.vram_total_gb}GB (${(this.gpu.vram_total_gb - 2).toFixed(1)}GB usable) · DRAM offload: ${this.dramGb}GB`)}`]));
    comps.push(new Spacer(1));
    comps.push(new Block([fitLegendLine()]));
    comps.push(new Spacer(1));

    const pad = (s: string, w: number): string => s + ' '.repeat(Math.max(0, w - visibleWidth(s)));
    const G = '  ';
    const rowAvail = Math.max(16, this.terminal.columns - 4);
    const colFit = 18, colKind = 9, LEAD = 2;
    const showFit = rowAvail >= LEAD + 14 + G.length + colFit;
    const showKind = showFit && rowAvail >= LEAD + 14 + G.length + colFit + G.length + colKind;
    const reserved = LEAD + (showFit ? G.length + colFit : 0) + (showKind ? G.length + colKind : 0);
    const nameW = Math.max(10, Math.min(36, rowAvail - reserved));

    const items: Array<{ value: string; label: string; desc: string }> = [];
    const hdr = ['  ' + pad(d('model'), nameW)];
    if (showFit) hdr.push(pad(d('fit / ctx'), colFit));
    if (showKind) hdr.push(d('quants'));
    items.push({ value: '', label: hdr.join(G), desc: '' });
    items.push({ value: '', label: `  ${g('●')} ${d('on disk')}   ${d('○ not downloaded')}`, desc: '' });
    items.push({ value: '', label: '', desc: '' });

    for (const mdl of models) {
      const marker = mdl.installed ? g('●') : d('○');
      const parts = [`${marker} ${pad(truncateToWidth(mdl.name, nameW, '…'), nameW)}`];
      if (showFit) parts.push(pad(this.fitLabel(mdl.best), colFit));
      if (showKind) parts.push(d(`${mdl.moe ? 'MoE' : 'dense'}·${mdl.quants.length}`));
      items.push({ value: mdl.key, label: parts.join(G), desc: '' });
    }

    const menu = new MenuList(items, Math.max(8, this.terminal.rows - 11));
    menu.onSelect = (key) => {
      if (!key) return;
      const mdl = models.find(x => x.key === key);
      if (mdl) this.showQuantPicker(mdl.name, mdl.quants);
    };
    menu.onCancel = () => this.navigate('setup-models');
    comps.push(menu);
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${d('↑/↓ browse · Enter to see quants · Esc back')}`]));

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(menu);
    this.tui.requestRender(true);
  }

  // ── Level 3: quant picker for one model ─────────────────────────────────
  private showQuantPicker(modelName: string, quants: CatalogEntry[]): void {
    const ids = this.disk().ids;
    const quantRank = (q: string): number => {
      const ql = q.toLowerCase();
      if (ql.includes('q8') || ql.includes('q6') || ql.includes('f16')) return 0;
      if (ql.includes('q5')) return 1;
      if (ql.includes('q4')) return 2;
      if (ql.includes('q3') || ql.includes('iq3')) return 3;
      if (ql.includes('q2') || ql.includes('iq2')) return 4;
      return 5;
    };
    // Comfortable fits first, then tight, then won't-fit; within a tier, best
    // quality first. (Sort by fit — the user's ask — with quality as tiebreak.)
    const tierOf = (m: CatalogEntry): number => {
      const e = this.estFor(m);
      if (e.fit === 'too-large' || e.maxCtx <= 0) return 2;
      return (e.ramTight || e.expertStrategy === 'partial-ngl') ? 1 : 0;
    };
    const sorted = [...quants].sort((a, b) =>
      tierOf(a) - tierOf(b) || quantRank(a.quant) - quantRank(b.quant) || (b.size_gb ?? 0) - (a.size_gb ?? 0));

    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b(modelName))}  ${d(`(${quants.length} quants — best fit first)`)}`]));
    comps.push(new Spacer(1));
    comps.push(new Block([fitLegendLine()]));
    comps.push(new Block(glossaryLines()));
    comps.push(new Spacer(1));

    const pad = (s: string, w: number): string => s + ' '.repeat(Math.max(0, w - visibleWidth(s)));
    const G = '  ';
    const rowAvail = Math.max(16, this.terminal.columns - 4);
    const colQuant = 11, colFit = 18, colSize = 6, LEAD = 2;
    const showFit = rowAvail >= LEAD + colQuant + G.length + colFit;
    const showSize = showFit && rowAvail >= LEAD + colQuant + G.length + colFit + G.length + colSize;
    const showRec = showSize && rowAvail >= LEAD + colQuant + G.length + colFit + G.length + colSize + G.length + 12;

    const items: Array<{ value: string; label: string; desc: string }> = [];
    const hdr = ['  ' + pad(d('quant'), colQuant)];
    if (showFit) hdr.push(pad(d('runs?'), colFit));
    if (showSize) hdr.push(pad(d('size'), colSize));
    if (showRec) hdr.push(d('quality'));
    items.push({ value: '', label: hdr.join(G), desc: '' });
    items.push({ value: '', label: `  ${g('●')} ${d('downloaded')} ${d('○ not')}  ${g('★ recommended')} ${d('= IQ3/IQ4')}  ${r('avoid')} ${d('= 1–2 bit')}`, desc: '' });
    items.push({ value: '', label: '', desc: '' });

    for (const m of sorted) {
      const onDisk = ids.has(m.id);
      const marker = onDisk ? g('●') : d('○');
      const tier = L.quantTier(m.quant);
      const rec = tier === 'recommended' ? g('★ recommended') : tier === 'not-recommended' ? r('avoid (lossy)') : d('ok');
      const sizeGb = typeof m.size_gb === 'number' ? m.size_gb.toFixed(1).replace(/\.0$/, '') : '?';
      const parts = [`${marker} ${pad(m.quant.toUpperCase(), colQuant)}`];
      if (showFit) parts.push(pad(this.fitLabel(m), colFit));
      if (showSize) parts.push(pad(sizeGb + 'GB' + (m.shards ? `·${m.shards}` : ''), colSize));
      if (showRec) parts.push(rec);
      items.push({ value: m.id, label: parts.join(G), desc: '' });
    }

    const menu = new MenuList(items, Math.max(8, this.terminal.rows - 13));
    menu.onSelect = (id) => {
      if (!id) return;
      const model = quants.find(q => q.id === id);
      if (model) { this.selectedModels = [model]; this.applyQuickstart(); this.navigate('setup-network'); }
    };
    menu.onCancel = () => this.showModelList(this.modelListEntries);
    comps.push(menu);
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${d('↑/↓ browse · Enter to pick · Esc back to models')}`]));

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(menu);
    this.tui.requestRender(true);
  }

  // ── Setup wizard: networking ──────────────────────────────────────────

  private screenSetupNetwork(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Bind address'))}  ${d('(Step 3)')}`]));
    comps.push(new Spacer(1));

    const cf = L.detectCloudflare();
    if (cf.installed) {
      const names = cf.tunnels.map(t => t.name).join(', ');
      comps.push(new Block([
        `  ${c('i')} cloudflared ${cf.version ?? ''} detected${names ? ` · tunnels: ${names}` : ''}${cf.serviceActive ? ' · service active' : ''}`.replace(/\s+·/, ' ·'),
      ]));
      comps.push(new Spacer(1));
    }

    const menu = new MenuList([
      { label: '🔒  127.0.0.1 (loopback)', desc: 'localhost. Safe. Tunnel from this host for WAN.', value: 'local' },
      { label: '🌐  0.0.0.0 (all interfaces)', desc: 'LAN + Docker. Requires API_KEY. Trust proxy for rate limits.', value: 'expose' },
      { label: '← Back', value: 'back' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'back') {
        if (this.setupMode === 'quickstart') this.navigate('setup-models');
        else this.navigate('setup-mode');
        return;
      }
      this.networkMode = v as 'local' | 'expose';
      L.configureNetwork(this.env, this.networkMode);
      // Persist everything the wizard configured (quickstart/BYO/cloud all pass
      // through here on the way to the summary). Without this the summary's
      // "Config written ✓" would be a lie and startRelay would use stale config.
      L.writeEnv(L.ENV_PATH, this.env);
      this.navigate('setup-summary');
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);

    return comps;
  }

  // ── Setup wizard: summary ─────────────────────────────────────────────

  private screenSetupSummary(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));

    const host = this.env.get('HOST') ?? '127.0.0.1';
    const port = this.env.get('PORT') ?? '1234';
    const endpoint = `http://${host}:${port}/v1`;
    const defaultModel = this.env.get('DEFAULT_MODEL') ?? '(none)';
    const lifecycle = this.env.get('RELAY_MODEL_LIFECYCLE_ENABLED') === 'true' ? g('lazy') : d('always');

    // ── Checklist ──────────────────────────────────────────────────────
    const checks: string[] = [];
    const menuItems: Array<{ label: string; desc: string; value: string }> = [];
    let allReady = true;

    // 1. Config
    checks.push(`  ${g('✓')} Config saved  ${d('·')}  ${c(endpoint)}  ${d('·')}  default ${b(defaultModel)}  ${d('·')}  lazy ${lifecycle}`);

    // 2. Model GGUF
    let ggufPath = '';
    if (this.setupMode === 'quickstart' && this.selectedModels[0]) {
      const model = this.selectedModels[0];
      ggufPath = installedPath(model, this.modelDir) ?? '';
      if (ggufPath) {
        checks.push(`  ${g('✓')} ${b(model.label)}  ${d(`GGUF on disk. Ready for probe.`)}`);
      } else {
        checks.push(`  ${y('⚠')} ${b(model.label)}  ${d(`${model.size_gb ?? '?'} GB — needs download`)}`);
        allReady = false;
        if (model.download_url) {
          menuItems.push({
            label: `⬇  Download ${model.label}`,
            desc: `~${model.size_gb ?? '?'} GB from HuggingFace`,
            value: 'download',
          });
        }
      }
    } else if (this.setupMode === 'byo') {
      checks.push(`  ${y('⚠')} BYO — upstream at ${c(this.env.get('UPSTREAM_BASE_URL') ?? '')} ${d('(no lifecycle, no probe)')}`);
    }

    // 3. Cloudflared (only if exposing)
    const cf = L.detectCloudflare();
    if (this.networkMode === 'expose') {
      if (cf.installed) {
        const tunes = cf.tunnels.map(t => t.name).join(', ') || 'none configured';
        checks.push(`  ${g('✓')} cloudflared ${cf.version ?? ''}  ${d('·')}  tunnels: ${tunes}${cf.serviceActive ? '  ·  service active' : ''}`);
      } else {
        checks.push(`  ${y('⚠')} cloudflared missing  ${d('— need for public URL')}`);
        allReady = false;
        menuItems.push({
          label: '🔧  Install cloudflared',
          desc: 'download + install the Cloudflare tunnel client',
          value: 'install-cf',
        });
      }
    } else {
      checks.push(`  ${g('✓')} loopback only  ${d('— safe. add tunnel for WAN.')}`);
    }

    // 4. Start
    if (allReady) {
      checks.push(``);
      checks.push(`  ${g(b('Ready.'))}`);
      checks.push(`    ${d('bare-metal:')} ${b('relay')}   ${d('·')}   ${d('container:')} ${b('relay docker up')}`);
      checks.push(`    ${d('→')} ${c(endpoint)}`);
    }

    comps.push(new Block(checks));
    comps.push(new Spacer(1));

    // ── Actions menu ───────────────────────────────────────────────────
    if (allReady) {
      menuItems.push({ label: '🚀  Start Relay now', desc: `bare-metal on ${c(endpoint)}`, value: 'start' });
      menuItems.push({ label: '🐳  Start in Docker', desc: 'managed container (restarts on boot/crash)', value: 'start-docker' });
    }
    menuItems.push({ label: '← Back to menu', desc: '', value: 'menu' });
    menuItems.push({ label: 'Quit', desc: '', value: 'quit' });

    const menu = new MenuList(menuItems);
    menu.onSelect = (v) => {
      if (v === 'quit') { this.quit(); return; }
      if (v === 'download') { this.downloadSelectedModel(); return; }
      if (v === 'install-cf') { this.installCloudflared(); return; }
      if (v === 'start') { this.startRelay(); return; }
      if (v === 'start-docker') { this.runCli(['docker', 'up']); this.navigate('docker'); return; }
      this.navigate('menu');
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);

    return comps;
  }

  // ── Apply quickstart config ───────────────────────────────────────────

  private applyQuickstart(): void {
    if (this.selectedModels.length === 0) return;
    const modelPaths = new Map<string, string>();
    for (const model of this.selectedModels) {
      const defaultPath = resolve(this.modelDir, model.filename ?? `${model.id}.gguf`);
      modelPaths.set(model.id, defaultPath);
    }
    L.configureQuickstart(this.env, this.selectedModels, modelPaths, this.llamaServerPath, this.modelDir, this.gpu);
  }

  // ── Install cloudflared ───────────────────────────────────────────────

  private installCloudflared(): void {
    // Actually install (download into ~/.local/bin, no sudo), then drop the user
    // on the Tunnel screen to get a public URL.
    this.runCli(['tunnel', 'install']);
    this.navigate('tunnel');
  }

  // ── Start relay ───────────────────────────────────────────────────────

  private startRelay(): void {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Starting Relay…'))}`]));
    comps.push(new Spacer(1));
    comps.push(new Block([
      `  ${d('TUI exits. Relay daemonizes on port ' + (this.env.get('PORT') ?? '1234') + '.')}`,
      `  ${d('Lazy model starts on first request.')}`,
      '',
      `  ${c(`Endpoint: http://${this.env.get('HOST') ?? '127.0.0.1'}:${this.env.get('PORT') ?? '1234'}/v1`)}`,
      '',
      `  ${d('Stop:')} ${b('pkill -f relay')}  ${d('·')}  ${d('systemd:')} ${b('relay docker up')}`,
    ]));
    comps.push(new Spacer(1));

    const menu = new MenuList([
      { label: '🚀  Start now', desc: 'exit TUI and launch relay', value: 'go' },
      { label: '← Back', desc: '', value: 'back' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('setup-summary'); return; }
      // Start relay: stop TUI, spawn detached child, exit
      this.tui.stop();
      const child = spawn('node', ['--experimental-strip-types', 'bin/relay.js'], {
        cwd: L.PKG,
        detached: true,
        stdio: 'inherit',
        env: { ...process.env },
      });
      child.unref();
      process.exit(0);
    };
    menu.onCancel = () => this.navigate('setup-summary');
    comps.push(menu);

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(menu);
    this.tui.requestRender(true);
  }

  // ── Download model ────────────────────────────────────────────────────

  private downloadSelectedModel(): void {
    const model = this.selectedModels[0];
    if (!model?.download_url) return;

    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Downloading model…'))}`]));
    comps.push(new Spacer(1));
    comps.push(new Block([
      `  ${b(model.label)}  ${d(`(~${model.size_gb ?? '?'} GB)`)}`,
      `  ${d(model.download_url ?? '')}`,
      '',
      `  ${d('Downloading GGUF. Resumable (curl -C). Progress below.')}`,
      `  ${d('Ctrl+C cancels. Partial file kept for resume.')}`,
    ]));
    comps.push(new Spacer(1));

    // Show the screen then start download
    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.requestRender(true);

    // Brief pause so the user sees the screen before raw download output
    setTimeout(() => {
      try {
        this.tui.stop();
        downloadModelToDisk(model, this.modelDir);   // disk-space checked + resumable
        // The GGUF is on disk now — re-run sizing so the start script gets the
        // real hardware-tuned flags (incl. the MoE expert offload), then persist.
        this.applyQuickstart();
        L.writeEnv(L.ENV_PATH, this.env);
        this.tui.start();
        this.navigate('setup-summary');
      } catch (err) {
        this.tui.start();
        const errComps: Component[] = [];
        errComps.push(new Block(this.miniHeader()));
        errComps.push(new HRule());
        errComps.push(new Spacer(1));
        errComps.push(new Block([`  ${r(`Download failed: ${err instanceof Error ? err.message : String(err)}`)}`]));
        errComps.push(new Spacer(1));
        const back = new MenuList([{ label: '← Back to summary', value: 'back' }]);
        back.onSelect = () => this.navigate('setup-summary');
        back.onCancel = () => this.navigate('setup-summary');
        errComps.push(back);
        this.tui.clear();
        for (const comp of errComps) this.tui.addChild(comp);
        this.tui.setFocus(back);
        this.tui.requestRender(true);
      }
    }, 300);
  }

  // ── Run a `relay` subcommand with the TUI suspended ─────────────────────
  // Stops the TUI so the user watches the child's live output (build progress,
  // download bars, docker logs), then resumes. spawnSync makes the parent ignore
  // SIGINT while the child runs, so Ctrl+C cancels the action, not the wizard.
  private runCli(args: string[]): number {
    this.tui.stop();
    process.stdout.write('\n');
    const r = spawnSync(process.execPath, ['--experimental-strip-types', resolve(L.PKG, 'src', 'main.ts'), ...args], {
      cwd: L.PKG, stdio: 'inherit', env: { ...process.env },
    });
    process.stdout.write('\n  (press Enter to return to Relay)');
    try { execFileSync('bash', ['-c', 'read -r _ || true'], { stdio: ['inherit', 'ignore', 'ignore'] }); } catch { /* ignore */ }
    this.tui.start();
    return r.status ?? 1;
  }

  // ── GPU runtime (llama.cpp) screen ──────────────────────────────────────

  private screenRuntime(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('llama.cpp runtime'))}  ${d('inference engine — builds per GPU backend')}`]));
    comps.push(new Spacer(1));

    const s: LlamaStatus = llamaStatus();
    const lines: string[] = [];
    lines.push(`  ${d('GPU')}         ${b(s.hw.vendor)}${s.hw.gpuName ? ' ' + s.hw.gpuName : ''}  ${d('·')}  ${s.hw.vramGb} GB VRAM`);
    lines.push(`  ${d('backend')}     ${backendLabel(s.desiredBackend)}`);
    if (s.working) {
      lines.push(`  ${g('✓')} binary ready  ${d('·')}  ${d(s.working.path)}  ${d('·')}  ${s.working.version ?? ''}`);
      for (const dvc of s.working.devices) lines.push(`     ${d(dvc.id + ': ' + dvc.name)}`);
    } else {
      lines.push(`  ${y('⚠')} No working llama-server yet — I can build one for your GPU.`);
      if (!s.prereqs.ok) {
        lines.push(`  ${r('first install:')} ${s.prereqs.missing.join(', ')}`);
        lines.push(`     ${d(s.prereqs.installHint)}`);
      }
    }
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const items: Array<{ label: string; desc: string; value: string }> = [];
    items.push({
      label: s.working ? '🔁  Rebuild llama.cpp' : '🔧  Build llama.cpp for my GPU',
      desc: `compiles the ${s.desiredBackend} backend — takes a few minutes${s.prereqs.ok ? '' : ' (install the tools above first)'}`,
      value: 'build',
    });
    if (s.working) items.push({ label: '🔎  Verify again', desc: 'run it and list the GPU devices it sees', value: 'verify' });
    items.push({ label: '← Back to menu', desc: '', value: 'back' });

    const menu = new MenuList(items);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
      if (v === 'build') { this.runCli(['llama', 'build', ...(s.working ? ['--force'] : [])]); this.navigate('runtime'); return; }
      if (v === 'verify') { this.runCli(['llama', 'verify']); this.navigate('runtime'); return; }
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);
    return comps;
  }

  // ── Docker screen ───────────────────────────────────────────────────────

  private screenDocker(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Docker'))}  ${d('containerized gateway — host net + GPU passthrough')}`]));
    comps.push(new Spacer(1));

    const s: DockerStatus = dockerStatus();
    const lines: string[] = [];
    if (!s.docker.installed) {
      lines.push(`  ${r('✗')} Docker is not installed.`);
      lines.push(`     ${d('Install it: https://docs.docker.com/engine/install/')}`);
      comps.push(new Block(lines));
      comps.push(new Spacer(1));
      const back = new MenuList([{ label: '← Back to menu', value: 'back' }]);
      back.onSelect = () => this.navigate('menu');
      back.onCancel = () => this.navigate('menu');
      comps.push(back);
      return comps;
    }
    lines.push(`  ${d('daemon')}     ${s.docker.daemonRunning ? g('running') : y(s.docker.reason ?? 'down')}  ${d('· compose')} ${s.docker.compose ?? 'n/a'}`);
    lines.push(`  ${d('llama build')} ${s.buildDirExists ? d(s.buildDir) : y(s.buildDir + ' (missing)')}  ${d('· backend')} ${s.backend}`);
    lines.push(`  ${d('image')}       ${s.image ? g('skaft-relay:local ✓') : d('not built')}`);
    lines.push(`  ${d('container')}   ${s.container.exists ? (s.container.running ? g('running') : y('stopped')) + ' ' + d(s.container.status ?? '') : d('none')}`);
    lines.push(`  ${d('compose')}     ${s.composeExists ? d(s.composeFile) : d('not written yet')}`);
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const items: Array<{ label: string; desc: string; value: string }> = [];
    if (!s.docker.daemonRunning) {
      items.push({ label: '↻  Re-check Docker', desc: 'after starting the daemon / fixing permissions', value: 'recheck' });
    } else if (s.container.running) {
      items.push({ label: '📜  View logs', desc: 'follow the gateway logs (Ctrl+C to stop)', value: 'logs' });
      items.push({ label: '🔁  Restart', desc: 'restart the container', value: 'restart' });
      items.push({ label: '⏹  Stop', desc: 'stop & remove the container', value: 'down' });
    } else {
      items.push({ label: '🚀  Start in Docker', desc: 'write compose, build if needed, and run', value: 'up' });
      items.push({ label: '🔨  Build image only', desc: 'build skaft-relay:local without starting', value: 'build' });
      items.push({ label: '📝  Write compose file', desc: 'generate docker-compose.yml for this host', value: 'render' });
    }
    items.push({ label: '← Back to menu', desc: '', value: 'back' });

    const menu = new MenuList(items);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
      if (v === 'recheck') { this.navigate('docker'); return; }
      this.runCli(['docker', v]);
      this.navigate('docker');
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);
    return comps;
  }

  // ── Tunnel screen (Cloudflare) ──────────────────────────────────────────

  private screenTunnel(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Cloudflare Tunnel'))}  ${d('WAN exposure — quick (anonymous) or named (your domain)')}`]));
    comps.push(new Spacer(1));

    const cf: CloudflaredInfo = detectCloudflared();
    const port = this.env.get('PORT') ?? '1234';
    const lines: string[] = [];
    if (!cf.installed) {
      lines.push(`  ${y('⚠')} cloudflared not in PATH. Install to ~/.local/bin (no root).`);
    } else {
      lines.push(`  ${g('✓')} cloudflared ${cf.version ?? ''}  ${d('·')}  ${cf.loggedIn ? 'account authed' : d('no account — quick tunnel works anyway')}`);
      if (cf.tunnels.length) lines.push(`  ${d('your tunnels:')} ${cf.tunnels.map((t) => t.name).join(', ')}`);
    }
    lines.push('');
    lines.push(`  ${d('Quick = trycloudflare.com subdomain, no login. Named = your domain, DNS auto.')}`);
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const items: Array<{ label: string; desc: string; value: string }> = [];
    if (!cf.installed) {
      items.push({ label: '⬇  Install cloudflared', desc: 'download into ~/.local/bin', value: 'install' });
    } else {
      items.push({ label: '⚡  Instant public URL', desc: `quick tunnel to localhost:${port} (Ctrl+C to stop)`, value: 'quick' });
      if (!cf.loggedIn) items.push({ label: '🔑  Link my Cloudflare account', desc: 'opens a browser to authenticate', value: 'login' });
      items.push({ label: '🌐  Named tunnel (my domain)', desc: 'create + route DNS + config for a hostname you own', value: 'named' });
    }
    items.push({ label: '← Back to menu', desc: '', value: 'back' });

    const menu = new MenuList(items);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
      if (v === 'install') { this.runCli(['tunnel', 'install']); this.navigate('tunnel'); return; }
      if (v === 'quick') { this.runCli(['tunnel', 'quick', '--port', port]); this.navigate('tunnel'); return; }
      if (v === 'login') { this.runCli(['tunnel', 'login']); this.navigate('tunnel'); return; }
      if (v === 'named') {
        this.promptChain('Named tunnel', [
          { label: 'Tunnel name:', placeholder: 'relay' },
          { label: 'Public hostname (a domain on your Cloudflare account):', placeholder: 'relay.example.com', hint: 'The DNS record will be created for you.' },
        ], (vals) => {
          this.runCli(['tunnel', 'named', vals[0]!, vals[1]!, '--port', port]);
          this.navigate('tunnel');
        }, () => this.navigate('tunnel'));
        return;
      }
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);
    return comps;
  }

  // ── Model download / delete picker ──────────────────────────────────────

  private showModelActionPicker(kind: 'download' | 'delete' | 'probe'): void {
    const rows: ModelRow[] = listModels(this.modelDir);
    const candidates = kind === 'download'
      ? rows.filter((rr) => !rr.installed && rr.model.download_url)
      : rows.filter((rr) => rr.installed);
    const title = kind === 'download' ? 'Download a model' : kind === 'probe' ? 'Test a model (probe)' : 'Delete a model';

    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b(title))}`]));
    comps.push(new Spacer(1));

    if (candidates.length === 0) {
      comps.push(new Block([`  ${d(kind === 'download' ? 'Every catalog model is already on disk.' : 'No models are installed yet.')}`]));
      const back = new MenuList([{ label: '← Back', value: 'back' }]);
      back.onSelect = () => this.navigate('models');
      back.onCancel = () => this.navigate('models');
      comps.push(back);
      this.tui.clear();
      for (const comp of comps) this.tui.addChild(comp);
      this.tui.setFocus(back);
      this.tui.requestRender(true);
      return;
    }

    const items = candidates.map((rr) => ({
      value: rr.model.id,
      label: rr.model.id,
      desc: kind === 'download'
        ? `~${rr.model.size_gb ?? '?'} GB · ${L.buildFitLabel(this.gpu ? L.estimateContextFromCatalog(rr.model, this.gpu) : { fit: 'unknown', maxCtx: 0, expertStrategy: 'none', ctxLabel: '?', provenance: 'calc', ramTight: false })}`
        : kind === 'probe'
        ? `${rr.sizeOnDiskGb ?? '?'} GB on disk — launch it & verify the real fit`
        : `${rr.sizeOnDiskGb ?? '?'} GB on disk — frees space`,
    }));
    items.push({ value: 'back', label: '← Back', desc: '' });

    const menu = new MenuList(items, Math.max(8, this.terminal.rows - 8));
    menu.onSelect = (id) => {
      if (id === 'back' || !id) { this.navigate('models'); return; }
      if (kind === 'probe') this.runCli(['probe', id]);
      else this.runCli(['models', kind === 'download' ? 'download' : 'rm', id]);
      this.navigate('models');
    };
    menu.onCancel = () => this.navigate('models');
    comps.push(menu);
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${d('↑/↓ to browse · Enter to ' + kind + ' · Esc to go back')}`]));

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(menu);
    this.tui.requestRender(true);
  }

  // ── Sequential input prompt ─────────────────────────────────────────────
  // Renders one labeled input at a time; collects the answers and calls onDone.
  private promptChain(
    title: string,
    steps: Array<{ label: string; placeholder?: string; hint?: string }>,
    onDone: (values: string[]) => void,
    onCancel: () => void,
  ): void {
    const values: string[] = [];
    const renderStep = (i: number): void => {
      if (i >= steps.length) { onDone(values); return; }
      const step = steps[i]!;
      const comps: Component[] = [];
      comps.push(new Block(this.miniHeader()));
      comps.push(new HRule());
      comps.push(new Spacer(1));
      comps.push(new Block([`  ${a(b(title))}  ${d(`(${i + 1}/${steps.length})`)}`]));
      comps.push(new Spacer(1));
      if (step.hint) comps.push(new Block([`  ${d(step.hint)}`, '']));
      const input = new LabeledInput(step.label, step.placeholder ?? '');
      input.onSubmit = (val) => { values.push(((val ?? '').trim()) || (step.placeholder ?? '')); renderStep(i + 1); };
      input.onCancel = () => onCancel();
      comps.push(input);
      this.tui.clear();
      for (const c of comps) this.tui.addChild(c);
      this.tui.setFocus(input);
      this.tui.requestRender(true);
    };
    renderStep(0);
  }

  // ── BYO: point Relay at a server you already run ─────────────────────────

  private showByoConfig(): void {
    this.promptChain('Use a server you already have', [
      { label: 'Server URL (OpenAI-compatible /v1):', placeholder: 'http://127.0.0.1:11434/v1', hint: 'e.g. Ollama (…:11434/v1) or an existing llama-server. Relay just proxies it.' },
      { label: 'Model id the server exposes:', placeholder: 'llama3.1', hint: 'The exact "model" string that server expects.' },
      { label: 'Context size (tokens):', placeholder: '32768' },
    ], (vals) => {
      const [baseUrl, model, ctx] = vals;
      L.configureBYO(this.env, baseUrl!, model!, ctx!);
      L.writeEnv(L.ENV_PATH, this.env);
      this.navigate('setup-network');
    }, () => this.navigate('setup-mode'));
  }

  // ── Cloud: proxy a hosted API ────────────────────────────────────────────

  private showCloudConfig(): void {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Cloud — proxy a hosted API'))}`]));
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${d('Pick a provider. Your API key is written to the local .env only.')}`]));
    comps.push(new Spacer(1));

    const provs = Object.entries(L.CLOUD_PROVIDERS);
    const items = provs.map(([id, p]) => ({ value: id, label: p.label, desc: `${p.baseUrl}  ·  e.g. ${p.sample}` }));
    items.push({ value: 'back', label: '← Back', desc: '' });
    const menu = new MenuList(items);
    menu.onSelect = (provider) => {
      if (provider === 'back' || !provider) { this.navigate('setup-mode'); return; }
      const p = L.CLOUD_PROVIDERS[provider]!;
      this.promptChain(`Cloud — ${p.label}`, [
        { label: 'Model id:', placeholder: p.sample },
        { label: `API key (${p.authEnv}):`, hint: 'Stored locally in .env; never sent anywhere except this provider.' },
      ], (vals) => {
        const [model, key] = vals;
        L.configureCloud(this.env, provider, model!, key!);
        L.writeEnv(L.ENV_PATH, this.env);
        this.navigate('setup-network');
      }, () => this.navigate('setup-mode'));
    };
    menu.onCancel = () => this.navigate('setup-mode');
    comps.push(menu);

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(menu);
    this.tui.requestRender(true);
  }

  // ── Models screen ─────────────────────────────────────────────────────

  private screenModels(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Models'))}  ${d('catalog & active map — ★ default, ● in map, ✓ on disk, ○ need download')}`]));
    comps.push(new Spacer(1));

    const catalog = L.readCatalog();
    if (catalog.length === 0) {
      comps.push(new Block([`  ${d('No model catalog found. Run Setup to configure models.')}`]));
      const back = new MenuList([{ label: '← Back', value: 'back' }]);
      back.onSelect = () => this.navigate('menu');
      back.onCancel = () => this.navigate('menu');
      comps.push(back);
      return comps;
    }

    const def = this.env.get('DEFAULT_MODEL');
    let map: Record<string, unknown> = {};
    try { map = JSON.parse(this.env.get('RELAY_MODEL_MAP') ?? '{}'); } catch { map = {}; }
    const active = new Set(Object.keys(map));
    const installed = L.detectInstalledModels(this.modelDir);

    const ordered = [...catalog].sort((a, b) => {
      const score = (m: CatalogEntry) => (m.id === def ? 0 : active.has(m.id) ? 1 : 2);
      return score(a) - score(b);
    });

    const lines: string[] = [];
    // Column header
    const pad = (s: string, w: number): string => s + ' '.repeat(Math.max(0, w - visibleWidth(s)));
    const G = '  ';
    const maxLabelW = Math.min(28, Math.max(10, ...ordered.map(m => visibleWidth(L.stripQuantForDisplay(m.label, m.quant)))));
    const colLabel = maxLabelW;
    const colSize  = 6;
    const colFit   = 20;
    lines.push(`  ${g('★')} ${d('default')}   ${c('●')} ${d('active')}   ${g('✓')} ${d('on disk')}   ${d('○ not downloaded')}`);
    lines.push('');
    lines.push('    ' + pad('', colLabel) + G + pad(d('size'), colSize) + G + pad(d('fit / ctx'), colFit) + G + d('quant'));
    lines.push('');

    for (const m of ordered) {
      const isDefault = m.id === def;
      const isActive = active.has(m.id);
      const onDisk = installed.has(m.id);
      const dot = isDefault ? g('★') : isActive ? c('●') : onDisk ? g('✓') : d('○');
      const sizeGb = typeof m.size_gb === 'number' ? m.size_gb.toFixed(1).replace(/\.0$/, '') : '?';
      const name = (isDefault || isActive) ? b(L.stripQuantForDisplay(m.label, m.quant)) : L.stripQuantForDisplay(m.label, m.quant);
      const quantShort = m.quant.toUpperCase();

      const fitShort = this.fitLabel(m);

      lines.push(`  ${dot} ${pad(name, colLabel)}${G}${pad(sizeGb + 'GB', colSize)}${G}${pad(fitShort, colFit)}${G}${d(quantShort)}`);
    }
    comps.push(new Block(lines));
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${d('Size = GGUF download. Needs ● (on disk) + probe for tested fit. MoE offloads via --cpu-moe.')}`]));
    comps.push(new Spacer(1));
    comps.push(new Block([fitLegendLine()]));
    comps.push(new Block(glossaryLines()));
    comps.push(new Spacer(1));

    const menu = new MenuList([
      { label: '⬇  Download a model', desc: 'fetch a catalog model to disk (resumable)', value: 'download' },
      { label: '🧪  Test a model', desc: 'launch it for real → earns a ✓ tested fit label', value: 'probe' },
      { label: '🗑  Delete a model', desc: 'remove an installed model and free disk space', value: 'delete' },
      { label: '⚙  Configure models', desc: 'open the guided picker to wire one up', value: 'setup' },
      { label: '← Back', value: 'back', desc: '' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'setup') { this.navigate('setup-mode'); return; }
      if (v === 'download') { this.showModelActionPicker('download'); return; }
      if (v === 'probe') { this.showModelActionPicker('probe'); return; }
      if (v === 'delete') { this.showModelActionPicker('delete'); return; }
      this.navigate('menu');
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);

    return comps;
  }

  // ── Config screen ─────────────────────────────────────────────────────

  private screenConfig(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Config'))}  ${d('.env — bind address, model map, API key, lazy start')}`]));
    comps.push(new Spacer(1));

    const key = this.env.get('API_KEY');
    const fields: Array<[string, string]> = [
      ['RELAY_MODE', this.env.get('RELAY_MODE') ?? 'gateway'],
      ['HOST', this.env.get('HOST') ?? '127.0.0.1'],
      ['PORT', this.env.get('PORT') ?? '1234'],
      ['DEFAULT_MODEL', this.env.get('DEFAULT_MODEL') ?? '—'],
      ['RELAY_MODEL_LIFECYCLE_ENABLED', this.env.get('RELAY_MODEL_LIFECYCLE_ENABLED') ?? 'false'],
      ['LOG_LEVEL', this.env.get('LOG_LEVEL') ?? 'info'],
    ];

    const lines: string[] = [
      `  ${d('endpoint')}  ${c(L.endpoint(this.env))}`,
      `  ${d('API_KEY')}   ${key ? `${g(key.slice(0, 8))}…  ${d('set')}` : y('unset — required for 0.0.0.0 or tunnel')}`,
      ``,
    ];
    for (const [k, v] of fields) {
      lines.push(`  ${d(k.padEnd(32))} ${d(v)}`);
    }

    // Usage hint for hamr / agents
    lines.push('');
    lines.push(`  ${d('── hamr / agent usage ──')}`);
    if (key) {
      lines.push(`  ${d('Add a relay provider block to ~/.hamr/agent/models.json:')}`);
      lines.push(`  ${d('  "relay": { "baseUrl": "http://127.0.0.1:1234/v1",')}`);
      lines.push(`  ${d('             "api": "openai-completions", "apiKey": "')}${g(key.slice(0, 12))}…${d('" }')}`);
      lines.push(`  ${d('Full key + snippet under View below.')}`);
    } else {
      lines.push(`  ${d('Generate an API key first (Rotate below).')}`);
      lines.push(`  ${d('Then add to ~/.hamr/agent/models.json as a relay provider.')}`);
    }
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const items = fields.map(([k]) => ({ label: `Edit ${k}`, value: k, desc: '' }));
    items.push({ label: '🔑  View API key', desc: 'show full key to copy', value: '__view_apikey__' });
    items.push({ label: '🔄  Rotate API key', desc: 'generate new random key (invalidates old)', value: '__rotate_apikey__' });
    items.push({ label: '← Back', value: 'back', desc: '' });
    const menu = new MenuList(items);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
      if (v === '__view_apikey__') { this.showApiKey(); return; }
      if (v === '__rotate_apikey__') { this.rotateApiKey(); return; }
      this.editConfigValue(v);
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);

    return comps;
  }

  private editConfigValue(key: string): void {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b(`Edit ${key}`))}`]));
    comps.push(new Spacer(1));

    const current = this.env.get(key) ?? '';
    comps.push(new Block([`  ${d(`Current: ${current || '(unset)'}`)}`, ``]));

    const input = new LabeledInput('New value (Enter to save, Esc to cancel):', current);
    input.onSubmit = (val) => {
      this.env.set(key, val.trim());
      L.writeEnv(L.ENV_PATH, this.env);
      this.navigate('config');
    };
    input.onCancel = () => this.navigate('config');
    comps.push(input);

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(input);
    this.tui.requestRender(true);
  }

  private showApiKey(): void {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('API Key'))}`]));
    comps.push(new Spacer(1));

    const key = this.env.get('API_KEY') ?? '';
    if (!key) {
      comps.push(new Block([`  ${y('No API key set. Generate one with Rotate.')}`]));
    } else {
      comps.push(new Block([
        `  ${g(key)}`,
        ``,
        `  ${d('── copy-paste into ~/.hamr/agent/models.json ──')}`,
        `  ${d('{')}`,
        `  ${d('  "providers": {')}`,
        `  ${d('    "relay": {')}`,
        `  ${d('      "baseUrl": "http://127.0.0.1:1234/v1",')}`,
        `  ${d('      "api": "openai-completions",')}`,
        `  ${d('      "apiKey": "')}${g(key)}${d('"')}`,
        `  ${d('    }')}`,
        `  ${d('  }')}`,
        `  ${d('}')}`,
        ``,
        `  ${d('Or in hamr:  /login → Use a custom/self-hosted endpoint')}`,
        ``,
        `  ${d('Rotate regenerates it. Old key stops working.')}`,
      ]));
    }
    comps.push(new Spacer(1));

    const menu = new MenuList([
      { label: '🔄  Rotate', desc: 'generate new key', value: 'rotate' },
      { label: '← Back', desc: '', value: 'back' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('config'); return; }
      if (v === 'rotate') { this.rotateApiKey(); return; }
    };
    menu.onCancel = () => this.navigate('config');
    comps.push(menu);

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(menu);
    this.tui.requestRender(true);
  }

  private rotateApiKey(): void {
    L.ensureApiKey(this.env);
    L.writeEnv(L.ENV_PATH, this.env);
    this.navigate('config');
  }

  // ── Parameters screen ─────────────────────────────────────────────────

  private screenParams(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Sampling'))}  ${d('temperature, top_p, top_k, min_p, penalties — unset = model default')}`]));
    comps.push(new Spacer(1));

    const paramFields: Array<[string, string]> = [
      ['DEFAULT_TEMPERATURE', 'temperature'],
      ['DEFAULT_TOP_P', 'top_p'],
      ['DEFAULT_TOP_K', 'top_k'],
      ['DEFAULT_MIN_P', 'min_p'],
      ['DEFAULT_PRESENCE_PENALTY', 'presence_penalty'],
      ['DEFAULT_REPETITION_PENALTY', 'repeat_penalty'],
    ];

    const lines: string[] = [];
    for (const [k, label] of paramFields) {
      const v = this.env.get(k);
      const shown = v && v.trim() ? v : d('unset');
      lines.push(`  ${label.padEnd(20)} ${shown}`);
    }
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const items = paramFields.map(([k, label]) => ({ label: `Edit ${label}`, value: k, desc: '' }));
    items.push({ label: '← Back', value: 'back', desc: '' });
    const menu = new MenuList(items);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
      this.editParamValue(v);
    };
    menu.onCancel = () => this.navigate('menu');
    comps.push(menu);

    return comps;
  }

  private editParamValue(key: string): void {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b(`Edit ${key}`))}`]));
    comps.push(new Spacer(1));

    const current = this.env.get(key) ?? '';
    comps.push(new Block([`  ${d(`Current: ${current || '(unset)'}`)}`, `  ${d('Blank to unset.')}`, ``]));

    const input = new LabeledInput('New value:', current);
    input.onSubmit = (val) => {
      const trimmed = val.trim();
      if (trimmed && Number.isNaN(Number(trimmed))) {
        // Show error and stay
        return;
      }
      this.env.set(key, trimmed);
      L.writeEnv(L.ENV_PATH, this.env);
      this.navigate('params');
    };
    input.onCancel = () => this.navigate('params');
    comps.push(input);

    this.tui.clear();
    for (const comp of comps) this.tui.addChild(comp);
    this.tui.setFocus(input);
    this.tui.requestRender(true);
  }

  // ── Logs screen ───────────────────────────────────────────────────────

  private screenLogs(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Logs'))}  ${d('tail of RELAY_LOG_FILE — last 30 lines')}`]));
    comps.push(new Spacer(1));

    const file = this.env.get('RELAY_LOG_FILE');
    if (!file || !existsSync(file)) {
      comps.push(new Block([
        `  ${d(file ? `Log file not found: ${file}` : 'No log file configured (RELAY_LOG_FILE).')}`,
        `  ${d('Set RELAY_LOG_FILE in Config, or run: bash scripts/logs.sh')}`,
      ]));
      const back = new MenuList([{ label: '← Back', value: 'back' }]);
      back.onSelect = () => this.navigate('menu');
      back.onCancel = () => this.navigate('menu');
      comps.push(back);
      return comps;
    }

    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
    const tail = lines.slice(-30);
    const logLines: string[] = [];
    if (tail.length === 0) {
      logLines.push(`  ${d('Log file is empty.')}`);
    } else {
      for (const l of tail) {
        const color = /"level":"error"|\berror\b/i.test(l) ? RED
          : /"level":"warn"|\bwarn\b/i.test(l) ? YELLOW
          : DIM;
        logLines.push(`  ${color}${l.slice(0, 160)}${RESET}`);
      }
    }
    comps.push(new Block(logLines));
    comps.push(new Spacer(1));

    const back = new MenuList([{ label: '← Back', value: 'back' }]);
    back.onSelect = () => this.navigate('menu');
    back.onCancel = () => this.navigate('menu');
    comps.push(back);

    return comps;
  }

  // ── Doctor screen ─────────────────────────────────────────────────────

  private screenDoctor(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Doctor'))}  ${d('preflight: GPU, llama-server, model files, port binding, API compat')}`]));
    comps.push(new Spacer(1));

    if (!existsSync(L.DOCTOR_SCRIPT)) {
      comps.push(new Block([`  ${r('Doctor script not found:')} ${d(L.DOCTOR_SCRIPT)}`]));
      const back = new MenuList([{ label: '← Back', value: 'back' }]);
      back.onSelect = () => this.navigate('menu');
      back.onCancel = () => this.navigate('menu');
      comps.push(back);
      return comps;
    }

    comps.push(new Block([`  ${d('Running diagnostics…')}`]));
    comps.push(new Spacer(1));

    // Run doctor synchronously and capture output
    const result = spawnSync('node', ['--env-file=' + L.ENV_PATH, '--experimental-strip-types', L.DOCTOR_SCRIPT, '--static'], {
      cwd: L.PKG, stdio: 'pipe', timeout: 60_000, encoding: 'utf8',
    });
    const output = (result.stdout ?? '') + (result.stderr ?? '');
    const outLines = output.split('\n').filter(Boolean).slice(-25);
    const docLines: string[] = [];
    for (const l of outLines) {
      const color = /^FAIL/i.test(l) ? RED : /^PASS/i.test(l) ? GREEN : /^WARN/i.test(l) ? YELLOW : DIM;
      docLines.push(`  ${color}${l.slice(0, 160)}${RESET}`);
    }
    if (result.error) {
      docLines.push(`  ${r(`doctor failed: ${result.error.message}`)}`);
    }
    comps.push(new Block(docLines));
    comps.push(new Spacer(1));

    const back = new MenuList([{ label: '← Back', value: 'back' }]);
    back.onSelect = () => this.navigate('menu');
    back.onCancel = () => this.navigate('menu');
    comps.push(back);

    return comps;
  }

  // ── About screen ──────────────────────────────────────────────────────

  private screenAbout(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('About'))}  ${d(`Relay v${L.relayVersion()} — local GPU inference gateway`)}`]));
    comps.push(new Spacer(1));

    const cf = L.detectCloudflare();
    const deploy = L.detectDeployment();

    const lines: string[] = [
      `  ${d('version').padEnd(16)} ${L.relayVersion()}`,
      `  ${d('mode').padEnd(16)} ${this.env.get('RELAY_MODE') ?? 'gateway'}`,
      `  ${d('endpoint').padEnd(16)} ${c(L.endpoint(this.env))}`,
      `  ${d('node').padEnd(16)} ${process.version}`,
      `  ${d('catalog').padEnd(16)} ${existsSync(L.CATALOG_PATH) ? `${L.readCatalog().length} models` : y('not found')}`,
      `  ${d('cloudflared').padEnd(16)} ${cf.installed ? `${cf.version ?? 'installed'}${cf.serviceActive ? ' · active' : ''}` : d('not installed')}`,
      `  ${d('deployment').padEnd(16)} ${deploy.serviceActive ? 'relay.service (active)' : deploy.dockerPresent ? d('docker available') : d('manual / npm start')}`,
      ``,
      `  ${d('OpenAI /v1 + Anthropic /v1/messages. MoE offload. Quant-aware. KV-budgeted.')}`,
    ];
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const back = new MenuList([{ label: '← Back', value: 'back' }]);
    back.onSelect = () => this.navigate('menu');
    back.onCancel = () => this.navigate('menu');
    comps.push(back);

    return comps;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  private quit(): void {
    this.tui.stop();
    process.exit(0);
  }

  run(): void {
    this.tui.start();
    this.renderScreen();
  }
}

// ── Export ──────────────────────────────────────────────────────────────

export async function runSetup(): Promise<void> {
  const app = new RelayTUI();
  app.run();
}
