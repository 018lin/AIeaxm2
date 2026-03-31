<template>
  <div class="tch-detail-page tch-page-container gap-md">
    <TchDetailHeader :header="header" :tabs="tabs" :active-key="activeTab" @back="goBack" @navigate="goTab" />

    <div class="tch-detail-body col-2 gap-18">
      <!-- 左侧页码列表 -->
      <aside class="tch-page-list flex-col min-h-0">
        <div class="tch-page-items flex-col min-h-0 gap-10">
          <button
            v-for="page in pages"
            :key="page.id"
            type="button"
            class="tch-page-item flex-col gap-sm"
            :class="[
              { active: page.id === currentQuestionId },
              page.id === currentQuestionId ? 'bg-primary-soft' : 'bg-gray-soft',
            ]"
            @click="selectPage(page)"
          >
            <div class="tch-page-item-left flex-between w-full">
              <span class="tch-page-index bold text-primary">{{ page.label }}</span>
              <span class="tch-page-rate rounded-sm">正确率 {{ page.correctRate || 0 }}%</span>
            </div>
            <div class="tch-page-item-bar">
              <div class="tch-page-item-fill" :style="{ width: (page.correctRate || 0) + '%' }" />
            </div>
          </button>
        </div>
      </aside>

      <main ref="questionMainRef" class="tch-question-main">
        <div class="tch-question-list">
          <section
            v-for="q in questions"
            :key="q.assignmentItemId"
            :ref="setQuestionRef(q.assignmentItemId)"
            class="tch-question-section"
          >
            <div class="app-surface p-20">
              <div class="flex justify-between items-start mb-15">
                <div class="question-left">
                  <div class="tch-question-title bold mb-1">{{ `第${q.order}题` }}</div>

                  <div class="tch-question-stem">
                    <img class="tch-question-stem-img" :src="q.questionContent" alt="题目" />
                  </div>
                </div>

                <a-tooltip
                  placement="top"
                  :title="hasExplanationId(q) ? '已有讲解视频，录制新视频' : '暂无讲解视频，录制新视频'"
                >
                  <a-button
                    size="small"
                    class="tch-big-btn"
                    :class="{ 'is-empty': !hasExplanationId(q) }"
                    @click="gotoScreenRecord(q)"
                  >
                    <span class="tch-big-btn-left">
                      <span class="tch-big-btn-ico">
                        <Icon icon="solar:screencast-2-bold-duotone" width="22" />
                      </span>
                      <span class="tch-big-btn-title">大屏讲题</span>
                    </span>
                    <a-tooltip v-if="hasExplanationId(q)" placement="top">
                      <span class="tch-big-btn-right" role="button" tabindex="0" @click.stop="gotoExplanationDetail(q)">
                        查看已讲解
                        <Icon icon="mingcute:right-line" width="16" />
                      </span>
                    </a-tooltip>
                  </a-button>
                </a-tooltip>
              </div>

              <div class="tch-answer-card bg-primary-soft" v-if="q.answerList.length > 0">
                <div class="tch-answer-label flex items-center gap-xs bold text-primary">
                  <span class="dot rounded-full" />
                  正确答案
                </div>
                <div class="tch-answer-values">
                  <div v-for="(answer, index) in q.answerList" :key="index" class="tch-answer-item">
                    <span v-if="q.answerList.length > 1" class="tch-answer-label-text">空{{ Number(index) + 1 }}:</span>
                    <span class="tch-answer-value bold text-primary">{{ answer }}</span>
                  </div>
                </div>
                <div class="tch-answer-analysis" v-if="q.analysisImage">
                  <img
                    :src="q.analysisImage"
                    alt="解析"
                    style="max-width: 100%; margin-top: 10px; border: 1px solid yellow"
                  />
                </div>
              </div>
              <AssignmenCollapse
                :question="q"
                :assignment-id="assignmentId"
                :grade-class="header.gradeClass"
                :selected-student-id="selectedStudentIdByQuestion[q.assignmentItemId] || ''"
                @select-student="(group, id) => selectStudentInGroup(q, group, id)"
                @refresh-detail="refreshClassHomeworkDetail"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getAssignmentStatistics, getClassHomeworkDetail } from '@/api/homework'
