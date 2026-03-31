import type { TeachersByClassIdResponse } from '@/api/adminEducation/type'
import { requestDownload, requestPost, requestPostForm } from '@/api/index'
import type { TeacherPageRequest, TeacherPageResponse } from './teacherType'

// 获得教师分页列表
export const getTeacherPage = async (params: TeacherPageRequest) => {
  return await requestPost<TeacherPageResponse, TeacherPageRequest>('/api/v1/teacher/page', params)
}

// 删除教师
export const deleteTeacher = async (params: { teacherId: string }) => {
  return await requestPost<boolean, { teacherId: string }>('/api/v1/teacher/delete', params)
}

// 下载教师模板
export const downloadTeacherTemplate = async () => {
  return await requestDownload('/api/v1/teacher/import-template')
}

// 批量导入教师
export const importTeachers = async (params: { file: File }) => {
  return await requestPostForm<any, { file: File }>('/api/v1/teacher/import', params)
}

// 获取教师信息
export const getTeacherInfo = async (params: { teacherId: string }) => {
  return await requestPost<TeachersByClassIdResponse, { teacherId: string }>('/api/v1/teacher/teacher', params)
}

// 新增老师
export const createTeacher = async (params: TeachersByClassIdResponse) => {
  return await requestPost<boolean, TeachersByClassIdResponse>('/api/v1/teacher/create', params)
}

// 编辑老师
export const editTeacher = async (params: TeachersByClassIdResponse) => {
  return await requestPost<boolean, TeachersByClassIdResponse>('/api/v1/teacher/edit', params)
}
