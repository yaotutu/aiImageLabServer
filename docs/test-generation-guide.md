# 图像生成完整流程测试指南

## 准备工作

### 1. 确保服务器运行
```bash
# 服务器应该运行在端口 8000
lsof -ti:8000
# 如果没有输出，重新启动服务器
node dist/main.js
```

### 2. 准备测试图片
在项目根目录放置一张名为 `test-image.jpg` 的图片（任意图片都可以）

**方式一：使用现有图片**
```bash
# 将任意图片复制到项目根目录并重命名为 test-image.jpg
cp /path/to/your/image.jpg test-image.jpg
```

**方式二：下载测试图片（需要网络）**
```bash
curl -L -o test-image.jpg https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=512
```

### 3. 确保数据库有模板数据
```bash
# 如果还没有运行种子数据
npm run prisma:seed
```

---

## 自动化测试（推荐）

直接运行测试脚本，会自动完成所有步骤：

```bash
./test-image-generation.sh
```

该脚本会自动执行：
1. 注册新用户
2. 获取可用模板
3. 创建生成任务
4. 上传图片
5. 轮询查询生成状态
6. 下载生成结果

---

## 手动测试（详细步骤）

如果想手动一步步测试，按以下步骤操作：

### 步骤 1: 注册用户并获取 Token

```bash
# 注册新用户
curl -X POST http://localhost:8000/api/auth/register/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "nickname": "测试用户"
  }'

# 响应示例：
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { ... }
# }

# 保存 token 到环境变量
export TOKEN="你的token"
```

### 步骤 2: 查看可用模板

```bash
# 获取所有模板
curl -X GET http://localhost:8000/api/templates \
  -H "Authorization: Bearer $TOKEN"

# 响应示例：
# {
#   "templates": [
#     {
#       "id": "cm0abc123...",
#       "name": "一寸证件照",
#       "category": "id_photo",
#       "creditsRequired": 1
#     },
#     ...
#   ]
# }

# 选择一个模板，保存模板ID
export TEMPLATE_ID="cm0abc123..."
```

### 步骤 3: 创建生成任务

```bash
# 创建任务
curl -X POST http://localhost:8000/api/generations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": \"$TEMPLATE_ID\",
    \"generationType\": \"TEMPLATE\",
    \"title\": \"我的第一张AI图片\"
  }"

# 响应示例：
# {
#   "id": "task123...",
#   "status": "PENDING",
#   "templateId": "...",
#   "userId": "...",
#   "creditsUsed": 1,
#   ...
# }

# 保存任务ID
export TASK_ID="task123..."
```

### 步骤 4: 上传图片，触发生成

```bash
# 上传图片
curl -X POST http://localhost:8000/api/generations/$TASK_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-image.jpg"

# 响应示例：
# {
#   "id": "task123...",
#   "status": "PROCESSING",
#   "originalImageUrl": "/uploads/originals/xxx.jpg",
#   ...
# }

# 此时任务状态变为 PROCESSING，后台开始调用阿里云 API 生成图像
```

### 步骤 5: 查询生成状态

```bash
# 查询任务状态（可以多次查询）
curl -X GET http://localhost:8000/api/generations/$TASK_ID/status \
  -H "Authorization: Bearer $TOKEN"

# 处理中的响应：
# {
#   "status": "PROCESSING",
#   ...
# }

# 成功后的响应：
# {
#   "id": "task123...",
#   "status": "SUCCESS",
#   "originalImageUrl": "/uploads/originals/xxx.jpg",
#   "resultImageUrl": "https://dashscope.aliyuncs.com/...",
#   "aiRequestId": "abc123...",
#   "completedAt": "2025-10-23T...",
#   ...
# }

# 失败时的响应：
# {
#   "status": "FAILED",
#   "errorMessage": "错误信息",
#   ...
# }
```

### 步骤 6: 下载生成结果

