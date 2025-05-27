import winston from 'winston';
import { config } from '../config/environment.js';

// Create the logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'multi-agent-system' },
  transports: [
    new winston.transports.Console({
      format: config.logging.format === 'json'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
    }),
    // Add file transport for production
    ...(config.server.environment === 'production'
      ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
      : [])
  ]
});

// Create a custom logger for requests with correlation ID
export const createRequestLogger = (correlationId: string) => {
  return {
    info: (message: string, meta: Record<string, any> = {}) => {
      logger.info(message, { correlationId, ...meta });
    },
    error: (message: string, error?: Error, meta: Record<string, any> = {}) => {
      logger.error(message, { 
        correlationId, 
        error: error ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name
        } : undefined,
        ...meta 
      });
    },
    warn: (message: string, meta: Record<string, any> = {}) => {
      logger.warn(message, { correlationId, ...meta });
    },
    debug: (message: string, meta: Record<string, any> = {}) => {
      logger.debug(message, { correlationId, ...meta });
    }
  };
}; 