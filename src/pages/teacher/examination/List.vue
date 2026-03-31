<template>
  <div class="exam-container">
    <!-- 左侧侧边栏 -->
    <div class="slide-box">
      <SidebarTabs :allTabs="allTabs" @getList="getparams" @tabChange="tabChange" />
    </div>

    <!-- 右侧内容区 -->
    <main class="exam-content flex-col flex-1 gap-md">
      <!-- 顶部筛选区 -->
      <QuestionTopFilter @getList="getparams" :subjectId="filters.subjectId" />

      <QuestionList
        v-if="questionList.length"
        source="BOOK"
        :list="questionList"
        :page="{ pageNo: filters.pageNo, pageSize: filters.pageSize }"
      />

      <div v-else class="mk-empty app-surface">
        <a-empty :image="simpleImage" description="暂无数据" />
      </div>

      <TchPagination
        v-if="total > 0"
        v-model:current="filters.pageNo"
        v-model:pageSize="filters.pageSize"
        :total="total"
        @change="getList"
        footer-padding="0px 10px 10px"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { listQuestionBank } from '@/api/questionBank/index'
import type { questionBankItem } from '@/api/questionBank/type'
import QuestionList from '@/components/common/QuestionList.vue'
import QuestionTopFilter from '@/components/common/QuestionTopFilter.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import SidebarTabs from '@/components/sidebarTabs/SidebarTabs.vue'

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
const filters = reactive({
  pageNo: 1,
  pageSize: 5,
  questionType: '', // 题型
  difficulty: '', // 难度
  chapterId: '', // 章节
  stageId: '', // 学段
  subjectId: '', // 学科
  gradeId: '', // 年级
  textbookVersionId: '', // 版本
  volumeId: '', // 册次
  assignmentType: 'chapter_query', // 章节/知识点
  knowledgePointId: '', // 知识点
})
const allTabs = [
  { key: 'chapter', label: '章节' },
  // { key: 'knowledge', label: '知识点' },
  { key: 'platform', label: '平台题库' },
]

// 获取参数
const getparams = (params: FilterParams) => {
  // 参数校验，避免解构 null 值
  if (!params || typeof params !== 'object') {
    console.warn('Invalid params received:', params)
    return
  }
  Object.assign(filters, params)

  // 重置分页并刷新列表
  filters.pageNo = 1
  getList()
}

// 切换Tab
const tabChange = (key: string) => {
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
const getList = async () => {
  const res = await listQuestionBank(filters)
  questionList.value = res.list || []
  total.value = res.total || 0
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
  overflow-x: auto;
  overflow-y: auto;
  max-height: var(--content-height);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
