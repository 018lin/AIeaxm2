import { qrcodeListExamination } from '@/api/examination/index'
import type { qrcodeExaminationResponse } from '@/api/examination/type'
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import type { MovePayload, TypeBlock } from '@/types/questionBasket'
import html2canvas from 'html2canvas'

// 像素到毫米的转换比例（200 DPI）
// const pxPerMm = 200 / 25.4

/**
 * 计算四个锚点坐标（左上、右上、左下、右下）
 * 与 leftTopPoint 的计算方式保持一致：相对于 pageRect 的偏移量，然后应用 toFinalPixels 转换
 * @param pageRect 页面元素的 getBoundingClientRect()
 * @returns 四个锚点坐标
 */
export const calculateAnchorPoints = (pageRect: { width: number; height: number }) => {
  // 生成图片时使用的缩放比例（200 DPI / 96 DPI）
  const scale = 200 / 96

  // 输入是页面显示的像素值，输出是生成图片的像素值（显示像素 × scale）
  const toFinalPixels = (pixelValue: number) => Number((pixelValue * scale).toFixed(4))

  // 锚点尺寸：固定值，用于识别定位点
  const anchorSize = 20 // w 和 h
  const anchorHeight = 10

  // 距离边界的边距
  const marginX = 20
  const marginY = 25
  const marginBottomY = 20

  // 左上角：使用 toFinalPixels 转换
  const topLeft = {
    x: toFinalPixels(marginX),
    y: toFinalPixels(marginY),
    w: toFinalPixels(anchorSize),
    h: toFinalPixels(anchorHeight),
  }

  // 右上角：基于页面宽度计算
  const topRight = {
    x: toFinalPixels(pageRect.width - marginX - anchorSize),
    y: toFinalPixels(marginY),
    w: toFinalPixels(anchorSize),
    h: toFinalPixels(anchorHeight),
  }

  // 左下角：基于页面高度计算
  const bottomLeft = {
    x: toFinalPixels(marginX),
    y: toFinalPixels(pageRect.height - marginBottomY - anchorHeight),
    w: toFinalPixels(anchorSize),
    h: toFinalPixels(anchorHeight),
  }

  // 右下角：基于页面宽度和高度计算
  const bottomRight = {
    x: toFinalPixels(pageRect.width - marginX - anchorSize),
    y: toFinalPixels(pageRect.height - marginBottomY - anchorHeight),
    w: toFinalPixels(anchorSize),
    h: toFinalPixels(anchorHeight),
  }

  return {
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
  } as {
    topLeft: { x: number; y: number; w: number; h: number }
    topRight: { x: number; y: number; w: number; h: number }
    bottomLeft: { x: number; y: number; w: number; h: number }
    bottomRight: { x: number; y: number; w: number; h: number }
  }
}

/**
 * 拖拽相关方法
 */

// 题目拖拽：分页场景下在单个块内移动题目顺序
export const handleQuestionMove = (
  localData: QuestionBasketRsponse[],
  block: TypeBlock,
  payload: MovePayload
): QuestionBasketRsponse[] => {
  const { from, to } = payload as unknown as { from: number; to: number }
  const typeIndex = block.typeIndex
  const typeItem = localData[typeIndex]
  if (!typeItem || !Array.isArray(typeItem.children)) return localData

  const globalOldIndex = block.startIndex + from
  const globalNewIndex = block.startIndex + to
  const [movedItem] = typeItem.children.splice(globalOldIndex, 1)
  if (movedItem) {
    typeItem.children.splice(globalNewIndex, 0, movedItem)
  }

  return [...localData]
}

// 兜底未分页场景下的拖拽：直接在对应题型内调换顺序
export const handleQuestionMoveFallback = (
  localData: QuestionBasketRsponse[],
  typeIndex: number,
  payload: MovePayload
): QuestionBasketRsponse[] => {
  const { from, to } = payload as unknown as { from: number; to: number }
  const typeItem = localData[typeIndex]
  if (!typeItem || !Array.isArray(typeItem.children)) return localData

  const [movedItem] = typeItem.children.splice(from, 1)
  if (movedItem) {
    typeItem.children.splice(to, 0, movedItem)
  }

  return [...localData]
}

/**
 * 定稿相关方法
 */

