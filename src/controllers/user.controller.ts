import { Response } from 'express';
import { userService } from '../services/user.service';
import { ResponseUtil } from '../services/utils/response.util';
import { AuthRequest } from '../models/types';

/**
 * 用户控制器
 */
export class UserController {
  /**
   * 获取用户信息
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const user = await userService.getUserById(req.user.userId);

      ResponseUtil.success(res, user);
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const user = await userService.updateUser(req.user.userId, req.body);

      ResponseUtil.success(res, user, '更新成功');
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 修改密码
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      await userService.changePassword(req.user.userId, req.body);

      ResponseUtil.success(res, null, '密码修改成功');
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 获取用户积分
   */
  async getCredits(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const credits = await userService.getUserCredits(req.user.userId);

      ResponseUtil.success(res, { credits });
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 获取积分变动日志
   */
  async getCreditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await userService.getCreditLogs(req.user.userId, page, limit);

      ResponseUtil.success(res, result);
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }

  /**
   * 获取用户生成统计
   */
  async getGenerationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 401, '未认证');
        return;
      }

      const stats = await userService.getUserGenerationStats(req.user.userId);

      ResponseUtil.success(res, stats);
    } catch (error) {
      ResponseUtil.handleError(res, error);
    }
  }
}

// 导出单例
export const userController = new UserController();
