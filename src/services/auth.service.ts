import { prisma } from '../config/database';
import { JWTUtil } from './utils/jwt.util';
import { CryptoUtil } from './utils/crypto.util';
import { ValidationUtil } from './utils/validation.util';
import {
  RegisterEmailDto,
  EmailLoginDto,
  WechatLoginDto,
  AdminLoginDto,
  AuthResult,
  LoginType
} from '../models/types';
import { AppError } from '../middleware/error.middleware';

/**
 * 认证服务
 * 处理用户和管理员的注册、登录、Token生成等
 */
export class AuthService {
  /**
   * 邮箱注册
   */
  async registerEmail(dto: RegisterEmailDto): Promise<AuthResult> {
    // 1. 验证输入
    const normalizedEmail = ValidationUtil.normalizeEmail(dto.email);

    if (!ValidationUtil.isValidEmail(normalizedEmail)) {
      throw new AppError('邮箱格式不正确', 400);
    }

    const passwordValidation = ValidationUtil.validatePassword(dto.password);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message || '密码格式不正确', 400);
    }

    const nicknameValidation = ValidationUtil.validateNickname(dto.nickname);
    if (!nicknameValidation.valid) {
      throw new AppError(nicknameValidation.message || '昵称格式不正确', 400);
    }

    // 2. 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw new AppError('该邮箱已被注册', 409);
    }

    // 3. 获取默认积分配置
    const defaultCreditsConfig = await prisma.systemConfig.findUnique({
      where: { key: 'default_user_credits' }
    });
    const defaultCredits = defaultCreditsConfig
      ? JSON.parse(defaultCreditsConfig.value)
      : 3;

    // 4. 加密密码并创建用户
    const passwordHash = await CryptoUtil.hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        nickname: dto.nickname,
        loginType: LoginType.EMAIL,
        emailVerified: false,  // 实际项目中需要发送验证邮件
        credits: defaultCredits
      }
    });

    // 5. 记录积分日志
    await prisma.creditLog.create({
      data: {
        userId: user.id,
        amount: defaultCredits,
        balance: defaultCredits,
        type: 'admin_adjust',
        description: '新用户注册赠送积分'
      }
    });

    // 6. 生成JWT Token
    const token = JWTUtil.generateToken({
      userId: user.id,
      loginType: LoginType.EMAIL,
      email: user.email!
    });

    return {
      user,
      token,
      loginType: LoginType.EMAIL
    };
  }

  /**
   * 邮箱登录
   */
  async emailLogin(dto: EmailLoginDto): Promise<AuthResult> {
    // 1. 验证输入
    const normalizedEmail = ValidationUtil.normalizeEmail(dto.email);

    if (!ValidationUtil.isValidEmail(normalizedEmail)) {
      throw new AppError('邮箱格式不正确', 400);
    }

    // 2. 查找用户
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      throw new AppError('邮箱或密码错误', 401);
    }

    if (!user.passwordHash) {
      throw new AppError('该账号未设置密码，请使用其他方式登录', 400);
    }

    // 3. 验证密码
    const isPasswordValid = await CryptoUtil.verifyPassword(
      dto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError('邮箱或密码错误', 401);
    }

    // 4. 检查账号状态
    if (!user.isActive) {
      throw new AppError('账号已被禁用，请联系管理员', 403);
    }

    // 5. 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // 6. 生成JWT Token
    const token = JWTUtil.generateToken({
      userId: user.id,
      loginType: LoginType.EMAIL,
      email: user.email!
    });

    return {
      user,
      token,
      loginType: LoginType.EMAIL
    };
  }

  /**
   * 微信登录（模拟实现）
   * 实际项目中需要调用微信API
   */
  async wechatLogin(dto: WechatLoginDto): Promise<AuthResult> {
    // 1. 验证code
    if (!dto.code) {
      throw new AppError('微信授权code不能为空', 400);
    }

    // 2. 调用微信API获取用户信息（这里模拟）
    // 实际需要调用: https://api.weixin.qq.com/sns/jscode2session
    const wechatUserInfo = await this.getWechatUserInfo(dto.code);

    if (!wechatUserInfo.openid) {
      throw new AppError('微信登录失败，请重试', 500);
    }

    // 3. 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { wechatOpenId: wechatUserInfo.openid }
    });

    if (!user) {
      // 新用户，创建账号
      const defaultCreditsConfig = await prisma.systemConfig.findUnique({
        where: { key: 'default_user_credits' }
      });
      const defaultCredits = defaultCreditsConfig
        ? JSON.parse(defaultCreditsConfig.value)
        : 3;

      user = await prisma.user.create({
        data: {
          wechatOpenId: wechatUserInfo.openid,
          wechatUnionId: wechatUserInfo.unionid,
          wechatInfo: JSON.stringify(wechatUserInfo),
          nickname: wechatUserInfo.nickname || '微信用户',
          avatarUrl: wechatUserInfo.avatar,
          loginType: LoginType.WECHAT,
          credits: defaultCredits
        }
      });

      // 记录积分日志
      await prisma.creditLog.create({
        data: {
          userId: user.id,
          amount: defaultCredits,
          balance: defaultCredits,
          type: 'admin_adjust',
          description: '新用户注册赠送积分'
        }
      });
    } else {
      // 更新登录时间和微信信息
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          wechatInfo: JSON.stringify(wechatUserInfo),
          nickname: wechatUserInfo.nickname || user.nickname,
          avatarUrl: wechatUserInfo.avatar || user.avatarUrl
        }
      });
    }

    // 4. 检查账号状态
    if (!user.isActive) {
      throw new AppError('账号已被禁用，请联系管理员', 403);
    }

    // 5. 生成JWT Token
    const token = JWTUtil.generateToken({
      userId: user.id,
      loginType: LoginType.WECHAT
    });

    return {
      user,
      token,
      loginType: LoginType.WECHAT
    };
  }

  /**
   * 管理员登录
   */
  async adminLogin(dto: AdminLoginDto): Promise<AuthResult> {
    // 1. 验证输入
    if (!dto.username || !dto.password) {
      throw new AppError('用户名和密码不能为空', 400);
    }

    // 2. 查找管理员
    const admin = await prisma.admin.findUnique({
      where: { username: dto.username }
    });

    if (!admin) {
      throw new AppError('用户名或密码错误', 401);
    }

    // 3. 验证密码
    const isPasswordValid = await CryptoUtil.verifyPassword(
      dto.password,
      admin.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 401);
    }

    // 4. 检查账号状态
    if (!admin.isActive) {
      throw new AppError('管理员账号已被禁用', 403);
    }

    // 5. 更新最后登录时间
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    });

    // 6. 生成JWT Token
    const token = JWTUtil.generateToken({
      userId: admin.id,  // 这里用userId字段存管理员ID
      loginType: 'ADMIN'  // 特殊标识
    });

    return {
      admin,
      token
    };
  }

  /**
   * 绑定微信到现有账号
   */
  async bindWechat(userId: string, code: string): Promise<void> {
    // 1. 获取微信用户信息
    const wechatUserInfo = await this.getWechatUserInfo(code);

    if (!wechatUserInfo.openid) {
      throw new AppError('微信绑定失败，请重试', 500);
    }

    // 2. 检查微信是否已被绑定
    const existingBinding = await prisma.user.findUnique({
      where: { wechatOpenId: wechatUserInfo.openid }
    });

    if (existingBinding && existingBinding.id !== userId) {
      throw new AppError('该微信账号已被其他用户绑定', 409);
    }

    // 3. 绑定微信
    await prisma.user.update({
      where: { id: userId },
      data: {
        wechatOpenId: wechatUserInfo.openid,
        wechatUnionId: wechatUserInfo.unionid,
        wechatInfo: JSON.stringify(wechatUserInfo)
      }
    });
  }

  /**
   * 获取微信用户信息（模拟）
   * 实际项目中需要调用微信API
   */
  private async getWechatUserInfo(code: string): Promise<any> {
    // 模拟微信API调用
    // 实际应该调用: https://api.weixin.qq.com/sns/jscode2session

    // 开发环境模拟返回
    if (process.env.NODE_ENV === 'development') {
      return {
        openid: `mock_openid_${code}`,
        unionid: `mock_unionid_${code}`,
        nickname: '微信测试用户',
        avatar: 'https://example.com/avatar.jpg',
        sex: 1,
        province: '广东',
        city: '深圳',
        country: '中国'
      };
    }

    // 生产环境需要实现真实的微信API调用
    throw new AppError('微信登录功能尚未配置', 501);
  }

  /**
   * 验证Token并返回用户信息
   */
  async verifyUserToken(token: string) {
    try {
      const payload = JWTUtil.verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      if (!user.isActive) {
        throw new AppError('账号已被禁用', 403);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Token验证失败', 401);
    }
  }

  /**
   * 验证管理员Token并返回管理员信息
   */
  async verifyAdminToken(token: string) {
    try {
      const payload = JWTUtil.verifyToken(token);

      const admin = await prisma.admin.findUnique({
        where: { id: payload.userId }
      });

      if (!admin) {
        throw new AppError('管理员不存在', 404);
      }

      if (!admin.isActive) {
        throw new AppError('管理员账号已被禁用', 403);
      }

      return admin;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Token验证失败', 401);
    }
  }
}

// 导出单例
export const authService = new AuthService();
