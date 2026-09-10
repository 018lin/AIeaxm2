// 基于ROUTES常量生成的菜单配置，避免硬编码路径
import { ROUTES } from '../router/routes'

// 管理员菜单项 - 完全基于ROUTES常量
export const ADMIN_MENU_ITEMS = [
  {
    label: '教务管理',
    icon: 'solar:square-academic-cap-2-broken',
    path: ROUTES.ADMIN_EDUCATION_CLASS,
    permission: 'admin:education:view',
    children: [
      {
        label: '班级管理',
        icon: 'solar:layers-broken',
        path: ROUTES.ADMIN_EDUCATION_CLASS,
        permission: 'admin:education:view',
      },
      {
        label: '教师管理',
        icon: 'solar:user-circle-broken',
        path: ROUTES.ADMIN_EDUCATION_TEACHER,
        permission: 'admin:education:view',
      },
      {
        label: '学生管理',
        icon: 'solar:user-broken',
        path: ROUTES.ADMIN_EDUCATION_STUDENT,
        permission: 'admin:education:view',
      },
    ],
  },
]

// 教师菜单项 - 基于ROUTES常量
export const TEACHER_MENU_ITEMS = [
  {
    label: '首页',
    path: ROUTES.TEACHER_DASHBOARD,
    permission: 'teacher:dashboard:view',
  },
  {
    label: '智能批改（讲错题）',
    path: ROUTES.TEACHER_HOMEWORK,
    permission: 'teacher:lecture:view',
    children: [
      {
        label: '作业列表',
        icon: 'mdi:clipboard-text-outline',
        path: ROUTES.TEACHER_HOMEWORK,
        permission: 'teacher:homework:view',
      },
    ],
  },
  {
    label: '错题重组',
    path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE,
    permission: 'teacher:recompose:view',
    children: [
      {
        label: '错题组卷',
        icon: 'mdi:file-replace-outline',
        path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE_PAPER,
        permission: 'teacher:recompose:paper',
      },
      {
        label: '错题组卷记录',
        icon: 'mdi:history',
        path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE_RECORDS,
        permission: 'teacher:recompose:records',
      },
      {
        label: '智能周错题',
        icon: 'mdi:calendar-sync-outline',
        path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE_WEEKLY,
        permission: 'teacher:recompose:weekly',
      },
    ],
  },
  // {
  //   label: '个性化错题本',
  //   path: ROUTES.TEACHER_MISTAKES,
  //   permission: 'teacher:mistakes:view',
  //   children: [
  //     {
  //       label: '错题本列表',
  //       icon: 'mdi:book-alert-outline',
  //       path: ROUTES.TEACHER_MISTAKES,
  //       permission: 'teacher:mistakes:list',
  //     },
  //   ],
  // },
  {
    label: '智能组卷',
    path: ROUTES.TEACHER_EXAMINATION,
    permission: 'teacher:compose:view',
    children: [
      {
        label: '组卷',
        icon: 'mdi:file-document-edit-outline',
        path: ROUTES.TEACHER_EXAMINATION,
        permission: 'teacher:compose:create',
      },
      {
        label: '组卷记录',
        icon: 'mdi:history',
        path: ROUTES.TEACHER_EXAMINATION_RECORDS,
        permission: 'teacher:compose:records',
      },
    ],
  },
  {
    label: '分层作业',
    path: ROUTES.TEACHER_LAYERED,
    permission: 'teacher:layered:view',
    children: [
      {
        label: '班级分层组卷',
        icon: 'mdi:account-group-outline',
        path: ROUTES.TEACHER_LAYERED_CLASS_COMPOSE,
        permission: 'teacher:layered:class-compose',
      },
      // {
      //   label: '分层智能周错题',
      //   icon: 'mdi:calendar-week',
      //   path: ROUTES.TEACHER_LAYERED_WEEKLY_MISTAKES,
      //   permission: 'teacher:layered:weekly-mistakes',
      // },
      {
        label: '分层组卷记录',
        icon: 'mdi:history',
        path: ROUTES.TEACHER_LAYERED_RECORDS,
        permission: 'teacher:layered:records',
      },
    ],
  },
  {
    label: '语文作文',
    path: ROUTES.TEACHER_COMPOSITION,
    permission: 'teacher:composition:view',
    children: [
      {
        label: '班级作文列表',
        icon: 'mdi:book-outline',
        path: ROUTES.TEACHER_COMPOSITION,
        permission: 'teacher:composition:list',
      },
      {
        label: '新建题目',
        icon: 'mdi:file-plus-outline',
        path: ROUTES.TEACHER_COMPOSITION_CREATE,
        permission: 'teacher:composition:create',
      },
    ],
  },
  {
    label: '我的学校',
    path: ROUTES.TEACHER_SCHOOL,
    permission: 'teacher:school:view',
    children: [
      {
        label: '我的班级',
        icon: 'solar:user-bold',
        path: ROUTES.TEACHER_SCHOOL_STUDENT,
        permission: 'teacher:school:student',
      },
      {
        label: '微课资源',
        icon: 'solar:videocamera-bold',
        path: ROUTES.TEACHER_SCHOOL_CLASS,
        permission: 'teacher:school:resource',
      },
    ],
  },
  {
    label: '分析报告',
    path: ROUTES.TEACHER_REPORTS,
    permission: 'teacher:reports:view',
    children: [
      {
        label: '班级报告',
        icon: 'mdi:view-dashboard-outline',
        path: ROUTES.TEACHER_REPORTS_CLASS,
        permission: 'teacher:reports:class',
      },
      // {
      //   label: '学生报告',
      //   icon: 'solar:users-group-rounded-broken',
      //   path: ROUTES.TEACHER_REPORTS_STUDENT,
      //   permission: 'teacher:reports:student',
      // },
    ],
  },
  {
    label: '题库管理',
    path: ROUTES.TEACHER_QUESTION_BANK,
    permission: 'teacher:question-bank:view',
    children: [
      {
        label: '题库查询',
        icon: 'mdi:magnify',
        path: ROUTES.TEACHER_QUESTION_QUERY,
        permission: 'teacher:question:query',
      },
      {
        label: '题目录入',
        icon: 'mdi:cloud-upload-outline',
        path: ROUTES.TEACHER_QUESTION_UPLOAD,
        permission: 'teacher:question:upload',
        demoOnly: true,
      },
    ],
  },
]

