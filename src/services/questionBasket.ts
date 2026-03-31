// 统一试题篮服务 - 打通校本组卷、错题重组、分层生成组卷闭环

import type { questionBankItem } from '@/api/questionBank/type'
import {
  createQuestionBasket,
  deleteAllQuestionBasket,
  deleteQuestionBasket,
  listQuestionBasket,
} from '@/api/questionBasket/index'
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import { QuestionBasketEnum } from '@/enum/common'
import { getUserBaseInfo } from '@/services/storage'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'

/**
 * 状态
 */
// 校本组卷列表
const bookList = ref<QuestionBasketRsponse[]>([])
// 错题重组列表
const wrongList = ref<QuestionBasketRsponse[]>([])
// 分层组题列表
const levelList = ref<QuestionBasketRsponse[]>([])
// 基础状态
const parsedUserInfo = getUserBaseInfo()
const gradeId = ref(parsedUserInfo?.gradeId || '') // 年级ID
const subjectId = ref(parsedUserInfo?.subjectId || '') // 学科ID
const assignmentId = ref('') // 作业ID（如果需要）

/**
 * 计算属性
 */
// 校本组卷列表总数
const bookCount = computed(() => {
  return bookList.value.reduce((sum, group) => sum + group.children.length, 0)
})
// 错题重组列表总数
const wrongCount = computed(() => {
  return wrongList.value.reduce((sum, group) => sum + group.children.length, 0)
})
// 分层组题列表总数
const levelCount = computed(() => {
  return levelList.value.reduce((sum, group) => sum + group.children.length, 0)
})
// 试题篮总数
const totalCount = computed(() => {
  return bookCount.value + wrongCount.value + levelCount.value
})

/**
 * 方法
 */
// 初始化获取试题篮列表
const initGetlist = () => {
  // 获取校本组卷列表
  getQuestionBasketList(QuestionBasketEnum.BOOK)
  // 获取错题重组列表
  getQuestionBasketList(QuestionBasketEnum.WRONG)
  // 获取分层组题列表
  // getQuestionBasketList(QuestionBasketEnum.LEVEL)
}
const getQuestionBasketList = async (draftBoxType: string) => {
  const params = {
    gradeId: gradeId.value || '',
    subjectId: subjectId.value || '',
    draftBoxType: draftBoxType,
  }
  const res = await listQuestionBasket(params as any)
  if (draftBoxType === QuestionBasketEnum.LEVEL) {
    levelList.value = res || []
  } else if (draftBoxType === QuestionBasketEnum.BOOK) {
    bookList.value = res || []
  } else if (draftBoxType === QuestionBasketEnum.WRONG) {
    wrongList.value = res || []
  }
  const resData = res || []
  if (resData.length > 0) {
    assignmentId.value = resData[0]?.assignmentId || ''
  }
}

// 加入试题篮
const addQuestionBasket = async (q: questionBankItem, type: 'BOOK' | 'WRONG' | 'LEVEL') => {
  const list = type === 'BOOK' ? bookList.value : type === 'WRONG' ? wrongList.value : levelList.value

  // 检查题目是否已存在（需要遍历所有分组的 children）
  const exists = list.some(group => group.children.some(item => item.questionId === q.questionId))
  if (exists) {
    message.warning('该题目已在试题篮中')
    return false
  }

  // 计算试题篮中的题目总数
  const totalCount = list.reduce((sum, group) => sum + group.children.length, 0)
  if (totalCount >= 60) {
    message.warning('该试题篮已达最大容量60题，无法添加更多题目')
    return false
  }

  const params = {
    questionId: q.questionId,
    draftBoxType: QuestionBasketEnum[type],
    gradeId: gradeId.value || '',
    subjectId: subjectId.value || '',
  }
  try {
    const res = await createQuestionBasket(params as any)
    if (res) {
      return true
    }
    return false
  } catch (error) {
    message.error('加入试题篮失败')
    return false
  }
}

// 移除试题篮
const removeQuestionBasket = async (draftBoxId: string, questionId: string, type: 'BOOK' | 'WRONG' | 'LEVEL') => {
  const list = type === 'BOOK' ? bookList.value : type === 'WRONG' ? wrongList.value : levelList.value

  // 如果传入 questionId，需要在所有分组的 children 中查找对应的 draftBoxId
  let draftBoxIdVal = draftBoxId
  if (!draftBoxIdVal && questionId) {
    for (const group of list) {
      const item = group.children.find(child => child.questionId === questionId)
      if (item?.draftBoxId) {
        draftBoxIdVal = item.draftBoxId
        break
      }
    }
  }

  if (!draftBoxIdVal) {
    message.error('无法获取试题篮ID')
    return false
  }

  try {
    const res = await deleteQuestionBasket({ draftBoxId: draftBoxIdVal })
    if (res) {
      return true
    }
    return false
  } catch (error) {
    message.error('移除试题篮失败')
    return false
  }
}

// 一键清空试题篮
const clearBasket = async (draftBoxType: string) => {
  bookList.value = []
  wrongList.value = []
  levelList.value = []
  assignmentId.value = ''
  const params = {
    gradeId: gradeId.value || '',
    subjectId: subjectId.value || '',
    draftBoxType: draftBoxType,
  }
  const res = await deleteAllQuestionBasket(params as any)
  if (res) {
    return true
  }
  return false
}

export const questionBasketService = {
  // 状态
  bookList,
  wrongList,
  levelList,
  assignmentId,
  // 计算属性
  bookCount,
  wrongCount,
  levelCount,
  totalCount,
  // 方法
  initGetlist,
  addQuestionBasket,
  removeQuestionBasket,
  clearBasket,
}
