import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

/**
 * API路由配置
 */

// 认证路由
router.use('/auth', authRoutes);

// 用户路由
router.use('/users', userRoutes);

// 健康检查（已在app.ts中定义，这里可选）
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString()
  });
});

export default router;
