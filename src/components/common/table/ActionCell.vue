<template>
  <div class="rc-ops ops-list">
    <template v-if="record.status === assignmentStateEnum.DRAFT">
      <a-button class="light" @click="$emit('resume', record)">
        <Icon icon="codicon:debug-continue" />
        继续组卷
      </a-button>
      <a-popconfirm
        title="确定删除该条组卷记录吗？"
        ok-text="删除"
        cancel-text="取消"
        placement="top"
        @confirm="$emit('delete', record.assignmentId || '')"
      >
        <a-button class="red">
          <Icon icon="solar:trash-bin-minimalistic-broken" />
          删除
        </a-button>
      </a-popconfirm>
    </template>
    <template v-else>
      <a-button class="green" @click="$emit('view', record)">
        <Icon icon="hugeicons:view" />
        查看
      </a-button>
      <a-button class="gray" @click="$emit('copy', record)">
        <Icon icon="solar:copy-linear" />
        复制
      </a-button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { listExaminationItem } from '@/api/examination/type'
import { assignmentStateEnum } from '@/enum/common'
import { Icon } from '@iconify/vue'

defineProps<{
  record: listExaminationItem
}>()

defineEmits<{
  (e: 'resume', record: listExaminationItem): void
  (e: 'view', record: listExaminationItem): void
  (e: 'copy', record: listExaminationItem): void
  (e: 'delete', assignmentId: string): void
}>()
</script>

<style scoped lang="scss">
.rc-ops {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
