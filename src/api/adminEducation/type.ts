/**
 * 获得班级分页列表
 */
// 请求体
export interface ClassPageRequest {
  classId?: string // 班级ID
  className?: string // 班级名称
  gradeId?: string // 年级ID
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
}
// 响应体
export interface ClassPageResponse {
  list?: ClassVO[] // 数据列表
  total?: number // 数据总量
  totalPage?: number // 总页数
}
// 班级信息VO
export interface ClassVO {
  classId?: string // 班级唯一业务ID
  className?: string //
  id?: number // 主键ID
  sort?: number // 排序
  status?: boolean // 状态：0=禁用，1=启用
  studentCount?: string // 学生人数
  teacherCount?: string // 教师人数
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
}

/**
 * 创建/修改班级
 */
// 请求体
export interface CreateClassRequest {
  className?: string // 班级名称
  gradeId?: string // 年级ID
}

/**
 * 获取班级学生列表
 */
// 响应体
export interface StudentsByClassIdResponse {
  classId?: string // 班级ID
  className?: string // 班级名称
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
  password?: string // 密码
  schoolId?: string // 学校ID
  sex?: string // 性别
  status?: string // 账号状态
  studentCode?: string // 学号
  studentId?: string // 学生唯一业务ID
  studentName?: string // 姓名
  studentUserId?: string // 对应用户ID
  userName?: string // 用户名
}

/**
 * 获取班级教师列表
 */
// 响应体
export interface TeachersByClassIdResponse {
  classGroupList?: TeacherGroupVO[]
  classInfoList?: ClassInfoVO[]
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
  id?: number // 主键ID
  phoneNumber?: string // 手机号
  schoolId?: string // 学校ID
  sex?: string // 性别
  stageId?: string // 学段
  status?: string // 账号状态
  subjectId?: string // 任教学科
  subjectName?: string
  teacherId?: string // 教师唯一业务ID
  teacherName?: string // 教师姓名
  userId?: string // 对应用户ID
  userName?: string // 用户名
}
// 教师
export interface TeacherGroupVO {
  classGroupVOList?: ClassGroupVO[]
  classId?: string // 班级
}
// 班级分组
export interface ClassGroupVO {
  groupId?: string // 分组唯一 ID
  groupName?: string // 分组名称
}
// 学生
export interface ClassInfoVO {
  classId?: string
  className?: string
}
