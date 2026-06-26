import * as React from 'react'
import { cn } from '@/lib/utils'

interface NexCubeLogoProps extends React.SVGProps<SVGSVGElement> {
  /** 像素尺寸，会被同时用于 width / height */
  size?: number
}

/**
 * NexCube LOGO — 等距视角立方体（isometric cube）。
 *
 * 三面使用 emerald / teal 渐变区分明度：
 * - 顶面：emerald-400 → teal-300（最亮）
 * - 左面：emerald-500 → emerald-700（中等）
 * - 右面：teal-600 → emerald-800（最暗）
 *
 * 线条简洁，支持小尺寸显示（最小 16px 仍可辨识）。
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
        <linearGradient id="nexcube-top" x1="8" y1="2" x2="40" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#5eead4" />
        </linearGradient>
        <linearGradient id="nexcube-left" x1="2" y1="22" x2="22" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="nexcube-right" x1="22" y1="22" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0d9488" />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
      </defs>
      {/* 顶面：菱形 */}
      <path d="M24 3 L44 14 L24 25 L4 14 Z" fill="url(#nexcube-top)" stroke="#022c22" strokeWidth="1" strokeLinejoin="round" />
      {/* 左面 */}
      <path d="M4 14 L24 25 L24 45 L4 34 Z" fill="url(#nexcube-left)" stroke="#022c22" strokeWidth="1" strokeLinejoin="round" />
      {/* 右面 */}
      <path d="M44 14 L24 25 L24 45 L44 34 Z" fill="url(#nexcube-right)" stroke="#022c22" strokeWidth="1" strokeLinejoin="round" />
      {/* 内部高光线条，增强立体感 */}
      <path d="M24 25 L24 45" stroke="#022c22" strokeWidth="0.75" opacity="0.5" />
    </svg>
  )
}
