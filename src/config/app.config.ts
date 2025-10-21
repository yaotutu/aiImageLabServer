import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const config = {
  // 应用基础配置
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT配置
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Session配置
  sessionSecret: process.env.SESSION_SECRET,

  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'file:./app.db',

  // 文件上传配置
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },

  // 支付配置
  payment: {
    wechat: {
      mchId: process.env.WECHAT_PAY_MCH_ID,
      key: process.env.WECHAT_PAY_KEY,
    },
    alipay: {
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
    }
  },

  // AI服务配置
  aiService: {
    url: process.env.AI_SERVICE_URL,
    apiKey: process.env.AI_SERVICE_API_KEY,
  },

  // 应用常量
  constants: {
    freeUserDailyLimit: 5,
    generationCooldown: 30000, // 30秒
    adRewardCredits: 1,
    defaultUserCredits: 3,
  }
};

// 验证必需的环境变量
const requiredEnvVars = ['JWT_SECRET', 'SESSION_SECRET'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push('DATABASE_URL');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}