type Level = 'info' | 'warn' | 'error';

const write = (level: Level, message: string, context?: Record<string, unknown>): void => {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, message, ...context });
  if (level === 'error') console.error(line);
  else console.log(line);
};

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context),
};
