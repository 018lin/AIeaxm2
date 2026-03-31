<template>
  <Teleport to="body">
    <div class="preview-cover-bg" v-show="open">
      <!-- 弹窗遮罩层 -->
      <div class="preview-cover" @click.self="closePreview">
        <!-- loading -->
        <a-spin :spinning="spinning" :delay="delayTime" tip="定稿中..." size="large">
          <!-- 弹窗内容 -->
          <div class="preview-modal">
            <div class="preview-header">
              <div class="preview-title">
                <Icon icon="solar:document-text-bold" width="20" />
                <div class="preview-title-text">预览并定稿</div>
              </div>

              <div style="display: flex; align-items: center; gap: 12px">
                <!-- 留存代码--调试坐标可放开 -->
                <!-- <a-button size="small" :type="showRedDots ? 'primary' : 'default'" @click="toggleRedDots">
                  <template #icon>
                    <Icon :icon="showRedDots ? 'solar:eye-bold' : 'solar:eye-closed-bold'" width="16" />
                  </template>
                  {{ showRedDots ? '隐藏坐标' : '显示坐标' }}
                </a-button> -->

                <button type="button" class="preview-close" aria-label="关闭" @click="closePreview">
                  <Icon icon="material-symbols:close-rounded" width="22" />
                </button>
              </div>
            </div>
            <div class="preview-body">
              <div class="preview-left" ref="previewLeftRef">
                <div v-if="layoutLoading" class="layout-loading">
                  <a-spin size="large" tip="排版中..." />
                </div>
                <!-- 分页预览：A4 单栏 -->
                <template v-if="curPaper.type === 'A4'">
                  <!-- 有分页结果时，按页渲染 -->
                  <template v-if="paginatedA4Pages.length">
                    <div
                      v-for="(page, pageIndex) in paginatedA4Pages"
                      :key="`a4_${pageIndex}`"
                      class="page"
                      :style="pageStyle"
                    >
                      <div class="page-index">{{ pageIndex + 1 }}</div>
                      <div class="header-box">
                        <PreviewExamHeader
                          v-if="info"
                          :info="info"
                          :isShowHeaderGrade="isShowHeaderGrade"
                          :paperType="curPaper.type || 'A4'"
                          :qrCodeContent="getQrCodeByPage(pageIndex)"
                          @grade-change="handleGradeChange"
                        />
                      </div>
                      <div
                        v-for="block in page"
                        :key="`${block.typeIndex}_${block.startIndex}_${block.endIndex}`"
                        style="margin-bottom: 15px"
                      >
                        <div v-if="block.showTypeHeader" class="question-type-header">
                          {{ numberToChinese(block.typeIndex + 1) }}、{{ block.typeName }}
                        </div>
                        <PreviewExamList
                          :isFinalized="isFinalized"
                          :pageList="block.children"
                          :paperType="curPaper.type || 'A4'"
                          :startNo="block.startNo"
                          :maxImageHeight="maxImageHeight"
                          @move="onQuestionMove(block, $event)"
                        />
                      </div>
                      <div class="left-top-points page-points"></div>
                      <div class="right-top-points page-points"></div>
                      <div class="left-bottom-points page-points"></div>
                      <div class="right-bottom-points page-points"></div>
                    </div>
                  </template>

                  <!-- 兜底：如果还没有计算出分页结果，就按原来方式整页渲染一页，避免空白 -->
                  <template v-else-if="localData.length">
                    <div class="page" :style="pageStyle">
                      <div class="page-index">1</div>
                      <div class="header-box">
                        <PreviewExamHeader
                          v-if="info"
                          :info="info"
                          :isShowHeaderGrade="isShowHeaderGrade"
                          :paperType="curPaper.type || 'A4'"
                          :qrCodeContent="getQrCodeByPage(0)"
                          @grade-change="handleGradeChange"
                        />
                      </div>
                      <div v-for="(item, index) in localData" :key="`fallback_${index}`" style="margin-bottom: 15px">
                        <div class="question-type-header">
                          {{ numberToChinese(index + 1) }}、{{ item.questionTypeTagName }}
                        </div>
                        <PreviewExamList
                          :isFinalized="isFinalized"
                          :pageList="item.children"
                          :paperType="curPaper.type || 'A4'"
                          :maxImageHeight="maxImageHeight"
                          @move="onQuestionMoveFallback(index, $event)"
                        />
                      </div>

                      <div class="left-top-points page-points"></div>
                      <div class="right-top-points page-points"></div>
                      <div class="left-bottom-points page-points"></div>
                      <div class="right-bottom-points page-points"></div>
                    </div>
                  </template>

                  <template v-if="isAnswer">
                    <PreviewExamAnswer
                      :styleList="[pageStyle, a3PageStyle]"
                      :className="''"
                      :curPaperType="curPaper.type || 'A4'"
                      :localData="localData"
                    />
                  </template>
                </template>

                <!-- 分页预览：A3/A4DC 双栏（先上下再左右） -->
                <template v-else>
                  <div
                    v-for="(page, pageIndex) in paginatedA3Pages"
                    :key="`a3_${pageIndex}`"
                    class="page"
                    :class="{ 'page-a3': curPaper.type === 'A3', 'page-a4dc': curPaper.type === 'A4DC' }"
                    :style="[pageStyle, a3PageStyle]"
                  >
                    <div class="page-index">{{ pageIndex + 1 }}</div>
                    <!-- A4DC: Header 占位 100%，在双栏容器之上 -->
                    <template v-if="curPaper.type === 'A4DC'">
                      <div class="header-box">
                        <PreviewExamHeader
                          v-if="info"
                          :info="info"
                          :isShowHeaderGrade="isShowHeaderGrade"
                          :paperType="curPaper.type || 'A4'"
                          :qrCodeContent="getQrCodeByPage(pageIndex)"
                          @grade-change="handleGradeChange"
                        />
                      </div>
                      <div class="questionA3">
                        <div class="left">
                          <div
                            v-for="block in page.left"
                            :key="`l_${block.typeIndex}_${block.startIndex}_${block.endIndex}`"
                            style="margin-bottom: 15px"
                          >
                            <div v-if="block.showTypeHeader" class="question-type-header">
                              {{ numberToChinese(block.typeIndex + 1) }}、{{ block.typeName }}
                            </div>
                            <PreviewExamList
                              :isFinalized="isFinalized"
                              :pageList="block.children"
                              :paperType="curPaper.type || 'A4DC'"
                              :startNo="block.startNo"
                              :maxImageHeight="maxImageHeight"
                              @move="onQuestionMove(block, $event)"
                            />
                          </div>
                        </div>
                        <div class="line"></div>
                        <div class="right">
                          <div
                            v-for="block in page.right"
                            :key="`r_${block.typeIndex}_${block.startIndex}_${block.endIndex}`"
                            style="margin-bottom: 15px"
                          >
                            <div v-if="block.showTypeHeader" class="question-type-header">
                              {{ numberToChinese(block.typeIndex + 1) }}、{{ block.typeName }}
                            </div>
                            <PreviewExamList
                              :isFinalized="isFinalized"
                              :pageList="block.children"
                              :paperType="curPaper.type || 'A4DC'"
                              :startNo="block.startNo"
                              :maxImageHeight="maxImageHeight"
                              @move="onQuestionMove(block, $event)"
                            />
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- A3: Header 只在左侧栏占位，右侧从顶部开始 -->
                    <template v-else>
                      <div class="questionA3">
                        <div class="left">
                          <div class="header-box">
                            <PreviewExamHeader
                              v-if="info"
                              :info="info"
                              :isShowHeaderGrade="isShowHeaderGrade"
                              :paperType="curPaper.type || 'A4'"
                              :qrCodeContent="getQrCodeByPage(pageIndex)"
                              @grade-change="handleGradeChange"
                            />
                          </div>
                          <div
                            v-for="block in page.left"
                            :key="`l_${block.typeIndex}_${block.startIndex}_${block.endIndex}`"
                            style="margin-bottom: 15px"
                          >
                            <div v-if="block.showTypeHeader" class="question-type-header">
                              {{ numberToChinese(block.typeIndex + 1) }}、{{ block.typeName }}
                            </div>
                            <PreviewExamList
                              :isFinalized="isFinalized"
                              :pageList="block.children"
                              :paperType="curPaper.type || 'A3'"
                              :startNo="block.startNo"
                              :maxImageHeight="maxImageHeight"
                              @move="onQuestionMove(block, $event)"
                            />
                          </div>
                        </div>
                        <div class="line"></div>
                        <div class="right">
                          <div
                            v-for="block in page.right"
                            :key="`r_${block.typeIndex}_${block.startIndex}_${block.endIndex}`"
                            style="margin-bottom: 15px"
                          >
                            <div v-if="block.showTypeHeader" class="question-type-header">
                              {{ numberToChinese(block.typeIndex + 1) }}、{{ block.typeName }}
                            </div>
                            <PreviewExamList
                              :isFinalized="isFinalized"
                              :pageList="block.children"
                              :paperType="curPaper.type || 'A3'"
                              :startNo="block.startNo"
                              :maxImageHeight="maxImageHeight"
                              @move="onQuestionMove(block, $event)"
                            />
                          </div>
                        </div>
                      </div>
                    </template>

                    <div class="left-top-points page-points"></div>
                    <div class="right-top-points page-points"></div>
                    <div class="left-bottom-points page-points"></div>
                    <div class="right-bottom-points page-points"></div>
                  </div>
                  <template v-if="isAnswer">
                    <PreviewExamAnswer
                      :styleList="[pageStyle, a3PageStyle]"
                      :curPaperType="curPaper.type || 'A4DC'"
                      :className="curPaper.type === 'A3' ? 'page-a3' : curPaper.type === 'A4DC' ? 'page-a4dc' : ''"
                      :localData="localData"
                    />
                  </template>
                </template>

                <!-- 隐藏测量容器：用于计算可用高度与题目高度（图片加载后测量） -->
                <div
                  ref="measurePageRef"
                  class="page"
                  :style="pageStyle"
                  style="position: absolute; visibility: hidden; left: -9999px; top: -9999px"
                >
                  <div class="header-box">
                    <PreviewExamHeader
                      v-if="info"
                      :info="info"
                      :isShowHeaderGrade="isShowHeaderGrade"
                      :paperType="curPaper.type || 'A4'"
                      :qrCodeContent="info?.qrCodeContent ?? ''"
                    />
                  </div>
                  <div
                    v-for="(item, index) in localData"
                    :key="`m_${index}`"
                    class="type-block"
                    style="margin-bottom: 15px"
                  >
                    <div class="question-type-header">
                      {{ numberToChinese(index + 1) }}、{{ item.questionTypeTagName }}
                    </div>
                    <div class="measure-list" :style="measureListStyle">
                      <PreviewExamList
                        :isFinalized="isFinalized"
                        :pageList="item.children"
                        :paperType="curPaper.type || 'A4'"
                        :maxImageHeight="maxImageHeight"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <PreviewExamAside
                :curPaperType="curPaper.type || 'A4'"
                :localData="localData"
                :isFinalized="isFinalized"
                v-model:isAnswer="isAnswer"
                @change-paper-type="changePaperType"
                @update:localData="val => emit('update:localData', val)"
                @finalize="finalize"
                @download="download"
              />
            </div>
          </div>
        </a-spin>
      </div>
    </div>
  </Teleport>
  <ChangeName
    :open="changeNameVisibe"
    :name="info?.assignmentName ?? ''"
    @close="closeChangeName"
    @getNewName="getNewName"
  />
