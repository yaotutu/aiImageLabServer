import dotenv from 'dotenv';
import app from './app';
import { config } from './config/app.config';
import { connectDatabase, handleDatabaseShutdown } from './config/database';

// 确保环境变量加载
dotenv.config();

// 启动服务器
const PORT = config.port;

async function startServer() {
  try {
    // 连接数据库
    await connectDatabase();

    // 启动HTTP服务器
    app.listen(PORT, () => {
  console.log('🚀 AI图像生成服务启动成功');
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
  console.log(`📚 API信息: http://localhost:${PORT}/api`);
  console.log(`🌍 环境: ${config.nodeEnv}`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
  console.log('');

      // 开发环境提示
      if (config.nodeEnv === 'development') {
        console.log('🔧 开发环境已启用');
        console.log('💡 提示: 请确保已配置环境变量文件');
      }
    });

    // 注册关闭处理
    handleDatabaseShutdown();

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('📴 收到SIGTERM信号，开始优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 收到SIGINT信号，开始优雅关闭...');
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});