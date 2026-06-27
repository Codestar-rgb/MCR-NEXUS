'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface WaterOrbProps {
  size?: number
  className?: string
}

/**
 * 3D 立体水球组件 v2
 *
 * 真正的 3D 立体感：
 * - 多层径向渐变模拟球体曲面光照
 * - 深度阴影（底部暗、顶部亮）
 * - 3D 透视容器（perspective）
 * - Y 轴旋转（看到球体转动）
 * - 上下浮动循环
 * - 内部液体波动（SVG path 动画）
 * - 表面高光反射
 * - 底部投影
 */
export function WaterOrb({ size = 48, className }: WaterOrbProps) {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size, perspective: '200px' }}
    >
      {/* 底部投影（随浮动缩放） */}
      <div
        className="absolute"
        style={{
          bottom: -size * 0.15,
          left: '50%',
          width: size * 0.7,
          height: size * 0.12,
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(20, 184, 166, 0.3), transparent 70%)',
          filter: 'blur(4px)',
          animation: 'orb-shadow 3s ease-in-out infinite',
        }}
      />

      {/* 浮动 + 旋转容器 */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'orb-float 3s ease-in-out infinite',
        }}
      >
        {/* 3D 旋转层 */}
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            animation: 'orb-rotate 6s linear infinite',
          }}
        >
          {/* 主球体 - 极强 3D 立体感 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                /* 高光斑点（最亮的小点，模拟光源直射） */
                radial-gradient(circle at 33% 22%, rgba(255, 255, 255, 1) 0%, rgba(207, 250, 254, 0.9) 3%, transparent 8%),
                /* 高光扩散区 */
                radial-gradient(circle at 35% 25%, rgba(207, 250, 254, 0.9) 0%, rgba(167, 243, 208, 0.5) 10%, transparent 25%),
                /* 亮区到暗区的主渐变（左上→右下，强对比） */
                radial-gradient(circle at 32% 28%, rgba(94, 234, 212, 0.95) 0%, rgba(45, 212, 191, 0.85) 20%, rgba(20, 184, 166, 0.8) 40%, rgba(13, 148, 136, 0.75) 60%, rgba(6, 95, 70, 0.7) 80%, rgba(4, 47, 46, 0.65) 100%),
                /* 强边缘暗角 */
                radial-gradient(circle at 50% 50%, transparent 55%, rgba(4, 47, 46, 0.8) 92%, rgba(0, 0, 0, 0.5) 100%)
              `,
              boxShadow: `
                /* 内阴影：右下深暗（曲面感核心） */
                inset -10px -12px 24px rgba(0, 0, 0, 0.6),
                inset -6px -8px 16px rgba(4, 47, 46, 0.7),
                /* 内高光：左上明亮 */
                inset 5px 7px 16px rgba(207, 250, 254, 0.4),
                inset 2px 3px 8px rgba(255, 255, 255, 0.3),
                /* 外阴影：空间深度 */
                0 8px 20px rgba(0, 0, 0, 0.4),
                0 3px 8px rgba(4, 47, 46, 0.4),
                /* 外发光 */
                0 0 32px rgba(45, 212, 191, 0.2)
              `,
            }}
          >
            {/* 内部液体波动 - SVG */}
            <svg
              className="absolute inset-0 rounded-full"
              viewBox="0 0 100 100"
              style={{ overflow: 'hidden' }}
            >
              <defs>
                <clipPath id="orb-clip">
                  <circle cx="50" cy="50" r="48" />
                </clipPath>
              </defs>
              <g clipPath="url(#orb-clip)">
                {/* 水波 1 */}
                <path
                  d="M -10 60 Q 25 55, 50 60 T 110 60 L 110 110 L -10 110 Z"
                  fill="rgba(94, 234, 212, 0.15)"
                  style={{
                    animation: 'orb-wave1 4s ease-in-out infinite',
                  }}
                />
                {/* 水波 2 */}
                <path
                  d="M -10 65 Q 30 60, 50 65 T 110 65 L 110 110 L -10 110 Z"
                  fill="rgba(45, 212, 191, 0.12)"
                  style={{
                    animation: 'orb-wave2 5s ease-in-out infinite',
                  }}
                />
                {/* 水波 3 */}
                <path
                  d="M -10 70 Q 25 67, 50 70 T 110 70 L 110 110 L -10 110 Z"
                  fill="rgba(20, 184, 166, 0.1)"
                  style={{
                    animation: 'orb-wave3 6s ease-in-out infinite',
                  }}
                />
              </g>
            </svg>

            {/* 表面高光 1（大） */}
            <div
              className="absolute rounded-full"
              style={{
                top: '12%',
                left: '22%',
                width: '30%',
                height: '22%',
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                filter: 'blur(1px)',
                transform: 'rotate(-20deg)',
              }}
            />
            {/* 表面高光 2（小亮点） */}
            <div
              className="absolute rounded-full"
              style={{
                top: '18%',
                left: '30%',
                width: '8%',
                height: '6%',
                background: 'rgba(255, 255, 255, 0.9)',
                filter: 'blur(0.5px)',
              }}
            />
            {/* 底部反光 */}
            <div
              className="absolute rounded-full"
              style={{
                bottom: '15%',
                left: '30%',
                width: '40%',
                height: '8%',
                background: 'radial-gradient(ellipse, rgba(94, 234, 212, 0.25) 0%, transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
          </div>

          {/* 3D 轨道环 - 赤道 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(94, 234, 212, 0.2)',
              transform: 'rotateX(78deg) scale(1)',
              boxShadow: '0 0 4px rgba(94, 234, 212, 0.1)',
            }}
          />
        </div>

        {/* 外发光 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.06) 0%, transparent 65%)',
            transform: 'scale(1.6)',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orb-shadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
          50% { transform: translateX(-50%) scale(0.8); opacity: 0.3; }
        }
        @keyframes orb-rotate {
          0% { transform: rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateY(360deg) rotateZ(0deg); }
        }
        @keyframes orb-wave1 {
          0%, 100% { d: path('M -10 60 Q 25 55, 50 60 T 110 60 L 110 110 L -10 110 Z'); }
          50% { d: path('M -10 58 Q 25 62, 50 58 T 110 58 L 110 110 L -10 110 Z'); }
        }
        @keyframes orb-wave2 {
          0%, 100% { d: path('M -10 65 Q 30 60, 50 65 T 110 65 L 110 110 L -10 110 Z'); }
          50% { d: path('M -10 67 Q 30 63, 50 67 T 110 67 L 110 110 L -10 110 Z'); }
        }
        @keyframes orb-wave3 {
          0%, 100% { d: path('M -10 70 Q 25 67, 50 70 T 110 70 L 110 110 L -10 110 Z'); }
          50% { d: path('M -10 68 Q 25 72, 50 68 T 110 68 L 110 110 L -10 110 Z'); }
        }
      `}</style>
    </div>
  )
}