</template>

<script setup lang="ts">
import { downloadExamination, finalizeExamination } from '@/api/examination/index'
import type {
  finalizeExaminationRequest,
  previewExaminationResponse,
  qrcodeExaminationResponse,
} from '@/api/examination/type'
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import ChangeName from '@/components/previewExam/ChangeName.vue'
import PreviewExamAnswer from '@/components/previewExam/PreviewExamAnswer.vue'
import PreviewExamAside from '@/components/previewExam/PreviewExamAside.vue'
import PreviewExamHeader from '@/components/previewExam/PreviewExamHeader.vue'
import PreviewExamList from '@/components/previewExam/PreviewExamList.vue'
import { assignmentStateEnum } from '@/enum/common'
import {
  clearRedDots,
  fetchQrcodeList,
  generateAnswerJson,
  generatePDF,
  generateQuestionJson,
  handleQuestionMove,
  handleQuestionMoveFallback,
} from '@/services/previewExam'
import type { onePaperTypes, paperTypes } from '@/types/examination'
import type { MovePayload, TypeBlock } from '@/types/questionBasket'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'

// 将数字转换为中文大写数字
const numberToChinese = (num: number): string => {
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (num <= 10) return chineseNumbers[num - 1] ?? ''
  if (num < 20) return '十' + (num === 10 ? '' : (chineseNumbers[num - 11] ?? ''))
  const tens = Math.floor(num / 10)
  const ones = num % 10
  return (chineseNumbers[tens - 1] ?? '') + '十' + (ones === 0 ? '' : (chineseNumbers[ones - 1] ?? ''))
}

