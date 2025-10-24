import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { AliyunQwenAdapter } from "../services/ai-adapters/aliyun-qwen.adapter";
import { AppLoggerService } from "../common/logger/logger.service";
import {
  GenerationNotFoundException,
  InsufficientCreditsException,
  TemplateNotFoundException,
  TemplateInactiveException,
} from "../common/exceptions/business.exception";

@Injectable()
export class GenerationService {
  private readonly logger: AppLoggerService;

  constructor(
    private prisma: PrismaService,
    private aliyunAdapter: AliyunQwenAdapter,
    logger: AppLoggerService,
  ) {
    this.logger = logger.setContext(GenerationService.name);
  }

  // 创建生成任务并开始生成（一步完成）
  async createAndGenerate(
    userId: string,
    createDto: CreateGenerationDto,
    imagePath: string,
  ) {
    // 1. 验证模板是否存在
    const template = await this.prisma.template.findUnique({
      where: { id: createDto.templateId },
    });

    if (!template) {
      throw new TemplateNotFoundException(createDto.templateId);
    }

    if (!template.isActive) {
      throw new TemplateInactiveException(createDto.templateId);
    }

    // 2. 检查用户积分
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // 临时注释积分检查用于测试
    // if (user.credits < template.creditsRequired) {
    //   throw new InsufficientCreditsException(
    //     `积分不足：需要 ${template.creditsRequired} 积分，当前余额 ${user.credits} 积分`,
    //   );
    // }

    // 3. 创建生成记录并扣除积分
    const generation = await this.prisma.$transaction(async (tx) => {
      // 自动生成标题（如果用户未提供）
      const autoTitle =
        createDto.title ||
        `${template.name} - ${new Date().toLocaleString("zh-CN")}`;

      // 创建生成记录
      const gen = await tx.generation.create({
        data: {
          userId,
          templateId: createDto.templateId,
          generationType: createDto.generationType,
          title: autoTitle,
          aiProvider: template.aiProvider,
          aiParams: createDto.aiParams
            ? JSON.stringify(createDto.aiParams)
            : template.aiParams,
          originalImageUrl: imagePath,
          creditsUsed: template.creditsRequired,
          status: "PROCESSING",
        },
      });

      // 扣除积分
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: template.creditsRequired },
        },
      });

      // 记录积分变动
      await tx.creditLog.create({
        data: {
          userId,
          amount: -template.creditsRequired,
          balance: user.credits - template.creditsRequired,
          type: "generation",
          relatedId: gen.id,
          description: `使用模板「${template.name}」生成图片`,
        },
      });

      // 更新模板使用统计
      await tx.template.update({
        where: { id: createDto.templateId },
        data: {
          usageCount: { increment: 1 },
          weeklyUsage: { increment: 1 },
          monthlyUsage: { increment: 1 },
        },
      });

      return gen;
    });

    // 4. 异步处理图像生成
    this.processImageGeneration(generation.id, template, imagePath).catch(
      (error) => {
        this.logger.error(
          `图像生成失败 [taskId=${generation.id}]: ${error.message}`,
          error.stack,
        );
      },
    );

    return generation;
  }

  // 创建生成任务（旧方法，保留用于兼容）
  async createTask(userId: string, createDto: CreateGenerationDto) {
    // 1. 验证模板是否存在
    const template = await this.prisma.template.findUnique({
      where: { id: createDto.templateId },
    });

    if (!template) {
      throw new TemplateNotFoundException(createDto.templateId);
    }

    if (!template.isActive) {
      throw new TemplateInactiveException(createDto.templateId);
    }

    // 2. 创建生成记录（暂时不检查积分）
    const generation = await this.prisma.$transaction(async (tx) => {
      // 自动生成标题（如果用户未提供）
      const autoTitle = createDto.title || `${template.name} - ${new Date().toLocaleString('zh-CN')}`;

      // 创建生成记录
      const gen = await tx.generation.create({
        data: {
          userId,
          templateId: createDto.templateId,
          generationType: createDto.generationType,
          title: autoTitle,
          aiProvider: template.aiProvider,
          aiParams: createDto.aiParams
            ? JSON.stringify(createDto.aiParams)
            : template.aiParams,
          creditsUsed: 0, // 暂时不消耗积分
          status: "PENDING",
        },
      });

      // 暂时不扣除积分，等图片上传后再扣除

      // 更新模板使用统计
      await tx.template.update({
        where: { id: createDto.templateId },
        data: {
          usageCount: { increment: 1 },
          weeklyUsage: { increment: 1 },
          monthlyUsage: { increment: 1 },
        },
      });

      return gen;
    });

    return generation;
  }

  // 查询任务状态
  async getTaskStatus(taskId: string, userId: string) {
    const generation = await this.prisma.generation.findFirst({
      where: {
        id: taskId,
        userId,
      },
      include: {
        template: {
          select: {
            name: true,
            category: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    if (!generation) {
      throw new GenerationNotFoundException(taskId);
    }

    return generation;
  }

  // 获取用户任务列表
  async getUserTasks(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [tasks, total] = await Promise.all([
      this.prisma.generation.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          template: {
            select: {
              name: true,
              category: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
      this.prisma.generation.count({
        where: { userId },
      }),
    ]);

    return {
      tasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 取消任务
  async cancelTask(taskId: string, userId: string) {
    const generation = await this.prisma.generation.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!generation) {
      throw new GenerationNotFoundException(taskId);
    }

    if (generation.status === "SUCCESS") {
      throw new GenerationNotFoundException("已完成的任务无法取消");
    }

    if (generation.status === "FAILED") {
      throw new GenerationNotFoundException("已失败的任务无法取消");
    }

    // 更新任务状态为失败
    const updated = await this.prisma.generation.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        errorMessage: "用户取消",
      },
    });

    return { message: "任务已取消", task: updated };
  }

  // 处理图片上传（需要文件路径）
  async uploadImage(taskId: string, userId: string, imagePath: string) {
    const generation = await this.prisma.generation.findFirst({
      where: {
        id: taskId,
        userId,
      },
      include: {
        template: true,
      },
    });

    if (!generation) {
      throw new GenerationNotFoundException(taskId);
    }

    if (generation.status !== "PENDING") {
      throw new GenerationNotFoundException("任务状态不允许上传图片");
    }

    // 更新图片路径和状态（暂时不扣除积分）
    const updated = await this.prisma.generation.update({
      where: { id: taskId },
      data: {
        originalImageUrl: imagePath,
        status: "PROCESSING",
      },
    });

    // 异步处理图像生成
    this.processImageGeneration(taskId, generation.template, imagePath).catch(
      (error) => {
        this.logger.error(
          `图像生成失败 [taskId=${taskId}]: ${error.message}`,
          error.stack,
        );
      },
    );

    return updated;
  }

  /**
   * 异步处理图像生成
   */
  private async processImageGeneration(
    taskId: string,
    template: any,
    imagePath: string,
  ) {
    try {
      this.logger.log(`开始处理图像生成任务 [taskId=${taskId}]`);

      // 解析 AI 参数
      let aiParams: any = {};
      if (template.aiParams) {
        try {
          aiParams = JSON.parse(template.aiParams);
        } catch (e) {
          this.logger.warn(`解析模板 AI 参数失败 [templateId=${template.id}]`);
        }
      }

      // 构建完整的图像 URL（假设是本地路径，需要转换为完整 URL）
      // 注意：这里需要根据实际部署情况调整，可能需要上传到云存储
      const fullImageUrl = `http://localhost:8000${imagePath}`;

      // 调用阿里云适配器生成图像
      const result = await this.aliyunAdapter.generateImage({
        imageUrl: fullImageUrl,
        prompt: template.prompt || "根据模板生成高质量图像",
        negativePrompt: aiParams.negativePrompt,
        model: aiParams.model || "qwen-image-edit",
        ...aiParams,
      });

      // 根据结果更新数据库
      if (result.success && result.imageUrl) {
        await this.prisma.generation.update({
          where: { id: taskId },
          data: {
            resultImageUrl: result.imageUrl,
            status: "SUCCESS",
            aiRequestId: result.requestId,
            completedAt: new Date(),
          },
        });

        this.logger.log(
          `图像生成成功 [taskId=${taskId}] [imageUrl=${result.imageUrl}]`,
        );
      } else {
        await this.prisma.generation.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: result.error || "图像生成失败",
          },
        });

        this.logger.error(`图像生成失败 [taskId=${taskId}]: ${result.error}`);
      }
    } catch (error: any) {
      // 异常情况，更新任务状态为失败
      await this.prisma.generation.update({
        where: { id: taskId },
        data: {
          status: "FAILED",
          errorMessage: error.message || "图像生成过程中发生错误",
        },
      });

      this.logger.error(
        `图像生成异常 [taskId=${taskId}]: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
