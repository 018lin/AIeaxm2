import { requestGet } from '@/api/index'
import type { HomeworkRecentVO, QuestionCountVO, StudentOverviewVO, TeacherOverviewVO } from './type'

/**
 * 教师首页数据获取
 */
export function getTeacherOverview() {
  return requestGet<TeacherOverviewVO>('/api/v1/teacher/overview')
}

export function getStudentOverview() {
  return requestGet<StudentOverviewVO[]>('/api/v1/student/overview')
}

export function getQuestionStatistics() {
  return requestGet<QuestionCountVO>('/api/v1/question/statistics')
}

export function getRecentHomework() {
  return requestGet<HomeworkRecentVO[]>('/api/v1/student/homework/recent-list')
}
