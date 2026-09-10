import { requestGet, requestPost } from '@/api/index'
import type {
  chapterRequest,
  chapterResponse,
  classPageQuery,
  classPageVO,
  CorrectGradingResultRequest,
  dictListRequest,
  HomeworkStudentListMapVO,
  HomeworkStudentListRequest,
  knowledgeTreeRequest,
  knowledgeTreeResponse,
  StudentHomeworkAssociateRequest,
  tagListRequest,
  tagListResponse,
} from './type'
import { normalizeDictList } from './dict'

// 获取标签列表
export function getTagList(params: tagListRequest) {
  return requestPost<tagListResponse[], tagListRequest>('/api/v1/tag/list', params)
}

// 获取字典列表
export function getDictList(params: dictListRequest) {
  return requestGet<unknown, dictListRequest>('/api/system/dict-data/query-types', params).then(res =>
    normalizeDictList(res, params.dictTypes)
  )
}

// 获取知识点列表
export function getKnowledgeTreeList(params: knowledgeTreeRequest) {
  return requestPost<knowledgeTreeResponse[], knowledgeTreeRequest>('/api/v1/knowledge-point/tree', params)
}

// 获取章节列表
export function getChapterList(params: chapterRequest) {
  return requestPost<chapterResponse[], chapterRequest>('/api/v1/chapter/list', params)
}

// 班级分页查询
export function getClassPage(params: classPageQuery) {
  return requestPost<classPageVO, classPageQuery>('/api/v1/class/page', params)
}

// 批改结果修正（教师手动纠错后回写）
export function correctGradingResult(params: CorrectGradingResultRequest) {
  return requestPost<boolean, CorrectGradingResultRequest>('/api/v1/student/homework/correct-grading-result', params)
}

// 关联学生与作业（修正学号）
export function associateStudentHomework(params: StudentHomeworkAssociateRequest) {
  return requestPost<boolean, StudentHomeworkAssociateRequest>('/api/v1/student/homework/associate', params)
}

// 获取作业维度的学生名单（按 submitted/unsubmitted 等分组）
export function getStudentHomeworkStudentList(params: HomeworkStudentListRequest) {
  return requestPost<HomeworkStudentListMapVO, HomeworkStudentListRequest>('/api/v1/student/homework/student-list', params)
}
