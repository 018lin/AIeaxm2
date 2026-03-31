import ansErrorImg from './questionList/answer/ans-error.jpeg'
import ansHalfImg from './questionList/answer/ans-half-error.jpeg'
import ans01Img from './questionList/answer/ans01.jpeg'
import que01Img from './questionList/imgs/que01.png'
import que02Img from './questionList/imgs/que02.png'
import que03Img from './questionList/imgs/que03.png'
import que04Img from './questionList/imgs/que04.png'

export const assignmentDetailQuestionsMock = [
  {
    assignmentItemId: 'q_1_1',
    pageNumber: '1',
    order: '1',
    questionContent: que01Img,
    questionType: '6',
    analysisImage: ans01Img,
    distribution: {
      true: 18,
      false: 2,
      halfRight: 1,
    },
    distributionDetail: {
      true: [
        { id: 'c_1_2_1', studentName: '元雨晴', img: ans01Img, studentCode: '220101' },
        { id: 'c_1_2_2', studentName: '叶圣远', img: ans01Img, studentCode: '220102' },
        { id: 'c_1_2_3', studentName: '吕妤宣', img: ans01Img, studentCode: '220103' },
        { id: 'c_1_2_4', studentName: '吴雯汐', img: ans01Img, studentCode: '220104' },
        { id: 'c_1_2_5', studentName: '周子舒', img: ans01Img, studentCode: '220105' },
        { id: 'c_1_2_6', studentName: '王一鸣', img: ans01Img, studentCode: '220106' },
        { id: 'c_1_2_7', studentName: '刘昊然', img: ans01Img, studentCode: '220107' },
        { id: 'c_1_2_8', studentName: '田五', img: ans01Img, studentCode: '220108' },
        { id: 'c_1_2_9', studentName: '李皮皮', img: ans01Img, studentCode: '220109' },
        { id: 'c_1_2_10', studentName: '刘鑫', img: ans01Img, studentCode: '220110' },
        { id: 'c_1_2_11', studentName: '曹子琪', img: ans01Img, studentCode: '220111' },
        { id: 'c_1_2_12', studentName: '陈一凡', img: ans01Img, studentCode: '220112' },
        { id: 'c_1_2_13', studentName: '张筱蓉', img: ans01Img, studentCode: '220113' },
        { id: 'c_1_2_14', studentName: '张三', img: ans01Img, studentCode: '220114' },
        { id: 'c_1_2_15', studentName: '赵小', img: ans01Img, studentCode: '220115' },
        { id: 'c_1_2_16', studentName: '黄洒', img: ans01Img, studentCode: '220116' },
        { id: 'c_1_2_17', studentName: '王多多', img: ans01Img, studentCode: '220117' },
        { id: 'c_1_2_18', studentName: '王羲之', img: ans01Img, studentCode: '220118' },
      ],
      false: [
        { id: 'w_1_1_1', studentName: '公梓琴', img: ansErrorImg, studentCode: '220119' },
        { id: 'w_1_1_2', studentName: '张宇轩', img: ansErrorImg, studentCode: '220120' },
      ],
      halfRight: [{ id: 'h_1_1_1', studentName: '赵雨桐', img: ansHalfImg, studentCode: '220121' }],
    },
  },
  {
    assignmentItemId: 'q_1_2',
    pageNumber: '1',
    order: '2',
    questionContent: que02Img,
    questionType: '1920',
    analysisImage: ans01Img,
    distribution: {
      true: 7,
      false: 4,
      halfRight: 0,
    },
    distributionDetail: {
      true: [
        { id: 'c_1_2_1', studentName: '元雨晴', img: ans01Img },
        { id: 'c_1_2_2', studentName: '叶圣远', img: ans01Img },
        { id: 'c_1_2_3', studentName: '吕妤宣', img: ans01Img },
        { id: 'c_1_2_4', studentName: '吴雯汐', img: ans01Img },
        { id: 'c_1_2_5', studentName: '周子舒', img: ans01Img },
        { id: 'c_1_2_6', studentName: '王一鸣', img: ans01Img },
        { id: 'c_1_2_7', studentName: '刘昊然', img: ans01Img },
      ],
      false: [
        { id: 'w_1_2_1', studentName: '公梓琴', img: ansErrorImg },
        { id: 'w_1_2_2', studentName: '张宇轩', img: ansErrorImg },
        { id: 'w_1_2_3', studentName: '李梦瑶', img: ansErrorImg },
        { id: 'w_1_2_4', studentName: '孙浩', img: ansErrorImg },
      ],
      halfRight: [],
    },
  },
  {
    assignmentItemId: 'q_1_3',
    pageNumber: '1',
    order: '3',
    questionContent: que03Img,
    questionType: '48',
    analysisImage: ans01Img,
    distribution: {
      true: 7,
      false: 1,
      halfRight: 1,
    },
    distributionDetail: {
      true: [
        { id: 'c_1_2_1', studentName: '元雨晴', img: ans01Img },
        { id: 'c_1_2_2', studentName: '叶圣远', img: ans01Img },
        { id: 'c_1_2_3', studentName: '吕妤宣', img: ans01Img },
        { id: 'c_1_2_4', studentName: '吴雯汐', img: ans01Img },
        { id: 'c_1_2_5', studentName: '周子舒', img: ans01Img },
        { id: 'c_1_2_6', studentName: '王一鸣', img: ans01Img },
        { id: 'c_1_2_7', studentName: '刘昊然', img: ans01Img },
      ],
      false: [{ id: 'w_1_3_1', studentName: '公梓琴', img: ansErrorImg }],
      halfRight: [{ id: 'h_1_3_1', studentName: '赵雨桐', img: ansHalfImg }],
    },
  },
  {
    assignmentItemId: 'q_1_4',
    pageNumber: '1',
    order: '4',
    questionContent: que04Img,
    questionType: '3/5',
    analysisImage: ans01Img,
    distribution: {
      true: 3,
      false: 4,
      halfRight: 1,
    },
    distributionDetail: {
      true: [
        { id: 'c_1_2_1', studentName: '元雨晴', img: ans01Img },
        { id: 'c_1_2_2', studentName: '叶圣远', img: ans01Img },
        { id: 'c_1_2_3', studentName: '吕妤宣', img: ans01Img },
      ],
      false: [
        { id: 'w_1_4_1', studentName: '吴雯汐', img: ansErrorImg },
        { id: 'w_1_4_2', studentName: '周子舒', img: ansErrorImg },
        { id: 'w_1_4_3', studentName: '王一鸣', img: ansErrorImg },
        { id: 'w_1_4_4', studentName: '刘昊然', img: ansErrorImg },
      ],
      halfRight: [{ id: 'h_1_4_1', studentName: '孙佳宁', img: ansHalfImg }],
    },
  },
  {
    assignmentItemId: 'q_2_1',
    pageNumber: '2',
    order: '1',
    questionContent: que01Img,
    questionType: '12',
    analysisImage: ans01Img,
    distribution: {
      true: 7,
      false: 2,
      halfRight: 1,
    },
    distributionDetail: {
      true: [
        { id: 'c_1_2_1', studentName: '元雨晴', img: ans01Img },
        { id: 'c_1_2_2', studentName: '叶圣远', img: ans01Img },
        { id: 'c_1_2_3', studentName: '吕妤宣', img: ans01Img },
        { id: 'c_1_2_4', studentName: '吴雯汐', img: ans01Img },
        { id: 'c_1_2_5', studentName: '周子舒', img: ans01Img },
        { id: 'c_1_2_6', studentName: '王一鸣', img: ans01Img },
        { id: 'c_1_2_7', studentName: '刘昊然', img: ans01Img },
      ],
      false: [
        { id: 'w_2_1_1', studentName: '公梓琴', img: ansErrorImg },
        { id: 'w_2_1_2', studentName: '张宇轩', img: ansErrorImg },
      ],
      halfRight: [{ id: 'h_2_1_1', studentName: '赵雨桐', img: ansHalfImg }],
    },
  },
]

