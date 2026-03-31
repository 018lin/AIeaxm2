<template>
  <a-drawer
    :open="open"
    placement="right"
    :width="450"
    :closable="false"
    @close="close"
    class="qb-drawer"
    :z-index="1001"
  >
    <div class="qb">
      <div class="qb-head">
        <div class="qb-head-left">
          <span class="qb-bag" aria-hidden="true">
            <ShoppingOutlined />
          </span>
          <div class="qb-head-meta">
            <div class="qb-head-title">试题篮</div>
            <div class="qb-head-sub">
              已选试题（<span class="qb-count">{{ countObj.totalCount || 0 }}</span
              >道）
            </div>
          </div>
        </div>

        <button type="button" class="qb-close" aria-label="关闭" @click="close">
          <CloseOutlined />
        </button>
      </div>

      <a-tabs v-model:activeKey="tabActiveKey">
        <a-tab-pane key="1" :tab="`错题重组(${countObj.wrongCount}道)`">
          <QuestionBasketContent :list="wrongList" />
        </a-tab-pane>
        <a-tab-pane key="2" :tab="`智能组卷(${countObj.bookCount}道)`">
          <QuestionBasketContent :list="bookList" />
        </a-tab-pane>
        <a-tab-pane key="3" :tab="`分层作业(${countObj.levelCount}道)`">
          <QuestionBasketContent :list="levelList" />
        </a-tab-pane>
      </a-tabs>

      <div class="qb-actions">
        <button type="button" class="qb-action qb-action-ghost" :disabled="countObj.totalCount === 0" @click="clear">
          <DeleteOutlined />
          重新组卷
        </button>
        <button type="button" class="qb-action qb-action-light" :disabled="!canPreviewCurrentTab" @click="preview">
          <EyeOutlined />
          {{ assignmentId ? '预览并更新试卷' : '预览并暂存试卷' }}
        </button>
      </div>
    </div>
  </a-drawer>
  <PreviewExam
    :open="previewVisible"
    :info="info"
    :localData="localData"
    @close="handlepreviewClose"
    @update:localData="val => (localData = val)"
  />
</template>

<script setup lang="ts">
import { getDictList } from '@/api/common/index'
import type { dictListResponse } from '@/api/common/type'
import { previewExamination } from '@/api/examination/index'
import type { previewExaminationResponse } from '@/api/examination/type'
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import PreviewExam from '@/components/previewExam/PreviewExam.vue'
import QuestionBasketContent from '@/components/questionBasket/QuestionBasketContent.vue'
import { QuestionBasketEnum, selectEnum } from '@/enum/common'
import { questionBasketService } from '@/services/questionBasket'
import { getUserBaseInfo } from '@/services/storage'
import { CloseOutlined, DeleteOutlined, EyeOutlined, ShoppingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()

// 父组件传值
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean]; distribute: [] }>()

// 试题篮列表数据
const bookList = questionBasketService.bookList
const wrongList = questionBasketService.wrongList
const levelList = questionBasketService.levelList
const assignmentId = questionBasketService.assignmentId
const countObj = reactive({
  bookCount: questionBasketService.bookCount,
  wrongCount: questionBasketService.wrongCount,
  levelCount: questionBasketService.levelCount,
  totalCount: questionBasketService.totalCount,
})

// 状态
const tabActiveKey = ref<string>('1') // tabs标签
const previewVisible = ref(false) // 预览作业
// 获取考试信息
const info = ref<previewExaminationResponse | null>(null)
const localData = ref<QuestionBasketRsponse[]>([])
const parsedUserInfo = getUserBaseInfo()
const gradeId = ref(parsedUserInfo?.gradeId || '') // 年级ID
const subjectId = ref(parsedUserInfo?.subjectId || '') // 学科ID
const subjectList = ref<dictListResponse[]>([]) // 学科字典列表
const stageList = ref<dictListResponse[]>([]) // 学段字典列表
const subjectObj = ref<dictListResponse>({})
const stageObj = ref<dictListResponse>({})

//  计算属性
const currentTabList = computed(() => {
  return tabActiveKey.value === '1' ? wrongList.value : tabActiveKey.value === '2' ? bookList.value : levelList.value
})
const currentTabQuestionCount = computed(() => {
  return currentTabList.value.reduce((sum, group) => sum + (group.children?.length || 0), 0)
})
const canPreviewCurrentTab = computed(() => currentTabQuestionCount.value > 0)
// 获取当前选中标签页的所有题目ID
const questionIds = computed(() => {
  // 从每个分组的 children 中提取 questionId
  const ids = currentTabList.value.flatMap(group => (group.children || []).map(item => item.questionId)).filter(Boolean)

  return ids.join(',')
})

// 根据路由参数展示tab
const setTabFromRoute = (path: string) => {
  if (path === '/teacher/recompose/paper') tabActiveKey.value = '1'
  else if (path === '/teacher/layered/class-compose') tabActiveKey.value = '3'
  else tabActiveKey.value = '2'
}

// 关闭抽屉
const close = () => emit('update:open', false)

// 一键清空
const clear = async () => {
  const assignmentType =
    tabActiveKey.value === '1'
      ? QuestionBasketEnum.WRONG
      : tabActiveKey.value === '2'
        ? QuestionBasketEnum.BOOK
        : QuestionBasketEnum.LEVEL
  const res = await questionBasketService.clearBasket(assignmentType)
  if (res) {
    await questionBasketService.initGetlist()
    message.success('清除成功')
    close()
  }
}

