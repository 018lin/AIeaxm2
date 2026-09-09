import { requestGet } from '@/api/index'
import type { StudentRow } from '@/types/mistakes/list'

export function getMistakeStudentStatistics() {
  return requestGet<StudentRow[]>('/api/v1/mistakes/student-statistics')
}

export interface MistakeDetailQuestion {
  id: string
  no: string
  status: 'pending' | 'correct' | 'wrong'
  content: string
  studentAnswer?: string
  correctAnswer?: string
  analysis?: string
  time?: string
}

export interface MistakeDetailResponse {
  dates?: { label: string; value: string }[]
  questions?: MistakeDetailQuestion[]
}

export function getMistakeDetail(params: { studentId?: string; date?: string }) {
  return requestGet<MistakeDetailResponse, { studentId?: string; date?: string }>('/api/v1/mistakes/detail', params)
}
