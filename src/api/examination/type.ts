import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
/**
 * 组题预览接口
 */
// 请求体

export interface previewExaminationRequest {
  assignmentId?: string // 唯一id
  assignmentName?: string // 作业名称
  assignmentNature?: string // 组卷类型 paper/homework 预留字段，前期默认都是homework
  assignmentType?: string // points/book/wrong/level/platform 知识点/章节/错题/分层/平台
  classId?: string // 班级id
  gradeId?: string // 年级id
  pointId?: string // 知识点ID
  questionIds?: string // 试题篮中试题唯一ID,通过“,”拼接传入
  questionList?: previewExaminationItem[] // 作业题目列表
  subjectId?: string // 学科id
  tagId?: string // 标签ID，三种维度通过,拼接传入
  teacherId?: string // 出题教师ID
  pageNo?: number //  页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
  pages?: string // 题目分页信息 JSON 字符串
  startDate?: string // 开始时间
  endDate?: string // 结束时间
  assignmentIdList?: string // 作业ID列表，多个ID通过逗号分隔
}
// 详情
export interface previewExaminationItem {
  analysisImage?: string // 解析图片
  assignmentId?: string // 所属模板ID，关联 ipta_assignment.assignment_id
  assignmentItemId?: string // 唯一ID
  order?: string // 顺序
  pageNumber?: string // 页码：题目所属页码
  questionContent?: string // 题干
  questionId?: string // 题目唯一ID 关联ipta_question.question_id
  questionType?: string // 题目类型
}
// 返回体
export interface previewExaminationResponse {
  assignmentId?: string // 作业id
  assignmentName?: string // 作业名称
  assignmentType?: AssignmentType // 作业类型
  classId?: string // 班级id
  gradeId?: string // 年级id
  qrCodeContent?: string // 二维码
  questionList?: previewExaminationItem[]
  subjectId?: string // 学科id
  teacherId?: string // 教师id
  gradeName?: string // 年级名称
  subjectName?: string // 学科名称
  status?: string // 状态 draft：未定稿, finalized：已定稿
  stageId?: string // 学段ID
}
// 作业类型
export const AssignmentTypeMenu = {
  ChapterPack: 'CHAPTER_PACK', // 章节组卷
  ErrorQuestionPack: 'ERROR_QUESTION_PACK', // 错题组卷
  IntelligentLayerPack: 'INTELLIGENT_LAYER_PACK', // 智能分层组卷
  KnowledgePointPack: 'KNOWLEDGE_POINT_PACK', // 知识点组卷
  LayerPack: 'LAYER_PACK', // 分层组卷
} as const
export type AssignmentType = (typeof AssignmentTypeMenu)[keyof typeof AssignmentTypeMenu]

/**
 * 组题记录列表接口
 */
// 返回体
export interface listExaminationResponse {
  list?: listExaminationItem[] // 数据
  total?: number // 总量
}
// 详情
export interface listExaminationItem {
  analysisAttaId?: string // 解析附件ID
  answerAttaId?: string // 答案附件ID
  assignmentId?: string // 唯一id
  assignmentName?: string // 名称
  assignmentNature?: string // 类型：paper=试卷，homework=作业
  assignmentPages?: string // 总页码数
  assignmentType?: string // 类型：paper=试卷，homework=作业
  classId?: string // 班级ID
  description?: string // 模板描述
  fileUrl?: string // 文件地址
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
  id?: number // 模板主键ID
  qrCodeContent?: string // 二维码
  questionNumbers?: number // 题目数量
  questionsAttaId?: string // 试卷、作业附件ID
  questionsPage?: number // 页数
  status?: string // draft, under_review, published, disabled, enabled
  subjectId?: string // 学科ID
  subjectName?: string // 学科名称
  groupName?: string
  teacherId?: string // 出题教师ID
  assignmentStatus?: string // 作业状态（book字段是智能组卷、wrong字段是错题重组、level字段是分层作业）
}

/**
 * 组题二维码列表查询接口
 */
// 请求体
export interface qrcodeExaminationRequest {
  assignmentId: string // 关联的作业/试卷ID
  totalPages: string // 分页页数
}
// 返回体
export interface qrcodeExaminationResponse {
  assignmentId?: string // 关联的作业/试卷ID
  assignmentPage?: string // 二维码所属页数
  createTime?: string // 创建时间
  creator?: string // 创建人
  deleted?: number // 逻辑删除：0=未删，1=已删
  id?: number // 主键ID
  qrcodeContent?: string // 二维码原始内容（如URL、JSON等）
  qrcodeId?: string // 二维码唯一标识ID
  tenantId?: string // 租户ID
  updater?: string // 更新人
  updateTime?: string // 更新时间
  version?: number // 版本号
}

/**
 * 组题记录定稿接口
 */
// 请求体
export interface finalizeExaminationRequest {
  assignmentFile: Blob // PDF文件
  finalizedData: string // JSON字符串，定稿数据
}

/**
 * 组卷下载接口
 */
// 请求体
export interface downloadExaminationRequest {
  assignmentId?: string // 作业id
}

/**
 * 继续组卷接口
 */
export interface qrcodeExaminationResponse {
  assignmentId?: string // 作业id
  assignmentName?: string // 作业名称
  assignmentType?: AssignmentType // 作业类型
  classId?: string // 班级id
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
  qrCodeContent?: string // 二维码内容
  questionList?: QuestionBasketRsponse[] // 作业题目列表
  questionsAttaId?: string // 试卷、作业附件ID
  subjectId?: string // 学科id
  subjectName?: string // 学科名称
  teacherId?: string // 教师id
}
