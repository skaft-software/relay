import { loadConfig } from './config.ts';
import { createApp } from './server.ts';
import { createLogger } from './logger.ts';
import { runSetup } from './setup.ts';

if (process.argv[2] === 'setup') {
  await runSetup();
  process.exit(0);
}

const config = loadConfig();
const logger = createLogger(config.logLevel);

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
