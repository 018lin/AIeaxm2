import type { previewExaminationResponse } from '@/api/examination/type'
import { requestPost } from '@/api/index'
import type { getRulesResponse } from './type'

// 错题组卷-获取规则
export function getRules(params: { classId: string }) {
  return requestPost<getRulesResponse, { classId: string }>('/api/v1/rules/getrules', params)
}

// 错题组卷-更新规则
export function updateRules(params: getRulesResponse) {
  return requestPost<getRulesResponse, getRulesResponse>('/api/v1/rules/update-rules', params)
}

// 去定稿：根据 assignmentId 还原组卷预览数据（返回结构与 /create 一致）
export function toFinalized(params: { assignmentId: string }) {
  return requestPost<previewExaminationResponse, { assignmentId: string }>('/api/v1/assignment/to-finalized', params)
}

// 批量下载
export function batchDownload(params: { assignmentList: string[] }) {
  return requestPost<Blob, { assignmentList: string[] }>('/api/v1/assignment/batch-download', params, {
    responseType: 'blob',
  })
}
