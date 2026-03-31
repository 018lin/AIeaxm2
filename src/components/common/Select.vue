<template>
  <div class="select-container">
    <div v-for="(item, index) in list" :key="item.dictType" class="select-item">
      <div class="input-label" v-if="showLabel">
        {{ selectTypeEnum[item.dictType as keyof typeof selectTypeEnum] }}
      </div>
      <a-select
        :style="{ width: width }"
        allow-clear
        class="rc-select"
        :value="selectValue ? selectValue[index] : undefined"
        :placeholder="`请选择${selectTypeEnum[item.dictType as keyof typeof selectTypeEnum]}`"
        :disabled="item.disabled"
        @change="changeSelect($event, item.dictType)"
      >
        <a-select-option
          v-for="subItem in item.dictTypeList"
          :key="subItem.id"
          :value="subItem.dictValue ?? subItem.value"
        >
          {{ subItem.label }}
        </a-select-option>
      </a-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDictList } from '@/api/common/index'
import type { dictListResponse } from '@/api/common/type'
import { selectTypeEnum, selectValueEnum } from '@/enum/common'
import { onMounted, ref, watch } from 'vue'

// 父组件参数
const props = withDefaults(
  defineProps<{
    typeList: string[]
    selectValue?: (string | undefined)[]
    showLabel?: boolean
    width?: string
    customData?: (dictListResponse & { disabled?: boolean })[]
  }>(),
  {
    showLabel: false,
  }
)
const emit = defineEmits<{
  (e: 'getList', params: any): void
}>()

// 状态
const list = ref<(dictListResponse & { disabled?: boolean })[]>([])
// 修改父组件参数
const changeSelect = (value: any, dictType: string | undefined) => {
  if (!dictType) return
  const keyValue = selectValueEnum[dictType as keyof typeof selectValueEnum]
  emit('getList', { [keyValue]: value || undefined })
  // if(dictType === 'ipta_grade' && props.typeList.includes('ipta_class')) {
  //   getDictData([selectEnum.CLASS]) // 切换年级时重新获取班级数据
  // }
}

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  list.value = res || []
}

// 监听字典数据
onMounted(() => {
  if (props.customData && props.customData.length > 0) {
    list.value = props.customData
  } else if (props.typeList.length > 0) {
    getDictData(props.typeList)
  }
})

watch(
  () => props.customData,
  newVal => {
    if (newVal && newVal.length > 0) {
      list.value = newVal
    }
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.select-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.select-item {
  display: flex;
  flex-direction: column;
}
.rc-select {
  width: 200px;
}
</style>
