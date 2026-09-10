# Vercel + 真实业务后端部署说明

## 当前项目状态

前端可以部署到 Vercel，`api/[...path].js` 会作为 Serverless Function 处理 `/api/*` 请求。

默认推荐使用已有业务后端作为真实数据源。本项目 API 层只做同域代理，不再把本地 MySQL seed 库作为线上或默认开发数据源。

## 业务后端代理配置

在 Vercel 的 Project Settings -> Environment Variables 里配置：

```env
VITE_USE_MOCK=false
VITE_API_BASE=
APP_API_PROXY_TARGET=https://your-business-api-host
APP_TOKEN_SECRET=replace-with-a-long-random-secret
```

注意：

- `APP_API_PROXY_TARGET` 必须是真实业务后端根地址。
- 业务后端需兼容当前前端使用的 `/api/v1/...` 路径和 `{ code, data, msg }` 响应格式。
- `VITE_API_BASE` 在线上建议留空，让浏览器请求同域 `/api/...`。
- 修改 Vercel 环境变量后，需要重新部署才会生效。

## Vercel 构建设置

```text
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

## 本地开发

本地开发时启动本项目 API 代理服务和前端：

```bash
npm run dev:api
npm run dev
```

本地 `.env.development.local` 需要配置：

```env
APP_API_PORT=48180
VITE_API_BASE=http://localhost:48180/app
VITE_USE_MOCK=false
APP_API_PROXY_TARGET=https://your-business-api-host
```

如果没有业务后端，才使用直连 MySQL 调试模式，并显式启动本地数据库：

```bash
npm run db:start
npm run server:api
npm run dev
```

直连 MySQL 调试模式需要配置 `DATABASE_URL` 或 `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD`。不要把 `backend/dev-seed.sql` 导入结果作为真实业务数据验证。

## 已知限制

- 文件上传、扫描机上传、移动端上传等接口依赖真实业务后端能力。
- 草稿箱在本项目直连模式下仍是 Serverless 内存 Map，不适合作为线上持久存储。
- 生产用户体系、权限、密码策略应由真实业务后端负责。
