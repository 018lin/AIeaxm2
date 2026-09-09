export interface ResetPasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface ForgotPasswordRequest {
  account: string
}

// 登录接口请求体
export interface LoginRequest {
  password: string // 密码
  username: string // 用户名
  tenantId?: string // 租户ID
  socialType?: number // 社交登录类型
  socialCode?: string // 社交授权码
  socialState?: string // 社交状态
}

// 登录接口返回体
export interface LoginResponse {
  userId: string
  accessToken: string
  refreshToken: string
  tenantId: string
  expiresTime: string // LocalDateTime string
}

export interface UserInfo {
  id: number
  userId: string
  nickname: string
  avatar: string
  deptId: number
  username: string
  email: string
}

export interface PermissionInfoResponse {
  user: UserInfo
  roles: string[]
  permissions: string[]
}

export interface UserInfoResponse {
  classId?: number // 班级ID
  gradeId?: number // 年级ID
  id?: number // 教师主键ID
  schoolId?: number // 学校ID
  subjectId?: string // 任教学科
  teacherId?: string // 教师唯一业务ID
  teacherName?: string // 教师姓名
  userId?: number // 用户主键ID
  useDefaultPwd?: boolean // 是否使用默认密码（true 时需强制修改）
}
