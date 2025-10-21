import { prisma } from '../config/database';
import { CryptoUtil } from './utils/crypto.util';
import { ValidationUtil } from './utils/validation.util';
import { UpdateUserDto, ChangePasswordDto, UserInfo } from '../models/types';
import { AppError } from '../middleware/error.middleware';
import { User } from '@prisma/client';

/**
 * 用户服务
 * 处理用户信息管理、积分管理等
 */
export class UserService {
  /**
   * 根据ID获取用户信息（不含敏感字段）
   */
  async getUserById(userId: string): Promise<UserInfo> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    return this.sanitizeUser(user);
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = ValidationUtil.normalizeEmail(email);
    return await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
  }

  /**
   * 根据手机号获取用户
   */
  async getUserByPhone(phone: string): Promise<User | null> {
    const normalizedPhone = ValidationUtil.normalizePhone(phone);
    return await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, dto: UpdateUserDto): Promise<UserInfo> {
    // 验证输入
    if (dto.nickname) {
      const validation = ValidationUtil.validateNickname(dto.nickname);
      if (!validation.valid) {
        throw new AppError(validation.message || '昵称格式不正确', 400);
      }
    }

    if (dto.email) {
      const normalizedEmail = ValidationUtil.normalizeEmail(dto.email);
      if (!ValidationUtil.isValidEmail(normalizedEmail)) {
        throw new AppError('邮箱格式不正确', 400);
      }

      // 检查邮箱是否已被使用
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new AppError('该邮箱已被其他用户使用', 409);
      }

      dto.email = normalizedEmail;
    }

    if (dto.phone) {
      const normalizedPhone = ValidationUtil.normalizePhone(dto.phone);
      if (!ValidationUtil.isValidPhone(normalizedPhone)) {
        throw new AppError('手机号格式不正确', 400);
      }

      // 检查手机号是否已被使用
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: normalizedPhone,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new AppError('该手机号已被其他用户使用', 409);
      }

      dto.phone = normalizedPhone;
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dto
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    // 1. 获取用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (!user.passwordHash) {
      throw new AppError('该账号未设置密码，无法修改', 400);
    }

    // 2. 验证旧密码
    const isOldPasswordValid = await CryptoUtil.verifyPassword(
      dto.oldPassword,
      user.passwordHash
    );

    if (!isOldPasswordValid) {
      throw new AppError('原密码错误', 401);
    }

    // 3. 验证新密码
    const passwordValidation = ValidationUtil.validatePassword(dto.newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message || '新密码格式不正确', 400);
    }

    // 4. 检查新旧密码是否相同
    if (dto.oldPassword === dto.newPassword) {
      throw new AppError('新密码不能与旧密码相同', 400);
    }

    // 5. 更新密码
    const newPasswordHash = await CryptoUtil.hashPassword(dto.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
  }

  /**
   * 获取用户积分余额
   */
  async getUserCredits(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    return user.credits;
  }

  /**
   * 增加用户积分
   */
  async addCredits(
    userId: string,
    amount: number,
    type: string,
    description?: string,
    relatedId?: string
  ): Promise<number> {
    // 验证积分数量
    const validation = ValidationUtil.validateCredits(amount);
    if (!validation.valid) {
      throw new AppError(validation.message || '积分数量无效', 400);
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新用户积分
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: amount
          }
        }
      });

      // 2. 记录积分变动日志
      await tx.creditLog.create({
        data: {
          userId,
          amount,
          balance: user.credits,
          type,
          description: description || null,
          relatedId: relatedId || null
        }
      });

      return user.credits;
    });

    return result;
  }

  /**
   * 扣除用户积分
   */
  async deductCredits(
    userId: string,
    amount: number,
    type: string,
    description?: string,
    relatedId?: string
  ): Promise<number> {
    // 验证积分数量
    const validation = ValidationUtil.validateCredits(amount);
    if (!validation.valid) {
      throw new AppError(validation.message || '积分数量无效', 400);
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 检查用户积分是否足够
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      if (user.credits < amount) {
        throw new AppError('积分不足', 400);
      }

      // 2. 扣除积分
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: amount
          }
        }
      });

      // 3. 记录积分变动日志（扣除记录为负数）
      await tx.creditLog.create({
        data: {
          userId,
          amount: -amount,
          balance: updatedUser.credits,
          type,
          description: description || null,
          relatedId: relatedId || null
        }
      });

      return updatedUser.credits;
    });

    return result;
  }

  /**
   * 获取用户积分变动日志
   */
  async getCreditLogs(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.creditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.creditLog.count({
        where: { userId }
      })
    ]);

    return {
      items: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 获取用户生成记录统计
   */
  async getUserGenerationStats(userId: string) {
    const [total, success, failed, pending] = await Promise.all([
      prisma.generation.count({
        where: { userId }
      }),
      prisma.generation.count({
        where: { userId, status: 'SUCCESS' }
      }),
      prisma.generation.count({
        where: { userId, status: 'FAILED' }
      }),
      prisma.generation.count({
        where: { userId, status: { in: ['PENDING', 'PROCESSING'] } }
      })
    ]);

    return {
      total,
      success,
      failed,
      pending,
      successRate: total > 0 ? (success / total * 100).toFixed(2) : '0.00'
    };
  }

  /**
   * 移除用户敏感信息
   */
  private sanitizeUser(user: User): UserInfo {
    const { passwordHash, wechatInfo, ...userInfo } = user;
    return userInfo;
  }

  /**
   * 检查用户是否存在
   */
  async userExists(userId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id: userId }
    });
    return count > 0;
  }

  /**
   * 禁用/启用用户（管理员功能）
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });
  }

  /**
   * 管理员调整用户积分
   */
  async adminAdjustCredits(
    userId: string,
    amount: number,
    description: string,
    adminId: string
  ): Promise<number> {
    if (amount > 0) {
      return await this.addCredits(
        userId,
        amount,
        'admin_adjust',
        `管理员调整: ${description}`,
        adminId
      );
    } else if (amount < 0) {
      return await this.deductCredits(
        userId,
        Math.abs(amount),
        'admin_adjust',
        `管理员调整: ${description}`,
        adminId
      );
    }
    return await this.getUserCredits(userId);
  }
}

// 导出单例
export const userService = new UserService();
