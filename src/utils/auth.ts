import { login as apiLogin, logout as apiLogout, getPermissionInfo, getPublicKey, getUserInfo } from '@/api/login'
import { clearUserBaseInfo } from '@/services/storage'
import { useLocalStorage } from '@vueuse/core'
import { encryptPassword } from './encrypt'

export type Role = 'teacher' | 'student' | 'admin' | 'edu_affairs'
export type User = {
  username: string
  role: Role
  id?: number
  userId?: string
  nickname?: string
  avatar?: string
  email?: string
}

export default function useAuth() {
  // const isAuthed = useLocalStorage<boolean>('isAuthed', false)
  // 删除role存储
  // const role = useLocalStorage<Role>('role', 'teacher')
  const user = useLocalStorage<User | null>('user', null)

  function login(nextRole: Role) {
    // 删除role存储
    // role.value = nextRole
    // isAuthed.value = true
    user.value = { username: nextRole, role: nextRole }
  }

  async function loginWithCredentials(username: string, password: string, tenantId?: string): Promise<Role> {
    try {
      // 1. 获取公钥
      const publicKey = await getPublicKey()

      // 2. 加密密码
      const encryptedPassword = encryptPassword(password, publicKey)

      // 3. 登录（使用加密后的密码）
      const loginRes = await apiLogin({ username, password: encryptedPassword, tenantId })
      const { accessToken, refreshToken, expiresTime, tenantId: resTenantId } = loginRes

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('expiresTime', expiresTime)
      if (resTenantId) localStorage.setItem('tenantId', resTenantId)

      // 4. 获取权限信息
      const permRes = await getPermissionInfo()
      const { user: userInfo, roles, permissions } = permRes

      // 存储权限信息
      localStorage.setItem('roles', JSON.stringify(roles || []))
      localStorage.setItem('permissions', JSON.stringify(permissions))
      localStorage.setItem('userInfo', JSON.stringify(userInfo))

      // 5. 获取用户基本信息
      if (loginRes.userId) {
        const userRes = await getUserInfo()

        if (userRes) {
          // 存储用户基本信息
          localStorage.setItem('userBaseInfo', JSON.stringify(userRes))
          const classInfoList = (userRes as any).classInfoList
          const classId = classInfoList && classInfoList.length > 0 ? classInfoList[0].classId : ''
          localStorage.setItem('wrongClassId', classId)
          localStorage.setItem('levelClassId', classId)
        }
      }

      // 更新状态
      const primaryRole = (roles && roles.length > 0 ? roles[0] : 'teacher') as Role
      // role.value = primaryRole
      // isAuthed.value = true
      user.value = {
        username: userInfo.username,
        role: primaryRole,
        id: userInfo.id,
        userId: userInfo.userId,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        email: userInfo.email,
      }

      return primaryRole
    } catch (e) {
      console.error('Login failed:', e)
      throw e
    }
  }

  async function logout() {
    try {
      await apiLogout()
    } catch (e) {
      console.error('Logout failed:', e)
    } finally {
      // isAuthed.value = false
      user.value = null
      // 删除role存储
      // role.value = 'teacher' // Reset to default
      clearUserBaseInfo()
    }
  }

  return { user, login, loginWithCredentials, logout }
}
