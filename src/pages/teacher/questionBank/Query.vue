<template>
  <div class="exam-page">
    <div class="exam-container">
      <!-- 左侧侧边栏 -->
      <div class="slide-box">
        <SidebarTabs :allTabs="allTabs" @getList="getparams" @tabChange="tabChange" />
      </div>

      <!-- 右侧内容区 -->
      <main class="exam-content flex-col flex-1 gap-sm">
        <!-- 顶部筛选区 -->
        <div class="query-toolbar">
          <QuestionTopFilter class="query-filter" @getList="getparams" showAnswer :subjectId="filters.subjectId" />
          <a-button type="primary" class="entry-btn primary-btn" @click="isUploadModalOpen = true">
            <template #icon><PlusOutlined /></template>
            录入题目
          </a-button>
        </div>

        <template v-if="questionList.length">
          <QuestionList
            :list="questionList"
            source="BANK"
            :page="{ pageNo: filters.pageNo, pageSize: filters.pageSize }"
            showBasketBtn
            @refreshList="getList"
          />

          <TchPagination
            v-model:current="filters.pageNo"
            v-model:pageSize="filters.pageSize"
            :total="total"
            @change="getList"
            footer-padding="0px 10px 10px"
          />
        </template>
        <template v-else>
          <div class="mk-empty app-surface">
            <a-empty :image="simpleImage" description="暂无数据" />
          </div>
        </template>
        <UploadPaperModal v-model:open="isUploadModalOpen" @submit="handleUploadSubmit" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getQuestionBankDetailList, listQuestionBank, queryQuestionBankDetailPage } from '@/api/questionBank/index'
import type {
  ImportQuestionBankBatchResponse,
  listQuestionBankRequest,
  QuestionBankDetailResponse,
  questionBankItem,
} from '@/api/questionBank/type'
import QuestionList from '@/components/common/QuestionList.vue'
import QuestionTopFilter from '@/components/common/QuestionTopFilter.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import UploadPaperModal from '@/components/questionBank/UploadPaperModal.vue'
import SidebarTabs from '@/components/sidebarTabs/SidebarTabs.vue'

import { PlusOutlined } from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import { reactive, ref } from 'vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

// 参数类型定义
interface FilterParams {
  key: keyof typeof filters
  value: string | undefined
}

// 分页与筛选
const total = ref(0)
const questionList = ref<questionBankItem[]>([]) // 题库列表
const isUploadModalOpen = ref(false)
const activeImportedDetailId = ref('')
const filters = reactive({
  pageNo: 1,
  pageSize: 5,
  questionType: '', // 题型
  difficulty: '', // 难度
  knowledgePointId: '', // 知识点
  chapterId: '', // 章节
  answered: '', // 答案完整性
  stageId: '', // 学段
  subjectId: '', // 学科
  gradeId: '', // 年级
  textbookVersionId: '', // 版本
  volumeId: '', // 册次
  assignmentType: 'chapter_query', // 章节/知识点
})
const allTabs = [
  { key: 'chapter', label: '章节' },
  // { key: 'knowledge', label: '知识点' },
  { key: 'platform', label: '平台题库' },
]

const stageLabelToIdMap: Record<string, string> = {
  小学: '1',
  初中: '2',
  高中: '3',
}
const subjectLabelToIdMap: Record<string, string> = {
  语文: '1',
  数学: '2',
  英语: '3',
  物理: '4',
  化学: '5',
  政治: '6',
  地理: '7',
  生物: '8',
}
const gradeLabelToIdMap: Record<string, string> = {
  一年级: '1',
  二年级: '2',
  三年级: '3',
  四年级: '4',
  五年级: '5',
  六年级: '6',
  七年级: '7',
  八年级: '8',
  九年级: '9',
  高一: '10',
  高二: '11',
  高三: '12',
}

const normalizeSelectValue = (value: unknown, labelMap?: Record<string, string>) => {
  const raw = String(value ?? '').trim()
  if (!raw || raw === 'all') return undefined
  return labelMap?.[raw] || raw
}

