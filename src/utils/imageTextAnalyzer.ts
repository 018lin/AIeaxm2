/**
 * 图像文字分析工具
 * 用于识别图片中文字的大小/行高，并计算适配目标字号的建议宽度
 * @param imgSrc 图片地址
 * @param targetFontSize 目标文字大小 (px)，默认 16
 * @returns Promise<number | null> 建议宽度 (px) 或 null (如果无法识别或出错)
 */
export function getRecommendedImageWidth(
  imgSrc: string,
  targetFontSize: number = 16,
  maxWidth?: number,
  maxHeight?: number
): Promise<number | null> {
  return getImageTextAnalysis(imgSrc, targetFontSize, maxWidth, undefined, maxHeight).then(result =>
    result ? result.recommendedWidth : null
  )
}

/**
 * 从 canvas 中提取像素数据用于分析
 * 优先使用已加载的 HTMLImageElement（免去二次请求），
 * 若 canvas 因跨域被污染则回退到 fetch → Blob URL 重新加载
 */
async function extractImageData(
  imgOrSrc: HTMLImageElement | string
): Promise<{ imageData: ImageData; naturalWidth: number; naturalHeight: number } | null> {
  // 尝试直接用已加载的 HTMLImageElement 绘制 canvas
  if (imgOrSrc instanceof HTMLImageElement) {
    const el = imgOrSrc
    if (el.naturalWidth < 50 || el.naturalHeight < 20) return null

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = el.naturalWidth
    canvas.height = el.naturalHeight
    ctx.drawImage(el, 0, 0)

    try {
      const imageData = ctx.getImageData(0, 0, el.naturalWidth, el.naturalHeight)
      return { imageData, naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight }
    } catch {
      // canvas 被跨域污染，回退到 fetch
      return extractImageDataFromUrl(el.src)
    }
  }

  return extractImageDataFromUrl(imgOrSrc)
}

/**
 * 通过 URL 获取像素数据：先 fetch 为 Blob URL（始终同源），再绘制到 canvas
 */
function extractImageDataFromUrl(
  imgSrc: string
): Promise<{ imageData: ImageData; naturalWidth: number; naturalHeight: number } | null> {
  return new Promise(async resolve => {
    let imgUrl = imgSrc
    let blobUrl: string | null = null

    if (!imgSrc.startsWith('blob:') && !imgSrc.startsWith('data:')) {
      try {
        const response = await fetch(imgSrc)
        const blob = await response.blob()
        blobUrl = URL.createObjectURL(blob)
        imgUrl = blobUrl
      } catch {
        // fetch 失败，回退到直接加载
      }
    }

    const img = new Image()
    img.crossOrigin = 'Anonymous'

    const cleanup = () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }

    img.onload = () => {
      try {
        const { naturalWidth, naturalHeight } = img
        if (naturalWidth < 50 || naturalHeight < 20) {
          cleanup()
          resolve(null)
          return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          resolve(null)
          return
        }

        canvas.width = naturalWidth
        canvas.height = naturalHeight
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, naturalWidth, naturalHeight)
        cleanup()
        resolve({ imageData, naturalWidth, naturalHeight })
      } catch {
        cleanup()
        resolve(null)
      }
    }

    img.onerror = () => {
      cleanup()
      resolve(null)
    }

    img.src = imgUrl
  })
}

/**
 * 完整的图像文字分析工具
 * 支持传入已加载的 HTMLImageElement（优先）或图片 URL
 * 识别图片中文字/数字的尺寸（行高），计算缩放比例，使显示字号无限接近 targetFontSize（如 16px）
 * 返回推荐宽度、行高和顶部留白等信息
 */
