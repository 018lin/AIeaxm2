<template>
  <div>
    <!-- buttons -->
    <div class="tch-stat-row flex flex-wrap gap-sm">
      <button
        v-for="item in collapseList"
        :key="item.value"
        type="button"
        class="tch-stat-pill"
        :disabled="getGroupList(item.value).length <= 0"
        :class="[item.variant, { 'is-active': activeKey === item.value }]"
        @click="handleChangeCollapse(item.value)"
      >
        <Icon :icon="item.icon" width="14" />
        <span>{{ item.label }}</span>
        <span class="num">{{ getGroupList(item.value).length }}</span>
      </button>
    </div>

    <!-- 手风琴 -->
    <a-collapse v-model:activeKey="activeKey" accordion @change="handleChangeCollapse">
      <a-collapse-panel
        v-for="item in collapseList"
        :showArrow="false"
        :key="item.value"
        :class="[`is-${item.value}`, { 'is-active': activeKey === item.value }]"
        class="collapse-panel"
        :collapsible="collapsibleValue(item)"
      >
        <!-- 头部 -->
        <template #header>
          <div class="collapse-head">
            <div class="collapse-head-left">
              <Icon :icon="item.icon" width="16" class="collapse-ico" />
              <span class="bold">{{ item.label }}</span>
              <span class="collapse-count">{{ getGroupList(item.value).length }}人</span>
            </div>
            <div class="collapse-head-right-wrapper" @click.stop.prevent @mousedown.stop @pointerdown.stop>
              <div
                class="collapse-head-right gap-sm"
                :class="{ 'is-expanded': expandedState[item.value] }"
                :ref="el => setRef(el, item.value)"
              >
                <span
                  v-for="stu in getGroupList(item.value)"
                  :key="stu.id"
                  class="collapse-name-chip"
                  :class="{ 'is-active': stu.id === selectedStudentId }"
                  @pointerdown.stop
                  @mousedown.stop
                  @click.stop.prevent="onClickNameChip(item, stu.id)"
                >
                  {{ stu.studentName }}
                </span>
              </div>
              <div v-if="showMoreState[item.value]" class="more-btn" @click.stop="toggleExpand(item.value)">
                {{ expandedState[item.value] ? '收起' : '更多' }}
                <Icon :icon="expandedState[item.value] ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
              </div>
            </div>
          </div>
        </template>
        <!-- 内容区域 -->
        <div v-if="getGroupList(item.value).length" class="collapse-student-cards">
          <div
            v-for="stu in getGroupList(item.value)"
            :key="stu.id"
            class="collapse-student-card flex-col"
            :class="{ 'is-active': stu.id === selectedStudentId }"
            @click="onClickNameChip(item, stu.id)"
          >
            <a-tooltip :title="hoverOriginStudentId === stu.id ? '查看该学生原作业' : '查看学生答题情况'">
              <div
                class="collapse-student-avatar"
                @click.stop="handleCorrectionModal(true, item.value as GroupKey, stu)"
              >
                <img :src="stu.img || question.questionContent" alt="学生" />

                <div class="origin-box">
                  <button
                    type="button"
                    class="collapse-student-origin"
                    @mouseenter.stop="hoverOriginStudentId = stu.id"
                    @mouseleave.stop="hoverOriginStudentId = null"
                    @click.stop="handleOriginalWorkModal(true, stu)"
                  >
                    原作业
                  </button>
                </div>
              </div>
            </a-tooltip>
            <div class="collapse-student-name">{{ stu.studentName }}</div>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>

    <!-- 判题 -->
    <AssignmentCorrectionModal
      :open="correctionOpen"
      :modalCtx="correctionStudent"
      :modalJudge="correctionJudge"
      @closeModal="handleCorrectionModal"
      @changeModalJudge="changeModalJudge"
      @confirmJudge="confirmJudge"
    />

    <!-- 原作业 -->
    <AssignmentOriginalModal
      :open="originalOpen"
      :modalCtx="originalStudent"
      :pageIndex="originalPageIndex"
      :pageTotal="originalPageTotal"
      @changePage="handleOriginalPageChange"
      @closeModal="handleOriginalWorkModal"
    />
  </div>
