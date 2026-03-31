import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

export type AntdTableScrollYMode = 'viewport' | 'container'

export type UseAntdTableScrollYOptions = {
  mode?: AntdTableScrollYMode
  minY?: number
  initialY?: number
  bottomPadding?: number
  subtractSelectors?: string[]
  subtractPadding?: boolean
  gapMultiplier?: number
  extraSubtract?: number
  observe?: boolean
  listenWindowResize?: boolean
}

const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? '0'))
  return Number.isFinite(n) ? n : 0
}

const measureH = (el: Element | null) => {
  if (!el) return 0
  const ht = el as HTMLElement
  const rect = ht.getBoundingClientRect?.()
  return rect?.height ? rect.height : ht.offsetHeight || 0
}

export default function useAntdTableScrollY(
  containerRef: Ref<HTMLElement | null>,
  options: UseAntdTableScrollYOptions = {}
) {
  const mode = options.mode ?? 'viewport'
  const minY = options.minY ?? 160
  const bottomPadding = options.bottomPadding ?? 20
  const subtractPadding = options.subtractPadding ?? mode === 'container'
  const gapMultiplier = options.gapMultiplier ?? 0
  const extraSubtract = options.extraSubtract ?? 0
  const subtractSelectors =
    options.subtractSelectors ??
    (mode === 'viewport' ? ['.tch-table-footer', '.ant-table-thead'] : ['.ant-table-thead', '.ant-pagination'])
  const observe = options.observe ?? mode === 'container'
  const listenWindowResize = options.listenWindowResize ?? mode === 'viewport'

  const scrollY = ref<number>(options.initialY ?? 320)

  let ro: ResizeObserver | null = null

  const update = async () => {
    await nextTick()

    const wrap = containerRef.value
    if (!wrap) return

    let base = 0

    if (mode === 'viewport') {
      if (typeof window === 'undefined') return
      const rect = wrap.getBoundingClientRect()
      base = window.innerHeight - rect.top - bottomPadding
    } else {
      base = wrap.clientHeight

      const cs = typeof window !== 'undefined' ? window.getComputedStyle(wrap) : null
      if (cs) {
        if (subtractPadding) {
          base -= num(cs.paddingTop) + num(cs.paddingBottom)
        }
        if (gapMultiplier) {
          const gap = num((cs as any).rowGap || cs.gap)
          base -= gap * gapMultiplier
        }
      }
    }

    let sub = 0
    for (const sel of subtractSelectors) {
      if (!sel) continue
      sub += measureH(wrap.querySelector(sel))
    }

    const y = Math.floor(base - sub - extraSubtract)
    scrollY.value = Math.max(minY, y)
  }

  const bindRO = (el: HTMLElement | null) => {
    if (ro) {
      ro.disconnect()
      ro = null
    }
    if (!observe || !el || typeof ResizeObserver === 'undefined') return
    ro = new ResizeObserver(() => {
      update().catch(() => {})
    })
    ro.observe(el)
  }

  const onResize = () => {
    update().catch(() => {})
  }

  watch(
    () => containerRef.value,
    el => {
      bindRO(el)
      update().catch(() => {})
    },
    { immediate: true }
  )

  if (listenWindowResize && typeof window !== 'undefined') {
    window.addEventListener('resize', onResize)
  }

  onBeforeUnmount(() => {
    if (ro) {
      ro.disconnect()
      ro = null
    }
    if (listenWindowResize && typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
    }
  })

  return { scrollY, update }
}
