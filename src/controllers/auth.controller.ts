import { Response } from 'express';
import { authService } from '../services/auth.service';
import { ResponseUtil } from '../services/utils/response.util';
import { AuthRequest } from '../models/types';

/**
 * 认证控制器
 */
export class AuthController {
  /**
   * 邮箱注册
   */
  async registerEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.registerEmail(req.body);

      // 移除敏感信息
      const { user, token, loginType } = result;
      const { passwordHash, wechatInfo, ...userInfo } = user!;

      res.status(201);
      ResponseUtil.success(res, {
        user: userInfo,
        token,
        loginType
      }, '注册成功');
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 邮箱登录
   */
  async emailLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.emailLogin(req.body);

      const { user, token, loginType } = result;
      const { passwordHash, wechatInfo, ...userInfo } = user!;

      ResponseUtil.success(res, {
        user: userInfo,
        token,
        loginType
      }, '登录成功');
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 微信登录
   */
  async wechatLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.wechatLogin(req.body);

      const { user, token, loginType } = result;
      const { passwordHash, wechatInfo, ...userInfo } = user!;

      ResponseUtil.success(res, {
        user: userInfo,
        token,
        loginType
      }, '登录成功');
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 管理员登录
   */
  async adminLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.adminLogin(req.body);

      const { admin, token } = result;
      const { passwordHash, ...adminInfo } = admin!;

      ResponseUtil.success(res, {
        admin: adminInfo,
        token
      }, '登录成功');
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const user = await authService.verifyUserToken(
        req.headers['authorization']!.split(' ')[1]
      );

      const { passwordHash, wechatInfo, ...userInfo } = user;

      ResponseUtil.success(res, userInfo);
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 获取当前管理员信息
   */
  async getCurrentAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const admin = await authService.verifyAdminToken(
        req.headers['authorization']!.split(' ')[1]
      );

      const { passwordHash, ...adminInfo } = admin;

      ResponseUtil.success(res, adminInfo);
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 绑定微信
   */
  async bindWechat(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const { code } = req.body;

      await authService.bindWechat(req.user.userId, code);

      ResponseUtil.success(res, null, '绑定成功');
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }
}

// 导出单例
export const authController = new AuthController();
