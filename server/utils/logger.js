import fs from 'fs';
import path from 'path';
import { createLogger as winstonCreateLogger, format, transports } from 'winston';

/**
 * Ensures log directories exist
 */
function ensureLogDirectory() {
  const logDir = path.join(process.cwd(), 'server', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}

/**
 * Safe format that handles circular references
 */
const safeFormat = format.printf(({ timestamp, level, service, message, ...meta }) => {
  let metaStr = '';
  if (Object.keys(meta).length > 0) {
    try {
      const safeMeta = {};
      Object.keys(meta).forEach((key) => {
        if (typeof meta[key] !== 'function' && key !== 'req' && key !== 'res') {
          safeMeta[key] = meta[key];
        }
      });
      metaStr = Object.keys(safeMeta).length > 0 ? ` ${JSON.stringify(safeMeta)}` : '';
    } catch (error) {
      metaStr = ' [Metadata serialization error]';
    }
  }
  return `${timestamp} [${service}] ${level.toUpperCase()}: ${message}${metaStr}`;
});

/**
 * Enhanced logger factory with safe logging
 */
const createLogger = (serviceName = 'server') => {
  const logDir = ensureLogDirectory();

  const loggerTransports = [
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'HH:mm:ss' }),
        safeFormat
      ),
    }),
  ];

  if (process.env.NODE_ENV !== 'test') {
    loggerTransports.push(
      new transports.File({
        filename: path.join(logDir, `${serviceName}-error.log`),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 10,
        format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
      }),
      new transports.File({
        filename: path.join(logDir, `${serviceName}.log`),
        maxsize: 5242880,
        maxFiles: 10,
        format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
      })
    );
  }

  return winstonCreateLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(format.timestamp(), format.errors({ stack: true }), format.splat()),
    defaultMeta: { service: serviceName },
    transports: loggerTransports,
    exitOnError: false,
  });
};

/**
 * Simple event logging function
 */
const logEvent = (logger, eventType, data = {}) => {
  const logData = {
    eventType,
    timestamp: new Date().toISOString(),
    ip: data.req?.ip || 'unknown',
    userAgent: data.req?.get ? data.req.get('user-agent') : 'unknown',
    user: data.user?.email || data.req?.user?.email || 'unknown',
  };

  switch (eventType) {
    case 'login':
      logger.info('Login attempt', logData);
      break;
    case 'fetch_tickets':
      logger.info('Fetching tickets', logData);
      break;
    case 'fetch_timeline':
      logger.info('Fetching ticket timeline', logData);
      break;
    case 'send_reply':
      logger.info('Reply sent', logData);
      break;
    case 'create_ticket':
      logger.info('Ticket created', logData);
      break;
    case 'verify_auth':
      logger.warn('Auth verification issue', { ...logData, error: data.error?.message });
      break;
    default:
      logger.info(eventType, logData);
  }
};

export { createLogger, logEvent };