// 父组件接收的参数
const props = defineProps<{
  open: boolean
  info: previewExaminationResponse | null
  localData: QuestionBasketRsponse[]
}>()
const emit = defineEmits<{ close: [boolean]; 'update:localData': [QuestionBasketRsponse[]] }>()

// 响应式使用父组件传入的info和localData
const info = computed(() => props.info)
const localData = computed(() => props.localData)

// 处理年级变更
const handleGradeChange = (gradeId: string) => {
  if (info.value) {
    info.value.gradeId = gradeId
  }
}

// 题库列表
const paginatedA4Pages = ref<TypeBlock[][]>([])
const paginatedA3Pages = ref<{ left: TypeBlock[]; right: TypeBlock[] }[]>([])

// 测量页面相关
const measurePageRef = ref<HTMLElement | null>(null)
const previewLeftRef = ref<HTMLElement | null>(null)
const pxPerMm = 96 / 25.4
const pageStyle = computed(() => ({
  width: `${curPaper.value.width || 210}mm`,
  height: `${curPaper.value.height || 296.6}mm`,
}))
// A3 预览缩放比例（仅影响可见 A3 页面，测量页不缩放）
const a3Scale = ref(1)

// 基础状态
const curPaper = ref<onePaperTypes>({
  type: 'A4',
  column: 1,
  width: 210,
  height: 296.6,
})
const paperTypes = reactive<paperTypes>({
  A3: {
    column: 2,
    width: 420,
    height: 296.6,
  },
  A4: {
    column: 1,
    width: 210,
    height: 296.6,
  },
  A4DC: {
    column: 2,
    width: 210,
    height: 296.6,
  },
})
const isFinalized = ref(props.info?.status === assignmentStateEnum.FINALIZED) // 是否定稿
const changeNameVisibe = ref(false) // 改名弹窗可见性
const isAnswer = ref(false) // 是否显示答案
const qrcodeList = ref<qrcodeExaminationResponse[]>([]) // 二维码列表
const spinning = ref(false) // loading 状态
const delayTime = 500 // loading 延迟显示时间（毫秒）
const isInitializing = ref(false) // 是否正在初始化分页
const layoutLoading = ref(false) // 首次加载/切换布局时的 loading
const isShowHeaderGrade = ref(false) // 是否显示年级name
// const parsedUserInfo = getUserBaseInfo()
// const gradeId = ref(parsedUserInfo?.gradeId || '') // 年级ID
// const subjectId = ref(parsedUserInfo?.subjectId || '') // 学科ID

