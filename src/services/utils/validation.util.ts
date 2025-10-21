/**
 * 数据验证工具类
 */
export class ValidationUtil {
  /**
   * 验证邮箱格式
   * @param email - 邮箱地址
   * @returns 是否有效
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式（中国大陆）
   * @param phone - 手机号
   * @returns 是否有效
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证密码强度
   * @param password - 密码
   * @param minLength - 最小长度（默认6）
   * @returns 验证结果
   */
  static validatePassword(
    password: string,
    minLength: number = 6
  ): { valid: boolean; message?: string } {
    if (!password || password.length < minLength) {
      return {
        valid: false,
        message: `密码长度不能少于${minLength}个字符`
      };
    }

    if (password.length > 128) {
      return {
        valid: false,
        message: '密码长度不能超过128个字符'
      };
    }

    // 可选：检查密码复杂度
    // const hasUpperCase = /[A-Z]/.test(password);
    // const hasLowerCase = /[a-z]/.test(password);
    // const hasNumber = /\d/.test(password);
    // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return { valid: true };
  }

  /**
   * 验证用户名格式
   * @param username - 用户名
   * @returns 验证结果
   */
  static validateUsername(username: string): { valid: boolean; message?: string } {
    if (!username || username.length < 3) {
      return {
        valid: false,
        message: '用户名长度不能少于3个字符'
      };
    }

    if (username.length > 50) {
      return {
        valid: false,
        message: '用户名长度不能超过50个字符'
      };
    }

    // 只允许字母、数字、下划线和中文
    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return {
        valid: false,
        message: '用户名只能包含字母、数字、下划线和中文'
      };
    }

    return { valid: true };
  }

  /**
   * 验证昵称格式
   * @param nickname - 昵称
   * @returns 验证结果
   */
  static validateNickname(nickname: string): { valid: boolean; message?: string } {
    if (!nickname || nickname.trim().length === 0) {
      return {
        valid: false,
        message: '昵称不能为空'
      };
    }

    if (nickname.length > 50) {
      return {
        valid: false,
        message: '昵称长度不能超过50个字符'
      };
    }

    return { valid: true };
  }

  /**
   * 验证URL格式
   * @param url - URL字符串
   * @returns 是否有效
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证验证码格式
   * @param code - 验证码
   * @param length - 预期长度（默认6）
   * @returns 是否有效
   */
  static isValidVerificationCode(code: string, length: number = 6): boolean {
    const codeRegex = new RegExp(`^\\d{${length}}$`);
    return codeRegex.test(code);
  }

  /**
   * 清理和规范化邮箱
   * @param email - 邮箱地址
   * @returns 规范化后的邮箱
   */
  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * 清理和规范化手机号
   * @param phone - 手机号
   * @returns 规范化后的手机号
   */
  static normalizePhone(phone: string): string {
    // 移除所有非数字字符
    return phone.replace(/\D/g, '');
  }

  /**
   * 验证文件扩展名
   * @param filename - 文件名
   * @param allowedExtensions - 允许的扩展名数组
   * @returns 是否有效
   */
  static isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    return allowedExtensions.includes(ext);
  }

  /**
   * 验证文件大小
   * @param fileSize - 文件大小（字节）
   * @param maxSize - 最大允许大小（字节）
   * @returns 是否有效
   */
  static isValidFileSize(fileSize: number, maxSize: number): boolean {
    return fileSize > 0 && fileSize <= maxSize;
  }

  /**
   * 安全的字符串截断
   * @param str - 字符串
   * @param maxLength - 最大长度
   * @param suffix - 后缀（默认...）
   * @returns 截断后的字符串
   */
  static truncateString(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 转义HTML特殊字符
   * @param str - 字符串
   * @returns 转义后的字符串
   */
  static escapeHtml(str: string): string {
    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
  }

  /**
   * 验证JSON字符串
   * @param str - 字符串
   * @returns 是否是有效的JSON
   */
  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证微信OpenID格式
   * @param openId - 微信OpenID
   * @returns 是否有效
   */
  static isValidWechatOpenId(openId: string): boolean {
    // 微信OpenID通常是28个字符的字母数字组合
    return /^[a-zA-Z0-9_-]{28}$/.test(openId);
  }

  /**
   * 验证积分数量
   * @param credits - 积分数量
   * @returns 验证结果
   */
  static validateCredits(credits: number): { valid: boolean; message?: string } {
    if (!Number.isInteger(credits)) {
      return {
        valid: false,
        message: '积分必须是整数'
      };
    }

    if (credits < 0) {
      return {
        valid: false,
        message: '积分不能为负数'
      };
    }

    if (credits > 1000000) {
      return {
        valid: false,
        message: '积分数量超出限制'
      };
    }

    return { valid: true };
  }
}
