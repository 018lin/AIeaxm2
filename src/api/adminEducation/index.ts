import { requestPost } from '@/api/index'
import type {
  ClassPageRequest,
  ClassPageResponse,
  ClassVO,
  CreateClassRequest,
  StudentsByClassIdResponse,
  TeachersByClassIdResponse,
} from './type'

// 获得班级列表-分页
export const getClassPage = async (params: ClassPageRequest) => {
  return await requestPost<ClassPageResponse, ClassPageRequest>('/api/v1/class/page', params)
}

// 获得班级列表-all
export const getClassList = async (params: { gradeId: string }) => {
  return await requestPost<ClassVO[], { gradeId: string }>('/api/v1/class/list', params)
}

// 创建班级
export const createClass = async (params: CreateClassRequest) => {
  return await requestPost<boolean, CreateClassRequest>('/api/v1/class/create', params)
}

// 更新班级
export const updateClass = async (params: CreateClassRequest) => {
  return await requestPost<boolean, CreateClassRequest>('/api/v1/class/update', params)
}

// 删除班级
export const deleteClass = async (params: { classId: string }) => {
  return await requestPost<boolean, { classId: string }>('/api/v1/class/deleteByClassId', params)
}

// 获取班级学生列表
export const studentsByClassId = async (params: { classId: string; gradeId: string }) => {
  return await requestPost<StudentsByClassIdResponse[], { classId: string; gradeId: string }>(
    '/api/v1/class/studentsByClassId',
    params
  )
}

// 删除班级下的学生
export const deleteStudentByClassId = async (params: { studentId: string }) => {
  return await requestPost<boolean, { studentId: string }>('/api/v1/student/removeClassId', params)
}

// 获取班级教师列表
export const teachersByClassId = async (params: { classId: string; gradeId: string }) => {
  return await requestPost<TeachersByClassIdResponse[], { classId: string; gradeId: string }>(
    '/api/v1/class/teachersByClassId',
    params
  )
}

// 删除班级下的老师
export const deleteTeacherByClassId = async (params: { teacherId: string; classId: string }) => {
  return await requestPost<boolean, { teacherId: string; classId: string }>(
    '/api/v1/teacher/clearSubjectAndClass',
    params
  )
}
