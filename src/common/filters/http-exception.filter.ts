import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppLoggerService } from "../logger/logger.service";
import {
  ResponseCode,
  ResponseMessage,
} from "../constants/response-code.constant";
import { IErrorResponse } from "../interfaces/response.interface";
import { BusinessException } from "../exceptions/business.exception";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(AppLoggerService) private logger: AppLoggerService,
  ) {
    this.logger.setContext("HttpExceptionFilter");
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let code: ResponseCode;
    let message: string;
    let error: string | undefined;

    if (exception instanceof BusinessException) {
      // 业务异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      code = exceptionResponse.code;
      message = exceptionResponse.message;
    } else if (exception instanceof HttpException) {
      // HTTP 异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // 处理验证错误
      if (status === HttpStatus.BAD_REQUEST && exceptionResponse.message) {
        code = ResponseCode.VALIDATION_ERROR;
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join(", ")
          : exceptionResponse.message;
      } else {
        code = this.mapHttpStatusToCode(status);
        message = exceptionResponse.message || ResponseMessage[code];
      }

      error = exceptionResponse.error;
    } else if (exception instanceof Error) {
      // 普通错误
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ResponseCode.INTERNAL_ERROR;
      message = exception.message || ResponseMessage[code];
      error = exception.name;

      // 记录详细的错误堆栈
      this.logger.error(
        `Internal error: ${exception.message}`,
        exception.stack,
      );
    } else {
      // 未知错误
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ResponseCode.UNKNOWN_ERROR;
      message = ResponseMessage[code];

      this.logger.error(
        `Unknown error: ${JSON.stringify(exception)}`,
        undefined,
      );
    }

    const errorResponse: IErrorResponse = {
      success: false,
      code,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 记录错误日志（业务异常不记录为 error 级别）
    if (!(exception instanceof BusinessException)) {
      // 对于认证相关的常见错误，使用 WARN 级别而不是 ERROR 级别
      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        this.logger.warn(
          `${request.method} ${request.url} - ${message}`,
        );
      } else {
        // 其他错误记录完整的堆栈信息
        this.logger.error(
          `${request.method} ${request.url} - ${message}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      }
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * 将 HTTP 状态码映射到响应码
   */
  private mapHttpStatusToCode(status: HttpStatus): ResponseCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ResponseCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ResponseCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ResponseCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ResponseCode.NOT_FOUND;
      default:
        return ResponseCode.INTERNAL_ERROR;
    }
  }
}
