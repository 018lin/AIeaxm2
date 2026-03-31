<template>
  <aside class="tch-mr-left app-surface">
    <div class="flex-col gap-10" v-if="filteredStudents.length">
      <button
        v-for="s in filteredStudents"
        :key="s.id"
        type="button"
        class="tch-mr-stu flex-between p-10 gap-10 rounded-md"
        :class="{ active: s.id === curStudentId }"
        @click="selectStudent(s.id)"
      >
        <div class="meta">
          <div class="name bold">{{ s.name }}</div>
          <div class="no">学号: {{ s.studentNo }}</div>
        </div>

        <span
          class="tag"
          :class="{
            'is-green': s.gradingStatus === 'graded',
            'is-blue': s.gradingStatus === 'grading',
            'is-orange': s.gradingStatus === 'ungraded',
          }"
        >
          {{ getStatusLabel(s.gradingStatus) }}
        </span>
      </button>
    </div>
    <a-empty v-else :image="simpleImage" description="暂无数据" />
  </aside>
</template>

<script setup lang="ts">
import type { ReviewStudent } from '@/types/assignment/manualReview'
import { Empty } from 'ant-design-vue'
import { computed, ref, watchEffect } from 'vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const props = withDefaults(
  defineProps<{
    students?: ReviewStudent[]
  }>(),
  {
    students: () => [],
  }
)

const stuKeyword = ref('')
const curStudentId = ref('')

const filteredStudents = computed(() => {
  const list = Array.isArray(props.students) ? props.students : []
  const kw = stuKeyword.value.trim()
  if (!kw) return list
  return list.filter(s => String(s.name || '').includes(kw) || String(s.studentNo || '').includes(kw))
})

const getStatusLabel = (v: unknown) => {
  const s = String(v || '')
    .trim()
    .toLowerCase()
  const map: Record<string, string> = {
    grading: '批阅中',
    graded: '已批阅',
    ungraded: '未批阅',
  }
  return map[s] || '-'
}

const selectStudent = (id: string) => {
  curStudentId.value = String(id || '')
}

watchEffect(() => {
  const list = filteredStudents.value
  if (!list.length) {
    curStudentId.value = ''
    return
  }
  const cur = curStudentId.value
  if (!cur || !list.some(s => s.id === cur)) {
    curStudentId.value = list[0]?.id || ''
  }
})

defineExpose({
  curStudentId,
})
</script>

<style scoped lang="less">
.tch-mr-left {
  padding: 12px;
  border-radius: 18px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:global(.tch-mr-left .ant-input-affix-wrapper) {
  border-radius: 999px;
}

.tch-mr-search {
  border-radius: 999px;
}

.tch-mr-stu {
  border: 1px solid rgba(242, 235, 230, 1);
  background: rgba(255, 255, 255, 0.96);
  cursor: pointer;
  text-align: left;

  &.active {
    background: rgba(236, 122, 46, 0.08);
    border-color: rgba(236, 122, 46, 0.55);
  }

  .name {
    color: rgba(17, 24, 39, 0.9);
    font-size: 13px;
  }

  .no {
    font-size: 12px;
    color: rgba(17, 24, 39, 0.5);
  }

  .tag {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;

    &.is-orange {
      background: rgba(255, 239, 206, 0.75);
      color: #b05b00;
    }
    &.is-green {
      background: rgba(217, 242, 206, 0.85);
      color: #3d8f37;
    }
    &.is-blue {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
  }
}
</style>
