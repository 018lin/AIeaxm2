# 配置系统说明

当前应用默认关闭本地演示数据，页面数据应来自真实接口或真实数据库。

## 真实数据接入

优先使用已有业务后端：

```env
APP_API_PROXY_TARGET=https://your-api-host
VITE_USE_MOCK=false
```

没有业务后端时，可使用本地 API 直连 MySQL：

```env
DATABASE_URL=mysql://user:password@host:3306/database
VITE_USE_MOCK=false
```

也可以拆分配置：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ipta
DB_USER=ipta
DB_PASSWORD=your-password
```

## 开发约束

- 不在页面组件中新增硬编码业务数据。
- 不新增登录、仪表盘、作业、错题、作文、教师等业务场景的本地假数据兜底。
- 接口尚未接入时返回明确错误或空状态，由调用方展示失败状态。
- `src/config/mock/` 仅保留为历史参考，不能作为默认运行时数据源。
