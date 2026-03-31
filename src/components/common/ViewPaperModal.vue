<template>
  <div v-if="open" class="view-paper-modal-mask">
    <div class="view-paper-modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <Icon icon="solar:document-text-bold" class="header-icon" />
          <span class="header-title">查看试卷</span>
        </div>
        <div class="header-right">
          <div class="close-btn" @click="handleClose">
            <Icon icon="material-symbols:close-rounded" width="24" />
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="modal-toolbar">
        <div class="tool-left">
          <a-button class="primary-btn-light" @click="handleDownload">
            <span>下载试卷</span> <Icon icon="material-symbols-light:download" width="20"
          /></a-button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="modal-content-bg" :class="{ 'mode-pdf': fileType === 'pdf', 'mode-word': fileType === 'docx' }">
        <div
          v-if="!errorText && (loading || (fileType === 'pdf' && !pdfLoaded) || (fileType === 'docx' && !wordLoaded))"
          class="content-loading-mask"
        >
          <div class="content-loading-card">
            <div class="loading-circle">
              <div class="loading-circle-inner">
                <Icon icon="solar:document-pen-linear" width="28" />
              </div>
            </div>
            <div class="loading-title">正在生成试卷预览...</div>
            <div class="loading-subtitle">正在优化渲染效果，请稍候</div>
            <div class="loading-tip">
              <Icon icon="solar:bulb-linear" class="tip-icon" width="18" />
              <span v-if="fileType === 'pdf'">小贴士：pdf 文件正在生成预览，请稍后</span>
              <span v-else-if="fileType === 'docx'">小贴士：Word 文件正在转换为预览，请稍后</span>
              <span v-else>小贴士：文件正在生成预览，请稍后</span>
            </div>
          </div>
        </div>

        <div
          class="paper-sheet"
          :class="{
            'is-pdf': fileType === 'pdf',
            'is-image': fileType === 'image',
            'is-word': fileType === 'docx',
          }"
          :style="sheetStyle"
        >
          <div v-if="errorText" class="paper-empty">
            <div class="error-box">
              <Icon icon="solar:danger-circle-linear" width="32" />
              <span>{{ errorText }}</span>
            </div>
          </div>

          <template v-else-if="fileType === 'pdf'">
            <iframe
              v-if="rawObjectUrl"
              :key="pdfDisplaySrc"
              class="paper-frame pdf-frame"
              :src="pdfDisplaySrc"
              :style="{ opacity: pdfLoaded ? 1 : 0 }"
              @load="onPdfLoad"
            />
          </template>

          <template v-else-if="fileType === 'docx'">
            <div ref="wordWrapRef" class="word-preview" />
          </template>

          <template v-else-if="rawObjectUrl">
            <img v-if="fileType === 'image'" class="paper-img" :src="rawObjectUrl" alt="preview" />

            <div v-else class="paper-empty">不支持的文件格式</div>
          </template>

          <div v-else-if="!loading" class="paper-empty">暂无预览</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { renderAsync } from 'docx-preview'
import { computed, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean // 弹窗是否打开
  paper?: any // 试卷对象（预留）
  previewUrl?: string // 预览文件地址
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void // 更新弹窗状态
}>()

const loading = ref(false) // 加载状态
const errorText = ref('') // 错误信息
const rawObjectUrl = ref('') // 本地 Blob URL
const rawBlob = ref<Blob | null>(null)
const fileType = ref<'pdf' | 'image' | 'docx' | 'doc' | 'unknown'>('unknown') // 文件类型
const scale = ref(100) // 缩放比例
const page = ref(1) // 当前页码
const totalPage = ref(0) // 总页数，0 表示未知

const wordWrapRef = ref<HTMLElement | null>(null)
const wordLoaded = ref(false)

// PDF 加载状态管理
const pdfLoaded = ref(false) // PDF 是否渲染完成
const pdfFitMode = ref<'FitV' | 'custom'>('FitV') // PDF 视图模式：FitV(自适应高度) 或 custom(自定义缩放)
let loadFallbackTimer: number | null = null // 加载超时定时器
let successDelayTimer: number | null = null // 加载成功延迟定时器
let loadToken = 0 // 加载令牌，防止竞态条件

