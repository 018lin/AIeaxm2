import { requestPost } from '@/api/index'

export interface CompositionPageRequest {
  keyword?: string
  pageNo?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}

export interface CompositionItem {
  id: string | number
  title: string
  creator?: string
  avatar?: string
  createdAt?: string
}

export interface CompositionPageResponse {
  list?: CompositionItem[]
  rows?: CompositionItem[]
  total?: number
}

export function listComposition(params: CompositionPageRequest) {
  return requestPost<CompositionPageResponse, CompositionPageRequest>('/api/v1/composition/page', params)
}