const buildQuestionPageParams = (): listQuestionBankRequest & Record<string, any> => ({
  pageNo: filters.pageNo,
  pageSize: filters.pageSize,
  questionType: normalizeSelectValue(filters.questionType),
  difficulty: normalizeSelectValue(filters.difficulty),
  stageId: normalizeSelectValue(filters.stageId, stageLabelToIdMap),
  subjectId: normalizeSelectValue(filters.subjectId, subjectLabelToIdMap),
  gradeId: normalizeSelectValue(filters.gradeId, gradeLabelToIdMap),
  chapterId: normalizeSelectValue(filters.chapterId),
  knowledgePointId: normalizeSelectValue(filters.knowledgePointId),
  answered: normalizeSelectValue(filters.answered),
  textbookVersionId: normalizeSelectValue(filters.textbookVersionId),
  volume: normalizeSelectValue(filters.volumeId),
  assignmentType: normalizeSelectValue(filters.assignmentType),
})

// 获取参数
const getparams = (params: FilterParams) => {
  // 参数校验，避免解构 null 值
  if (!params || typeof params !== 'object') {
    console.warn('Invalid params received:', params)
    return
  }
  Object.assign(filters, params)
  activeImportedDetailId.value = ''

  // 重置分页并刷新列表
  filters.pageNo = 1
  getList()
}

// 切换Tab
const tabChange = (key: string) => {
  activeImportedDetailId.value = ''
  if (key === 'chapter') {
    filters.knowledgePointId = ''
    filters.assignmentType = 'chapter_query'
  } else if (key === 'knowledge') {
    filters.chapterId = ''
    filters.gradeId = ''
    filters.textbookVersionId = ''
    filters.volumeId = ''
    filters.assignmentType = 'knowledge_point_query'
  }
  getList()
}

// 列表接口
const getQuestionPageList = async () => {
  const res = await listQuestionBank(buildQuestionPageParams())
  questionList.value = res.list || []
  total.value = res.total || 0
}

const getImportedDetailList = async (detailId: string) => {
  const res = await getQuestionBankDetailList({
    detailId,
    pageNo: filters.pageNo,
    pageSize: filters.pageSize,
  })
  questionList.value = res.list || []
  total.value = res.total || 0
}

const getDetailIdFromRow = (row?: QuestionBankDetailResponse) => {
  const detailId = String(row?.detailId || '').trim()
  if (detailId) return detailId
  return row?.id === undefined || row?.id === null ? '' : String(row.id)
}

const resolveImportedDetailId = async (importResult?: ImportQuestionBankBatchResponse) => {
  const directDetailId = String(importResult?.detailId || '').trim()
  if (directDetailId) return directDetailId

  const batchId = String(importResult?.batchId || '').trim()
  const res = await queryQuestionBankDetailPage({
    pageNo: 1,
    pageSize: 1,
    batchId: batchId || undefined,
    stageId: normalizeSelectValue(filters.stageId, stageLabelToIdMap),
    subjectId: normalizeSelectValue(filters.subjectId, subjectLabelToIdMap),
    gradeId: normalizeSelectValue(filters.gradeId, gradeLabelToIdMap),
  })

  return getDetailIdFromRow(res?.list?.[0])
}

const getList = async (payload?: { pageNo?: number }) => {
  const nextPageNo = Number(payload?.pageNo)
  if (Number.isFinite(nextPageNo) && nextPageNo > 0) {
    filters.pageNo = nextPageNo
  }

  if (activeImportedDetailId.value) {
    await getImportedDetailList(activeImportedDetailId.value)
    return
  }

  await getQuestionPageList()
}

const handleUploadSubmit = async (payload?: { importResult?: ImportQuestionBankBatchResponse }) => {
  filters.pageNo = 1
  const importedDetailId = await resolveImportedDetailId(payload?.importResult)

  if (importedDetailId) {
    activeImportedDetailId.value = importedDetailId
    await getImportedDetailList(importedDetailId)
    return
  }

  activeImportedDetailId.value = ''
  await getQuestionPageList()
}
</script>

<style scoped lang="scss">
.exam-container {
  height: 100%;
  display: flex;
  gap: 15px;
  margin: 0 auto;
  align-items: flex-start;
  position: relative;
}

.mk-empty {
  height: calc(100vh - 124px);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 左侧侧边栏 */
.slide-box {
  width: 400px;
  height: var(--content-height);
  background: #fff;
  border-radius: 18px;
  padding: 20px;
}

/* 右侧内容区 */
.exam-content {
  min-width: 500px;
  overflow-x: auto;
  max-height: var(--content-height);
}

.query-toolbar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.query-filter {
  flex: 1;
  min-width: 0;
}

.entry-btn {
  height: 40px;
  flex: none;
  padding: 0 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
