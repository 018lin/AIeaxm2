import type { StudentsByClassIdResponse } from '@/api/adminEducation/type'

/**
 * 获取班级学生列表
 */
// 响应体
export interface StudentPageResponse {
  list?: StudentsByClassIdResponse[] // 数据
  total?: number // 总量
  totalPage?: number // 总页数
}
