import { Response } from 'express';

// 统一API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// 分页响应格式
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 响应工具类
export class ResponseUtil {
  // 成功响应
  static success<T>(res: Response, data?: T, message?: string): Response {
    return res.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    } as ApiResponse<T>);
  }

  // 分页响应
  static successWithPagination<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string
  ): Response {
    return res.json({
      success: true,
      data,
      pagination,
      message,
      timestamp: new Date().toISOString()
    } as PaginatedResponse<T>);
  }

  // 错误响应
  static error(
    res: Response,
    statusCode: number,
    error: string,
    message?: string
  ): Response {
    return res.status(statusCode).json({
      success: false,
      error,
      message,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }

  // 400 Bad Request
  static badRequest(res: Response, error: string = '参数错误', message?: string): Response {
    return this.error(res, 400, error, message);
  }

  // 401 Unauthorized
  static unauthorized(res: Response, error: string = '未授权', message?: string): Response {
    return this.error(res, 401, error, message);
  }

  // 403 Forbidden
  static forbidden(res: Response, error: string = '权限不足', message?: string): Response {
    return this.error(res, 403, error, message);
  }

  // 404 Not Found
  static notFound(res: Response, error: string = '资源不存在', message?: string): Response {
    return this.error(res, 404, error, message);
  }

  // 409 Conflict
  static conflict(res: Response, error: string = '数据冲突', message?: string): Response {
    return this.error(res, 409, error, message);
  }

  // 429 Too Many Requests
  static tooManyRequests(res: Response, error: string = '请求过于频繁', message?: string): Response {
    return this.error(res, 429, error, message);
  }

  // 500 Internal Server Error
  static internalError(res: Response, error: string = '服务器内部错误', message?: string): Response {
    return this.error(res, 500, error, message);
  }

  // 处理错误响应
  static handleError(res: Response, error: unknown): Response {
    if (error instanceof Error) {
      // 检查是否是AppError
      if ('statusCode' in error) {
        const appError = error as any;
        return this.error(res, appError.statusCode || 500, appError.message);
      }
      // 普通Error
      return this.error(res, 500, error.message);
    }
    // 未知错误
    return this.error(res, 500, '未知错误');
  }
}