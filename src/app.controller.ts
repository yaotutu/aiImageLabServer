import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('系统')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API信息', description: '获取API基本信息' })
  @ApiResponse({ status: 200, description: '成功', schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'AI图像生成平台API' },
      version: { type: 'string', example: '1.0.0' },
      description: { type: 'string', example: 'AI图像生成后端服务的完整API文档' },
      status: { type: 'string', example: 'running' },
      timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    },
  }})
  getApiInfo() {
    return {
      name: 'AI图像生成平台API',
      version: '1.0.0',
      description: 'AI图像生成后端服务的完整API文档，包含认证、用户管理、模版管理、图像生成等模块',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查', description: '检查服务器运行状态' })
  @ApiResponse({ status: 200, description: '服务正常', schema: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'ok' },
      timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      uptime: { type: 'number', example: 12345 },
    },
  }})
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}