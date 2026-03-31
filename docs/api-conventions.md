# IPTA 前端接口约定文档

## 📋 概述

本文档定义了IPTA前端项目与后端API的接口约定，包括请求格式、响应格式、错误处理、认证机制等规范。

## 🏗️ 基础规范

### 1. 接口地址规范

```
格式: https://api.ipta.com/{version}/{module}/{resource}/{action}
示例: https://api.ipta.com/v1/user/profile/update
```

- **version**: API版本号，当前为 `v1`
- **module**: 业务模块，如 `user`, `course`, `assignment` 等
- **resource**: 资源名称，如 `profile`, `list`, `detail` 等
- **action**: 具体操作，如 `update`, `delete`, `create` 等

### 2. HTTP方法规范

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 获取资源 | GET /v1/user/list |
| POST | 创建资源 | POST /v1/course/create |
| PUT | 更新资源 | PUT /v1/user/profile/update |
| DELETE | 删除资源 | DELETE /v1/assignment/delete |
| PATCH | 部分更新 | PATCH /v1/user/status/update |

## 📤 请求规范

### 1. 请求头规范

```typescript
interface RequestHeaders {
  'Content-Type': 'application/json' | 'multipart/form-data'
  'Authorization': `Bearer ${string}` // JWT Token
  'X-Request-ID': string // 请求唯一标识
  'X-Client-Version': string // 客户端版本
  'Accept-Language': 'zh-CN' | 'en-US' // 语言偏好
}
```

### 2. 请求参数规范

#### GET请求参数
```typescript
// URL参数格式
{
  page: number // 页码，从1开始
  size: number // 每页条数，默认20，最大100
  sort: string // 排序字段，格式：field:asc|desc
  filter: string // 过滤条件，JSON格式
  search: string // 搜索关键字
}

// 示例
GET /v1/user/list?page=1&size=20&sort=createdAt:desc&search=张三
```

#### POST/PUT请求体
```typescript
interface RequestBody {
  // 业务数据
  data: Record<string, any>
  
  // 元数据
  meta?: {
    timestamp: number // 时间戳
    version: string // 数据版本
    [key: string]: any
  }
}
```

## 📥 响应规范

### 1. 统一响应格式

```typescript
interface ApiResponse<T = any> {
  code: number // 状态码
  message: string // 消息
  data: T // 业务数据
  timestamp: number // 时间戳
  requestId: string // 请求ID
  pagination?: PaginationInfo // 分页信息
}

interface PaginationInfo {
  page: number // 当前页
  size: number // 每页条数
  total: number // 总条数
  pages: number // 总页数
  hasNext: boolean // 是否有下一页
  hasPrev: boolean // 是否有上一页
}
```

### 2. 状态码规范

#### 成功状态码
```typescript
const SUCCESS_CODES = {
  OK: 200, // 请求成功
  CREATED: 201, // 创建成功
  ACCEPTED: 202, // 已接受处理
  NO_CONTENT: 204 // 无内容返回
}
```

#### 错误状态码
```typescript
const ERROR_CODES = {
  // 客户端错误
  BAD_REQUEST: 400, // 请求参数错误
  UNAUTHORIZED: 401, // 未认证
  FORBIDDEN: 403, // 无权限
  NOT_FOUND: 404, // 资源不存在
  CONFLICT: 409, // 资源冲突
  UNPROCESSABLE_ENTITY: 422, // 业务逻辑错误
  TOO_MANY_REQUESTS: 429, // 请求过于频繁
  
  // 服务器错误
  INTERNAL_ERROR: 500, // 服务器内部错误
  NOT_IMPLEMENTED: 501, // 功能未实现
  BAD_GATEWAY: 502, // 网关错误
  SERVICE_UNAVAILABLE: 503, // 服务不可用
  
  // 业务错误码（1000-9999）
  BUSINESS_ERROR: {
    USER_NOT_FOUND: 1001, // 用户不存在
    INVALID_PASSWORD: 1002, // 密码错误
    USER_LOCKED: 1003, // 用户被锁定
    TOKEN_EXPIRED: 1004, // Token过期
    PERMISSION_DENIED: 1005, // 权限不足
    DATA_NOT_FOUND: 1006, // 数据不存在
    DATA_VALIDATION_ERROR: 1007, // 数据验证错误
    OPERATION_NOT_ALLOWED: 1008 // 操作不允许
  }
}
```

## 🔐 认证机制

### 1. JWT Token规范

```typescript
interface JWTPayload {
  sub: string // 用户ID
  name: string // 用户名
  role: string // 用户角色
  permissions: string[] // 权限列表
  iat: number // 签发时间
  exp: number // 过期时间
  jti: string // Token ID
}
```

### 2. Token刷新机制

```typescript
interface TokenRefreshRequest {
  refreshToken: string // 刷新令牌
}

interface TokenRefreshResponse {
  accessToken: string // 新的访问令牌
  refreshToken: string // 新的刷新令牌
  expiresIn: number // 过期时间（秒）
}
```

## 📝 错误处理规范

### 1. 错误响应格式

```typescript
interface ErrorResponse {
  code: number // 错误码
  message: string // 错误消息
  details?: ErrorDetail[] // 详细错误信息
  timestamp: number // 时间戳
  requestId: string // 请求ID
  path: string // 请求路径
  method: string // 请求方法
}

interface ErrorDetail {
  field: string // 错误字段
  message: string // 错误描述
  code: string // 错误代码
  value?: any // 错误值
}
```

