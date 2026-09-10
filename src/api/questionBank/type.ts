export interface ImportQuestionBankBatchRequest {
  // 上传试卷文件（批量导入题库）入参
  stageId: string // 学段 ID（小学:1 初中:2 高中:3）
  gradeId: string // 年级 ID
  subjectId: string // 学科 ID
  questionBankTypeId: string // 题库类型 ID（同步/周测/月考/期中/期末）
  textbookVersionId: string // 教材版本 ID
  volume: string // 教材册次 ID
  files: File[] // 上传文件列表
  importFormat?: 'examcoo_json' // 导入格式：Examcoo JSON 题库
  chapterId?: string // 章节 ID（可选，后端根据需要决定是否使用）
}

export interface AttachmentVO {
  // 上传结果：成功文件信息
  id?: number // 主键 ID
  attachmentId?: string // 附件 ID
  fileName?: string // 文件名
  fileType?: string // 文件类型
  mimeType?: string // MIME 类型
  fileSize?: number // 文件大小
  filePath?: string // 文件路径
  bucketName?: string // 存储桶
  storagePlatform?: string // 存储平台
  attachmentStatus?: string // 附件状态
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
}

export interface FailedFileInfoVO {
  // 上传结果：失败文件信息
  fileName?: string // 文件名
  error?: string // 失败原因
  fileSize?: number // 文件大小
}

export interface ImportQuestionBankBatchResponse {
  // 上传试卷接口返回 data（BatchResultVO）
  successCount?: number // 成功上传数量
  failedCount?: number // 失败数量
  totalCount?: number // 总数量
  successFiles?: AttachmentVO[] // 成功文件列表
  failedFiles?: FailedFileInfoVO[] // 失败文件列表
  batchId?: string // 批次 ID
  directoryPath?: string // 目录路径
  importedQuestionCount?: number // JSON 题库成功导入题目数
  skippedQuestionCount?: number // JSON 题库跳过题目数
  missingImages?: string[] // JSON 题库缺失图片列表
  detailId?: string // 导入后试卷详情 ID
}

export interface QuestionBankDetailQueryRequest {
  // 分页查询上传试卷详情入参
  attachmentId?: string // 附件 ID
  batchId?: string // 批次号（唯一标识）
  createTime?: string // 创建时间
  creator?: string // 创建者
  deleted?: boolean // 逻辑删除
  detailId?: string // 详情号（唯一标识）
  gradeId?: string // 年级 ID
  id?: number // 主键 ID
  itemType?: string // 类型（sync/weekly/monthly/midTerm/finalTerm）
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数
  stageId?: string // 学段 ID
  subjectId?: string // 学科 ID
  tenantId?: string // 租户 ID
  termId?: string // 学期 ID
  updater?: string // 更新者
  updateTime?: string // 更新时间
  version?: number // 版本号
}

export interface QuestionBankDetailVO {
  // 上传试卷详情
  id?: number // 主键 ID
  version?: number // 版本号
  tenantId?: string // 租户 ID
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
  deleted?: boolean // 逻辑删除
  creator?: string // 创建者
  updater?: string // 更新者
  batchId?: string // 批次号（唯一标识）
  detailId?: string // 详情号（唯一标识）
  gradeId?: string // 年级（返回文本）
  subjectId?: string // 学科（返回文本）
  stageId?: string // 学段（返回文本）
  termId?: string // 学期（返回文本）
  itemType?: string // 类型（可能返回枚举或文本，按后端实际为准）
  attachmentId?: string // 附件 ID
  auditStatus?: string // 审核状态
  examTitle?: string // 试卷标题
  itemTypeName?: string // 题库类型名称
  gradeName?: string // 年级名称
  termName?: string // 学期名称
  stageName?: string // 学段名称
  subjectName?: string // 学科名称
  typeName?: string // 题库类型名称（冗余字段，保持兼容）
  creatorName?: string // 创建者名称（冗余字段，保持兼容）
}

export interface PageResult<T> {
  // 通用分页结构
  total: number // 总条数
  list: T[] // 当前页数据
  totalPage?: number // 总页数
}

export type QuestionBankDetailQueryResponse = PageResult<QuestionBankDetailResponse> // 分页查询上传试卷详情出参 data

export interface UpdateQuestionBankDetailTitleRequest {
  id: number // 主键 ID
  examTitle: string // 试卷标题
  batchId?: string // 批次号（唯一标识）
  detailId?: string // 详情号（唯一标识）
}

// 题库列表-分页接口请求体
export interface listQuestionBankRequest {
  difficulty?: string // 难度等级
  gradeId?: string // 年级ID
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
  questionTagId?: string // 题目标签
  questionType?: string // 题目类型
  status?: boolean // 题目状态
  stageId?: string // 学段ID
  classId?: string // 班级ID
}

// 题库列表-分页接口返回体
export interface listQuestionBankResponse {
  list?: questionBankItem[] // 数据列表
  total?: number // 总量
}

