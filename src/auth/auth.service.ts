import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { AppLoggerService } from "../common/logger/logger.service";
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UnauthorizedException,
} from "../common/exceptions/business.exception";

@Injectable()
export class AuthService {
  private readonly logger: AppLoggerService;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    logger: AppLoggerService,
  ) {
    this.logger = logger.setContext(AuthService.name);
  }

  async register(email: string, password: string, nickname?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      throw new EmailAlreadyExistsException();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 如果没有提供昵称，使用邮箱前缀作为默认昵称
    const defaultNickname = nickname || email.split("@")[0];

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        nickname: defaultNickname,
        passwordHash: hashedPassword,
        loginType: "EMAIL",
        credits: 0,
      },
    });

    const token = this.generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user;

    this.logger.log(`用户注册成功: ${email}`);
    return { token, user: userWithoutPassword };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsException();
    }

    const token = this.generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user;

    this.logger.log(`用户登录成功: ${email}`);
    return { token, user: userWithoutPassword };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // 微信登录
  async wechatLogin(wechatInfo: {
    openId: string;
    unionId?: string;
    nickname: string;
    avatarUrl?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { wechatOpenId: wechatInfo.openId },
    });

    if (!user) {
      // 创建新用户
      user = await this.prisma.user.create({
        data: {
          nickname: wechatInfo.nickname,
          avatarUrl: wechatInfo.avatarUrl,
          wechatOpenId: wechatInfo.openId,
          wechatUnionId: wechatInfo.unionId,
          wechatInfo: JSON.stringify(wechatInfo),
          loginType: "WECHAT",
          credits: 3, // 新用户赠送3积分
        },
      });
      this.logger.log(`新微信用户注册: openId=${wechatInfo.openId}`);
    } else {
      // 更新用户信息
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          nickname: wechatInfo.nickname,
          avatarUrl: wechatInfo.avatarUrl,
          wechatInfo: JSON.stringify(wechatInfo),
          lastLoginAt: new Date(),
        },
      });
      this.logger.log(`微信用户登录: openId=${wechatInfo.openId}`);
    }

    const token = this.generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword };
  }

  // 管理员登录
  async adminLogin(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !admin.isActive) {
      throw new InvalidCredentialsException("用户名或密码错误");
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsException("用户名或密码错误");
    }

    // 更新最后登录时间
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateAdminToken(admin);
    const { passwordHash, ...adminWithoutPassword } = admin;

    this.logger.log(`管理员登录成功: ${username}`);
    return { token, admin: adminWithoutPassword };
  }

  // 绑定微信账号
  async bindWechat(
    userId: string,
    wechatInfo: { openId: string; unionId?: string },
  ) {
    // 检查微信账号是否已被其他用户绑定
    const existingUser = await this.prisma.user.findUnique({
      where: { wechatOpenId: wechatInfo.openId },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new EmailAlreadyExistsException("该微信账号已被其他用户绑定");
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        wechatOpenId: wechatInfo.openId,
        wechatUnionId: wechatInfo.unionId,
        wechatInfo: JSON.stringify(wechatInfo),
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    this.logger.log(`用户绑定微信: userId=${userId}`);
    return { user: userWithoutPassword };
  }

  // 获取当前用户信息
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        email: true,
        phone: true,
        credits: true,
        loginType: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("用户不存在");
    }

    return user;
  }

  // 获取当前管理员信息
  async getCurrentAdmin(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException("管理员不存在");
    }

    return admin;
  }

  private generateToken(user: any) {
    const payload = {
      userId: user.id,
      email: user.email,
      loginType: user.loginType,
    };
    return this.jwtService.sign(payload);
  }

  private generateAdminToken(admin: any) {
    const payload = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      type: "admin",
    };
    return this.jwtService.sign(payload);
  }
}
