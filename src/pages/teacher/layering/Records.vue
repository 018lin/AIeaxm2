<template>
  <RecordsPage
    title="分层组卷管理"
    subTitle="查看和管理您的所有分层组卷任务"
    :columns="columns"
    :data-source="list"
    :total="total"
    :filterTypes="[gradeEnum, classEnum, subjectEnum]"
    emptyText="暂无分层组卷记录"
    :scroll="{ x: 1200 }"
    v-model:page="pageNo"
    v-model:pageSize="pageSize"
    v-model:viewPaperOpen="isViewPaperModalOpen"
    :preview-url="currentPreviewUrl"
    @search="getList"
    @pageChange="getList"
  >
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.key === 'num'">
        <span>{{ (pageNo - 1) * pageSize + index + 1 }}</span>
      </template>
      <template v-if="column.key === 'createTime'">
        <span>{{ record.createTime ? dayjs(record.createTime).format('YYYY-MM-DD HH:mm') : '--' }}</span>
      </template>
      <template v-if="column.key === 'layer'">
        <span>{{ record.layerNames || '-' }}</span>
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
import { selectEnum } from '@/enum/common'
import { ROUTES } from '@/router/routes'
import { encrypt } from '@/utils/crypto'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 分页
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 预览弹窗状态
const isViewPaperModalOpen = ref(false)
const currentPreviewUrl = ref('')

// select枚举
const gradeEnum = selectEnum.GRADE
const subjectEnum = selectEnum.SUBJECT
const classEnum = selectEnum.CLASS

// 列表数据
const list = ref<listExaminationItem[]>([])
const filters = ref<Record<string, any>>({})

// 表格列定义
const columns = [
  { title: '序号', dataIndex: 'num', key: 'num', width: 70, align: 'center' },
  { title: '作业名', dataIndex: 'assignmentName', ellipsis: true },
  { title: '组卷时间', dataIndex: 'createTime', key: 'createTime', width: 150, align: 'center' },
  { title: '年级', dataIndex: 'gradeName', width: 100, align: 'center' },
  { title: '班级', dataIndex: 'className', width: 100, align: 'center' }, // 新增班级列
  { title: '科目', dataIndex: 'subjectName', width: 100, align: 'center' },
  { title: '分层', key: 'layer', width: 120, align: 'center' }, // 新增分层列
  { title: '题量', dataIndex: 'questionNumbers', width: 80, align: 'center' },
  { title: '状态', key: 'status', width: 100, align: 'center' },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

onMounted(() => {
  getList()
})

// 获取列表
const getList = async (params?: Record<string, any>) => {
  if (params) {
    filters.value = { ...filters.value, ...params }
    pageNo.value = 1
  }
  try {
    const res = await listExamination({
      ...filters.value,
      assignmentType: 'LAYER_PACK',
      pageNo: pageNo.value,
      pageSize: pageSize.value,
    })
    list.value = res?.list || []
    total.value = Number(res?.total || 0)
  } catch (e: any) {
    list.value = []
    total.value = 0
    message.error(e?.message || '获取分层组卷记录失败')
  }
}

// 继续组卷
const resumeCompose = async (item: listExaminationItem) => {
  const assignmentId = item.assignmentId || ''
  const res = await spliceExamination({ assignmentId })
  if (res) {
    const encryptedId = encrypt(assignmentId)
    router.push({ path: ROUTES.TEACHER_LAYERED_CLASS_COMPOSE, query: { assignmentId: encryptedId } })
  }
}

// 查看记录
const viewRecord = (item: listExaminationItem) => {
  if (!item.fileUrl) {
    message.warning('当前记录没有可预览文件')
    return
  }
  currentPreviewUrl.value = item.fileUrl
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
