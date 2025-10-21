import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../services/utils/response.util';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // 确保错误堆栈正确
    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: error.message,
    url: req.url,
    method: req.method,
    body: req.body,
    stack: error.stack
  });

  // 自定义错误
  if (error instanceof AppError) {
    ResponseUtil.error(res, error.statusCode, error.message);
    return;
  }

  // Prisma错误处理
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        ResponseUtil.conflict(res, '数据已存在', `唯一性约束失败: ${prismaError.meta?.target}`);
        return;
      case 'P2025':
        ResponseUtil.notFound(res, '记录不存在', prismaError.meta?.cause as string);
        return;
      case 'P2003':
        ResponseUtil.badRequest(res, '外键约束失败', prismaError.meta?.field_name as string);
        return;
      default:
        ResponseUtil.internalError(res, '数据库操作失败', error.message);
        return;
    }
  }

  // Joi验证错误
  if (error.name === 'ValidationError') {
    const joiError = error as any;
    ResponseUtil.badRequest(res, '参数验证失败', joiError.details?.[0]?.message);
    return;
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    ResponseUtil.unauthorized(res, 'Token无效');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ResponseUtil.unauthorized(res, 'Token已过期');
    return;
  }

  // 文件上传错误
  if (error.name === 'MulterError') {
    const multerError = error as any;
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        ResponseUtil.badRequest(res, '文件大小超出限制');
        return;
      case 'LIMIT_FILE_COUNT':
        ResponseUtil.badRequest(res, '文件数量超出限制');
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        ResponseUtil.badRequest(res, '不支持的文件字段');
        return;
      default:
        ResponseUtil.badRequest(res, '文件上传失败', multerError.message);
        return;
    }
  }

  // 未知错误
  ResponseUtil.internalError(res, '服务器内部错误', process.env.NODE_ENV === 'development' ? error.message : undefined);
};

// 404处理中间件
export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.notFound(res, '接口不存在', `无法找到 ${req.method} ${req.path}`);
};