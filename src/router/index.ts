import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layout/AdminLayout.vue'
import AppLayout from '../layout/AppLayout.vue'
import { ROUTES } from './routes'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        // 动态默认界面：未登录跳登录，已登录跳仪表盘
        redirect: () => {
          const isAuthed = localStorage.getItem('isAuthed') === 'true' || Boolean(localStorage.getItem('accessToken'))
          return isAuthed ? '/dashboard' : '/auth/login'
        },
      },
      // 教师
      {
        path: ROUTES.TEACHER_DASHBOARD,
        name: 'teacher_dashboard',
        component: () => import('../pages/teacher/Dashboard.vue'),
        meta: { title: '仪表盘', role: 'teacher', scrollable: true },
      },
      // {
      //   path: ROUTES.TEACHER_MISTAKES,
      //   name: 'teacher_mistakes',
      //   component: () => import('../pages/teacher/mistakes/List.vue'),
      //   meta: { title: '个性化错题本-错题本列表', role: 'teacher' },
      // },
      // {
      //   path: ROUTES.TEACHER_MISTAKES_DETAIL,
      //   name: 'teacher_mistakes_detail',
      //   component: () => import('../pages/teacher/mistakes/Detail.vue'),
      //   meta: { title: '个性化错题本-错题详情', role: 'teacher' },
      // },
      {
        path: ROUTES.TEACHER_EXAMINATION,
        name: 'teacher_examination',
        component: () => import('../pages/teacher/examination/List.vue'),
        meta: { title: '智能组卷（校本组卷）-组卷', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_EXAMINATION_RECORDS,
        name: 'teacher_examination_records',
        component: () => import('../pages/teacher/examination/Records.vue'),
        meta: { title: '智能组卷（校本组卷）-组卷记录', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK,
        name: 'teacher_homework',
        component: () => import('../pages/teacher/homework/Assignments.vue'),
        meta: { title: '智能批改（讲错题）-作业列表', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE,
        name: 'teacher_homework_recompose',
        redirect: ROUTES.TEACHER_HOMEWORK_RECOMPOSE_PAPER,
        meta: { title: '错题重组', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE_PAPER,
        name: 'teacher_homework_recompose_paper',
        component: () => import('../pages/teacher/recompose/Question.vue'),
        meta: { title: '智能批改（讲错题）-错题组卷', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE_RECORDS,
        name: 'teacher_homework_recompose_records',
        component: () => import('../pages/teacher/recompose/Records.vue'),
        meta: { title: '智能批改（讲错题）-错题组卷记录', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE_WEEKLY,
        name: 'teacher_homework_recompose_weekly',
        component: () => import('../pages/teacher/recompose/Weekly.vue'),
        meta: { title: '智能批改（讲错题）-智能周错题', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_DETAIL,
        name: 'teacher_homework_detail',
        component: () => import('../pages/teacher/homework/AssignmentDetail.vue'),
        meta: { title: '作业批改-讲错题', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENT_STATS,
        name: 'teacher_homework_detail_student_stats',
        component: () => import('../pages/teacher/homework/AssignmentStudentStats.vue'),
        meta: { title: '作业批改-学生作业统计', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENTS,
        name: 'teacher_homework_detail_students',
        component: () => import('../pages/teacher/homework/AssignmentStudentsSummary.vue'),
        meta: { title: '作业批改-学生（汇总）', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK,
        name: 'teacher_homework_detail_original_work',
        component: () => import('../pages/teacher/homework/AssignmentOriginalWork.vue'),
        meta: { title: '作业批改-原作业', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW,
        name: 'teacher_homework_detail_manual_review',
        component: () => import('../pages/teacher/homework/AssignmentManualReview.vue'),
        meta: { title: '作业批改-人工批阅', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_HOMEWORK_SCREEN_RECORD,
        name: 'teacher_homework_screen_record',
        component: () => import('../pages/teacher/homework/AssignmentScreenRecord.vue'),
        meta: { title: '作业批改-课程录制', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_COMPOSITION,
        name: 'teacher_composition',
        component: () => import('../pages/teacher/composition/List.vue'),
        meta: { title: '语文作文-班级作文列表', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_COMPOSITION_CREATE,
        name: 'teacher_composition_create',
        component: () => import('../pages/teacher/composition/Create.vue'),
        meta: { title: '语文作文-新建题目', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_SCHOOL,
        name: 'teacher_school',
        redirect: ROUTES.TEACHER_SCHOOL_STUDENT,
        meta: { title: '我的学校', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_LAYER_SETTINGS,
        name: 'teacher_layer_settings',
        component: () => import('../pages/teacher/school/LayerSettings.vue'),
        meta: { title: '我的学校-分层设置', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_LAYERED,
        name: 'teacher_layered',
        redirect: ROUTES.TEACHER_LAYERED_CLASS_COMPOSE,
        meta: { title: '分层作业', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_LAYERED_CLASS_COMPOSE,
        name: 'teacher_layered_class_compose',
        component: () => import('../pages/teacher/layering/StratifiedTest.vue'),
        meta: { title: '分层作业-班级分层组卷', role: 'teacher', scrollable: true },
      },
      {
        path: ROUTES.TEACHER_LAYERED_WEEKLY_MISTAKES,
        name: 'teacher_layered_weekly_mistakes',
        component: () => import('../pages/teacher/layering/WeeklyMistakes.vue'),
        meta: { title: '分层作业-分层智能周错题', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_LAYERED_RECORDS,
        name: 'teacher_layered_records',
        component: () => import('../pages/teacher/layering/Records.vue'),
        meta: { title: '分层作业-分层组卷记录', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_REPORTS,
        name: 'teacher_reports',
        redirect: ROUTES.TEACHER_REPORTS_CLASS,
        meta: { title: '分析报告', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_REPORTS_CLASS,
        name: 'teacher_reports_class',
        component: () => import('../pages/teacher/analysis/ClassReport.vue'),
        meta: { title: '分析报告-班级报告', role: 'teacher', scrollable: true },
      },
      {
        path: ROUTES.TEACHER_REPORTS_STUDENT,
        name: 'teacher_reports_student',
        component: () => import('../pages/teacher/analysis/StudentReport.vue'),
        meta: { title: '学生报告', role: 'teacher', scrollable: false },
      },
      {
        path: ROUTES.TEACHER_REPORTS_STUDENT_DETAIL,
        name: 'teacher_reports_student_detail',
        component: () => import('../pages/teacher/analysis/StudentDetail.vue'),
        meta: { title: '学生报告-学生报告详情', role: 'teacher', scrollable: true },
      },
      {
        path: ROUTES.TEACHER_QUESTION_BANK,
        name: 'teacher_question_bank',
        redirect: ROUTES.TEACHER_QUESTION_QUERY,
        meta: { title: '题库管理', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_QUESTION_QUERY,
        name: 'teacher_question_query',
        component: () => import('../pages/teacher/questionBank/Query.vue'),
        meta: { title: '题库管理-题库查询', role: 'teacher', scrollable: true },
      },
      {
        path: ROUTES.TEACHER_QUESTION_UPLOAD,
        name: 'teacher_question_upload',
        component: () => import('../pages/teacher/questionBank/SelfUploading.vue'),
        meta: { title: '题库管理-题目录入', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_QUESTION_PAGE_DETAIL,
        name: 'teacher_question_page_detail',
        component: () => import('../pages/teacher/questionBank/PageDetail.vue'),
        meta: { title: '题库管理-试卷详情', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_SCHOOL_STUDENT,
        name: 'teacher_school_student',
        component: () => import('../pages/teacher/school/Student.vue'),
        meta: { title: '学生概况', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_SCHOOL_CLASS,
        name: 'teacher_school_class',
        component: () => import('../pages/teacher/school/Class.vue'),
        meta: { title: '微课资源', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_SCHOOL_RESOURCE_DETAIL,
        name: 'teacher_school_resource',
        component: () => import('../pages/teacher/school/ResourceDetail.vue'),
        meta: { title: '观看课程', role: 'teacher' },
      },
      {
        path: ROUTES.TEACHER_PERSON_INFO,
        name: 'teacher_person_info',
        component: () => import('../pages/teacher/PersonInfo.vue'),
        meta: { title: '个人信息', role: 'teacher' },
      },

    ],
  },
  {
    path: ROUTES.STUDENT_DASHBOARD,
    name: 'student_dashboard',
    component: () => import('../pages/student/Dashboard.vue'),
    meta: { title: '学生端首页', role: 'student' },
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: ROUTES.ADMIN_EDUCATION_CLASS,
        name: 'admin_education_class',
        component: () => import('../pages/admin/education/Class.vue'),
        meta: { title: '班级管理', role: 'admin' },
      },
      {
        path: ROUTES.ADMIN_EDUCATION_CLASS_DETAIL,
        name: 'admin_education_class_detail',
        component: () => import('../pages/admin/education/ClassDetail.vue'),
        meta: { title: '班级详情', role: 'admin' },
      },
      {
        path: ROUTES.ADMIN_EDUCATION_TEACHER,
        name: 'admin_education_teacher',
        component: () => import('../pages/admin/education/Teacher.vue'),
        meta: { title: '教师管理', role: 'admin' },
      },
      {
        path: ROUTES.ADMIN_EDUCATION_TEACHER_CREATE,
        name: 'admin_education_teacher_create',
        component: () => import('../pages/admin/education/TeacherCreate.vue'),
        meta: { title: '新增教师', role: 'admin' },
      },
      {
        path: ROUTES.ADMIN_EDUCATION_STUDENT,
        name: 'admin_education_student',
        component: () => import('../pages/admin/education/Student.vue'),
        meta: { title: '学生管理', role: 'admin' },
      },
      {
        path: ROUTES.ADMIN_EDUCATION_STUDENT_CREATE,
        name: 'admin_education_student_create',
        component: () => import('../pages/admin/education/StudentCreate.vue'),
        meta: { title: '新增学生', role: 'admin' },
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../pages/DashboardRedirect.vue'),
    meta: { title: '仪表盘' },
  },
  {
    path: '/auth/login',
    name: 'auth_login',
    component: () => import('../pages/auth/Login.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/auth/register',
    name: 'auth_register',
    component: () => import('../pages/auth/Register.vue'),
    meta: { title: '注册', public: true },
  },
  {
    path: '/auth/forgot',
    name: 'auth_forgot',
    component: () => import('../pages/auth/Forgot.vue'),
    meta: { title: '忘记密码', public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/NotFound.vue'),
    meta: { title: '页面未找到' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (import.meta.env.DEV) {
    // 路由守卫日志（开发环境）
    console.info('[router] navigate:', { from: from.path, to: to.path })
  }
  const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token')
  // const role = (localStorage.getItem('role') || 'teacher') as 'teacher' | 'student' | 'admin' | 'edu_affairs'
  const isPublic = to.meta.public === true || to.path.startsWith('/auth')

  if (!accessToken && !isPublic) {
    return next('/auth/login')
  }

  // 权限检查
  // const requiredPermission = to.meta.permission as string | undefined
  // if (requiredPermission && !checkRolePermission(role, requiredPermission)) {
  //   console.warn('[router] Permission denied:', { role, requiredPermission, path: to.path })
  //   // 可以跳转到无权限页面或首页
  //   const target =
  //     role === 'admin'
  //       ? ROUTES.ADMIN_DASHBOARD
  //       : role === 'student'
  //         ? ROUTES.STUDENT_DASHBOARD
  //         : role === 'edu_affairs'
  //           ? ROUTES.AFFAIRS_OVERVIEW
  //           : ROUTES.TEACHER_DASHBOARD
  //   return next(target)
  // }

  next()
})

export default router