</template>

<script setup lang="ts">
import { getOriginalDetail } from '@/api/homework'
import type { OriginalDetailVO } from '@/api/homework/type'
import type { GroupKey } from '@/types/homework'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, onUpdated, reactive, ref } from 'vue'
import AssignmentCorrectionModal from './AssignmentCorrectionModal.vue'
import AssignmentOriginalModal from './AssignmentOriginalModal.vue'

const collapseList = [
  {
    value: 'Correct',
    label: '正确',
    icon: 'material-symbols:check-rounded',
    variant: 'green',
  },
  {
    value: 'Incorrect',
    label: '错误',
    icon: 'fluent-mdl2:status-circle-error-x',
    variant: 'red',
  },
  {
    value: 'CorrectAndIncorrect',
    label: '半对',
    icon: 'tdesign:error',
    variant: 'orange',
  },
]
// 基础状态
const activeKey = ref<string>()
const correctionOpen = ref(false)
const originalOpen = ref(false)
const correctionStudent = ref<any>(null)
const originalStudent = ref<any>(null)
const originalPageIndex = ref(0)
const originalPageTotal = computed(() => {
  const ids = Array.isArray(originalStudent.value?.homeworkIds) ? (originalStudent.value?.homeworkIds as any[]) : []
  return Math.max(1, ids.length)
})
const correctionJudge = ref<string>('')
const correctionOriginalGroup = ref<string>('')
const hoverOriginStudentId = ref<string | null>(null)

const expandedState = reactive<Record<string, boolean>>({})
const showMoreState = reactive<Record<string, boolean>>({})
const headRightRefs = ref<Record<string, HTMLElement>>({})

const props = defineProps<{
  question: any
  assignmentId: string
  gradeClass?: string
  selectedStudentId: string | undefined
}>()

const emit = defineEmits<{
  (e: 'select-student', group: GroupKey, id: string): void
  (e: 'refresh-detail'): void
}>()

const GROUP_KEY_ALIAS: Record<string, string> = {
  Correct: 'true',
  Incorrect: 'false',
  CorrectAndIncorrect: 'halfRight',
}

const resolveGroupKey = (key: string) => {
  const dist = props.question?.distributionDetail || {}
  if (Array.isArray(dist?.[key])) return key
  const alias = GROUP_KEY_ALIAS[key]
  if (alias && Array.isArray(dist?.[alias])) return alias
  return key
}

const getGroupList = (key: string) => {
  const dist = props.question?.distributionDetail || {}
  const k = resolveGroupKey(key)
  const list = dist?.[k]
  return Array.isArray(list) ? list : []
}

const setRef = (el: any, key: string) => {
  if (el) headRightRefs.value[key] = el
}

const checkOverflow = () => {
  for (const key in headRightRefs.value) {
    const el = headRightRefs.value[key]
    if (el) {
      // 32px is roughly one row height (22px height + 10px margin)
      // If scrollHeight > 40, it definitely has more than one row
      if (el.scrollHeight > 40) {
        showMoreState[key] = true
      }
    }
  }
}

const toggleExpand = (key: string) => {
  expandedState[key] = !expandedState[key]
}

onMounted(() => {
  setTimeout(checkOverflow, 200)
})

onUpdated(() => {
  checkOverflow()
})

