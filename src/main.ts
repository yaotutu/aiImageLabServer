import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { apiReference } from "@scalar/express-api-reference";
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

  // 生成 OpenAPI 文档
  const config = new DocumentBuilder()
    .setTitle("AI图像生成平台API")
    .setDescription(
      "AI图像生成后端服务的完整API文档，包含认证、用户管理、模版管理、图像生成等模块",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "请输入用户JWT Token",
        in: "header",
      },
      "JWT-auth",
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Admin JWT",
        description: "请输入管理员JWT Token",
        in: "header",
      },
      "Admin-JWT-auth",
    )
    .addTag("系统", "系统信息和健康检查")
    .addTag("认证", "用户注册、登录等认证接口")
    .addTag("用户", "用户信息管理、密码修改、积分查询等")
    .addTag("模版", "模版广场、模版管理、搜索等")
    .addTag("图像生成", "AI图像生成任务的创建、上传、查询和管理")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 使用 Scalar 渲染 API 文档
  const httpAdapter = app.getHttpAdapter();
  const scalarMiddleware = apiReference({
    spec: {
      content: document,
    },
    theme: "purple",
    metaData: {
      title: "AI图像生成平台 - API文档",
    },
  });

  httpAdapter.get("/api-docs", scalarMiddleware);

  // 启动服务
  await app.listen(port);

  const logger = app.get(AppLoggerService);
  logger.log(`服务器已启动`, "Bootstrap");
  logger.log(`运行环境: ${nodeEnv}`, "Bootstrap");
  logger.log(`端口: ${port}`, "Bootstrap");
  logger.log(`URL: http://localhost:${port}`, "Bootstrap");
  logger.log(`API 文档: http://localhost:${port}/api-docs`, "Bootstrap");
  logger.log(`启动时间: ${new Date().toLocaleString()}`, "Bootstrap");
}

bootstrap();
