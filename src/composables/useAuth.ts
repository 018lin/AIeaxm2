import { httpGet, httpPost, resolveTenantId } from '@/services/api'
import { clearUserBaseInfo } from '@/services/storage'
import { useLocalStorage } from '@vueuse/core'

export type Role = 'teacher' | 'student' | 'admin' | 'edu_affairs'
export type User = { username: string; role: Role }

export default function useAuth() {
  // const isAuthed = useLocalStorage<boolean>('isAuthed', false)
  // const role = useLocalStorage<Role>('role', 'teacher')
  const user = useLocalStorage<User | null>('user', null)

  function login(_nextRole: Role) {
    throw new Error('已禁用本地模拟登录，请使用 loginWithCredentials 调用真实认证接口')
  }

  async function loginWithCredentials(username: string, password: string): Promise<Role> {
    const client = 'xuebangbang'
    const basic = btoa(`${client}:${client}`)
    const scope = 'user.read user.write'
    let tenantId = localStorage.getItem('tenant-id') || ''
    if (!tenantId || !/^\d+$/.test(tenantId)) {
      const name = tenantId || ''
      if (name) {
        const id = await resolveTenantId(name)
        tenantId = id || ''
      }
    }
    const body = new URLSearchParams({ grant_type: 'password', username, password, scope })
    try {
      const res = await httpPost<any>('/system/oauth2/token', body, {
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'tenant-id': tenantId,
        },
      })
      const payload = res && typeof res === 'object' && 'data' in res ? (res as any).data : res
      const access = payload?.access_token || payload?.accessToken
      const refresh = payload?.refresh_token || payload?.refreshToken
      if (!access) throw new Error('令牌获取失败')
      localStorage.setItem('token', access)
      if (refresh) localStorage.setItem('refresh-token', refresh)

      const userInfoRes = await httpGet<any>('/system/oauth2/user/get')
      const userPayload =
        userInfoRes && typeof userInfoRes === 'object' && 'data' in userInfoRes
          ? (userInfoRes as any).data
          : userInfoRes
      const backendRole = (userPayload?.role || '').trim() as Role
      const nextRole: Role = backendRole || 'teacher'
      // role.value = nextRole
      // isAuthed.value = true
      user.value = { username, role: nextRole }
      return nextRole
    } catch (e) {
      throw e
    }
  }

  function logout() {
    // 先重置响应式状态，避免自动重新写入 localStorage
    // isAuthed.value = false
    // role.value = 'teacher' // 重置为默认角色
    user.value = null
    // 然后清除本地存储的所有用户信息
    clearUserBaseInfo()
  }
  //return { isAuthed, role, user, login, loginWithCredentials, logout }
  return { user, login, loginWithCredentials, logout }
}
