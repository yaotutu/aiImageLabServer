import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppLoggerService } from "../common/logger/logger.service";
import {
  TemplateNotFoundException,
  TemplateInactiveException,
} from "../common/exceptions/business.exception";

@Injectable()
export class TemplateService {
  private readonly logger: AppLoggerService;

  constructor(
    private prisma: PrismaService,
    logger: AppLoggerService,
  ) {
    this.logger = logger.setContext(TemplateService.name);
  }

  // 获取所有模版（支持分页和筛选）
  async findAll(params: {
    category?: string;
    isPremium?: boolean;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
    const {
      category,
      isPremium,
      isActive = true,
      skip = 0,
      take = 20,
    } = params;

    const where: any = { isActive };

    if (category) {
      where.category = category;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip,
        take,
        orderBy: [
          { sortOrder: "desc" },
          { hotScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
      this.prisma.template.count({ where }),
    ]);

    return {
      templates,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  // 根据 ID 获取模版详情
  async findById(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new TemplateNotFoundException(id);
    }

    return template;
  }

  // 根据分类获取模版
  async findByCategory(category: string) {
    return this.prisma.template.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: [{ sortOrder: "desc" }, { hotScore: "desc" }],
    });
  }

  // 获取热门模版
  async findHot(limit: number = 10) {
    return this.prisma.template.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: [{ hotScore: "desc" }, { usageCount: "desc" }],
    });
  }

  // 搜索模版
  async search(keyword: string) {
    return this.prisma.template.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
          { tags: { contains: keyword } },
        ],
      },
      orderBy: { hotScore: "desc" },
    });
  }

  // 增加使用次数
  async incrementUsage(id: string) {
    const template = await this.findById(id);

    return this.prisma.template.update({
      where: { id },
      data: {
        usageCount: template.usageCount + 1,
        weeklyUsage: template.weeklyUsage + 1,
        monthlyUsage: template.monthlyUsage + 1,
        // 简单的热度计算：使用次数 + 点赞数 * 2
        hotScore: template.usageCount + 1 + template.likeCount * 2,
      },
    });
  }

  // 点赞/取消点赞
  async toggleLike(id: string, isLike: boolean) {
    const template = await this.findById(id);

    return this.prisma.template.update({
      where: { id },
      data: {
        likeCount: isLike
          ? template.likeCount + 1
          : Math.max(0, template.likeCount - 1),
        hotScore:
          template.usageCount +
          (isLike ? template.likeCount + 1 : template.likeCount - 1) * 2,
      },
    });
  }

  // 创建模版（管理员功能）
  async create(data: {
    name: string;
    description?: string;
    category: string;
    tags?: string[];
    thumbnailUrl?: string;
    previewUrls?: string[];
    aiProvider: string;
    aiParams?: any;
    prompt?: string;
    creditsRequired?: number;
    isPremium?: boolean;
    sortOrder?: number;
    createdBy?: string;
  }) {
    const template = await this.prisma.template.create({
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        previewUrls: data.previewUrls ? JSON.stringify(data.previewUrls) : null,
        aiParams: data.aiParams ? JSON.stringify(data.aiParams) : null,
      },
    });

    this.logger.log(`创建模板: ${data.name}`);
    return template;
  }

  // 更新模版（管理员功能）
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      tags?: string[];
      thumbnailUrl?: string;
      previewUrls?: string[];
      aiProvider?: string;
      aiParams?: any;
      prompt?: string;
      creditsRequired?: number;
      isPremium?: boolean;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.findById(id);

    const updateData: any = { ...data };

    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }
    if (data.previewUrls) {
      updateData.previewUrls = JSON.stringify(data.previewUrls);
    }
    if (data.aiParams) {
      updateData.aiParams = JSON.stringify(data.aiParams);
    }

    const template = await this.prisma.template.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`更新模板: id=${id}`);
    return template;
  }

  // 删除模版（软删除）
  async delete(id: string) {
    await this.findById(id);

    const template = await this.prisma.template.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`删除模板: id=${id}`);
    return template;
  }
}