// 打开预览作业弹窗
const preview = () => {
  if (!canPreviewCurrentTab.value) {
    message.warning('当前标签暂无试题，无法预览')
    return
  }
  previewVisible.value = true
  emit('update:open', false)
  getData()
}
// 关闭预览作业弹窗
const handlepreviewClose = () => {
  previewVisible.value = false
  // 重置 info，确保下次打开时触发更新
  info.value = null
  questionBasketService.initGetlist()
}
// 获取试卷数据
const getData = async () => {
  // 从 store 获取班级 ID
  const wrongClassId = localStorage.getItem('wrongClassId') || ''
  const levelClassId = localStorage.getItem('levelClassId') || ''
  const params = {
    assignmentId: assignmentId.value ?? undefined,
    gradeId: gradeId.value || '',
    subjectId: subjectId.value || '',
    questionIds: questionIds.value || '',
    classId: tabActiveKey.value === '1' ? wrongClassId : tabActiveKey.value === '3' ? levelClassId : '',
    assignmentType:
      tabActiveKey.value === '1'
        ? QuestionBasketEnum.WRONG
        : tabActiveKey.value === '2'
          ? QuestionBasketEnum.BOOK
          : QuestionBasketEnum.LEVEL,
  }
  const res = await previewExamination(params)
  if (!res) return
  info.value = {
    assignmentId: res.assignmentId || '',
    assignmentName: res.assignmentName || '',
    teacherId: res.teacherId || '',
    qrCodeContent: res.qrCodeContent || '',
    stageId: stageObj.value.dictValue || '',
    gradeId: undefined,
    subjectId: subjectObj.value.dictValue || '',
    subjectName: subjectObj.value.label || '',
  }
  localData.value = JSON.parse(JSON.stringify(res.questionList || []))
}

// 获取当前选中试题科目/学段
const currentTabSubject = () => {
  const subjectId = currentTabList.value[0]?.children[0]?.subjectId
  const stageId = currentTabList.value[0]?.children[0]?.stageId
  // console.log('\n\n---subjectId---', subjectId)
  // console.log('---stageId---', stageId)
  const subjectInfo = subjectId ? subjectList.value.find(item => item.dictValue === subjectId) : null
  const stageInfo = subjectId ? stageList.value.find(item => item.dictValue === stageId) : null
  subjectObj.value = subjectInfo || {}
  stageObj.value = stageInfo || {}
  localStorage.setItem('subjectInfoBasket', JSON.stringify(subjectInfo))
  localStorage.setItem('stageInfoBasket', JSON.stringify(stageInfo))
}

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  const resData = res || []

  // 遍历返回的字典数据，根据 dictType 分别赋值
  resData.forEach(item => {
    if (item.dictType === selectEnum.SUBJECT) {
      subjectList.value = item.dictTypeList || []
    } else if (item.dictType === selectEnum.STAGE) {
      stageList.value = item.dictTypeList || []
    }
  })
}

// 监听路由变化以同步面板标签
watch(
  () => route.path,
  newPath => {
    setTabFromRoute(newPath)
  }
)
// 监听路由变化以同步面板标签
watch(
  () => route.query.assignmentId,
  newPath => {
    if (newPath) {
      questionBasketService.initGetlist()
    }
  }
)

onMounted(() => {
  setTabFromRoute(route.path)
  questionBasketService.initGetlist()
  getDictData([selectEnum.SUBJECT, selectEnum.STAGE])
})

// 监听currentTabList
watch(
  () => currentTabList.value,
  newPath => {
    // console.log('currentTabList:', newPath)
    if (newPath) {
      currentTabSubject()
    }
  }
)
</script>

<style scoped>
.qb-drawer :deep(.ant-drawer-content) {
  border-radius: 32px;
  overflow: clip;
  background: rgba(249, 250, 251, 1);
}

:deep(.ant-drawer-body) {
  padding: 0;
}

.qb {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.qb-head {
  padding: 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}

.qb-section.list {
  overflow-y: auto;
  max-height: 34%;
  padding: 10px;
}

.qb-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.qb-bag {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--td-accent-rgb, 236 122 46) / 0.14);
  color: rgb(var(--td-accent-rgb, 236 122 46) / 0.95);
}

.qb-head-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.92);
  line-height: 1.15;
}

.qb-head-sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(17, 24, 39, 0.5);
}

.qb-count {
  color: rgb(var(--td-accent-rgb, 236 122 46) / 0.95);
  font-weight: 700;
}

.qb-close {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;
}

.qb-close:hover {
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.qb-section-title {
  padding: 12px 0;
  font-size: 12px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.52);
}

.qb-actions {
  margin-top: auto;
  padding: 14px 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(180deg, rgba(249, 250, 251, 0.55) 0%, rgba(255, 255, 255, 1) 50%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.qb-action {
  height: 44px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease,
    border-color 160ms ease;
}

.qb-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qb-action-ghost {
  flex: 1;
  background: transparent;
  border-color: rgba(0, 0, 0, 0.08);
  color: rgba(17, 24, 39, 0.65);
}

.qb-action-light {
  flex: 1;
  background: rgb(var(--td-accent-rgb, 236 122 46) / 0.1);
  border-color: rgb(var(--td-accent-rgb, 236 122 46) / 0.16);
  color: rgb(var(--td-accent-rgb, 236 122 46) / 0.95);
}

.qb-action:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
}
</style>