// 学生菜单项 - 基于ROUTES常量
// export const STUDENT_MENU_ITEMS = [
//   {
//     label: '仪表盘',
//     path: ROUTES.STUDENT_DASHBOARD,
//     icon: 'mdi:view-dashboard-outline',
//     permission: 'student:dashboard:view'
//   },
//   {
//     label: '我的作业',
//     path: ROUTES.STUDENT_ASSIGNMENT,
//     icon: 'mdi:clipboard-text-outline',
//     permission: 'student:assignment:view'
//   },
//   {
//     label: '学习路径',
//     path: ROUTES.STUDENT_MILESTONES,
//     icon: 'mdi:map-marker-path',
//     permission: 'student:learning:view',
//     children: [
//       {
//         label: '学习里程碑',
//         path: ROUTES.STUDENT_MILESTONES,
//         permission: 'student:milestones:view'
//       },
//       {
//         label: '个性化训练',
//         path: ROUTES.STUDENT_PERSONAL_TRAIN,
//         permission: 'student:personal-train:view'
//       },
//       {
//         label: '个性化推荐',
//         path: ROUTES.STUDENT_RECOMMENDATION,
//         permission: 'student:recommendation:view'
//       },
//       {
//         label: '学习资源推荐',
//         path: ROUTES.STUDENT_RESOURCES,
//         permission: 'student:resources:view'
//       },
//       {
//         label: '收藏资源',
//         path: ROUTES.STUDENT_RESOURCES_FAVORITES,
//         permission: 'student:resources:favorites'
//       },
//       {
//         label: '下载记录',
//         path: ROUTES.STUDENT_RESOURCES_DOWNLOADS,
//         permission: 'student:resources:downloads'
//       }
//     ]
//   },
//   {
//     label: '学情报告',
//     path: ROUTES.STUDENT_REPORT,
//     icon: 'mdi:file-chart-outline',
//     permission: 'student:report:view',
//     children: [
//       {
//         label: '查看报告',
//         path: ROUTES.STUDENT_REPORT,
//         permission: 'student:report:view'
//       },
//       {
//         label: '生成报告',
//         path: ROUTES.STUDENT_REPORT_GENERATE,
//         permission: 'student:report:generate'
//       },
//       {
//         label: '下载/打印选项',
//         path: ROUTES.STUDENT_REPORT_PRINT_OPTIONS,
//         permission: 'student:report:print'
//       },
//       {
//         label: '报告历史',
//         path: ROUTES.STUDENT_REPORT_HISTORY,
//         permission: 'student:report:history'
//       }
//     ]
//   },
//   {
//     label: '错题本',
//     path: ROUTES.STUDENT_MISTAKES,
//     icon: 'mdi:book-alert-outline',
//     permission: 'student:mistakes:view',
//     children: [
//       {
//         label: '我的错题本',
//         path: ROUTES.STUDENT_MISTAKES,
//         permission: 'student:mistakes:view'
//       },
//       {
//         label: '错题重组',
//         path: ROUTES.STUDENT_MISTAKES_RECOMPOSE,
//         permission: 'student:mistakes:recompose'
//       }
//     ]
//   },
//   {
//     label: '个人设置',
//     path: ROUTES.STUDENT_SETTINGS,
//     icon: 'mdi:account-cog-outline',
//     permission: 'student:settings:view',
//     children: [
//       {
//         label: '基础设置',
//         path: ROUTES.STUDENT_SETTINGS,
//         permission: 'student:settings:basic'
//       },
//       {
//         label: '修改密码',
//         path: ROUTES.STUDENT_SETTINGS_PASSWORD,
//         permission: 'student:settings:password'
//       }
//     ]
//   }
// ]