// 从 question-card 元素中提取题目信息
const extractQuestionInfo = (
  card: Element,
  pageRect: DOMRect,
  globalQuestionNumber: number,
  localData: QuestionBasketRsponse[],
  paddingLeft: number = 0,
  paddingTop: number = 0
) => {
  console.log(paddingLeft, paddingTop)
  // const cardRect = (card as HTMLElement).getBoundingClientRect()
  const img = card.querySelector('.question-img') as HTMLImageElement
  const imgRect = img?.getBoundingClientRect()

  // 获取 questionId
  const questionId = card.getAttribute('data-question-id') || ''

  // 从 localData 中查找对应题目的 assignmentItemId、questionTypeTagId 和 coordinates 数据
  let assignmentItemId = ''
  let questionTypeTagId = ''
  let coordinatesData: any[] = []
  for (const typeGroup of localData) {
    const foundQuestion = typeGroup.children.find(q => q.questionId === questionId)
    if (foundQuestion) {
      // 获取 assignmentItemId
      assignmentItemId = (foundQuestion as any).assignmentItemId || ''
      // 获取题型的 questionTypeTagId
      questionTypeTagId = typeGroup.questionTypeTagId || ''
      // 获取 coordinates 数据
      if ((foundQuestion as any).coordinates?.data) {
        coordinatesData = (foundQuestion as any).coordinates.data
      }
      break
    }
  }

  const showWidth = Number((imgRect ? imgRect.width : 0).toFixed(4))
  const showHeight = Number((imgRect ? imgRect.height : 0).toFixed(4))
  const originalWidth = Number((img?.naturalWidth || 0).toFixed(4))
  const originalHeight = Number((img?.naturalHeight || 0).toFixed(4))

  // 计算宽高比的缩放比例：(展示宽高比) / (原始宽高比)
  let zoomRatio = 1.0
  if (showHeight > 0 && originalWidth > 0 && originalHeight > 0) {
    const showAspectRatio = showWidth / showHeight
    const originalAspectRatio = originalWidth / originalHeight
    zoomRatio = Number((showAspectRatio / originalAspectRatio).toFixed(4))
  }

  // 生成图片时使用的缩放比例（200 DPI / 96 DPI ≈ 2.0833）
  const scale = 200 / 96

  // 输入是页面显示的像素值，输出是生成图片的像素值（显示像素 × scale）
  const toFinalPixels = (pixelValue: number) => Number((pixelValue * scale).toFixed(4))

  // 用于存储答题区域高度
  let additionalHeight = 0
  // 用于存储最终的原始高度（可能包含答题区域）
  let finalOriginalHeight = originalHeight

  // 如果 localData 中没有，则尝试从 DOM 的 answer-area 元素提取
  // if (questionTypeTagId == '25' || questionTypeTagId == '26') {
  //   const answerArea = card.querySelector('.answer-area') as HTMLElement | null
  //   if (answerArea && imgRect) {
  //     const answerRect = answerArea.getBoundingClientRect()
  //     // 保存答题区域的高度
  //     additionalHeight = answerRect.height

  //     // 计算显示图片尺寸到显示图片增加答题区域后的总高度的缩放比例
  //     const displayTotalHeight = imgRect.height + additionalHeight
  //     const displayToTotalScale = displayTotalHeight / imgRect.height // 显示图片扩展到总高度的比例

  //     // 原始图片高度按同比例增加
  //     const originalTotalHeight = originalHeight * displayToTotalScale
  //     finalOriginalHeight = originalTotalHeight

  //     // 计算显示尺寸到扩展后的原始尺寸的缩放比例
  //     const scaleX = originalWidth > 0 ? originalWidth / imgRect.width : 1
  //     const scaleY = originalTotalHeight > 0 ? originalTotalHeight / displayTotalHeight : 1

  //     // 计算相对于图片的坐标，并转换为原始图片尺寸的坐标
  //     const getOriginalCoordX = (displayX: number) => (displayX - imgRect.left) * scaleX
  //     const getOriginalCoordY = (displayY: number) => (displayY - imgRect.top) * scaleY

  //     coordinatesData = [
  //       {
  //         area_id: '1',
  //         pos_list: [
  //           [
  //             { x: getOriginalCoordX(imgRect.left), y: getOriginalCoordY(answerRect.top) },
  //             { x: originalWidth, y: getOriginalCoordY(answerRect.top) },
  //             { x: originalWidth, y: getOriginalCoordY(answerRect.bottom) },
  //             { x: getOriginalCoordX(imgRect.left), y: getOriginalCoordY(answerRect.bottom) },
  //           ],
  //         ],
  //       },
  //     ]
  //   }
  // }

  // 只使用图片的位置和尺寸（question-img元素）
  if (!imgRect) {
    throw new Error('Question image not found')
  }

  return {
    questionId,
    assignmentItemId,
    questionTypeTagId,
    questionNumber: globalQuestionNumber,
    // 左上角坐标（已转换为最终生成图片的像素坐标）
    // 相对于 pageRect 左上角的坐标
    x: toFinalPixels(imgRect.left - pageRect.left),
    y: toFinalPixels(imgRect.top - pageRect.top),
    width: toFinalPixels(imgRect.width),
    height: toFinalPixels(imgRect.height + additionalHeight),
    zoomRatio,
    showWidth,
    showHeight,
    originalWidth,
    originalHeight: finalOriginalHeight,
    coordinates: coordinatesData.length > 0 ? { data: coordinatesData } : undefined,
  }
}

