'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface WaterOrbProps {
  size?: number
  className?: string
}

/**
 * 3D 旋转水球组件
 *
 * - 球体用径向渐变模拟玻璃质感
 * - 持续 3D 旋转（Y 轴）
 * - 上下浮动循环（升起降落）
 * - 内部水波纹动画
 */
export function WaterOrb({ size = 48, className }: WaterOrbProps) {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* 外层浮动容器 */}
      <div
        className="absolute inset-0"
        style={{
          animation: 'orb-float 3s ease-in-out infinite',
        }}
      >
        {/* 3D 旋转容器 */}
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            animation: 'orb-rotate 8s linear infinite',
          }}
        >
          {/* 主球体 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 30%, rgba(94, 234, 212, 0.9), rgba(45, 212, 191, 0.6) 40%, rgba(20, 184, 166, 0.4) 70%, rgba(15, 118, 110, 0.3))',
              boxShadow: 'inset -8px -8px 20px rgba(13, 148, 136, 0.4), inset 4px 4px 12px rgba(167, 243, 208, 0.3), 0 0 20px rgba(45, 212, 191, 0.25)',
              backdropFilter: 'blur(2px)',
            }}
          >
            {/* 水波纹层 1 */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden opacity-60"
              style={{
                background: 'radial-gradient(ellipse at 50% 120%, rgba(94, 234, 212, 0.4), transparent 60%)',
                animation: 'orb-wave 4s ease-in-out infinite',
              }}
            />
            {/* 水波纹层 2 */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden opacity-40"
              style={{
                background: 'radial-gradient(ellipse at 30% 140%, rgba(167, 243, 208, 0.3), transparent 50%)',
                animation: 'orb-wave 5s ease-in-out infinite reverse',
              }}
            />
            {/* 高光 */}
            <div
              className="absolute rounded-full"
              style={{
                top: '15%',
                left: '25%',
                width: '25%',
                height: '20%',
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.6), transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
            {/* 次高光 */}
            <div
              className="absolute rounded-full"
              style={{
                bottom: '20%',
                right: '25%',
                width: '12%',
                height: '10%',
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.3), transparent 70%)',
                filter: 'blur(1px)',
              }}
            />
          </div>

          {/* 轨道环 1（水平） */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(45, 212, 191, 0.15)',
              transform: 'rotateX(75deg)',
            }}
          />
          {/* 轨道环 2（斜角） */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(45, 212, 191, 0.1)',
              transform: 'rotateX(70deg) rotateZ(45deg)',
            }}
          />
        </div>

        {/* 外发光 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.08), transparent 70%)',
            transform: 'scale(1.5)',
          }}
        />
      </div>

      {/* CSS 动画定义 */}
      <style jsx>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes orb-rotate {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes orb-wave {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-3px) scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
