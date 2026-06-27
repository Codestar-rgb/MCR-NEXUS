/**
 * NexCube 统一动效预设库
 *
 * 所有 Framer Motion 动画预设集中管理，确保全应用动效一致性。
 * 参考：Linear（spring 弹性）、Cursor（easeOut 平滑）、Vercel（微交互）
 *
 * 设计原则：
 * - 过渡时间：快速 150ms / 标准 200ms / 慢速 300ms
 * - 弹性：stiffness 380 / damping 24（Linear 风格）
 * - 入场：y偏移 + 透明度（避免 scale 导致布局抖动）
 * - 退场：缩小 + 透明度（快速消失不拖沓）
 */

import type { Transition, Variants } from 'framer-motion'

/* ===== 缓动函数 ===== */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const
export const EASE_SPRING = { type: 'spring', stiffness: 380, damping: 24 } as const
export const EASE_SPRING_GENTLE = { type: 'spring', stiffness: 280, damping: 28 } as const
export const EASE_SPRING_BOUNCY = { type: 'spring', stiffness: 500, damping: 18 } as const

/* ===== 通用过渡 ===== */
export const transitionFast: Transition = { duration: 0.15, ease: EASE_OUT }
export const transitionNormal: Transition = { duration: 0.2, ease: EASE_OUT }
export const transitionSlow: Transition = { duration: 0.3, ease: EASE_OUT }
export const transitionSpring: Transition = EASE_SPRING

/* ===== 入场动画 ===== */

/** 淡入 + 下移（标准入场） */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitionNormal },
}

/** 淡入 + 右移（侧边入场） */
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: transitionNormal },
}

/** 淡入 + 缩放（弹窗/卡片） */
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: EASE_SPRING },
}

/** 纯淡入（背景/遮罩） */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionFast },
}

/* ===== 列表 stagger ===== */

/** 列表容器（stagger 子项） */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
}

/** stagger 子项（淡入 + 下移） */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitionFast },
}

/** stagger 子项（淡入 + 右移） */
export const staggerItemRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: transitionFast },
}

/* ===== 工作区切换 ===== */

/** 工作区画布切换：左滑退出 */
export const workspaceExitLeft: Variants = {
  enter: { opacity: 0, x: -40 },
  center: { opacity: 1, x: 0, transition: transitionNormal },
  exit: { opacity: 0, x: 40, transition: transitionFast },
}

/** 工作区画布切换：右滑退出 */
export const workspaceExitRight: Variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0, transition: transitionNormal },
  exit: { opacity: 0, x: -40, transition: transitionFast },
}

/* ===== 节点动画 ===== */

/** 节点创建：弹入 */
export const nodeEnter: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: EASE_SPRING_BOUNCY },
}

/** 节点删除：缩小淡出 */
export const nodeExit: Variants = {
  hidden: { opacity: 0, scale: 0.8, transition: transitionFast },
  visible: { opacity: 1, scale: 1 },
}

/* ===== 微交互 ===== */

/** hover 上浮 */
export const hoverLift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
}

/** hover 上浮 + 阴影 */
export const hoverLiftCard = {
  whileHover: { y: -3, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
}

/** 点击缩放 */
export const tapScale = {
  whileTap: { scale: 0.95 },
}

/* ===== 属性面板 ===== */

/** 属性字段变更闪烁 */
export const fieldFlash: Variants = {
  initial: { backgroundColor: 'rgba(45, 212, 191, 0)' },
  flash: {
    backgroundColor: ['rgba(45, 212, 191, 0)', 'rgba(45, 212, 191, 0.12)', 'rgba(45, 212, 191, 0)'],
    transition: { duration: 0.4 },
  },
}

/* ===== 工具函数 ===== */

/** 生成 stagger 延迟（用于手动控制） */
export function staggerDelay(index: number, base = 0.03): number {
  return base * index
}
