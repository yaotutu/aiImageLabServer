import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// 所有用户路由都需要认证
router.use(authenticateUser);

/**
 * @route GET /api/users/profile
 * @desc 获取用户资料
 * @access Private
 */
router.get('/profile', userController.getProfile.bind(userController));

/**
 * @route PUT /api/users/profile
 * @desc 更新用户资料
 * @access Private
 */
router.put('/profile', userController.updateProfile.bind(userController));

/**
 * @route POST /api/users/change-password
 * @desc 修改密码
 * @access Private
 */
router.post('/change-password', userController.changePassword.bind(userController));

/**
 * @route GET /api/users/credits
 * @desc 获取用户积分
 * @access Private
 */
router.get('/credits', userController.getCredits.bind(userController));

/**
 * @route GET /api/users/credit-logs
 * @desc 获取积分变动日志
 * @access Private
 */
router.get('/credit-logs', userController.getCreditLogs.bind(userController));

/**
 * @route GET /api/users/generation-stats
 * @desc 获取用户生成统计
 * @access Private
 */
router.get('/generation-stats', userController.getGenerationStats.bind(userController));

export default router;
