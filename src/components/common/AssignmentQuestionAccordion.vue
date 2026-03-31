<template>
  <a-collapse
    :activeKey="activeGroupKey"
    accordion
    ghost
    class="tch-group-collapse"
    @update:activeKey="$emit('update:activeGroupKey', $event as string)"
  >
    <AssignmentDetailGroup
      group-key="correct"
      label="正确"
      :count="groupCount(question, 'correct')"
      :preview-students="groupPreview(question, 'correct')"
      :students="groupStudents(question, 'correct')"
      :selected-student-id="selectedStudentId"
      :show-more="showGroupMore(question, 'correct')"
      :default-img="question.stemImg"
      @select-student="id => $emit('select-student', 'correct', id)"
      @open-student="stu => $emit('open-student', 'correct', stu)"
      @open-group="onOpenGroup"
    />

    <AssignmentDetailGroup
      group-key="wrong"
      label="错误"
      :count="groupCount(question, 'wrong')"
      :preview-students="groupPreview(question, 'wrong')"
      :students="groupStudents(question, 'wrong')"
      :selected-student-id="selectedStudentId"
      :show-more="showGroupMore(question, 'wrong')"
      :default-img="question.stemImg"
      @select-student="id => $emit('select-student', 'wrong', id)"
      @open-student="stu => $emit('open-student', 'wrong', stu)"
      @open-group="onOpenGroup"
    />

    <AssignmentDetailGroup
      group-key="half"
      label="半对"
      :count="groupCount(question, 'half')"
      :preview-students="groupPreview(question, 'half')"
      :students="groupStudents(question, 'half')"
      :selected-student-id="selectedStudentId"
      :show-more="showGroupMore(question, 'half')"
      :default-img="question.stemImg"
      @select-student="id => $emit('select-student', 'half', id)"
      @open-student="stu => $emit('open-student', 'half', stu)"
      @open-group="onOpenGroup"
    />

    <AssignmentDetailGroup
      group-key="unsubmitted"
      label="未交"
      :count="groupCount(question, 'unsubmitted')"
      :preview-students="groupPreview(question, 'unsubmitted')"
      collapsible="disabled"
      :show-arrow="false"
    />
  </a-collapse>
</template>

<script setup lang="ts">
import AssignmentDetailGroup from '@/components/homework/AssignmentDetailGroup.vue';
import useTeacherHomeworkGroups from '@/composables/useTeacherHomeworkGroups';
import type { GroupKey, StudentCard } from '@/types/homework';

// 组件属性定义
const props = defineProps<{
  question: any // 题目数据
  activeGroupKey: string // 当前展开的分组键
  selectedStudentId: string // 当前选中的学生ID
}>()

// 事件定义
const emit = defineEmits<{
  (e: 'update:activeGroupKey', key: string): void // 更新展开的分组
  (e: 'select-student', group: GroupKey, id: string): void // 选择学生
  (e: 'open-student', group: GroupKey, stu: StudentCard): void // 打开学生详情
}>()

// 获取分组相关的工具函数
const { groupPreviewCount, groupStudents, groupPreview, groupCount } = useTeacherHomeworkGroups()

// 判断是否显示"更多"按钮
const showGroupMore = (q: any, group: GroupKey) => groupCount(q, group) > groupPreviewCount

// 处理分组展开事件：只有点击不同分组时才更新，防止收起已展开的分组
const onOpenGroup = (key: string) => {
  if (props.activeGroupKey !== key) {
    emit('update:activeGroupKey', key)
  }
}
</script>