import type { AssignmentStatisticsVO, ClassHomeworkDetailVO, StudentHomeworkDetailVO } from '@/api/homework/type'
import TchDetailHeader from '@/components/common/TchDetailHeader.vue'
import AssignmenCollapse from '@/components/homework/AssignmenCollapse.vue'
import { ROUTES } from '@/router/routes'
import type { ActiveGroupKey, DetailTab, GroupKey, PageInfo, TabKey } from '@/types/homework'
import { decrypt } from '@/utils/crypto'

import { Icon } from '@iconify/vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const routeAssignmentId = computed(() => String(route.params.id || ''))

// 获取当前作业ID（路由参数为加密值）
const assignmentId = computed(() => {
  const raw = routeAssignmentId.value
  if (!raw) return ''
  try {
    return decrypt(decodeURIComponent(raw))
  } catch {
    return decrypt(raw)
  }
})

// 获取当前班级ID：优先从 URL query 解密；否则从 sessionStorage 解密（用于更短 URL）
const classId = computed(() => {
  const v = route.query.classId
  const raw = typeof v === 'string' ? v : ''
  if (raw) return decrypt(raw)

  const cached = sessionStorage.getItem(`hw_detail_classId_${String(assignmentId.value)}`) || ''
  return cached ? decrypt(cached) : ''
})

// 头部信息：科目、班级、试卷名称
const header = computed(() => {
  const cached = assignmentId.value ? sessionStorage.getItem(`hw_detail_meta_${String(assignmentId.value)}`) : ''
  if (cached) {
    try {
      const v = JSON.parse(cached) as any
      if (v && typeof v === 'object') {
        return {
          subject: String(v.subject || '-'),
          gradeClass: String(v.gradeClass || '-'),
          paperName: String(v.paperName || '-'),
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    subject: '-',
    gradeClass: '-',
    paperName: '-',
  }
})

// 构建路由路径辅助函数
const buildPath = (tpl: string) => tpl.replace(':id', encodeURIComponent(String(routeAssignmentId.value)))

// 详情页标签页配置
const tabs = computed<DetailTab[]>(() => [
  { key: 'pages', label: '讲错题', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL) },
  { key: 'student_stats', label: '学生作业统计', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENT_STATS) },
  { key: 'students', label: '学生（汇总）', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENTS) },
  { key: 'origin-work', label: '原作业', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK) },
  { key: 'ai', label: '人工批阅', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW) },
])

// 当前激活的标签页
const activeTab = computed<TabKey>(() => 'pages')

// 切换标签页
const goTab = (to: string) => {
  router.push(to).catch(() => {})
}

type DistributionDetail = Record<'Correct' | 'Incorrect' | 'CorrectAndIncorrect', any[]>

const loading = ref(false)

const questionMainRef = ref<HTMLElement | null>(null)
const questionRefs = new Map<string, HTMLElement>()

// 题目列表数据（接口返回后会映射成页面所需结构）
const questions = ref<any[]>([])
const statistics = ref<AssignmentStatisticsVO[]>([])

// 当前选中的题目ID
const currentQuestionId = ref<string>('')

// 记录每道题当前展开的分组（正确/错误/半对）
const activeGroupKeyByQuestion = reactive<Record<string, ActiveGroupKey>>({})

// 记录每道题当前选中的学生ID
const selectedStudentIdByQuestion = reactive<Record<string, string>>({})

const clearReactiveRecord = (obj: Record<string, any>) => {
  Object.keys(obj).forEach(k => delete obj[k])
}

const resetQuestionState = (list: any[]) => {
  questions.value = list
  currentQuestionId.value = list?.[0]?.assignmentItemId || ''

  clearReactiveRecord(activeGroupKeyByQuestion)
  clearReactiveRecord(selectedStudentIdByQuestion)

  list.forEach(q => {
    const id = String(q.assignmentItemId || '')
    if (!id) return
    activeGroupKeyByQuestion[id] = ''
    selectedStudentIdByQuestion[id] = ''
  })

  questionRefs.clear()
}