export const assignmentOriginalWorkMock = {
  submitted: [
    { id: 'sub_1', name: '元雨晴', img: ans01Img, studentNo: '2204003', submitted: true },
    { id: 'sub_2', name: '叶圣远', img: ans01Img, studentNo: '2204005', submitted: true },
  ],
  unsubmitted: [
    { id: 'uns_1', name: '张一豪', img: que01Img, studentNo: '2204001', submitted: false },
    { id: 'uns_2', name: '张淑意', img: que02Img, studentNo: '2204010', submitted: false },
  ],
  toGrade: [
    { id: 'tg_1', name: '公梓琴', img: ansErrorImg, studentNo: '2204007' },
    { id: 'tg_2', name: '赵雨桐', img: ansHalfImg, studentNo: '2204012' },
  ],
  uncollected: [
    { id: 'uc_1', img: que03Img, studentNo: '' },
    { id: 'uc_2', img: que04Img, studentNo: '' },
  ],
}

export const assignmentManualReviewMock = {
  summary: { graded: 24, total: 45 },
  questions: [
    { id: 'mq_1', key: 'Q1', title: '数学应用题 - 几何证明', fullScore: 5, img: que01Img },
    { id: 'mq_2', key: 'Q2', title: '计算题 - 运算步骤', fullScore: 5, img: que02Img },
    { id: 'mq_3', key: 'Q3', title: '填空题 - 单位换算', fullScore: 5, img: que03Img },
    { id: 'mq_4', key: 'Q4', title: '解答题 - 应用题', fullScore: 5, img: que04Img },
  ],
  students: [
    { id: 'ms_1', name: '舒云曼', studentNo: '2204012', avatar: ans01Img, status: 'to_grade' },
    { id: 'ms_2', name: '张三', studentNo: '2204013', avatar: ans01Img, status: 'done' },
    { id: 'ms_3', name: '李华', studentNo: '2204014', avatar: ans01Img, status: 'to_grade' },
  ],
  works: [
    { studentId: 'ms_1', questionId: 'mq_1', img: ansHalfImg, graded: false },
    { studentId: 'ms_1', questionId: 'mq_2', img: ans01Img, graded: false },
    { studentId: 'ms_1', questionId: 'mq_3', img: ansErrorImg, graded: false },
    { studentId: 'ms_1', questionId: 'mq_4', img: ans01Img, graded: false },

    { studentId: 'ms_2', questionId: 'mq_1', img: ans01Img, graded: true, judgement: 'correct', score: 5 },
    { studentId: 'ms_2', questionId: 'mq_2', img: ans01Img, graded: true, judgement: 'correct', score: 5 },
    { studentId: 'ms_2', questionId: 'mq_3', img: ans01Img, graded: true, judgement: 'correct', score: 5 },
    { studentId: 'ms_2', questionId: 'mq_4', img: ans01Img, graded: true, judgement: 'correct', score: 5 },

    { studentId: 'ms_3', questionId: 'mq_1', img: ansErrorImg, graded: false },
    { studentId: 'ms_3', questionId: 'mq_2', img: ansHalfImg, graded: false },
    { studentId: 'ms_3', questionId: 'mq_3', img: ans01Img, graded: false },
    { studentId: 'ms_3', questionId: 'mq_4', img: ansErrorImg, graded: false },
  ],
  commonIssues: [
    { id: 'ci_1', label: '计算步骤不完整' },
    { id: 'ci_2', label: '公式应用错误' },
    { id: 'ci_3', label: '单位未写/写错' },
    { id: 'ci_4', label: '答案未化简' },
  ],
}
