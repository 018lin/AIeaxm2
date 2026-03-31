import { requestGet, requestPost } from '@/api/index'
import type {
  ClassReportQueryReqVO,
  ClassReportRespVO,
  StudentReportGetData,
  StudentReportGetRequest,
  StudentReportListRespVO,
  StudentReportStudentListRequest,
} from './type'

export function getStudentReportStudentList(params: StudentReportStudentListRequest) {
  return requestGet<StudentReportListRespVO[], StudentReportStudentListRequest>(
    '/api/v1/student-report/student-list',
    params
  )
}

export function getStudentReport(params: StudentReportGetRequest) {
  return requestGet<StudentReportGetData, StudentReportGetRequest>('/api/v1/student-report/get', params)
}

export function generateStudentReportComment(payload: StudentReportGetData) {
  return requestPost<string, StudentReportGetData>('/api/v1/student-report/generate-comment', payload)
}

// 生成班级报告评语
export function generateClassReportComment(payload: ClassReportRespVO) {
  return requestPost<string, ClassReportRespVO>('/api/v1/class-report/generate-comment', payload, {
    headers: { 'Content-Type': 'application/json' },
  })
}

// 查询班级报告详情
export function getClassReport(params: ClassReportQueryReqVO) {
  return requestPost<ClassReportRespVO, ClassReportQueryReqVO>('/api/v1/class-report/get', params)
}
