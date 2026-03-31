import { requestPost } from '@/api/index'
import type { QuestionBasketItem, QuestionBasketRsponse, deleteQBRequest } from './type'

// 试题篮加入题目
export function createQuestionBasket(params: QuestionBasketItem) {
  return requestPost<string, QuestionBasketItem>('/api/v1/draft-box/create', params)
}

// 试题篮删除题目
export function deleteQuestionBasket(params: deleteQBRequest) {
  return requestPost<string, deleteQBRequest>('/api/v1/draft-box/delete', params)
}

// 试题篮列表
export function listQuestionBasket(params: QuestionBasketItem) {
  return requestPost<QuestionBasketRsponse[], QuestionBasketItem>('/api/v1/draft-box/list', params)
}

// 试题篮列表
export function deleteAllQuestionBasket(params: QuestionBasketItem) {
  return requestPost<boolean, QuestionBasketItem>('/api/v1/draft-box/delete-all', params)
}
