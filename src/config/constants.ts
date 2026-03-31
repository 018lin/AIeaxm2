export type CoreQuestionType = 'choice' | 'blank' | 'answer' | 'judge' | 'multiple_choice'
export type CoreDifficulty = 'easy' | 'medium' | 'hard'

export const QuestionTypeLabel: Record<QuestionTypeCode, string> = {
  choice: '选择题',
  blank: '填空题',
  answer: '解答题',
  judge: '判断题',
  multiple_choice: '多选题'
}

export const LabelToQuestionType: Record<string, QuestionTypeCode> = {
  '选择题': 'choice',
  '填空题': 'blank',
  '解答题': 'answer',
  '判断题': 'judge',
  '多选题': 'multiple_choice'
}

export const DifficultyLabel: Record<DifficultyCode, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

export const LabelToDifficulty: Record<string, DifficultyCode> = {
  '简单': 'easy',
  '中等': 'medium',
  '困难': 'hard'
}

export const SubjectColors: Record<string, string> = {
  '数学': 'blue',
  '语文': 'green',
  '英语': 'orange',
  '物理': 'purple',
  '化学': 'red'
}

export const DifficultyColors: Record<string, string> = {
  '简单': 'green',
  '中等': 'orange',
  '困难': 'red'
}
export type QuestionTypeCode = 'choice' | 'blank' | 'answer' | 'judge' | 'multiple_choice'
export type DifficultyCode = 'easy' | 'medium' | 'hard'

export const DEFAULT_GRADE = 'grade10'
export const DEFAULT_SUBJECT = '数学'
export const DEFAULT_KNOWLEDGE_POINT = '未识别知识点'
export const DEFAULT_DIFFICULTY: DifficultyCode = 'medium'

export const SOURCE_PRIORITY: Record<string, number> = {
  commonError: 4,
  mistake: 3,
  knowledge: 2,
  basket: 2,
  aiSimilar: 1,
  unknown: 0
}
