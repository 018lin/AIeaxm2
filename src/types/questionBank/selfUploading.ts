import type { QuestionBankDetailVO } from '@/api/questionBank/type'

export interface UploadPaperRequestPayload {
  stageId: string // 学段 ID（接口字段 stageId）
  gradeId: string // 年级 ID（接口字段 gradeId）
  subjectId: string // 学科 ID（接口字段 subjectId）
  termId: string // 学期 ID（接口字段 termId）
  questionBankTypeId: string // 类型 ID（1~5，对应同步/周测/月考/期中/期末；接口字段 questionBankTypeId）
  files: File[] // 上传的文件列表（multipart/form-data: files）
}

export interface SelfUploadingFilters {
  subject: string // 学科筛选值；"all" 表示全部
  grade: string // 年级筛选值；"all" 表示全部
  term: string // 学期筛选值；"all" 表示全部
  type: string // 类型筛选值；"all" 表示全部（1~5）
  source: string // 来源筛选值；"all" 表示全部（1~2）
}

export interface PaperCard {
  id: number // 列表渲染用 ID（优先使用后端 id）
  title: string // 试卷标题（映射 examTitle）
  subjectText: string // 学科展示文案（当前直接使用 subjectId 的字符串）
  gradeText: string // 年级展示文案（当前直接使用 gradeId 的字符串）
  termText: string // 学期展示文案（当前直接使用 termId 的字符串）
  typeText: string // 类型展示文案（当前直接使用 itemType 的字符串）
  date: string // 更新时间展示文案（由 updateTime 格式化而来）
  uploader: string // 上传人/创建者（映射 creator）
  paperId: string // 业务侧展示 ID（batchId/detailId/id 兜底）
  raw: QuestionBankDetailVO // 后端原始对象（便于后续扩展）
  itemTypeName?: string // 题库类型名称
  gradeName?: string // 年级名称
  termName?: string // 学期名称
  stageName?: string // 学段名称
  subjectName?: string // 学科名称
  typeName?: string // 题库类型名称（冗余字段，保持兼容）
  creatorName?: string // 创建者名称（冗余字段，保持兼容）
}