// 获取题目坐标信息
export const getQuestionCoordinates = (
  container: HTMLElement,
  paginatedPages: TypeBlock[][] | { left: TypeBlock[]; right: TypeBlock[] }[],
  isA3: boolean,
  localData: QuestionBasketRsponse[]
): Array<{
  pageNumber: number
  bigImgWidth: number
  bigImgHeight: number
  types: Array<{
    typeName: string
    typeNumber: number
    questionTypeTagId: string
    questions: Array<{
      questionId: string
      assignmentItemId: string
      questionTypeTagId: string
      questionNumber: number
      x: number
      y: number
      width: number
      height: number
      zoomRatio: number
      showWidth: number
      showHeight: number
      originalWidth: number
      originalHeight: number
      coordinates?: { data: any[] }
    }>
  }>
}> => {
  void paginatedPages
  // 全局题号计数器，跨页面和题型连续
  let globalQuestionNumber = 1
  // 大题序号计数器（1、2、3...）
  let typeCounter = 0
  // 记录已出现的题型及其大题序号
  const typeNumberMap = new Map<string, number>()
  // 记录每个题型内部的题号（每个大题从1开始）
  const typeQuestionCounterMap = new Map<string, number>()
  // 记录上一页最后一个有效的题型名称
  let lastValidTypeName = ''

  const pages = container.querySelectorAll('.page:not([style*="visibility: hidden"])')
  const result: Array<{
    pageNumber: number
    bigImgWidth: number
    bigImgHeight: number
    types: Array<{
      typeName: string
      typeNumber: number
      questionTypeTagId: string
      questions: Array<{
        questionId: string
        assignmentItemId: string
        questionTypeTagId: string
        questionNumber: number
        x: number
        y: number
        width: number
        height: number
        zoomRatio: number
        showWidth: number
        showHeight: number
        originalWidth: number
        originalHeight: number
        coordinates?: { data: any[] }
      }>
    }>
  }> = []

  // 生成图片时使用的缩放比例（200 DPI / 96 DPI ≈ 2.0833）
  // A4 尺寸：210mm × 296.6mm = 8.27in × 11.69in
  // 最终像素：1654 × 2338 (200 DPI)
  const scale = 200 / 96

  // 临时移除 A3 缩放，以获取真实的未缩放坐标
  const originalStyles: Array<{ transform: string; transformOrigin: string }> = []
  if (isA3) {
    pages.forEach(pageEl => {
      const el = pageEl as HTMLElement
      originalStyles.push({
        transform: el.style.transform,
        transformOrigin: el.style.transformOrigin,
      })
      el.style.transform = 'none'
      el.style.transformOrigin = 'initial'
    })
  }

  pages.forEach((pageEl, pageIndex) => {
    const pageRect = pageEl.getBoundingClientRect()
    const pageStyle = window.getComputedStyle(pageEl)
    const paddingLeft = Number.parseFloat(pageStyle.paddingLeft || '0') || 0
    const paddingTop = Number.parseFloat(pageStyle.paddingTop || '0') || 0

    const pageData: {
      pageNumber: number
      bigImgWidth: number
      bigImgHeight: number
      types: Array<{
        typeName: string
        typeNumber: number
        questionTypeTagId: string
        questions: Array<{
          questionId: string
          assignmentItemId: string
          questionTypeTagId: string
          questionNumber: number
          x: number
          y: number
          width: number
          height: number
          zoomRatio: number
          showWidth: number
          showHeight: number
          originalWidth: number
          originalHeight: number
          coordinates?: { data: any[] }
        }>
      }>
    } = {
      pageNumber: pageIndex + 1,
      bigImgWidth: Number((pageRect.width * scale).toFixed(4)),
      bigImgHeight: Number((pageRect.height * scale).toFixed(4)),
      types: [],
    }

    // 如果是 A3，需要处理左右两栏
    if (isA3) {
      const leftEl = pageEl.querySelector('.left')
      const rightEl = pageEl.querySelector('.right')

      // 处理左栏：查找所有包含题目的 div 块
      if (leftEl) {
        const leftBlocks = leftEl.querySelectorAll('div[style*="margin-bottom"]') as NodeListOf<HTMLElement>
        leftBlocks.forEach(block => {
          // 尝试获取题型名称（如果存在 header）
          const typeHeader = block.querySelector('.question-type-header') as HTMLElement | null
          let typeName = typeHeader?.textContent?.trim() || ''

          // 如果题型名称为空或未分类，使用上一页最后一个有效题型
          if (!typeName || typeName === '未分类') {
            typeName = lastValidTypeName || '未分类'
          } else {
            lastValidTypeName = typeName
          }

          const questionCards = block.querySelectorAll('.question-card')
          if (questionCards.length === 0) return

          const questions: Array<{
            questionId: string
            assignmentItemId: string
            questionTypeTagId: string
            questionNumber: number
            x: number
            y: number
            width: number
            height: number
            zoomRatio: number
            showWidth: number
            showHeight: number
            originalWidth: number
            originalHeight: number
            coordinates?: { data: any[] }
          }> = []

          // 获取或分配大题序号
          let typeNumber = typeNumberMap.get(typeName)
          if (typeNumber === undefined) {
            typeCounter++
            typeNumber = typeCounter
            typeNumberMap.set(typeName, typeNumber)
            typeQuestionCounterMap.set(typeName, 0)
          }

          questionCards.forEach((card, cardIndex) => {
            // 获取当前题型的题号计数器并递增
            const currentCount = (typeQuestionCounterMap.get(typeName) || 0) + 1
            typeQuestionCounterMap.set(typeName, currentCount)

            // 判断是否是该块的第一题（cardIndex === 0 且存在题型标题）
            questions.push(extractQuestionInfo(card, pageRect, currentCount, localData, paddingLeft, paddingTop))
            globalQuestionNumber++
          })

          if (questions.length > 0) {
            // 检查是否已存在相同题型，如果存在则合并
            const existingType = pageData.types.find(t => t.typeName === typeName)
            if (existingType) {
              existingType.questions.push(...questions)
            } else {
              // 从第一个 question 中获取 questionTypeTagId（同一题型下所有题目的 questionTypeTagId 相同）
              const questionTypeTagId = questions[0]?.questionTypeTagId || ''
              pageData.types.push({ typeName, typeNumber, questionTypeTagId, questions })
            }
          }
        })
      }

      // 处理右栏：查找所有包含题目的 div 块
      if (rightEl) {
        const rightBlocks = rightEl.querySelectorAll('div[style*="margin-bottom"]') as NodeListOf<HTMLElement>
        rightBlocks.forEach(block => {
          // 尝试获取题型名称（如果存在 header）
          const typeHeader = block.querySelector('.question-type-header') as HTMLElement | null
          let typeName = typeHeader?.textContent?.trim() || ''

          // 如果题型名称为空或未分类，使用上一页最后一个有效题型
          if (!typeName || typeName === '未分类') {
            typeName = lastValidTypeName || '未分类'
          } else {
            lastValidTypeName = typeName
          }

          const questionCards = block.querySelectorAll('.question-card')
          if (questionCards.length === 0) return

          const questions: Array<{
            questionId: string
            assignmentItemId: string
            questionTypeTagId: string
            questionNumber: number
            x: number
            y: number
            width: number
            height: number
            zoomRatio: number
            showWidth: number
            showHeight: number
            originalWidth: number
            originalHeight: number
            coordinates?: { data: any[] }
          }> = []

          // 获取或分配大题序号
          let typeNumber = typeNumberMap.get(typeName)
          if (typeNumber === undefined) {
            typeCounter++
            typeNumber = typeCounter
            typeNumberMap.set(typeName, typeNumber)
            typeQuestionCounterMap.set(typeName, 0)
          }

          questionCards.forEach((card, cardIndex) => {
            // 获取当前题型的题号计数器并递增
            const currentCount = (typeQuestionCounterMap.get(typeName) || 0) + 1
            typeQuestionCounterMap.set(typeName, currentCount)

            // 判断是否是该块的第一题（cardIndex === 0 且存在题型标题）
            questions.push(extractQuestionInfo(card, pageRect, currentCount, localData, paddingLeft, paddingTop))
            globalQuestionNumber++
          })

          if (questions.length > 0) {
            // 检查是否已存在相同题型，如果存在则合并
            const existingType = pageData.types.find(t => t.typeName === typeName)
            if (existingType) {
              existingType.questions.push(...questions)
            } else {
              // 从第一个 question 中获取 questionTypeTagId（同一题型下所有题目的 questionTypeTagId 相同）
              const questionTypeTagId = questions[0]?.questionTypeTagId || ''
              pageData.types.push({ typeName, typeNumber, questionTypeTagId, questions })
            }
          }
        })
      }
    } else {
      // A4 单栏处理：查找所有包含题目的 div 块
      const blocks = pageEl.querySelectorAll('div[style*="margin-bottom"]') as NodeListOf<HTMLElement>
      blocks.forEach(block => {
        // 尝试获取题型名称（如果存在 header）
        const typeHeader = block.querySelector('.question-type-header') as HTMLElement | null
        let typeName = typeHeader?.textContent?.trim() || ''

        // 如果题型名称为空或未分类，使用上一页最后一个有效题型
        if (!typeName || typeName === '未分类') {
          typeName = lastValidTypeName || '未分类'
        } else {
          lastValidTypeName = typeName
        }

        const questionCards = block.querySelectorAll('.question-card')
        if (questionCards.length === 0) return

        const questions: Array<{
          questionId: string
          assignmentItemId: string
          questionTypeTagId: string
          questionNumber: number
          x: number
          y: number
          width: number
          height: number
          zoomRatio: number
          showWidth: number
          showHeight: number
          originalWidth: number
          originalHeight: number
          coordinates?: { data: any[] }
        }> = []

        // 获取或分配大题序号
        let typeNumber = typeNumberMap.get(typeName)
        if (typeNumber === undefined) {
          typeCounter++
          typeNumber = typeCounter
          typeNumberMap.set(typeName, typeNumber)
          typeQuestionCounterMap.set(typeName, 0)
        }

        questionCards.forEach((card, cardIndex) => {
          // 获取当前题型的题号计数器并递增
          const currentCount = (typeQuestionCounterMap.get(typeName) || 0) + 1
          typeQuestionCounterMap.set(typeName, currentCount)

          // 判断是否是该块的第一题（cardIndex === 0 且存在题型标题）
          questions.push(extractQuestionInfo(card, pageRect, currentCount, localData, paddingLeft, paddingTop))
          globalQuestionNumber++
        })

        if (questions.length > 0) {
          // 检查是否已存在相同题型，如果存在则合并
          const existingType = pageData.types.find(t => t.typeName === typeName)
          if (existingType) {
            existingType.questions.push(...questions)
          } else {
            // 从第一个 question 中获取 questionTypeTagId（同一题型下所有题目的 questionTypeTagId 相同）
            const questionTypeTagId = questions[0]?.questionTypeTagId || ''
            pageData.types.push({ typeName, typeNumber, questionTypeTagId, questions })
          }
        }
      })
    }

    // 只添加包含题目的页面
    if (pageData.types.length > 0) {
      result.push(pageData)
    }
  })

  // 恢复 A3 缩放
  if (isA3) {
    pages.forEach((pageEl, index) => {
      const el = pageEl as HTMLElement
      const style = originalStyles[index]
      if (style) {
        el.style.transform = style.transform
        el.style.transformOrigin = style.transformOrigin
      }
    })
  }

  return result
}

