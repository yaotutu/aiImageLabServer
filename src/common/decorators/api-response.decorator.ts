import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ResponseCode } from '../constants/response-code.constant';

/**
 * 标准成功响应装饰器
 * 用于 Swagger 文档，生成统一的响应格式说明
 */
export const ApiSuccessResponse = <T extends Type<any>>(
  dataType?: T,
  isArray = false,
) => {
  const decorators = [
    ApiResponse({
      status: 200,
      description: '操作成功',
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          code: { type: 'number', example: ResponseCode.SUCCESS },
          message: { type: 'string', example: '操作成功' },
          data: dataType
            ? isArray
              ? {
                  type: 'array',
                  items: { $ref: getSchemaPath(dataType) },
                }
              : { $ref: getSchemaPath(dataType) }
            : { type: 'object' },
          timestamp: { type: 'string', example: '2025-10-24T12:00:00.000Z' },
        },
      },
    }),
  ];

  if (dataType) {
    decorators.unshift(ApiExtraModels(dataType));
  }

  return applyDecorators(...decorators);
};

/**
 * 分页响应装饰器
 */
export const ApiPaginatedResponse = <T extends Type<any>>(dataType: T) => {
  return applyDecorators(
    ApiExtraModels(dataType),
    ApiResponse({
      status: 200,
      description: '分页查询成功',
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          code: { type: 'number', example: ResponseCode.SUCCESS },
          message: { type: 'string', example: '操作成功' },
          data: {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(dataType) },
              },
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              pageSize: { type: 'number', example: 20 },
              totalPages: { type: 'number', example: 5 },
            },
          },
          timestamp: { type: 'string', example: '2025-10-24T12:00:00.000Z' },
        },
      },
    }),
  );
};
