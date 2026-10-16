/**
 * Shared structured logger (pino).
 *
 * Env:
 *   LOG_LEVEL  — trace|debug|info|warn|error (default: debug in dev, info in prod)
 *   LOG_PRETTY — 1/0 force pretty/text; default pretty when NODE_ENV !== production
 *   LOG_JSON   — 1 forces JSON even in dev
 */
import { hostname } from 'node:os'
import pino from 'pino'
import pretty from 'pino-pretty'

const level =
  process.env.LOG_LEVEL?.trim() ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function prettyEnabled() {
  if (process.env.LOG_JSON === '1' || process.env.LOG_JSON === 'true')
    return false
  if (process.env.LOG_PRETTY === '0' || process.env.LOG_PRETTY === 'false')
    return false
  if (process.env.LOG_PRETTY === '1' || process.env.LOG_PRETTY === 'true')
    return true
  return process.env.NODE_ENV !== 'production'
}

/** @returns {import('pino').LoggerOptions} */
function jsonOptions() {
  return {
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    base: { host: hostname() },
  }
}

const prettyOptions = {
  colorize: true,
  translateTime: 'HH:MM:ss',
  ignore: 'pid,hostname',
  messageFormat: '{msg}',
  singleLine: true,
}

/** @param {string} name logger name (e.g. starter:api) */
export function createLogger(name) {
  const options = {
    name,
    level,
    serializers: {
      err: (/** @type {unknown} */ err) =>
        err instanceof Error ? pino.stdSerializers.err(err) : err,
    },
    ...(prettyEnabled() ? {} : jsonOptions()),
  }
  return prettyEnabled() ? pino(options, pretty(prettyOptions)) : pino(options)
}

/** Root logger when no subsystem name is needed. */
export const log = createLogger('starter')
