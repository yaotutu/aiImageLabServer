import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/register/email
 * @desc 邮箱注册
 * @access Public
 */
router.post('/register/email', authController.registerEmail.bind(authController));

/**
 * @route POST /api/auth/login/email
 * @desc 邮箱登录
 * @access Public
 */
router.post('/login/email', authController.emailLogin.bind(authController));

/**
 * @route POST /api/auth/login/wechat
 * @desc 微信登录
 * @access Public
 */
router.post('/login/wechat', authController.wechatLogin.bind(authController));

/**
 * @route POST /api/auth/login/admin
 * @desc 管理员登录
 * @access Public
 */
router.post('/login/admin', authController.adminLogin.bind(authController));

/**
 * @route GET /api/auth/me
 * @desc 获取当前用户信息
 * @access Private (User)
 */
router.get('/me', authenticateUser, authController.getCurrentUser.bind(authController));

/**
 * @route GET /api/auth/admin/me
 * @desc 获取当前管理员信息
 * @access Private (Admin)
 */
router.get('/admin/me', authenticateAdmin, authController.getCurrentAdmin.bind(authController));

/**
 * @route POST /api/auth/bind/wechat
 * @desc 绑定微信
 * @access Private (User)
 */
router.post('/bind/wechat', authenticateUser, authController.bindWechat.bind(authController));

export default router;
