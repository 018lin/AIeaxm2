export interface StudentReportStudentListRequest {
  classId: string
  endDate: string
  gradeId: string
  startDate: string
  subjectId: string
}

export interface StudentReportListRespVO {
  classId?: string
  className?: string
  classRank?: number
  completedAssignments?: number
  correctQuestions?: number
  correctRate?: number
  gradeId?: string
  gradeName?: string
  studentName?: string
  studentNo?: string
  studentUserId?: string
  submitRate?: number
  totalAssignments?: number
  totalQuestions?: number
  wrongQuestions?: number
}

export interface StudentReportGetRequest {
  classId: string
  endDate: string
  gradeId: string
  startDate: string
  studentUserId: string
  subjectId: string
  [property: string]: any
}

export interface StudentReportMainReport {
  totalAssignments: number
  completedAssignments: number
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  correctRate: number
  submitRate: number
  classAvgCorrectRate: number
  classAvgSubmitRate: number
}

export type StudentReportMasteryLevel = 'advantage' | 'normal' | 'weak'

export interface StudentReportKnowledgePointReport {
  knowledgePointId: string
  knowledgePointName: string
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  correctRate: number
  masteryLevel: StudentReportMasteryLevel
  classAvgCorrectRate: number
  classMaxCorrectRate: number
}

export interface StudentReportMasteryStatistics {
  advantageCount: number
  advantagePercentage: number
  normalCount: number
  normalPercentage: number
  weakCount: number
  weakPercentage: number
  totalCount: number
}

export interface StudentReportMasteryGroup {
  masteryLevel: StudentReportMasteryLevel
  names: string[]
  count: number
}

export interface StudentReportChapterReport {
  chapterId: string
  chapterName: string
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  correctRate: number
  classAvgCorrectRate: number
  classMaxCorrectRate: number
}

export interface StudentReportLiteracyReport {
  coreLiteracyId: string
  literacyCode: string
  literacyName: string
  level: number
  totalQuestions: number
  correctQuestions: number
  masteryRate: number
  classAvgMasteryRate: number
}

export interface StudentReportTrendReport {
  assignmentId: string
  assignmentName: string
  assignmentDate: string
  correctRate: number
  classAvgCorrectRate: number
  classMaxCorrectRate: number
}

export interface StudentReportQuestionTypeReport {
  questionType: string
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  correctRate: number
  classAvgCorrectRate: number
  classMaxCorrectRate: number
}

export interface StudentReportDifficultyReport {
  difficulty: string
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  correctRate: number
  classAvgCorrectRate: number
  classMaxCorrectRate: number
}

export interface StudentReportLevelingReport {
  groupId: string
  groupName: string
  totalAssignments: number
  completedAssignments: number
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  correctRate: number
  submitRate: number
  groupAvgCorrectRate: number
  groupAvgSubmitRate: number
}

export interface StudentReportWrongDistributionItem {
  dimensionType: string
  dimensionValue: string
  wrongCount: number
  wrongPercentage: number
}

export interface StudentReportGetData {
  mainReport: StudentReportMainReport
  knowledgePointReports: StudentReportKnowledgePointReport[]
  knowledgePointMasteryStatistics: StudentReportMasteryStatistics
  knowledgePointMasteryGroups: StudentReportMasteryGroup[]
  chapterReports: StudentReportChapterReport[]
  chapterMasteryStatistics: StudentReportMasteryStatistics
  chapterMasteryGroups: StudentReportMasteryGroup[]
  literacyLevel1Reports: StudentReportLiteracyReport[]
  literacyLevel2Reports: StudentReportLiteracyReport[]
  questionTypeReports: StudentReportQuestionTypeReport[]
  difficultyReports: StudentReportDifficultyReport[]
  levelingReports: StudentReportLevelingReport[]
  trendReports: StudentReportTrendReport[]
  wrongQuestionTypeDistributions: StudentReportWrongDistributionItem[]
  wrongQuestionDifficultyDistributions: StudentReportWrongDistributionItem[]
  comprehensiveComment?: string
}

// 班级对比数据查询参数
/**
 * ClassReportQueryReqVO
 */
export interface ClassReportQueryReqVO {
  classId: string // 班级ID（当前要查看的班级）
  endDate: string // 结束日期
  gradeId: string //年级ID
  startDate: string // 开始日期
  subjectId: string // 学科ID
  teacherId?: string // 教师ID（用于查询其任课班级对比数据，可选，从登录用户上下文获取）
  [property: string]: any
}

/**
 * CommonResultClassReportRespVO
 */