// 计算内容区域样式
const sheetStyle = computed(() => {
  const s = scale.value

  if (fileType.value === 'image') {
    return {
      height: `${s}%`,
      width: 'auto',
    }
  }

  return {}
})

// 构建 PDF 显示源地址（包含 hash 参数控制视图）
const pdfDisplaySrc = computed(() => {
  const s = String(rawObjectUrl.value || '').trim()
  if (!s) return ''
  return buildPdfSrc(s, page.value || 1, scale.value, pdfFitMode.value)
})

// 解析 URL hash 参数
const parseFragmentParams = (frag: string) => {
  const out: Record<string, string> = {}
  for (const part of frag.split('&')) {
    const p = part.trim()
    if (!p) continue
    const eq = p.indexOf('=')
    if (eq === -1) {
      out[p] = ''
      continue
    }
    const k = p.slice(0, eq)
    const v = p.slice(eq + 1)
    out[k] = v
  }
  return out
}

// 构建带参数的 PDF URL
const buildPdfSrc = (raw: string, page: number, scaleVal: number, mode: 'FitV' | 'custom') => {
  const idx = raw.indexOf('#')
  const base = idx === -1 ? raw : raw.slice(0, idx)
  const frag = idx === -1 ? '' : raw.slice(idx + 1)

  const params = parseFragmentParams(frag)
  // 硬编码默认参数配置
  params.toolbar = '0' // 隐藏工具栏
  params.navpanes = '0' // 隐藏导航面板
  params.scrollbar = '1' // 开启滚动条，防止大图被截断

  if (mode === 'custom') {
    params.zoom = String(scaleVal) // 使用自定义缩放
    delete params.view // zoom 优先级高于 view，但为了保险移除 view
  } else {
    params.view = 'FitV' // 默认适配高度
    delete params.zoom
  }

  params.page = String(page || 1) // 指定页码

  const nextFrag = Object.keys(params)
    .filter(k => k)
    .map(k => (params[k] === '' ? k : `${k}=${params[k]}`))
    .join('&')

  return nextFrag ? `${base}#${nextFrag}` : base
}

// PDF 加载完成回调
const onPdfLoad = () => {
  if (!rawObjectUrl.value) return
  const token = loadToken

  // 使用 requestAnimationFrame 确保渲染帧更新
  requestAnimationFrame(() => {
    if (token !== loadToken) return

    if (loadFallbackTimer) {
      clearTimeout(loadFallbackTimer)
      loadFallbackTimer = null
    }

    // 延迟 0.5 秒移除 loading，优化视觉体验
    successDelayTimer = window.setTimeout(() => {
      if (token !== loadToken) return
      pdfLoaded.value = true
      successDelayTimer = null
    }, 500)
  })
}

// URL 归一化处理：优先尝试 HTTPS，补全相对路径-后期可删掉
const normalizeUrlCandidates = (raw?: string) => {
  const val = String(raw || '').trim()
  if (!val) return [] as string[]

  // 协议自适应
  if (val.startsWith('//')) {
    return [`${window.location.protocol}${val}`]
  }

  // 相对路径补全
  if (val.startsWith('/')) {
    try {
      const base = import.meta.env.VITE_API_BASE || window.location.origin
      return [new URL(val, base).toString()]
    } catch {
      return [val]
    }
  }

  // HTTP 升级尝试 !后期会改成https,先保留，后期可删掉
  if (val.startsWith('http://')) {
    const https = `https://${val.slice('http://'.length)}`
    // 如果页面本身是 https，优先尝试 https 资源
    return window.location.protocol === 'https:' ? [https, val] : [val, https]
  }

  return [val]
}

