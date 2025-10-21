import jwt from 'jsonwebtoken';
import { config } from '../../config/app.config';

/**
 * JWT Token Payload接口
 */
export interface JWTPayload {
  userId: string;
  loginType: string;
  email?: string;
  phone?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Token工具类
 */
export class JWTUtil {
  /**
   * 生成JWT Token
   * @param payload - Token负载数据（不包含iat和exp）
   * @param expiresIn - 过期时间（默认7天）
   * @returns JWT Token字符串
   */
  static generateToken(
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
    expiresIn: string = config.jwtExpiresIn
  ): string {
    if (!config.jwtSecret) {
      throw new Error('JWT_SECRET未配置');
    }

    try {
      return (jwt as any).sign(payload, config.jwtSecret, { expiresIn });
    } catch (error) {
      throw new Error(`JWT生成失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 验证JWT Token
   * @param token - JWT Token字符串
   * @returns 解析后的payload
   * @throws 如果token无效或过期
   */
  static verifyToken(token: string): JWTPayload {
    if (!config.jwtSecret) {
      throw new Error('JWT_SECRET未配置');
    }

    try {
      return (jwt as any).verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token无效');
      } else {
        throw new Error(`Token验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * 解码JWT Token（不验证签名）
   * @param token - JWT Token字符串
   * @returns 解析后的payload，如果失败返回null
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * 刷新Token
   * @param oldToken - 旧的JWT Token
   * @returns 新的JWT Token
   */
  static refreshToken(oldToken: string): string {
    try {
      const payload = this.verifyToken(oldToken);

      // 移除iat和exp，生成新token
      const { iat, exp, ...newPayload } = payload;

      return this.generateToken(newPayload);
    } catch (error) {
      throw new Error(`Token刷新失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 检查Token是否即将过期（1天内）
   * @param token - JWT Token字符串
   * @returns 是否即将过期
   */
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;

      // 如果剩余时间小于1天（86400秒），认为即将过期
      return timeUntilExpiry < 86400;
    } catch (error) {
      return true;
    }
  }
}
