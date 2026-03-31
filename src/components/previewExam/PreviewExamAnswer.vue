<template>
  <!-- A4 单列答案分页 -->
  <template v-if="props.curPaperType === 'A4'">
    <template v-for="(page, pageIndex) in paginatedAnswers" :key="pageIndex">
      <div class="page" :class="className" :style="styleList">
        <div class="page-index">{{ pageIndex + 1 }}</div>
        <div class="answer-page-title">参考答案与解析</div>
        <div class="answer-list">
          <template v-for="(item, index) in page" :key="index">
            <!-- 题型标题（仅在该页首次出现时显示） -->
            <div v-if="item.showTypeHeader" class="question-type-header">
              {{ item.typeName }}
            </div>
            <div class="answer-item" :class="{ truncated: item.isTruncated }">
              <div class="answer-header">
                <span class="answer-number"
                  >{{ item.questionNumber }}.<span v-if="item.isContinued" class="continued-mark">（续）</span></span
                >
              </div>
              <div class="answer-content">
                <div v-if="item.answer" class="answer-section">
                  <span class="answer-label">答案：</span>
                  <span class="answer-text">{{ formatAnswer(item.answer) }}</span>
                </div>
                <div v-if="item.analysis" class="answer-section">
                  <span class="answer-label">解析：</span>
                  <span class="answer-text">{{ item.analysis }}</span>
                </div>
                <div v-if="item.isTruncated" class="truncated-indicator">（继续下页）</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </template>

  <!-- A3/A4DC 双列答案分页 -->
  <template v-else>
    <template v-for="(page, pageIndex) in paginatedAnswersA3" :key="pageIndex">
      <div class="page" :class="className" :style="styleList">
        <div class="page-index">{{ pageIndex + 1 }}</div>
        <div class="answer-page-title">参考答案与解析</div>
        <div class="questionA3">
          <!-- 左列 -->
          <div class="left">
            <div class="answer-list">
              <template v-for="(item, index) in page.left" :key="index">
                <div v-if="item.showTypeHeader" class="question-type-header">
                  {{ item.typeName }}
                </div>
                <div class="answer-item" :class="{ truncated: item.isTruncated }">
                  <div class="answer-header">
                    <span class="answer-number"
                      >{{ item.questionNumber }}.<span v-if="item.isContinued" class="continued-mark"
                        >（续）</span
                      ></span
                    >
                  </div>
                  <div class="answer-content">
                    <div v-if="item.answer" class="answer-section">
                      <span class="answer-label">答案：</span>
                      <span class="answer-text">{{ formatAnswer(item.answer) }}</span>
                    </div>
                    <div v-if="item.analysis" class="answer-section">
                      <span class="answer-label">解析：</span>
                      <span class="answer-text">{{ item.analysis }}</span>
                    </div>
                    <div v-if="item.isTruncated" class="truncated-indicator">（继续下列）</div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <!-- 中线 -->
          <div class="line"></div>
          <!-- 右列 -->
          <div class="right">
            <div class="answer-list">
              <template v-for="(item, index) in page.right" :key="index">
                <div v-if="item.showTypeHeader" class="question-type-header">
                  {{ item.typeName }}
                </div>
                <div class="answer-item" :class="{ truncated: item.isTruncated }">
                  <div class="answer-header">
                    <span class="answer-number"
                      >{{ item.questionNumber }}.<span v-if="item.isContinued" class="continued-mark"
                        >（续）</span
                      ></span
                    >
                  </div>
                  <div class="answer-content">
                    <div v-if="item.answer" class="answer-section">
                      <span class="answer-label">答案：</span>
                      <span class="answer-text">{{ formatAnswer(item.answer) }}</span>
                    </div>
                    <div v-if="item.analysis" class="answer-section">
                      <span class="answer-label">解析：</span>
                      <span class="answer-text">{{ item.analysis }}</span>
                    </div>
                    <div v-if="item.isTruncated" class="truncated-indicator">（继续下列）</div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </template>

  <!-- 隐藏测量容器：不应用scale变换，测量原始高度 -->
  <div ref="measureContainerRef" class="measure-container" :class="className">
    <div class="answer-page-title">参考答案与解析</div>
    <div class="answer-list">
      <template v-for="(typeGroup, groupIndex) in answerListByType" :key="groupIndex">
        <div ref="typeHeaderRefs" class="question-type-header" :data-type-index="groupIndex">
          {{ typeGroup.typeName }}
        </div>
        <div
          v-for="(item, index) in typeGroup.questions"
          :key="index"
          ref="answerItemRefs"
          class="answer-item"
          :data-type-index="groupIndex"
          :data-question-index="index"
        >
          <div class="answer-header">
            <span class="answer-number">{{ item.questionNumber }}.</span>
          </div>
          <div class="answer-content">
            <div v-if="item.answer" class="answer-section">
              <span class="answer-label">答案：</span>
              <span class="answer-text">{{ formatAnswer(item.answer) }}</span>
            </div>
            <div v-if="item.analysis" class="answer-section">
              <span class="answer-label">解析：</span>
              <span class="answer-text">{{ item.analysis }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

// 父组件接收的参数
const props = withDefaults(
  defineProps<{
    className?: string
    curPaperType: string
    styleList: Record<string, any>[]
    localData: QuestionBasketRsponse[]
  }>(),
  {
    className: '',
  }
)

// refs
const measureContainerRef = ref<HTMLElement | null>(null)
const typeHeaderRefs = ref<HTMLElement[]>([])
const answerItemRefs = ref<HTMLElement[]>([])

// 分页后的答案列表（A4单列）
const paginatedAnswers = ref<
  Array<
    Array<{
      questionNumber: number
      answer: string
      analysis: string
      typeName: string
      showTypeHeader: boolean
      isContinued?: boolean // 是否为续接内容
      isTruncated?: boolean // 是否被截断（有后续内容）
    }>
  >
>([])

// 分页后的答案列表（A3/A4DC双列）
const paginatedAnswersA3 = ref<
  Array<{
    left: Array<{
      questionNumber: number
      answer: string
      analysis: string
      typeName: string
      showTypeHeader: boolean
      isContinued?: boolean // 是否为续接内容
      isTruncated?: boolean // 是否被截断（有后续内容）
    }>
    right: Array<{
      questionNumber: number
      answer: string
      analysis: string
      typeName: string
      showTypeHeader: boolean
      isContinued?: boolean
      isTruncated?: boolean
    }>
  }>
>([])

// 格式化答案数组为字符串
const formatAnswer = (answer: string | string[]): string => {
  if (Array.isArray(answer)) {
    return answer.join('、')
  }
  return String(answer || '')
}

// 解析答案数据，按题型分组
const answerListByType = computed(() => {
  const result: Array<{
    typeName: string
    questions: Array<{
      questionNumber: number
      answer: string
      analysis: string
    }>
  }> = []

  let questionNumber = 1

  // 遍历所有题型
  props.localData.forEach(typeGroup => {
    const typeData = {
      typeName: typeGroup.questionTypeTagName || '未命名题型',
      questions: [] as Array<{
        questionNumber: number
        answer: string
        analysis: string
      }>,
    }

    // 遍历该题型下的所有题目
    typeGroup.children?.forEach(question => {
      try {
        // 尝试从多个可能的字段中获取解析内容
        const analysisStr = (question as any).answerInfo || ''
        const analysisData = analysisStr ? JSON.parse(analysisStr) : null

        typeData.questions.push({
          questionNumber: questionNumber++,
          answer: analysisData?.correctAnswer || '',
          analysis: analysisData?.answerAnalysis || '',
        })
      } catch (error) {
        console.error('解析答案数据失败:', error)
        typeData.questions.push({
          questionNumber: questionNumber++,
          answer: '',
          analysis: '',
        })
      }
    })

    // 只添加有题目的题型
    if (typeData.questions.length > 0) {
      result.push(typeData)
    }
  })

  return result
})

// 根据纸张类型获取页面可用高度（毫米）
const getPageHeightMm = (): number => {
  // 根据 className 判断纸张类型
  if (props.className === 'page-a3') {
    return 296.6 // A3 高度
  } else if (props.className === 'page-a4dc' || props.className === 'page-a4') {
    return 296.6 // A4 和 A4DC 高度相同
  }
  return 296.6 // 默认 A4 高度
}

// 测量并分页
const measureAndPaginate = async () => {
  await nextTick()

  if (!measureContainerRef.value || answerListByType.value.length === 0) {
    paginatedAnswers.value = []
    paginatedAnswersA3.value = []
    return
  }

  // 根据纸张类型选择分页方式
  if (props.curPaperType === 'A4') {
    await measureAndPaginateA4()
  } else {
    await measureAndPaginateA3()
  }
}

// A4 单列分页
const measureAndPaginateA4 = async () => {
  if (!measureContainerRef.value) return

  // 等待 DOM 更新和图片加载
  await new Promise(resolve => setTimeout(resolve, 100))

  const pxPerMm = 96 / 25.4
  const pageHeightMm = getPageHeightMm()

  // 获取标题高度
  const titleEl = measureContainerRef.value.querySelector('.answer-page-title') as HTMLElement
  const titleRect = titleEl?.getBoundingClientRect()
  const titleStyle = titleEl ? window.getComputedStyle(titleEl) : null
  const titleMarginBottom = titleStyle ? parseFloat(titleStyle.marginBottom || '0') : 0
  const titleHeightMm = titleEl ? (titleRect.height + titleMarginBottom) / pxPerMm : 0

  // 获取页面内边距
  const pageStyle = window.getComputedStyle(measureContainerRef.value)
  const paddingTopPx = parseFloat(pageStyle.paddingTop || '0') || 0
  const paddingBottomPx = parseFloat(pageStyle.paddingBottom || '0') || 0
  const paddingMm = (paddingTopPx + paddingBottomPx) / pxPerMm

  // 计算答案内容可用高度（总高度 - 上下内边距 - 标题高度 - 页码区域预留20mm）
  const availableHeightMm = pageHeightMm - paddingMm - titleHeightMm - 20

  // 测量每个题型标题和答案项的高度
  const typeHeaderHeights: number[] = []
  const answerItemHeights: { typeIndex: number; questionIndex: number; heightMm: number }[] = []

  // 测量题型标题高度
  typeHeaderRefs.value.forEach((el, index) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    const marginTop = parseFloat(style.marginTop || '0') || 0
    const marginBottom = parseFloat(style.marginBottom || '0') || 0
    const totalHeightMm = (rect.height + marginTop + marginBottom) / pxPerMm
    typeHeaderHeights[index] = totalHeightMm
  })

  // 测量答案项高度
  answerItemRefs.value.forEach(el => {
    if (!el) return
    const typeIndex = parseInt(el.getAttribute('data-type-index') || '0')
    const questionIndex = parseInt(el.getAttribute('data-question-index') || '0')
    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    const marginBottom = parseFloat(style.marginBottom || '0') || 0

    // 获取 answer-list 的 gap
    const listEl = el.parentElement
    const listStyle = listEl ? window.getComputedStyle(listEl) : null
    const gap = listStyle ? parseFloat(listStyle.gap || '0') : 0

    const totalHeightMm = (rect.height + marginBottom + gap) / pxPerMm
    answerItemHeights.push({ typeIndex, questionIndex, heightMm: totalHeightMm })
  })

  // 执行分页逻辑
  const pages: Array<
    Array<{
      questionNumber: number
      answer: string
      analysis: string
      typeName: string
      showTypeHeader: boolean
      isContinued?: boolean
      isTruncated?: boolean
    }>
  > = []

  let currentPage: Array<{
    questionNumber: number
    answer: string
    analysis: string
    typeName: string
    showTypeHeader: boolean
    isContinued?: boolean
    isTruncated?: boolean
  }> = []
  let currentHeight = 0
  const typeShownInPage = new Set<number>() // 记录当前页已显示的题型
  const minContentHeight = 20 // 最小内容高度（允许放入的最小值，mm）

  answerListByType.value.forEach((typeGroup, typeIndex) => {
    const typeHeaderHeight = typeHeaderHeights[typeIndex] || 0

    typeGroup.questions.forEach((question, questionIndex) => {
      const itemData = answerItemHeights.find(
        item => item.typeIndex === typeIndex && item.questionIndex === questionIndex
      )
      const itemHeight = itemData?.heightMm || 0

      // 判断是否需要显示题型标题
      const needTypeHeader = !typeShownInPage.has(typeIndex)
      const headerCost = needTypeHeader ? typeHeaderHeight : 0

      // 剩余空间（毫米）
      const remainingSpace = availableHeightMm - currentHeight

      // 安全边距：预留额外的底部空间
      const safetyMargin = 40

      // 判断是否需要续接
      const totalRequired = headerCost + itemHeight + safetyMargin

      if (currentPage.length > 0 && remainingSpace < totalRequired) {
        // 剩余空间不足，整体换页
        pages.push(currentPage)
        currentPage = []
        currentHeight = 0
        typeShownInPage.clear()

        // 重新添加到新页
        const needTypeHeaderNewPage = !typeShownInPage.has(typeIndex)
        const headerCostNewPage = needTypeHeaderNewPage ? typeHeaderHeight : 0

        currentPage.push({
          ...question,
          typeName: typeGroup.typeName,
          showTypeHeader: needTypeHeaderNewPage,
        })
        currentHeight += headerCostNewPage + itemHeight
        typeShownInPage.add(typeIndex)
      } else {
        // 空间充足，直接添加
        currentPage.push({
          ...question,
          typeName: typeGroup.typeName,
          showTypeHeader: needTypeHeader,
        })
        currentHeight += headerCost + itemHeight
        typeShownInPage.add(typeIndex)
      }
    })
  })

  // 添加最后一页
  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  paginatedAnswers.value = pages
}

