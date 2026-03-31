<template>
  <a-collapse-panel :key="groupKey" :class="panelClass" :collapsible="collapsible" :show-arrow="showArrow">
    <template #header>
      <div class="tch-group-head">
        <div class="tch-group-head-left">
          <Icon :icon="groupIcon" width="16" class="tch-group-ico" />
          <span class="tch-group-title bold">{{ label }}</span>
          <span class="tch-group-count">{{ count }}人</span>
        </div>
        <div class="tch-group-head-right" @click.stop.prevent @mousedown.stop @pointerdown.stop>
          <div class="tch-group-names">
            <span
              v-for="stu in previewStudents"
              :key="stu.id"
              class="tch-name-chip"
              :class="{ 'is-active': stu.id === selectedStudentId }"
              @pointerdown.stop
              @mousedown.stop
              @click.stop.prevent="onClickNameChip(stu.id)"
            >
              {{ stu.name }}
            </span>
          </div>
          <span v-if="showMore" class="tch-group-more">更多</span>
        </div>
      </div>
    </template>

    <div v-if="students && students.length" class="tch-student-cards">
      <div
        v-for="stu in students"
        :key="stu.id"
        class="tch-student-card"
        :class="{ 'is-active': stu.id === selectedStudentId }"
        @click="$emit('open-student', stu)"
      >
        <button type="button" class="tch-student-origin" @click.stop="$emit('open-original-work', stu)">原作业</button>
        <div class="tch-student-avatar">
          <img class="tch-student-img" :src="stu.img || defaultImg" alt="学生" />
        </div>
        <div class="tch-student-name">{{ stu.name }}</div>
      </div>
    </div>
  </a-collapse-panel>
</template>

<script setup lang="ts">
import type { StudentCard } from '@/types/homework'
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

// 组件属性定义
const props = defineProps<{
  groupKey: string // 分组键：correct/wrong/half/unsubmitted
  label: string // 分组标签
  count: number // 学生数量
  previewStudents: StudentCard[] // 预览显示的学生列表
  students?: StudentCard[] // 完整学生列表
  selectedStudentId?: string // 当前选中的学生ID
  showMore?: boolean // 是否显示"更多"按钮
  defaultImg?: string // 默认图片
  collapsible?: 'header' | 'disabled' // 是否可折叠
  showArrow?: boolean // 是否显示箭头
}>()

// 事件定义
const emit = defineEmits<{
  (e: 'open-group', key: string): void // 展开分组
  (e: 'select-student', id: string): void // 选择学生
  (e: 'open-student', stu: StudentCard): void // 打开学生详情
  (e: 'open-original-work', stu: StudentCard): void // 打开原作业
}>()

// 点击学生名字标签：展开分组并选中学生
const onClickNameChip = (id: string) => {
  emit('open-group', props.groupKey)
  emit('select-student', id)
}

// 分组图标映射
const groupIcon = computed(() => {
  const iconMap: Record<string, string> = {
    correct: 'material-symbols:check-rounded',
    wrong: 'fluent-mdl2:status-circle-error-x',
    half: 'tdesign:error',
    unsubmitted: 'fluent-emoji-high-contrast:no-entry',
  }
  return iconMap[props.groupKey] || 'solar:alt-arrow-down-outline'
})

// 面板样式类映射
const panelClass = computed(() => {
  const classMap: Record<string, string> = {
    correct: 'is-correct box-green',
    wrong: 'is-wrong box-red',
    half: 'is-half box-orange',
    unsubmitted: 'is-unsubmitted box-gray',
  }
  return classMap[props.groupKey] || ''
})
</script>

<style scoped lang="scss">
.tch-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 700;
  margin: 0;

  .tch-group-head-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 55px;
  }

  .tch-group-count {
    font-size: 12px;
  }

  .tch-group-head-right {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    justify-content: flex-end;
  }
}

.tch-group-names {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.tch-group-ico {
  flex: 0 0 auto;
  opacity: 0.9;
}

.tch-name-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 4px 12px;
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
    font-weight: 700;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 10px 18px rgba(148, 117, 98, 0.14);
    transform: translateY(-0.5px);
  }
}

.tch-group-more {
  flex: 0 0 auto;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.tch-student-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.tch-student-card {
  position: relative;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.22);
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  .tch-student-origin {
    position: absolute;
    right: 10px;
    top: 10px;
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(230, 126, 34, 0.35);
    background: rgba(255, 255, 255, 0.92);
    color: rgba(230, 126, 34, 0.95);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(230, 126, 34, 0.08);
      border-color: rgba(230, 126, 34, 0.55);
    }
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(148, 117, 98, 0.12);
  }

  &.is-active {
    border-color: #6b859e;
    box-shadow: 0 0 0 2px rgba(#6b859e, 0.2);
  }
}

.tch-student-avatar {
  border-radius: 16px 16px 0 0;
  background-color: rgba(148, 163, 184, 0.14);
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    padding: 10px 2px;
    object-fit: cover;
    display: block;
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

.tch-student-name {
  padding: 0 10px;
  font-size: 13px;
  color: rgba(17, 24, 39, 0.9);
}
</style>
