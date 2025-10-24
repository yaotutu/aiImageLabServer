/**
 * 统一响应码定义
 * 1xxxx: 通用错误
 * 2xxxx: 认证相关错误
 * 3xxxx: 用户相关错误
 * 4xxxx: 模板相关错误
 * 5xxxx: 生成任务相关错误
 */
export enum ResponseCode {
  // 成功
  SUCCESS = 0,

  // 通用错误 (1xxxx)
  UNKNOWN_ERROR = 10000,
  VALIDATION_ERROR = 10001,
  BAD_REQUEST = 10002,
  NOT_FOUND = 10003,
  FORBIDDEN = 10004,
  INTERNAL_ERROR = 10005,

  // 认证相关错误 (2xxxx)
  UNAUTHORIZED = 20000,
  INVALID_TOKEN = 20001,
  TOKEN_EXPIRED = 20002,
  EMAIL_ALREADY_EXISTS = 20003,
  INVALID_CREDENTIALS = 20004,
  WECHAT_AUTH_FAILED = 20005,

  // 用户相关错误 (3xxxx)
  USER_NOT_FOUND = 30000,
  INSUFFICIENT_CREDITS = 30001,
  INVALID_PASSWORD = 30002,
  PASSWORD_UPDATE_FAILED = 30003,

  // 模板相关错误 (4xxxx)
  TEMPLATE_NOT_FOUND = 40000,
  TEMPLATE_INACTIVE = 40001,
  TEMPLATE_CREATE_FAILED = 40002,
  TEMPLATE_UPDATE_FAILED = 40003,

  // 生成任务相关错误 (5xxxx)
  GENERATION_NOT_FOUND = 50000,
  GENERATION_FAILED = 50001,
  IMAGE_UPLOAD_FAILED = 50002,
  INVALID_FILE_TYPE = 50003,
  FILE_TOO_LARGE = 50004,
  GENERATION_CANCELLED = 50005,
}

/**
 * 响应码对应的消息
 */
export const ResponseMessage: Record<ResponseCode, string> = {
  [ResponseCode.SUCCESS]: '操作成功',

  [ResponseCode.UNKNOWN_ERROR]: '未知错误',
  [ResponseCode.VALIDATION_ERROR]: '参数验证失败',
  [ResponseCode.BAD_REQUEST]: '请求参数错误',
  [ResponseCode.NOT_FOUND]: '资源不存在',
  [ResponseCode.FORBIDDEN]: '无权限访问',
  [ResponseCode.INTERNAL_ERROR]: '服务器内部错误',

  [ResponseCode.UNAUTHORIZED]: '未授权访问',
  [ResponseCode.INVALID_TOKEN]: '无效的令牌',
  [ResponseCode.TOKEN_EXPIRED]: '令牌已过期',
  [ResponseCode.EMAIL_ALREADY_EXISTS]: '该邮箱已被注册',
  [ResponseCode.INVALID_CREDENTIALS]: '邮箱或密码错误',
  [ResponseCode.WECHAT_AUTH_FAILED]: '微信授权失败',

  [ResponseCode.USER_NOT_FOUND]: '用户不存在',
  [ResponseCode.INSUFFICIENT_CREDITS]: '积分不足',
  [ResponseCode.INVALID_PASSWORD]: '密码错误',
  [ResponseCode.PASSWORD_UPDATE_FAILED]: '密码修改失败',

  [ResponseCode.TEMPLATE_NOT_FOUND]: '模板不存在',
  [ResponseCode.TEMPLATE_INACTIVE]: '模板未激活',
  [ResponseCode.TEMPLATE_CREATE_FAILED]: '模板创建失败',
  [ResponseCode.TEMPLATE_UPDATE_FAILED]: '模板更新失败',

  [ResponseCode.GENERATION_NOT_FOUND]: '生成任务不存在',
  [ResponseCode.GENERATION_FAILED]: '图像生成失败',
  [ResponseCode.IMAGE_UPLOAD_FAILED]: '图片上传失败',
  [ResponseCode.INVALID_FILE_TYPE]: '不支持的文件类型',
  [ResponseCode.FILE_TOO_LARGE]: '文件过大',
  [ResponseCode.GENERATION_CANCELLED]: '任务已取消',
};
