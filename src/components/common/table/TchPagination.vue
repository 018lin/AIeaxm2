<template>
  <div class="tch-table-footer flex-between" :style="footerStyle">
    <div class="tch-results" v-if="showTotalText">{{ rangeText }}</div>
    <a-pagination
      v-model:current="localCurrent"
      v-model:pageSize="localPageSize"
      :total="total"
      :show-size-changer="showSizeChanger"
      v-bind="$attrs"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, required: true },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, required: true },
  showSizeChanger: { type: Boolean, default: false },
  showTotalText: { type: Boolean, default: true },
  footerPadding: { type: String, default: '20px' },
})

const emit = defineEmits(['update:current', 'update:pageSize', 'change'])

const localCurrent = computed({
  get: () => props.current,
  set: val => emit('update:current', val),
})

const localPageSize = computed({
  get: () => props.pageSize,
  set: val => emit('update:pageSize', val),
})

const rangeText = computed(() => {
  if (props.total === 0) return '0 条结果'
  const start = (props.current - 1) * props.pageSize + 1
  const end = Math.min(props.current * props.pageSize, props.total)
  const result =
    start === end ? `${start} 条结果（共 ${props.total} 条）` : `${start} 至 ${end} 条结果（共 ${props.total} 条）`
  return result
})

const footerStyle = computed(() => ({
  padding: props.footerPadding,
}))

const onChange = (page: number, pageSize: number) => {
  emit('change', page, pageSize)
}
</script>

<style scoped lang="scss">
.tch-results {
  font-size: 13px;
  color: rgb(140 109 93 / 1);
  font-style: italic;
}
</style>
