import { createWriteStream, type WriteStream } from 'node:fs';

import { redactForLogs } from './redact.ts';

export type Logger = {
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
};

/** Optional structured log file, from RELAY_LOG_FILE. */
export function resolveLogFile(): string | undefined {
  const file = (process.env.RELAY_LOG_FILE ?? '').trim();
  return file || undefined;
}

export function createLogger(level = 'info', logFile?: string): Logger {
  const quiet = level === 'silent';
  let fileStream: WriteStream | undefined;
  if (logFile) {
    try {
      fileStream = createWriteStream(logFile, { flags: 'a' });
    } catch {
      fileStream = undefined;
    }
  }
  const emit = (lvl: string, message: string, fields: Record<string, unknown>): void => {
    if (!quiet) writeLog(lvl, message, fields, fileStream);
  };
  return {
    info: (message, fields = {}) => emit('info', message, fields),
    warn: (message, fields = {}) => emit('warn', message, fields),
    error: (message, fields = {}) => emit('error', message, fields),
  };
}

function writeLog(level: string, message: string, fields: Record<string, unknown>, fileStream?: WriteStream) {
  const line = JSON.stringify(redactForLogs({ time: new Date().toISOString(), level, message, ...fields }));
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
  fileStream?.write(`${line}\n`);
}
