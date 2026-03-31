export type GradingStatus = 'ungraded' | 'graded' | 'done' | (string & {})

export interface ReviewStudent {
  id: string
  name: string
  studentNo: string
  gradingStatus: GradingStatus
}

export type ToolKeyType = 'correct' | 'wrong' | 'half' | 'pen'

export interface ReviewQuestion {
  id: string
  key: string
  title: string
  fullScore: number
  img: string
}

export type TabKey = 'pages' | 'student_stats' | 'students' | 'origin-work' | 'ai'

export interface DetailTab {
  key: TabKey
  label: string
  to: string
}
