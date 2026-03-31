import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'

// 性能优化配置
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存
const RETRY_COUNT = 3 // 重试次数
const RETRY_DELAY = 1000 // 重试延迟

// 请求缓存
const requestCache = new Map<string, { data: any; timestamp: number }>()
// 请求去重
const pendingRequests = new Map<string, Promise<any>>()

// const useMock = String(import.meta.env.VITE_USE_MOCK) === 'true'
const baseURL = (import.meta as any).env.VITE_API_BASE || ''
const bareApi = axios.create({ baseURL, timeout: 30000 })
const tenantResolveCache = new Map<string, Promise<string>>()

export async function resolveTenantId(name: string): Promise<string> {
  if (!name) return ''
  const cached = tenantResolveCache.get(name)
  if (cached) return cached
  const p = bareApi
    .get('/system/tenant/get-id-by-name', { params: { name } })
    .then(resp => {
      const id = (resp as any)?.data?.data
      const val = typeof id === 'number' ? String(id) : ''
      if (val) localStorage.setItem('tenant-id', val)
      return val
    })
    .catch(() => '')
  tenantResolveCache.set(name, p)
  return p
}

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
})

// 生成请求缓存键
function generateCacheKey(config: AxiosRequestConfig): string {
  return `${config.method?.toUpperCase()}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`
}

// 检查缓存是否有效
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL
}

// 指数退避重试
async function exponentialBackoffRetry<T>(
  fn: () => Promise<T>,
  retries = RETRY_COUNT,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const axiosError = error as AxiosError
    if (retries > 0 && axiosError.response && axiosError.response.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return exponentialBackoffRetry(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

// 错误处理
function handleError(error: AxiosError): void {
  if (error.response) {
    // 服务器响应错误
    const status = error.response.status
    if (status === 401) {
      // 未授权，清除token并跳转登录
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (status === 403) {
      // 无权限
      console.error('无权限访问')
    } else if (status >= 500) {
      // 服务器错误
      console.error('服务器错误，请稍后重试')
    }
  } else if (error.request) {
    // 网络错误
    console.error('网络连接失败，请检查网络连接')
  } else {
    // 其他错误
    console.error('请求配置错误:', error.message)
  }
}

// 扩展配置类型以支持metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number
  }
}

api.interceptors.request.use(async (config: ExtendedAxiosRequestConfig) => {
  // 添加认证token
  const token = localStorage.getItem('token')
  const tenantId = localStorage.getItem('tenant-id')
  const headers: Record<string, string> = { ...(config.headers || {}) }
  if (!headers.Authorization && token) headers.Authorization = `Bearer ${token}`
  const isTenantResolveUrl = typeof config.url === 'string' && config.url.includes('/system/tenant/get-id-by-name')
  if (!isTenantResolveUrl) {
    let currentTenant = headers['tenant-id'] as string | undefined
    if (!currentTenant) currentTenant = tenantId || undefined
    if (currentTenant) {
      if (/^\d+$/.test(currentTenant)) {
        headers['tenant-id'] = currentTenant
      } else {
        const numeric = await resolveTenantId(currentTenant)
        headers['tenant-id'] = numeric || encodeURIComponent(currentTenant)
      }
    }
  }
  Object.assign(config.headers, headers)

  // 性能监控
  config.metadata = { startTime: Date.now() }

  return config
})

api.interceptors.response.use(
  response => {
    // 性能监控
    const extendedConfig = response.config as ExtendedAxiosRequestConfig
    if (extendedConfig.metadata) {
      const duration = Date.now() - extendedConfig.metadata.startTime
      if (duration > 1000) {
        console.warn(`慢请求警告: ${response.config.url} 耗时 ${duration}ms`)
      }
    }

    return response
  },
  (error: AxiosError) => {
    handleError(error)
    return Promise.reject(error)
  }
)

// 增强的HTTP方法
export async function httpGet<T = any>(url: string, config?: AxiosRequestConfig & { cache?: boolean }): Promise<T> {
  const cacheKey = generateCacheKey({ method: 'GET', url, ...config })

  // 检查缓存
  if (config?.cache && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)!
    if (isCacheValid(cached.timestamp)) {
      return cached.data
    }
  }

  // 检查重复请求
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!
  }

  const request = exponentialBackoffRetry(async () => {
    const response = await api.get<T>(url, config)

    // 缓存结果
    if (config?.cache) {
      requestCache.set(cacheKey, { data: response.data, timestamp: Date.now() })
    }

    return response.data
  })

  pendingRequests.set(cacheKey, request)

  try {
    const result = await request
    return result
  } finally {
    pendingRequests.delete(cacheKey)
  }
}

export async function httpPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return exponentialBackoffRetry(async () => {
    const response = await api.post<T>(url, data, config)
    return response.data
  })
}

export async function httpPut<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return exponentialBackoffRetry(async () => {
    const response = await api.put<T>(url, data, config)
    return response.data
  })
}

export async function httpDelete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return exponentialBackoffRetry(async () => {
    const response = await api.delete<T>(url, config)
    return response.data
  })
}

// 清除缓存
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key)
      }
    }
  } else {
    requestCache.clear()
  }
}

// 获取缓存统计
export function getCacheStats(): { size: number; hitRate: number } {
  return {
    size: requestCache.size,
    hitRate: 0, // 可以扩展实现命中率统计
  }
}

export async function withMock<T>(
  // realCall: () => Promise<T>,
  mockCall: (() => Promise<T>) | (() => T) | T
): Promise<T> {
  // if (useMock) {
  if (typeof mockCall === 'function') {
    const res = (mockCall as any)()
    return res instanceof Promise ? await res : (res as T)
  }
  return mockCall as T
  // }
  // return realCall()
}
