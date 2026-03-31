import { requestGet, requestPost, requestPostForm } from '@/api/index'
import type {
  ImportQuestionBankBatchRequest,
  ImportQuestionBankBatchResponse,
  listQuestionBankRequest,
  listQuestionBankResponse,
  QuestionBankAIAnswerResponse,
  QuestionBankByIdResponse,
  QuestionBankDetailListRequest,
  QuestionBankDetailListResponse,
  QuestionBankDetailQueryRequest,
  QuestionBankDetailQueryResponse,
  QuestionBankDetailResponse,
  QuestionBankSingleDetailVO,
  UpdateQuestionBankDetailTitleRequest,
} from './type'

//  上传试卷文件（支持单个或批量上传）。
export function importQuestionBankBatch(payload: ImportQuestionBankBatchRequest) {
  return requestPostForm<ImportQuestionBankBatchResponse, ImportQuestionBankBatchRequest>(
    '/api/v1/question-bank-batch/import',
    payload
  )
}

export function queryQuestionBankDetailPage(params: QuestionBankDetailQueryRequest) {
  return requestPost<QuestionBankDetailQueryResponse, QuestionBankDetailQueryRequest>(
    '/api/v1/question-bank-detail/page',
    params
  )
}

export function getQuestionBankDetailViewAttach(detailId: string) {
  return requestGet<string>(`/api/v1/question-bank-detail/view-attach/${detailId}`)
}

// 查看试题
export function queryQuestionBankDetailViewQuestion(detailId: string) {
  return requestGet<QuestionBankSingleDetailVO>(`/api/v1/question-bank-detail/view-question/${detailId}`)
}

// 更新试卷标题
export function updateQuestionBankDetailTitle(params: UpdateQuestionBankDetailTitleRequest) {
  return requestPost<boolean, UpdateQuestionBankDetailTitleRequest>('/api/v1/question-bank-detail/update-title', params)
}

// 自主上传-删除试卷及其题目
export function deleteQuestionBankDetail(params: { detailId: string }) {
  return requestPost<boolean, { detailId: string }>(
    `/api/v1/question-bank-detail/delete/${params.detailId}`,
    { detailId: params.detailId }
  )
}

// 题库列表-分页
export function listQuestionBank(params: listQuestionBankRequest) {
  return requestPost<listQuestionBankResponse, listQuestionBankRequest>('/api/v1/question/page', params)
}

// 题库-删除试题
export function deleteQuestionBank(params: { questionId: string }) {
  return requestPost<boolean, { questionId: string }>('/api/v1/question/delete', params)
}

// 题库-根据题目ID查询题目详情
export function getQuestionBankById(params: { questionId: string }) {
  return requestGet<QuestionBankByIdResponse, { questionId: string }>(`/api/v1/question/${params.questionId}`)
}

// 题库-修改题目
export function editQuestionBank(params: QuestionBankByIdResponse) {
  return requestPost<boolean, QuestionBankByIdResponse>('/api/v1/question/edit', params)
}

// 自主上传-查看试题-试卷详情
export function getQuestionBankDetail(params: { detailId: string }) {
  return requestGet<QuestionBankDetailResponse, { detailId: string }>(
    `/api/v1/question-bank-detail/detail/${params.detailId}`
  )
}

// 自主上传-查看试题-试题列表
export function getQuestionBankDetailList(params: QuestionBankDetailListRequest) {
  return requestPost<QuestionBankDetailListResponse, QuestionBankDetailListRequest>(
    'api/v1/question-bank-detail/questions',
    params
  )
}

// 题库-获取题目的AI答案
export function getQuestionBankAIAnswer(params: { questionId: string }) {
  return requestPost<QuestionBankAIAnswerResponse, { questionId: string }>('/api/v1/question/genAiAnswer', params)
}