// A3/A4DC 双列分页
const measureAndPaginateA3 = async () => {
  if (!measureContainerRef.value) return

  await new Promise(resolve => setTimeout(resolve, 100))

  const pxPerMm = 96 / 25.4
  const pageHeightMm = getPageHeightMm()

  // 获取标题高度
  const titleEl = measureContainerRef.value.querySelector('.answer-page-title') as HTMLElement
  const titleRect = titleEl?.getBoundingClientRect()
  const titleStyle = titleEl ? window.getComputedStyle(titleEl) : null
  const titleMarginBottom = titleStyle ? parseFloat(titleStyle.marginBottom || '0') : 0
  const titleHeightMm = titleEl ? (titleRect.height + titleMarginBottom) / pxPerMm : 0

  // 获取页面内边距
  const pageStyle = window.getComputedStyle(measureContainerRef.value)
  const paddingTopPx = parseFloat(pageStyle.paddingTop || '0') || 0
  const paddingBottomPx = parseFloat(pageStyle.paddingBottom || '0') || 0
  const paddingMm = (paddingTopPx + paddingBottomPx) / pxPerMm

  // 计算答案内容可用高度
  const availableHeightMm = pageHeightMm - paddingMm - titleHeightMm - 20

  // 测量每个题型标题和答案项的高度
  const typeHeaderHeights: number[] = []
  const answerItemHeights: { typeIndex: number; questionIndex: number; heightMm: number }[] = []

  typeHeaderRefs.value.forEach((el, index) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    const marginTop = parseFloat(style.marginTop || '0') || 0
    const marginBottom = parseFloat(style.marginBottom || '0') || 0
    const totalHeightMm = (rect.height + marginTop + marginBottom) / pxPerMm
    typeHeaderHeights[index] = totalHeightMm
  })

  answerItemRefs.value.forEach(el => {
    if (!el) return
    const typeIndex = parseInt(el.getAttribute('data-type-index') || '0')
    const questionIndex = parseInt(el.getAttribute('data-question-index') || '0')
    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    const marginBottom = parseFloat(style.marginBottom || '0') || 0
    const listEl = el.parentElement
    const listStyle = listEl ? window.getComputedStyle(listEl) : null
    const gap = listStyle ? parseFloat(listStyle.gap || '0') : 0
    const totalHeightMm = (rect.height + marginBottom + gap) / pxPerMm
    answerItemHeights.push({ typeIndex, questionIndex, heightMm: totalHeightMm })
  })

  // 双列分页逻辑
  type AnswerItem = {
    questionNumber: number
    answer: string
    analysis: string
    typeName: string
    showTypeHeader: boolean
    isContinued?: boolean
    isTruncated?: boolean
  }

  const pages: Array<{ left: AnswerItem[]; right: AnswerItem[] }> = []
  let leftColumn: AnswerItem[] = []
  let rightColumn: AnswerItem[] = []
  let leftHeight = 0
  let rightHeight = 0
  let isRightColumnStarted = false
  const leftTypeShown = new Set<number>()
  const rightTypeShown = new Set<number>()
  const minContentHeight = 20 // 最小内容高度（mm）

  answerListByType.value.forEach((typeGroup, typeIndex) => {
    const typeHeaderHeight = typeHeaderHeights[typeIndex] || 0

    typeGroup.questions.forEach((question, questionIndex) => {
      const itemData = answerItemHeights.find(
        item => item.typeIndex === typeIndex && item.questionIndex === questionIndex
      )
      const itemHeight = itemData?.heightMm || 0

      const tryPlace = (target: 'left' | 'right', options: { isContinued?: boolean } = {}) => {
        const column = target === 'left' ? leftColumn : rightColumn
        const height = target === 'left' ? leftHeight : rightHeight
        const typeShown = target === 'left' ? leftTypeShown : rightTypeShown

        const needTypeHeader = options.isContinued ? false : !typeShown.has(typeIndex)
        const headerCost = needTypeHeader ? typeHeaderHeight : 0

        // 剩余空间（毫米）
        const remainingSpace = availableHeightMm - height

        // 安全边距
        const safetyMargin = 40

        // 判断是否能放入该列
        const totalRequired = headerCost + itemHeight + safetyMargin

        if (remainingSpace < totalRequired) {
          // 空间不足，不放入
          return false
        }

        // 空间充足，完整放入
        column.push({
          ...question,
          typeName: typeGroup.typeName,
          showTypeHeader: needTypeHeader,
          isContinued: options.isContinued,
        })

        if (target === 'left') {
          leftHeight += headerCost + itemHeight
        } else {
          rightHeight += headerCost + itemHeight
          isRightColumnStarted = true
        }

        typeShown.add(typeIndex)
        return true
      }

      // 优先填充策略：右列未使用时优先左列，右列使用后优先右列
      if (!isRightColumnStarted) {
        const leftResult = tryPlace('left')
        if (!leftResult) {
          const rightResult = tryPlace('right')
          if (!rightResult) {
            // 两列都放不下，换页
            pages.push({ left: leftColumn, right: rightColumn })
            leftColumn = []
            rightColumn = []
            leftHeight = 0
            rightHeight = 0
            isRightColumnStarted = false
            leftTypeShown.clear()
            rightTypeShown.clear()
            // 重新尝试放置
            tryPlace('left')
          }
        }
      } else {
        const rightResult = tryPlace('right')
        if (!rightResult) {
          // 右列放不下，换页
          pages.push({ left: leftColumn, right: rightColumn })
          leftColumn = []
          rightColumn = []
          leftHeight = 0
          rightHeight = 0
          isRightColumnStarted = false
          leftTypeShown.clear()
          rightTypeShown.clear()
          // 重新尝试放置
          tryPlace('left')
        }
      }
    })
  })

  // 添加最后一页
  if (leftColumn.length > 0 || rightColumn.length > 0) {
    pages.push({ left: leftColumn, right: rightColumn })
  }

  paginatedAnswersA3.value = pages
}

