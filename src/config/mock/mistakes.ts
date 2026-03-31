import topicPng1 from '@/assets/images/topic1.png'
import topicPng2 from '@/assets/images/topic2.png'
import topicPng3 from '@/assets/images/topic3.png'
import topicPng4 from '@/assets/images/topic4.png'
import topicPng5 from '@/assets/images/topic5.png'
import topicPng6 from '@/assets/images/topic6.png'
import topicPng7 from '@/assets/images/topic7.png'
import topicPng8 from '@/assets/images/topic8.png'
import type { StudentRow } from '@/types/mistakes/list'

type QuestionType = 'choice' | 'blank' | 'judge' | 'answer' | 'calc'

type Difficulty = 'basic' | 'improve' | 'literacy'

type MistakeQuestion = {
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

const q = (v: Omit<MistakeQuestion, 'id'>): MistakeQuestion => ({ id: `mq_${v.qid}`, ...v })

export const mistakesQuestionsMock: MistakeQuestion[] = [
  q({
    qid: 29381,
    title: '错题图片 1',
    img: topicPng1,
    stem: '',
    knowledge: '几何',
    difficulty: 'improve',
    type: 'blank',
    usedCount: 14,
    date: '2024-03-20',
    campus: '主校区',
    grade: '高一',
    classNo: '01班',
    subject: '数学',
  }),
  q({
    qid: 30129,
    title: '错题图片 2',
    img: topicPng2,
    stem: '',
    knowledge: '代数',
    difficulty: 'literacy',
    type: 'answer',
    usedCount: 18,
    date: '2024-03-22',
    campus: '主校区',
    grade: '高一',
    classNo: '02班',
    subject: '数学',
  }),
  q({
    qid: 28810,
    title: '错题图片 3',
    img: topicPng3,
    stem: '',
    knowledge: '统计',
    difficulty: 'basic',
    type: 'choice',
    usedCount: 17,
    date: '2024-02-18',
    campus: '西校区',
    grade: '高一',
    classNo: '03班',
    subject: '数学',
  }),
  q({
    qid: 27654,
    title: '错题图片 4',
    img: topicPng4,
    stem: '',
    knowledge: '函数',
    difficulty: 'basic',
    type: 'blank',
    usedCount: 9,
    date: '2024-01-12',
    campus: '主校区',
    grade: '高一',
    classNo: '01班',
    subject: '数学',
  }),
  q({
    qid: 31207,
    title: '错题图片 5',
    img: topicPng5,
    stem: '',
    knowledge: '三角函数',
    difficulty: 'improve',
    type: 'calc',
    usedCount: 12,
    date: '2024-03-10',
    campus: '东校区',
    grade: '高一',
    classNo: '02班',
    subject: '数学',
  }),
  q({
    qid: 31990,
    title: '错题图片 6',
    img: topicPng6,
    stem: '',
    knowledge: '函数',
    difficulty: 'improve',
    type: 'judge',
    usedCount: 6,
    date: '2023-12-28',
    campus: '主校区',
    grade: '高一',
    classNo: '04班',
    subject: '数学',
  }),
  q({
    qid: 30518,
    title: '错题图片 7',
    img: topicPng7,
    stem: '',
    knowledge: '几何',
    difficulty: 'literacy',
    type: 'answer',
    usedCount: 8,
    date: '2024-02-02',
    campus: '西校区',
    grade: '高一',
    classNo: '02班',
    subject: '数学',
  }),
  q({
    qid: 29402,
    title: '错题图片 8',
    img: topicPng8,
    stem: '',
    knowledge: '代数',
    difficulty: 'basic',
    type: 'calc',
    usedCount: 21,
    date: '2024-03-05',
    campus: '东校区',
    grade: '高一',
    classNo: '03班',
    subject: '数学',
  }),
  q({
    qid: 31066,
    title: '错题图片 9',
    img: topicPng1,
    stem: '',
    knowledge: '统计',
    difficulty: 'improve',
    type: 'judge',
    usedCount: 5,
    date: '2024-01-30',
    campus: '主校区',
    grade: '高一',
    classNo: '01班',
    subject: '数学',
  }),
  q({
    qid: 29973,
    title: '错题图片 10',
    img: topicPng2,
    stem: '',
    knowledge: '函数',
    difficulty: 'literacy',
    type: 'answer',
    usedCount: 7,
    date: '2024-02-26',
    campus: '主校区',
    grade: '高一',
    classNo: '03班',
    subject: '数学',
  }),
  q({
    qid: 28711,
    title: '错题图片 11',
    img: topicPng3,
    stem: '',
    knowledge: '几何',
    difficulty: 'basic',
    type: 'calc',
    usedCount: 11,
    date: '2024-03-01',
    campus: '西校区',
    grade: '高一',
    classNo: '02班',
    subject: '数学',
  }),
  q({
    qid: 32218,
    title: '错题图片 12',
    img: topicPng4,
    stem: '',
    knowledge: '三角函数',
    difficulty: 'basic',
    type: 'choice',
    usedCount: 16,
    date: '2024-02-09',
    campus: '东校区',
    grade: '高一',
    classNo: '04班',
    subject: '数学',
  }),
]

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const buildProgress = (destroy: number, redo: number, wrongTotal: number, answerTotal: number) => {
  const total = Math.max(1, Number(answerTotal) || 1)

  const destroyPct = clamp(Math.round((destroy / total) * 100), 0, 100)
  const redoPct = clamp(Math.round((redo / total) * 100), 0, 100 - destroyPct)
  const wrongPct = clamp(Math.round((wrongTotal / total) * 100), 0, 100 - destroyPct - redoPct)

  return { destroyPct, redoPct, wrongPct }
}

export const studentRowsMock: StudentRow[] = [
  {
    id: 's1',
    name: '李易允',
    destroy: 12,
    redo: 5,
    wrongTotal: 68,
    answerTotal: 75,
    progress: buildProgress(12, 5, 68, 75),
  },
  {
    id: 's2',
    name: '钟可',
    destroy: 8,
    redo: 2,
    wrongTotal: 57,
    answerTotal: 80,
    progress: buildProgress(8, 2, 57, 80),
  },
  {
    id: 's3',
    name: '刘奕涵',
    destroy: 20,
    redo: 15,
    wrongTotal: 49,
    answerTotal: 79,
    progress: buildProgress(20, 15, 49, 79),
  },
  {
    id: 's4',
    name: '彭凡月',
    destroy: 0,
    redo: 0,
    wrongTotal: 39,
    answerTotal: 66,
    progress: buildProgress(0, 0, 39, 66),
  },
  {
    id: 's5',
    name: '刘世宏',
    destroy: 5,
    redo: 4,
    wrongTotal: 38,
    answerTotal: 63,
    progress: buildProgress(5, 4, 38, 63),
  },
  {
    id: 's6',
    name: '赵子上',
    destroy: 14,
    redo: 10,
    wrongTotal: 37,
    answerTotal: 63,
    progress: buildProgress(14, 10, 37, 63),
  },
  {
    id: 's7',
    name: '巨锟玮',
    destroy: 2,
    redo: 0,
    wrongTotal: 35,
    answerTotal: 73,
    progress: buildProgress(2, 0, 35, 73),
  },
]
