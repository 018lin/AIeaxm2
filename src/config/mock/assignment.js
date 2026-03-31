// 作业管理页面mock数据
const DIFFICULTY_LABEL = { easy: '简单', medium: '中等', hard: '困难' }
const STATUS_LABEL = { published: '已发布', draft: '草稿', completed: '已完成', expired: '已过期', active: '启用', inactive: '停用', deleted: '已删除', offline: '已下线' }
const withLabels = (item) => ({
  ...item,
  difficultyLabel: DIFFICULTY_LABEL[item.difficulty] || item.difficulty,
  statusLabel: STATUS_LABEL[item.status] || item.status
})
export const assignmentData = {
  // 作业管理主页数据
  management: {
    pageInfo: {
      title: '作业/试卷管理',
      description: '创建、管理和分析作业与试卷，支持分层教学和自动组卷',
      breadcrumbs: [
        { name: '首页', path: '/dashboard' },
        { name: '作业管理', path: '/assignments', current: true }
      ]
    },
    
    // 筛选选项
    filters: {
      status: [
        { value: 'all', label: '全部状态' },
        { value: 'draft', label: '草稿' },
        { value: 'published', label: '已发布' },
        { value: 'completed', label: '已完成' },
        { value: 'expired', label: '已过期' }
      ],
      
      grades: [
        { value: 'all', label: '全部年级' },
        { value: 'grade7', label: '七年级' },
        { value: 'grade8', label: '八年级' },
        { value: 'grade9', label: '九年级' },
        { value: 'grade10', label: '高一' },
        { value: 'grade11', label: '高二' },
        { value: 'grade12', label: '高三' }
      ],
      
      subjects: [
        { value: 'all', label: '全部学科' },
        { value: 'math', label: '数学' },
        { value: 'physics', label: '物理' },
        { value: 'chemistry', label: '化学' },
        { value: 'biology', label: '生物' }
      ]
    },
    
    // 作业列表
    assignmentList: {
      pagination: {
        current: 1,
        pageSize: 10,
        total: 45
      },
      data: [
        {
          id: 'assign_001',
          title: '函数与方程综合练习',
          type: 'tiered', // tiered: 分层作业, auto: 自动组卷, manual: 手动组卷
          status: 'published',
          createdAt: '2024-02-15 09:30:00',
          deadline: '2024-02-20 23:59:59',
          grade: '高一',
          subject: '数学',
          publishedClasses: ['高一(1)班', '高一(2)班'],
          totalQuestions: 20,
          estimatedTime: 45, // 分钟
          difficulty: 'medium',
          submissionCount: 67,
          totalStudents: 88,
          avgScore: 82.5,
          actions: ['edit', 'preview', 'statistics', 'delete']
        },
        {
          id: 'assign_002',
          title: '立体几何基础测试',
          type: 'auto',
          status: 'draft',
          createdAt: '2024-02-14 16:20:00',
          deadline: null,
          grade: '高二',
          subject: '数学',
          publishedClasses: [],
          totalQuestions: 15,
          estimatedTime: 30,
          difficulty: 'easy',
          submissionCount: 0,
          totalStudents: 0,
          avgScore: null,
          actions: ['edit', 'preview', 'publish', 'delete']
        },
        {
          id: 'assign_003',
          title: '化学实验报告',
          type: 'manual',
          status: 'completed',
          createdAt: '2024-02-10 14:15:00',
          deadline: '2024-02-14 23:59:59',
          grade: '高一',
          subject: '化学',
          publishedClasses: ['高一(3)班'],
          totalQuestions: 8,
          estimatedTime: 60,
          difficulty: 'medium',
          submissionCount: 42,
          totalStudents: 42,
          avgScore: 88.7,
          actions: ['view', 'statistics', 'archive']
        }
      ].map(withLabels)
    },
    
    // 批量操作选项
    batchActions: [
      { id: 'publish', label: '批量发布', icon: 'mdi:publish' },
      { id: 'delete', label: '批量删除', icon: 'mdi:delete' },
      { id: 'export', label: '导出数据', icon: 'mdi:export' },
      { id: 'archive', label: '批量归档', icon: 'mdi:archive' }
    ]
  },
  
  // 作业创建/编辑数据
  creation: {
    // 基本信息配置
    basicInfo: {
      types: [
        {
          id: 'tiered',
          name: '分层作业',
          description: '根据学生能力分层，提供不同难度的题目',
          icon: 'mdi:layers'
        },
        {
          id: 'auto',
          name: '自动组卷',
          description: '系统根据知识点和难度自动生成试卷',
          icon: 'mdi:auto-fix'
        },
        {
          id: 'manual',
          name: '手动组卷',
          description: '教师手动选择题目组成试卷',
          icon: 'mdi:hand-pointing-right'
        }
      ]
    },
    
    // 题目选择数据
    questionSelection: {
      categories: [
        {
          id: 'knowledge_point',
          name: '按知识点',
          children: [
            { id: 'function', name: '函数', count: 156 },
            { id: 'geometry', name: '几何', count: 234 },
            { id: 'algebra', name: '代数', count: 189 },
            { id: 'statistics', name: '统计', count: 98 }
          ]
        },
        {
          id: 'difficulty',
          name: '按难度',
          children: [
            { id: 'easy', name: '简单', count: 298 },
            { id: 'medium', name: '中等', count: 456 },
            { id: 'hard', name: '困难', count: 123 }
          ]
        },
        {
          id: 'question_type',
          name: '按题型',
          children: [
            { id: 'choice', name: '选择题', count: 345 },
            { id: 'blank', name: '填空题', count: 234 },
            { id: 'answer', name: '解答题', count: 298 }
          ]
        }
      ],
      
      filters: {
        difficulty: ['easy', 'medium', 'hard'],
        questionType: ['choice', 'blank', 'answer'],
        source: ['textbook', 'exam', 'custom'],
        usageCount: ['low', 'medium', 'high']
      }
    },
    
    // 发布设置
    publishSettings: {
      targetClasses: [
        { id: 'class_001', name: '高一(1)班', studentCount: 45, selected: false },
        { id: 'class_002', name: '高一(2)班', studentCount: 43, selected: false },
        { id: 'class_003', name: '高二(3)班', studentCount: 42, selected: false }
      ],
      
      timeSettings: {
        publishNow: true,
        scheduledTime: null,
        deadline: null,
        allowLateSubmission: false,
        timeLimit: null // 分钟，null表示不限时
      },
      
      submissionSettings: {
        allowMultipleAttempts: false,
        maxAttempts: 1,
        showAnswerAfterSubmit: false,
        showScoreImmediately: true
      }
    },
    
    // 分层设置
    tieredSettings: {
      layers: [
        {
          id: 'basic',
          name: '基础层',
          description: '适合基础较弱的学生',
          difficulty: 'easy',
          questionCount: 15,
          timeLimit: 30,
          passingScore: 60
        },
        {
          id: 'standard',
          name: '标准层',
          description: '适合大部分学生',
          difficulty: 'medium',
          questionCount: 20,
          timeLimit: 45,
          passingScore: 70
        },
        {
          id: 'advanced',
          name: '提高层',
          description: '适合学习能力较强的学生',
          difficulty: 'hard',
          questionCount: 25,
          timeLimit: 60,
          passingScore: 80
        }
      ],
      
      studentAssignment: {
        autoAssign: true,
        assignmentRules: [
          { condition: 'avgScore >= 85', layer: 'advanced' },
          { condition: 'avgScore >= 70', layer: 'standard' },
          { condition: 'avgScore < 70', layer: 'basic' }
        ]
      }
    }
  },
  
  // 作业统计数据
  statistics: {
    // 概览统计
    overview: {
      totalSubmissions: 67,
      totalStudents: 88,
      submissionRate: 76.1,
      avgScore: 82.5,
      avgTime: 38, // 分钟
      passRate: 89.6
    },
    
    // 班级提交统计
    classSubmissions: [
      {
        className: '高一(1)班',
        totalStudents: 45,
        submitted: 42,
        submissionRate: 93.3,
        avgScore: 84.2,
        passRate: 92.9
      },
      {
        className: '高一(2)班',
        totalStudents: 43,
        submitted: 25,
        submissionRate: 58.1,
        avgScore: 79.8,
        passRate: 84.0
      }
    ],
    
    // 时间分布统计
    timeDistribution: {
      hourly: [
        { hour: '08:00', submissions: 5 },
        { hour: '14:00', submissions: 12 },
        { hour: '19:00', submissions: 23 },
        { hour: '21:00', submissions: 18 },
        { hour: '22:00', submissions: 9 }
      ]
    },
    
    // 分数分布
    scoreDistribution: {
      ranges: [
        { range: '0-60', count: 7, percentage: 10.4 },
        { range: '60-70', count: 12, percentage: 17.9 },
        { range: '70-80', count: 18, percentage: 26.9 },
        { range: '80-90', count: 22, percentage: 32.8 },
        { range: '90-100', count: 8, percentage: 11.9 }
      ]
    },
    
    // 题目分析
    questionAnalysis: [
      {
        questionId: 'q_001',
        questionNo: 1,
        type: 'choice',
        topic: '函数定义域',
        difficulty: 'easy',
        correctRate: 94.0,
        avgTime: 1.2, // 分钟
        commonErrors: ['计算错误', '概念混淆']
      },
      {
        questionId: 'q_002',
        questionNo: 2,
        type: 'blank',
        topic: '函数值域',
        difficulty: 'medium',
        correctRate: 76.1,
        avgTime: 2.8,
        commonErrors: ['方法选择不当', '计算过程错误']
      },
      {
        questionId: 'q_003',
        questionNo: 3,
        type: 'answer',
        topic: '函数综合应用',
        difficulty: 'hard',
        correctRate: 58.2,
        avgTime: 8.5,
        commonErrors: ['思路不清晰', '步骤不完整', '结果验证缺失']
      }
    ]
  }
};

export default assignmentData;
