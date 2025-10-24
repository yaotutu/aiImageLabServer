# API 文档使用指南

## 📚 访问文档

项目已成功集成 **Scalar** API 文档系统，提供美观现代的接口文档和在线测试功能。

### 文档地址

启动开发服务器后，访问以下地址：

- **Scalar 文档页面**（推荐）：http://localhost:3000/api-docs
- **OpenAPI JSON 规范**：http://localhost:3000/api-docs.json
- **API 信息接口**：http://localhost:3000/api
- **健康检查接口**：http://localhost:3000/health

## 🚀 快速开始

### 1. 启动开发服务器

```bash
npm run dev
```

服务器启动后会显示：
```
🚀 AI图像生成服务启动成功
📍 服务地址: http://localhost:3000
📚 API文档: http://localhost:3000/api-docs
```

### 2. 浏览 API 文档

在浏览器中打开 http://localhost:3000/api-docs，你将看到：

- **美观的深色主题界面**（支持浅色/深色切换）
- **分组的 API 端点**（认证管理、用户管理等）
- **详细的请求/响应示例**
- **数据模型定义**
- **内置 API 测试工具**

## 🧪 在线测试 API

### 测试公开接口（无需认证）

1. 在文档页面找到 **POST /api/auth/register/email** 或 **POST /api/auth/login/email**
2. 点击接口展开详情
3. 点击右侧的 **"Try It"** 或 **"发送请求"** 按钮
4. 填写请求参数：
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
5. 点击 **"Send"** 发送请求
6. 查看响应结果

### 测试需要认证的接口

1. 先通过登录接口获取 Token：
   - 调用 **POST /api/auth/login/email**
   - 复制响应中的 `data.token` 值

2. 配置认证：
   - 点击页面顶部的 🔒 **"Authorize"** 或 **"认证"** 按钮
   - 在弹出框中输入：`Bearer <你的token>`
   - 例如：`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - 点击确认

3. 测试受保护的接口：
   - 现在可以测试需要认证的接口，如 **GET /api/users/profile**
   - Token 会自动添加到请求头中

## 📖 已生成的 API 端点

### 认证管理
- `POST /api/auth/register/email` - 用户注册（邮箱）
- `POST /api/auth/login/email` - 用户登录（邮箱）
- `POST /api/auth/login/wechat` - 用户登录（微信）
- `POST /api/auth/login/admin` - 管理员登录
- `GET /api/auth/me` - 获取当前用户信息 🔒
- `GET /api/auth/admin/me` - 获取当前管理员信息 🔒
- `POST /api/auth/bind/wechat` - 绑定微信账号 🔒

### 用户管理
- `GET /api/users/profile` - 获取用户资料 🔒
- `PUT /api/users/profile` - 更新用户资料 🔒
- `POST /api/users/change-password` - 修改密码 🔒
- `GET /api/users/credits` - 获取用户积分信息 🔒
- `GET /api/users/credit-logs` - 获取积分变动日志 🔒
- `GET /api/users/generation-stats` - 获取用户生成统计 🔒

🔒 表示需要 JWT 认证

## 🎨 Scalar 特性

### 1. 美观的 UI
- 现代化设计，比传统 Swagger UI 更美观
- 支持深色/浅色主题切换
- 响应式布局，移动端友好

### 2. 强大的测试功能
- 内置 API 客户端，无需使用 Postman
- 支持 JWT Bearer Token 认证
- 自动保存请求历史
- 支持环境变量配置

### 3. 完整的文档
- 请求参数说明（类型、是否必需、示例）
- 响应格式说明（状态码、数据结构）
- 请求/响应示例
- 数据模型定义

### 4. 开发体验
- 热更新：修改代码后文档自动更新
- 零配置：基于代码注释自动生成
- 标准兼容：生成标准 OpenAPI 3.x 规范

## 🔧 自定义配置

### 修改文档主题

编辑 `src/app.ts` 中的 Scalar 配置：

```typescript
app.use(
  '/api-docs',
  apiReference({
    spec: {
      url: '/api-docs.json',
    },
    theme: 'purple',      // 可选: purple, blue, green, orange
    darkMode: true,       // 默认深色模式
  })
);
```

### 添加新的 API 文档

在路由文件中添加 JSDoc 注释：

```typescript
/**
 * POST /api/your-endpoint
 * @summary 接口简要描述
 * @tags 接口分组名称
 * @security BearerAuth  // 如果需要认证
 * @param {RequestSchema} request.body.required - 请求体说明
 * @return {ResponseSchema} 200 - 成功响应说明
 * @return {ErrorResponse} 400 - 错误响应说明
 * @example request - 请求示例
 * {
 *   "field": "value"
 * }
 * @example response - 200 - 成功响应示例
 * {
 *   "success": true,
 *   "data": {}
 * }
 */
router.post('/your-endpoint', yourController.handler);
```

## 📦 导出 API 文档

### 导出 OpenAPI JSON

```bash
curl http://localhost:3000/api-docs.json > openapi.json
```

### 分享给前端团队

前端开发者可以：
1. 直接访问 http://localhost:3000/api-docs 查看文档
2. 下载 OpenAPI JSON 文件
3. 导入到 Postman、Insomnia 等工具
4. 使用代码生成工具自动生成 API 客户端

## 🎯 最佳实践

1. **保持注释更新**：修改 API 后及时更新注释
2. **提供详细示例**：每个接口都应有请求和响应示例
3. **使用合适的标签**：通过 `@tags` 对接口进行分组
4. **定义数据模型**：在 `src/schemas/api.schemas.ts` 中定义可复用的数据结构
5. **标注认证需求**：需要认证的接口添加 `@security BearerAuth`

## 🆚 为什么选择 Scalar？

与传统 Swagger UI 相比：

| 特性 | Scalar | Swagger UI |
|------|--------|-----------|
| UI 美观度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 测试体验 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 深色模式 | ✅ | ✅ |
| 响应式设计 | ✅ | ⚠️ 部分支持 |
| 加载速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 现代化程度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🔗 相关资源

- [Scalar 官方文档](https://github.com/scalar/scalar)
- [OpenAPI 3.x 规范](https://swagger.io/specification/)
- [express-jsdoc-swagger 文档](https://github.com/BRIKEV/express-jsdoc-swagger)

---

**提示**：文档会随着代码注释自动更新，无需手动维护！
