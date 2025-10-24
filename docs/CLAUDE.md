# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI图像生成后端服务 - 使用 Express.js + TypeScript 构建的AI图像生成平台后端，支持模版广场、证件照生成、形象照生成，包含完整的用户端和管理端功能。

## 常用命令

### 开发环境
```bash
# 启动开发服务器（带热重载）
npm run dev

# 构建项目
npm run build

# 启动生产环境服务器
npm start

# 运行测试
npm test
```

### 数据库相关
```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 推送数据库结构到SQLite（开发环境）
npm run prisma:push

# 初始化基础数据（种子数据）
npm run prisma:seed

# 重置数据库并重新初始化
npm run prisma:push && npm run prisma:seed
```

### 完整开发环境初始化
```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

## 核心架构

### 1. 双认证系统
项目实现了**用户端**和**管理端**两套独立的认证系统：

- **用户端认证**: JWT Token方式
  - 支持邮箱登录、微信登录
  - Token在 `Authorization: Bearer <token>` header中传递
  - 中间件: `authenticateUser` (src/middleware/auth.middleware.ts)

- **管理端认证**: JWT Token + 角色权限
  - 管理员登录使用用户名+密码
  - 基于角色的权限控制 (RBAC)
  - 角色: SUPER_ADMIN, TEMPLATE_ADMIN, USER_ADMIN, VIEWER
  - 中间件: `authenticateAdmin`, `requireAdminRole` (src/middleware/auth.middleware.ts)

### 2. 分层架构
遵循严格的三层架构模式：

```
Controller层 (controllers/)
    ↓ 处理HTTP请求/响应
Service层 (services/)
    ↓ 业务逻辑处理
Database层 (Prisma)
    ↓ 数据持久化
```

**重要原则**:
- Controller 只负责请求验证和响应格式化
- Service 包含所有业务逻辑
- 不要在 Controller 中直接调用 Prisma

### 3. Prisma ORM 数据库设计

数据库使用 SQLite + Prisma ORM，schema 位于 `prisma/schema.prisma`。

**核心数据模型**:
- `User`: 用户信息（支持多种登录方式）
- `Admin`: 管理员信息（带角色权限）
- `Template`: AI模版（模版广场）
- `Generation`: 图像生成记录
- `Order`: 订单信息
- `CreditLog`: 积分变动日志
- `SystemConfig`: 系统配置（键值对存储）
- `IdPhotoSpec`: 证件照规格
- `PortraitStyle`: 形象照风格

**注意**: SQLite 不支持 enum 类型，所有 enum 在 schema 中定义为 String，在应用层通过 TypeScript enum (src/models/types.ts) 保证类型安全。

### 4. AI 服务适配器模式

项目设计了 AI 服务适配器架构（计划在 `src/services/ai-adapters/` 目录），支持多种AI服务商：
- Mock服务（开发/测试）
- Midjourney
- Stable Diffusion
- 其他AI服务

配置通过 `Template.aiProvider` 和 `Template.aiParams` 字段指定。

### 5. 错误处理机制

统一的错误处理：
- 使用 `AppError` 类 (src/middleware/error.middleware.ts) 抛出业务错误
- 全局错误处理中间件 `errorHandler` 捕获并格式化错误
- 响应格式统一通过 `ResponseUtil` (src/services/utils/response.util.ts) 处理

**使用方式**:
```typescript
throw new AppError('错误消息', 400); // 400是HTTP状态码
```

### 6. 工具类体系

位于 `src/services/utils/`:
- `jwt.util.ts`: JWT Token 生成和验证
- `crypto.util.ts`: 密码加密（bcrypt）
- `validation.util.ts`: 输入验证（邮箱、密码、昵称等）
- `response.util.ts`: 统一响应格式

## 测试策略

项目包含测试 Token，可用于快速测试需要认证的接口：

```bash
# 测试用的JWT Token（用户端）
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWgwZHJrNnIwMDAwbHVmYm5ncDZ0M3A3IiwibG9naW5UeXBlIjoiRU1BSUwiLCJlbWFpbCI6Im5ld3VzZXJAdGVzdC5jb20iLCJpYXQiOjE3NjEwNDAwMzAsImV4cCI6MTc2MTY0NDgzMH0.ERz_qvob7PsIK7WdnwvuiRW4en1MRMF_GLdcijz_BF0"

# 测试认证接口
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/users/profile
```

## TypeScript 配置

项目使用**严格模式** TypeScript (tsconfig.json):
- `strict: true`
- `noImplicitAny: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `exactOptionalPropertyTypes: true`

**编码规范**:
- 所有类型必须显式声明
- 不允许隐式 any
- 不允许未使用的变量和参数
- 可选属性必须严格处理（不能赋值 undefined）

## 环境配置

关键环境变量（见 .env.example）:
- `JWT_SECRET`: JWT密钥（**必须修改**）
- `SESSION_SECRET`: Session密钥（**必须修改**）
- `DATABASE_URL`: SQLite数据库路径
- `NODE_ENV`: development | production

**开发环境特殊处理**:
- 微信登录使用模拟数据
- 部分安全中间件在开发环境宽松配置

## 路由结构

```
/health              - 健康检查
/api                 - API信息

/api/auth/*          - 用户认证
/api/users/*         - 用户相关
/api/templates/*     - 模版相关（计划）
/api/generations/*   - 生成记录（计划）
/api/id-photo/*      - 证件照生成（计划）
/api/portrait/*      - 形象照生成（计划）
/api/orders/*        - 订单支付（计划）

/admin/auth/*        - 管理员认证（计划）
/admin/templates/*   - 模版管理（计划）
/admin/users/*       - 用户管理（计划）
/admin/stats/*       - 系统统计（计划）
```

## 开发注意事项

1. **数据库迁移**: 修改 schema 后必须运行 `npm run prisma:generate` 和 `npm run prisma:push`

2. **积分系统**:
   - 所有积分变动必须同时记录到 `CreditLog`
   - 使用事务确保 `User.credits` 和 `CreditLog` 的一致性

3. **认证中间件链**:
   - 用户端路由: `authenticateUser`
   - 管理端路由: `authenticateAdmin` → `requireAdminRole([roles])`

4. **Prisma 关联查询**:
   - 使用 `include` 而非多次查询
   - 注意 N+1 查询问题

5. **JSON 字段**:
   - Prisma schema 中的 JSON 存储为 String
   - 应用层需要手动 `JSON.stringify()` / `JSON.parse()`

6. **文件上传**:
   - 上传目录: `./uploads`
   - 预期使用 Multer + Sharp 处理图片（待实现）

7. **模块化开发**:
   - 项目按模块逐步开发
   - 当前已完成: 基础架构、认证系统、用户服务
   - 待开发: 模版系统、图像生成、支付系统、管理端
