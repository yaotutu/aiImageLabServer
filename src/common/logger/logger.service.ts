import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from "@nestjs/common";
import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import * as fs from "fs";

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor() {
    // 确保日志目录存在
    const logDir = process.env.LOG_DIR || "logs";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.printf(
        ({ timestamp, level, message, context, trace, ...meta }) => {
          const contextStr = context ? `[${context}]` : "";
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          const traceStr = trace ? `\n${trace}` : "";
          return `${timestamp} [${level.toUpperCase()}] ${contextStr} ${message} ${metaStr}${traceStr}`;
        },
      ),
    );

    const colorFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      logFormat,
    );

    // 是否启用文件日志（默认开发环境不启用，生产环境启用）
    const enableFileLogging =
      process.env.ENABLE_FILE_LOGGING === "true" ||
      process.env.NODE_ENV === "production";

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: colorFormat,
      }),
    ];

    // 如果启用文件日志，添加文件传输
    if (enableFileLogging) {
      // 所有日志
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: "application-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: logFormat,
        }),
      );

      // 错误日志单独存储
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: "error-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "30d",
          level: "error",
          format: logFormat,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: logFormat,
      transports,
    });
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context: context || this.context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  /**
   * 记录 HTTP 请求日志
   */
  logRequest(method: string, url: string, userId?: string, duration?: number) {
    const message = `${method} ${url}`;
    const meta: any = {};
    if (userId) meta.userId = userId;
    if (duration !== undefined) meta.duration = `${duration}ms`;

    this.logger.info(message, { context: "HTTP", ...meta });
  }

  /**
   * 记录业务日志
   */
  logBusiness(action: string, data?: any, context?: string) {
    this.logger.info(action, {
      context: context || this.context || "Business",
      ...data,
    });
  }
}
