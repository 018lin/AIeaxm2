<template>
  <div class="layered">
    <div class="input-label">学段</div>
    <div class="layered-btn">
      <p
        v-for="item in layeredData"
        :key="item.groupId"
        :class="{ active: groupId === item.groupId }"
        @click="onSelect(item.groupId)"
      >
        {{ item.groupName }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['select'])

const groupId = ref<string>()
const layeredData = [
  { groupName: '全部', groupId: 'all' },
  { groupName: '基础层', groupId: '1' },
  { groupName: '提高层', groupId: '2' },
  { groupName: '拓展层', groupId: '3' },
]

const onSelect = (id: string) => {
  groupId.value = id
  emit('select', groupId.value, 'layered')
}
</script>

<style scoped lang="less">
.layered {
  width: 100%;

  .layered-btn {
    display: flex;
    margin-top: 10px;
    flex-wrap: wrap;
    justify-content: space-between;

    p {
      padding: 10px 16px;
      border-radius: 20px;
      background-color: #f9f5f2;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.85);

      &.active {
        border: 1px solid transparent;
        background-color: var(--color-bg-warm) !important;
        color: var(--color-primary-hover);
        border-color: var(--color-primary-soft);
      }
    }
  }
}
</style>
