// 学生端通用类型定义（统一管理）
export interface KpiCard {
  key: string
  label: string
  unit?: string
}

export interface MilestoneItem {
  id: string
  title: string
  description: string
  stage: '未开始' | '进行中' | '已达成'
  progress: number
}

export interface ReportSubjectProgress {
  subject: string
  percent: number
}

export interface ReportKpi {
  label: string
  value: string
}

// 学生端错题项类型（用于页面展示）
export interface StudentMistake {
  id: string | number
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'pending' | 'reviewing' | 'mastered'
  question: string
  myAnswer?: string
  correctAnswer?: string
  explanation?: string
  knowledgePoints?: string[]
  createdAt: string
}