// 清理资源
const cleanup = () => {
  if (rawObjectUrl.value) {
    URL.revokeObjectURL(rawObjectUrl.value) // 释放 Blob URL
    rawObjectUrl.value = ''
  }
  rawBlob.value = null
  pdfLoaded.value = false
  wordLoaded.value = false
  if (wordWrapRef.value) wordWrapRef.value.innerHTML = ''
  if (loadFallbackTimer) {
    clearTimeout(loadFallbackTimer)
    loadFallbackTimer = null
  }
  if (successDelayTimer) {
    clearTimeout(successDelayTimer)
    successDelayTimer = null
  }
}

const renderDocx = async (blob: Blob, token: number) => {
  const el = wordWrapRef.value
  if (!el) return

  wordLoaded.value = false
  el.innerHTML = ''

  const buf = await blob.arrayBuffer()
  if (token !== loadToken) return

  await renderAsync(buf, el, el, { inWrapper: true })
  if (token !== loadToken) return

  wordLoaded.value = true
}

// 检测文件类型
const detectFileType = (contentType: string | null, url: string): 'pdf' | 'image' | 'docx' | 'doc' | 'unknown' => {
  const path = (url.split('?')[0] ?? '').split('#')[0]?.toLowerCase() ?? ''
  const lowerType = contentType?.toLowerCase() || ''

  if (lowerType.includes('pdf') || path.endsWith('.pdf')) return 'pdf'

  if (
    lowerType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    path.endsWith('.docx')
  ) {
    return 'docx'
  }

  if (lowerType.includes('application/msword') || path.endsWith('.doc')) return 'doc'

  if (lowerType.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(path)) return 'image'

  return 'unknown'
}

// 加载预览资源
const loadPreview = async () => {
  cleanup()
  // displaySrc 是计算属性，会自动更新
  errorText.value = ''
  scale.value = 100
  page.value = 1
  totalPage.value = 0 // 重置总页数
  pdfFitMode.value = 'FitV'

  if (!props.open || !props.previewUrl) {
    fileType.value = 'unknown'
    return
  }

  const candidates = normalizeUrlCandidates(props.previewUrl)
  const initialUrl = candidates[0] || props.previewUrl
  const guessedType = detectFileType(null, initialUrl)
  fileType.value = guessedType

  loadToken++
  const token = loadToken
  pdfLoaded.value = false
  wordLoaded.value = false

  if (guessedType !== 'image') {
    loading.value = true
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const contentType = res.headers.get('content-type') || ''
      if (contentType.toLowerCase().includes('application/json')) {
        const json = await res.json()
        throw new Error(json.msg || json.message || '文件获取失败')
      }

      const blob = await res.blob()
      if (blob.size === 0) throw new Error('Empty content')
      if (token !== loadToken) return

      let type = detectFileType(contentType, url)

      if (type === 'unknown') {
        const bt = (blob.type || '').toLowerCase()
        if (bt.includes('image')) type = 'image'
        else if (bt.includes('pdf')) type = 'pdf'
        else if (bt.includes('word') || bt.includes('officedocument')) type = 'docx'
        else type = 'pdf'
      }

      fileType.value = type
      rawBlob.value = blob

      if (type === 'pdf' || type === 'image') {
        rawObjectUrl.value = URL.createObjectURL(blob)
        loading.value = false
        return
      }

      if (type === 'docx') {
        await renderDocx(blob, token)
        if (token !== loadToken) return
        loading.value = false
        return
      }

      loading.value = false
      return
    } catch (e) {
      console.warn('Preview load failed for candidate:', url, e)
    }
  }

  errorText.value = '预览加载失败，请检查网络或资源链接'
  loading.value = false
}

// 监听弹窗打开状态和 URL 变化
watch(
  () => [props.open, props.previewUrl],
  () => {
    if (props.open) {
      loadPreview()
    } else {
      cleanup()
    }
  },
  { immediate: true }
)

// 监听 PDF 源地址变化（包括翻页、缩放），重置 loading 状态
watch(pdfDisplaySrc, newVal => {
  if (!newVal || fileType.value !== 'pdf') return

  pdfLoaded.value = false
  loadToken++
  const token = loadToken

  // 清除旧定时器
  if (loadFallbackTimer) {
    clearTimeout(loadFallbackTimer)
    loadFallbackTimer = null
  }
  if (successDelayTimer) {
    clearTimeout(successDelayTimer)
    successDelayTimer = null
  }

  // 启动新的兜底定时器
  loadFallbackTimer = window.setTimeout(() => {
    if (token !== loadToken) return
    if (!pdfLoaded.value) pdfLoaded.value = true
  }, 10000)
})

