<template>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup lang="ts">
import { Canvas, FabricImage, Rect, Textbox } from 'fabric'
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  questionInfo: any
}>()

const emit = defineEmits<{ colorTool: [] }>()

// 试卷状态
const canvasRef = ref<HTMLCanvasElement>()
const fabricCanvas = ref<Canvas>()
const canvasInitialized = ref(false)

// 存储渲染的对象
const answerAreaRects = ref<any[]>([])

onMounted(async () => {
  await nextTick()
  initCanvas()
})

// 监听图片地址变化，重新加载整个画布
watch(
  () => [props.questionInfo?.coordinates, props.questionInfo?.questionsAttachment],
  async (newVal, oldVal) => {
    if (newVal && newVal !== oldVal && canvasInitialized.value) {
      // 清空画布
      fabricCanvas.value?.clear()
      answerAreaRects.value = []
      // 重新加载图片和答题区域
      await loadImage()
      await renderAnswerAreas()
    }
  }
)

// 初始化画布
async function initCanvas() {
  if (!canvasRef.value) {
    console.error('Canvas ref not found')
    return
  }

  const container = canvasRef.value.parentElement!
  const width = container.clientWidth
  const height = container.clientHeight

  console.log('Canvas container size:', { width, height })

  if (width === 0 || height === 0) {
    console.error('Container has zero size! Retrying...')
    // 重试
    setTimeout(() => initCanvas(), 300)
    return
  }

  fabricCanvas.value = new Canvas(canvasRef.value, {
    width,
    height,
    selection: true,
    preserveObjectStacking: true,
  })

  console.log('Canvas created successfully:', { width, height })
  canvasInitialized.value = true

  await loadImage()
  await renderAnswerAreas()
}

// 加载图片
async function loadImage() {
  return new Promise(resolve => {
    FabricImage.fromURL(props.questionInfo.questionsAttachment).then(img => {
      if (!fabricCanvas.value) return

      // 图片宽度固定为300px，高度根据比例自适应
      const fixedWidth = props.questionInfo.layoutFormat === 'A4-2' ? 300 : 600
      const scale = fixedWidth / img.width!
      const scaledHeight = img.height! * scale

      // 直接根据图片高度设置canvas高度
      fabricCanvas.value.setDimensions({
        width: fabricCanvas.value.width!,
        height: scaledHeight,
      })

      // 图片定位在左上角
      img.set({
        left: 0, // 左上角X坐标
        top: 0, // 左上角Y坐标
        scaleX: scale,
        scaleY: scale,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })

      fabricCanvas.value.add(img)
      fabricCanvas.value.sendObjectToBack(img)
      fabricCanvas.value.renderAll()

      resolve(true)
    })
  })
}

// // 清除答题区域
// function clearAnswerAreas() {
//   answerAreaRects.value.forEach(obj => {
//     fabricCanvas.value?.remove(obj)
//   })
//   answerAreaRects.value = []
//   fabricCanvas.value?.renderAll()
// }

// 渲染答题区域
async function renderAnswerAreas() {
  const bgImage = fabricCanvas.value?.getObjects()[0] as any
  const scale = bgImage?.scaleX || 1
  const offsetX = bgImage?.left || 0
  const offsetY = bgImage?.top || 0

  const { coordinates } = props.questionInfo
  console.log('\n\n---Rendering answer areas with coordinates:', coordinates)
  const data = coordinates?.data || []

  if (!data || data.length === 0) {
    console.log('No answer areas to render')
    fabricCanvas.value?.renderAll()
    return
  }

  // 遍历每个答题区域
  data.forEach((area: any, index: number) => {
    const { pos_list, area_id } = area
    if (!pos_list || pos_list.length === 0) return

    // 获取第一个位置列表（通常是矩形的四个角点）
    const points = pos_list[0]
    if (!points || points.length < 4) return

    console.log(`Rendering area ${area_id} with pos_list:`, pos_list)

    // 从四个点计算矩形的位置和尺寸
    // points[0] 是左上角，points[2] 是右下角
    const x1 = points[0].x * scale + offsetX
    const y1 = points[0].y * scale + offsetY
    const x2 = points[2].x * scale + offsetX
    const y2 = points[2].y * scale + offsetY

    const width = Math.abs(x2 - x1)
    const height = Math.abs(y2 - y1)
    const left = Math.min(x1, x2)
    const top = Math.min(y1, y2)

    // 创建矩形
    const rect = new Rect({
      left: left + width / 2,
      top: top + height / 2,
      width,
      height,
      fill: 'rgba(255, 165, 0, 0.1)',
      stroke: '#ec7a2e',
      strokeWidth: 2,
      selectable: false, // 禁止选中和拖动
      evented: false, // 禁止交互
      hasControls: false, // 隐藏控制点
      hasBorders: false, // 隐藏边框
      lockMovementX: true, // 锁定X方向移动
      lockMovementY: true, // 锁定Y方向移动
      lockScalingX: true, // 锁定X方向缩放
      lockScalingY: true, // 锁定Y方向缩放
      lockRotation: true, // 锁定旋转
    })

    fabricCanvas.value?.add(rect)
    answerAreaRects.value.push(rect)

    // 在左上角添加标签（空1, 空2, 空3...）
    const label = `空${index + 1}`
    const text = new Textbox(label, {
      left: left + 5,
      top: top + 1,
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#059669',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
    })

    fabricCanvas.value?.add(text)
    answerAreaRects.value.push(text)
  })

  fabricCanvas.value?.renderAll()
}
</script>
