<template>
  <div class="layered">
    <!-- 步骤 1 -->
    <section class="step-one app-surface">
      <div class="step-title">
        <div class="step-title-icon">
          <Icon icon="clarity:group-solid" class="mr-10 text-orange" width="24" />
          分层选择
        </div>
        <div class="step-title-text">步骤 1</div>
      </div>

      <div class="user-select">
        <GradeClassFilter :selectValue="[gradeId, classId]" @getList="handleFilter" isStore />
        <SelectCom :typeList="[selectEnum.SUBJECT]" :selectValue="[subjectId]" @getList="handleFilterSubject" />
        <a-select v-model:value="layeredIds" mode="tags" placeholder="请选择分层，可多选" style="width: 300px">
          <a-select-option v-for="option in plainOptions" :key="option.groupId" :value="option.groupId">
            {{ option.groupName }}
          </a-select-option>
        </a-select>
      </div>
    </section>

    <!-- 步骤 2 -->
    <section class="app-surface" id="step-2">
      <div class="step-title">
        <div class="step-title-icon">
          <Icon icon="fluent:document-bullet-list-20-filled" class="mr-10 text-orange" width="24" />
          挑题
        </div>
        <div class="step-title-text">步骤 2</div>
      </div>

      <div class="exam-container">
        <!-- 左侧侧边栏 -->
        <div class="slide-box">
          <SidebarTabs :allTabs="allTabs" @updateSelectedKeys="handleSelectedKeys" @tabChange="tabChange" />
        </div>

        <!-- 右侧内容区 -->
        <main class="exam-content flex-col flex-1 gap-sm">
          <!-- 顶部筛选区 -->
          <QuestionTopFilter @getList="getparams" />

          <QuestionList v-if="questionList.length" source="LEVEL" :list="questionList" :page="{ pageNo, pageSize }" />

          <div v-else class="mk-empty app-surface">
            <a-empty :image="simpleImage" description="暂无数据" />
          </div>

          <TchPagination
            v-if="total > 0"
            v-model:current="pageNo"
            v-model:pageSize="pageSize"
            :total="total"
            @change="getList"
            footerPadding="0 10px 10px"
          />
        </main>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getTagList } from '@/api/common/index'
import type { tagListResponse } from '@/api/common/type'
import { listQuestionBank } from '@/api/questionBank/index'
import type { questionBankItem } from '@/api/questionBank/type'
import QuestionList from '@/components/common/QuestionList.vue'
import QuestionTopFilter from '@/components/common/QuestionTopFilter.vue'
import SelectCom from '@/components/common/Select.vue'
import GradeClassFilter from '@/components/common/table/GradeClassFilter.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import SidebarTabs from '@/components/sidebarTabs/SidebarTabs.vue'
import { selectEnum, tagEnum } from '@/enum/common'
import { getUserBaseInfo } from '@/services/storage'
import { Icon } from '@iconify/vue'
import { Empty } from 'ant-design-vue'
import { onMounted, reactive, ref, watch } from 'vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

// 参数类型定义
interface FilterParams {
  key: keyof typeof filters
  value: string | undefined
}

// 状态
const parsedUserInfo = getUserBaseInfo()
const gradeId = ref(parsedUserInfo?.gradeId || '') // 年级ID
const classList = ref(parsedUserInfo?.classInfoList || []) // 班级列表
const subjectId = ref(parsedUserInfo?.subjectId || '') // 当前选择的学科ID
const classId = ref<string>('') // 当前选择的班级ID
const layeredIds = ref<string[]>([]) // 已分层的题目ID列表
const plainOptions = [
  { groupName: '基础层', groupId: '1' },
  { groupName: '提高层', groupId: '2' },
  { groupName: '拓展层', groupId: '3' },
]
const allTabs = [
  { key: 'chapter', label: '章节' },
  { key: 'knowledge', label: '知识点' },
  { key: 'layered', label: '分层错题库' },
]
const pageNo = ref(1)
const pageSize = ref(5)
const total = ref(0)
const questionList = ref<questionBankItem[]>([]) // 题库列表
const difficultyTagList = ref<tagListResponse[]>([]) // 难度标签列表
const questionTypeList = ref<tagListResponse[]>([]) // 题型标签列表
const filters = reactive({
  questionType: '', // 题型
  difficulty: '', // 难度
  knowledgePointId: '', // 知识点
  chapterId: '', // 章节
  groupId: '', // 分层ID
})

