import { HttpException, HttpStatus } from "@nestjs/common";
import {
  ResponseCode,
  ResponseMessage,
} from "../constants/response-code.constant";

/**
 * 业务异常基类
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly code: ResponseCode,
    message?: string,
    public readonly statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        code,
        message: message || ResponseMessage[code],
      },
      statusCode,
    );
  }
}

/**
 * 未授权异常
 */
export class UnauthorizedException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 资源不存在异常（用户）
 */
export class UserNotFoundException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.USER_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

/**
 * 邮箱已存在异常
 */
export class EmailAlreadyExistsException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.EMAIL_ALREADY_EXISTS, message, HttpStatus.CONFLICT);
  }
}

/**
 * 无效凭证异常
 */
export class InvalidCredentialsException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 积分不足异常
 */
export class InsufficientCreditsException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.INSUFFICIENT_CREDITS, message);
  }
}

/**
 * 密码错误异常
 */
export class InvalidPasswordException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.INVALID_PASSWORD, message);
  }
}

/**
 * 模板不存在异常
 */
export class TemplateNotFoundException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.TEMPLATE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

/**
 * 模板未激活异常
 */
export class TemplateInactiveException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.TEMPLATE_INACTIVE, message);
  }
}

/**
 * 生成任务不存在异常
 */
export class GenerationNotFoundException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.GENERATION_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

/**
 * 文件类型无效异常
 */
export class InvalidFileTypeException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.INVALID_FILE_TYPE, message);
  }
}

/**
 * 文件过大异常
 */
export class FileTooLargeException extends BusinessException {
  constructor(message?: string) {
    super(ResponseCode.FILE_TOO_LARGE, message);
  }
}
