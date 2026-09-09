import { requestGet, requestPost, requestPostForm } from '@/api/index'
import type { AxiosRequestConfig } from 'axios'
import type {
  AiGradingMaterialSourceOption,
  AssignmentStatisticsRequest,
  AssignmentStatisticsVO,
  ClassHomeworkDetailRequest,
  ClassHomeworkDetailVO,
  HomeworkListPageVO,
  HomeworkListRequest,
  ManualGradingHomeworkVO,
  ManualGradingListRequest,
  ManualGradingRequest,
  MobilePhotoUploadMaterialRequest,
  OriginalDetailVO,
  QuestionStatisticsRequest,
  QuestionStatisticsVO,
  ScannerScanMaterialRequest,
  StudentStatisticsRequest,
  StudentStatisticsVO,
  TeacherExplanationCreateRequest,
  TeacherExplanationCreateResponse,
  UploadFileRequest,
  UploadFileResponse,
} from './type'

export function listHomework(params: HomeworkListRequest) {
  return requestPost<HomeworkListPageVO>('/api/v1/student/homework/list', params)
}

export function getClassHomeworkDetail(params: ClassHomeworkDetailRequest) {
  return requestGet<ClassHomeworkDetailVO[], ClassHomeworkDetailRequest>(
    '/api/v1/student/homework/class-homework-detail',
    params
  )
}

export function getOriginalDetail(params: { homeworkId?: string; assignmentId?: string; studentUserId?: string }) {
  return requestPost<
    OriginalDetailVO | OriginalDetailVO[],
    { homeworkId?: string; assignmentId?: string; studentUserId?: string }
  >('/api/v1/student/homework/original-detail', params)
}

export function getAssignmentStatistics(params: AssignmentStatisticsRequest) {
  return requestGet<AssignmentStatisticsVO[], AssignmentStatisticsRequest>(
    '/api/v1/student/homework/statistics',
    params
  )
}

export function getQuestionStatistics(params: QuestionStatisticsRequest) {
  return requestGet<QuestionStatisticsVO, QuestionStatisticsRequest>(
    '/api/v1/student/homework/question-statistics',
    params
  )
}

// 试卷学生统计（学生维度汇总，用于热力表等）
export function getStudentStatistics(params: StudentStatisticsRequest) {
  return requestGet<StudentStatisticsVO, StudentStatisticsRequest>(
    '/api/v1/student/homework/student-statistics',
    params
  )
}

// 获取需要人工批阅的题目和学生
export function getManualGradingList(params: ManualGradingListRequest) {
  return requestGet<ManualGradingHomeworkVO, ManualGradingListRequest>(
    '/api/v1/student/homework/manual-grading-list',
    params
  )
}

export function submitManualGrading(params: ManualGradingRequest) {
  return requestPost<boolean, ManualGradingRequest>('/api/v1/student/homework/manual-grading', params)
}

// 上传文件（文件流）
export function uploadFile(params: UploadFileRequest, config?: AxiosRequestConfig) {
  return requestPostForm<UploadFileResponse, UploadFileRequest>('/api/v1/file/upload', params, config)
}

// AI 阅卷素材来源只保留：扫描机扫描、移动端拍照上传
export function getAiGradingMaterialSources() {
  return requestGet<AiGradingMaterialSourceOption[]>('/api/v1/student/homework/material-sources')
}

export function createScannerScanMaterial(params: ScannerScanMaterialRequest, config?: AxiosRequestConfig) {
  return requestPost<boolean, ScannerScanMaterialRequest>(
    '/api/v1/student/homework/material/scanner-scan',
    { ...params, source: 'scanner_scan' },
    config
  )
}

export function uploadMobilePhotoMaterial(params: MobilePhotoUploadMaterialRequest, config?: AxiosRequestConfig) {
  return requestPostForm<UploadFileResponse, MobilePhotoUploadMaterialRequest>(
    '/api/v1/student/homework/material/mobile-photo/upload',
    { ...params, source: 'mobile_photo_upload' },
    config
  )
}

// 创建讲解（videoAttaId 使用上传接口返回的 attachmentId）
export function createTeacherExplanation(params: TeacherExplanationCreateRequest, config?: AxiosRequestConfig) {
  return requestPost<TeacherExplanationCreateResponse, TeacherExplanationCreateRequest>(
    '/api/v1/teacher-explanation/create',
    params,
    config
  )
}

// 旧接口占位：避免历史 import 直接报错（建议逐步替换为 listHomework）
export function listStudentHomework(params: any) {
  return requestPost<any>('/api/v1/student/homework/list', params)
}
