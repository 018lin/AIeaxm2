export interface QuestionBasketItem {
  id?: number // 草稿箱主键ID
  version?: string // 版本号
  tenantId?: string // 租户ID
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
  deleted?: number // 逻辑删除：0=未删，1=已删
  creator?: string // 创建人
  updater?: string // 更新人
  draftBoxId?: string // 唯一id
  draftBoxType?: string // 性质：homework
  draftBoxNature?: string // 区分：校本组卷book/错题重组wrong/分层组题level
  difficulty?: string // 难度等级
  difficultyTagName?: string // 难度标签名称
  gradeId?: string // 年级ID
  subjectId?: string // 学科ID
  teacherId?: string // 出题教师ID
  assignmentId?: string // 试题模板ID
  questionId?: string // 题目唯一ID 关联ipta_question.question_id
  questionType?: string // 题目类型
  questionTypeTagName?: string // 题型标签名称
  assignmentIds?: string // 试题模板ID列表
  questionsUrl?: string // 题干内容（图片地址）
  questionTypeTagId?: string // 题型标签ID
  stageId?: string // 学段ID
}

export interface QuestionBasketRsponse {
  children: QuestionBasketItem[] // 试题篮题目列表
  questionTypeTagName: string // 题型标签名称
  questionTypeTagId?: string // 题型标签ID
  assignmentId?: string // 试题模板ID
}

// 试题篮删除题目接口请求体
export interface deleteQBRequest {
  draftBoxId: string // 草稿箱主键ID
}
