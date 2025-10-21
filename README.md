# AI图像生成后端服务 (aiImageLabServer)

一个功能完整的AI图像生成后端服务，支持模版广场、证件照生成、形象照生成，包含完整的管理端和支付系统。

## 🎯 功能特性

### 用户端功能
- 🔐 多种登录方式（微信登录、邮箱登录）
- 🎨 模版广场（预设AI图像模版）
- 📸 AI证件照生成（多种尺寸规格）
- 👤 AI形象照生成（多种风格）
- 📜 生成历史记录
- 💳 积分系统（充值、消费、广告奖励）

### 管理端功能
- 👨‍💼 管理员权限系统
- 📋 模版管理（增删改查）
- 👥 用户管理
- 📊 系统监控和统计
- ⚙️ 系统配置管理

## 🛠️ 技术栈

- **后端框架**: Express.js + TypeScript
- **数据库**: SQLite + Prisma ORM
- **认证**: JWT (用户端) + Session (管理端)
- **文件处理**: Multer + Sharp
- **架构模式**: 适配器模式 (AI服务)

## 📦 快速开始

### 1. 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（修改JWT_SECRET等关键配置）
nano .env
```

### 4. 数据库初始化
```bash
# 生成Prisma客户端
npm run prisma:generate

# 推送数据库结构
npm run prisma:push

# 初始化基础数据
npm run prisma:seed
```

### 5. 启动开发服务器
```bash
npm run dev
```

服务启动后访问: http://localhost:3000

## 📁 项目结构

```
aiImageLabServer/
├── src/
│   ├── controllers/          # 控制器层
│   │   └── admin/           # 管理端控制器
│   ├── services/            # 业务逻辑层
│   │   ├── ai-adapters/    # AI服务适配器
│   │   └── utils/          # 工具类
│   ├── middleware/          # 中间件
│   ├── routes/              # 路由定义
│   │   └── admin/          # 管理端路由
│   ├── config/              # 配置文件
│   └── models/              # 数据模型
├── prisma/                  # 数据库相关
│   ├── schema.prisma       # 数据模型定义
│   └── seed.ts             # 初始化数据
├── uploads/                 # 文件上传目录
├── tests/                   # 测试文件
└── docs/                    # 文档
```

## 🔗 API接口

### 基础接口
- `GET /health` - 健康检查
- `GET /api` - API信息

### 用户认证
- `POST /api/auth/wechat-login` - 微信登录
- `POST /api/auth/email-login` - 邮箱登录
- `POST /api/auth/register` - 邮箱注册
- `GET /api/auth/profile` - 获取用户信息

### 模版相关
- `GET /api/templates` - 模版列表
- `GET /api/templates/:id` - 模版详情

### 图像生成
- `POST /api/id-photo/generate` - 生成证件照
- `POST /api/portrait/generate` - 生成形象照
- `GET /api/generations` - 生成历史

### 支付系统
- `POST /api/orders` - 创建订单
- `POST /api/ads/reward` - 广告奖励

### 管理端
- `POST /admin/auth/login` - 管理员登录
- `GET /admin/templates` - 模版管理
- `GET /admin/users` - 用户管理
- `GET /admin/stats` - 系统统计

## 📊 数据库结构

主要数据表：
- `users` - 用户信息
- `admins` - 管理员信息
- `templates` - 模版信息
- `generations` - 生成记录
- `orders` - 订单信息
- `system_configs` - 系统配置

## 🚀 开发指南

### 模块化开发
项目采用模块化开发模式，每个模块独立开发和验证：

1. **模块1**: 项目基础架构 ✅
2. **模块2**: 数据库层实现
3. **模块3**: 认证授权系统
4. **模块4**: 文件上传和图片处理
5. **模块5**: AI服务适配器架构
6. **模块6**: 模版管理系统
7. **模块7**: 图像生成核心功能
8. **模块8**: 支付系统集成
9. **模块9**: 管理端完整功能

### 代码规范
- 使用TypeScript严格模式
- 统一的错误处理机制
- 完整的输入验证
- 规范的代码注释

### 测试
```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 🔧 配置说明

### 环境变量
- `JWT_SECRET` - JWT密钥（必需）
- `SESSION_SECRET` - Session密钥（必需）
- `DATABASE_URL` - 数据库连接字符串
- `NODE_ENV` - 运行环境

### AI服务配置
支持多种AI服务的适配器模式，可以轻松切换不同的AI厂商。

## 📝 开发日志

- [x] 模块1: 项目基础架构搭建完成
- [ ] 模块2: 数据库层实现
- [ ] 模块3: 认证授权系统
- [ ] ...

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。