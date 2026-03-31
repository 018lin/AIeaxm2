export type QuestionType = 'all' | 'choice' | 'blank' | 'judge' | 'answer' | 'calc'

export type Difficulty = 'all' | 'basic' | 'improve' | 'literacy'

export type TimeKey = 'all' | '3m' | '6m' | '1y'

export type MistakeQuestion = {
  id: string
  qid: number
  title: string
  img: string
  stem: string
  knowledge: string
  difficulty: Exclude<Difficulty, 'all'>
  type: Exclude<QuestionType, 'all'>
  usedCount: number
  date: string
  campus: string
  grade: string
  classNo: string
  subject: string
}