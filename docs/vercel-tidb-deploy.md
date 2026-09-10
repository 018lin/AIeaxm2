# Vercel + 真实业务后端部署说明

## 当前项目状态

前端可以部署到 Vercel，`api/[...path].js` 会作为 Serverless Function 处理 `/api/*` 请求。

默认推荐使用已有业务后端作为真实数据源。本项目 API 层只做同域代理，不再把本地 MySQL seed 库作为线上或默认开发数据源。

如果暂时没有可用业务后端，也可以在生产环境配置 MySQL/TiDB 连接；本项目 API 层会直接处理登录、题库查询，以及 `importFormat=examcoo_json` 的 JSON 题库导入和 `importFormat=image_pairs` 的图片题库导入。

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

## 题库导入

题库管理的“录入题目”支持 `图片` 和 `JSON题库` 上传方式，前端会向 `/api/v1/question-bank-batch/import` 提交 `multipart/form-data`。

JSON 题库导入：

```text
importFormat=examcoo_json
stageId / gradeId / subjectId / questionBankTypeId / textbookVersionId / volume
files=1 个 Examcoo JSON 文件 + JSON 引用的图片文件
```

图片题库导入：

```text
importFormat=image_pairs
stageId / gradeId / subjectId / questionBankTypeId / textbookVersionId / volume
questionFiles=多张 jpg/jpeg/png 题目图片
answerFiles=多张 jpg/jpeg/png 答案图片，按顺序与题目图片配对，可少于题目图片
```

线上有两种可用模式：

- 配置 `APP_API_PROXY_TARGET`：请求会原样代理到真实业务后端，由业务后端按上述契约解析入库。
- 不配置 `APP_API_PROXY_TARGET`，但配置 `DATABASE_URL` 或 `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD`：本项目 API 会解析 Examcoo JSON 或图片题库，写入 `homework_questions` 和 `homework_question_import_meta`。

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

- PDF 切题解析、OCR、单图多题识别、扫描机上传、移动端上传等接口依赖真实业务后端能力。
- Examcoo JSON 题库导入可由本项目 API 直接写入数据库；JSON 引用图片会以内联 data URL 形式保存到题干 HTML 中。
- 图片题库导入按“一张题目图片一道题”入库；题目图片保存到 `stem_html`，答案图片保存到 `answer_html`，缺少答案图片的题目仍会入库。
- 草稿箱在本项目直连模式下仍是 Serverless 内存 Map，不适合作为线上持久存储。
- 生产用户体系、权限、密码策略应由真实业务后端负责。
