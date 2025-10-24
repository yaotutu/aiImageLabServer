import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TemplateModule } from "./template/template.module";
import { GenerationModule } from "./generation/generation.module";
import { AppController } from "./app.controller";
import { LoggerModule } from "./common/logger/logger.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    TemplateModule,
    GenerationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