export interface ClassReportRespVO {
  accuracyDistribution?: StudentDistributionVO // 正确率分布（学生分布）
  chapterMasteryGroups?: MasteryGroupVO[] // 章节掌握程度分组
  chapterMasteryStatistics?: MasteryStatisticsVO // 章节掌握程度统计
  chapterReports?: ChapterReportVO[] // 章节报告列表
  classComparisonList?: ClassComparisonVO[] // 班级对比数据列表
  comprehensiveComment?: string // 综合评语（AI生成）
  difficultyReports?: DifficultyReportVO[] // 难度分析报告列表
  knowledgePointMasteryGroups?: MasteryGroupVO[] // 知识点掌握程度分组
  knowledgePointMasteryStatistics?: MasteryStatisticsVO // 知识点掌握程度统计
  knowledgePointReports?: KnowledgePointReportVO[] // 知识点报告列表
  levelingReports?: ClassLevelingReportVO[] // 分层报告列表
  literacyLevel1Reports?: LiteracyReportVO[] // 素养报告列表（Level 1 - 一级素养）
  literacyLevel2Reports?: LiteracyReportVO[] // 素养报告列表（Level 2 - 二级素养）
  mainReport?: MainReportVO // 整体情况主报告
  questionTypeReports?: QuestionTypeReportVO[] // 题型分析报告列表
  submissionDistribution?: StudentDistributionVO // 提交率分布（学生分布）
  trendReports?: ClassTrendReportVO[] // 答题正确率趋势列表
  wrongQuestionDifficultyDistributions?: WrongQuestionDistributionVO[] // 错题难度分布列表
  wrongQuestionTypeDistributions?: WrongQuestionDistributionVO[] // 错题题型分布列表
}

// 正确率分布（学生分布） 提交率分布（学生分布）
export interface StudentDistributionVO {
  aboveCount?: number // 高于平均值人数
  abovePercentage?: number // 高于平均值百分比（%）
  aboveStudents?: StudentInfoVO[] // 高于平均值学生名单
  avgValue?: number // 平均值（%）
  belowCount?: number // 低于平均值人数
  belowPercentage?: number // 低于平均值百分比（%）
  belowStudents?: StudentInfoVO[] // 低于平均值学生名单
  equalCount?: number // 等于平均值人数
  equalPercentage?: number // 等于平均值百分比（%）
  equalStudents?: StudentInfoVO[] // 等于平均值学生名单
  [property: string]: any
}

/**
 * 学生信息 VO（用于学生分布）
 *
 * StudentInfoVO
 */
export interface StudentInfoVO {
  studentName?: string // 学生姓名
  [property: string]: any
}

/**
 * 掌握程度分组 VO
 * 用于卡片展示（按掌握程度分组的知识点/章节列表）
 *
 * MasteryGroupVO
 */
export interface MasteryGroupVO {
  count?: number // 数量
  masteryLevel?: string
  names?: string[]
  [property: string]: any
}

/**
 * 章节掌握程度统计
 *
 * MasteryStatisticsVO
 *
 * 知识点掌握程度统计
 */
export interface MasteryStatisticsVO {
  advantageCount?: number // 优势数量
  advantagePercentage?: number // 优势占比（%）
  normalCount?: number // 一般数量
  normalPercentage?: number // 一般占比（%）
  totalCount?: number // 总数量
  weakCount?: number // 薄弱数量
  weakPercentage?: number // 薄弱占比（%）
  [property: string]: any
}

/**
 * 章节报告 VO（班级报告用）
 *
 * ChapterReportVO
 */
export interface ChapterReportVO {
  chapterId?: string // 章节ID
  chapterName?: string // 章节名称
  classAvgCorrectRate?: number // 班级平均正确率（%）
  classMaxCorrectRate?: number // 班级最高正确率（%）
  classMinCorrectRate?: number // 班级最低正确率（%）
  correctQuestions?: number // 做对题数
  correctRate?: number // 正确率（%）
  masteryLevel?: string // 掌握程度: advantage(>80%)/normal(30%-80%)/weak(<30%)
  totalQuestions?: number // 总题数
  wrongQuestions?: number // 做错题数
  [property: string]: any
}

/**
 * 班级对比 VO
 *
 * ClassComparisonVO
 */
export interface ClassComparisonVO {
  avgCorrectRate?: number // 平均正确率（%）
  avgSubmitRate?: number // 平均提交率（%）
  classId?: string // 班级ID
  className?: string // 班级名称
  isCurrentClass?: boolean // 是否为当前查看的班级
  [property: string]: any
}

/**
 * 难度分析报告 VO（班级报告用）
 *
 * DifficultyReportVO
 */