onUnmounted(() => {
  cleanup()
})

const sanitizeFileName = (name: string) => {
  const s = String(name || '').trim()
  if (!s) return ''
  return s
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
}

const handleDownload = () => {
  const raw = String(props.previewUrl || '').trim()
  if (!raw) return

  const candidates = normalizeUrlCandidates(raw)
  const url = candidates[0] || raw

  const fileName = sanitizeFileName(String(props.paper?.title || props.paper?.name || 'downloaded-file'))

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleClose = () => {
  emit('update:open', false)
}
</script>

<style scoped lang="scss">
.view-paper-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-paper-modal-container {
  width: 90%;
  height: 100%;
  max-width: 1200px;
  max-height: 90vh;
  background: #f5f7fa;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  height: 60px;
  background: #fff;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef0f3;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;

  .header-icon {
    color: #ff8e36;
    font-size: 24px;
  }

  .header-title {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;

  .close-btn {
    cursor: pointer;
    color: #999;
    display: flex;
    align-items: center;

    &:hover {
      color: #333;
    }
  }
}

.modal-toolbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #eef0f3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.tool-left {
  display: flex;
  align-items: center;
  gap: 15px;

  .zoom-text {
    font-size: 14px;
    color: #666;
    min-width: 40px;
    text-align: center;
  }

  .divider-v-small {
    width: 1px;
    height: 14px;
    background: #e0e0e0;
  }
}

.modal-content-bg {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 0;
  overflow: auto;
  background: #f3f4f6;
  padding: 10px 0;
  position: relative;

  .content-loading-mask {
    position: absolute;
    inset: 0;
    z-index: 2;
    // background: #282828;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content-loading-card {
    width: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .loading-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 4px solid rgba(248, 181, 117, 0.35);
    border-top-color: #ff8e36;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: spin 1s linear infinite;
  }

  .loading-circle-inner {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #fff7ec;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff8e36;
  }

  .loading-title {
    margin-top: 24px;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
  }

  .loading-subtitle {
    margin-top: 8px;
    font-size: 14px;
    color: #64748b;
  }

  .loading-tip {
    margin-top: 24px;
    width: 100%;
    padding: 10px 14px;
    border-radius: 999px;
    background: #fff7ec;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    color: #f97316;
  }

  .loading-tip .tip-icon {
    color: #f97316;
  }

  &.mode-pdf,
  &.mode-word {
    padding: 0;
    overflow: auto; /* 允许缩放后滚动 */
  }
}

.paper-sheet {
  width: 100%; /* A4 width in px (approx) */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  &.is-pdf {
    /*
     * PDF 预览容器需要有“可计算的高度”，否则内部 iframe 的 height: 100% 在某些浏览器下会解析失败
     */
    height: 100%;
    min-height: 100%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    background: #fff;
    margin: 0 auto;
  }

  &.is-image {
    /* 图片模式：高度 100% (由 style 动态控制缩放)，宽度自适应 */
    min-height: 0;
    width: auto;
    display: flex;
    justify-content: center;
  }

  &.is-word {
    height: 100%;
    min-height: 100%;
    overflow: auto;
  }

  .word-preview {
    min-height: 100%;
    padding: 18px 0;
  }

  .word-preview :deep(.docx-wrapper) {
    background: transparent;
    padding: 0;
  }

  .word-preview :deep(section.docx) {
    margin: 0 auto 18px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  }

  .paper-frame {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
    background: #fff;
  }

  .pdf-placeholder {
    position: absolute;
    inset: 0;
    background: #fff;
  }

  .pdf-frame {
    position: relative;
  }

  .paper-img {
    width: auto;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  .paper-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-weight: 600;
  }

  .error-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #ff4d4f;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
