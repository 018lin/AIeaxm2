<template>
  <div class="weekly">
    <div class="weekly-filters app-surface">
      <h2 class="weekly-title">{{ gradeName }} {{ subjectName }}</h2>
      <div class="weekly-search">
        <RangePicker @getList="getparams" />
        <a-select placeholder="请选择班级" style="width: 120px" v-model:value="classId" class="table-top-select">
          <a-select-option value="">全部班级</a-select-option>
          <a-select-option v-for="item in classList" :key="item.classId" :value="item.classId">
            {{ item.className }}
          </a-select-option>
        </a-select>
        <a-select v-model:value="state" placeholder="请选择状态" style="width: 120px" class="table-top-select">
          <a-select-option value="all">全部状态</a-select-option>
          <a-select-option value="draft">未定稿</a-select-option>
          <a-select-option value="finalized">已定稿</a-select-option>
        </a-select>
        <a-button
          class="download-btn"
          type="primary"
          :icon="h(ArrowDownOutlined)"
          @click="batchDownloadHandler"
          :loading="loading"
        >
          批量下载
        </a-button>
      </div>
    </div>

    <div class="wk-table table-card--primary" ref="tableRef" v-if="list.length">
      <a-table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        row-key="assignmentId"
        class="table--primary"
        :row-selection="rowSelection"
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
            <div class="wk-ops">
              <a-button
                size="small"
                class="wk-download green"
                v-if="record.status === assignmentStateEnum.FINALIZED"
                @click="download(record.assignmentId)"
              >
                下载
              </a-button>
              <a-button size="small" class="wk-finalize primary" v-else @click="finalizeLater(record)">去定稿</a-button>
            </div>
          </template>
        </template>
      </a-table>
      <TchPagination v-model:current="pageNo" v-model:pageSize="pageSize" :total="total" />
    </div>
    <div class="rc-empty app-surface" v-else>
      <a-empty :image="simpleImage" description="暂无数据" />
    </div>

    <PreviewExam
      :open="previewVisible"
      :info="info"
      :localData="localData"
      @close="handlepreviewClose"
      @update:localData="val => (localData = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { downloadExamination, listExamination } from '@/api/examination/index'
import type { listExaminationItem, previewExaminationResponse } from '@/api/examination/type'
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import { batchDownload, toFinalized } from '@/api/recompose/index'
import RangePicker from '@/components/common/table/RangePicker.vue'
import StatusCell from '@/components/common/table/StatusCell.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import PreviewExam from '@/components/previewExam/PreviewExam.vue'
import { assignmentStateEnum, QuestionBasketEnum } from '@/enum/common'
import { getUserBaseInfo } from '@/services/storage'
import { formatTimestamp } from '@/utils/time'
import { ArrowDownOutlined } from '@ant-design/icons-vue'
import { Empty, message } from 'ant-design-vue'
import { h, onMounted, reactive, ref, watch } from 'vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

// 参数类型定义
interface FilterParams {
  key: keyof typeof filters
  value: string | undefined
}

// 状态
const parsedUserInfo = getUserBaseInfo()
const gradeName = ref(parsedUserInfo?.gradeName || '') // 年级名称
const subjectName = ref(parsedUserInfo?.subjectName || '') // 学科名称
const classList = ref(parsedUserInfo?.classInfoList || []) // 班级列表
const classId = ref<string>('') // 当前选择的班级ID
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const list = ref<listExaminationItem[]>([])
const selectedRowKeys = ref<string[]>([])
const filters = reactive<{
  classId?: string
  startDate?: string
  endDate?: string
}>({})
// 预览作业
const previewVisible = ref(false) // 预览作业
const info = ref<previewExaminationResponse | null>(null)
const localData = ref<QuestionBasketRsponse[]>([])
const loading = ref(false)
const state = ref('all')

const download = async (assignmentId: string) => {
  const res = await downloadExamination({ assignmentId })
  if (!res) return
  // 创建a标签下载
  const link = document.createElement('a')
  link.href = res
  // 使用作业名称作为文件名
  link.download = info.value?.assignmentName || 'downloaded-file'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
const finalizeLater = (row: any) => {
  getFinalizedData(row.assignmentId)
  previewVisible.value = true
}
// 关闭预览作业弹窗
const handlepreviewClose = () => {
  previewVisible.value = false
  getList()
}
// 获取试卷数据
const getFinalizedData = async (assignmentId: string) => {
  const res = await toFinalized({ assignmentId })
  if (!res) return
  info.value = {
    assignmentId: res.assignmentId || '',
    assignmentName: res.assignmentName || '',
    gradeId: res.gradeId || '',
    gradeName: res.gradeName || '',
    qrCodeContent: res.qrCodeContent || '',
    subjectId: res.subjectId || '',
    subjectName: res.subjectName || '',
    teacherId: res.teacherId || '',
  }
  localData.value = JSON.parse(JSON.stringify(res.questionList || []))
}
const batchDownloadHandler = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请勾选要下载的试卷')
    return
  }
  loading.value = true
  try {
    const blob = await batchDownload({ assignmentList: selectedRowKeys.value })
    loading.value = false
    if (!blob) {
      message.error('下载失败')
      return
    }

    // 创建Blob URL并触发下载
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `试卷批量下载_${new Date().getTime()}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    message.success('下载成功')
    selectedRowKeys.value = [] // 下载完成后清空选择
  } catch (error: any) {
    console.error('批量下载错误:', error)
    message.error('下载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const rowSelection = reactive({
  selectedRowKeys: selectedRowKeys,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys
  },
  getCheckboxProps: (record: listExaminationItem) => ({
    disabled: record.status !== assignmentStateEnum.FINALIZED,
  }),
})

onMounted(() => {
  getList()
})

watch([() => classId.value, () => state.value], () => {
  pageNo.value = 1
  getList()
})

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
  const params = {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    assignmentType: QuestionBasketEnum.AUTOWRONG,
    startDate: filters.startDate,
    endDate: filters.endDate,
    classId: classId.value,
    status: state.value === 'all' ? undefined : state.value,
  }
  const res = await listExamination(params)
  list.value = res.list || []
  total.value = res.total || 0
}
const columns = [
  { title: '序号', dataIndex: 'num', key: 'num', width: 80, fixed: 'left', align: 'center' },
  { title: '作业生成时间', dataIndex: 'createTime', key: 'createTime', width: 120, align: 'center' },
  { title: '班级', dataIndex: 'className', width: 100 },
  { title: '作业名', dataIndex: 'assignmentName' },
  { title: '题量', dataIndex: 'questionNumbers', width: 100, align: 'center' },
  { title: '状态', key: 'status', width: 120, align: 'center' },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
]
</script>

<style scoped lang="scss">
.weekly {
  .weekly-filters {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .weekly-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: rgba(17, 24, 39, 0.9);
      letter-spacing: 0.2px;
    }
    .weekly-search {
      display: flex;
      gap: 10px;
      .download-btn {
        height: 44px;
      }
    }
  }

  .wk-table {
    .wk-ops {
      display: flex;
      gap: 8px;
    }
  }
}
.rc-empty {
  width: 100%;
  height: 700px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