export interface DifficultyReportVO {
  classAvgCorrectRate?: number // 班级平均正确率（%）
  classMaxCorrectRate?: number // 班级最高正确率（%）
  classMinCorrectRate?: number // 班级最低正确率（%）
  correctQuestions?: number // 做对题数
  correctRate?: number // 正确率（%）
  difficulty?: string // 难度
  totalQuestions?: number // 总题数
  wrongQuestions?: number // 做错题数
  [property: string]: any
}

/**
 * 知识点报告 VO（班级报告用）
 *
 * KnowledgePointReportVO
 */
export interface KnowledgePointReportVO {
  classAvgCorrectRate?: number // 班级平均正确率（%）
  classMaxCorrectRate?: number // 班级最高正确率（%）
  classMinCorrectRate?: number // 班级最低正确率（%）
  correctQuestions?: number // 做对题数
  correctRate?: number // 正确率（%）
  knowledgePointId?: string // 知识点ID
  knowledgePointName?: string // 知识点名称
  masteryLevel?: string // 掌握程度: advantage/normal/weak
  totalQuestions?: number // 总题数
  wrongQuestions?: number // 做错题数
  [property: string]: any
}

/**
 * 分层报告 VO（班级报告用）
 *
 * ClassLevelingReportVO
 */
export interface ClassLevelingReportVO {
  avgCorrectRate?: number // 分层答题平均正确率（%）
  avgSubmitRate?: number // 分层作业平均提交率（%）
  groupId?: string // 分层ID
  groupName?: string // 分层名称
  studentCount?: number // 该层级学生数
  totalAssignments?: number // 作业数
  correctQuestions?: number // 做对题数
  correctRate?: number // 正确率（%）
  [property: string]: any
}

/**
 * 素养报告 VO（班级报告用）
 *
 * LiteracyReportVO
 */
export interface LiteracyReportVO {
  classAvgMasteryRate?: number // 班级平均掌握率（%）
  coreLiteracyId?: string // 核心素养ID
  correctQuestions?: number // 做对题数
  level?: number // 素养层级（0=根/1=一级/2=二级）
  literacyCode?: string // 素养编码
  literacyName?: string // 素养名称
  masteryRate?: number // 掌握率（%）
  otherClassMasteryRates?: ClassComparisonData[]
  totalQuestions?: number // 总题数
  [property: string]: any
}

/**
 * 班级对比数据
 *
 * ClassComparisonData
 */
export interface ClassComparisonData {
  classId?: string // 班级ID
  className?: string // 班级名称
  masteryRate?: number // 掌握率（%）
}

/**
 * 整体情况主报告
 *
 * MainReportVO
 */
export interface MainReportVO {
  classAvgCorrectRate?: number // 班级答题正确率平均值（%）
  classAvgSubmitRate?: number // 班级作业提交率平均值（%）
  completedAssignments?: number // 完成作业数
  correctQuestions?: number // 做对题数
  correctRate?: number // 答题正确率（%）
  submitRate?: number // 作业提交率（%）
  totalAssignments?: number // 作业总数
  totalQuestions?: number // 总题数
  wrongQuestions?: number // 做错题数
}

/**
 * 题型分析报告 VO（班级报告用）
 *
 * QuestionTypeReportVO
 */
export interface QuestionTypeReportVO {
  classAvgCorrectRate?: number // 班级平均正确率（%）
  classMaxCorrectRate?: number // 班级最高正确率（%）
  classMinCorrectRate?: number // 班级最低正确率（%）
  correctQuestions?: number // 做对题数
  correctRate?: number // 正确率（%）
  questionType?: string // 题型
  totalQuestions?: number // 总题数
  wrongQuestions?: number // 做错题数
  [property: string]: any
}

/**
 * 趋势报告 VO（班级报告用，支持多班级对比）
 *
 * ClassTrendReportVO
 */
export interface ClassTrendReportVO {
  assignmentDate?: string // 作业日期
  assignmentId?: string // 作业ID
  assignmentName?: string // 作业名称
  currentClassCorrectRate?: number // 当前班级答题正确率（%）
  otherClassCorrectRates?: Map<string, number> // 其他班级正确率对比（key=班级ID，value=正确率）
  [property: string]: any
}

/**
 * 错题分布 VO
 *
 * WrongQuestionDistributionVO
 */
export interface WrongQuestionDistributionVO {
  dimensionType?: string // 维度类型：question_type(题型) / difficulty(难度)
  dimensionValue?: string // 维度值：选择题/填空题/容易/困难等
  wrongCount?: number // 错题数量
  wrongPercentage?: number // 错题占比（%）
  [property: string]: any
}