// 测量容器中题目区域宽度：A3/A4DC 时模拟双栏宽度，A4 时占满
const measureListStyle = computed(() =>
  curPaper.value.type === 'A3' || curPaper.value.type === 'A4DC' ? { width: '50%' } : { width: '100%' }
)
// A3/A4DC 时应用缩放
const a3PageStyle = computed(() =>
  curPaper.value.type === 'A3' || curPaper.value.type === 'A4DC'
    ? {
        transform: `scale(${a3Scale.value})`,
        transformOrigin: 'top left',
      }
    : {}
)
/**
 * 根据页码获取对应的二维码内容
 * @param pageIndex 页码索引（从 0 开始）
 * @returns 二维码内容，优先使用 qrcodeList 中对应页码的数据，否则使用默认值
 */
const getQrCodeByPage = computed(() => (pageIndex: number) => {
  if (!qrcodeList.value.length) {
    return info.value?.qrCodeContent || ''
  }
  const pageNo = String(pageIndex + 1)
  const found = qrcodeList.value.find(item => item.assignmentPage === pageNo)
  return found?.qrcodeContent || info.value?.qrCodeContent || ''
})

// 计算单道题图片的最大高度限制（毫米）
// 页面高度减去 header、padding、题号、底部预留空间等，确保单题不超出页面
const maxImageHeight = computed(() => {
  const pageHeight = curPaper.value.height || 296.6 // 页面总高度（毫米）
  const headerHeight = 35 // header 大约占用 35mm
  const topBottomPadding = 30 // 上下内边距共约 30mm
  const questionNumHeight = 10 // 题号行约 10mm
  const bottomReserve = 10 // 底部预留 10mm

  // 基础可用高度（对于应用题，答题区域会额外占用约30mm）
  const availableHeight = pageHeight - headerHeight - topBottomPadding - questionNumHeight - bottomReserve

  // 保守估计，使用70%的可用高度，最小50mm
  return Math.max(50, availableHeight * 0.7)
})

/**
 * 拖拽相关方法
 */
// 题目拖拽：分页场景下在单个块内移动题目顺序
const onQuestionMove = (block: TypeBlock, payload: MovePayload) => {
  emit('update:localData', handleQuestionMove(localData.value, block, payload))
}

// 兜底未分页场景下的拖拽：直接在对应题型内调换顺序
const onQuestionMoveFallback = (typeIndex: number, payload: MovePayload) => {
  emit('update:localData', handleQuestionMoveFallback(localData.value, typeIndex, payload))
}

/**
 * 定稿相关方法
 */
// 打开修改名称模态框
const finalize = () => {
  if (!info.value?.gradeId || !info.value?.subjectId) {
    message.warning('年级学科信息不完整，无法定稿')
    return
  }
  changeNameVisibe.value = true
}
// 获取新名称
const getNewName = async (name: string) => {
  if (!info.value) {
    return
  }
  isShowHeaderGrade.value = true
  info.value.assignmentName = name
  spinning.value = true
  closeChangeName()
  await getQrcodeList()
}

// 关闭修改名称模态框
const closeChangeName = () => {
  changeNameVisibe.value = false
}
// 获取二维码列表
const getQrcodeList = async () => {
  // 当前分页总页数：根据当前纸张类型取对应分页结果长度
  const totalPages =
    curPaper.value.type === 'A4'
      ? paginatedA4Pages.value.length || (localData.value.length ? 1 : 0)
      : paginatedA3Pages.value.length || (localData.value.length ? 1 : 0)

  const params = {
    assignmentId: info.value?.assignmentId || '',
    totalPages: String(totalPages),
  }
  // 重新渲染二维码
  qrcodeList.value = await fetchQrcodeList(params)
  // 获取JSON
  const json = await getJson()
  const answerInfo = generateAnswerJson(localData.value)
  // 生成文件（支持 PDF 或 JPG 格式）
  const isA3 = curPaper.value.type === 'A3' || curPaper.value.type === 'A4DC'
  const fileName = `${info.value?.assignmentId || 'document'}-${curPaper.value.type || 'A4'}`

  // 可以根据需要选择生成 PDF 或 JPG
  // 生成 JPG 图片
  // 图片调试代码不用删除
  // await generateAndDownloadImages(previewLeftRef.value, {
  //   fileName,
  //   paperWidth: curPaper.value.width,
  //   paperHeight: curPaper.value.height,
  //   isA3,
  //   format: 'jpeg',
  //   quality: 0.92,
  // })
  // 或者生成 PDF（取消下面的注释并注释掉上面的图片生成代码）
  const filePDF = await generatePDF(previewLeftRef.value, {
    fileName,
    paperWidth: curPaper.value.width,
    paperHeight: curPaper.value.height,
    isA3,
  })
  // console.log(filePDF)
  // 使用生成的文件（JPG 或 PDF）
  // const assignmentFile = images && images.length > 0 ? images[0] : null
  // 将 Blob 转换为 File 对象，添加 .pdf 扩展名
  const assignmentFile = filePDF ? new File([filePDF], `${fileName}.pdf`, { type: 'application/pdf' }) : null

  if (json && assignmentFile) {
    const JsonData = {
      assignmentId: info.value?.assignmentId || '',
      assignmentName: info.value?.assignmentName || '',
      gradeId: info.value?.gradeId || '',
      subjectId: info.value?.subjectId || '',
      pages: json,
      answerInfo: answerInfo,
    }
    console.log('\n\n---JsonData', JSON.stringify(JsonData))
    const params = {
      assignmentFile: assignmentFile,
      finalizedData: JSON.stringify(JsonData),
    }
    getGrading(params)
  }
}
// 定稿接口
const getGrading = async (params: finalizeExaminationRequest) => {
  const res = await finalizeExamination(params)
  if (!res) return
  spinning.value = false
  isFinalized.value = true
  message.success('定稿成功')
}
// 获取当前页面所有试题左上角坐标并拼接json串
const getJson = () => {
  const pages = curPaper.value.type === 'A4' ? paginatedA4Pages.value : paginatedA3Pages.value
  const isA3 = curPaper.value.type === 'A3' || curPaper.value.type === 'A4DC'
  return generateQuestionJson(previewLeftRef.value, pages, isA3, localData.value)
}

