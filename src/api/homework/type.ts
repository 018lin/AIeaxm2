export interface HomeworkListRequest {
  classId?: string
  endTime?: number
  gradeId?: string
  pageNo?: number
  pageSize?: number
  startTime?: number
  subjectId?: string
  [property: string]: any
}

export interface ClassHomeworkVO {
  abnormalCount?: number
  classId?: string
  className?: string
  completedCount?: number
  uncompletedCount?: number
  [property: string]: any
}

export interface HomeworkVO {
  assignmentId?: string
  assignmentName?: string
  assignmentPage?: string | null
  assignmentStatus?: string
  assignmentTime?: number
  assignmentType?: string
  classHomeworkList?: ClassHomeworkVO[]
  gradeId?: string
  gradeName?: string
  subjectId?: string
  subjectName?: string
  [property: string]: any
}

export interface HomeworkListPageVO {
  list?: HomeworkVO[]
  total?: number
  totalPage?: number | null
  [property: string]: any
}

// 作业提交记录详情（class-homework-detail）
export interface StudentHomeworkDetailVO {
  assignmentId?: string
  detailId?: string
  homeworkId?: string
  homeworkStatus?: string
  questionId?: string
  studentAnswerImage?: string
  studentUserId?: string

  // 部分场景接口会补充姓名等展示字段，这里保留可选以便复用
  studentName?: string

  [property: string]: any
}

// 班级作业详情（按题目维度聚合）
export interface ClassHomeworkDetailVO {
  answer?: string
  assignmentId?: string
  correctStudentList?: StudentHomeworkDetailVO[]
  errorStudentList?: StudentHomeworkDetailVO[]
  halfStudentList?: StudentHomeworkDetailVO[]
  explainVideoUrl?: string
  pageNumber?: string
  questionContent?: string
  questionImage?: string
  questionOrder?: string
  [property: string]: any
}

// 班级作业详情请求参数（GET /api/v1/student/homework/class-homework-detail）
export interface ClassHomeworkDetailRequest {
  assignmentId: string
  classId: string
  [property: string]: any
}

// 原作业详情（GET /api/v1/student/homework/original-detail）
export interface OriginalDetailRequest {
  homeworkId?: string
  assignmentId?: string
  studentUserId?: string
  [property: string]: any
}

export interface OriginalDetailVO {
  id?: string | null
  fileName?: string | null
  attachmentId?: string | null
  assignmentId?: string | null
  homeworkStatus?: string | null
  scanTime?: string | number | null
  // 二维码信息：后端可能返回 JSON 字符串，或已经解析后的对象
  qrcodeContent?: string | Record<string, any> | null
  errorReason?: string | null
  batchId?: string | null
  homeworkId?: string | null
  studentUserId?: string | null
  // 批阅结果：兼容字符串（未解析）和对象（已解析）两种形式
  auditResult?: ParsedAuditResult | string | null
  attachmentUrl?: string | null
  [property: string]: any
}

// 作业详情正确率统计 (GET /api/v1/student/homework/statistics)
export interface AssignmentStatisticsRequest {
  assignmentId: string
  classId: string
  [property: string]: any
}

export interface AssignmentStatisticsVO {
  assignmentId?: string
  assignmentName?: string
  correctRate?: number
  page?: number
  questionNumber?: number
  [property: string]: any
}

// 试卷题目统计 (GET /api/v1/student/homework/question-statistics)
export interface QuestionStatisticsRequest {
  assignmentId: string
  classId: string
}

export interface QuestionStatisticsVO {
  assignmentId?: string
  assignmentName?: string
  averageCorrectRate?: number
  questionStatisticsList?: QuestionStatistics[]
  submitCount?: number
  totalCount?: number
}

export interface QuestionStatistics {
  answerContent?: string
  correctCount?: number
  correctRate?: number
  halfCorrectCount?: number
  inCorrectCount?: number
  pageNumber?: string
  questionId?: string
  questionOrder?: string
  questionType?: string
}

// 试卷学生统计 (GET /api/v1/student/homework/student-statistics)
export interface StudentStatisticsRequest {
  assignmentId: string
  classId: string
}

export interface StudentStatisticsVO {
  assignmentId?: string
  assignmentName?: string
  averageCorrectRate?: number
  questionList?: StudentStatisticsQuestionInfo[]
  studentRows?: StudentStatisticsStudentRow[]
  submitCount?: number
  submitRate?: number
  totalCount?: number
}

export interface StudentStatisticsQuestionInfo {
  pageNumber?: string
  questionId?: string
  questionOrder?: string
}

export interface StudentStatisticsStudentRow {
  correctCount?: number
  halfCorrectCount?: number
  incorrectCount?: number
  overallCorrectRate?: number
  questionResults?: StudentStatisticsQuestionResult[]
  studentId?: string
  studentName?: string
}

