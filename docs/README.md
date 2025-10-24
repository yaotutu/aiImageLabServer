# 📚 项目文档索引

本文件夹包含 AI 图像生成平台后端的所有技术文档。

## 📖 文档列表

### 开发指南

#### [CLAUDE.md](./CLAUDE.md)
**Claude Code 开发指南** - 为 AI 助手提供的项目开发指引

- 项目概述和架构说明
- 常用开发命令
- 双认证系统（用户端 + 管理端）
- Prisma ORM 数据库设计
- TypeScript 严格模式配置
- 开发注意事项

**适用对象**: 使用 Claude Code 进行开发的开发者

---

### API 文档

#### [SCALAR_API_测试指南.md](./SCALAR_API_测试指南.md)
**Scalar API 完整流程测试指南** - 通过 Scalar 界面测试所有 API 的详细步骤

- 🔐 JWT 认证方式说明
- 🌐 Scalar 界面使用教程
- 🧪 13 个步骤的完整测试流程
- ✅ 16 个 API 接口全覆盖
- 🔍 常见问题排查

**适用对象**: 前端开发者、测试人员、产品经理

**访问地址**: http://localhost:8000/api-docs

---

#### [API_USAGE_EXAMPLES.md](./API_USAGE_EXAMPLES.md)
**前端调用示例** - JavaScript/TypeScript API 调用代码示例

- 基础配置和请求封装
- 所有 API 接口的调用示例
- React Hooks 封装示例
- Vue Composable 封装示例
- 完整用户流程示例
- 错误处理最佳实践

**适用对象**: 前端开发者

---

#### [API_DOCS_GUIDE.md](./API_DOCS_GUIDE.md)
**API 文档生成指南** - 如何为新接口添加 API 文档

- Scalar 与 Swagger 的配置
- API 装饰器使用说明
- OpenAPI 规范说明
- 最佳实践和注意事项

**适用对象**: 后端开发者

---

### 模块文档

#### [generation-api.md](./generation-api.md)
**图像生成 API 文档** - AI 图像生成相关接口说明

- 证件照生成接口
- 形象照生成接口
- 生成记录管理
- AI 服务适配器

**适用对象**: 后端开发者、AI 工程师

---

#### [MODULE2_DATABASE_COMPLETION.md](./MODULE2_DATABASE_COMPLETION.md)
**数据库模块完成报告** - 数据库设计和实现的详细记录

- Prisma Schema 设计
- 数据模型说明
- 种子数据初始化
- 数据库迁移指南

**适用对象**: 后端开发者、数据库管理员

---

## 🚀 快速开始

### 新手入门
1. 阅读 [CLAUDE.md](./CLAUDE.md) 了解项目架构
2. 运行 `npm run dev` 启动服务器
3. 访问 http://localhost:8000/api-docs 查看 API 文档
4. 按照 [SCALAR_API_测试指南.md](./SCALAR_API_测试指南.md) 测试接口

### 前端集成
1. 阅读 [SCALAR_API_测试指南.md](./SCALAR_API_测试指南.md) 了解认证方式
2. 参考 [API_USAGE_EXAMPLES.md](./API_USAGE_EXAMPLES.md) 调用 API
3. 复制示例代码到前端项目

### 后端开发
1. 阅读 [CLAUDE.md](./CLAUDE.md) 了解架构规范
2. 参考 [API_DOCS_GUIDE.md](./API_DOCS_GUIDE.md) 添加 API 文档
3. 查看 [MODULE2_DATABASE_COMPLETION.md](./MODULE2_DATABASE_COMPLETION.md) 了解数据库设计

---

## 📂 文档结构

```
docs/
├── README.md                      # 本文件 - 文档索引
├── CLAUDE.md                      # 开发指南（Claude Code）
├── SCALAR_API_测试指南.md          # Scalar API 测试教程
├── API_USAGE_EXAMPLES.md          # 前端调用示例
├── API_DOCS_GUIDE.md              # API 文档生成指南
├── generation-api.md              # 图像生成 API 文档
└── MODULE2_DATABASE_COMPLETION.md # 数据库模块报告
```

---

## 🔗 相关资源

### 在线文档
- **Scalar API 文档**: http://localhost:8000/api-docs
- **OpenAPI 规范**: https://swagger.io/specification/

### 技术栈
- **NestJS**: https://docs.nestjs.com/
- **Prisma**: https://www.prisma.io/docs/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **JWT**: https://jwt.io/

### 工具
- **Scalar**: https://github.com/scalar/scalar
- **Postman**: 可导入 OpenAPI 规范进行测试

---

## 📝 文档维护

### 更新文档
当添加新功能时，请记得更新相应的文档：

- **新增 API 接口**: 更新 `API_USAGE_EXAMPLES.md` 和 `SCALAR_API_测试指南.md`
- **数据库变更**: 更新 `MODULE2_DATABASE_COMPLETION.md`
- **架构调整**: 更新 `CLAUDE.md`

### 文档规范
- 使用 Markdown 格式
- 添加清晰的标题和目录
- 提供代码示例
- 及时更新过时内容

---

## 🤝 贡献指南

如果你发现文档有任何问题或需要改进：

1. 直接修改对应的文档文件
2. 确保示例代码可运行
3. 更新本索引文件（如有需要）

---

**最后更新**: 2025-10-23