// 判题弹窗
const handleCorrectionModal = (open: boolean, group?: GroupKey, stu?: any) => {
  if (stu) {
    correctionStudent.value = stu
  }
  correctionOpen.value = open
  correctionJudge.value = group || ''
  if (open && group) {
    correctionOriginalGroup.value = group
  }
}
// 弹窗内修改判定
const changeModalJudge = (next: string) => {
  correctionJudge.value = next
}
// 确认批改结果
const confirmJudge = () => {
  const oldGroup = String(correctionOriginalGroup.value || '')
  const newGroup = String(correctionJudge.value || '')
  const student = correctionStudent.value

  if (oldGroup && newGroup && oldGroup !== newGroup && student) {
    const dist = props.question?.distributionDetail || {}

    const oldKey = resolveGroupKey(oldGroup)
    const newKey = resolveGroupKey(newGroup)

    const oldList = dist?.[oldKey]
    if (!Array.isArray(oldList)) {
      handleCorrectionModal(false)
      return
    }

    if (!Array.isArray(dist?.[newKey])) {
      dist[newKey] = []
    }

    const newList = dist[newKey]

    const index = oldList.findIndex((s: any) => s.id === student.id)
    if (index > -1) {
      oldList.splice(index, 1)
      newList.push(student)
    }
  }

  emit('refresh-detail')
  handleCorrectionModal(false)
}
let originalReqSeq = 0

const getStuHomeworkIds = (stu: any) => {
  const list = Array.isArray(stu?.homeworkIds) ? (stu.homeworkIds as any[]) : []
  const ids = list.map(x => String(x || '').trim()).filter(Boolean)
  const single = String(stu?.homeworkId || '').trim()
  if (ids.length === 0 && single) ids.push(single)
  return ids
}

const fetchOriginalDetailByIndex = async (index: number) => {
  const base = originalStudent.value || {}
  const ids = getStuHomeworkIds(base)
  const safeIndex = Math.max(0, Math.min(index, Math.max(0, ids.length - 1)))
  const homeworkId = String(ids[safeIndex] || '').trim()

  const seq = ++originalReqSeq

  originalStudent.value = {
    ...base,
    homeworkId,
    homeworkIds: ids,
    originalImage: '',
    originalDetail: null as OriginalDetailVO | null,
  }

  if (!homeworkId) {
    message.warning('暂无原作业图片')
    return
  }

  try {
    const studentUserId = String((base as any)?.studentUserId || '').trim()
    const aid = String(props.assignmentId || '').trim()
    const req = studentUserId && aid ? ({ assignmentId: aid, studentUserId } as any) : ({ homeworkId } as any)

    const res = await getOriginalDetail(req)
    if (seq !== originalReqSeq) return

    const list = (Array.isArray(res) ? res : [res]).filter(Boolean) as OriginalDetailVO[]
    const picked =
      list.find(d => String((d as any)?.homeworkId || '').trim() === homeworkId) || list[safeIndex] || list[0] || null

    const attachmentUrl = String((picked as any)?.attachmentUrl || '')
    originalStudent.value = {
      ...base,
      homeworkId,
      homeworkIds: ids,
      originalImage: attachmentUrl,
      originalDetail: picked as any,
    }

    if (!attachmentUrl) message.warning('暂无原作业图片')
  } catch (e: any) {
    if (seq !== originalReqSeq) return

    originalStudent.value = {
      ...base,
      homeworkId,
      homeworkIds: ids,
      originalImage: '',
      originalDetail: null as OriginalDetailVO | null,
    }
    message.error(e?.message || '获取原作业失败')
  }
}

// 原作业弹窗
const handleOriginalWorkModal = async (open: boolean, stu?: any) => {
  if (!open) {
    originalOpen.value = false
    return
  }

  const displayStudentName = String(stu?.studentName || stu?.name || '')
  const displayStudentUserId = String(stu?.studentUserId || stu?.id || '')
  const homeworkIds = getStuHomeworkIds(stu)

  originalPageIndex.value = 0
  originalStudent.value = {
    ...(stu || {}),
    studentName: displayStudentName,
    studentUserId: displayStudentUserId,
    gradeClass: String(props.gradeClass || ''),
    homeworkIds,
    homeworkId: String(homeworkIds[0] || '').trim(),
    originalImage: '',
    originalDetail: null as OriginalDetailVO | null,
  }
  originalOpen.value = true

  fetchOriginalDetailByIndex(0).catch(() => {})
}

