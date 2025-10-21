import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * 密码和加密工具类
 */
export class CryptoUtil {
  /**
   * 加密密码
   * @param password - 明文密码
   * @param saltRounds - 盐值轮数（默认10）
   * @returns 加密后的密码哈希
   */
  static async hashPassword(password: string, saltRounds: number = 10): Promise<string> {
    try {
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error(`密码加密失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 验证密码
   * @param password - 明文密码
   * @param hash - 密码哈希
   * @returns 密码是否匹配
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`密码验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 生成随机字符串
   * @param length - 字符串长度
   * @returns 随机字符串
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * 生成验证码
   * @param length - 验证码长度（默认6位）
   * @returns 数字验证码
   */
  static generateVerificationCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * 生成UUID
   * @returns UUID字符串
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * MD5哈希
   * @param data - 要哈希的数据
   * @returns MD5哈希值
   */
  static md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * SHA256哈希
   * @param data - 要哈希的数据
   * @returns SHA256哈希值
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 加密字符串（AES-256-CBC）
   * @param text - 要加密的文本
   * @param key - 加密密钥（32字节）
   * @returns 加密后的文本（包含IV）
   */
  static encrypt(text: string, key: string): string {
    try {
      // 确保密钥长度为32字节
      const keyBuffer = Buffer.from(key.padEnd(32, '0').substring(0, 32));
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // 返回 IV:加密文本 格式
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error(`加密失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 解密字符串（AES-256-CBC）
   * @param encryptedText - 加密的文本（包含IV）
   * @param key - 解密密钥（32字节）
   * @returns 解密后的文本
   */
  static decrypt(encryptedText: string, key: string): string {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }

      const keyBuffer = Buffer.from(key.padEnd(32, '0').substring(0, 32));
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`解密失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
