// 从 localStorage 获取用户基本信息
export const getUserBaseInfo = () => {
  try {
    const userBaseInfo = localStorage.getItem('userBaseInfo')
    return userBaseInfo ? JSON.parse(userBaseInfo) : null
  } catch (error) {
    console.error('解析 userBaseInfo 失败:', error)
    return null
  }
}

// clearUserBaseInfo 清除用户基本信息
export const clearUserBaseInfo = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userBaseInfo')
  localStorage.removeItem('permissions')
  localStorage.removeItem('user')
  localStorage.removeItem('levelClassId')
  localStorage.removeItem('role')
  localStorage.removeItem('roles')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('wrongClassId')
  localStorage.removeItem('expiresTime')
  localStorage.removeItem('isAuthed')
  localStorage.removeItem('tenantId')
}