// 步骤1：选择数据-学科
const handleFilterSubject = (val: any) => {
  if ('subjectId' in val) subjectId.value = val.subjectId
}

// 步骤1：选择数据-年级，班级联动
const handleFilter = (params: any) => {
  // 处理年级变化：年级变化时需要清空班级选择（因为不同年级的班级不同）
  if ('gradeId' in params) {
    const nextGrade = params.gradeId || undefined
    if (nextGrade !== gradeId.value) {
      gradeId.value = nextGrade
      classId.value = '' // 清空班级选择
    }
  }
  // 处理班级变化
  if ('classId' in params) {
    classId.value = params.classId || undefined
  }
  // 处理科目变化
  if ('subjectId' in params) {
    subjectId.value = params.subjectIdd || undefined
  }
}

onMounted(() => {
  // 获取题库列表
  getList()
  // 获取难度标签
  getTags(tagEnum.DIFFICULTY)
  // 获取题型标签
  getTags(tagEnum.QUESTION_TYPE)
})

// 获取标签列表
const getTags = async (tagTypeVal: string) => {
  const res = await getTagList({ tagType: tagTypeVal })
  if (tagTypeVal === tagEnum.DIFFICULTY) {
    difficultyTagList.value = res || []
  } else if (tagTypeVal === tagEnum.QUESTION_TYPE) {
    questionTypeList.value = res || []
  }
}

// 获取参数
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

// 切换Tab
const tabChange = (key: string) => {
  if (key === 'chapter') {
    filters.knowledgePointId = ''
  } else if (key === 'knowledge') {
    filters.chapterId = ''
  } else if (key === 'layered') {
    filters.groupId = ''
  }
  getList()
}

// 列表接口
const getList = async () => {
  const params = {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    questionType: filters.questionType,
    difficulty: filters.difficulty,
    knowledgePointId: filters.knowledgePointId,
    chapterId: filters.chapterId,
    groupId: filters.groupId,
  }
  const res = await listQuestionBank(params)
  questionList.value = res.list || []
  total.value = res.total || 0
}

// 知识树节点选中
const handleSelectedKeys = (pointCode: string, type: string) => {
  if (type === 'knowledge') {
    filters.knowledgePointId = pointCode
  } else if (type === 'chapter') {
    filters.chapterId = pointCode
  } else if (type === 'layered') {
    filters.groupId = pointCode
  }
  getList()
}

// 监听 classList，生成 classId
watch(
  classList,
  newAllClassList => {
    if (!newAllClassList || newAllClassList.length === 0) {
      return
    }
    // 根据 classIds 过滤 allClassList
    classId.value = classList.value[0]?.classId ?? ''
  },
  { deep: true, immediate: true }
)
</script>

<style scoped lang="scss">
.layered {
  width: 100%;
  height: 100%;

  .step-title {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f2ebe6;

    .step-title-icon {
      display: flex;
      align-items: center;
      font-weight: 700;
      color: var(--color-text-primary);
      font-size: 18px;
      .mr-10 {
        margin-right: 10px;
        color: var(--color-primary);
      }
    }
    .step-title-text {
      background: var(--color-info-bg);
      color: var(--color-info);
      border-radius: 6px;
      padding: 4px 12px;
      font-weight: 700;
      font-size: 13px;
    }
  }

  .step-one {
    margin-bottom: 20px;
    .user-select {
      width: 100%;
      padding: 20px;
      display: flex;
      gap: 10px;
    }
  }

  :deep(.ant-select-multiple .ant-select-selection-item) {
    height: 36px !important;
  }

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

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
  }
}

:deep(.mk-list) {
  border: 1px solid #f2ebe6;
  background: #f8f7f6;
  padding: 10px;
}
</style>
