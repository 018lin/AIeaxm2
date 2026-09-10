# 开发流程文档

本文档描述了IPTA项目的完整开发流程，包括环境搭建、开发规范、测试流程和部署指南。

## 目录

1. [开发环境搭建](#开发环境搭建)
2. [项目结构说明](#项目结构说明)
3. [开发规范](#开发规范)
4. [组件开发指南](#组件开发指南)
5. [API开发规范](#api开发规范)
6. [测试流程](#测试流程)
7. [构建与部署](#构建与部署)
8. [调试与问题排查](#调试与问题排查)
9. [代码审查标准](#代码审查标准)

## 开发环境搭建

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐)
- Git >= 2.30.0

### 环境配置

```bash
# 克隆项目
git clone <repository-url>
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 环境变量配置

项目使用不同的环境配置文件：

- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.staging` - 预发布环境

主要配置项：

```bash
# API配置
VITE_API_BASE=http://localhost:48180/app
VITE_USE_MOCK=false
APP_API_PROXY_TARGET=https://your-business-api-host

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# 性能配置
VITE_CACHE_DURATION=300000
VITE_REQUEST_TIMEOUT=10000
```

## 项目结构说明

```
frontend/
├── src/
│   ├── components/          # 组件目录
│   │   ├── common/         # 通用组件
│   │   ├── charts/         # 图表组件
│   │   └── layout/         # 布局组件
│   ├── composables/        # 组合式函数
│   ├── config/            # 配置文件
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数
│   ├── assets/            # 静态资源
│   └── styles/            # 样式文件
├── docs/                  # 项目文档
├── public/               # 公共资源
└── tests/                # 测试文件
```

## 开发规范

### 命名规范

- **组件文件**: PascalCase (如 `UserCard.vue`)
- **组合式函数**: camelCase (如 `useAuth.ts`)
- **工具函数**: camelCase (如 `formatDate.ts`)
- **常量**: UPPER_SNAKE_CASE (如 `API_ENDPOINTS`)

### 代码风格

```typescript
// 组件导入顺序
import { ref, computed } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'

// 本地导入
import { useAuth } from '@/composables/useAuth'
import UIButton from '@/components/common/UIButton.vue'

// Props定义
interface Props {
  title: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})
```

### 组件开发原则

1. **单一职责**: 每个组件只负责一个功能
2. **可复用性**: 提取通用逻辑到组合式函数
3. **类型安全**: 使用TypeScript严格类型检查
4. **响应式设计**: 默认支持移动端和桌面端

## 组件开发指南

### 基础组件结构

```vue
<template>
  <div class="component-name">
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 类型定义
interface Props {
  // props定义
}

// 组件逻辑
const props = defineProps<Props>()
const emit = defineEmits<{
  click: [event: Event]
}>()

// 状态管理
const isLoading = ref(false)

// 计算属性
const componentClasses = computed(() => [
  'base-class',
  {
    'modifier-class': props.someProp
  }
])
</script>

<style scoped>
/* 组件样式 */
</style>
```

### 设计系统使用

项目使用统一的设计系统，主要配置在 `src/config/design-system.ts`：

```typescript
// 间距使用
const spacing = getSpacing(2) // 返回 16px

// 颜色使用
const primaryColor = getColor('primary', '500')

// 密度级别
const density = getDensity() // compact | default | comfortable
```

### 组件测试

```typescript
// 组件测试示例
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UIButton from '@/components/common/UIButton.vue'

describe('UIButton', () => {
  it('renders correctly', () => {
    const wrapper = mount(UIButton, {
      props: { text: 'Click me' }
    })
    expect(wrapper.text()).toContain('Click me')
  })
})
```

## API开发规范

### RESTful API设计

```typescript
// API端点定义
const API_ENDPOINTS = {
  // 用户相关
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
  
  // 设备相关
  DEVICES: '/devices',
  DEVICE_DETAIL: (id: string) => `/devices/${id}`,
  
  // 数据分析
  ANALYTICS: '/analytics',
  ANALYTICS_SUMMARY: '/analytics/summary'
} as const
```

### 请求封装

```typescript
// API请求封装
import { useConfig } from '@/composables/useConfig'

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = useConfig()
  const baseUrl = config.apiBase
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
  
  return response.json()
}
```

### 错误处理

```typescript
// 统一的错误处理
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// 使用示例
try {
  const data = await apiRequest('/users')
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error ${error.status}: ${error.message}`)
  }
}
```

## 测试流程

### 单元测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test UIButton

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

### 集成测试

```bash
# 运行集成测试
pnpm test:integration

# 端到端测试
pnpm test:e2e
```

### Mock测试

```typescript
// Mock服务配置
import { useMockService } from '@/composables/useMockService'

const { registerMockEndpoint } = useMockService()

// 注册Mock端点
registerMockEndpoint({
  method: 'GET',
  path: '/api/users',
  handler: () => ({
    data: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ]
  })
})
```

## 构建与部署

### 构建命令

```bash
# 开发环境构建
pnpm build:dev

# 生产环境构建
pnpm build:prod

# 预览构建结果
pnpm preview
```

### 部署流程

1. **代码审查**: 所有代码必须通过PR审查
2. **自动化测试**: CI/CD流水线运行测试套件
3. **构建打包**: 生成优化后的生产包
4. **部署验证**: 在预发布环境验证功能
5. **生产发布**: 部署到生产环境

### 环境配置

```bash
# 生产环境变量
VITE_API_BASE=
VITE_USE_MOCK=false
APP_API_PROXY_TARGET=https://your-business-api-host
VITE_ENABLE_ANALYTICS=true
VITE_ENVIRONMENT=production
```

## 调试与问题排查

### 开发调试

```typescript
// 开发模式日志
if (import.meta.env.DEV) {
  console.log('[Dev] Component mounted', componentName)
}

// 错误边界
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // 发送错误到监控服务
})
```

### Mock调试

```typescript
// Mock控制面板
import MockControlPanel from '@/components/common/MockControlPanel.vue'

// 在开发环境中启用
const showMockPanel = import.meta.env.DEV && useConfig().useMock
```

### 性能监控

```typescript
// 性能监控
const measurePerformance = (name: string, fn: Function) => {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  
  console.log(`[Performance] ${name}: ${duration}ms`)
  return result
}
```

## 代码审查标准

### 审查清单

- [ ] 代码符合项目规范
- [ ] 组件具有适当的类型定义
- [ ] 测试覆盖率达标
- [ ] 性能优化到位
- [ ] 错误处理完善
- [ ] 文档更新完整

### 性能标准

- 组件首次渲染时间 < 100ms
- 打包大小增长 < 5%
- 内存泄漏检查通过
- Lighthouse评分 > 90

### 安全标准

- 输入验证完整
- XSS防护到位
- 敏感信息加密
- 权限控制正确

## 最佳实践

### 组件优化

```typescript
// 使用计算属性缓存
const expensiveValue = computed(() => {
  return heavyComputation(props.data)
})

// 事件节流
const handleScroll = useThrottle(() => {
  // 滚动处理逻辑
}, 100)
```

### 状态管理

```typescript
// 使用Zustand进行状态管理
import { create } from 'zustand'

const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null })
}))
```

### 代码复用

```typescript
// 提取通用逻辑
export function usePagination<T>(fetchData: (page: number) => Promise<T[]>) {
  const data = ref<T[]>([])
  const currentPage = ref(1)
  const isLoading = ref(false)
  
  const loadMore = async () => {
    isLoading.value = true
    try {
      const newData = await fetchData(currentPage.value)
      data.value.push(...newData)
      currentPage.value++
    } finally {
      isLoading.value = false
    }
  }
  
  return { data, currentPage, isLoading, loadMore }
}
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基础开发流程建立
- 设计系统实现

### v1.1.0 (2024-02-01)
- 新增Mock服务优化
- 增强错误处理机制
- 完善性能监控

---

**注意**: 本文档会随项目发展持续更新，请定期查看最新版本。