export interface StudentStatisticsQuestionResult {
  gradeResult?: GradeResult | null
  questionOrder?: string
}

// 判题结果：接口可能返回驼峰风格
export type GradeResult = 'Correct' | 'Incorrect' | 'CorrectAndIncorrect'

// 原作业批阅结果（auditResult 解析后的结构，坐标原点在卷子左上角 (0,0)）
export interface AuditResultPoint {
  x: number
  y: number
}

export interface AnswerAreaCalculate {
  area_id: number
  pos_list: AuditResultPoint[][]
}

export interface GradingResult {
  status?: 'Correct' | 'Incorrect' | 'CorrectAndIncorrect'
  [property: string]: any
}

export interface AuditResultQuestionLevel2 {
  answerAreasCalculate?: AnswerAreaCalculate[]
  grading_result?: GradingResult
  [property: string]: any
}

export interface AuditResultPage {
  pageNumber?: number
  bigImgWidth?: number
  bigImgHeight?: number
  // 旧版字段：questionsLevel1 -> questionsLevel2
  questionsLevel1?: { questionsLevel2?: AuditResultQuestionLevel2[] }[]
  // 新版字段：questionLevels -> secondQuestionLevels
  questionLevels?: { secondQuestionLevels?: AuditResultQuestionLevel2[] }[]
}

export interface ParsedAuditResult {
  // 旧版结构：correctionResult.pages
  correctionResult?: {
    pages?: AuditResultPage[]
  }
  // 新版结构：直接返回 pages 数组
  pages?: AuditResultPage[]
}

// 获取需要人工批阅的题目和学生（GET /api/v1/student/homework/manual-grading-list）
export interface ManualGradingListRequest {
  assignmentId: string
  classId: string
  [property: string]: any
}

export interface NeedGradingHomeworkVO {
  answerAttachment?: string
  answerContent?: string
  homeworkDetailId?: string
  answerAreas?: string // 坐标答题区（JSON 字符串）
  gradingResult?: string // 整题判定（Correct/Incorrect/CorrectAndIncorrect）
  gradingResultStr?: string // 每个空的批阅结果（JSON 字符串，数组）
}

export interface ManualGradingQuestionVO {
  homeworkId?: string
  homeworkList?: NeedGradingHomeworkVO[]
  studentCode?: string
  studentName?: string
  studentUserId?: string
  [property: string]: any
}

export interface ManualGradingHomeworkVO {
  assignmentId?: string
  classId?: string
  questions?: ManualGradingQuestionVO[]
  [property: string]: any
}

// 人工批阅（POST /api/v1/student/homework/manual-grading）
export interface ManualGradingRequest {
  homeworkDetailId: string
  gradingResultStr: string
  gradingResult?: 'Correct' | 'Incorrect' | 'CorrectAndIncorrect'
  [property: string]: any
}

// 上传文件 - POST /v1/file/upload
export interface UploadFileRequest {
  category?: string
  file: File | Blob
  [property: string]: any
}

export interface AttachmentVO {
  attachmentId?: string
  attachmentStatus?: string
  bucketName?: string
  createTime?: string
  fileName?: string
  filePath?: string
  fileSize?: number
  fileType?: string
  id?: number
  mimeType?: string
  storagePlatform?: string
  updateTime?: string
  [property: string]: any
}

export type UploadFileResponse = AttachmentVO

export const AI_GRADING_MATERIAL_SOURCE_OPTIONS = [
  { source: 'scanner_scan', sourceName: '扫描机扫描' },
  { source: 'mobile_photo_upload', sourceName: '移动端拍照上传' },
] as const

export type AiGradingMaterialSource = (typeof AI_GRADING_MATERIAL_SOURCE_OPTIONS)[number]['source']

export interface AiGradingMaterialSourceOption {
  source: AiGradingMaterialSource
  sourceName: string
}

export interface ScannerScanMaterialRequest {
  assignmentId: string
  classId?: string
  scanBatchId?: string
  source?: Extract<AiGradingMaterialSource, 'scanner_scan'>
  [property: string]: any
}

export interface MobilePhotoUploadMaterialRequest extends UploadFileRequest {
  assignmentId: string
  classId?: string
  studentUserId?: string
  source?: Extract<AiGradingMaterialSource, 'mobile_photo_upload'>
  [property: string]: any
}

/**
 * 创建讲解并上传视频 - POST /api/v1/teacher-explanation/create
 */
export interface TeacherExplanationCreateRequest {
  coverAttaId?: string
  duration?: number
  explanationName: string
  questionId: string
  remark?: string
  videoAttaId: string
  [property: string]: any
}

export type TeacherExplanationCreateResponse = number
