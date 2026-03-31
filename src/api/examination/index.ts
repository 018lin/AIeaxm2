import { requestGet, requestPost, requestPostForm } from '@/api/index'
import type {
  downloadExaminationRequest,
  finalizeExaminationRequest,
  listExaminationItem,
  listExaminationResponse,
  previewExaminationRequest,
  previewExaminationResponse,
  qrcodeExaminationRequest,
  qrcodeExaminationResponse,
} from './type'

// 组题预览接口
export function previewExamination(params: previewExaminationRequest) {
  return requestPost<previewExaminationResponse, previewExaminationRequest>('/api/v1/assignment/create', params)
}

// 组题二维码列表查询
export function qrcodeListExamination(params: qrcodeExaminationRequest) {
  return requestPost<qrcodeExaminationResponse, qrcodeExaminationRequest>('/api/v1/assignment-qrcode/list', params)
}

// 组题记录列表接口 - 分页
export function listExamination(params: previewExaminationRequest) {
  return requestPost<listExaminationResponse, previewExaminationRequest>('/api/v1/assignment/page', params)
}

// 组题记录复制接口
export function copyExamination(params: downloadExaminationRequest) {
  return requestPost<boolean, downloadExaminationRequest>('/api/v1/assignment/copy', params)
}

// 组题记录定稿接口
export function finalizeExamination(params: finalizeExaminationRequest) {
  return requestPostForm<boolean, finalizeExaminationRequest>('/api/v1/assignment/finalized', params)
}

// 组卷下载接口
export function downloadExamination(params: downloadExaminationRequest) {
  return requestPost<string, downloadExaminationRequest>('/api/v1/assignment/download', params)
}

// 组题记录继续组卷接口
export function spliceExamination(params: downloadExaminationRequest) {
  return requestPost<qrcodeExaminationResponse, downloadExaminationRequest>('/api/v1/assignment/splice', params)
}

// 最近组卷列表
export function getRecentAssignments() {
  return requestGet<listExaminationItem[]>('/api/v1/assignment/recent-list')
}

// 组题记录-删除
export function deleteExamination(params: { assignmentId: string }) {
  return requestPost<boolean, { assignmentId: string }>('/api/v1/assignment/delete', params)
}
