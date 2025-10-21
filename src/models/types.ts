import { Request } from 'express';
import { User, Admin } from '@prisma/client';

/**
 * ==================== 枚举类型 ====================
 * 注意：这些枚举对应数据库中的String字段
 */

// 登录类型
export enum LoginType {
  WECHAT = 'WECHAT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE'
}

// 管理员角色
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TEMPLATE_ADMIN = 'TEMPLATE_ADMIN',
  USER_ADMIN = 'USER_ADMIN',
  VIEWER = 'VIEWER'
}

// 生成类型
export enum GenerationType {
  TEMPLATE = 'TEMPLATE',
  ID_PHOTO = 'ID_PHOTO',
  PORTRAIT = 'PORTRAIT'
}

// 生成状态
export enum GenerationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

// 支付方式
export enum PaymentMethod {
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  AD_REWARD = 'AD_REWARD'
}

// 订单状态
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// 积分变动类型
export enum CreditLogType {
  PURCHASE = 'purchase',            // 购买
  AD_REWARD = 'ad_reward',          // 广告奖励
  GENERATION = 'generation',        // 生成消耗
  ADMIN_ADJUST = 'admin_adjust',    // 管理员调整
  REFUND = 'refund'                 // 退款
}

/**
 * ==================== 认证相关类型 ====================
 */

// 扩展的Express Request，包含用户信息
export interface AuthRequest extends Request {
  user?: UserPayload;
  admin?: AdminPayload;
}

// JWT Payload中的用户信息
export interface UserPayload {
  userId: string;
  loginType: LoginType;
  email?: string;
  phone?: string;
}

// JWT Payload中的管理员信息
export interface AdminPayload {
  adminId: string;
  username: string;
  role: AdminRole;
}

// 用户注册DTO
export interface RegisterEmailDto {
  email: string;
  password: string;
  nickname: string;
}

// 邮箱登录DTO
export interface EmailLoginDto {
  email: string;
  password: string;
}

// 手机号登录DTO
export interface PhoneLoginDto {
  phone: string;
  code: string;  // 验证码
}

// 微信登录DTO
export interface WechatLoginDto {
  code: string;  // 微信授权code
}

// 管理员登录DTO
export interface AdminLoginDto {
  username: string;
  password: string;
}

// 认证结果
export interface AuthResult {
  user?: User;
  admin?: Admin;
  token: string;
  loginType?: LoginType;
}

/**
 * ==================== 用户相关类型 ====================
 */

// 用户信息（不含敏感字段）
export type UserInfo = Omit<User, 'passwordHash' | 'wechatInfo'>;

// 用户更新DTO
export interface UpdateUserDto {
  nickname?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
}

// 修改密码DTO
export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

/**
 * ==================== 模版相关类型 ====================
 */

// 模版分类
export type TemplateCategory = 'template_square' | 'id_photo' | 'portrait';

// AI提供商
export type AIProvider = 'mock' | 'midjourney' | 'stable_diffusion' | 'dalle';

// 模版创建DTO
export interface CreateTemplateDto {
  name: string;
  description?: string;
  category: TemplateCategory;
  tags?: string[];
  thumbnailUrl?: string;
  previewUrls?: string[];
  aiProvider: AIProvider;
  aiParams?: any;
  prompt?: string;
  creditsRequired?: number;
  isPremium?: boolean;
  sortOrder?: number;
}

// 模版更新DTO
export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  tags?: string[];
  thumbnailUrl?: string;
  previewUrls?: string[];
  aiProvider?: AIProvider;
  aiParams?: any;
  prompt?: string;
  creditsRequired?: number;
  isActive?: boolean;
  isPremium?: boolean;
  sortOrder?: number;
}

/**
 * ==================== 图像生成相关类型 ====================
 */

// 证件照生成参数
export interface IdPhotoGenerationParams {
  specId: string;           // 证件照规格ID
  backgroundColor: string;  // 背景颜色
  imageFile: Express.Multer.File;  // 上传的照片
}

// 形象照生成参数
export interface PortraitGenerationParams {
  styleId: string;          // 形象照风格ID
  imageFile: Express.Multer.File;  // 上传的照片
  customParams?: any;       // 自定义参数
}

// 模版生成参数
export interface TemplateGenerationParams {
  templateId: string;
  imageFile?: Express.Multer.File;  // 可选的输入图片
  customParams?: any;       // 自定义参数
}

// 生成任务
export interface GenerationTask {
  userId: string;
  generationType: GenerationType;
  templateId?: string;
  originalImageUrl?: string;
  aiProvider: AIProvider;
  aiParams: any;
  creditsRequired: number;
}

/**
 * ==================== 支付相关类型 ====================
 */

// 创建订单DTO
export interface CreateOrderDto {
  userId: string;
  credits: number;
  amount: number;
  paymentMethod: PaymentMethod;
  openid?: string;  // 微信支付需要
}

// 积分套餐
export interface CreditPackage {
  credits: number;
  price: number;
  name: string;
  description?: string;
}

// 微信支付参数
export interface WechatPayParams {
  orderId: string;
  amount: number;
  description: string;
  openid?: string;
}

// 支付宝支付参数
export interface AlipayParams {
  orderId: string;
  amount: number;
  subject: string;
}

// 广告奖励DTO
export interface AdRewardDto {
  adId: string;
  adToken: string;
  userId: string;
}

/**
 * ==================== 查询参数类型 ====================
 */

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页结果
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 模版查询参数
export interface TemplateQueryParams extends PaginationParams {
  category?: TemplateCategory;
  search?: string;
  isPremium?: boolean;
  isActive?: boolean;
  tags?: string[];
}

// 生成记录查询参数
export interface GenerationQueryParams extends PaginationParams {
  userId?: string;
  generationType?: GenerationType;
  status?: GenerationStatus;
  startDate?: string;
  endDate?: string;
}

// 订单查询参数
export interface OrderQueryParams extends PaginationParams {
  userId?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

/**
 * ==================== 统计相关类型 ====================
 */

// 系统概览统计
export interface SystemStats {
  totalUsers: number;
  totalGenerations: number;
  totalRevenue: number;
  activeUsers: number;
  todayGenerations: number;
  todayRevenue: number;
}

// 生成统计
export interface GenerationStats {
  totalCount: number;
  successCount: number;
  failedCount: number;
  byType: Record<GenerationType, number>;
  byProvider: Record<AIProvider, number>;
}

/**
 * ==================== 文件上传相关类型 ====================
 */

// 文件上传结果
export interface UploadResult {
  originalUrl: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
}

// 图片处理选项
export interface ImageProcessOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  watermark?: boolean;
}

/**
 * ==================== 微信相关类型 ====================
 */

// 微信用户信息
export interface WechatUserInfo {
  openid: string;
  unionid?: string;
  nickname?: string;
  avatar?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
}

// 微信登录响应
export interface WechatLoginResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

/**
 * ==================== 系统配置相关类型 ====================
 */

// 系统配置键
export type SystemConfigKey =
  | 'free_user_daily_limit'
  | 'generation_cooldown'
  | 'ad_reward_credits'
  | 'default_user_credits'
  | 'credit_packages'
  | 'max_file_size'
  | 'supported_image_formats';

// 系统配置值类型映射
export interface SystemConfigValueMap {
  free_user_daily_limit: number;
  generation_cooldown: number;
  ad_reward_credits: number;
  default_user_credits: number;
  credit_packages: CreditPackage[];
  max_file_size: number;
  supported_image_formats: string[];
}
