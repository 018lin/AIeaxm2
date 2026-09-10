# Vercel + TiDB Cloud 部署说明

## 当前项目状态

前端可以部署到 Vercel，`api/[...path].js` 会作为 Vercel Serverless Function 处理 `/api/*` 请求。

线上环境不能使用本机数据库地址，例如 `127.0.0.1:3307`。Vercel 必须连接 TiDB Cloud、云 MySQL 或已有业务后端。

## TiDB Cloud 配置

在 Vercel 的 Project Settings -> Environment Variables 里配置：

```env
VITE_USE_MOCK=false
VITE_API_BASE=
DATABASE_URL=mysql://USER:PASSWORD@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test
DB_POOL_SIZE=1
DB_SSL=true
APP_TOKEN_SECRET=replace-with-a-long-random-secret
```

注意：

- `DATABASE_URL` 里不要使用反斜杠转义 `@`。
- 密码如果包含 `@`、`#`、`/`、`?`、`:` 等 URL 特殊字符，需要先做 URL encode。
- `VITE_API_BASE` 在线上建议留空，让浏览器请求同域 `/api/...`。
- 修改 Vercel 环境变量后，需要重新部署才会生效。

## 初始化数据库

`backend/dev-seed.sql` 默认使用本地库名 `scan_grading_dev`。如果线上连接串使用 `/test`，导入时应把建库和 `USE scan_grading_dev` 去掉，直接导入到 `test` 库。

已验证的测试账号：

```text
账号: 13866666666
密码: Aa123456
```

## Vercel 构建设置

```text
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

## 本地开发

本地开发可以继续使用项目专用 MySQL：

```bash
npm run db:start
npm run server:api
npm run dev
```

或者同时启动数据库和 API：

```bash
npm run dev:api
```

## 已知限制

- 文件上传、扫描机上传、移动端上传等接口仍是占位实现，需要接真实文件服务或对象存储。
- 草稿箱当前是 Serverless 内存 Map，不适合作为线上持久存储。
- 当前测试账号使用明文密码种子数据，生产用户体系应改为哈希密码。