### 2. 错误消息规范

- **用户友好**：错误消息应该对用户友好，避免技术术语
- **多语言支持**：支持根据语言偏好返回不同语言的错误消息
- **操作指导**：提供明确的操作指导

### 3. 错误处理示例

```typescript
// 400错误示例
{
  code: 400,
  message: "请求参数错误",
  details: [
    {
      field: "email",
      message: "邮箱格式不正确",
      code: "INVALID_FORMAT",
      value: "invalid-email"
    }
  ],
  timestamp: 1640995200000,
  requestId: "req_123456",
  path: "/v1/user/register",
  method: "POST"
}
```

## 📊 数据规范

### 1. 时间格式规范

- **时间戳**：使用Unix时间戳（毫秒）
n- **日期格式**：ISO 8601格式（YYYY-MM-DDTHH:mm:ss.sssZ）
- **时区**：统一使用UTC时间，前端根据用户时区转换

### 2. 枚举值规范

```typescript
// 用户状态枚举
enum UserStatus {
  ACTIVE = 'active', // 正常
  INACTIVE = 'inactive', // 未激活
  LOCKED = 'locked', // 锁定
  DELETED = 'deleted' // 已删除
}

// 课程状态枚举
enum CourseStatus {
  DRAFT = 'draft', // 草稿
  PUBLISHED = 'published', // 已发布
  ARCHIVED = 'archived' // 已归档
}
```

### 3. 数据验证规范

```typescript
interface ValidationRule {
  required?: boolean // 是否必填
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' // 数据类型
  min?: number // 最小长度/值
  max?: number // 最大长度/值
  pattern?: string // 正则表达式
  enum?: any[] // 枚举值
  custom?: (value: any) => boolean | string // 自定义验证
}
```

## 🔍 搜索和过滤规范

### 1. 搜索规范

```typescript
interface SearchRequest {
  keyword: string // 搜索关键字
  fields?: string[] // 搜索字段
  fuzzy?: boolean // 是否模糊搜索
  highlight?: boolean // 是否高亮显示
}
```

### 2. 过滤规范

```typescript
interface FilterRequest {
  field: string // 字段名
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'between' // 操作符
  value: any // 值
  logic?: 'and' | 'or' // 逻辑关系
}
```

### 3. 排序规范

```typescript
interface SortRequest {
  field: string // 排序字段
  order: 'asc' | 'desc' // 排序方式
}
```

## 🔄 版本控制规范

### 1. API版本控制

- **URL版本**：在URL中包含版本号（推荐）
- **Header版本**：通过Accept头指定版本
- **参数版本**：通过请求参数指定版本

### 2. 版本兼容性

- **向后兼容**：新版本保持对旧版本的兼容
- **废弃通知**：提前通知API废弃计划
- **迁移指南**：提供详细的迁移指南

## 📋 接口文档示例

### 用户登录接口

```typescript
/**
 * 用户登录
 * POST /v1/auth/login
 * 
 * @description 用户使用邮箱和密码登录系统
 * @param {LoginRequest} body 登录请求体
 * @returns {LoginResponse} 登录响应
 * @throws {400} 参数错误
 * @throws {401} 认证失败
 * @throws {423} 用户被锁定
 */
interface LoginRequest {
  email: string // 邮箱地址
  password: string // 密码
  rememberMe?: boolean // 记住我
  captcha?: string // 验证码
}

interface LoginResponse {
  user: UserInfo // 用户信息
  tokens: {
    accessToken: string // 访问令牌
    refreshToken: string // 刷新令牌
    expiresIn: number // 过期时间
  }
  permissions: string[] // 权限列表
}
```

### 课程列表接口

```typescript
/**
 * 获取课程列表
 * GET /v1/course/list
 * 
 * @description 获取课程列表，支持分页、搜索、过滤
 * @param {number} page 页码
 * @param {number} size 每页条数
 * @param {string} search 搜索关键字
 * @param {string} category 课程分类
 * @param {string} status 课程状态
 * @returns {CourseListResponse} 课程列表响应
 */
interface CourseListResponse {
  data: CourseInfo[] // 课程列表
  pagination: PaginationInfo // 分页信息
  filters: {
    categories: Category[] // 可用分类
    statuses: Option[] // 可用状态
  }
}
```

## 🛡️ 安全规范

### 1. 数据安全

- **敏感信息加密**：密码、身份证号等敏感信息加密存储
- **数据传输加密**：所有数据传输使用HTTPS
- **输入验证**：严格验证所有用户输入
- **SQL注入防护**：使用参数化查询

### 2. 访问控制

- **RBAC权限模型**：基于角色的访问控制
- **最小权限原则**：只授予必要的权限
- **权限验证**：每次请求都验证权限
- **审计日志**：记录所有重要操作

### 3. 限流规范

```typescript
interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  max: number // 最大请求数
  message: string // 错误消息
  standardHeaders: boolean // 标准头信息
  legacyHeaders: boolean // 传统头信息
}
```

## 📚 相关文档

- [RESTful API设计规范](https://restfulapi.net/)
- [HTTP状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)
- [JWT规范](https://jwt.io/)
- [OpenAPI规范](https://swagger.io/specification/)