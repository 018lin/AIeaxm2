<template>
  <div class="flex-col">
    <span class="input-label" v-show="showLabel">新建/修改日期</span>
    <a-range-picker
      v-model:value="dateRange"
      :placeholder="placeholder || ['开始时间', '结束时间']"
      :presets="innerPresets"
      :disabledDate="disabledDate"
      @change="changeDate"
      allowClear
      class="rc-date"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs'
import { computed, ref, watch } from 'vue'

type Preset = { label: string; value: [Dayjs, Dayjs] }

const props = defineProps<{
  defaultValue?: [Dayjs, Dayjs]
  showLabel?: boolean
  presets?: Preset[]
  placeholder?: [string, string]
  disabledDate?: (currentDate: Dayjs) => boolean
}>()

const emit = defineEmits<{
  (e: 'getList', params: any): void
}>()

const defaultPresets: Preset[] = [
  { label: '最近1个月', value: [dayjs().subtract(1, 'month'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近3个月', value: [dayjs().subtract(3, 'month'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近6个月', value: [dayjs().subtract(6, 'month'), dayjs()] as [Dayjs, Dayjs] },
]

const innerPresets = computed(() => props.presets || defaultPresets)

const dateRange = ref<[Dayjs, Dayjs] | null>(props.defaultValue || null)

watch(
  () => props.defaultValue,
  val => {
    if (val) {
      dateRange.value = val
    }
  },
  { immediate: true }
)

const changeDate = (_date: [Dayjs, Dayjs] | null, dateString: [string, string]) => {
  dateRange.value = _date
  if (dateString[0] && dateString[1]) {
    emit('getList', { startDate: dateString[0], endDate: dateString[1] })
  } else {
    emit('getList', { startDate: undefined, endDate: undefined })
  }
}
</script>

<style scoped lang="scss">
.rc-date {
  width: 240px;
}
</style>
