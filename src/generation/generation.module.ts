import { Module } from '@nestjs/common';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AliyunQwenAdapter } from '../services/ai-adapters/aliyun-qwen.adapter';

@Module({
  imports: [PrismaModule],
  controllers: [GenerationController],
  providers: [GenerationService, AliyunQwenAdapter],
  exports: [GenerationService],
})
export class GenerationModule {}
