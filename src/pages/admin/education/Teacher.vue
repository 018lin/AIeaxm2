<template>
  <div class="teacher-main">
    <div class="teacher-main-search app-surface">
      <GradeClassFilter :selectValue="[filters.gradeId, filters.classId]" @getList="handleFilter" />
      <SelectCom :typeList="[selectEnum.SUBJECT]" :select-value="selectValue" @getList="handleFilter" />
      <a-select v-model:value="filters.status" placeholder="请选择状态" style="width: 200px">
        <a-select-option :value="'1'">已禁用</a-select-option>
        <a-select-option :value="'0'">已启用</a-select-option>
      </a-select>
      <a-input v-model:value="filters.teacherName" placeholder="请输入教师姓名" style="width: 200px; height: 44px" />
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
            <a-tag color="blue" v-for="classInfo in record.classInfoList" :key="classInfo.classId">{{
              classInfo.className
            }}</a-tag>
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
                @confirm="handleDelete(record.teacherId)"
              >
                <a-button :icon="h(DeleteOutlined)" style="color: #f43f5e">删除</a-button>
              </a-popconfirm>
              <a-popconfirm
                title="确定要禁用吗?"
                ok-text="是"
                cancel-text="否"
                v-if="record.status === '0'"
                @confirm="disableOrEnable(record.userId, '1')"
              >
                <a-button :icon="h(StopOutlined)" style="color: #f43f5e">禁用</a-button>
              </a-popconfirm>
              <a-popconfirm
                title="确定要启用吗?"
                ok-text="是"
                cancel-text="否"
                v-else
                @confirm="disableOrEnable(record.userId, '0')"
              >
                <a-button :icon="h(PlayCircleOutlined)" style="color: #22c55e">启用</a-button>
              </a-popconfirm>
              <a-dropdown>
                <a-button :icon="h(EllipsisOutlined)" @click.prevent>更多</a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item>
                      <a-button type="link" :icon="h(EditOutlined)" @click="handleAddOrEdit(record.teacherId)"
                        >编辑</a-button
                      >
                    </a-menu-item>
                    <a-menu-item>
                      <a-button type="link" :icon="h(KeyOutlined)" @click="handleResetPwd(record.userId)">
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
    <TeacherImport :open="importOpen" @close="changeImportOpen" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { resetUserPassword, updateUserStatus } from '@/api/adminCommon/index'
import { deleteTeacher, getTeacherPage } from '@/api/adminEducation/teacherIndex'
import type { TeachersByClassIdResponse } from '@/api/adminEducation/type'
import { getDictList } from '@/api/common/index'
import type { dictListResponse } from '@/api/common/type'
import TeacherImport from '@/components/adminEducation/TeacherImport.vue'
import SelectCom from '@/components/common/Select.vue'
import GradeClassFilter from '@/components/common/table/GradeClassFilter.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import { selectEnum } from '@/enum/common'
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
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 筛选条件
const filters = reactive<{
  pageNo: number
  pageSize: number
  subjectId?: string
  gradeId?: string
  classId?: string
  status?: string
  teacherName?: string
}>({
  pageNo: 1,
  pageSize: 10,
  subjectId: undefined,
  gradeId: undefined,
  classId: undefined,
  status: undefined,
  teacherName: '',
})
const selectValue = computed(() => [filters.subjectId])
const subjectList = ref<dictListResponse[]>([]) // 学科字典列表
const list = ref<TeachersByClassIdResponse[]>([]) // 班级列表
const total = ref(0) // 班级列表总数
// 批量导入
const importOpen = ref(false)
const columns = [
  { title: '姓名', dataIndex: 'teacherName', key: 'teacherName', fixed: 'left', width: 100 },
  { title: '性别', key: 'sex', width: 100 },
  { title: '用户ID', dataIndex: 'userId', key: 'userId' },
  { title: '手机号', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 150 },
  { title: '授课年级', dataIndex: 'gradeName', key: 'gradeName', width: 100 },
  { title: '授课学科', dataIndex: 'subjectName', key: 'subjectName', width: 100 },
  { title: '授课班级', key: 'classInfoList' },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'actions', fixed: 'right', width: 300 },
]

// 编辑 / 新增
const handleAddOrEdit = async (teacherId: string | null) => {
  const params: any = {}
  if (teacherId) {
    params.teacherId = encrypt(teacherId)
  }
  router.push({
    path: ROUTES.ADMIN_EDUCATION_TEACHER_CREATE,
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

// 删除教师
const handleDelete = async (teacherId: string) => {
  try {
    const res = await deleteTeacher({ teacherId })
    if (res) {
      message.success('删除教师成功')
      filters.pageNo = 1
      getList()
    } else {
      message.error('删除教师失败')
    }
  } catch (error) {
    console.error('删除教师失败', error)
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
  filters.subjectId = undefined
  filters.classId = undefined
  filters.status = undefined
  filters.teacherName = ''
  filters.pageNo = 1
  filters.pageSize = 12
  getList()
}

// 获取列表
const getList = async () => {
  const res = await getTeacherPage(filters)
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
  // 处理科目变化
  if ('subjectId' in params) {
    filters.subjectId = params.subjectId || undefined
  }
}

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  const resData = res || []

  // 遍历返回的字典数据，根据 dictType 分别赋值
  resData.forEach(item => {
    if (item.dictType === selectEnum.SUBJECT) {
      subjectList.value = item.dictTypeList || []
    }
  })
}

onMounted(() => {
  getDictData([selectEnum.SUBJECT])
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
