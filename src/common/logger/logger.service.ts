import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";
import pino from "pino";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private logger: pino.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development");
    const logLevel = this.configService.get<string>("LOG_LEVEL", "info");

    // pino 配置
    const pinoConfig: pino.LoggerOptions = {
      level: logLevel,
      formatters: {
        level: (label) => ({ level: label.toUpperCase() }),
        // 紧凑模式：移除上下文格式化，让 pino-pretty 处理
      },
      // 基础时间戳，pino-pretty 会重新格式化
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    // 开发环境使用更友好的格式
    if (nodeEnv === "development") {
      const prettyTransport = pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          messageFormat: "[{context}] {msg}",
          // 紧凑模式配置
          levelFirst: true,
          ignore: "pid,hostname,reqId,req.method,req.url,req.headers,req.remoteAddress,req.remotePort",
          singleLine: true,
          // 移除 customPrettifiers，因为它会导致 Worker 线程克隆错误
        },
      });
      this.logger = pino(pinoConfig, prettyTransport);
    } else {
      // 生产环境可能需要文件日志
      const enableFileLogging = this.configService.get<boolean>("ENABLE_FILE_LOGGING", false);

      if (enableFileLogging) {
        const logDir = this.configService.get<string>("LOG_DIR", "logs");
        const fileTransport = pino.transport({
          target: "pino-roll",
          options: {
            file: `${logDir}/application.log`,
            frequency: "daily",
            limit: {
              size: "100m",
              count: 14,
            },
          },
        });
        this.logger = pino(pinoConfig, fileTransport);
      } else {
        this.logger = pino(pinoConfig);
      }
    }
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: any, context?: string) {
    this.logger.info({
      context: context || this.context,
      msg: message
    });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error({
      context: context || this.context,
      msg: message,
      // 只在开发环境显示详细堆栈，生产环境隐藏
      ...(trace && process.env.NODE_ENV === 'development' && { error: trace })
    });
  }

  warn(message: any, context?: string) {
    this.logger.warn({
      context: context || this.context,
      msg: message
    });
  }

  debug(message: any, context?: string) {
    this.logger.debug({
      context: context || this.context,
      msg: message
    });
  }

  verbose(message: any, context?: string) {
    this.logger.debug({
      context: context || this.context,
      msg: message
    });
  }

  /**
   * 记录 HTTP 请求日志
   */
  logRequest(method: string, url: string, userId?: string, duration?: number) {
    const requestData: any = {
      context: "HTTP",
      msg: `${method} ${url}`,
    };

    if (userId) requestData.userId = userId;
    if (duration !== undefined) requestData.duration = duration;

    this.logger.info(requestData);
  }

  /**
   * 记录业务日志
   */
  logBusiness(action: string, data?: any, context?: string) {
    const businessData: any = {
      context: context || this.context || "Business",
      msg: action,
    };

    if (data) {
      Object.assign(businessData, data);
    }

    this.logger.info(businessData);
  }
}