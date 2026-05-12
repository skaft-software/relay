import { loadConfig } from './config.ts';
import { createApp } from './server.ts';

const config = loadConfig();

if ((config.host === '0.0.0.0' || config.host === '::') && !config.apiKey) {
  console.error('FATAL: Relay is configured to bind to all interfaces without an API_KEY. Set API_KEY or bind to 127.0.0.1.');
  process.exit(1);
}

const app = createApp(config);

await app.listen();