// 获取二维码列表
export const fetchQrcodeList = async (params: {
  assignmentId: string
  totalPages: string
}): Promise<qrcodeExaminationResponse[]> => {
  const res = await qrcodeListExamination(params)
  const list = (Array.isArray(res) ? res : res ? [res] : []) as qrcodeExaminationResponse[]
  return list
}

// 获取当前页面所有试题左上角坐标并拼接json串
export const generateQuestionJson = (
  container: HTMLElement | null,
  paginatedPages: TypeBlock[][] | { left: TypeBlock[]; right: TypeBlock[] }[],
  isA3: boolean,
  localData: QuestionBasketRsponse[]
) => {
  if (!container) return []

  // 获取坐标数据
  const coordinates = getQuestionCoordinates(container, paginatedPages, isA3, localData)

  // 获取所有页面元素，用于计算 pageRect
  const pages = container.querySelectorAll('.page:not([style*="visibility: hidden"])')

  // 全局连续题号计数器
  let globalQuestionNumber = 1

  // 转换为目标格式
  const result = coordinates.map((page, pageIndex) => {
    // 获取当前页面的 DOM 元素和 pageRect
    const pageEl = pages[pageIndex] as HTMLElement | undefined
    const pageRect = pageEl ? pageEl.getBoundingClientRect() : { width: 0, height: 0 }

    // 根据 pageRect 计算四个锚点坐标（与 leftTopPoint 计算方式一致）
    const anchorPoints = calculateAnchorPoints(pageRect)

    return {
      pageNumber: pageIndex + 1,
      bigImgWidth: page.bigImgWidth,
      bigImgHeight: page.bigImgHeight,
      anchorPoints,
      questionsLevel1: page.types.map(type => ({
        questionType: type.typeName,
        questionTypeTagId: type.questionTypeTagId,
        questionNumber: String(type.typeNumber),
        questionsLevel2: type.questions.map(q => ({
          questionId: q.questionId,
          assignmentItemId: q.assignmentItemId,
          questionNumber: String(globalQuestionNumber++), // 使用全局连续编号
          // x, y, width, height 已经是最终像素坐标，直接使用
          leftTopPoint: [q.x, q.y],
          height: q.height,
          width: q.width,
          originalWidth: q.originalWidth,
          originalHeight: q.originalHeight,
          answerAreas: q.coordinates?.data || [],
        })),
      })),
    }
  })

  return result
}

