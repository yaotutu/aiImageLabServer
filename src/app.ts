import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/app.config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import apiRoutes from './routes';

// 创建Express应用
const app: Application = express();

// 基础中间件
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
}

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // 生产环境指定域名
    : true, // 开发环境允许所有域名
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查接口
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

// API信息接口
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'AI图像生成后端服务',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      templates: '/api/templates',
      generations: '/api/generations',
      admin: '/admin'
    }
  });
});

// API路由
app.use('/api', apiRoutes);

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

export default app;