<template>
  <div class="status-cell" :class="status === assignmentStateEnum.FINALIZED ? 'status-final' : 'status-draft'">
    <Icon
      :icon="status === assignmentStateEnum.FINALIZED ? 'mdi:check-circle' : 'mdi:playlist-edit'"
      class="status-icon"
    />
    {{ status === assignmentStateEnum.FINALIZED ? '已定稿' : '未定稿' }}
  </div>
</template>

<script setup lang="ts">
import { assignmentStateEnum } from '@/enum/common'
import { Icon } from '@iconify/vue'

defineProps<{
  status: string | number
}>()
</script>

<style scoped lang="scss">
.status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;

  .status-icon {
    font-size: 18px;
  }

  &.status-final {
    color: rgba(22, 163, 74, 1); // 绿色
  }

  &.status-draft {
    color: #f97316; // 橙色
  }
}
</style>
