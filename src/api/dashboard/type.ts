export interface TeacherOverviewVO {
  accuracy?: string // 本月作业正确率
  classCount?: string // 班级数量
  studentCount?: string // 学生数量
  workCount?: string // 本月作业数量
}

export interface StudentOverviewVO {
  aboveCount?: string
  aboveRatio?: string
  avgCount?: string
  avgRate?: string
  avgRatio?: string
  belowCount?: string
  belowRatio?: string
  classId?: string
  className?: string
  avgList?: string[]
  aboveList?: string[]
  belowList?: string[]
  studentList?: string[]
}

export interface QuestionCountVO {
  newQuestionCount?: number
  newSelfQuestionCount?: number
  newSubjectQuestionCount?: number
  selfQuestionCount?: number
  subjectQuestionCount?: number
  totalQuestionCount?: number
}

export interface HomeworkRecentVO {
  assignmentId?: string
  assignmentName?: string
  firstSubmitTime?: string
  gradeId?: string
  gradeName?: string
  subjectId?: string
  subjectName?: string
  groupProgressList?: GroupProgressVO[]
  [property: string]: any
}

export interface GroupProgressVO {
  classId?: string
  className?: string
  groupId?: string
  groupName?: string
  type?: string
  submittedCount?: number
  totalCount?: number
  gradedCount?: number
  needGradingCount?: number
  [property: string]: any
}

export interface HomeworkRecentVO {
  assignmentId?: string
  assignmentName?: string
  firstSubmitTime?: string
  gradeId?: string
  gradeName?: string
  subjectId?: string
  subjectName?: string
  groupProgressList?: GroupProgressVO[]
  [property: string]: any
}

export interface GroupProgressVO {
  classId?: string
  className?: string
  groupId?: string
  groupName?: string
  type?: string
  submittedCount?: number
  totalCount?: number
  gradedCount?: number
  needGradingCount?: number
  [property: string]: any
}

export interface HomeworkRecentVO {
  assignmentId?: string
  assignmentName?: string
  firstSubmitTime?: string
  gradeId?: string
  gradeName?: string
  subjectId?: string
  subjectName?: string
  groupProgressList?: GroupProgressVO[]
  [property: string]: any
}

export interface GroupProgressVO {
  classId?: string
  className?: string
  groupId?: string
  groupName?: string
  type?: string
  submittedCount?: number
  totalCount?: number
  gradedCount?: number
  needGradingCount?: number
  [property: string]: any
}
