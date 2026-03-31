/**
 * 标签列表
 */
// 请求体
export interface tagListRequest {
  tagType: string // 标签类型
}
// 响应体
export interface tagListResponse {
  description?: string // 标签描述
  parentId?: string // 父级标签ID
  questionTagId?: string // 唯一id
  sort?: number // 排序
  tagName?: string // 标签名称
  tagType?: string // 标签类型：KNOWLEDGE_POINT/CHAPTER/CUSTOM
}

/**
 * 字典列表
 */
// 请求体
export interface dictListRequest {
  dictTypes: string[] // 类型
}
// 响应体
export interface dictListItem {
  dictType?: string // 字典类型
  id?: number // 字典数据编号
  label?: string // 字典标签
  value?: string // 字典值（部分接口可能用 value 返回）
  dictValue?: string // 字典值（系统字典接口常用字段）
}
export interface dictListResponse {
  dictType?: string // 字典类型
  dictTypeList?: dictListItem[] // 该 dictType 下的字典类型集合
  id?: number // 字典数据编号
  label?: string // 字典标签
  sort?: number // 显示顺序
  dictValue?: string // 字典值
}

/**
 * 班级分页查询（/api/v1/class/page）
 */
export interface classPageQuery {
  classId?: string // 班级ID
  className?: string // 班级名称
  gradeId?: string // 年级ID
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
  [property: string]: any
}

export interface classVO {
  classId?: string
  className?: string
  id?: number
  [property: string]: any
}

export interface pageResult<T> {
  list?: T[]
  total?: number
  totalPage?: number
  [property: string]: any
}

export type classPageVO = pageResult<classVO>

/**
 * 知识点
 */
// 请求体
export interface knowledgeTreeRequest {
  stageId?: string // 学段ID
  parentId: string // 父级知识点ID（0表示根节点）
}
// 响应体
export interface knowledgeTreeResponse {
  children?: knowledgeTreeResponse[] // 子知识点列表
  defaultDifficulty?: boolean // 知识点默认难度（1-5）
  defaultImportance?: boolean // 知识点默认重要性（1-5）
  description?: string // 知识点详细描述
  gradeId?: string // 年级ID
  isLeaf?: boolean // 是否为叶子节点（末级知识点）
  level?: boolean // 节点层级（1开始）
  parentId?: string // 父级知识点ID（0表示根节点）
  pointCode?: string // 知识点编码（树路径编码，如"1.1.1.2"）
  pointName?: string // 知识点名称（如"有理数"）
  sortOrder?: boolean // 同级排序
  stageId?: string // 学段ID
  subjectId?: string // 适用学科ID（空表示全学科）
}

/**
 * 章节
 */
// 请求体
export interface chapterRequest {
  stage: string | undefined // 学段ID
  gradeId?: string | undefined // 年级ID
  subject: string | undefined // 学科ID
  textbookVersion?: string | undefined // 版本ID
  volume: string | undefined // 册次ID
  parentId: string // 父级章节ID（0表示根节点）
}
// 响应体
export interface chapterResponse {
  chapterId?: string // 章节唯一ID
  chapterName?: string // 章节名称
  chapterNum?: string // 章节数
  chapterTotal?: string // 章节总数
  createTime?: string // 创建时间
  creator?: string // 创建人
  deleted?: number // 逻辑删除：0=未删，1=已删
  id?: number // 主键ID
  level?: number // 章节层级（1开始）
  parentId?: string // 章节父ID
  sectionContent?: string // 具体的课文内容以及元数据包含所属单元、章节、目录页、pdf实际页等等
  stage?: string // 学段
  subject?: string // 学科
  unitNum?: string // 单元数
  updater?: string // 更新人
  updateTime?: string // 更新时间
  version?: string // 教材版本
  volume?: string // 册别（原tem字段，语义优化）
  children?: chapterResponse[] // 子章节列表
  unitName?: string // 单元名称
}

// 批改结果修正参数（gradingResult: Correct/Incorrect/CorrectAndIncorrect）
export interface CorrectGradingResultRequest {
  gradingId: string
  gradingResult: string
  gradingResultStr?: any // 批改结果修正备注
  [property: string]: any
}

// 关联学生与作业（修正学号）请求参数
export interface StudentHomeworkAssociateRequest {
  homeworkId: string // 作业ID（原作业记录ID）
  studentUserId: string // 学生用户ID
  forceAssociate?: boolean // 强制关联 true: 强制关联 false: 不强制关联
  [property: string]: any
}

export interface HomeworkStudentListRequest {
  assignmentId: string
  classId: string
  [property: string]: any
}

export interface HomeworkStudentListItem {
  classId?: string
  gradeId?: string
  schoolId?: string
  studentCode?: string
  studentId?: string
  studentName?: string
  userId?: string
  [property: string]: any
}

// 名单按 key 分组返回（如 submitted/unsubmitted）
export type HomeworkStudentListMapVO = Record<string, HomeworkStudentListItem[] | undefined>
