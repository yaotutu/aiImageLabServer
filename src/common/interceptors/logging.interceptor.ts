import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request } from "express";
import { AppLoggerService } from "../logger/logger.service";

/**
 * 请求日志拦截器
 * 记录每个 HTTP 请求的详细信息和响应时间
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(AppLoggerService) private logger: AppLoggerService,
  ) {
    this.logger.setContext("HTTP");
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get("user-agent") || "";
    const startTime = Date.now();

    // 获取用户 ID（如果已认证）
    const userId = (request as any).user?.userId;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logRequest(method, url, userId, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} - Error: ${error.message} (${duration}ms)`,
            error.stack,
          );
        },
      }),
    );
  }
}
