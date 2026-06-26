import * as React from 'react'
import { cn } from '@/lib/utils'

interface NexCubeLogoProps extends React.SVGProps<SVGSVGElement> {
  /** 像素尺寸，会被同时用于 width / height */
  size?: number
}

/**
 * NexCube LOGO v2.0 — 精致等距立方体
 *
 * 设计改进：
 * - 更精致的渐变（teal 品牌色，低饱和度）
 * - 添加内部几何线条，增强科技感
 * - 圆角边缘，更现代
 * - 微妙高光，营造立体感
 * - 支持品牌辉光（通过 className 传入 shadow-glow）
 */
export function NexCubeLogo({ size = 32, className, ...props }: NexCubeLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="NexCube"
      className={cn('shrink-0', className)}
      {...props}
    >
      <defs>
        {/* 顶面渐变：最亮，teal-300 → teal-200 */}
        <linearGradient id="nexcube-top-v2" x1="8" y1="2" x2="40" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
        {/* 左面渐变：中等，teal-500 → teal-700 */}
        <linearGradient id="nexcube-left-v2" x1="2" y1="22" x2="22" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
        {/* 右面渐变：最暗，teal-600 → teal-900 */}
        <linearGradient id="nexcube-right-v2" x1="22" y1="22" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0d9488" />
          <stop offset="1" stopColor="#134e4a" />
        </linearGradient>
        {/* 顶面高光 */}
        <linearGradient id="nexcube-highlight" x1="24" y1="3" x2="24" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 顶面：菱形 */}
      <path
        d="M24 3 L44 14 L24 25 L4 14 Z"
        fill="url(#nexcube-top-v2)"
        stroke="#0f766e"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      {/* 顶面高光 */}
      <path
        d="M24 3 L44 14 L24 25 L4 14 Z"
        fill="url(#nexcube-highlight)"
      />

      {/* 左面 */}
      <path
        d="M4 14 L24 25 L24 45 L4 34 Z"
        fill="url(#nexcube-left-v2)"
        stroke="#0f766e"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      {/* 右面 */}
      <path
        d="M44 14 L24 25 L24 45 L44 34 Z"
        fill="url(#nexcube-right-v2)"
        stroke="#0f766e"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* 内部几何线条，增强科技感 */}
      {/* 中心垂直线 */}
      <path d="M24 25 L24 45" stroke="#0f766e" strokeWidth="0.5" opacity="0.6" />
      {/* 顶面中心点到棱角（科技感辐射） */}
      <path d="M24 14 L24 3" stroke="#5eead4" strokeWidth="0.4" opacity="0.5" />
      <path d="M24 14 L44 14" stroke="#5eead4" strokeWidth="0.4" opacity="0.3" />
      <path d="M24 14 L4 14" stroke="#5eead4" strokeWidth="0.4" opacity="0.3" />

      {/* 微妙圆点（中心，代表"核心"） */}
      <circle cx="24" cy="14" r="1.2" fill="#5eead4" opacity="0.9" />
    </svg>
  )
}