// 获取当前页面所有试题答案并拼接JSON串
export const generateAnswerJson = (
  localData: QuestionBasketRsponse[]
): Record<string, { questions_number: string; answer_area: string[]; analysis: string }> => {
  const answer: Record<string, { questions_number: string; answer_area: string[]; analysis: string }> = {}

  // 题号计数器
  let questionNumber = 1

  // 遍历所有题型
  localData.forEach(typeGroup => {
    // 遍历该题型下的所有题目
    typeGroup.children?.forEach(question => {
      const questionNumStr = String(questionNumber)

      // 尝试从多个可能的字段中获取解析内容
      const analysisInfo = (question as any).answerInfo || {}
      // 构建答案对象
      answer[questionNumStr] = {
        questions_number: questionNumStr,
        analysis: analysisInfo?.answerAnalysis || '',
        answer_area: analysisInfo?.correctAnswer || [],
      }

      questionNumber++
    })
  })

  return answer
}

/**
 * PDF生成相关方法
 */
// 毫米转换为点（PDF 单位）
const mmToPt = (mm: number) => (mm * 72) / 25.4

type PdfPageImage = { jpg: Uint8Array; width: number; height: number }

// 将 Data URL 转换为字节数组
const dataUrlToBytes = (dataUrl: string) => {
  const comma = dataUrl.indexOf(',')
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// 从 JPEG 图片构建 PDF
const buildPdfFromJpegs = (pages: PdfPageImage[], pageWidthPt: number, pageHeightPt: number) => {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  let len = 0
  const offsets: number[] = [0]

  const add = (u8: Uint8Array) => {
    chunks.push(u8)
    len += u8.length
  }
  const addStr = (s: string) => add(enc.encode(s))

  const startObj = (n: number) => {
    offsets[n] = len
    addStr(`${n} 0 obj\n`)
  }
  const endObj = () => addStr('endobj\n')

  const totalObjects = 2 + pages.length * 3

  addStr('%PDF-1.3\n')

  startObj(1)
  addStr('<< /Type /Catalog /Pages 2 0 R >>\n')
  endObj()

  startObj(2)
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')
  addStr(`<< /Type /Pages /Kids [ ${kids} ] /Count ${pages.length} >>\n`)
  endObj()

  pages.forEach((p, i) => {
    const pageObj = 3 + i * 3
    const imgObj = 4 + i * 3
    const contentObj = 5 + i * 3

    startObj(pageObj)
    addStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(
        2
      )}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentObj} 0 R >>\n`
    )
    endObj()

    startObj(imgObj)
    addStr(
      `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`
    )
    add(p.jpg)
    addStr('\nendstream\n')
    endObj()

    const content = `q\n${pageWidthPt.toFixed(2)} 0 0 ${pageHeightPt.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`
    const contentBytes = enc.encode(content)

    startObj(contentObj)
    addStr(`<< /Length ${contentBytes.length} >>\nstream\n`)
    add(contentBytes)
    addStr('endstream\n')
    endObj()
  })

  const xrefOffset = len
  addStr(`xref\n0 ${totalObjects + 1}\n`)
  addStr('0000000000 65535 f \n')
  for (let i = 1; i <= totalObjects; i++) {
    const off = offsets[i] ?? 0
    addStr(`${String(off).padStart(10, '0')} 00000 n \n`)
  }
  addStr(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
}

// 等待所有图片加载完成
const waitForImages = async (root: HTMLElement) => {
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
  await Promise.all(
    imgs.map(
      img =>
        new Promise<void>(resolve => {
          if (img.complete) return resolve()
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        })
    )
  )
}

// 生成 PDF 文件并下载
export const generatePDF = async (
  container: HTMLElement | null,
  options: {
    fileName?: string
    paperWidth?: number // 单位：毫米
    paperHeight?: number // 单位：毫米
    isA3?: boolean
  } = {}
): Promise<Blob | null> => {
  if (!container) {
    console.error('容器元素不存在')
    return null
  }

  try {
    // 获取所有可见的页面元素
    const pageEls = Array.from(container.querySelectorAll('.page:not([style*="visibility: hidden"])')) as HTMLElement[]

    if (!pageEls.length) {
      console.error('没有可导出的页面')
      return null
    }

    // 使用 200 DPI 缩放比例（A4: 1654×2338 像素）
    const scale = 200 / 96
    const pages: PdfPageImage[] = []

    // 临时移除 A3 缩放（如果有）
    const originalStyles: Array<{ transform: string; transformOrigin: string }> = []
    if (options.isA3) {
      pageEls.forEach(pageEl => {
        originalStyles.push({
          transform: pageEl.style.transform,
          transformOrigin: pageEl.style.transformOrigin,
        })
        pageEl.style.transform = 'none'
        pageEl.style.transformOrigin = 'initial'
      })
    }

    // 将每个页面转换为 canvas 并生成 JPEG
    for (const pageEl of pageEls) {
      await waitForImages(pageEl)

      // 克隆页面并替换图片为 blob URLs 以避免 CORS 问题
      const clonedPage = pageEl.cloneNode(true) as HTMLElement

      // 保留原始页面的尺寸和样式
      const originalRect = pageEl.getBoundingClientRect()
      const originalComputedStyle = window.getComputedStyle(pageEl)

      // 复制所有关键样式属性
      clonedPage.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: ${originalRect.width}px;
        height: ${originalRect.height}px;
        padding: ${originalComputedStyle.padding};
        margin: 0;
        box-sizing: ${originalComputedStyle.boxSizing};
        background: ${originalComputedStyle.background};
        font-family: ${originalComputedStyle.fontFamily};
        font-size: ${originalComputedStyle.fontSize};
        line-height: ${originalComputedStyle.lineHeight};
        color: ${originalComputedStyle.color};
      `

      document.body.appendChild(clonedPage)

      // 递归复制所有子元素的computed styles，确保边距和高度被正确保留
      const copyComputedStyles = (source: HTMLElement, target: HTMLElement) => {
        const sourceStyle = window.getComputedStyle(source)
        const criticalProps = [
          'margin',
          'margin-top',
          'margin-bottom',
          'margin-left',
          'margin-right',
          'padding',
          'padding-top',
          'padding-bottom',
          'padding-left',
          'padding-right',
          'height',
          'min-height',
          'max-height',
          'width',
          'min-width',
          'max-width',
          'line-height',
          'font-size',
          'font-family',
          'font-weight',
          'font-style',
          'color',
          'border',
          'border-style',
          'border-width',
          'border-color',
          'border-top',
          'border-top-style',
          'border-top-width',
          'border-top-color',
          'border-bottom',
          'border-bottom-style',
          'border-bottom-width',
          'border-bottom-color',
          'border-left',
          'border-left-style',
          'border-left-width',
          'border-left-color',
          'border-right',
          'border-right-style',
          'border-right-width',
          'border-right-color',
          'border-radius',
          'display',
          'position',
          'top',
          'bottom',
          'left',
          'right',
          'transform',
          'transform-origin',
          'background',
          'background-color',
          'background-image',
          'background-size',
          'background-position',
          'background-repeat',
          'gap',
          'flex',
          'flex-direction',
          'align-items',
          'justify-content',
        ]

        criticalProps.forEach(prop => {
          const value = sourceStyle.getPropertyValue(prop)
          if (value) {
            target.style.setProperty(prop, value)
          }
        })

        // 递归处理子元素
        const sourceChildren = Array.from(source.children) as HTMLElement[]
        const targetChildren = Array.from(target.children) as HTMLElement[]
        sourceChildren.forEach((child, index) => {
          if (targetChildren[index]) {
            copyComputedStyles(child, targetChildren[index])
          }
        })
      }

      copyComputedStyles(pageEl, clonedPage)

      // 确保页码元素样式正确
      const pageIndexEl = clonedPage.querySelector('.page-index') as HTMLElement
      if (pageIndexEl) {
        pageIndexEl.style.position = 'absolute'
        pageIndexEl.style.bottom = '12px'
        pageIndexEl.style.left = '50%'
        pageIndexEl.style.transform = 'translateX(-50%)'
        pageIndexEl.style.textAlign = 'center'
        pageIndexEl.style.whiteSpace = 'nowrap'
      }

      try {
        // 替换图片为 blob URLs
        const cleanup = await replaceImagesWithBlobUrls(clonedPage)
        await waitForImages(clonedPage)

        const canvas = await html2canvas(clonedPage, {
          backgroundColor: '#ffffff',
          scale,
          useCORS: false,
          allowTaint: false,
          logging: false,
          imageTimeout: 0,
          foreignObjectRendering: false,
        })

        const jpgBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.92))
        pages.push({ jpg: jpgBytes, width: canvas.width, height: canvas.height })

        // 清理 blob URLs
        cleanup()
      } finally {
        // 移除克隆的页面
        document.body.removeChild(clonedPage)
      }
    }

    // 恢复原始样式
    if (options.isA3) {
      pageEls.forEach((pageEl, index) => {
        const style = originalStyles[index]
        if (style) {
          pageEl.style.transform = style.transform
          pageEl.style.transformOrigin = style.transformOrigin
        }
      })
    }

    // 构建 PDF
    const pageWidthPt = mmToPt(options.paperWidth || 210)
    const pageHeightPt = mmToPt(options.paperHeight || 296.6)
    const pdfBlob = buildPdfFromJpegs(pages, pageWidthPt, pageHeightPt)
    // downloadPdfBlob(pdfBlob, options.fileName || 'exam.pdf')
    return pdfBlob
  } catch (error) {
    console.error('生成 PDF 失败:', error)
    return null
  }
}
// ------------------------------- 图片生成相关方法 ------------------------------

