# 图像生成 API 文档

## 概述
AI图像生成平台核心功能，提供从模版选择到图片生成的完整流程。支持模版生成、证件照生成、形象照生成三种类型。

## API 接口列表

### 1. 创建生成任务
```
POST /api/generations
Content-Type: application/json
Authorization: Bearer <token>

请求体:
{
  "templateId": "template_uuid",
  "generationType": "TEMPLATE|ID_PHOTO|PORTRAIT",
  "title": "我的生成任务",
  "isPublic": false,
  "priority": 0,
  "customParams": {
    "prompt": "自定义提示词",
    "styleStrength": 0.8
  }
}

响应:
{
  "success": true,
  "data": {
    "taskId": "task_uuid",
    "status": "PENDING",
    "message": "生成任务创建成功，请上传图片"
  }
}
```

### 2. 上传图片
```
POST /api/generations/:taskId/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

请求体:
file: 图片文件（multipart/form-data）

响应:
{
  "success": true,
  "data": {
    "imageUrl": "/uploads/generated_16973534567.jpg",
    "message": "图片上传成功，开始AI处理"
  }
}
```

### 3. 查询任务状态
```
GET /api/generations/:taskId/status
Content-Type: application/json
Authorization: Bearer <token>

响应:
{
  "success": true,
  "data": {
    "taskId": "task_uuid",
    "status": "PROCESSING",
    "queueStatus": "processing",
    "progress": 60,
    "message": "AI正在处理您的图片"
  }
}
```

### 4. 获取用户任务列表
```
GET /api/generations?status=SUCCESS&limit=10
Content-Type: application/json
Authorization: Bearer <token>

响应:
{
  "success": true,
  "data": {
    "tasks": [...],
    "total": 100
  }
}
```

### 5. 取消任务
```
DELETE /api/generations/:taskId
Content-Type: application/json
Authorization: Bearer <token>

响应:
{
  "success": true,
  "message": "任务已取消"
}
```

## 错误响应格式

所有接口都遵循统一的响应格式：
```json
{
  "success": boolean,
  "message": "错误信息",
  "error": "错误代码"
}
```

## 使用流程

### 完整的用户端到端流程

1. **用户选择模版**
   - 访问模版列表 `/api/templates`
   - 选择模版并获取详情

2. **用户配置生成参数**
   - 调用 `/api/generations` 创建任务
   - 系统验证积分、模版状态等
   - 获得任务ID，进入下一步

3. **用户上传图片**
   - 调用 `/api/generations/:taskId/upload` 上传图片
   - 系统保存图片，生成多尺寸版本
   - 自动进入处理队列

4. **系统异步处理**
   - Bull队列自动处理任务
   - AI适配器根据类型调用对应生成方法
   - 实时更新任务状态和进度
   - 生成完成后自动保存结果URL

5. **获取结果和通知**
   - 轮询任务状态直到完成
   - 生成成功后获得图片URL
   - 系统自动扣除用户积分
   - 更新使用次数统计

## 技术特性

### 异步处理
- 使用 Bull + Redis 实现可靠的队列系统
- 支持任务优先级、重试机制、失败处理
- 实时进度跟踪（0% → 80% → 100%）

### 图片处理
- 基于 Sharp 的高性能图片处理
- 生成原图、中等图、缩略图三种尺寸
- 支持证件照的智能尺寸匹配和背景替换
- 支持形象照的风格强度控制

### 积分系统
- 自动生成用户积分（注册赠送3积分）
- 生成消耗记录，防止超用
- 实时扣费，事务保证数据一致性

### 可扩展性
- 工厂模式的 AI 适配器架构
- Mock AI 适配器（当前实现）
- 可扩展支持 Midjourney、Stable Diffusion、DALL-E
- 统一的参数配置和错误处理

## 安全特性
- JWT 用户认证
- 文件类型验证和大小限制
- 任务权限验证（只能操作自己的任务）
- 输入文件安全检查