export async function getImageTextAnalysis(
  imgOrSrc: HTMLImageElement | string,
  targetFontSize: number = 16,
  maxWidth?: number,
  scaleRange?: { min: number; max: number },
  maxHeight?: number
): Promise<{ recommendedWidth: number; lineHeight: number; topPadding: number } | null> {
  const extracted = await extractImageData(imgOrSrc)
  if (!extracted) return null

  const { imageData, naturalWidth, naturalHeight } = extracted
  const data = imageData.data
  const rowBlackPixels = new Int32Array(naturalHeight)

  // 排除左侧题号区域（17、18、(1)、12.、11.、10. 等），仅对正文区域做水平投影
  const leftSkipRatio = 0.2
  const contentStartX = Math.floor(naturalWidth * leftSkipRatio)
  const contentWidth = naturalWidth - contentStartX

  for (let y = 0; y < naturalHeight; y++) {
    let blackCount = 0
    for (let x = contentStartX; x < naturalWidth; x += 2) {
      const idx = (y * naturalWidth + x) * 4
      const r = data[idx] ?? 0
      const g = data[idx + 1] ?? 0
      const b = data[idx + 2] ?? 0
      const a = data[idx + 3] ?? 255

      if (a < 50) continue

      const brightness = r * 0.299 + g * 0.587 + b * 0.114
      if (brightness < 200) {
        blackCount++
      }
    }
    rowBlackPixels[y] = blackCount
  }

  // 分析投影，提取行高和顶部留白；阈值按正文区域宽度计算
  const lineThreshold = Math.max(2, contentWidth * 0.005)
  const halfThreshold = lineThreshold / 2

  const lineHeights: number[] = []
  let currentHeight = 0
  let gapCount = 0
  let inLine = false
  let topPadding = 0
  let firstLineFound = false
  const minGap = 3

  for (let y = 0; y < naturalHeight; y++) {
    const isDark = rowBlackPixels[y]! > halfThreshold

    if (isDark) {
      if (!firstLineFound) {
        firstLineFound = true
        topPadding = y
      }

      if (inLine) {
        if (gapCount > 0) {
          currentHeight += gapCount
          gapCount = 0
        }
        currentHeight++
      } else {
        inLine = true
        currentHeight = 1 + (gapCount > 0 ? gapCount : 0)
        gapCount = 0
      }
    } else {
      if (inLine) {
        gapCount++
        if (gapCount >= minGap) {
          if (currentHeight > 4) {
            lineHeights.push(currentHeight)
          }
          inLine = false
          currentHeight = 0
          gapCount = 0
        }
      } else {
        gapCount++
      }
    }
  }
  if (inLine && currentHeight > 4) {
    lineHeights.push(currentHeight)
  }

  // console.log('[imageTextAnalyzer] 原始行高检测', {
  //   lineHeights: [...lineHeights],
  //   naturalHeight,
  // })

  // 分数修正：分子、分数线、分母应分开，不要把分子分母合并为同一字符计算行高
  // 用细暗带划分（分数线、下划线 <=5px 视为分隔符），拆分过高行
  const refinedHeights: number[] = []
  const thinBandMax = 5
  let y = 0
  while (y < naturalHeight) {
    while (y < naturalHeight && rowBlackPixels[y]! <= halfThreshold) y++
    if (y >= naturalHeight) break
    const darkStart = y
    while (y < naturalHeight && rowBlackPixels[y]! > halfThreshold) y++
    const bandHeight = y - darkStart
    if (bandHeight > thinBandMax) {
      refinedHeights.push(bandHeight)
    }
    y++
  }
  const sortedForMedian = [...lineHeights].sort((a, b) => a - b)
  const rawMed = sortedForMedian[Math.floor(sortedForMedian.length / 2)] ?? 20
  const hasOversizedRows = lineHeights.some(h => h > rawMed * 1.6)
  const refinedMedian = refinedHeights.length
    ? ([...refinedHeights].sort((a, b) => a - b)[Math.floor(refinedHeights.length / 2)] ?? rawMed)
    : 0

  // 当存在过高行，或 refined 拆分后中位数更小（表明成功分离分数结构）时，使用 refined
  if (hasOversizedRows || (refinedHeights.length >= 2 && refinedMedian > 0 && refinedMedian < rawMed * 0.9)) {
    if (refinedHeights.length >= 2) {
      lineHeights.length = 0
      lineHeights.push(...refinedHeights)
      // console.log('[imageTextAnalyzer] 使用refined处理分数', {
      //   refinedLineHeights: [...refinedHeights],
      // })
    }
  }

  if (lineHeights.length === 0) return null

  // console.log('[imageTextAnalyzer] refined处理后最终lineHeights', { lineHeights: [...lineHeights] })

  // 过滤异常高的"行"：图表/网格区域中竖线在每行都产生暗色像素，
  // 导致整个图表区域被识别为一个超高"文字行"（如 250px），
  // 缩放比例 12/250 ≈ 0.05 → 图片被极度缩小。
  // 阈值：相对 40%（处理大图中的图表区域）与绝对 80px（避免误过滤小图中的正常文字）取较大值
  const maxTextLineHeight = Math.max(naturalHeight * 0.4, 80)
  const textLineHeights = lineHeights.filter(h => h <= maxTextLineHeight)

  // 过滤后无文字行 → 可能是图表/图形，也可能是数学题（行数少但每行高度大）
  const effectiveLineHeights = textLineHeights.length > 0 ? textLineHeights : lineHeights

  if (textLineHeights.length === 0) {
    // 如果原始检测到的行数很少（≤3），可能是数学题的算式，保留原始行高
    if (lineHeights.length > 0 && lineHeights.length <= 3) {
      // console.log('[imageTextAnalyzer] 过滤后无文字行，但原始行数较少，可能是数学题算式', {
      //   maxTextLineHeight,
      //   originalLineCount: lineHeights.length,
      //   filteredCount: textLineHeights.length,
      //   lineHeights,
      // })
      // 使用原始行高继续处理（已设置 effectiveLineHeights = lineHeights）
    } else {
      // console.log('[imageTextAnalyzer] 过滤后无文字行，图片可能主要是图表/图形', {
      //   maxTextLineHeight,
      //   originalLineCount: lineHeights.length,
      //   filteredCount: textLineHeights.length,
      // })
      return null
    }
  }

  // 使用中位数作为基准进行过滤（比使用最大值更鲁棒，不易被单个异常值影响）
  const sortedAll = [...effectiveLineHeights].sort((a, b) => a - b)
  const rawMedian = sortedAll[Math.floor(sortedAll.length / 2)]!

  // 保留中位数 40%~200% 范围内的行高，过滤掉异常值（下划线、噪点、超大标题等）
  // 但同时保留所有小于中位数的值（因为它们更可能是真实文字）
  let validHeights = effectiveLineHeights.filter(h => h <= rawMedian || (h >= rawMedian * 0.4 && h <= rawMedian * 2.0))
  if (validHeights.length === 0) {
    validHeights = effectiveLineHeights
  }

  // CSS font-size: 16px 对应约 12px 的实际文字像素高度（Cap Height）
  const targetPixelHeight = targetFontSize * 0.75

  // 使用最小行高作为文字高度估算（最能代表真实文字大小）
  validHeights.sort((a, b) => a - b)

  // 过滤掉过小的噪点（分数线、下划线等，通常<20px）
  const filteredHeights = validHeights.filter(h => h >= 20)
  const heightsToUse = filteredHeights.length > 0 ? filteredHeights : validHeights

  // 使用过滤后的最小行高
  let estimatedTextHeight = heightsToUse[0] ?? targetPixelHeight

  // console.log('[imageTextAnalyzer] 检测结果', {
  //   naturalWidth,
  //   naturalHeight,
  //   finalLineCount: lineHeights.length,
  //   lineHeights: [...lineHeights],
  //   filteredHeights: [...filteredHeights],
  //   estimatedTextHeightBeforeAdjust: estimatedTextHeight,
  //   targetPixelHeight,
  // })

  // 统一调整策略：使用相同的调整系数，确保所有题目的字体大小一致
  estimatedTextHeight = estimatedTextHeight * 0.6

  // console.log('[imageTextAnalyzer] 统一调整', {
  //   adjustedTextHeight: estimatedTextHeight,
  // })

  let scale = targetPixelHeight / estimatedTextHeight
  const minScale = scaleRange?.min ?? 0.1
  const maxScale = scaleRange?.max ?? 3.0
  scale = Math.max(minScale, Math.min(scale, maxScale))

  // 如果提供了最大高度限制，需要确保缩放后的图片高度不超过限制
  if (typeof maxHeight === 'number' && maxHeight > 0) {
    const scaledHeight = naturalHeight * scale
    if (scaledHeight > maxHeight) {
      // 根据高度重新计算缩放比例
      scale = maxHeight / naturalHeight
      // 确保缩放比例在允许范围内
      scale = Math.max(minScale, Math.min(scale, maxScale))
    }
  }

  let recommendedWidth = naturalWidth * scale
  if (typeof maxWidth === 'number' && maxWidth > 0) {
    recommendedWidth = Math.min(recommendedWidth, maxWidth)
  }

  const scaledLineHeight = estimatedTextHeight * scale
  const scaledTopPaddingRaw = topPadding * scale
  const scaledTopPadding = scaledTopPaddingRaw > 5 ? scaledTopPaddingRaw : 0

  return {
    recommendedWidth,
    lineHeight: scaledLineHeight,
    topPadding: scaledTopPadding,
  }
}
