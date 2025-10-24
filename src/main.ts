import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { AppLoggerService } from "./common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 使用自定义 Logger
  app.useLogger(app.get(AppLoggerService));

  // 获取配置服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);
  const nodeEnv = configService.get<string>("NODE_ENV", "development");

  // 为API路由设置全局前缀（健康检查路由除外）
  app.setGlobalPrefix("api", {
    exclude: ["/health", "/", "api"],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  // 全局拦截器
  app.useGlobalInterceptors(
    app.get(LoggingInterceptor),
    new TransformInterceptor(),
  );

  // CORS 配置 - 使用 NestJS 内置方法
  app.enableCors({
    origin: nodeEnv === "production" ? false : "*",
    credentials: true,
  });

  // 生成 OpenAPI 3.0 规范的文档
  const config = new DocumentBuilder()
    .setTitle("AI Image Generation API")
    .setDescription(
      "Complete API documentation for AI Image Generation backend service. " +
      "Includes authentication, user management, template management, and image generation modules.",
    )
    .setVersion("3.0.0")
    .setContact(
      "AI Image Lab Team",
      "https://aiimagelab.com",
      "support@aiimagelab.com"
    )
    .setLicense(
      "MIT",
      "https://opensource.org/licenses/MIT"
    )
    .setExternalDoc(
      "Find out more about our platform",
      "https://aiimagelab.com/docs"
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token. Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWg0a2J3aTIwMDAwbHZvY3lkYzFkbnZ4IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzMwNDAwMTEwLCJleHAiOjE3MzA0MDM3MTB9.HFqKC59Syu8T7VXDa9A9KJh2Z9HhVnJzZ5x6N9nYp9w",
        name: "Authorization",
      },
      "JWT-auth",
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your admin JWT access token. Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWg0a2J3aTIwMDAwbHZvY3lkYzFkbnZ4IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzMwNDAwMTEwLCJleHAiOjE3MzA0MDM3MTB9.HFqKC59Syu8T7VXDa9A9KJh2Z9HhVnJzZ5x6N9nYp9w",
        name: "Authorization",
      },
      "Admin-JWT-auth",
    )
    .addTag("Health", "System information and health checks")
    .addTag("Authentication", "User registration, login and authentication endpoints")
    .addTag("Users", "User profile management, password changes, credits and usage stats")
    .addTag("Templates", "Template gallery, management, search and recommendations")
    .addTag("Generations", "AI image generation tasks, status tracking and results")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 使用 Swagger UI 渲染 API 文档
  SwaggerModule.setup("/api-docs", app, document, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "AI图像生成平台 - API文档",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
  });

  // 简单的 JSON API 端点测试
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get("/test-api", (_req, res) => {
    res.json({
      message: "API 工作正常！",
      timestamp: new Date().toISOString(),
      serverIp: "192.168.110.241",
      availableEndpoints: [
        "/api-docs (Swagger UI)",
        "/api/health",
        "/api/templates"
      ]
    });
  });

  // 启动服务 - 监听所有网络接口，允许局域网访问
  await app.listen(port, '0.0.0.0');

  const logger = app.get(AppLoggerService);
  logger.log(`服务器已启动`, "Bootstrap");
  logger.log(`运行环境: ${nodeEnv}`, "Bootstrap");
  logger.log(`端口: ${port}`, "Bootstrap");
  logger.log(`本地访问: http://localhost:${port}`, "Bootstrap");
  logger.log(`局域网访问: http://0.0.0.0:${port}`, "Bootstrap");
  logger.log(`API 文档: http://localhost:${port}/api-docs`, "Bootstrap");
  logger.log(`启动时间: ${new Date().toLocaleString()}`, "Bootstrap");
}

bootstrap();
