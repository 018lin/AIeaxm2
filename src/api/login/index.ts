import { requestGet, requestPost } from '@/api/index'
import type {
  LoginRequest,
  LoginResponse,
  PermissionInfoResponse,
  ResetPasswordRequest,
  UserInfoResponse,
} from './type'

// 获取公钥
export function getPublicKey() {
  return requestGet<string>('/oauth/public-key')
}

// 用户登录
export function login(params: LoginRequest) {
  return requestPost<LoginResponse, LoginRequest>('/api/v1/oauth/login', params)
}

// 刷新令牌
export function refreshToken(refreshToken: string) {
  return requestPost<LoginResponse, null>('/api/v1/oauth/refresh-token', null, {
    params: { refreshToken },
  })
}

// 登出
export function logout() {
  return requestPost<boolean, null>('/api/v1/oauth/logout', null)
}

// 重置密码
export function resetPassword(params: ResetPasswordRequest) {
  return requestPost<boolean, ResetPasswordRequest>('/api/v1/oauth/reset-password', params)
}

// 获取用户权限信息
export function getPermissionInfo() {
  return requestGet<PermissionInfoResponse>('/api/v1/oauth/get-permission-info')
}

// 获取用户信息
export function getUserInfo() {
  return requestGet<UserInfoResponse>('/api/v1/teacher/teacher-info')
}
