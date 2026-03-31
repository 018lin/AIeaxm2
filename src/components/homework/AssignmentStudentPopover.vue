<template>
  <a-popover
    v-model:open="popoverOpen"
    trigger="hover"
    placement="top"
    overlay-class-name="tch-stu-popover-overlay"
    :mouse-enter-delay="0.08"
    :mouse-leave-delay="0.08"
  >
    <template #content>
      <div v-if="count === 0" class="tch-stu-popover-empty">当前数量为空</div>
      <div v-else-if="loadError" class="tch-stu-popover-empty">加载失败，请重试</div>
      <div v-else-if="loading" class="tch-stu-popover-empty">加载中...</div>
      <div v-else class="tch-stu-popover">
        <div class="tch-stu-popover-head">
          <div class="tch-stu-popover-title">{{ title }}</div>
          <div class="tch-stu-popover-sub">共 {{ displayList.length }} 人</div>
        </div>
        <div class="tch-stu-popover-body">
          <span v-for="name in displayList" :key="name" class="tch-stu-chip">{{ name }}</span>
        </div>
      </div>
    </template>
    <span
      class="tch-count-link"
      :class="{ 'is-warn': isWarn, 'is-zero': count === 0 }"
      @mouseenter="onHover"
    >
      {{ count }}
    </span>
  </a-popover>
</template>

<script setup lang="ts">
import { getStudentHomeworkStudentList } from '@/api/common'
import type { HomeworkStudentListItem } from '@/api/common/type'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    count: number
    /** 静态名单（未传 assignmentId/classId/listKey 时使用） */
    students?: string[]
    isWarn?: boolean
    /** 作业 ID，与 classId、listKey 一起传入时 hover 调用接口拉取名单 */
    assignmentId?: string
    /** 班级 ID */
    classId?: string
    /** 接口返回的名单 key，如 'submitted' | 'unsubmitted' */
    listKey?: string
  }>(),
  { students: () => [] }
)

const popoverOpen = ref(false)
const loading = ref(false)
const loadError = ref(false)
const fetchedList = ref<HomeworkStudentListItem[]>([])

const displayList = computed(() => {
  if (props.assignmentId && props.classId && props.listKey) {
    const names = fetchedList.value
      .map(item => String(item.studentName ?? item.studentCode ?? item.studentId ?? '').trim())
      .filter(Boolean)
    if (names.length) return names
    return props.students || []
  }
  return props.students || []
})

const cacheKey = computed(() =>
  props.assignmentId && props.classId && props.listKey
    ? `${props.assignmentId}_${props.classId}_${props.listKey}`
    : ''
)

const listKeyAliases: Record<string, string[]> = {
  submitted: ['submitted', 'completed', 'submitList'],
  unsubmitted: ['unsubmitted', 'uncompleted', 'unsubmitList'],
}

const pickListFromResponse = (res: Record<string, any> | null | undefined): HomeworkStudentListItem[] => {
  if (!res || typeof res !== 'object') return []
  const key = props.listKey
  if (!key) return []
  let list = res[key]
  if (Array.isArray(list)) return list
  const aliases = listKeyAliases[key]
  if (aliases) {
    for (const k of aliases) {
      list = res[k]
      if (Array.isArray(list)) return list
    }
  }
  if (Array.isArray(res.key)) return res.key
  const values = Object.values(res)
  for (const v of values) {
    if (Array.isArray(v) && v.length && v.some((x: any) => x && (x.studentName != null || x.studentId != null))) {
      return v as HomeworkStudentListItem[]
    }
  }
  return []
}

const fetchList = async () => {
  if (props.count === 0) return
  const aid = (props.assignmentId ?? '').toString().trim()
  const cid = (props.classId ?? '').toString().trim()
  if (!aid || !cid || !props.listKey) return
  loading.value = true
  loadError.value = false
  try {
    const res = await getStudentHomeworkStudentList({
      assignmentId: aid,
      classId: cid,
    })
    fetchedList.value = pickListFromResponse(res as Record<string, any>)
  } catch {
    loadError.value = true
    fetchedList.value = []
  } finally {
    loading.value = false
  }
}

const onHover = () => {
  if (props.count === 0) return
  if (!cacheKey.value) return
  if (fetchedList.value.length > 0 && !loading.value) return
  fetchList()
}
</script>

<style scoped lang="scss">
:global(.tch-stu-popover-overlay .ant-popover-inner) {
  border-radius: 18px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.12);
}

:global(.tch-stu-popover-overlay .ant-popover-inner-content) {
  padding: 0;
}

.tch-stu-popover-empty {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.tch-stu-popover {
  width: 420px;

  .tch-stu-popover-head {
    padding: 14px 16px 12px;
    display: flex;
    align-items: baseline;
    gap: 10px;
    border-bottom: 1px solid var(--color-border-light);

    .tch-stu-popover-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .tch-stu-popover-sub {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-secondary);
      opacity: 0.75;
    }
  }

  .tch-stu-popover-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    max-height: 220px;
    overflow: auto;

    .tch-stu-chip {
      height: 34px;
      padding: 0 16px;
      border-radius: 12px;
      border: 1px solid var(--color-primary-soft);
      background: var(--color-bg-warm);
      color: rgb(140 109 93 / 1);
      opacity: 0.86;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
    }
  }
}

.tch-count-link {
  font-weight: 700;
  color: var(--color-hw-published);
  background-color: var(--color-hw-published-bg);
  height: 24px;
  padding: 0 13px;
  line-height: 24px;
  border-radius: 8px;
  display: inline-block;
  cursor: pointer;

  &.is-warn {
    background: var(--color-review-wrong-bg);
    color: var(--color-review-wrong-text);

    &.is-zero {
      background: var(--color-bg-primary);
      color: var(--color-text-secondary);
    }
  }
}
</style>
