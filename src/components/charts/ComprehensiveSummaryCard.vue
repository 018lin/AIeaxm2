<template>
  <section class="csc-card">
    <div class="csc-head">
      <div class="csc-title">
        <i class="csc-bar" />
        <span class="csc-cn">{{ titleCn }}</span>
      </div>
    </div>

    <div class="csc-body">
      <div class="csc-icon" aria-hidden="true">
        <Icon icon="solar:stars-minimalistic-bold-duotone" width="18" />
      </div>

      <div class="csc-text">
        {{ displayText }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { generateClassReportComment, generateStudentReportComment } from '@/api/analysis/index'
import type { ClassReportRespVO, StudentReportGetData } from '@/api/analysis/type'
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// 文本由父组件传入；未传入时可基于 report 自动生成
const props = withDefaults(
  defineProps<{
    titleCn?: string
    text?: string
    report?: StudentReportGetData | ClassReportRespVO | null
    studentName?: string
    startDate?: string
    endDate?: string
  }>(),
  {
    titleCn: '综合评语',
    text: '',
    report: null,
    studentName: '',
    startDate: '',
    endDate: '',
  }
)

const generated = ref('')
const loading = ref(false)
let reqSeq = 0
let pollTimer: ReturnType<typeof setInterval> | null = null

defineExpose({ loading })

const reportText = computed(() => String(props.report?.comprehensiveComment || '').trim())

const displayText = computed(() => {
  if (generated.value) return generated.value // 优先显示生成的评语
  if (reportText.value) return reportText.value
  return loading.value ? '评语生成中…' : ''
})

// StudentReportGetData 有 studentUserId 字段，而 ClassReportRespVO 没有
const isStudentReport = computed(() => !!props.report && 'studentUserId' in props.report)
const isClassReport = computed(() => !!props.report && 'classComparisonList' in props.report)
const report = computed(() => props.report || null)

// 检查report是否有有效数据
const isReportValid = computed(() => {
  const hasReport = !!props.report
  return hasReport
})

// 清理轮询定时器
const clearPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const tryGenerate = async () => {
  // 确保report存在且是学生报告或班级报告
  if (!report.value || (!isStudentReport.value && !isClassReport.value)) {
    return
  }

  const my = ++reqSeq
  loading.value = true
  try {
    let res: string
    if (isStudentReport.value) {
      res = await generateStudentReportComment(report.value as StudentReportGetData)
    } else if (isClassReport.value) {
      res = await generateClassReportComment(report.value as ClassReportRespVO)
    } else {
      return // 不支持的报告类型
    }

    if (my !== reqSeq) return
    generated.value = String(res || '').trim()
  } catch (err) {
    if (my !== reqSeq) return
    generated.value = ''
  } finally {
    if (my !== reqSeq) return
    loading.value = false
  }
}

// 带延迟和轮询的API调用
const tryGenerateWithDelay = async () => {
  clearPoll()

  // 如果数据已经有效，延迟1秒后调用API
  if (isReportValid.value) {
    setTimeout(() => {
      tryGenerate()
    }, 1000)
    return
  }

  // 如果数据无效，轮询等待，最多等待5秒
  let attempts = 0
  const maxAttempts = 10 // 10次 × 500ms = 5秒

  pollTimer = setInterval(() => {
    attempts++
    if (isReportValid.value) {
      clearPoll()
      // 数据有效后延迟1秒再调用API
      setTimeout(() => {
        tryGenerate()
      }, 1000)
    } else if (attempts >= maxAttempts) {
      // 超时，清理定时器
      clearPoll()
    }
  }, 500)
}

watch(
  () => props.report,
  newReport => {
    generated.value = ''
    tryGenerateWithDelay()
  },
  { deep: true }
)

onMounted(() => {
  tryGenerateWithDelay()
})

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  clearPoll()
})
</script>

<style scoped lang="less">
.csc-card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid rgba(241, 245, 249, 1);
}

.csc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.csc-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.csc-bar {
  width: 4px;
  height: 18px;
  border-radius: 99px;
  background: #f59e0b;
  display: inline-block;
}

.csc-cn {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.csc-body {
  border-radius: 14px;
  background: rgba(248, 250, 252, 1);
  border: 1px solid rgba(241, 245, 249, 1);
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.csc-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 247, 237, 0.9);
  color: #f59e0b;
  flex: none;
}

.csc-text {
  font-size: 12px;
  line-height: 28px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.78);
}
</style>
