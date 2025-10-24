# Scalar API 完整流程测试指南

## 📋 目录

1. [认证方式说明](#认证方式说明)
2. [访问 Scalar API 文档](#访问-scalar-api-文档)
3. [完整流程测试步骤](#完整流程测试步骤)
4. [常见问题](#常见问题)

---

## 🔐 认证方式说明

### 认证机制

本项目使用 **JWT (JSON Web Token)** 作为主要的认证方式：

- **Token 类型**: Bearer Token
- **有效期**: 7 天
- **传递方式**: HTTP Header
- **格式**: `Authorization: Bearer <your-token>`

### 认证流程

```
1. 用户注册/登录
   ↓
2. 服务器返回 JWT Token
   ↓
3. 前端保存 Token (通常存在 localStorage)
   ↓
4. 后续请求在 Header 中携带 Token
   ↓
5. 服务器验证 Token 有效性
   ↓
6. 返回受保护的资源
```

### Token 结构

```javascript
// Token Payload 包含以下信息：
{
  "userId": "用户ID",
  "loginType": "EMAIL",  // 登录类型
  "email": "user@example.com",
  "iat": 1234567890,     // 签发时间
  "exp": 1234567890      // 过期时间
}
```

---

## 🌐 访问 Scalar API 文档

### 启动服务器

确保服务器正在运行：

```bash
# 在项目目录下执行
npm run build
node dist/main

# 或使用开发模式
npm run dev
```

服务器启动后会显示：

```
🚀 服务器已启动
📡 运行环境: development
🌐 端口: 8000
🔗 URL: http://localhost:8000
📚 API 文档: http://localhost:8000/api-docs
⏰ 启动时间: 10/23/2025, 3:56:02 PM
```

### 打开 Scalar 界面

在浏览器中访问：**http://localhost:8000/api-docs**

你会看到 Scalar 的紫色主题界面，包括：
- **左侧**: API 列表导航（认证、用户、模版三大模块）
- **中间**: 接口详情、参数说明、请求示例
- **右侧**: 代码生成和响应示例

---

## 🧪 完整流程测试步骤

### 步骤 1: 用户注册

**目的**: 创建一个新用户账号并获取 Token

#### 操作步骤：

1. 在左侧导航找到 **「认证」** → **「邮箱注册」**
2. 点击 `POST /api/auth/register/email`
3. 在右侧找到 **「Try It」** 按钮（可能需要向下滚动）
4. 填写请求参数：

```json
{
  "email": "test@example.com",
  "password": "Test123456",
  "nickname": "测试用户"
}
```

5. 点击 **「Send」** 按钮发送请求
6. 查看响应结果：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "nickname": "测试用户",
    "credits": 0
  }
}
```

7. **重要**: 复制返回的 `token` 值，后续步骤需要使用

#### 注意事项：
- 邮箱必须是有效格式
- 密码至少 6 位
- 如果邮箱已存在会返回错误，请更换邮箱

---

### 步骤 2: 用户登录（可选）

**目的**: 验证用户可以使用已注册的账号登录

#### 操作步骤：

1. 在左侧导航找到 **「认证」** → **「邮箱登录」**
2. 点击 `POST /api/auth/login/email`
3. 点击 **「Try It」** 按钮
4. 填写请求参数：

```json
{
  "email": "test@example.com",
  "password": "Test123456"
}
```

5. 点击 **「Send」** 发送请求
6. 同样会返回 token 和用户信息

**提示**: 如果步骤1已经获取了 token，可以跳过此步骤

---

### 步骤 3: 配置认证 Token

**目的**: 让后续请求自动携带认证信息

#### 操作步骤：

1. 在 Scalar 界面**顶部**找到 **🔒 锁形图标** 或 **「Authenticate」** 按钮
2. 点击后会弹出认证对话框
3. 选择 **「JWT-auth」** 认证方式
4. 在输入框中粘贴步骤1或步骤2获取的 token（**只粘贴 token 本身，不要加 "Bearer" 前缀**）
5. 点击 **「Save」** 或 **「确认」**

#### 效果：
配置成功后，所有需要认证的接口会自动添加 `Authorization: Bearer <token>` 请求头

---

### 步骤 4: 获取用户信息

**目的**: 验证认证是否生效

#### 操作步骤：

1. 在左侧导航找到 **「用户」** → **「获取用户信息」**
2. 点击 `GET /api/users/profile`
3. 点击 **「Try It」** 按钮
4. **不需要填写任何参数**（Token 会自动添加）
5. 点击 **「Send」** 发送请求
6. 查看响应：

```json
{
  "id": "...",
  "email": "test@example.com",
  "nickname": "测试用户",
  "avatarUrl": null,
  "credits": 0,
  "loginType": "EMAIL",
  "createdAt": "2025-10-23T07:30:00.000Z"
}
```

#### 验证成功标志：
- 返回 200 状态码
- 响应中包含你的用户信息
- 如果返回 401，说明 Token 未配置或已过期

---

### 步骤 5: 更新用户信息

**目的**: 测试修改用户资料功能

#### 操作步骤：

1. 在左侧导航找到 **「用户」** → **「更新用户信息」**
2. 点击 `PUT /api/users/profile`
3. 点击 **「Try It」** 按钮
4. 填写要更新的信息：

```json
{
  "nickname": "我的新昵称",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

5. 点击 **「Send」** 发送请求
6. 响应会返回更新后的用户信息

#### 提示：
- 可以只更新部分字段（如只改昵称）
- avatarUrl 应该是有效的图片 URL

---

### 步骤 6: 查询用户积分

**目的**: 查看当前用户的积分余额

#### 操作步骤：

1. 在左侧导航找到 **「用户」** → **「获取用户积分」**
2. 点击 `GET /api/users/credits`
3. 点击 **「Try It」** → **「Send」**
4. 查看响应：

```json
{
  "credits": 0
}
```

#### 说明：
- 新注册用户初始积分为 0
- 后续通过充值或活动可以增加积分

---

### 步骤 7: 浏览模版列表

**目的**: 查看平台上可用的 AI 模版

#### 操作步骤：

1. 在左侧导航找到 **「模版」** → **「获取模版列表」**
2. 点击 `GET /api/templates`
3. 点击 **「Try It」** 按钮
4. **可选**: 在 Query Parameters 中设置筛选条件：
   - `page`: 页码（默认 1）
   - `pageSize`: 每页数量（默认 20）
   - `category`: 分类（如 `id_photo`）
   - `isPremium`: 是否付费模版（true/false）

5. 点击 **「Send」** 发送请求
6. 查看响应：

```json
{
  "templates": [
    {
      "id": "...",
      "name": "证件照-蓝底",
      "description": "标准蓝底证件照",
      "category": "id_photo",
      "thumbnailUrl": "...",
      "creditsRequired": 10,
      "isPremium": false,
      "likeCount": 5
    },
    // ... 更多模版
  ],
  "total": 18,
  "page": 1,
  "pageSize": 20
}
```

#### 提示：
- 此接口**不需要认证**，游客也可以访问
- 记录一个模版的 `id`，用于后续步骤

---

### 步骤 8: 查看模版详情

**目的**: 获取某个模版的完整信息

#### 操作步骤：

1. 在左侧导航找到 **「模版」** → **「获取模版详情」**
2. 点击 `GET /api/templates/{id}`
3. 点击 **「Try It」** 按钮
4. 在 **Path Parameters** 中填写：
   - `id`: 步骤7中获取的模版 ID

5. 点击 **「Send」** 发送请求
6. 查看详细信息（包括 AI 参数、预览图等）

---

### 步骤 9: 点赞模版

**目的**: 测试用户互动功能

#### 操作步骤：

1. 在左侧导航找到 **「模版」** → **「点赞模版」**
2. 点击 `POST /api/templates/{id}/like`
3. 点击 **「Try It」** 按钮
4. 在 **Path Parameters** 中填写模版 ID
5. 点击 **「Send」** 发送请求
6. 响应会返回更新后的模版（`likeCount` 增加 1）

#### 注意：
- 此接口**需要认证**
- 每个用户对同一模版只能点赞一次

---

### 步骤 10: 取消点赞

**目的**: 测试取消点赞功能

#### 操作步骤：

1. 在左侧导航找到 **「模版」** → **「取消点赞」**
2. 点击 `DELETE /api/templates/{id}/like`
3. 点击 **「Try It」** 按钮
4. 填写模版 ID
5. 点击 **「Send」** 发送请求
6. 响应会返回更新后的模版（`likeCount` 减少 1）

---

### 步骤 11: 搜索模版

**目的**: 测试模版搜索功能

#### 操作步骤：

1. 在左侧导航找到 **「模版」** → **「搜索模版」**
2. 点击 `GET /api/templates/search`
3. 点击 **「Try It」** 按钮
4. 在 **Query Parameters** 中填写：
   - `keyword`: 搜索关键词（如 "证件照"）

5. 点击 **「Send」** 发送请求
6. 返回匹配的模版列表

---

### 步骤 12: 按分类查询

**目的**: 查看特定分类的所有模版

#### 操作步骤：

1. 在左侧导航找到 **「模版」** → **「按分类获取模版」**
2. 点击 `GET /api/templates/category/{category}`
3. 点击 **「Try It」** 按钮
4. 在 **Path Parameters** 中填写：
   - `category`: 分类名称（如 `id_photo`、`portrait`）

5. 点击 **「Send」** 发送请求
6. 返回该分类下的所有模版

#### 可用分类：
- `id_photo`: 证件照
- `portrait`: 形象照
- `creative`: 创意图片

---

### 步骤 13: 修改密码

**目的**: 测试用户安全功能

#### 操作步骤：

1. 在左侧导航找到 **「用户」** → **「修改密码」**
2. 点击 `PUT /api/users/password`
3. 点击 **「Try It」** 按钮
4. 填写请求参数：

```json
{
  "oldPassword": "Test123456",
  "newPassword": "NewPass123456"
}
```

5. 点击 **「Send」** 发送请求
6. 响应成功后，密码已更新

#### 注意：
- 修改密码后原有 Token **仍然有效**（直到过期）
- 下次登录需要使用新密码

---

## ✅ 完整流程总结

完成以上所有步骤后，你已经测试了：

### 认证模块
- ✅ 用户注册
- ✅ 用户登录
- ✅ JWT Token 认证机制

### 用户模块
- ✅ 获取用户信息
- ✅ 更新用户资料
- ✅ 查询积分余额
- ✅ 修改密码

### 模版模块
- ✅ 浏览模版列表（支持分页）
- ✅ 查看模版详情
- ✅ 搜索模版
- ✅ 按分类查询
- ✅ 点赞/取消点赞

**测试覆盖率**: 16 个 API 接口全部完成 ✓

---

## 🔍 常见问题

### Q1: 提示 "401 Unauthorized" 错误

**原因**: Token 未配置或已过期

**解决方案**:
1. 检查是否在 Scalar 顶部配置了认证 Token
2. 重新登录获取新的 Token
3. 确认 Token 复制完整，没有多余空格

### Q2: 找不到 "Authenticate" 按钮

**位置**: 通常在 Scalar 界面的右上角或顶部工具栏

**备选方案**: 直接在接口的 **「Try It」** 区域找到 **「Authorization」** 标签页手动添加

### Q3: 请求返回空白或加载失败

**可能原因**:
- 服务器未启动
- 端口被占用
- 网络问题

**检查方法**:
```bash
# 检查服务器是否运行
lsof -ti:8000

# 检查端口是否可访问
curl http://localhost:8000/api/templates
```

### Q4: 如何查看请求的完整 Header

在 Scalar 中：
1. 发送请求后，在响应区域找到 **「Request」** 标签
2. 可以看到实际发送的 Headers、Body 等信息
3. 确认 `Authorization` Header 是否正确添加

### Q5: 注册时提示邮箱已存在

**解决方案**:
- 使用不同的邮箱地址
- 或直接使用该邮箱登录获取 Token

### Q6: 如何复制接口调用的代码

Scalar 提供多种语言的代码生成：

1. 在接口详情页找到 **「Code Examples」** 或代码图标
2. 选择你需要的语言（JavaScript、Python、cURL 等）
3. 复制生成的代码到你的项目中

---

## 📚 进阶使用

### 批量测试

你可以将测试步骤保存为测试集合（Collection）：

1. 在 Scalar 中导出 OpenAPI 规范
2. 导入到 Postman 或 Insomnia
3. 配置环境变量（如 `{{token}}`、`{{base_url}}`）
4. 创建自动化测试脚本

### 环境变量使用

在实际开发中，推荐配置不同环境：

```javascript
// 开发环境
const DEV_BASE_URL = 'http://localhost:8000/api';

// 测试环境
const TEST_BASE_URL = 'https://test.example.com/api';

// 生产环境
const PROD_BASE_URL = 'https://api.example.com/api';
```

---

## 🎯 下一步

完成测试后，你可以：

1. **集成到前端项目**: 参考 `API_USAGE_EXAMPLES.md` 中的前端代码示例
2. **自动化测试**: 编写端到端测试脚本
3. **性能测试**: 使用工具测试 API 性能
4. **安全测试**: 测试边界条件和异常情况

---

## 📞 技术支持

如果在测试过程中遇到问题：

1. 查看浏览器控制台的错误信息
2. 检查服务器日志输出
3. 参考项目根目录的 `CLAUDE.md` 了解架构设计
4. 查看 `API_USAGE_EXAMPLES.md` 获取代码示例

---

## 📝 测试记录模板

建议在测试时记录结果：

| 接口 | 状态 | 响应时间 | 备注 |
|-----|------|---------|------|
| POST /api/auth/register/email | ✅ | 120ms | - |
| POST /api/auth/login/email | ✅ | 95ms | - |
| GET /api/users/profile | ✅ | 45ms | - |
| PUT /api/users/profile | ✅ | 78ms | - |
| GET /api/users/credits | ✅ | 32ms | - |
| GET /api/templates | ✅ | 156ms | 18个模版 |
| GET /api/templates/{id} | ✅ | 43ms | - |
| POST /api/templates/{id}/like | ✅ | 89ms | - |
| DELETE /api/templates/{id}/like | ✅ | 67ms | - |
| GET /api/templates/search | ✅ | 102ms | 关键词: 证件照 |
| GET /api/templates/category/{cat} | ✅ | 87ms | 分类: id_photo |
| GET /api/templates/hot | ✅ | 54ms | 前3个 |
| PUT /api/users/password | ✅ | 112ms | - |

---

**祝测试顺利！** 🎉
