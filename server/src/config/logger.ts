import winston from 'winston';
import { env } from './env';

const sanitizeFormat = winston.format((info) => {
  const sensitiveKeys = ['password', 'otp', 'token', 'secret', 'mfasecret', 'cookie', 'authorization'];
  if (typeof info.message === 'object' && info.message !== null) {
    info.message = JSON.parse(
      JSON.stringify(info.message, (key, value) =>
        sensitiveKeys.includes(key.toLowerCase()) ? '***REDACTED***' : value
      )
    );
  }
  return info;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    sanitizeFormat(),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  transports: [
    new winston.transports.Console()
  ]
});
