import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    // 移除敏感字段
    const { passwordHash, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async create(data: { email: string; password: string; nickname: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        nickname: data.nickname,
        passwordHash: hashedPassword,
        loginType: 'EMAIL',
        credits: 0,
      },
    });
  }

  async update(id: string, data: { nickname?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    const { passwordHash, ...result } = user;
    return result;
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.passwordHash) {
      throw new BadRequestException('无法修改密码');
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('原密码错误');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: newHash },
    });
  }

  async getCredits(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { credits: true },
    });
    return user?.credits || 0;
  }

  // 获取用户积分变动日志
  async getCreditLogs(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.creditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          amount: true,
          balance: true,
          type: true,
          relatedId: true,
          description: true,
          createdAt: true,
        },
      }),
      this.prisma.creditLog.count({
        where: { userId },
      }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取用户生成统计
  async getGenerationStats(userId: string) {
    const [
      totalGenerations,
      successfulGenerations,
      totalCreditsUsed,
      recentGenerations,
      typeStats,
    ] = await Promise.all([
      // 总生成次数
      this.prisma.generation.count({
        where: { userId },
      }),
      // 成功生成次数
      this.prisma.generation.count({
        where: { userId, status: 'SUCCESS' },
      }),
      // 总消耗积分
      this.prisma.generation.aggregate({
        where: { userId, status: 'SUCCESS' },
        _sum: { creditsUsed: true },
      }),
      // 最近的生成记录
      this.prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          generationType: true,
          status: true,
          creditsUsed: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      // 按类型统计
      this.prisma.generation.groupBy({
        by: ['generationType', 'status'],
        where: { userId },
        _count: { id: true },
        _sum: { creditsUsed: true },
      }),
    ]);

    // 计算成功率
    const successRate = totalGenerations > 0
      ? Math.round((successfulGenerations / totalGenerations) * 100)
      : 0;

    // 按类型整理统计
    const generationByType = typeStats.reduce((acc, stat) => {
      const type = stat.generationType;
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          successful: 0,
          creditsUsed: 0,
        };
      }
      acc[type].total += stat._count.id;
      if (stat.status === 'SUCCESS') {
        acc[type].successful += stat._count.id;
        acc[type].creditsUsed += stat._sum.creditsUsed || 0;
      }
      return acc;
    }, {} as Record<string, { total: number; successful: number; creditsUsed: number }>);

    return {
      overview: {
        totalGenerations,
        successfulGenerations,
        successRate,
        totalCreditsUsed: totalCreditsUsed._sum.creditsUsed || 0,
      },
      generationByType,
      recentGenerations,
    };
  }
}