const applyQuestionsPreserveState = (list: any[]) => {
  const prevCurrentId = String(currentQuestionId.value || '')
  const prevScrollTop = questionMainRef.value?.scrollTop ?? 0
  const prevSelected = { ...selectedStudentIdByQuestion }
  const prevActive = { ...activeGroupKeyByQuestion }

  questions.value = list

  clearReactiveRecord(activeGroupKeyByQuestion)
  clearReactiveRecord(selectedStudentIdByQuestion)

  list.forEach(q => {
    const id = String(q.assignmentItemId || '')
    if (!id) return
    activeGroupKeyByQuestion[id] = prevActive[id] || ''
    selectedStudentIdByQuestion[id] = prevSelected[id] || ''
  })

  const nextCurrent = list.some(q => String(q?.assignmentItemId || '') === prevCurrentId)
    ? prevCurrentId
    : String(list?.[0]?.assignmentItemId || '')
  currentQuestionId.value = nextCurrent

  questionRefs.clear()

  nextTick(() => {
    const el = questionMainRef.value
    if (el) el.scrollTo({ top: prevScrollTop, behavior: 'auto' })
  })
}

const toStudent = (stu: StudentHomeworkDetailVO, index: number) => {
  const id = String(stu?.studentUserId || stu?.detailId || stu?.homeworkId || index)
  return {
    id,
    studentName: String((stu as any)?.studentName || (stu as any)?.name || stu?.studentUserId || `学生${index + 1}`),
    img: String(stu?.studentAnswerImage || ''),
    ...stu,
  }
}

const toQuestion = (vo: ClassHomeworkDetailVO, index: number) => {
  const assignmentItemId = [vo.assignmentId, vo.pageNumber, vo.questionOrder].filter(Boolean).join('_') || String(index)

  const distributionDetail: DistributionDetail = {
    Correct: Array.isArray(vo.correctStudentList) ? vo.correctStudentList.map(toStudent) : [],
    Incorrect: Array.isArray(vo.errorStudentList) ? vo.errorStudentList.map(toStudent) : [],
    CorrectAndIncorrect: Array.isArray(vo.halfStudentList) ? vo.halfStudentList.map(toStudent) : [],
  }

  // Extract answer values for display
  const extractAnswerList = (answers: any[]) => {
    if (!Array.isArray(answers)) return []
    return answers.map(item => String(item.answer || ''))
  }

  return {
    assignmentItemId,
    pageNumber: vo.pageNumber || '',
    order: vo.questionOrder || '',
    questionContent: vo.questionImage || vo.questionContent || '',
    questionType: vo.answers ? JSON.stringify(vo.answers) : '',
    answerList: extractAnswerList(vo.answers),
    analysisImage: undefined,
    explainVideoUrl: vo.explainVideoUrl,
    distributionDetail,
    raw: vo,
  }
}

const loadQuestions = async () => {
  const id = String(assignmentId.value || '')
  const cid = String(classId.value || '')

  // 缺少必传参数时，不请求接口且不使用 mock
  if (!id || !cid) {
    resetQuestionState([])
    statistics.value = []
    return
  }

  loading.value = true
  try {
    const [list, stats] = await Promise.all([
      getClassHomeworkDetail({ assignmentId: id, classId: cid }),
      getAssignmentStatistics({ assignmentId: id, classId: cid }),
    ])
    const mapped = Array.isArray(list) ? list.map(toQuestion) : []

    resetQuestionState(mapped)
    statistics.value = Array.isArray(stats) ? stats : []
  } catch (e) {
    resetQuestionState([])
    statistics.value = []
  } finally {
    loading.value = false
  }
}

const refreshClassHomeworkDetail = async () => {
  const id = String(assignmentId.value || '')
  const cid = String(classId.value || '')
  if (!id || !cid) return

  try {
    const [list, stats] = await Promise.all([
      getClassHomeworkDetail({ assignmentId: id, classId: cid }),
      getAssignmentStatistics({ assignmentId: id, classId: cid }),
    ])
    const mapped = Array.isArray(list) ? list.map(toQuestion) : []
    applyQuestionsPreserveState(mapped)
    statistics.value = Array.isArray(stats) ? stats : []
  } catch {
    // ignore
  }
}

watch(
  () => [assignmentId.value, classId.value],
  () => {
    loadQuestions().catch(() => {})
  },
  { immediate: true }
)

