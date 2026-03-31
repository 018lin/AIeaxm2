import { requestPost } from '@/api/index'
import type { GroupItem, StrategyListItem, StrategyListRequest, StrategyListResponse } from './type'

// 策略分页列表
export function getStrategyList(params: StrategyListRequest) {
  return requestPost<StrategyListResponse, StrategyListRequest>('/api/v1/grouping-strategy/page', params)
}

// 新增策略
export function createStrategy(params: StrategyListItem) {
  return requestPost<boolean, StrategyListItem>('/api/v1/grouping-strategy/create', params)
}

// 更新策略
export function updateStrategy(params: StrategyListItem) {
  return requestPost<boolean, StrategyListItem>('/api/v1/grouping-strategy/update', params)
}

// 修改分层
export function updateGroup(params: GroupItem) {
  return requestPost<boolean, GroupItem>('/api/v1/student-group/update', params)
}
