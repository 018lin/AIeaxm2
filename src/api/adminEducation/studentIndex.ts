import type { TeacherPageRequest } from '@/api/adminEducation/teacherType'
import type { StudentsByClassIdResponse } from '@/api/adminEducation/type'
import { requestDownload, requestPost, requestPostForm } from '@/api/index'
import type { StudentPageResponse } from './studentType'

// 获得学生分页列表
export const getStudentPage = async (params: TeacherPageRequest) => {
  return await requestPost<StudentPageResponse, TeacherPageRequest>('/api/v1/student/page', params)
}

// 删除学生
export const deleteStudent = async (params: { studentId: string }) => {
  return await requestPost<boolean, { studentId: string }>('/api/v1/student/delete', params)
}

// 下载学生模板
export const downloadStudentTemplate = async () => {
  return await requestDownload('/api/v1/student/import-template')
}

// 批量导入学生
export const importStudents = async (params: { file: File }) => {
  return await requestPostForm<any, { file: File }>('/api/v1/student/import', params)
}

// 获取学生信息
export const getStudentInfo = async (params: { studentId: string }) => {
  return await requestPost<StudentsByClassIdResponse, { studentId: string }>('/api/v1/student/student', params)
}

// 新增学生
export const createStudent = async (params: StudentsByClassIdResponse) => {
  return await requestPost<boolean, StudentsByClassIdResponse>('/api/v1/student/create', params)
}

// 编辑学生
export const editStudent = async (params: StudentsByClassIdResponse) => {
  return await requestPost<boolean, StudentsByClassIdResponse>('/api/v1/student/update', params)
}
