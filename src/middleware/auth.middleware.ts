import { Response, NextFunction } from 'express';
import { JWTUtil } from '../services/utils/jwt.util';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../models/types';
import { ResponseUtil } from '../services/utils/response.util';
import { AdminRole } from '../models/types';

/**
 * 用户认证中间件
 * 验证JWT Token并将用户信息注入到request对象
 */
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. 从请求头获取Token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      ResponseUtil.error(res, 401, '缺少认证Token');
      return;
    }

    // 2. 验证Token
    try {
      JWTUtil.verifyToken(token);
    } catch (error) {
      ResponseUtil.error(res, 401, error instanceof Error ? error.message : 'Token无效');
      return;
    }

    // 3. 获取用户信息
    try {
      const user = await authService.verifyUserToken(token);

      // 4. 将用户信息注入到request
      req.user = {
        userId: user.id,
        loginType: user.loginType as any,
        ...(user.email && { email: user.email }),
        ...(user.phone && { phone: user.phone })
      };

      next();
    } catch (error) {
      ResponseUtil.error(
        res,
        401,
        error instanceof Error ? error.message : '用户验证失败'
      );
      return;
    }
  } catch (error) {
    ResponseUtil.error(
      res,
      500,
      error instanceof Error ? error.message : '认证失败'
    );
    return;
  }
};

/**
 * 可选的用户认证中间件
 * 如果提供了Token则验证，否则继续执行
 */
export const optionalAuthenticateUser = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // 没有Token，继续执行
      next();
      return;
    }

    // 有Token，尝试验证
    try {
      const user = await authService.verifyUserToken(token);

      req.user = {
        userId: user.id,
        loginType: user.loginType as any,
        ...(user.email && { email: user.email }),
        ...(user.phone && { phone: user.phone })
      };
    } catch (error) {
      // Token验证失败，但不阻止请求
      console.warn('Optional auth failed:', error);
    }

    next();
  } catch (error) {
    // 出错也继续执行
    next();
  }
};

/**
 * 管理员认证中间件
 */
export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. 从请求头获取Token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      ResponseUtil.error(res, 401, '缺少认证Token');
      return;
    }

    // 2. 验证Token
    try {
      JWTUtil.verifyToken(token);
    } catch (error) {
      ResponseUtil.error(res, 401, error instanceof Error ? error.message : 'Token无效');
      return;
    }

    // 3. 获取管理员信息
    try {
      const admin = await authService.verifyAdminToken(token);

      // 4. 将管理员信息注入到request
      req.admin = {
        adminId: admin.id,
        username: admin.username,
        role: admin.role as AdminRole
      };

      next();
    } catch (error) {
      ResponseUtil.error(
        res,
        401,
        error instanceof Error ? error.message : '管理员验证失败'
      );
      return;
    }
  } catch (error) {
    ResponseUtil.error(
      res,
      500,
      error instanceof Error ? error.message : '认证失败'
    );
    return;
  }
};

/**
 * 管理员角色权限检查中间件工厂
 * @param allowedRoles - 允许的角色列表
 */
export const requireAdminRole = (allowedRoles: AdminRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      ResponseUtil.error(res, 401, '未认证的管理员');
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      ResponseUtil.error(res, 403, '权限不足');
      return;
    }

    next();
  };
};

/**
 * 超级管理员权限检查
 */
export const requireSuperAdmin = requireAdminRole([AdminRole.SUPER_ADMIN]);

/**
 * 模版管理权限检查
 */
export const requireTemplateAdmin = requireAdminRole([
  AdminRole.SUPER_ADMIN,
  AdminRole.TEMPLATE_ADMIN
]);

/**
 * 用户管理权限检查
 */
export const requireUserAdmin = requireAdminRole([
  AdminRole.SUPER_ADMIN,
  AdminRole.USER_ADMIN
]);
