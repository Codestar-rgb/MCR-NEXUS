'use client'

/**
 * NexCube 全局 Framer Motion 动画预设（Task 6-C）
 *
 * 集中定义项目通用动画过渡预设，避免在各组件内重复写魔法数字：
 *   - 页面切换：fade + slide（0.2s）
 *   - 卡片 hover：轻微上浮 + 阴影
 *   - 按钮点击：scale 0.95
 *   - 列表项进出场：fade + slide
 *   - 模态对话框：scale + fade
 *
 * 所有预设优先使用 spring 过渡（framer-motion 推荐），关键路径用 easeOut
 * 保证感知性能。所有动画 transform 都开启 will-change: transform。
 */

import * as React from 'react'
import type {
  Transition,
  Variants,
  HTMLMotionProps,
} from 'framer-motion'

/* ------------------------------------------------------------------ */
/* Transition 预设                                                     */
/* ------------------------------------------------------------------ */

/** 页面切换（fade + slide）— easeOut 0.2s */
export const pageTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
}

/** 模态对话框进出场（scale + fade）— spring */
export const modalTransition: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 0.8,
}

/** 列表项进出场 — spring 偏软 */
export const listItemTransition: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.6,
}

/** 按钮点击 — 即时回弹 */
export const buttonTapTransition: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 18,
  mass: 0.4,
}

/* ------------------------------------------------------------------ */
/* Variants 预设                                                       */
/* ------------------------------------------------------------------ */

/** 页面切换 variants */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

/** 模态对话框 variants */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
}

/** 列表项 variants（含 stagger 父级使用） */
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10 },
}

/** 列表容器 variants（stagger 子项） */
export const listContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
}

/** 卡片 hover variants（轻微上浮 + 阴影预备） */
export const cardHoverVariants: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -2,
    scale: 1.005,
    transition: { type: 'spring', stiffness: 380, damping: 24 },
  },
}

/** 按钮点击 variants（scale 0.95） */
export const buttonTapVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  tap: { scale: 0.95 },
}

/* ------------------------------------------------------------------ */
/* 通用 props 工厂                                                     */
/* ------------------------------------------------------------------ */

/** 给 motion.div 注入页面切换动画 props */
export function withPageAnimation(): HTMLMotionProps<'div'> {
  return {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants: pageVariants,
    transition: pageTransition,
    style: { willChange: 'transform, opacity' },
  }
}

/** 给 motion.div 注入列表容器动画 props（stagger 子项） */
export function withListContainer(): HTMLMotionProps<'div'> {
  return {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants: listContainerVariants,
    style: { willChange: 'transform, opacity' },
  }
}

/** 给 motion.div 注入列表项动画 props */
export function withListItem(): HTMLMotionProps<'div'> {
  return {
    variants: listItemVariants,
    transition: listItemTransition,
    style: { willChange: 'transform, opacity' },
  }
}

/* ------------------------------------------------------------------ */
/* Provider（占位，便于未来全局策略注入）                                */
/* ------------------------------------------------------------------ */

/**
 * FramerMotionProvider
 *
 * 当前未开启任何全局 Reduced Motion 配置（由 next-themes / 操作系统层处理）。
 * 预留接口：未来可在此注入：
 *   - prefers-reduced-motion 响应
 *   - 全局 LayoutGroup
 *   - 动画性能采样
 */
export function FramerMotionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
