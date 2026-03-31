// 路由常量统一管理（教师/学生/管理员端），避免在页面中硬编码路径
export const ROUTES = {
  DASHBOARD: '/dashboard',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_FORGOT: '/auth/forgot',

  // 教师端
  TEACHER_DASHBOARD: '/teacher/dashboard', // 教师首页
  TEACHER_PERSON_INFO: '/teacher/person/info', // 个人信息

  // 个性化错题
  // TEACHER_MISTAKES: '/teacher/mistakes',
  // TEACHER_MISTAKES_DETAIL: '/teacher/mistakes/detail/:studentId',

  // 智能组卷
  TEACHER_EXAMINATION: '/teacher/examination',
  TEACHER_EXAMINATION_RECORDS: '/teacher/examination/records',

  // 重组错题
  TEACHER_HOMEWORK_RECOMPOSE: '/teacher/recompose',
  TEACHER_HOMEWORK_RECOMPOSE_PAPER: '/teacher/recompose/paper',
  TEACHER_HOMEWORK_RECOMPOSE_WEEKLY: '/teacher/recompose/weekly',
  TEACHER_HOMEWORK_RECOMPOSE_RECORDS: '/teacher/recompose/records',

  // 智能批改
  TEACHER_HOMEWORK: '/teacher/homework',
  TEACHER_HOMEWORK_DETAIL: '/teacher/homework/detail/:id',
  TEACHER_HOMEWORK_DETAIL_STUDENT_STATS: '/teacher/homework/detail/:id/student-stats',
  TEACHER_HOMEWORK_DETAIL_STUDENTS: '/teacher/homework/detail/:id/students',
  TEACHER_HOMEWORK_DETAIL_WRONG_QUESTIONS: '/teacher/homework/detail/:id/wrong-questions',
  TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK: '/teacher/homework/detail/:id/original-work',
  TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW: '/teacher/homework/detail/:id/manual-review',
  TEACHER_HOMEWORK_SCREEN_RECORD: '/teacher/homework/screen-record/:id',

  // 语文作文
  TEACHER_COMPOSITION: '/teacher/composition',
  TEACHER_COMPOSITION_CREATE: '/teacher/composition/create',

  // 我的学校
  TEACHER_SCHOOL: '/teacher/school',
  TEACHER_SCHOOL_STUDENT: '/teacher/school/student',
  TEACHER_SCHOOL_CLASS: '/teacher/school/class',
  TEACHER_SCHOOL_RESOURCE_DETAIL: '/teacher/school/resource/detail/:id',

  // 分层作业
  TEACHER_LAYERED: '/teacher/layered',
  TEACHER_LAYER_SETTINGS: '/teacher/layer-settings',
  TEACHER_LAYERED_CLASS_COMPOSE: '/teacher/layered/class-compose',
  TEACHER_LAYERED_WEEKLY_MISTAKES: '/teacher/layered/weekly-mistakes',
  TEACHER_LAYERED_MANUAL_RECOMPOSE: '/teacher/layered/manual-recompose',
  TEACHER_LAYERED_RECORDS: '/teacher/layered/records',

  // 分析报告
  TEACHER_REPORTS: '/teacher/reports',
  TEACHER_REPORTS_CLASS: '/teacher/reports/class',
  TEACHER_REPORTS_STUDENT: '/teacher/reports/student',
  TEACHER_REPORTS_STUDENT_DETAIL: '/teacher/reports/student/detail/:studentId',

  // 题库管理
  TEACHER_QUESTION_BANK: '/teacher/question-bank',
  TEACHER_QUESTION_QUERY: '/teacher/question-bank/query',
  TEACHER_QUESTION_PAGE_DETAIL: '/teacher/question-bank/page/detail/:id',
  TEACHER_QUESTION_UPLOAD: '/teacher/question-bank/upload',

  // 管理员端
  ADMIN_EDUCATION_CLASS: '/admin/education/class',
  ADMIN_EDUCATION_CLASS_DETAIL: '/admin/education/class/detail',
  ADMIN_EDUCATION_TEACHER: '/admin/education/teacher',
  ADMIN_EDUCATION_TEACHER_CREATE: '/admin/education/teacher/create',
  ADMIN_EDUCATION_STUDENT: '/admin/education/student',
  ADMIN_EDUCATION_STUDENT_CREATE: '/admin/education/student/create',

  // ADMIN_DASHBOARD: '/system/dashboard',
  // STUDENT_DASHBOARD: '/student/dashboard',
  // AFFAIRS_OVERVIEW: '/affairs/overview',
} as const

export type RouteKey = keyof typeof ROUTES
