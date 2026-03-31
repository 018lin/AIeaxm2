import { del, get, post, put } from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'

/**
 * GET 请求：入参作为 query 参数
 */
export function requestGet<T = any, P extends object = any>(
  url: string,
  params?: P,
  config?: AxiosRequestConfig
): Promise<T> {
  const mergedConfig: AxiosRequestConfig = {
    ...(config || {}),
    params,
  }
  return get<T>(url, mergedConfig)
}

/**
 * POST 请求：入参作为 params application/json格式
 */
export function requestPost<T = any, B = any>(url: string, params?: B, config?: AxiosRequestConfig): Promise<T> {
  return post<T>(url, params, config)
}

/**
 * POST 请求：入参作为 params multipart/form-data格式
 */
export function requestPostForm<T = any, B = any>(url: string, params?: B, config?: AxiosRequestConfig): Promise<T> {
  // 将参数转换为 FormData 格式
  const formData = new FormData()

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // 处理文件类型
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value)
        }
        // 处理数组
        else if (Array.isArray(value)) {
          value.forEach(item => {
            formData.append(key, item)
          })
        }
        // 处理对象（转为 JSON 字符串）
        else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        }
        // 处理基本类型
        else {
          formData.append(key, String(value))
        }
      }
    })
  }

  // 合并配置，确保使用 multipart/form-data
  const mergedConfig: AxiosRequestConfig = {
    ...(config || {}),
    headers: {
      ...(config?.headers || {}),
      'Content-Type': 'multipart/form-data',
    },
  }

  return post<T>(url, formData, mergedConfig)
}

/**
 * PUT 请求：入参作为 params
 */
export function requestPut<T = any, B = any>(url: string, params?: B, config?: AxiosRequestConfig): Promise<T> {
  return put<T>(url, params, config)
}

/**
 * 下载文件：返回 Blob 类型，用于文件下载
 */
export function requestDownload(url: string, params?: object, config?: AxiosRequestConfig): Promise<Blob> {
  const mergedConfig: AxiosRequestConfig = {
    ...(config || {}),
    params,
    responseType: 'blob',
  }
  return get<Blob>(url, mergedConfig)
}

/**
 * DELETE 请求：入参作为 params 参数
 */
export function requestDel<T = any, P extends object = any>(
  url: string,
  params?: P,
  config?: AxiosRequestConfig
): Promise<T> {
  const mergedConfig: AxiosRequestConfig = {
    ...(config || {}),
    params,
  }
  return del<T>(url, mergedConfig)
}
