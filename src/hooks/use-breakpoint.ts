'use client'

/**
 * NexCube 响应式断点 Hook（Task 6-C）
 *
 * 三档断点（与 Tailwind 的 md: lg: 对齐）：
 *   - mobile  : width <  768
 *   - tablet  : 768 ≤ width < 1024
 *   - desktop : width ≥ 1024
 *
 * SSR 安全：初始值默认 'desktop'，挂载后立即检测真实尺寸并修正。
 * 节流：resize 事件用 requestAnimationFrame 节流，避免抖动。
 */

import * as React from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export const BREAKPOINT_MOBILE = 768
export const BREAKPOINT_TABLET = 1024

function computeBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINT_MOBILE) return 'mobile'
  if (width < BREAKPOINT_TABLET) return 'tablet'
  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>('desktop')

  React.useEffect(() => {
    let rafId: number | null = null

    const check = () => {
      if (typeof window === 'undefined') return
      setBreakpoint(computeBreakpoint(window.innerWidth))
    }

    // 初始化：立即检测一次，避免 SSR 与首屏不一致
    check()

    const onResize = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        check()
      })
    }

    window.addEventListener('resize', onResize)
    // 系统级断点变化（如 iOS 分屏）也会触发
    const mql = window.matchMedia(`(max-width: ${BREAKPOINT_TABLET - 1}px)`)
    mql.addEventListener('change', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      mql.removeEventListener('change', onResize)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  return breakpoint
}

/** 便捷派生 Hook */
export function useIsMobile(): boolean {
  return useBreakpoint() === 'mobile'
}

export function useIsTablet(): boolean {
  return useBreakpoint() === 'tablet'
}

export function useIsDesktop(): boolean {
  return useBreakpoint() === 'desktop'
}