// 设置题目元素的引用，用于滚动定位
const setQuestionRef = (id: string) => (el: any) => {
  if (el instanceof HTMLElement) {
    questionRefs.set(id, el)
  }
}

// 滚动到指定题目位置
const scrollToQuestion = async (id: string) => {
  await nextTick()

  const container = questionMainRef.value
  const el = questionRefs.get(id)
  if (!container || !el) return

  const top = Math.max(0, el.offsetTop - 50)
  container.scrollTo({ top, behavior: 'smooth' })
}

// 左侧页码列表数据，包含正确率计算
const pages = computed<PageInfo[]>(() => {
  return questions.value.map(q => {
    const qPage = String(q?.pageNumber ?? '')
    const qOrder = String(q?.order ?? '')

    const stat = statistics.value.find(s => {
      const sPage = String((s as any)?.pageNumber ?? (s as any)?.page ?? '')
      const sOrder = String((s as any)?.questionOrder ?? (s as any)?.questionNumber ?? '')
      return sPage === qPage && sOrder === qOrder
    })

    const raw = Number((stat as any)?.correctRate)
    let correctRate = Number.isFinite(raw) ? Math.round(raw <= 1 ? raw * 100 : raw) : 0

    if (!correctRate) {
      const c = Array.isArray(q.distributionDetail?.Correct) ? q.distributionDetail.Correct.length : 0
      const w = Array.isArray(q.distributionDetail?.Incorrect) ? q.distributionDetail.Incorrect.length : 0
      const h = Array.isArray(q.distributionDetail?.CorrectAndIncorrect)
        ? q.distributionDetail.CorrectAndIncorrect.length
        : 0
      const t = c + w + h
      correctRate = t ? Math.round((c / t) * 100) : 0
    }

    correctRate = Math.max(0, Math.min(100, correctRate))

    return {
      id: q.assignmentItemId,
      index: q.pageNumber,
      label: `第${q.order}题`,
      correctRate,
    }
  })
})

// 在分组中选择学生
const selectStudentInGroup = (q: any, _group: GroupKey, studentId: string) => {
  selectedStudentIdByQuestion[q.assignmentItemId] = studentId
}

// 左侧选中题目（页码）
const selectPage = (p: PageInfo) => {
  currentQuestionId.value = p.id
  scrollToQuestion(p.id).catch(() => {})
}

const getExplanationId = (q: any) => {
  const v = q?.raw?.explanationId ?? q?.explanationId
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v)
  return ''
}

const hasExplanationId = (q: any) => {
  return getExplanationId(q).length > 0
}

const gotoExplanationDetail = (q: any) => {
  const eid = getExplanationId(q)
  if (!eid) return
  const path = ROUTES.TEACHER_SCHOOL_RESOURCE_DETAIL.replace(':id', encodeURIComponent(eid))
  router.push(path).catch(() => {})
}

// 跳转到大屏讲题页面，使用当前题目 id 与信息，进入后数据联动
const gotoScreenRecord = (q: any) => {
  const id = routeAssignmentId.value || ''
  const path = ROUTES.TEACHER_HOMEWORK_SCREEN_RECORD.replace(':id', encodeURIComponent(String(id)))
  const index = questions.value.findIndex(qq => qq?.assignmentItemId === q?.assignmentItemId)
  const query = index >= 0 ? { topicIndex: String(index) } : undefined
  router.push({ path, query }).catch(() => {})
}

// 返回上一页
const goBack = () => {
  router.push(ROUTES.TEACHER_HOMEWORK).catch(() => {})
}
</script>

<style scoped lang="scss">
.tch-detail-page {
  height: var(--content-height);
  gap: 16px;
  min-height: 0;
  overflow: hidden;

  .tch-detail-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    overflow: hidden;

    &.col-2 {
      grid-template-columns: 260px minmax(0, 1fr);
    }

    &.is-stats {
      .tch-question-main {
        overflow: hidden;
        padding: 0;
        background: transparent;
      }
    }
  }
}

