/**
 * Relay Setup TUI — friendly, no-jargon setup wizard.
 *
 * Built on sexy-tui-rs for flicker-free differential rendering.
 * Design: horizontal lines + shaded cards (no vertical borders/rounded boxes).
 * Personality: "no jargon required" — matches the old Python setup TUI spirit.
 */
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { TUI, ProcessTerminal, Container, Text, Box, Spacer, Input, type Component, type Focusable, CURSOR_MARKER, matchesKey } from './tui/index.ts';
import { truncateToWidth, visibleWidth } from './tui/utils.ts';

import * as L from './setup-logic.ts';
import { resolve } from 'node:path';
import type { CatalogEntry, EnvMap, GpuProbe, FitClass } from './setup-logic.ts';

// ── Theme ───────────────────────────────────────────────────────────────
// Colors, glyphs, and the logo all degrade with terminal capabilities; see
// setup-theme.ts. Color helpers close with attribute-specific resets so shaded
// card backgrounds stay continuous across colored spans.

import {
  ACCENT_BG, GREEN, YELLOW, RED, DIM, RESET, INVERSE,
  a, g, y, r, c, b, d, LOGO, RULE_CH, fold,
} from './setup-theme.ts';

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
  }

  invalidate(): void {}

  render(width: number): string[] {
    const lines: string[] = [];
    const start = Math.max(0, Math.min(this.idx - Math.floor(this.maxVisible / 2), this.items.length - this.maxVisible));
    const end = Math.min(start + this.maxVisible, this.items.length);

    for (let i = start; i < end; i++) {
      const item = this.items[i]!;
      const selected = i === this.idx;
      const pointer = selected ? `${a(b('❯'))}` : ' ';
      const label = selected ? `${INVERSE} ${item.label} ${RESET}` : item.label;
      lines.push(`  ${pointer} ${label}`);
      if (item.desc) {
        lines.push(`     ${d(item.desc)}`);
      }
    }

    if (this.items.length > this.maxVisible) {
      lines.push(d(`  (${this.idx + 1}/${this.items.length})`));
    }

    return lines.map(fold);
  }

  handleInput(data: string): void {
    if (matchesKey(data, 'up') || matchesKey(data, 'k')) {
      this.idx = (this.idx - 1 + this.items.length) % this.items.length;
    } else if (matchesKey(data, 'down') || matchesKey(data, 'j')) {
      this.idx = (this.idx + 1) % this.items.length;
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
  render(_width: number): string[] {
    return this.lines.map(fold);
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

  constructor() {
    this.terminal = new ProcessTerminal();
    this.tui = new TUI(this.terminal);
    this.env = L.seedEnv();
    this.gpu = L.probeGpu();
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
    // most terminal fonts double-strike them into a ghosted smear.
    for (const ln of LOGO) {
      comps.push(new Block([`  ${a(ln)}`]));
    }
    comps.push(new Block([`  ${c('       your friendly model gateway — no jargon required')}`]));
    comps.push(new Spacer(1));

    // Hardware — plain text, no colored backgrounds. Works on headless terminals.
    comps.push(new Block([
      `  ${b(this.hwLabel)}   ${this.vramStr()}   ${L.SYSTEM_RAM_GB} GB RAM`,
      `  ${d(this.hwVerdict())}`,
    ]));
    comps.push(new Spacer(1));

    // Greeting
    comps.push(new Block([
      `  ${a(b('Hey there 👋'))}`,
      ``,
      `  ${d('I turn your consumer GPU into an agentic inference server.')}`,
      `  ${d('Or proxy cloud APIs — OpenAI, Anthropic, DeepSeek, Groq — through one endpoint.')}`,
      `  ${d('No jargon — I work out what fits your hardware so models run fast and never OOM.')}`,
      ``,
      `  ${d('Press ')}${a(b('Enter'))}${d(' to get started.')}`,
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
    const life = this.env.get('RELAY_MODEL_LIFECYCLE_ENABLED') === 'true' ? 'on' : 'off';
    return [
      `  ${d('relay')} ${d('·')} ${this.hwLabel} ${d('·')} ${this.vramStr()} ${d('·')} ${L.SYSTEM_RAM_GB} GB RAM`,
      `  ${d(mode)} ${d('→')} ${c(L.endpoint(this.env))} ${d('·')} ${model} ${d('·')} lifecycle ${life}`,
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
      { label: 'Models', desc: 'browse the catalog and see what\'s active', value: 'models' },
      { label: 'Config', desc: 'core environment settings', value: 'config' },
      { label: 'Parameters', desc: 'sampling defaults (temperature, top_p, etc.)', value: 'params' },
      { label: 'Logs', desc: 'recent gateway activity', value: 'logs' },
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
    comps.push(new Block([`  ${d('↑/↓ to move · Enter to pick · q to quit')}`]));

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
      { label: '🖥  Local model — run on my GPU', desc: 'pick from a catalog, auto-download, auto-tune. No cloud needed.', value: 'quickstart' },
      { label: '📡  Use a server I already have', desc: 'point relay at Ollama or an existing llama.cpp server', value: 'byo' },
      { label: '☁  Cloud — proxy Gemini, OpenAI, etc.', desc: 'one tidy endpoint in front of cloud APIs. No local GPU needed.', value: 'cloud' },
      { label: '← Back to menu', desc: '', value: 'back' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
      this.setupMode = v as 'quickstart' | 'byo' | 'cloud';
      if (this.setupMode === 'cloud' || this.setupMode === 'byo') {
        this.navigate('setup-network');
      } else {
        this.navigate('setup-models');
      }
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

    comps.push(new Block([`  ${a(b('Pick a model for your hardware'))}  ${d('(Step 2)')}`]));
    comps.push(new Spacer(1));

    if (this.gpu) {
      comps.push(new Block([
        `  ${g('●')} Detected ${this.gpu.gpu_type}/${this.gpu.driver} · ${this.gpu.vram_total_gb} GB VRAM · ${L.SYSTEM_RAM_GB} GB RAM`,
      ]));
    } else {
      comps.push(new Block([
        `  ${y('⚠')} GPU probe unavailable — showing the full catalog. Models marked "fits GPU" are recommended.`,
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

    // Filter by lane
    const lanes = [
      { label: 'Coding', value: 'code' },
      { label: 'General purpose', value: 'general' },
      { label: 'Reasoning', value: 'reasoning' },
      { label: 'Long context', value: 'long' },
      { label: 'All models', value: '__all__' },
      { label: '← Back', value: 'back' },
    ];

    const laneMenu = new MenuList(lanes.map(l => ({ label: l.label, value: l.value, desc: l.value === '__all__' ? 'show everything' : '' })));
    laneMenu.onSelect = (lane) => {
      if (lane === 'back') { this.navigate('setup-mode'); return; }
      this.showModelPicker(lane === '__all__' ? catalog : catalog.filter(m => m.lane === lane || m.lane.startsWith(lane)));
    };
    laneMenu.onCancel = () => this.navigate('setup-mode');
    comps.push(laneMenu);

    return comps;
  }

  private showModelPicker(models: CatalogEntry[]): void {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Choose a model'))}  ${d('(Step 2)')}`]));
    comps.push(new Spacer(1));

    if (this.gpu) {
      const fitting = models.filter(m => L.classifyFit(m, this.gpu!) !== 'too-large');
      if (fitting.length > 0 && fitting.length < models.length) {
        comps.push(new Block([`  ${d(`Filtered to ${fitting.length} model(s) that fit your hardware.`)}`]));
        comps.push(new Spacer(1));
        models = fitting;
      }
    }

    const items = models.map(m => {
      const fit = this.gpu ? L.classifyFit(m, this.gpu) : 'unknown' as FitClass;
      const { icon, color } = L.fitIcon(fit);
      const size = m.size_gb ?? '?';
      const caps = L.modelCapabilities(m);
      // Helpers (attribute-specific resets) so the inverse selection bar isn't
      // torn open by a full reset mid-label.
      const fitText = fit === 'full-gpu' ? g(`${icon} fits`)
        : fit === 'partial-offload' ? y(`${icon} partial`)
        : fit === 'too-large' ? r(`${icon} too big`)
        : d(`${icon} unknown`);
      const meta = `${L.fmtCtx(m.ctx)} ctx · ${m.quant}`;
      return {
        label: `${m.label}  ~${size}GB  ${fitText}`,
        desc: caps ? `${meta} · ${caps}` : meta,
        value: m.id,
      };
    });

    const menu = new MenuList(items, 8);
    menu.onSelect = (modelId) => {
      const model = models.find(m => m.id === modelId);
      if (model) {
        this.selectedModels = [model];
        this.applyQuickstart();
        this.navigate('setup-network');
      }
    };
    menu.onCancel = () => this.navigate('setup-models');
    comps.push(menu);
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${d('↑/↓ to browse · Enter to pick · Esc to go back')}`]));

    // Swap the TUI content
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
    comps.push(new Block([`  ${a(b('How should Relay be reachable?'))}  ${d('(Step 3)')}`]));
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
      { label: '🔒  Localhost only (recommended)', desc: 'bind 127.0.0.1 — safe, works with a tunnel on this host', value: 'local' },
      { label: '🌐  Expose on LAN / container', desc: 'bind 0.0.0.0 + trust proxy — API key required', value: 'expose' },
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
    comps.push(new Block([`  ${g(b('🎉 All set!'))}`]));
    comps.push(new Spacer(1));

    const host = this.env.get('HOST') ?? '127.0.0.1';
    const port = this.env.get('PORT') ?? '1234';
    const defaultModel = this.env.get('DEFAULT_MODEL') ?? '(none)';
    const relayMode = this.env.get('RELAY_MODE') ?? 'gateway';
    const lifecycle = this.env.get('RELAY_MODEL_LIFECYCLE_ENABLED') === 'true' ? g('on') : d('off');
    const apiKey = this.env.get('API_KEY') ?? '(unset)';

    // Summary — plain text, no colored backgrounds.
    comps.push(new Block([
      `  ${b('Summary')}`,
      `    Mode:       ${relayMode}`,
      `    Endpoint:   http://${host}:${port}/v1`,
      `    Model:      ${defaultModel}`,
      `    Lifecycle:  ${lifecycle}`,
      `    API key:    ${apiKey === '(unset)' ? apiKey : `${apiKey.slice(0, 8)}...`}`,
    ]));
    comps.push(new Spacer(1));

    // Next steps
    const steps: string[] = [`  ${b('Next steps:')}`];
    if (this.setupMode === 'quickstart') {
      const hint = this.env.get('RELAY_MODEL_FILE_HINT') ?? resolve(this.env.get('RELAY_MODEL_DIR') ?? this.modelDir, `${defaultModel}.gguf`);
      steps.push(`    ${d('1.')} Place the GGUF at: ${c(hint)}`);
      steps.push(`    ${d('2.')} Start Relay:     ${b('npm start')} ${d('or')} ${b('docker compose up -d')}`);
    } else if (this.setupMode === 'byo') {
      steps.push(`    ${d('1.')} Make sure your server is at ${c(this.env.get('UPSTREAM_BASE_URL') ?? '')}`);
      steps.push(`    ${d('2.')} Start Relay:     ${b('npm start')}`);
    } else if (this.setupMode === 'cloud') {
      steps.push(`    ${d('1.')} Start Relay:     ${b('npm start')}`);
    }
    steps.push(`    ${d('Then point your agent to:')} ${c(`http://${host}:${port}/v1`)}`);
    steps.push(``);
    steps.push(`  ${g(b('You\'re done. Go build something. ✨'))}`);
    comps.push(new Block(steps));
    comps.push(new Spacer(1));

    const menu = new MenuList([
      { label: '← Back to menu', value: 'menu' },
      { label: 'Quit', value: 'quit' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'quit') { this.quit(); return; }
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

  // ── Models screen ─────────────────────────────────────────────────────

  private screenModels(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Models'))}  ${d('catalog & active map')}`]));
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

    const ordered = [...catalog].sort((a, b) => {
      const score = (m: CatalogEntry) => (m.id === def ? 0 : active.has(m.id) ? 1 : 2);
      return score(a) - score(b);
    });

    const lines: string[] = [`  ${g('★')} ${d('default')}   ${c('●')} ${d('active')}   ${d('○ available')}`, ``];
    for (const m of ordered) {
      const isDefault = m.id === def;
      const isActive = active.has(m.id);
      const dot = isDefault ? g('★') : isActive ? c('●') : d('○');
      const size = m.size_gb ?? '?';
      const caps = [m.vision ? 'vision' : null, m.thinking !== 'off' ? 'thinking' : null].filter(Boolean).join(' ');
      const name = (isDefault || isActive) ? b(m.label) : m.label;
      lines.push(`  ${dot} ${name}  ${d(`${L.fmtCtx(m.ctx)} ctx · ${m.quant} · ~${size}GB${caps ? ' · ' + caps : ''}`)}`);
    }
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const menu = new MenuList([
      { label: 'Configure models', desc: 'open the guided picker', value: 'setup' },
      { label: '← Back', value: 'back' },
    ]);
    menu.onSelect = (v) => {
      if (v === 'setup') { this.navigate('setup-mode'); return; }
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
    comps.push(new Block([`  ${a(b('Config'))}  ${d('core environment settings')}`]));
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
      `  ${d('API_KEY')}   ${key ? `${key.slice(0, 8)}…  ${d('set')}` : y('unset — required for public access')}`,
      ``,
    ];
    for (const [k, v] of fields) {
      lines.push(`  ${d(k.padEnd(32))} ${d(v)}`);
    }
    comps.push(new Block(lines));
    comps.push(new Spacer(1));

    const items = fields.map(([k]) => ({ label: `Edit ${k}`, value: k, desc: '' }));
    items.push({ label: '← Back', value: 'back', desc: '' });
    const menu = new MenuList(items);
    menu.onSelect = (v) => {
      if (v === 'back') { this.navigate('menu'); return; }
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

  // ── Parameters screen ─────────────────────────────────────────────────

  private screenParams(): Component[] {
    const comps: Component[] = [];
    comps.push(new Block(this.miniHeader()));
    comps.push(new HRule());
    comps.push(new Spacer(1));
    comps.push(new Block([`  ${a(b('Parameters'))}  ${d('sampling defaults — blank means model/profile default')}`]));
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
    comps.push(new Block([`  ${a(b('Logs'))}  ${d('recent gateway activity')}`]));
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
    comps.push(new Block([`  ${a(b('Doctor'))}  ${d('health & preflight checks')}`]));
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
    comps.push(new Block([`  ${a(b('About'))}  ${d(`Relay v${L.relayVersion()}`)}`]));
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
      `  ${d('Local AI gateway · OpenAI & Anthropic compatible')}`,
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