// 题库列表-分页接口返回体-题目基础表
export interface questionBankItem {
  analysisAttachment?: string // 题目解析附件
  answerAttachment?: string // 题目答案附件
  coordinates?: { data: any[] } // 答题区域坐标数据
  createTime?: string // 创建时间
  creator?: string // 创建人
  defaultScore?: { [key: string]: any } // 建议分值
  deleted?: boolean // 逻辑删除
  difficulty?: string // 难度等级
  difficultyTagName?: string // 难度标签名称
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
  id?: number // 主键ID
  questionContent?: string // 题目原始内容
  questionId?: string // 题目唯一id
  questionsAttachment?: string // 题目附件
  questionType?: string // 题目类型
  questionTypeTagName?: string // 题型标签名称
  layoutFormat?: string // 布局格式
  status?: boolean // 题目状态
  subjectId?: string // 学科ID
  subjectName?: string // 学科名称
  tenantId?: string // 租户ID
  updater?: string // 更新人
  updateTime?: string // 更新时间
  version?: number // 版本号
  knowledgePoints?: knowledgePoint[] // 知识点
  answered?: number // 答案完整性（0-缺失 1-完整）
  creatorName?: string // 创建人名称
  answerAnalysis?: string // 人工答案解析
  correctAnswer?: string // 人工答案
  wrongAnswerCount?: string // 错题人数
  wrongAnswerTime?: string // 错题时间
  answers: any[]
  stageId?: string
}
// 题库列表-分页接口返回体-知识点
export interface knowledgePoint {
  defaultDifficulty?: boolean // 知识点默认难度（1-5）
  defaultImportance?: boolean // 知识点默认重要性（1-5）
  description?: string // 知识点详细描述
  gradeId?: string // 年级ID
  isLeaf?: boolean // 是否为叶子节点（末级知识点）
  knowledgePointId?: string // 知识点唯一ID
  level?: boolean // 节点层级（1开始）
  parentId?: string // 父级知识点ID（0表示根节点）
  pointCode?: string // 知识点编码（树路径编码，如"
  pointName?: string // 知识点名称（如"有理数"）
  sortOrder?: boolean // 同级排序
  stageId?: string // 学段ID
  subjectId?: string // 适用学科ID（空表示全学科）
}

// 题目预览标签
export interface QuestionPreviewTag {
  tagId?: string // 标签ID
  tagName?: string // 标签名称
  [property: string]: any
}

// 题目预览信息
export interface QuestionPreviewVO {
  questionId?: string // 题目ID
  questionsUrl?: string // 题目图片预览地址
  status?: number // 题目状态
  tags?: QuestionPreviewTag[] // 题目标签列表
  [property: string]: any
}

// 试卷详情返回数据
export interface QuestionBankSingleDetailVO {
  questionList?: QuestionPreviewVO[] // 题目列表
  [property: string]: any
}

// 根据题目ID查询题目详情返回数据
export interface QuestionBankByIdResponse {
  analysisAttachment?: string
  answerAnalysis?: string
  answerAttachment?: string
  answered?: number
  chapterId?: string // 章节 ID
  chapterName?: string // 章节名称
  coordinates?: { data: any[] } // 答题区域坐标数据
  correctAnswer?: string //  人工答案
  createTime?: string // 创建时间
  creator?: string // 创建人Id
  defaultScore?: { [key: string]: any } // 建议分值（如：{"score": 5}）
  difficulty?: string // 难度等级（如：简单、普通、困难等）
  difficultyTagName?: string // 难度标签名称
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
  id?: number // 题目主键ID
  knowledgePoints?: knowledgePoint[] // 知识点列表
  layoutFormat?: string // 排版格式（如：单列、双列等）
  questionContent?: string // 题目原始内容
  questionId?: string //  题目唯一id
  questionsAttachment?: string //  题目附件
  questionSourceId?: string // 题目来源ID（如同步题库ID）
  questionType?: string // 题型标签名称
  questionTypeTagId?: string // 题型标签名称
  questionTypeTagName?: string // 题型标签名称
  stageId?: string // 学段ID
  status?: number //题目状态 0-未发布 1-已发布 2-已删除
  subjectId?: string // 学科ID
  subjectName?: string // 学科名称
  textBookVersion?: string // 教材版本
  updateTime?: string // 更新时间
  volume?: string // 教材册次
  wrongAnswerCount?: string // 错题人数
  wrongAnswerTime?: string // 错题时间
  chapters: { [key: string]: any }[]
  updater?: string // 更新人Id
  textbookVersion?: string // 教材版本
  answers: any[] // 题目答案（如：{"answer": "A"}）
}

// 查看试题-试卷详情
export interface QuestionBankDetailResponse {
  auditStatus?: string // 审核状态(WAIT_AUDIT=待审核,AUDIT_PASS=审核通过,AUDIT_REJECT=审核不通过)
  batchId?: string // 批次号（唯一标识）
  createTime?: string // 创建时间
  creator?: string // 创建者
  deleted?: boolean // 逻辑删除
  detailId?: string // 详情号（唯一标识）
  examTitle?: string // 试卷名称
  gradeId?: string // 年级ID
  gradeName?: string // 年级名称
  id?: number // 主键ID
  itemType?: string // 题库类型(同步 sync, 周测 weekly,月考 monthly  期中 midTerm,期末 finalTerm)
  itemTypeName?: string // 题库类型名称
  questionBankSource?: string // 试卷来源(试卷=1, 教辅书=2)
  stageId?: string // 学段ID
  stageName?: string // 学段名称
  subjectId?: string // 学科ID
  subjectName?: string // 学科名称
  tenantId?: string // 租户ID
  termId?: string // 学期ID
  termName?: string // 学期名称
  updater?: string // 更新者
  updateTime?: string // 更新时间
  version?: number // 版本号
}

export interface QuestionBankDetailListRequest {
  detailId: string // 详情号（唯一标识）
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
}

export interface QuestionBankDetailListResponse {
  list?: questionBankItem[] // 题目列表
  total?: number // 总量
}

// 获取题目的AI答案 -- 返回体
export interface QuestionBankAIAnswerResponse {
  aiAnalysis?: string // AI 解析
  aiAnswer?: any[] // AI 答案
  questionId?: string // 题目ID
}