.tch-page-list {
  min-height: 0;
  background: var(--color-bg-container, #fff);
  border-radius: 18px;
  padding: 12px 12px 14px;
  box-shadow: 0 12px 26px var(--color-shadow-brown);
  overflow: hidden;

  &-head {
    // flex-between items-center handled by utility classes
    padding: 4px 6px 10px;
  }

  &-title {
    font-size: 16px;
    // bold handled by utility class
    color: var(--color-text-primary);
  }

  &-toggle {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 10px;
    background: var(--color-primary-bg-light);
    position: relative;
    cursor: pointer;

    &::before {
      content: '';
      width: 8px;
      height: 8px;
      border-right: 2px solid var(--color-text-tertiary, rgba(15, 23, 42, 0.45));
      border-bottom: 2px solid var(--color-text-tertiary, rgba(15, 23, 42, 0.45));
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -55%) rotate(45deg);
    }
  }

  .tch-page-items {
    flex: 1;
    min-height: 0;
    gap: 10px;
    overflow-y: auto;
    padding-right: 4px;

    .tch-page-item {
      width: 100%;
      text-align: left;
      cursor: pointer;
      gap: 8px;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        background 0.15s ease;

      &:hover {
        border-color: var(--color-primary-soft);
        box-shadow: 0 12px 22px var(--color-shadow-brown);
      }

      .tch-page-index {
        font-size: 13px;
      }

      .tch-page-rate {
        font-size: 12px;
        color: var(--color-primary);
        padding: 4px 8px;
        background: var(--color-bg-container, #fff);
      }

      &-bar {
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: var(--color-border-light, rgba(148, 163, 184, 0.18));
        overflow: hidden;
      }

      &-fill {
        height: 100%;
        border-radius: inherit;
        background: var(--color-primary);
      }
    }
  }
}

.tch-question-main {
  min-height: 0;
  overflow-y: auto;
}

.tch-question-list {
  min-height: 100%;
}

.tch-question-section {
  & + & {
    margin-top: 16px;
  }
}

.tch-question-title {
  font-size: 18px;
  font-weight: 700;
}

.tch-big-btn {
  height: auto;
  padding: 10px 12px;
  border: 1px solid rgba(236, 122, 46, 0.25);
  box-shadow: 0 12px 22px var(--color-chart-orange-1);
  display: inline-flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;

  &.is-empty {
    justify-content: flex-start;
  }

  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(236, 122, 46, 0.38);
    box-shadow: 0 16px 28px var(--color-chart-orange-1);
  }

  .tch-big-btn-left {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .tch-big-btn-ico {
    display: flex;
    color: var(--color-primary);
    flex: none;
  }

  .tch-big-btn-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 0.2px;
    white-space: nowrap;
  }

  .tch-big-btn-right {
    height: 24px;
    padding: 0 10px;
    border-radius: 6px;
    background: rgba(34, 197, 94, 0.12);
    color: rgba(22, 163, 74, 0.95);
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    flex: none;

    &:hover {
      background: rgba(22, 163, 74, 0.2);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.tch-question-stem {
  margin-bottom: 12px;

  &-text {
    font-size: 15px;
    line-height: 1.6;
    color: var(--color-text-primary);
  }

  &-img {
    display: block;
    width: 60%;
    max-width: 400px;
    height: auto;
    background: var(--color-bg-tertiary, rgba(148, 163, 184, 0.12));
  }
}

.tch-answer-card {
  padding: 16px;
  margin-bottom: 16px;

  .tch-answer-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 10px;

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--color-primary);
    }
  }

  .tch-answer-values {
    display: flex;
    gap: 10px 20px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .tch-answer-item {
    display: flex;
    align-items: center;
    gap: 8px;

    &:not(:last-child)::after {
      content: '';
      display: inline-block;
      width: 1px;
      height: 40px;
      background: rgba(236, 122, 46, 0.2);
      margin-left: 20px;
    }
  }

  .tch-answer-label-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-primary);
    opacity: 0.8;
    width: 28px;
  }

  .tch-answer-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-primary);
    flex: 1;
  }

  .tch-answer-analysis {
    font-size: 13px;
    color: var(--color-text-secondary);

    img {
      mix-blend-mode: darken;
    }
  }
}

@media (max-width: 1024px) {
  .tch-detail-body {
    grid-template-columns: 1fr;
  }
}
</style>