// 生成图片文件（每页一张图片）
export const generateImg = async (
  container: HTMLElement | null,
  options: {
    fileName?: string
    paperWidth?: number // 单位：毫米
    paperHeight?: number // 单位：毫米
    isA3?: boolean
    format?: 'png' | 'jpeg' // 图片格式
    quality?: number // JPEG 质量（0-1）
  } = {}
): Promise<File[] | null> => {
  if (!container) {
    console.error('容器元素不存在')
    return null
  }

  try {
    // 获取所有可见的页面元素
    const pageEls = Array.from(container.querySelectorAll('.page:not([style*="visibility: hidden"])')) as HTMLElement[]

    if (!pageEls.length) {
      console.error('没有可导出的页面')
      return null
    }

    // 使用 200 DPI 缩放比例（A4: 1654×2338 像素）
    const scale = 200 / 96
    const format = options.format || 'jpeg'
    const quality = options.quality ?? 0.92
    const imageFiles: File[] = []

    // 临时移除 A3 缩放（如果有）
    const originalStyles: Array<{ transform: string; transformOrigin: string }> = []
    if (options.isA3) {
      pageEls.forEach(pageEl => {
        originalStyles.push({
          transform: pageEl.style.transform,
          transformOrigin: pageEl.style.transformOrigin,
        })
        pageEl.style.transform = 'none'
        pageEl.style.transformOrigin = 'initial'
      })
    }

    // 将每个页面转换为 canvas 并生成图片
    for (let i = 0; i < pageEls.length; i++) {
      const pageEl = pageEls[i]
      if (!pageEl) continue

      await waitForImages(pageEl)

      // 克隆页面并替换图片为 blob URLs 以避免 CORS 问题
      const clonedPage = pageEl.cloneNode(true) as HTMLElement

      // 保留原始页面的尺寸和样式
      const originalRect = pageEl.getBoundingClientRect()
      const originalComputedStyle = window.getComputedStyle(pageEl)

      // 复制所有关键样式属性
      clonedPage.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: ${originalRect.width}px;
        height: ${originalRect.height}px;
        padding: ${originalComputedStyle.padding};
        margin: 0;
        box-sizing: ${originalComputedStyle.boxSizing};
        background: ${originalComputedStyle.background};
        font-family: ${originalComputedStyle.fontFamily};
        font-size: ${originalComputedStyle.fontSize};
        line-height: ${originalComputedStyle.lineHeight};
        color: ${originalComputedStyle.color};
      `

      document.body.appendChild(clonedPage)

      // 递归复制所有子元素的computed styles，确保边距和高度被正确保留
      const copyComputedStyles = (source: HTMLElement, target: HTMLElement) => {
        const sourceStyle = window.getComputedStyle(source)
        const criticalProps = [
          'margin',
          'margin-top',
          'margin-bottom',
          'margin-left',
          'margin-right',
          'padding',
          'padding-top',
          'padding-bottom',
          'padding-left',
          'padding-right',
          'height',
          'min-height',
          'max-height',
          'width',
          'min-width',
          'max-width',
          'line-height',
          'font-size',
          'font-family',
          'font-weight',
          'font-style',
          'color',
          'border',
          'border-style',
          'border-width',
          'border-color',
          'border-top',
          'border-top-style',
          'border-top-width',
          'border-top-color',
          'border-bottom',
          'border-bottom-style',
          'border-bottom-width',
          'border-bottom-color',
          'border-left',
          'border-left-style',
          'border-left-width',
          'border-left-color',
          'border-right',
          'border-right-style',
          'border-right-width',
          'border-right-color',
          'border-radius',
          'display',
          'position',
          'top',
          'bottom',
          'left',
          'right',
          'transform',
          'transform-origin',
          'background',
          'background-color',
          'background-image',
          'background-size',
          'background-position',
          'background-repeat',
          'gap',
          'flex',
          'flex-direction',
          'align-items',
          'justify-content',
        ]

        criticalProps.forEach(prop => {
          const value = sourceStyle.getPropertyValue(prop)
          if (value) {
            target.style.setProperty(prop, value)
          }
        })

        // 递归处理子元素
        const sourceChildren = Array.from(source.children) as HTMLElement[]
        const targetChildren = Array.from(target.children) as HTMLElement[]
        sourceChildren.forEach((child, index) => {
          if (targetChildren[index]) {
            copyComputedStyles(child, targetChildren[index])
          }
        })
      }

      copyComputedStyles(pageEl, clonedPage)

      // 确保页码元素样式正确
      const pageIndexEl = clonedPage.querySelector('.page-index') as HTMLElement
      if (pageIndexEl) {
        pageIndexEl.style.position = 'absolute'
        pageIndexEl.style.bottom = '12px'
        pageIndexEl.style.left = '50%'
        pageIndexEl.style.transform = 'translateX(-50%)'
        pageIndexEl.style.textAlign = 'center'
        pageIndexEl.style.whiteSpace = 'nowrap'
      }

      try {
        // 替换图片为 blob URLs
        const cleanup = await replaceImagesWithBlobUrls(clonedPage)
        await waitForImages(clonedPage)

        const canvas = await html2canvas(clonedPage, {
          backgroundColor: '#ffffff',
          scale,
          useCORS: false,
          allowTaint: false,
          logging: false,
          imageTimeout: 0,
          foreignObjectRendering: false,
        })

        // 转换为 Blob
        const blob = await new Promise<Blob | null>(resolve => {
          if (format === 'png') {
            canvas.toBlob(resolve, 'image/png')
          } else {
            canvas.toBlob(resolve, 'image/jpeg', quality)
          }
        })

        if (blob) {
          // 创建文件名：fileName-页码.扩展名
          const baseFileName = options.fileName || 'page'
          const extension = format === 'png' ? 'png' : 'jpg'
          const fileName = `${baseFileName}-${i + 1}.${extension}`

          // 转换为 File 对象
          const file = new File([blob], fileName, { type: blob.type })
          imageFiles.push(file)
        }

        // 清理 blob URLs
        cleanup()
      } finally {
        // 移除克隆的页面
        document.body.removeChild(clonedPage)
      }
    }

    // 恢复原始样式
    if (options.isA3) {
      pageEls.forEach((pageEl, index) => {
        const style = originalStyles[index]
        if (style) {
          pageEl.style.transform = style.transform
          pageEl.style.transformOrigin = style.transformOrigin
        }
      })
    }

    // 依次下载每张图片（添加延迟避免浏览器阻止多个下载）
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      if (file) {
        downloadFile(file)
        // 每次下载间隔 100ms，避免浏览器阻止
        if (i < imageFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    return imageFiles
  } catch (error) {
    console.error('生成图片失败:', error)
    return null
  }
}

// 下载单个文件
const downloadFile = (file: File) => {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
// -----------------------------载 PDF Blob 下载相关方法 --------------------------- //
// 下载 PDF Blob
const downloadPdfBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 生成并下载 PDF
export const generateAndDownloadPDF = async (
  container: HTMLElement | null,
  options: {
    fileName?: string
    paperWidth?: number
    paperHeight?: number
    isA3?: boolean
  } = {}
): Promise<boolean> => {
  try {
    const pdfBlob = await generatePDF(container, options)

    if (!pdfBlob) {
      console.error('PDF 生成失败')
      return false
    }

    const fileName = `${options.fileName || 'document'}.pdf`
    downloadPdfBlob(pdfBlob, fileName)
    return true
  } catch (error) {
    console.error('下载 PDF 失败:', error)
    return false
  }
}
// -----------------------------载 PDF Blob 下载相关方法 --------------------------- //
// 生成图片并下载
export const generateAndDownloadImages = async (
  container: HTMLElement | null,
  options: {
    fileName?: string
    paperWidth?: number
    paperHeight?: number
    isA3?: boolean
    format?: 'png' | 'jpeg'
    quality?: number
  } = {}
): Promise<boolean> => {
  try {
    const images = await generateImg(container, options)

    if (!images || images.length === 0) {
      console.error('没有生成图片')
      return false
    }

    // 依次下载每张图片（添加延迟避免浏览器阻止多个下载）
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      if (image) {
        downloadFile(image)
        // 每次下载间隔 100ms，避免浏览器阻止
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    console.log(`已下载 ${images.length} 张图片`)
    return true
  } catch (error) {
    console.error('下载图片失败:', error)
    return false
  }
}
// -------------------------------- 红点回显相关方法 ---------------------------- //

// 在页面上绘制红点标记leftTopPoint坐标
export const drawRedDotsForLeftTopPoints = (
  container: HTMLElement | null,
  jsonData: Array<{
    pageNumber: number
    bigImgWidth: number
    bigImgHeight: number
    questionsLevel1: Array<{
      questionType: string
      questionTypeTagId: string
      questionNumber: string
      questionsLevel2: Array<{
        questionId: string
        assignmentItemId: string
        questionNumber: string
        leftTopPoint: [number, number]
        height: number
        width: number
        originalWidth: number
        originalHeight: number
        answerAreas: any[]
      }>
    }>
  }>
): void => {
  if (!container) {
    console.error('容器元素不存在')
    return
  }

  // 清除旧的红点标记
  const oldDots = container.querySelectorAll('.red-dot-marker')
  oldDots.forEach(dot => dot.remove())

  const pages = container.querySelectorAll('.page:not([style*="visibility: hidden"])')
  if (pages.length !== jsonData.length) {
    console.warn(`页面数量 (${pages.length}) 与 JSON 数据数量 (${jsonData.length}) 不匹配`)
  }

  // 生成图片时使用的缩放比例（200 DPI / 96 DPI ≈ 2.0833）
  const scale = 200 / 96

  jsonData.forEach((pageData, pageIndex) => {
    const pageEl = pages[pageIndex] as HTMLElement
    if (!pageEl) return

    pageData.questionsLevel1.forEach(type => {
      type.questionsLevel2.forEach(question => {
        const [x, y] = question.leftTopPoint

        // 将生成图片的像素坐标转换回页面显示坐标
        // leftTopPoint 存储的是生成图片时的像素坐标（已经乘以了 scale）
        // 需要除以 scale 转回页面显示坐标
        // 坐标是相对于 pageEl 左上角的（因为红点使用 position: absolute 定位，添加到 pageEl 内）
        const displayX = x / scale
        const displayY = y / scale

        // 创建红点元素
        const dot = document.createElement('div')
        dot.className = 'red-dot-marker'
        dot.style.cssText = `
          position: absolute;
          left: ${displayX}px;
          top: ${displayY}px;
          width: 8px;
          height: 8px;
          background-color: red;
          border-radius: 50%;
          z-index: 9999;
          pointer-events: none;
          box-shadow: 0 0 4px rgba(255, 0, 0, 0.8);
          transform: translate(-50%, -50%);
        `

        // 添加题号标签（可选）
        const label = document.createElement('div')
        label.style.cssText = `
          position: absolute;
          left: 10px;
          top: -2px;
          font-size: 10px;
          color: red;
          font-weight: bold;
          white-space: nowrap;
          pointer-events: none;
          text-shadow: 0 0 2px white, 0 0 2px white, 0 0 2px white;
          background: rgba(255, 255, 255, 0.8);
          padding: 1px 3px;
          border-radius: 2px;
        `
        label.textContent = `Q${question.questionNumber}`
        dot.appendChild(label)

        pageEl.appendChild(dot)
      })
    })
  })

  const totalQuestions = jsonData.reduce(
    (sum, page) => sum + page.questionsLevel1.reduce((s, t) => s + t.questionsLevel2.length, 0),
    0
  )
  console.log(`已绘制 ${totalQuestions} 个红点标记`)
  console.log('坐标信息:', jsonData)
}

// 清除页面上的红点标记
export const clearRedDots = (container: HTMLElement | null): void => {
  if (!container) return
  const dots = container.querySelectorAll('.red-dot-marker')
  dots.forEach(dot => dot.remove())
  console.log(`已清除 ${dots.length} 个红点标记`)
}

// -------------------------------- 图片处理相关方法 ---------------------------- //

// 加载图片并转换为 Blob URL
const loadImageAsBlob = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error(`加载图片失败: ${url}`, error)
    return url // 降级：返回原始 URL
  }
}

// 替换容器中所有图片为 Blob URLs（解决 CORS 问题）
const replaceImagesWithBlobUrls = async (container: HTMLElement): Promise<() => void> => {
  const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
  const blobUrls: string[] = []
  const originalSrcs: string[] = []

  for (const img of images) {
    const originalSrc = img.src
    if (originalSrc && !originalSrc.startsWith('blob:') && !originalSrc.startsWith('data:')) {
      originalSrcs.push(originalSrc)
      const blobUrl = await loadImageAsBlob(originalSrc)
      blobUrls.push(blobUrl)
      img.src = blobUrl
    }
  }

  // 返回清理函数
  return () => {
    images.forEach((img, index) => {
      if (originalSrcs[index]) {
        img.src = originalSrcs[index]
      }
    })
    blobUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
  }
}
