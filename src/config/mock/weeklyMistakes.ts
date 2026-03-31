export interface WeeklyMistakeRecord {
  id: string
  title: string
  class: string
  questionCount: number
  createDate: string
  status: 'published' | 'draft' | 'processing'
  grade: string
  subject: string
}

export const weeklyMistakesMock: WeeklyMistakeRecord[] = [
  {
    id: 'wm_1',
    title: '2025.12.12 错题重做(数学) 一年级专属版',
    class: '一年级 LX6-3班',
    questionCount: 10,
    createDate: '2025/12/12',
    status: 'published',
    grade: '一年级',
    subject: '数学'
  },
  {
    id: 'wm_2', 
    title: '2025.12.12 错题重做(数学) 期中复习特辑',
    class: '一年级 LX6-4班',
    questionCount: 7,
    createDate: '2025/12/12',
    status: 'processing',
    grade: '一年级',
    subject: '数学'
  },
  {
    id: 'wm_3',
    title: '2025.12.05 错题重做(语文) 全体学生必练',
    class: '二年级 LX2-1班',
    questionCount: 15,
    createDate: '2025/12/05',
    status: 'processing',
    grade: '二年级',
    subject: '语文'
  },
  {
    id: 'wm_4',
    title: '2025.10.17 错题重做(英语) 语法专项',
    class: '一年级 LX6-2班',
    questionCount: 5,
    createDate: '2025/10/17',
    status: 'published',
    grade: '一年级',
    subject: '英语'
  }
]

export const gradeOptions = [
  { label: '全部年级', value: 'all' },
  { label: '一年级', value: '一年级' },
  { label: '二年级', value: '二年级' },
  { label: '三年级', value: '三年级' }
]

export const subjectOptions = [
  { label: '全科', value: 'all' },
  { label: '数学', value: '数学' },
  { label: '语文', value: '语文' },
  { label: '英语', value: '英语' }
]