const handleOriginalPageChange = (nextIndex: number) => {
  const ids = Array.isArray(originalStudent.value?.homeworkIds) ? (originalStudent.value?.homeworkIds as any[]) : []
  if (ids.length <= 1) return
  if (nextIndex < 0 || nextIndex >= ids.length) return

  originalPageIndex.value = nextIndex
  fetchOriginalDetailByIndex(nextIndex).catch(() => {})
}
// 折叠面板是否可折叠
const collapsibleValue = (item: any) => {
  if (!props.question.distributionDetail[item.value]?.length) {
    return 'disabled'
  }
  return ''
}
// 折叠面板的标题点击
const handleChangeCollapse = (key: string) => {
  const list = props.question?.distributionDetail?.[key]
  if (!Array.isArray(list) || list.length === 0) return

  emit('select-student', key as GroupKey, '')
  activeKey.value = key
}
// 选中学生姓名标签
const onClickNameChip = (item: any, id: string) => {
  if (id === props.selectedStudentId) {
    emit('select-student', item.value as GroupKey, '')
  } else {
    emit('select-student', item.value as GroupKey, id)
  }
  activeKey.value = item.value
}
</script>

<style scoped lang="scss">
.tch-stat-row {
  margin-bottom: 14px;

  .tch-stat-pill {
    height: 38px;
    padding: 0 14px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    border: 1px solid transparent;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    color: #64748b;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;

    &.is-active {
      transform: translateY(-1px);
      box-shadow: 0 12px 26px rgba(148, 117, 98, 0.16);
      animation: pill-pop 220ms ease-out;
    }

    .num {
      display: inline-block;
      height: 14px;
      padding: 0 6px;
      border-radius: 999px;
      font-size: 12px;
      line-height: 14px;
      font-weight: 400;
    }

    &.green {
      color: var(--color-review-correct-text);
      border-color: rgba(209, 250, 229);
      background-color: rgba(236, 253, 245, 0.4);
      .num {
        background-color: rgb(209 250 229);
      }
    }

    &.red {
      color: var(--color-review-wrong-text);
      background-color: rgba(254, 242, 242, 0.4);
      border-color: rgba(254, 226, 226);
      .num {
        background-color: rgba(255, 228, 230, 0.5);
      }
    }

    &.orange {
      color: var(--color-review-half-text);
      background-color: rgba(255, 251, 235, 0.4);
      border-color: rgba(254, 243, 199);

      .num {
        background-color: rgba(254, 243, 199, 0.5);
      }
    }

    &.orange {
    }

    &.gray {
      color: var(--color-review-gray-text);
      background-color: var(--color-review-gray-bg);
      border-color: var(--color-review-gray-border);

      .num {
        background-color: var(--color-review-gray-num);
      }
    }

    &:disabled {
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}

:deep(.ant-collapse) {
  border: none;
  background: transparent;
}
:deep(.ant-collapse-content) {
  border: none;
  border-radius: 0 0 18px 18px;
  background: transparent;
}
.collapse-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .collapse-head-left {
    width: max-content;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 700;
    .collapse-ico {
      flex: 0 0 auto;
      opacity: 0.9;
    }
    .collapse-count {
      font-size: 12px;
    }
  }
  .collapse-head-right-wrapper {
    max-width: 800px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    justify-content: flex-end;

    .more-btn {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      color: var(--color-review-gray-text);
      cursor: pointer;
      white-space: nowrap;
      height: 22px;
      background: #fff;
      padding: 4px 12px;
      border-radius: 8px;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .collapse-head-right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    overflow: hidden;
    max-height: 22px;
    transition: max-height 0.3s ease;

    &.is-expanded {
      max-height: 1000px; // Large enough value
      overflow: visible;
    }

    .collapse-name-chip {
      display: inline-flex;
      align-items: center;
      height: 22px;
      padding: 4px 12px;
      margin: 0 10px 10px 0;
      border-radius: 8px;
      font-size: 12px;
      font-weight: normal;
      background: rgba(255, 255, 255, 1);
      cursor: pointer;
      border-width: 1px;
      border-style: solid;
      border-color: transparent;
      transition:
        background 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        transform 0.15s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.92);
      }

      &.is-active {
        border-color: currentColor;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 10px 18px rgba(148, 117, 98, 0.14);
        transform: translateY(-0.5px);
      }
    }
  }
}
.collapse-panel {
  margin-bottom: 16px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;

  &.is-active {
    transform: translateY(-1px);
    box-shadow: 0 18px 44px rgba(148, 117, 98, 0.14);
    animation: panel-pop 220ms ease-out;
  }
  &.is-Correct {
    color: var(--color-review-correct-text);
    border-color: rgb(209 250 229 / 0.5);
    background-color: rgb(236 253 245 / 0.4);
    .collapse-ico {
      color: var(--color-review-correct-text);
    }
    .collapse-head {
      span {
        color: var(--color-review-correct-text);
      }
    }
  }
  &.is-Incorrect {
    color: var(--color-review-wrong-text);
    background-color: rgba(254, 242, 242, 0.4);
    border-color: rgba(254, 226, 226, 0.5);

    .collapse-ico {
      color: var(--color-review-wrong-text);
    }
    .collapse-head {
      span {
        color: var(--color-review-wrong-text);
      }
    }
  }
  &.is-CorrectAndIncorrect {
    color: var(--color-review-half-text);
    background-color: rgb(255 251 235 / 0.4);
    border-color: rgb(254 243 199 / 0.5);
    .collapse-ico {
      color: var(--color-review-half-text);
    }
    .collapse-head {
      span {
        color: var(--color-review-half-text);
      }
    }
  }
  &.is-unsubmitted {
    border-radius: 18px;
    color: var(--color-review-gray-text);
    background-color: var(--color-review-gray-bg);
    border-color: var(--color-review-gray-border);
    .collapse-ico {
      background: var(--color-review-gray-bg);
      color: var(--color-review-gray-text);
    }
    .collapse-head {
      span {
        color: var(--color-review-gray-text);
      }
    }
  }

  .collapse-student-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 14px;
    .collapse-student-card {
      min-height: 120px;
      position: relative;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.22);
      overflow: hidden;
      cursor: pointer;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        border-color 0.15s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 28px rgba(148, 117, 98, 0.12);
      }

      &.is-active {
        border-color: #6b859e;
      }
    }
    .collapse-student-avatar {
      border-radius: 8px 8px 0 0;
      background-color: rgb(241 245 249);
      position: relative;
      overflow: hidden;
      flex: 1;

      img {
        width: 100%;
        padding: 10px 6px;
        object-fit: cover;
        display: block;
        mix-blend-mode: darken;
      }

      &::after {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 999px;
        position: absolute;
        right: 3.2px;
        top: 4.8px;
      }
    }
    .collapse-student-name {
      padding: 8px;
      font-size: 13px;
      color: rgba(17, 24, 39, 0.9);
    }
  }

  .origin-box {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 60px;
    height: 60px;
    overflow: hidden;

    .collapse-student-origin {
      position: absolute;
      right: -21px;
      bottom: 7px;
      width: 80px;
      background-color: rgb(100 116 139 / 0.8);
      color: white;
      text-align: center;
      transform: rotate(-45deg);
      font-size: 12px;
      padding: 1px 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      z-index: 10;
      pointer-events: auto;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #849fba;
        width: 82px;
      }
    }
  }
}

@keyframes panel-pop {
  0% {
    transform: translateY(0) scale(1);
  }
  60% {
    transform: translateY(-2px) scale(1.01);
  }
  100% {
    transform: translateY(-1px) scale(1);
  }
}

@keyframes pill-pop {
  0% {
    transform: translateY(0) scale(1);
  }
  60% {
    transform: translateY(-2px) scale(1.02);
  }
  100% {
    transform: translateY(-1px) scale(1);
  }
}
</style>
