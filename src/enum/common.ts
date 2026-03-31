// 题篮类型
export const QuestionBasketEnum = {
  BOOK: 'book', // 校本组卷
  WRONG: 'wrong', // 错题重组
  AUTOWRONG: 'autowrong', // 智能周错题重组
  LEVEL: 'level', // 分层组题
}

// 标签类型
export const tagEnum = {
  DIFFICULTY: 'DIFFICULTY', // 难度
  QUESTION_TYPE: 'QUESTION_TYPE', // 题型
  CHINESE_QUESTION_TYPE: 'CHINESE_QUESTION_TYPE', // 语文题型
  ENGLISH_QUESTION_TYPE: 'ENGLISH_QUESTION_TYPE', // 英语题型
  SCIENCE_QUESTION_TYPE: 'SCIENCE_QUESTION_TYPE', // 科学题型
}

// 组卷状态
export const assignmentStateEnum = {
  DRAFT: 'draft', // 未定稿
  FINALIZED: 'finalized', // 已定稿
  PUBLISHED: 'published', // 已发布
  COMPLETED: 'completed', // 已完成
  GRADING: 'grading', // 批阅中
  PROCESSING: 'processing', // 处理中
}

// select 组件的枚举
export const selectEnum = {
  TERM: 'ipta_term', // 学期
  GRADE: 'ipta_grade', // 年级
  SUBJECT: 'ipta_subject', // 科目
  STAGE: 'ipta_stage', // 学段
  ITEM_TYPE: 'ipta_item_type', // 题型
  QUESTION_BANK_SOURCE: 'ipta_question_bank_source', // 试卷来源
  CLASS: 'ipta_class', // 班级
  TEXTBOOK_VERSION: 'ipta_textbook_version', // 教材版本
  TEXTBOOK_VOLUME: 'ipta_textbook_volume', // 教材册次
}
export const selectTypeEnum = {
  ipta_term: '学期',
  ipta_grade: '年级',
  ipta_subject: '科目',
  ipta_stage: '学段',
  ipta_item_type: '试卷类型',
  ipta_question_bank_source: '试卷来源',
  ipta_class: '班级',
  ipta_textbook_version: '教材版本',
  ipta_textbook_volume: '教材册次',
}
export const selectValueEnum = {
  ipta_term: 'termId',
  ipta_grade: 'gradeId',
  ipta_subject: 'subjectId',
  ipta_stage: 'stageId',
  ipta_item_type: 'itemType',
  ipta_question_bank_source: 'questionBankSource',
  ipta_class: 'classId',
  ipta_textbook_version: 'textbookVersionId',
  ipta_textbook_volume: 'volume',
}