// 红点回显功能
const showRedDots = ref(false)
// const toggleRedDots = () => {
//   showRedDots.value = !showRedDots.value
//   if (showRedDots.value) {
//     const jsonData = getJson()
//     drawRedDotsForLeftTopPoints(previewLeftRef.value, jsonData)
//     message.success('已显示题目坐标红点标记')
//   } else {
//     clearRedDots(previewLeftRef.value)
//     message.success('已清除红点标记')
//   }
// }

/**
 * 下载
 */
const download = async () => {
  const params = {
    assignmentId: info.value?.assignmentId || '',
  }
  // 假设downloadExamination返回的是Promise<string>，即文件url
  const res = await downloadExamination(params)
  if (!res) return
  // 创建a标签下载
  const link = document.createElement('a')
  link.href = res
  // 使用作业名称作为文件名
  link.download = info.value?.assignmentName || 'downloaded-file'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 页面排版、高度计算相关方法
 */
// 等待题目图片加载
const waitForQuestionImages = async (root: HTMLElement) => {
  // 等待所有img标签加载完成（包括题目图片、二维码等）
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
  await Promise.all(
    imgs.map(
      img =>
        new Promise<void>(resolve => {
          if (img.complete) return resolve()
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
          // 设置超时，避免某些图片加载失败导致永久等待
          setTimeout(done, 5000)
        })
    )
  )
  // imageTextAnalyzer adjusts image dimensions asynchronously after load;
  // poll until the container's layout height stabilises before measuring.
  let prevH = root.getBoundingClientRect().height
  for (let stable = 0, i = 0; i < 50 && stable < 3; i++) {
    await new Promise(r => setTimeout(r, 100))
    const h = root.getBoundingClientRect().height
    if (Math.abs(h - prevH) < 1) stable++
    else {
      stable = 0
      prevH = h
    }
  }
}
// 测量可用高度与各题目高度（毫米）
const measureLayoutMm = async () => {
  const pageEl = measurePageRef.value
  if (!pageEl) return { baseHeightMm: 0, typeHeaderHeightsMm: [] as number[], questionHeightsMm: [] as number[][] }

  await nextTick()
  await waitForQuestionImages(pageEl)

  // 1. 获取页面总高度和内边距
  const pageRect = pageEl.getBoundingClientRect()
  const pageStyleComp = window.getComputedStyle(pageEl)
  const paddingTopPx = Number.parseFloat(pageStyleComp.paddingTop || '0') || 0
  const paddingBottomPx = Number.parseFloat(pageStyleComp.paddingBottom || '0') || 0

  // 2. 计算页面内部可用高度（去除 padding）
  const innerHeightPx = Math.max(0, pageRect.height - paddingTopPx - paddingBottomPx)

  // 3. 获取 header-box 的实际占用高度（包含 margin-bottom）
  const headerEl = pageEl.querySelector('.header-box') as HTMLElement | null
  let headerHeightPx = 0
  if (headerEl) {
    const headerRect = headerEl.getBoundingClientRect()
    const headerStyle = window.getComputedStyle(headerEl)
    const headerMarginBottomPx = Number.parseFloat(headerStyle.marginBottom || '0') || 0
    // header-box 的总占用高度 = 自身高度 + margin-bottom
    headerHeightPx = (headerRect?.height || 0) + headerMarginBottomPx
  }

  // 4. 计算题目可用的基础高度（毫米），底部预留 10mm 间距避免题目紧贴页面底边
  const bottomReserveMm = 10
  const baseHeightMm = Math.max(0, (innerHeightPx - headerHeightPx) / pxPerMm - bottomReserveMm)

  const typeBlocks = Array.from(pageEl.querySelectorAll('.type-block')) as HTMLElement[]
  const typeHeaderHeightsMm: number[] = []
  const questionHeightsMm: number[][] = []

  // 图片统一缩放比例（与 PreviewExamList.vue 中的 CSS transform: scale() 保持一致）

  typeBlocks.forEach(tb => {
    const headerEl = tb.querySelector('.question-type-header') as HTMLElement | null

    // 题型头高度：包含自身高度 + margin-bottom，再加上 type-block 的 margin-bottom，尽量贴合实际版式
    let headerTotalPx = 0
    if (headerEl) {
      const headerRect = headerEl.getBoundingClientRect()
      const headerStyle = window.getComputedStyle(headerEl)
      const headerMarginBottomPx = Number.parseFloat(headerStyle.marginBottom || '0') || 0
      headerTotalPx = (headerRect?.height || 0) + headerMarginBottomPx
    }
    const blockStyle = window.getComputedStyle(tb)
    const blockMarginBottomPx = Number.parseFloat(blockStyle.marginBottom || '0') || 0
    const headerHeightMm = Math.max(0, (headerTotalPx + blockMarginBottomPx) / pxPerMm)
    typeHeaderHeightsMm.push(headerHeightMm)

    // 每道题高度：题卡本身高度 + margin-bottom
    // 由于图片使用了 transform: scale()，需要考虑缩放后的实际占用高度
    const cards = Array.from(tb.querySelectorAll('.question-card')) as HTMLElement[]
    const heights = cards.map(el => {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      const marginBottomPx = Number.parseFloat(style.marginBottom || '0') || 0

      // 检查是否有 answer-area，如果有则确保其高度被正确计入
      const answerArea = el.querySelector('.answer-area') as HTMLElement | null
      let totalHeight = rect.height

      // 如果 answer-area 存在但其高度未被正确计入，需要单独累加
      if (answerArea) {
        const answerRect = answerArea.getBoundingClientRect()
        const answerStyle = window.getComputedStyle(answerArea)
        const answerMarginTop = Number.parseFloat(answerStyle.marginTop || '0') || 0
        const answerMarginBottom = Number.parseFloat(answerStyle.marginBottom || '0') || 0

        // 确保 answer-area 的高度和边距被完整计入
        // rect.height 应该已经包含了子元素，但为了保险，我们显式检查
        const answerTotalHeight = answerRect.height + answerMarginTop + answerMarginBottom

        // 如果 answer-area 的计算高度大于当前已测量的部分，使用更大的值
        const questionAreaRect = el.querySelector('.question-area')?.getBoundingClientRect()
        const questionAreaHeight = questionAreaRect ? questionAreaRect.height : 0

        // 总高度 = question-area 高度 + answer-area 总高度（包括其边距）
        if (questionAreaHeight > 0) {
          totalHeight = questionAreaHeight + answerTotalHeight
        }
      }

      return Math.max(0, (totalHeight + marginBottomPx) / pxPerMm)
    })
    questionHeightsMm.push(heights)
  })

  return { baseHeightMm, typeHeaderHeightsMm, questionHeightsMm }
}
// 计算 A3/A4DC 预览在左侧容器中的缩放比例，使其宽度不超过预览区域
const updateA3Scale = async () => {
  if (curPaper.value.type !== 'A3' && curPaper.value.type !== 'A4DC') {
    a3Scale.value = 1
    return
  }

  await nextTick()
  const container = previewLeftRef.value
  if (!container) return

  // 先恢复为未缩放状态，获取原始宽度
  a3Scale.value = 1
  await nextTick()

  const pageEl = container.querySelector('.page') as HTMLElement | null
  if (!pageEl) return

  const containerWidth = container.clientWidth
  const pageRect = pageEl.getBoundingClientRect()
  if (!containerWidth || !pageRect.width) return

  const scale = Math.min(1, containerWidth / pageRect.width)
  a3Scale.value = scale
}
// 初始化分页（A4/A3），按题型分组展示
const initPaginatedPages = async (showLoading = false) => {
  if (showLoading) layoutLoading.value = true
  isInitializing.value = true
  const data = localData.value || []
  const { baseHeightMm, typeHeaderHeightsMm, questionHeightsMm } = await measureLayoutMm()

  if (!baseHeightMm) {
    paginatedA4Pages.value = []
    paginatedA3Pages.value = []
    isInitializing.value = false
    if (showLoading) {
      await new Promise(r => setTimeout(r, 500))
      layoutLoading.value = false
    }
    return
  }

  // 记录每个题型是否已经展示过题型头，用于控制跨页时是否继续显示
  const typeHeaderShown: boolean[] = new Array(data.length).fill(false)

  // 计算每个题型的全局起始题号（累计前面所有题型的题目数量）
  const typeGlobalStartNo: number[] = []
  let globalQuestionNo = 1
  for (let i = 0; i < data.length; i++) {
    typeGlobalStartNo[i] = globalQuestionNo
    const typeItem = data[i]
    if (typeItem && Array.isArray(typeItem.children)) {
      globalQuestionNo += typeItem.children.length
    }
  }

  if (curPaper.value.type === 'A4') {
    const pages: TypeBlock[][] = []
    let currentPage: TypeBlock[] = []
    let remaining = baseHeightMm

    for (let t = 0; t < data.length; t++) {
      const typeItem = data[t]
      if (!typeItem || !Array.isArray(typeItem.children)) continue
      const typeName = typeItem?.questionTypeTagName || ''
      const headerH = typeHeaderHeightsMm[t] || 0
      const qHeights = questionHeightsMm[t] || []
      for (let q = 0; q < typeItem.children.length; q++) {
        const qH = qHeights[q] || 0
        // 超大题：整页单独展示（保证标题和题目在同一页）
        if (qH > baseHeightMm) {
          if (currentPage.length > 0) pages.push(currentPage)
          const qi = typeItem.children[q]
          if (qi) {
            const needHeader = !typeHeaderShown[t]
            pages.push([
              {
                typeIndex: t,
                typeName,
                startIndex: q,
                endIndex: q,
                children: [qi],
                showTypeHeader: needHeader,
                startNo: (typeGlobalStartNo[t] ?? 0) + q,
              },
            ])
            if (needHeader) typeHeaderShown[t] = true
          }
          currentPage = []
          remaining = baseHeightMm
          continue
        }

        const lastBlock = currentPage[currentPage.length - 1]
        const isStarted = !!lastBlock && lastBlock.typeIndex === t
        const needHeader = !isStarted && !typeHeaderShown[t]
        const headerCost = needHeader ? headerH : 0

        // 如果当前页放不下“标题 + 本题”，整体换到下一页，避免只渲染标题
        if (headerCost + qH > remaining) {
          if (currentPage.length > 0) pages.push(currentPage)
          currentPage = []
          remaining = baseHeightMm
        }

        // 换页后重新计算（此时要么是新页，要么当前页一定能放下）
        const lastAfter = currentPage[currentPage.length - 1]
        const isStartedAfter = !!lastAfter && lastAfter.typeIndex === t
        const needHeaderAfter = !isStartedAfter && !typeHeaderShown[t]
        const headerCostAfter = needHeaderAfter ? headerH : 0

        let block = currentPage[currentPage.length - 1]
        if (!isStartedAfter) {
          block = {
            typeIndex: t,
            typeName,
            startIndex: q,
            endIndex: q,
            children: [],
            showTypeHeader: needHeaderAfter,
            startNo: (typeGlobalStartNo[t] ?? 0) + q,
          }
          currentPage.push(block)
          if (needHeaderAfter) {
            remaining -= headerCostAfter
            typeHeaderShown[t] = true
          }
        }

        const qi = typeItem.children[q]
        if (block && qi) {
          block.children.push(qi)
          block.endIndex = q
          remaining -= qH
        }
      }
    }

    if (currentPage.length > 0) pages.push(currentPage)
    paginatedA4Pages.value = pages
    paginatedA3Pages.value = []
    a3Scale.value = 1
    isInitializing.value = false
    if (showLoading) {
      await new Promise(r => setTimeout(r, 500))
      layoutLoading.value = false
    }
    return
  }

  // A3/A4DC 双栏：按题号顺序优先放置左列，一旦右列开始使用则继续填充右列，保证题目顺序
  const baseHeightMmA3 = baseHeightMm + 8 // 为双栏预览预留一点容差，减少底部空白
  const pagesA3: { left: TypeBlock[]; right: TypeBlock[] }[] = []
  let left: TypeBlock[] = []
  let right: TypeBlock[] = []
  let leftRemain = baseHeightMmA3
  let rightRemain = baseHeightMmA3
  let isRightColumnStarted = false // 标记当前页右列是否已开始使用

  for (let t = 0; t < data.length; t++) {
    const typeItem = data[t]
    if (!typeItem || !Array.isArray(typeItem.children)) continue
    const typeName = typeItem?.questionTypeTagName || ''
    const headerH = typeHeaderHeightsMm[t] || 0
    const qHeights = questionHeightsMm[t] || []
    for (let q = 0; q < typeItem.children.length; q++) {
      const qH = qHeights[q] || 0

      const tryPlace = (target: 'left' | 'right') => {
        if (qH > baseHeightMmA3) {
          // 超大题：独占新页的左列（优先）
          if (left.length > 0 || right.length > 0) pagesA3.push({ left, right })
          const qi = typeItem.children[q]
          if (qi) {
            const hasShownHeader = typeHeaderShown[t]
            const needHeader = !hasShownHeader
            pagesA3.push({
              left: [
                {
                  typeIndex: t,
                  typeName,
                  startIndex: q,
                  endIndex: q,
                  children: [qi],
                  showTypeHeader: needHeader,
                  startNo: (typeGlobalStartNo[t] ?? 0) + q,
                },
              ],
              right: [],
            })
            if (needHeader) typeHeaderShown[t] = true
          } else {
            pagesA3.push({ left: [], right: [] })
          }
          left = []
          right = []
          leftRemain = baseHeightMmA3
          rightRemain = baseHeightMmA3
          isRightColumnStarted = false
          return true
        }

        const remain = target === 'left' ? leftRemain : rightRemain
        const blocks = target === 'left' ? left : right
        const last = blocks.length > 0 ? blocks[blocks.length - 1] : undefined
        const isStarted = !!last && last.typeIndex === t

        const needHeader = !isStarted && !typeHeaderShown[t]
        const headerCost = needHeader ? headerH : 0

        // 如果当前列放不下“标题 + 本题”，直接返回 false，
        // 由外层逻辑尝试另一列或换页，避免只渲染标题
        if (headerCost + qH > remain) return false

        let block = last
        if (!isStarted) {
          block = {
            typeIndex: t,
            typeName,
            startIndex: q,
            endIndex: q,
            children: [],
            showTypeHeader: needHeader,
            startNo: (typeGlobalStartNo[t] ?? 0) + q,
          }
          blocks.push(block)

          if (needHeader) {
            if (target === 'left') leftRemain -= headerCost
            else rightRemain -= headerCost
            typeHeaderShown[t] = true
          }
        }

        const qi = typeItem.children[q]
        if (block && qi) {
          block.children.push(qi)
          block.endIndex = q
          if (target === 'left') leftRemain -= qH
          else rightRemain -= qH

          // 如果放置到右列，标记右列已开始使用
          if (target === 'right') {
            isRightColumnStarted = true
          }
          return true
        }

        return false
      }

      // 按题号顺序填充：
      // - 如果右列还未使用，优先尝试左列，左列放不下才放右列
      // - 一旦右列开始使用，后续题目优先填充右列，右列放不下才换页
      // 这样确保视觉顺序与题号顺序一致
      if (!isRightColumnStarted) {
        // 右列未使用，优先左列
        if (!tryPlace('left')) {
          if (!tryPlace('right')) {
            // 两列都放不下，换到新页
            if (left.length > 0 || right.length > 0) pagesA3.push({ left, right })
            left = []
            right = []
            leftRemain = baseHeightMmA3
            rightRemain = baseHeightMmA3
            isRightColumnStarted = false
            q-- // 重新放置当前题到新页
          }
        }
      } else {
        // 右列已使用，优先右列
        if (!tryPlace('right')) {
          // 右列放不下，换到新页的左列
          if (left.length > 0 || right.length > 0) pagesA3.push({ left, right })
          left = []
          right = []
          leftRemain = baseHeightMmA3
          rightRemain = baseHeightMmA3
          isRightColumnStarted = false
          q-- // 重新放置当前题到新页
        }
      }
    }
  }

  if (left.length > 0 || right.length > 0) pagesA3.push({ left, right })
  paginatedA3Pages.value = pagesA3
  paginatedA4Pages.value = []
  await updateA3Scale()
  isInitializing.value = false
  if (showLoading) {
    await new Promise(r => setTimeout(r, 500))
    layoutLoading.value = false
  }
}

// 改变纸张
const changePaperType = (type: keyof paperTypes) => {
  if (isFinalized.value) return
  curPaper.value = {
    type: type,
    column: paperTypes[type].column,
    width: paperTypes[type].width,
    height: paperTypes[type].height,
  }
  initPaginatedPages(true)
}

// 关闭作业预览
const closePreview = () => {
  // 恢复初始状态
  paginatedA4Pages.value = []
  paginatedA3Pages.value = []
  curPaper.value = {
    type: 'A4',
    column: 1,
    width: 210,
    height: 296.6,
  }
  isFinalized.value = false
  changeNameVisibe.value = false
  isAnswer.value = false
  qrcodeList.value = []
  spinning.value = false
  layoutLoading.value = false
  a3Scale.value = 1
  isShowHeaderGrade.value = false

  emit('close', false)
}

// 父组件传值后，自动分页（仅在弹窗可见时才测量，display:none 下尺寸全为 0）
watch(
  () => [props.info, props.localData],
  async () => {
    if (!props.open) return
    await nextTick()
    await initPaginatedPages()
    // 如果红点显示状态是开启的，重新绘制红点
    // if (showRedDots.value) {
    //   await nextTick()
    //   const jsonData = getJson()
    //   drawRedDotsForLeftTopPoints(previewLeftRef.value, jsonData)
    // }
  },
  { deep: true }
)

// 弹窗打开时，容器从 display:none 变为可见，此时需要重新测量并分页
watch(
  () => props.open,
  async open => {
    if (!open) {
      // 关闭弹窗时清除红点
      showRedDots.value = false
      clearRedDots(previewLeftRef.value)
      return
    }
    await nextTick()
    await initPaginatedPages(true)
  }
)
</script>

<style scoped lang="less">
.preview-cover-bg {
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.55);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1005;
  .preview-cover {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 24px;
  }

  .preview-modal {
    width: 1280px;
    max-width: calc(100vw - 48px);
    height: calc(100vh - 48px);
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
  }
}

