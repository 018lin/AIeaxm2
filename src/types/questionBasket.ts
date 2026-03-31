import type { QuestionBasketItem } from '@/api/questionBasket/type'

// 试题篮中试题来源 recompose：错题重组 layered：分层作业 examination：智能组卷
export type sourceType = 'layered' | 'recompose' | 'examination' | 'stratified'

export type MovePayload = { from: number; to: number }

export interface listQuestionBasketParams {
  gradeId: string
  subjectId: string
  draftBoxType?: string
}

export interface questionTypeTag {
  qt_choice: string
  qt_fill_blank: string
  qt_true_false: string
  qt_calculation: string
  qt_application: string
  qt_drawing: string
}
export interface difficultyTag {
  qt_diff_easy: string
  qt_diff_medium: string
  qt_diff_hard: string
}

export interface TypeBlock {
  typeIndex: number
  typeName: string
  startIndex: number
  endIndex: number
  children: QuestionBasketItem[]
  showTypeHeader: boolean
  startNo: number
}
