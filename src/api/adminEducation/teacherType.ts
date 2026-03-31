import type { TeachersByClassIdResponse } from '@/api/adminEducation/type'

/**
 * 获取班级教师列表
 */
// 请求体
export interface TeacherPageRequest {
  classId?: string // 班级ID
  gradeId?: string // 年级ID
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
  status?: string // 0=禁用，1=启用
  subjectId?: string // 任教学科ID
  teacherName?: string // 教师姓名
}
// 响应体
export interface TeacherPageResponse {
  list?: TeachersByClassIdResponse[] // 数据
  total?: number // 总量
  totalPage?: number // 总页数
}
