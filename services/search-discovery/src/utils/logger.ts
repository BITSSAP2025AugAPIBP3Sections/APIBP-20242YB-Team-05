import winston from 'winston';
import config from '../config';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'search-discovery-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: config.IS_DEVELOPMENT ? consoleFormat : logFormat
    })
  ]
});

// Add file transport in production
if (config.IS_PRODUCTION) {
  logger.add(new winston.transports.File({
    filename: config.LOG_FILE,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));

  logger.add(new winston.transports.File({
    filename: config.LOG_FILE.replace('.log', '-error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));
}

// Stream for morgan HTTP request logging
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger;
