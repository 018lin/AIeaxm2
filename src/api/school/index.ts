import { requestPost } from '@/api/index'
import type {
  PageResultTeacherExplanationVO,
  StudentItem,
  StudentListRequest,
  StudentListResponse,
  TeacherExplanationQuery,
} from './type'

// 学生列表-分页
export function getStudentList(params: StudentListRequest) {
  return requestPost<StudentListResponse, StudentListRequest>('/api/v1/student/page', params)
}

// 分页查询教师讲解
export function getTeacherExplanationPage(params: TeacherExplanationQuery) {
  return requestPost<PageResultTeacherExplanationVO, TeacherExplanationQuery>(
    '/api/v1/teacher-explanation/page',
    params
  )
}
// 学生列表-全部
export function getStudentListAll(params: StudentListRequest) {
  return requestPost<StudentItem[], StudentListRequest>('/api/v1/student/list', params)
}
