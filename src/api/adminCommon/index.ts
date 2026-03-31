import { requestGet, requestPost } from '@/api/index'

// 修改用户状态
export const updateUserStatus = async (params: { userId: string; status: string }) => {
  return await requestPost<boolean>('/api/v1/system-user/update-status', params)
}

// 获取随机可用用户名
export const getRandomUsername = async () => {
  return await requestGet<string>('/api/v1/system-user/random-username')
}

// 重置用户密码
export const resetUserPassword = async (params: { userId: string }) => {
  return await requestPost('/api/v1/system-user/reset-password', params)
}