// 教务菜单项 - 基于ROUTES常量
// export const AFFAIRS_MENU_ITEMS = [
//   {
//     label: '数据总览',
//     path: ROUTES.AFFAIRS_OVERVIEW,
//     icon: 'mdi:monitor-dashboard',
//     permission: 'affairs:overview:view'
//   },
//   {
//     label: '统计分析',
//     path: ROUTES.AFFAIRS_ANALYTICS,
//     icon: 'mdi:chart-line',
//     permission: 'affairs:analytics:view'
//   },
//   {
//     label: '题目来源查看',
//     path: ROUTES.AFFAIRS_QUESTION_SOURCE,
//     icon: 'mdi:label-outline',
//     permission: 'affairs:question-source:view'
//   },
//   {
//     label: '教师工作量',
//     path: ROUTES.AFFAIRS_TEACHER_WORKLOAD,
//     icon: 'mdi:clipboard-list-outline',
//     permission: 'affairs:teacher-workload:view'
//   },
//   {
//     label: '资源治理',
//     path: ROUTES.AFFAIRS_RESOURCES,
//     icon: 'mdi:folder-information-outline',
//     permission: 'affairs:resources:view',
//     children: [
//       { label: '资源目录', path: ROUTES.AFFAIRS_RESOURCES, permission: 'affairs:resources:view' },
//       { label: '上传中心', path: ROUTES.AFFAIRS_RESOURCES_UPLOAD, permission: 'affairs:resources:upload' },
//       { label: '审核队列', path: ROUTES.AFFAIRS_RESOURCES_REVIEW, permission: 'affairs:resources:review' },
//       { label: '发布管理', path: ROUTES.AFFAIRS_RESOURCES_PUBLISH, permission: 'affairs:resources:publish' }
//     ]
//   }
//   ,
//   {
//     label: '排课管理',
//     path: ROUTES.AFFAIRS_SCHEDULE,
//     icon: 'mdi:calendar-clock',
//     permission: 'affairs:schedule:view'
//   },
//   {
//     label: '排考管理',
//     path: ROUTES.AFFAIRS_EXAM,
//     icon: 'mdi:calendar-text',
//     permission: 'affairs:exam:view'
//   }
// ]
