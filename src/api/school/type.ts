/**
 * 学生列表
 */
// 请求体
export interface StudentListRequest {
  classId?: string // 班级ID
  createTime?: string // 创建时间
  creatorId?: number // 创建人ID
  deleted?: boolean // 逻辑删除：0=未删，1=已删
  gradeId?: string // 年级ID
  id?: number // 学生主键ID
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
  schoolId?: string // 学校ID
  studentCode?: string // 学号
  studentId?: string // 学生表唯一业务ID
  studentName?: string // 姓名
  tenantId?: string // 租户唯一ID（分布式ID）
  updaterId?: number // 更新人ID
  updateTime?: string // 更新时间
  userId?: number // 对应用户ID
  version?: boolean // 版本号
}
// 响应体
export interface StudentListResponse {
  list: StudentItem[] // 数据
  total: number // 总量
  totalPage?: number // 总页数
}
export interface StudentItem {
  classId?: string /// 班级ID
  gradeId?: string // 年级ID
  schoolId?: string // 学校ID
  studentCode?: string // 学号
  studentId?: string // 学生表唯一业务ID
  studentName?: string // 姓名
  userId?: number // 对应用户ID
  studentUserId?: string // 学生用户ID
}

export interface StudentListByClassRequest {
  classId: string
  [property: string]: any
}

export interface StudentListByClassItem {
  studentId?: string
  studentCode?: string
  userId?: number
  studentName?: string
  schoolId?: number
  gradeId?: number
  classId?: number
  [property: string]: any
}

export type StudentListByClassResponse = StudentListByClassItem[]

/**
 * 分页查询教师讲解 - POST /api/v1/teacher-explanation/page
 */
export interface TeacherExplanationQuery {
  /** 讲解记录唯一ID */
  explanationId?: string
  /** 讲解名称 */
  explanationName?: string
  /** 页码，从 1 开始 */
  pageNo?: number
  /** 每页条数，最大值为 200 */
  pageSize?: number
  /** 被讲解的题目ID */
  questionId?: string
  /** 备注 */
  remark?: string
  /** 状态 */
  status?: boolean
  /** 教师ID */
  teacherUserId?: string

  [property: string]: any
}

export interface PageResultTeacherExplanationVO {
  list?: TeacherExplanationVO[]
  total?: number
  totalPage?: number
  [property: string]: any
}

export interface TeacherExplanationVO {
  coverAttaId?: string
  coverUrl?: string
  duration?: number
  explanationId?: string
  explanationName?: string
  id?: number
  likeCount?: number
  publishTime?: number
  questionContent?: string
  questionId?: string
  remark?: string
  status?: boolean
  teacherName?: string
  teacherUserId?: string
  tenantId?: string
  videoAttaId?: string
  videoUrl?: string
  viewCount?: number
  [property: string]: any
}
