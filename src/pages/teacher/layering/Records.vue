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
        <!-- 假设后端返回 layerNames 字段，或者根据业务逻辑显示 -->
        <span>{{ record.layerNames || '基础、标准' }}</span>
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
import { copyExamination, deleteExamination, spliceExamination } from '@/api/examination/index'
import type { listExaminationItem } from '@/api/examination/type'
import RecordsPage from '@/components/common/page/RecordsPage.vue'
import ActionCell from '@/components/common/table/ActionCell.vue'
import StatusCell from '@/components/common/table/StatusCell.vue'
import { assignmentStateEnum, selectEnum } from '@/enum/common'
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
const getList = async () => {
  // Mock 数据
  list.value = [
    {
      id: '1',
      createTime: Date.now() - 10000000,
      gradeName: '四年级',
      className: '一班',
      subjectName: '数学',
      layerNames: '基础、标准',
      assignmentName: '错题组卷-小测1.5',
      questionNumbers: 2,
      status: assignmentStateEnum.FINALIZED,
    },
    {
      id: '2',
      createTime: Date.now() - 20000000,
      gradeName: '五年级',
      className: '一班',
      subjectName: '语文',
      layerNames: '基础、标准',
      assignmentName: '单元测试-第三单元',
      questionNumbers: 3,
      status: assignmentStateEnum.FINALIZED,
    },
    {
      id: '3',
      createTime: Date.now() - 30000000,
      gradeName: '六年级',
      className: '一班',
      subjectName: '数学',
      layerNames: '基础、标准',
      assignmentName: '练习A卷',
      questionNumbers: 4,
      status: assignmentStateEnum.FINALIZED,
    },
    {
      id: '4',
      createTime: Date.now() - 40000000,
      gradeName: '四年级',
      className: '一班',
      subjectName: '数学',
      layerNames: '基础、标准',
      assignmentName: '课后练习-小数乘法',
      questionNumbers: 2,
      status: assignmentStateEnum.DRAFT,
    },
    {
      id: '5',
      createTime: Date.now() - 50000000,
      gradeName: '三年级',
      className: '一班',
      subjectName: '英语',
      layerNames: '基础、标准',
      assignmentName: '英语单词听写模板',
      questionNumbers: 3,
      status: assignmentStateEnum.FINALIZED,
    },
  ] as any[]
  total.value = 5
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
  // TODO: Replace with actual file URL from item or API
  // 模拟 PDF 链接，实际应从 item.fileUrl 或接口获取
  currentPreviewUrl.value = 'https://arxiv.org/pdf/2401.00001.pdf' // 示例 PDF
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
