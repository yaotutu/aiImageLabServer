import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ApiSuccessResponse } from "./common/decorators/api-response.decorator";

@ApiTags("Health")
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "根路由", description: "根路由重定向信息" })
  @ApiSuccessResponse()
  getRoot() {
    return {
      message: "欢迎使用AI图像生成平台API",
      apiDocs: "/api-docs",
      apiInfo: "/api",
    };
  }

  @Get("api")
  @ApiOperation({ summary: "API信息", description: "获取API基本信息" })
  @ApiSuccessResponse()
  getApiInfo() {
    return {
      name: "AI图像生成平台API",
      version: "1.0.0",
      description:
        "AI图像生成后端服务的完整API文档，包含认证、用户管理、模版管理、图像生成等模块",
      status: "running",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  @ApiOperation({ summary: "健康检查", description: "检查服务器运行状态" })
  @ApiSuccessResponse()
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
