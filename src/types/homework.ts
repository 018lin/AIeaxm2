export type GroupKey = 'correct' | 'wrong' | 'half' | 'unsubmitted' | 'nograded'

export type ActiveGroupKey = GroupKey | ''

export type ModalJudge = Exclude<GroupKey, 'unsubmitted'>

export type TabKey = 'pages' | 'student_stats' | 'students' | 'origin-work' | 'ai'

export type DetailTab = {
  key: TabKey
  label: string
  to: string
}

export type StudentCard = {
  id: string
  name: string
  img?: string
}

export type StudentSummaryRow = {
  id: string
  name: string
  correct: number
  wrong: number
  completion: number
  cells: Record<string, GroupKey>
}

export type WeakPoint = {
  key: string
  title: string
  wrongRate: number
}

export type PageInfo = {
  id: string
  index: number
  label: string
  correctRate: number
}

export type StudentStatsRow = {
  id: string
  pageNo: number
  questionNo: number
  qType: string
  answer: string
  correctRate: number
  correctCount: number
  halfCorrectCount: number
  wrongCount: number
  distKey: string
}

export type QDist = {
  id: string
  no: number
  correctRate: number
  correct: number
  wrong: number
  half: number
  unsubmitted: number
}

export type Status = 'published' | 'draft' | 'completed' | 'grading' | 'processing' | 'finalized'

export type AssignmentRow = {
  id: string
  title: string
  paperSource?: string
  scanDate?: string
  createdAt: string
  homeworktype: string
  status: Status
  grade: string
  subject: string
  completedPage: string
  submissions: number | string
  submittedCount: number
  unsubmittedCount: number
  abnormalPages: number
  pendingPages: number
  avgScore: number | null
}

export type ReviewStudentStatus = 'to_grade' | 'done'

export type ReviewStudent = {
  id: string
  name: string
  studentNo: string
  status: ReviewStudentStatus
}

export type ReviewQuestion = {
  id: string
  key: string
  title: string
  fullScore: number
  img: string
}

export type ReviewWork = {
  studentId: string
  questionId: string
  img: string
  graded: boolean
  judgement?: 'correct' | 'partial' | 'wrong'
  score?: number
  issueIds?: string[]
  feedback?: string
}

export type ReviewIssue = {
  id: string
  label: string
}

export type ReviewToolKey = 'correct' | 'wrong' | 'half' | 'pen'

export type FixReasonKey = '' | 'correct_but_ocr_wrong' | 'wrong_student_no' | 'handwriting' | 'position_or_context'

export interface FixReasonOption {
  value: FixReasonKey
  label: string
  desc: string
}

export interface ScreenRecordUser {
  name: string
  answerImageUrl?: string
}

export interface ScreenRecordTopicUsers {
  rightUsers: ScreenRecordUser[]
  wrongUsers: ScreenRecordUser[]
  ortherUsers: ScreenRecordUser[]
  halfUsers: ScreenRecordUser[]
}

export interface ScreenRecordTopic {
  id: string
  answerUrl: string
  users: ScreenRecordTopicUsers
  number: string
  url: string
  /** 题目文本（用于 canvas 回显，无题目图时展示） */
  questionContent?: string
  /** 答案文本（用于 canvas 回显「答案」区域） */
  answerText?: string
}

export interface ModalContext {
  questionId: string
  studentId: string
  questionLabel: string
  studentName: string
  studentImg: string
  group: ModalJudge
}

export interface StatsSummary {
  schoolName: string
  paperText: string
  total: number
  unsubmitted: number
  unsubmittedNames: string
  avgCorrectRate: string
}

export interface ClassKpi {
  total: number
  submitted: number
  unsubmitted: number
  submitRate: number
  avgAccuracy: number
  all: number
}

export interface FixStudentIdForm {
  search: string
  associateKey: string
  studentNo: string
  // 保留字段，当前仅前端展示原因，不再做必填校验
  reasonKey: FixReasonKey
}

export interface JudgeForm {
  judgement: 'correct' | 'partial' | 'wrong'
  score: number
  issueIds: string[]
  feedback: string
}

// 原作业
export type StuGroupKey = 'submitted' | 'unsubmitted' | 'abnormal'

export type OriginalWorkRow = {
  id: string
  name?: string
  img?: string
  studentNo: string
  homeworkIds?: string[]
  submitted?: boolean
  isLack?: boolean
}

export type OriginalWorkData = Record<StuGroupKey, OriginalWorkRow[]>

export type StuItem = {
  key: string
  group: StuGroupKey
  rawId: string
  name: string
  img: string
  studentNo: string
  homeworkIds?: string[]
  badge: string
  isLack: boolean
  raw?: OriginalWorkRow
}

export type StuGroupSection = {
  key: StuGroupKey
  title: string
  items: StuItem[]
}
