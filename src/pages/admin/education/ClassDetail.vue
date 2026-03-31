<template>
  <div class="class-detail">
    <div class="class-detail-header">
      <a-button class="default-btn" :icon="h(ArrowLeftOutlined)" @click="goBack">返回</a-button>
      <span class="title">班级详情： {{ classIfo.gradeName }}{{ classIfo.className }}</span>
    </div>

    <div class="class-detail-tab app-surface">
      <a-tabs v-model:activeKey="tabKey" @change="changeTab">
        <a-tab-pane key="teacher" tab="班内教师">
          <!-- 表格 -->
          <div class="table-container app-surface" v-if="teacherList.length">
            <a-table :columns="teacherColumns" :data-source="teacherList" :pagination="false">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'sex'">
                  <a-tag color="cyan" v-if="record.sex === '1'">男</a-tag>
                  <a-tag color="red" v-else-if="record.sex === '2'">女</a-tag>
                </template>
                <template v-if="column.key === 'actions'">
                  <div class="btn-box" v-if="userId !== record.userId">
                    <a-popconfirm
                      title="确定要删除吗?"
                      ok-text="是"
                      cancel-text="否"
                      @confirm="handleDeleteTeacher(record.teacherId)"
                    >
                      <a-button style="color: #f43f5e" :icon="h(DeleteOutlined)">删除</a-button>
                    </a-popconfirm>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
          <!-- 空数据 -->
          <div class="empty-state" v-else>
            <a-empty :description="'暂无数据'" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="student" tab="班内学生">
          <!-- 表格 -->
          <div class="table-container app-surface" v-if="studentList.length">
            <a-table :columns="studentColumns" :data-source="studentList" :pagination="false">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'sex'">
                  <a-tag color="cyan" v-if="record.sex === '1'">男</a-tag>
                  <a-tag color="red" v-else-if="record.sex === '2'">女</a-tag>
                </template>
                <template v-if="column.key === 'actions'">
                  <div class="btn-box">
                    <a-popconfirm
                      title="确定要删除吗?"
                      ok-text="是"
                      cancel-text="否"
                      @confirm="handleDeleteStudent(record.studentId)"
                    >
                      <a-button style="color: #f43f5e" :icon="h(DeleteOutlined)">删除</a-button>
                    </a-popconfirm>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
          <!-- 空数据 -->
          <div class="empty-state" v-else>
            <a-empty :description="'暂无数据'" />
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  deleteStudentByClassId,
  deleteTeacherByClassId,
  studentsByClassId,
  teachersByClassId,
} from '@/api/adminEducation/index'
import type { StudentsByClassIdResponse, TeachersByClassIdResponse } from '@/api/adminEducation/type'
import { getUserBaseInfo } from '@/services/storage'
import { decrypt } from '@/utils/crypto'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 基础状态
const parsedUserInfo = getUserBaseInfo()
const classIfo = ref<any>({})
const tabKey = ref('teacher')
const teacherList = ref<TeachersByClassIdResponse[]>([])
const studentList = ref<StudentsByClassIdResponse[]>([])
const teacherLoading = ref(false)
const userId = ref(parsedUserInfo?.userId || '') // 当前登陆用户ID
const teacherColumns = [
  { title: '学科', dataIndex: 'subjectName', key: 'subjectName' },
  { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName' },
  { title: '性别', key: 'sex' },
  { title: '用户名', dataIndex: 'userName', key: 'userName' },
  { title: '手机号', dataIndex: 'phoneNumber', key: 'phoneNumber' },
  { title: '操作', key: 'actions' },
]
const studentColumns = [
  { title: '姓名', dataIndex: 'studentName', key: 'studentName' },
  { title: '性别', key: 'sex' },
  { title: '学号', dataIndex: 'studentCode', key: 'studentCode' },
  { title: '操作', key: 'actions' },
]

// 返回
const goBack = () => {
  router.back()
}

// 切换标签页
const changeTab = (tab: any) => {
  if (tab === 'teacher') {
    getTeacherList()
  } else {
    console.log('切换学生列表')
    getStudentList()
  }
}

// 删除学生
const handleDeleteStudent = async (studentId: string) => {
  try {
    const res = await deleteStudentByClassId({ studentId })
    if (res) {
      message.success('删除学生成功')
      getStudentList()
    } else {
      message.error('删除学生失败')
    }
  } catch (error) {
    console.error('删除学生失败', error)
  }
}
// 删除教师
const handleDeleteTeacher = async (teacherId: string) => {
  try {
    const res = await deleteTeacherByClassId({ teacherId, classId: classIfo.value.classId })
    if (res) {
      message.success('删除教师成功')
      getTeacherList()
    } else {
      message.error('删除教师失败')
    }
  } catch (error) {
    console.error('删除教师失败', error)
  }
}

// 获取教师列表
const getTeacherList = async () => {
  teacherLoading.value = true
  try {
    const res = await teachersByClassId({
      classId: classIfo.value.classId,
      gradeId: classIfo.value.gradeId,
    })
    teacherList.value = res || []
  } finally {
    teacherLoading.value = false
  }
}

// 获取学生列表
const getStudentList = async () => {
  const res = await studentsByClassId({
    classId: classIfo.value.classId,
    gradeId: classIfo.value.gradeId,
  })
  studentList.value = res || []
}

onMounted(() => {
  // 从路由参数获取信息
  const classInfoStr = route.query.data as string
  if (classInfoStr) {
    const decryptedInfo = decrypt(classInfoStr)
    classIfo.value = JSON.parse(decryptedInfo)
    getTeacherList()
  }
})
</script>

<style scoped lang="scss">
.class-detail {
  width: 100%;
  height: 100%;
  .class-detail-header {
    display: flex;
    align-items: center;
    .title {
      height: 24px;
      display: inline-block;
      color: #111827eb;
      font-size: 18px;
      font-weight: 700;
      line-height: 24px;
      padding-left: 30px;
    }
  }

  .class-detail-tab {
    padding: 20px;
    margin-top: 20px;
  }

  .empty-state {
    height: calc(100vh - 310px);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
