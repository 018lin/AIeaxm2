export type TrendSeries = { name: string; color: string; data: number[] }

export type ClassDataComparisonItem = {
  className: string
  submissionRate: number
  accuracyRate: number
}

export type SubjectCompetencyLegendItem = { name: string; color: string }

export type StratifiedPanel = {
  key: string
  titleCn: string
  titleEn: string
  completed: number
  totalAssignments: number
  correct: number
  totalQuestions: number
  accuracy: number
  submitRate: number
  avgSubmitRate: number
  avgAccuracyRate: number
}

export type MistakeDonutItem = { name: string; value: number; color: string }

export type MistakeDifficultyItem = { name: string; value: number; color: string; level: string }

export type MasteryTableItem = {
  name: string
  totalQuestions: number
  wrongQuestions: number
  correctRate: number
  classAvgCorrectRate: number
  classMaxCorrectRate: number
}

export type QuestionTypeRow = {
  key: string
  name: string
  total: number
  wrong: number
  personRate: number
  classRate: number
  maxRate: number
}

export type QuestionDifficultyRow = {
  key: string
  name: string
  total: number
  wrong: number
  personRate: number
  classRate: number
  classMaxCorrectRate: number
  tagTone: 'tone-easy' | 'tone-mid' | 'tone-hard'
}
