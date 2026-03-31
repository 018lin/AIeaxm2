import topicPng1 from '@/assets/images/topic1.png'
import topicPng2 from '@/assets/images/topic2.png'
import topicPng3 from '@/assets/images/topic3.png'
import topicPng4 from '@/assets/images/topic4.png'

type QuestionType = 'choice' | 'blank' | 'judge' | 'answer' | 'calc'
type Difficulty = 'basic' | 'improve' | 'literacy'

export type ChapterQuestion = {
  id: string
  qid: number
  title: string
  img: string
  stem: string
  knowledge: string
  difficulty: Difficulty
  type: QuestionType
  usedCount: number
  date: string
  campus: string
  grade: string
  classNo: string
  subject: string
}

const q = (v: Omit<ChapterQuestion, 'id'>): ChapterQuestion => ({ id: `cq_${v.qid}`, ...v })

export const chapterQuestionsMock: ChapterQuestion[] = [
  q({
    qid: 10001,
    title: '章节题目 1',
    img: topicPng1,
    stem: 'Known for its difficult content...',
    knowledge: '实数',
    difficulty: 'basic',
    type: 'choice',
    usedCount: 10,
    date: '2024-03-25',
    campus: '主校区',
    grade: '四年级',
    classNo: '1班',
    subject: '数学',
  }),
  q({
    qid: 10002,
    title: '章节题目 2',
    img: topicPng2,
    stem: 'Solve for x...',
    knowledge: '正负数',
    difficulty: 'improve',
    type: 'blank',
    usedCount: 5,
    date: '2024-03-26',
    campus: '主校区',
    grade: '四年级',
    classNo: '1班',
    subject: '数学',
  }),
   q({
    qid: 10003,
    title: '章节题目 3',
    img: topicPng3,
    stem: 'Geometry problem...',
    knowledge: '几何',
    difficulty: 'literacy',
    type: 'answer',
    usedCount: 8,
    date: '2024-03-27',
    campus: '主校区',
    grade: '四年级',
    classNo: '1班',
    subject: '数学',
  }),
   q({
    qid: 10004,
    title: '章节题目 4',
    img: topicPng4,
    stem: 'Calculus intro...',
    knowledge: '函数',
    difficulty: 'basic',
    type: 'choice',
    usedCount: 12,
    date: '2024-03-28',
    campus: '主校区',
    grade: '四年级',
    classNo: '1班',
    subject: '数学',
  }),
]