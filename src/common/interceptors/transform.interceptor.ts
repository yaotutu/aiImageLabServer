import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseCode, ResponseMessage } from '../constants/response-code.constant';
import { IResponse } from '../interfaces/response.interface';

/**
 * 响应转换拦截器
 * 将所有成功响应统一包装为标准格式
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        code: ResponseCode.SUCCESS,
        message: ResponseMessage[ResponseCode.SUCCESS],
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
