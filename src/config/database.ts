import { PrismaClient } from '@prisma/client';

/**
 * Prisma客户端单例
 * 在开发环境中使用全局变量避免热重载时创建多个实例
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

// 在开发环境中将实例保存到全局变量
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

/**
 * 连接数据库
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
}

/**
 * 断开数据库连接
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ 数据库断开连接');
  } catch (error) {
    console.error('❌ 数据库断开连接失败:', error);
    throw error;
  }
}

/**
 * 处理应用关闭时断开数据库连接
 */
export function handleDatabaseShutdown(): void {
  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

// 导出默认客户端
export default prisma;
