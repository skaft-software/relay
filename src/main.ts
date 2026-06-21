import { loadConfig, validateConfig } from './config.ts';
import { createApp } from './server.ts';
import { createLogger, resolveLogFile } from './logger.ts';
import { runSetup } from './setup.ts';
import { runPreflight, printPreflight } from './preflight.ts';

if (process.argv[2] === 'setup' || process.argv[2] === 'menu' || process.argv[2] === 'tui') {
  await runSetup();
  process.exit(0);
}

if (process.argv[2] === 'provision') {
  const { runProvisionCli } = await import('./provision.ts');
  const { fileURLToPath } = await import('node:url');
  const { dirname, resolve } = await import('node:path');
  runProvisionCli(process.argv.slice(3), resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  process.exit(0);
}

const config = loadConfig();
const logFile = resolveLogFile();
const logger = createLogger(config.logLevel, logFile);

// Global crash handlers — must be installed before any async work.
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', {
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// ── Pre-flight checks ──────────────────────────────────────────────────
const doPreflight = process.env.RELAY_PREFLIGHT === 'true' || process.env.RELAY_PREFLIGHT === '1';
if (doPreflight) {
  const { results, abort } = runPreflight(config, logger);
  printPreflight(results);
  if (abort) {
    logger.error('pre-flight checks failed. Fix the issues above or set RELAY_PREFLIGHT=false to skip.');
    process.exit(1);
  }
}

// ── Config warnings ────────────────────────────────────────────────────
const configWarnings = validateConfig(config);
for (const w of configWarnings) {
  if (w.severity === 'error') logger.error(`config: ${w.key} — ${w.message}`);
  else logger.warn(`config: ${w.key} — ${w.message}`);
}
if (configWarnings.some((w) => w.severity === 'error') && config.strictStartup) {
  logger.error('strict startup enabled and config has errors. Fix config or set RELAY_STRICT_STARTUP=false.');
  process.exit(1);
}

if ((config.host === '0.0.0.0' || config.host === '::') && !config.apiKey && config.relayMode !== 'cloud') {
  logger.error('Relay is configured to bind to all interfaces without an API_KEY. Set API_KEY or bind to 127.0.0.1.');
  process.exit(1);
}

const app = createApp(config);

if (config.relayMode === 'cloud') {
  logger.info('relay cloud mode — proxying to external APIs', {
    models: config.cloudModels ? Object.keys(config.cloudModels).join(', ') : 'none',
  });
} else {
  logger.info('relay gateway mode — managing local models');
}

if (logFile) {
  logger.info(`logging to file: ${logFile}`);
}

const { close: closeServer, server: httpServer } = await app.listen();

let shuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('shutdown initiated', { signal });

  app.shutdown();

  // Stop accepting new connections.
  httpServer.close();
  logger.info('HTTP server stopped accepting connections');

  // Wait for active and pending jobs to drain, bounded by shutdownTimeout.
  const deadline = Date.now() + (config.shutdownTimeoutMs ?? 30_000);
  while (Date.now() < deadline) {
    const counts = app.counts();
    if (counts.active === 0 && counts.pending === 0) {
      logger.info('all jobs drained, shutting down');
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  process.exit(0);
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

// Keep process alive for signal handling.
await new Promise(() => {}); // never resolves — signals trigger exit
