/**
 * Centralized logger utility.
 * SERVER-ONLY — uses process.env.NODE_ENV for log level gating.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  if (process.env.NODE_ENV === "production") return "warn";
  return "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()];
}

function formatMessage(module: string, message: string, data?: unknown): string {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${module}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(module: string, message: string, data?: unknown) {
    if (!shouldLog("debug")) return;
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage(module, message, data));
    }
  },

  info(module: string, message: string, data?: unknown) {
    if (!shouldLog("info")) return;
    console.log(formatMessage(module, message, data));
  },

  warn(module: string, message: string, data?: unknown) {
    if (!shouldLog("warn")) return;
    console.warn(formatMessage(module, message, data));
  },

  error(module: string, message: string, data?: unknown) {
    console.error(formatMessage(module, message, data));
  },
};
