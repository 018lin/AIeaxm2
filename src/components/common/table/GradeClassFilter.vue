<template>
  <div class="gc-container">
    <!-- 年级 -->
    <div class="gc-item flex-col">
      <div class="input-label" v-if="showLabel">
        {{ selectTypeEnum[selectEnum.GRADE as keyof typeof selectTypeEnum] }}
      </div>
      <a-select
        :style="{ width }"
        allow-clear
        class="rc-select"
        :value="gradeId"
        :placeholder="`请选择${selectTypeEnum[selectEnum.GRADE as keyof typeof selectTypeEnum]}`"
        :loading="gradeLoading"
        @change="onGradeChange"
      >
        <a-select-option v-for="it in gradeOptions" :key="it.value" :value="it.value">
          {{ it.label }}
        </a-select-option>
      </a-select>
    </div>

    <!-- 班级（依赖年级，年级未选时禁用） -->
    <div class="gc-item flex-col">
      <div class="input-label" v-if="showLabel">
        {{ selectTypeEnum[selectEnum.CLASS as keyof typeof selectTypeEnum] }}
      </div>
      <a-select
        :style="{ width }"
        allow-clear
        class="rc-select"
        :value="classId"
        :placeholder="
          gradeId ? `请选择${selectTypeEnum[selectEnum.CLASS as keyof typeof selectTypeEnum]}` : '请先选择年级'
        "
        :disabled="!gradeId"
        :loading="classLoading"
        @change="onClassChange"
      >
        <a-select-option v-for="it in classOptions" :key="it.value" :value="it.value">
          {{ it.label }}
        </a-select-option>
      </a-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getClassPage, getDictList } from '@/api/common/index'
import type { dictListItem } from '@/api/common/type'
import { selectEnum, selectTypeEnum } from '@/enum/common'
import { onMounted, ref, watch } from 'vue'

type Option = { label: string; value: string }

// 父组件参数：
// - selectValue: [gradeId, classId]
// - showLabel: 是否展示“年级/班级”标签
// - width: 下拉框宽度
const props = withDefaults(
  defineProps<{
    selectValue?: (string | undefined)[]
    showLabel?: boolean
    isStore?: boolean
    width?: string
  }>(),
  {
    showLabel: false,
    isStore: false,
    width: '200px',
  }
)

// 对外抛出筛选参数（与页面现有 handleFilter 协作）
const emit = defineEmits<{
  (e: 'getList', params: { gradeId?: string; classId?: string }): void
}>()

// 当前选中值
const gradeId = ref<string | undefined>(props.selectValue?.[0])
const classId = ref<string | undefined>(props.selectValue?.[1])

// 加载态
const gradeLoading = ref(false)
const classLoading = ref(false)

// 下拉选项
const gradeOptions = ref<Option[]>([])
const classOptions = ref<Option[]>([])

// 字典接口兼容：优先使用 dictValue，其次 value
const normalizeDictValue = (it: dictListItem) => String((it as any).dictValue ?? it.value ?? '')

// 获取年级字典（ipta_grade）
const fetchGrades = async () => {
  gradeLoading.value = true
  try {
    const res = await getDictList({ dictTypes: [selectEnum.GRADE] })
    const items = (res?.[0]?.dictTypeList || []) as dictListItem[]
    gradeOptions.value = items
      .map(it => ({ label: String(it.label || ''), value: normalizeDictValue(it) }))
      .filter(it => !!it.value)
  } finally {
    gradeLoading.value = false
  }
}

// 班级列表请求序号：避免快速切换年级时旧请求覆盖新请求
let classReqSeq = 0

// 获取班级列表（根据 gradeId）
const fetchClasses = async (gid: string | undefined) => {
  const seq = ++classReqSeq

  if (!gid) {
    classOptions.value = []
    return
  }

  classLoading.value = true
  try {
    const data = await getClassPage({
      gradeId: gid,
      pageNo: 1,
      pageSize: 20,
    })

    if (seq !== classReqSeq) return

    const list = data?.list || []
    classOptions.value = list
      .map(it => ({
        label: String(it.className || it.classId || ''),
        value: String(it.classId || it.id || ''),
      }))
      .filter(it => !!it.value)

    // 如果父组件传入的 classId 不在当前年级的班级列表里，则清空
    if (classId.value && !classOptions.value.some(it => it.value === classId.value)) {
      classId.value = undefined
      emit('getList', { classId: undefined })
    }
  } finally {
    if (seq === classReqSeq) classLoading.value = false
  }
}

// 年级变化：清空班级并重新拉取班级列表
const onGradeChange = async (v: string | undefined) => {
  const next = v || undefined
  if (next === gradeId.value) return

  gradeId.value = next
  classId.value = undefined
  classOptions.value = []

  emit('getList', { gradeId: next, classId: undefined })
  await fetchClasses(next)
}

// 班级变化：仅上报 classId
const onClassChange = (v: string | undefined) => {
  const next = v || undefined
  classId.value = next
  if (props.isStore && next) {
    localStorage.setItem('levelClassId', next)
  }
  emit('getList', { classId: next })
}

// 外部受控：父组件更新 selectValue 时，同步并按需刷新班级列表
watch(
  () => props.selectValue,
  async v => {
    const nextGrade = v?.[0] || undefined
    const nextClass = v?.[1] || undefined

    const gradeChanged = nextGrade !== gradeId.value
    gradeId.value = nextGrade
    classId.value = nextClass

    if (gradeChanged) {
      classOptions.value = []
      await fetchClasses(nextGrade)
    }
  },
  { deep: true }
)

// 初始化：先取年级字典，再根据默认年级取班级
onMounted(async () => {
  await fetchGrades()
  if (gradeId.value) await fetchClasses(gradeId.value)
})
</script>

<style scoped lang="scss">
.gc-container {
  display: flex;
  gap: 10px;
}
.rc-select {
  width: 200px;
}
</style>