```bash
# 从响应中获取 resultImageUrl，下载图片
curl -o generated-result.jpg "https://dashscope.aliyuncs.com/..."
```

### 步骤 7: 查看用户所有生成记录

```bash
# 获取生成记录列表
curl -X GET "http://localhost:8000/api/generations?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"

# 响应示例：
# {
#   "tasks": [ ... ],
#   "total": 5,
#   "page": 1,
#   "pageSize": 10,
#   "totalPages": 1
# }
```

---

## 完整的 Postman/Apifox 测试流程

如果你使用 Postman 或 Apifox 等 API 测试工具：

### 1. 导入 API 文档
访问：http://localhost:8000/api-docs
可以在 Scalar 文档中直接测试所有接口

### 2. 创建环境变量
- `BASE_URL`: `http://localhost:8000/api`
- `TOKEN`: （登录后获取）
- `TASK_ID`: （创建任务后获取）

### 3. 按顺序执行请求
1. POST `/auth/register/email` - 注册
2. POST `/auth/login/email` - 登录（保存token）
3. GET `/templates` - 查看模板（选择一个模板ID）
4. POST `/generations` - 创建任务（保存task ID）
5. POST `/generations/:taskId/upload` - 上传图片
6. GET `/generations/:taskId/status` - 查询状态（多次查询直到SUCCESS）

---

## 故障排查

### 问题 1: 服务器未启动
```bash
# 检查端口
lsof -ti:8000

# 重新启动
npm run build && node dist/main.js
```

### 问题 2: 没有模板数据
```bash
# 运行种子数据
npm run prisma:seed
```

### 问题 3: 图片上传失败
- 确保图片文件存在且格式正确（JPG, PNG, WEBP）
- 确保图片大小不超过 10MB
- 确保 `uploads/originals` 目录存在且有写入权限

### 问题 4: 阿里云 API 调用失败
- 检查 `.env` 文件中的 `ALIYUN_API_KEY` 是否正确
- 查看服务器日志，确认错误信息
- 确保网络可以访问阿里云 API

### 问题 5: 任务一直处于 PROCESSING 状态
- 检查服务器控制台日志，查看错误信息
- 阿里云 API 通常需要 10-60 秒生成图像
- 如果超过 2 分钟仍未完成，可能是 API 错误

---

## 查看日志

### 服务器日志
服务器会输出详细日志：
- `开始处理图像生成任务 [taskId=...]`
- `调用阿里云API生成图像: {...}`
- `图像生成成功 [taskId=...] [imageUrl=...]`
- `图像生成失败 [taskId=...]: 错误信息`

### 检查数据库
```bash
# 使用 Prisma Studio 查看数据
npx prisma studio

# 或直接查询数据库
sqlite3 app.db "SELECT * FROM generations ORDER BY createdAt DESC LIMIT 5;"
```

---

## API 响应格式

### 成功响应
```json
{
  "id": "task_id",
  "userId": "user_id",
  "templateId": "template_id",
  "generationType": "TEMPLATE",
  "status": "SUCCESS",
  "originalImageUrl": "/uploads/originals/xxx.jpg",
  "resultImageUrl": "https://dashscope.aliyuncs.com/...",
  "aiRequestId": "abc123",
  "creditsUsed": 1,
  "title": "我的图片",
  "createdAt": "2025-10-23T...",
  "completedAt": "2025-10-23T...",
  "template": {
    "name": "一寸证件照",
    "category": "id_photo"
  }
}
```

### 失败响应
```json
{
  "statusCode": 400,
  "message": "错误信息",
  "error": "Bad Request"
}
```

---

## 下一步

测试通过后，你可以：
1. 修改模板的 `prompt` 字段来调整生成效果
2. 添加更多 AI 服务适配器（Stable Diffusion、Midjourney 等）
3. 实现图片下载和本地存储功能
4. 添加图片处理功能（裁剪、压缩、水印等）
5. 实现队列系统处理大量并发请求
