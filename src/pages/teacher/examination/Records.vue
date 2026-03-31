<!-- 智能组卷  -->
<template>
  <RecordsPage
    title="组卷记录"
    subTitle="查看和管理您的所有组卷任务"
    :columns="columns"
    :data-source="list"
    :total="total"
    v-model:page="pageNo"
    v-model:pageSize="pageSize"
    v-model:viewPaperOpen="isViewPaperModalOpen"
    :preview-url="currentPreviewUrl"
    @search="getparams"
    @pageChange="getList"
    @create="gotoCreate"
  >
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.key === 'num'">
        <span>{{ (pageNo - 1) * pageSize + index + 1 }}</span>
      </template>
      <template v-if="column.key === 'createTime'">
        <span>{{ record.createTime ? formatTimestamp(record.createTime, 'YYYY-MM-DD') : '' }}</span>
      </template>
      <template v-if="column.key === 'status'">
        <StatusCell :status="record.status" />
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell
          :record="record"
          @resume="resumeCompose"
          @view="viewRecord"
          @copy="copyRecord"
          @delete="deleteRecord"
        />
      </template>
    </template>
  </RecordsPage>
</template>

<script setup lang="ts">
import { copyExamination, deleteExamination, listExamination, spliceExamination } from '@/api/examination/index'
import type { listExaminationItem } from '@/api/examination/type'
import RecordsPage from '@/components/common/page/RecordsPage.vue'
import ActionCell from '@/components/common/table/ActionCell.vue'
import StatusCell from '@/components/common/table/StatusCell.vue'
import { QuestionBasketEnum } from '@/enum/common'
import { ROUTES } from '@/router/routes'
import { encrypt } from '@/utils/crypto'
import { formatTimestamp } from '@/utils/time'
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

// 分页
const pageNo = ref(1)
const pageSize = ref(8)
const total = ref(0)

// 预览弹窗状态
const isViewPaperModalOpen = ref(false)
const currentPreviewUrl = ref('')

// 参数类型定义
interface FilterParams {
  key: keyof typeof filters
  value: string | undefined
}

// 列表数据
const list = ref<listExaminationItem[]>([])
const filters = reactive({
  startDate: '', // 开始日期
  endDate: '', // 结束日期
  status: 'all', // 状态
})

// 表格列
const columns = [
  { title: '序号', dataIndex: 'num', key: 'num', width: 80, fixed: 'left', align: 'center' },
  { title: '组卷时间', dataIndex: 'createTime', key: 'createTime', width: 120, align: 'center' },
  { title: '年级', dataIndex: 'gradeName', width: 100, align: 'center' },
  { title: '科目', dataIndex: 'subjectName', width: 100, align: 'center' },
  { title: '作业名', dataIndex: 'assignmentName' },
  { title: '题量', dataIndex: 'questionNumbers', width: 100, align: 'center' },
  { title: '状态', key: 'status', width: 120, align: 'center' },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
]

onMounted(() => {
  getList()
})

const gotoCreate = () => {
  router.push({ path: ROUTES.TEACHER_EXAMINATION }).catch(() => {})
}

const getparams = (params: FilterParams) => {
  // 参数校验，避免解构 null 值
  if (!params || typeof params !== 'object') {
    console.warn('Invalid params received:', params)
    return
  }
  Object.assign(filters, params)

  // 重置分页并刷新列表
  pageNo.value = 1
  getList()
}

// 获取列表
const getList = async () => {
  const params1 = {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    assignmentType: QuestionBasketEnum.BOOK,
    startDate: filters.startDate,
    endDate: filters.endDate,
    status: filters.status === 'all' ? undefined : filters.status,
  }
  const res = await listExamination(params1)
  list.value = res.list || []
  total.value = res.total || 0
}

// 继续组卷
const resumeCompose = async (item: listExaminationItem) => {
  const assignmentId = item.assignmentId || ''
  const res = await spliceExamination({ assignmentId })
  if (res) {
    message.success(`已将该试卷的${item.questionNumbers || 0}道题加入试题篮`)
    const encryptedId = encrypt(assignmentId)
    router.push({ path: ROUTES.TEACHER_EXAMINATION, query: { assignmentId: encryptedId } }).catch(() => {})
  }
}

// 查看记录
const viewRecord = (item: listExaminationItem) => {
  currentPreviewUrl.value = item.fileUrl || ''
  isViewPaperModalOpen.value = true
}

// 复制记录
const copyRecord = async (item: listExaminationItem) => {
  const res = await copyExamination({ assignmentId: item.assignmentId || '' })
  if (res) {
    message.success('复制成功')
    pageNo.value = 1
    getList()
  }
}

// 删除记录
const deleteRecord = async (id: string) => {
  const res = await deleteExamination({ assignmentId: id })
  if (res) {
    message.success('删除成功')
    pageNo.value = 1
    getList()
  }
}
</script>