.preview-header {
  height: 64px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef0f3;
  .preview-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #111827;
  }

  .preview-title-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;

    .zh {
      font-size: 16px;
      font-weight: 700;
    }
  }

  .preview-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #eef0f3;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
}

.preview-body {
  flex: 1;
  min-height: 0;
  display: flex;
  .preview-left {
    flex: 1;
    min-width: 0;
    background: #f6f7f9;
    padding: 24px 0;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;

    .layout-loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(246, 247, 249, 0.92);
      z-index: 20;
    }

    .page {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      margin: 0 auto 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      padding: 25px 20px 20px;
      position: relative;

      .page-points {
        position: absolute;
        width: 20px;
        height: 10px;
        background: #000;
      }
      .left-top-points {
        top: 25px;
        left: 20px;
      }
      .right-top-points {
        top: 25px;
        right: 20px;
      }
      .left-bottom-points {
        bottom: 20px;
        left: 20px;
      }
      .right-bottom-points {
        bottom: 20px;
        right: 20px;
      }
    }

    .header-box {
      height: 160px;
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

    .question-type-header {
      padding: 10px 10px;
      margin-bottom: 10px;
      border-radius: 8px;
      background: #e5e6e7;
      color: #000;
      font-size: 16px;
      font-weight: 700;
    }

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
  }
}

.measure-container {
  position: absolute;
  left: -99999px;
  top: -99999px;
  visibility: hidden;
}

:deep(.ant-spin) {
  font-size: 20px;
  z-index: 1010;
}
</style>
