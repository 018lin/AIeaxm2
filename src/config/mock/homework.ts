import answerPng1 from '@/assets/images/answer1.png'
import answerPng2 from '@/assets/images/answer2.png'
import answerPng3 from '@/assets/images/answer3.png'
import topicPng1 from '@/assets/images/topic1.png'
import topicPng2 from '@/assets/images/topic2.png'
import topicPng3 from '@/assets/images/topic3.png'
import topicPng4 from '@/assets/images/topic4.png'
import topicPng5 from '@/assets/images/topic5.png'
import topicPng6 from '@/assets/images/topic6.png'
import topicPng7 from '@/assets/images/topic7.png'
import topicPng8 from '@/assets/images/topic8.png'
import type { ScreenRecordTopic } from '@/types/homework'

export const STUDENT_POOL = [
  '丁依淇',
  '卞雨曦',
  '侯宇宸',
  '公梓梦',
  '刘佳涵',
  '刘思索',
  '刘易晨',
  '刘浩然',
  '刘舒心',
  '刘许辰',
  '叶圣远',
  '吕雯萱',
  '吴昊汐',
  '周子舒',
  '夏可芯',
  '姜皓雪',
  '孙铭泽',
  '宋芮齐',
  '崔天琪',
  '于若洋',
  '张子涵',
  '李梓萌',
  '王梓轩',
  '赵子豪',
  '陈思妍',
  '周雨桐',
  '黄梓涵',
  '林子涵',
  '杨梓琪',
  '郑梓萱',
]

const createUsers = (names: string[], img: string) => names.map(name => ({ name, answerImageUrl: img }))

const baseRightUsers = [
  '房明馨',
  '刘朋瑞',
  '周子然',
  '夏浩航',
  '孔添宇',
  '孙嘉泽',
  '孟蒽泽',
  '崔欣妍',
  '张子涵',
  '张思源',
  '王奕辰',
  '张梓涵',
  '李思涵',
  '张云菲',
]
const baseWrongUsers = ['张传琪', '张泺琳', '张玮宸', '朱秋阳', '李佳怡', '李夏霖昊']
const baseOtherUsers = ['李悦琪', '李悦琳', '李惜诺']
const baseHalfUsers = ['李明峻', '王子然']

export const screenRecordTopicsMock: ScreenRecordTopic[] = [
  {
    id: '1',
    number: '1',
    answerUrl: answerPng1,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng1),
      wrongUsers: createUsers(baseWrongUsers, answerPng1),
      ortherUsers: createUsers(baseOtherUsers, answerPng1),
      halfUsers: createUsers(baseHalfUsers, answerPng1),
    },
    url: topicPng1,
  },
  {
    id: '2',
    number: '1.1',
    answerUrl: answerPng2,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng2),
      wrongUsers: createUsers(baseWrongUsers, answerPng2),
      ortherUsers: createUsers([...baseOtherUsers, ...baseHalfUsers], answerPng2),
      halfUsers: [],
    },
    url: topicPng2,
  },
  {
    id: '3',
    number: '2',
    answerUrl: answerPng3,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng3),
      wrongUsers: createUsers(baseWrongUsers, answerPng3),
      ortherUsers: createUsers(baseOtherUsers, answerPng3),
      halfUsers: createUsers(baseHalfUsers, answerPng3),
    },
    url: topicPng3,
  },
  {
    id: '4',
    number: '2.1',
    answerUrl: answerPng1,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng1),
      wrongUsers: createUsers(baseWrongUsers, answerPng1),
      ortherUsers: createUsers([...baseOtherUsers, ...baseHalfUsers], answerPng1),
      halfUsers: [],
    },
    url: topicPng4,
  },
  {
    id: '5',
    number: '2.2',
    answerUrl: answerPng2,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng2),
      wrongUsers: createUsers(baseWrongUsers, answerPng2),
      ortherUsers: createUsers(baseOtherUsers, answerPng2),
      halfUsers: createUsers(baseHalfUsers, answerPng2),
    },
    url: topicPng5,
  },
  {
    id: '6',
    number: '2.3',
    answerUrl: answerPng3,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng3),
      wrongUsers: createUsers(baseWrongUsers, answerPng3),
      ortherUsers: createUsers(baseOtherUsers, answerPng3),
      halfUsers: createUsers(baseHalfUsers, answerPng3),
    },
    url: topicPng6,
  },
  {
    id: '7',
    number: '3',
    answerUrl: answerPng1,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng1),
      wrongUsers: createUsers(baseWrongUsers, answerPng1),
      ortherUsers: createUsers(baseOtherUsers, answerPng1),
      halfUsers: createUsers(baseHalfUsers, answerPng1),
    },
    url: topicPng7,
  },
  {
    id: '8',
    number: '4',
    answerUrl: answerPng2,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng2),
      wrongUsers: createUsers(baseWrongUsers, answerPng2),
      ortherUsers: createUsers(baseOtherUsers, answerPng2),
      halfUsers: createUsers(baseHalfUsers, answerPng2),
    },
    url: topicPng8,
  },
  {
    id: '9',
    number: '5',
    answerUrl: answerPng3,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng3),
      wrongUsers: createUsers(baseWrongUsers, answerPng3),
      ortherUsers: createUsers(baseOtherUsers, answerPng3),
      halfUsers: createUsers(baseHalfUsers, answerPng3),
    },
    url: topicPng1,
  },
  {
    id: '10',
    number: '6',
    answerUrl: answerPng1,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng1),
      wrongUsers: createUsers(baseWrongUsers, answerPng1),
      ortherUsers: createUsers(baseOtherUsers, answerPng1),
      halfUsers: createUsers(baseHalfUsers, answerPng1),
    },
    url: topicPng2,
  },
  {
    id: '11',
    number: '7',
    answerUrl: answerPng2,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng2),
      wrongUsers: createUsers(baseWrongUsers, answerPng2),
      ortherUsers: createUsers(baseOtherUsers, answerPng2),
      halfUsers: createUsers(baseHalfUsers, answerPng2),
    },
    url: topicPng3,
  },
  {
    id: '12',
    number: '8',
    answerUrl: answerPng3,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng3),
      wrongUsers: createUsers(baseWrongUsers, answerPng3),
      ortherUsers: createUsers(baseOtherUsers, answerPng3),
      halfUsers: createUsers(baseHalfUsers, answerPng3),
    },
    url: topicPng4,
  },
  {
    id: '13',
    number: '9',
    answerUrl: answerPng1,
    users: {
      rightUsers: createUsers(baseRightUsers, answerPng1),
      wrongUsers: createUsers(baseWrongUsers, answerPng1),
      ortherUsers: createUsers(baseOtherUsers, answerPng1),
      halfUsers: createUsers(baseHalfUsers, answerPng1),
    },
    url: topicPng5,
  },
]
