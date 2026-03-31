<template>
  <div class="teacher-main">
    <div class="teacher-main-search app-surface">
      <GradeClassFilter :selectValue="[filters.gradeId, filters.classId]" @getList="handleFilter" />
      <a-select v-model:value="filters.status" placeholder="请选择状态" style="width: 200px">
        <a-select-option :value="'1'">已禁用</a-select-option>
        <a-select-option :value="'0'">已启用</a-select-option>
      </a-select>
      <a-input v-model:value="filters.studentName" placeholder="请输入学生姓名" style="width: 200px; height: 44px" />
      <a-button type="primary" :icon="h(SearchOutlined)" @click="getList">搜索</a-button>
      <a-button type="primary" :icon="h(SyncOutlined)" @click="resetQuery">重置</a-button>
      <a-button type="primary" :icon="h(PlusOutlined)" @click="handleAddOrEdit(null)">新增</a-button>
      <a-button type="primary" :icon="h(UploadOutlined)" @click="changeImportOpen(true)">批量导入</a-button>
    </div>

    <!-- 表格 -->
    <div class="table-container app-surface" v-if="list.length">
      <a-table :columns="columns" :data-source="list" :pagination="false" :scroll="{ x: 1300, y: 530 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sex'">
            <a-tag color="cyan" v-if="record.sex === '1'">男</a-tag>
            <a-tag color="red" v-else-if="record.sex === '2'">女</a-tag>
          </template>
          <template v-if="column.key === 'classInfoList'">
            <a-tag color="blue" v-for="classInfo in record.classInfoList" :key="classInfo.classId">
              {{ classInfo.className }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag color="green" v-if="record.status === '0'">已启用</a-tag>
            <a-tag color="pink" v-else>已禁用</a-tag>
          </template>
          <template v-if="column.key === 'actions'">
            <div class="btn-box">
              <a-popconfirm
                title="确定要删除吗?"
                ok-text="是"
                cancel-text="否"
                @confirm="handleDelete(record.studentId)"
              >
                <a-button :icon="h(DeleteOutlined)" style="color: #f43f5e">删除</a-button>
              </a-popconfirm>
              <a-popconfirm
                title="确定要禁用吗?"
                ok-text="是"
                cancel-text="否"
                v-if="record.status === '0'"
                @confirm="disableOrEnable(record.studentUserId, '1')"
              >
                <a-button :icon="h(StopOutlined)" style="color: #f43f5e">禁用</a-button>
              </a-popconfirm>
              <a-popconfirm
                title="确定要启用吗?"
                ok-text="是"
                cancel-text="否"
                v-else
                @confirm="disableOrEnable(record.studentUserId, '0')"
              >
                <a-button :icon="h(PlayCircleOutlined)" style="color: #22c55e">启用</a-button>
              </a-popconfirm>
              <a-dropdown>
                <a-button :icon="h(EllipsisOutlined)" @click.prevent>更多</a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item>
                      <a-button type="link" :icon="h(EditOutlined)" @click="handleAddOrEdit(record.studentId)"
                        >编辑</a-button
                      >
                    </a-menu-item>
                    <a-menu-item>
                      <a-button type="link" :icon="h(KeyOutlined)" @click="handleResetPwd(record.studentUserId)">
                        重置密码
                      </a-button>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </template>
      </a-table>

      <TchPagination
        v-model:current="filters.pageNo"
        v-model:pageSize="filters.pageSize"
        :total="total"
        @change="getList"
      />
    </div>

    <!-- 空数据 -->
    <div class="empty-state" v-else>
      <a-empty :description="'暂无数据'" />
    </div>

    <!-- 批量导入 -->
    <StudentImport :open="importOpen" @close="changeImportOpen" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { resetUserPassword, updateUserStatus } from '@/api/adminCommon/index'
import { deleteStudent, getStudentPage } from '@/api/adminEducation/studentIndex'
import type { StudentsByClassIdResponse } from '@/api/adminEducation/type'
import StudentImport from '@/components/adminEducation/StudentImport.vue'
import GradeClassFilter from '@/components/common/table/GradeClassFilter.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import { ROUTES } from '@/router/routes'
import { encrypt } from '@/utils/crypto'
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  KeyOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  SyncOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 筛选条件
const filters = reactive<{
  pageNo: number
  pageSize: number
  gradeId?: string
  classId?: string
  status?: string
  studentName?: string
}>({
  pageNo: 1,
  pageSize: 10,
  gradeId: undefined,
  classId: undefined,
  status: undefined,
  studentName: '',
})
const list = ref<StudentsByClassIdResponse[]>([]) // 班级列表
const total = ref(0) // 班级列表总数
// 批量导入
const importOpen = ref(false)
const columns = [
  { title: '姓名', dataIndex: 'studentName', key: 'studentName', fixed: 'left', width: 150 },
  { title: '性别', key: 'sex' },
  { title: '学号', dataIndex: 'studentCode', key: 'studentCode' },
  { title: '所在年级', dataIndex: 'gradeName', key: 'gradeName' },
  { title: '所在班级', dataIndex: 'className', key: 'className' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'actions', fixed: 'right', width: 300 },
]

// 编辑 / 新增
const handleAddOrEdit = async (studentId: string | null) => {
  const params: any = {}
  if (studentId) {
    params.studentId = encrypt(studentId)
  }
  router.push({
    path: ROUTES.ADMIN_EDUCATION_STUDENT_CREATE,
    query: params,
  })
}

// 重置密码
const handleResetPwd = async (userId: string) => {
  if (!userId) {
    message.error('用户ID不存在，无法重置密码')
    return
  }
  try {
    await resetUserPassword({ userId })
    Modal.success({
      title: '重置密码成功',
      content: '密码已重置为：Aa123456',
    })
  } catch (error) {
    console.error('密码重置失败', error)
    message.error('密码重置失败')
  }
}

// 删除学生
const handleDelete = async (studentId: string) => {
  try {
    const res = await deleteStudent({ studentId })
    if (res) {
      message.success('删除学生成功')
      filters.pageNo = 1
      getList()
    } else {
      message.error('删除学生失败')
    }
  } catch (error) {
    console.error('删除学生失败', error)
  }
}

// 启用 / 禁用
const disableOrEnable = async (userId: string, status: string) => {
  const res = await updateUserStatus({ userId, status })
  if (res) {
    message.success(status === '0' ? '启用成功' : '禁用成功')
    getList()
  } else {
    message.error(status === '0' ? '启用失败' : '禁用失败')
  }
}

// 批量导入
const changeImportOpen = (status: boolean) => {
  importOpen.value = status
}

// 筛选刷新
const resetQuery = () => {
  filters.gradeId = undefined
  filters.classId = undefined
  filters.status = undefined
  filters.teacherName = ''
  filters.pageNo = 1
  filters.pageSize = 12
  getList()
}

// 获取列表
const getList = async () => {
  const res = await getStudentPage(filters)
  list.value = res.list || []
  total.value = res.total || 0
}

// 筛选
const handleFilter = (params: any) => {
  if ('gradeId' in params) {
    const nextGrade = params.gradeId || undefined
    if (nextGrade !== filters.gradeId) {
      filters.gradeId = nextGrade
      filters.classId = undefined // 清空班级选择
    }
  }
  // 处理班级变化
  if ('classId' in params) {
    filters.classId = params.classId || undefined
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.teacher-main {
  width: 100%;
  height: 100%;
  min-width: 1080px;

  .teacher-main-search {
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .table-container {
    padding: 20px;
    margin-top: 20px;
    .btn-box {
      display: flex;
      gap: 8px;
    }
  }

  .empty-state {
    height: calc(100vh - 310px);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
