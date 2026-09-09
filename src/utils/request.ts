import { clearUserBaseInfo } from '@/services/storage'
import { message } from 'ant-design-vue'
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

// 基础配置
const configuredBaseURL: string = (import.meta as any).env.VITE_API_BASE || ''
const baseURL: string =
  (import.meta as any).env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i.test(configuredBaseURL)
    ? ''
    : configuredBaseURL

/**
 * 创建 axios 实例
 */
const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 60000,
  withCredentials: false,
})

/**
 * 请求拦截
 *  - 自动携带 token
 *  - 自动携带 tenant-id
 *  - 检查 token 是否过期，若过期则尝试刷新
 */
service.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const headers: Record<string, string> = { ...(config.headers as any) }

    let token = localStorage.getItem('accessToken')
    let expiresTime = localStorage.getItem('expiresTime')

    // 定时刷新 + 401拦截
    // 检查 Token 是否即将过期 (提前 5 分钟)
    if (token && expiresTime) {
      const now = Date.now()
      const exp = new Date(expiresTime).getTime()
      if (now >= exp - 5 * 60 * 1000) {
        try {
          // 尝试刷新 Token
          console.log('Token expired, trying to refresh...')
          token = await handleTokenRefresh()
        } catch (e) {
          console.warn('Token refresh failed during request interceptor:', e)
          // 刷新失败，可能是 refresh token 也过期了，此时不阻断请求，让 401 拦截器或后端处理
        }
      }
    }

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`
    }

    const tenantId = localStorage.getItem('tenantId')
    if (tenantId && !headers['tenant-id']) {
      headers['tenant-id'] = tenantId
    }

    config.headers = headers as any
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let requests: Function[] = []

/**
 * 刷新令牌处理函数
 * 封装了刷新令牌的逻辑，包含并发控制（通过 isRefreshing 和 requests 队列）
 */
async function handleTokenRefresh(): Promise<string> {
  if (isRefreshing) {
    // 如果正在刷新，则将当前请求挂起，放入队列等待刷新完成
    return new Promise(resolve => {
      requests.push((token: string) => resolve(token))
    })
  }

  isRefreshing = true
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    // 使用 axios 原生实例请求，避免走拦截器造成死循环
    const { data } = await axios.post(baseURL + '/api/v1/auth/refresh-token', null, {
      params: { refreshToken },
    })

    if (data.code === 0) {
      const { accessToken, refreshToken: newRefreshToken, expiresTime, tenantId } = data.data

      // 更新本地存储
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      localStorage.setItem('expiresTime', expiresTime)
      if (tenantId) localStorage.setItem('tenantId', tenantId)

      // 唤醒所有等待的请求
      requests.forEach(cb => cb(accessToken))
      requests = []

      return accessToken
    } else {
      throw new Error(data.msg || 'Refresh failed')
    }
  } catch (error) {
    // 刷新失败，清空状态并跳转登录
    clearUserBaseInfo()
    // 避免重复跳转
    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login'
    }
    throw error
  } finally {
    isRefreshing = false
  }
}

/**
 * 响应拦截
 *  - 统一处理 HTTP 错误
 *  - 自动展开 data 字段
 *  - 处理 401 自动刷新令牌
 */
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果响应类型是 blob（文件下载），直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response.data
    }

    // 按约定后端一般返回 { code, data, msg | message }
    const res = response.data as { code?: number; data?: any; msg?: string; message?: string }

    // 如果包含业务 code，则进行统一处理
    if (typeof res?.code === 'number') {
      if (res.code === 0) {
        // 业务成功，直接返回真正的数据部分
        return res.data
      }
      if (res.code === 401) {
        // 未登录或登录过期
        localStorage.removeItem('token')
        localStorage.removeItem('refresh-token')
        // 可以按需跳转登录页
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login'
        }
        return
      }

      // 业务失败，根据 code 提示 message
      const msg = res.message || res.msg || '请求失败，请稍后重试'
      message.error(msg)
      return Promise.reject(new Error(msg))
    }

    // 非约定格式，直接透传
    return res
  },
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      // 处理 401 未授权情况（Token 过期）
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          const token = await handleTokenRefresh()
          originalRequest.headers.Authorization = `Bearer ${token}`
          return service(originalRequest)
        } catch (refreshError) {
          return Promise.reject(refreshError)
        }
      }

      if (status >= 500) {
        // 服务器错误
        console.error('服务器异常，请稍后重试')
      }
    } else if (error.request) {
      console.error('网络异常，请检查网络连接')
    } else {
      console.error('请求配置异常：', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * 通用 request 方法
 */
export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service.request<any, T>(config)
}

export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.get<any, T>(url, config)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.post<any, T>(url, data, config)
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.put<any, T>(url, data, config)
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.delete<any, T>(url, config)
}

export default service
