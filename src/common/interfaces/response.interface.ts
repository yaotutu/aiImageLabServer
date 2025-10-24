import { ResponseCode } from '../constants/response-code.constant';

/**
 * 统一响应接口
 */
export interface IResponse<T = any> {
  success: boolean;
  code: ResponseCode;
  message: string;
  data?: T;
  timestamp: string;
}

/**
 * 分页响应数据接口
 */
export interface IPaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 错误响应接口
 */
export interface IErrorResponse {
  success: false;
  code: ResponseCode;
  message: string;
  error?: string;
  path?: string;
  timestamp: string;
}
