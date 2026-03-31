// 组卷记录传参
export interface ListExaminationParams {
  pageNo: number
  pageSize: number
  assignmentType: string
  startDate?: string
  endDate?: string
  gradeId?: string
  subjectId?: string
}

export interface onePaperTypes {
  type?: string
  column: number
  width: number
  height: number
}
export interface paperTypes {
  A3: onePaperTypes
  A4: onePaperTypes
  A4DC: onePaperTypes
}

export type PaperType = 'A4' | 'A3'

export interface topicTypes {
  name: string
  type: string
  id: number
  url: string
}

export interface topicInfoTypes {
  title: string
  grade: string
  subject: string
  qrCode: string
  code: string
}

export interface topicInfoTypes {
  title: string
  grade: string
  subject: string
  qrCode: string
  code: string
}

export interface ExamQuestion {
  id: number
  type: string
  difficulty: string
  content: string
}

export interface ExamQuestion {
  id: number
  type: string
  difficulty: string
  content: string
}

export interface ExamQuestion {
  id: number
  type: string
  difficulty: string
  content: string
}