// 监听数据变化，重新分页
watch(
  () => [props.localData, props.className, props.styleList, props.curPaperType],
  () => {
    measureAndPaginate()
  },
  { deep: true }
)

onMounted(() => {
  measureAndPaginate()
})
</script>

<style scoped lang="less">
.page {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  margin: 0 auto 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 25px 20px 20px;
  position: relative;
}

.page-index {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  white-space: nowrap;
  z-index: 10;
}

.answer-page-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
  color: #111827;
}

.answer-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-type-header {
  padding: 10px 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  background: #e5e6e7;
  color: #000;
  font-size: 16px;
  font-weight: 700;
}

.answer-item {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;

  &.truncated {
    max-height: 80mm; /* 限制整个答案项的最大高度 */
    overflow: hidden;
    .answer-content {
      max-height: 75mm; /* 限制内容区域高度 */
      overflow: hidden;
    }
  }
}

.answer-header {
  flex-shrink: 0;
  .answer-number {
    font-weight: 700;
    color: #374151;
    font-size: 15px;
  }
  .continued-mark {
    color: #f59e0b;
    font-weight: 600;
    font-size: 13px;
    margin-left: 4px;
  }
}

.answer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-section {
  line-height: 1.6;
  color: #374151;
  font-size: 14px;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.answer-label {
  font-weight: 600;
  color: #111827;
  margin-right: 4px;
}

.answer-text {
  color: #4b5563;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.truncated-indicator {
  color: #f59e0b;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  margin-top: 4px;
}

/* 测量容器 */
.measure-container {
  position: absolute;
  left: -9999px;
  top: -9999px;
  visibility: hidden;
  background: #fff;
  padding: 25px 20px 20px;

  /* 添加与实际显示相同的换行样式 */
  .answer-section {
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .answer-text {
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }
}

/* 测量容器根据纸张类型设置宽高 */
.measure-container.page-a4 {
  width: 210mm;
  height: 296.6mm;
}

.measure-container.page-a3 {
  width: 420mm;
  height: 296.6mm;
}

.measure-container.page-a4dc {
  width: 210mm;
  height: 296.6mm;
}

/* 纸张类型样式 */
.page-a4 {
  width: 210mm;
  height: 296.6mm;
}

.page-a3 {
  width: 420mm;
  height: 296.6mm;
}

.page-a4dc {
  width: 210mm;
  height: 296.6mm;
}

/* 双列布局 */
.questionA3 {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.questionA3 .left,
.questionA3 .right {
  flex: 1;
  min-width: 0;
}

.questionA3 .line {
  width: 1px;
  background: #e5e7eb;
  align-self: stretch;
}

.page-a3 .questionA3 {
  gap: 8px;
}

.page-a4dc .questionA3 {
  gap: 8px;
}
</style>
