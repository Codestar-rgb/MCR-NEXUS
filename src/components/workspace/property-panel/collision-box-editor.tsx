'use client'

/**
 * 实体碰撞箱可视化编辑器
 *
 * 在实体节点的属性面板中作为可视化 Tab 显示：
 *  - 3D 等距视图预览碰撞箱（基于 CSS transform）
 *  - 拖拽滑块调整 width/height/depth
 *  - 实时数值显示
 *
 * 碰撞箱数据存储在 properties.collisionBox { x, y, z }
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Box, Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollisionBoxEditorProps {
  width: number
  height: number
  depth: number
  onChange: (dim: 'x' | 'y' | 'z', value: number) => void
}

export function CollisionBoxEditor({ width, height, depth, onChange }: CollisionBoxEditorProps) {
  // 等距投影缩放（碰撞箱最大 4x4x4）
  const maxDim = Math.max(width, height, depth, 1)
  const scale = 60 / maxDim

  // 等距投影坐标计算
  const iso = (x: number, y: number, z: number) => ({
    x: (x - z) * scale * 0.866, // cos(30°)
    y: (x + z) * scale * 0.5 - y * scale, // sin(30°)
  })

  // 8 个顶点
  const w = width, h = height, d = depth
  const vertices = [
    iso(0, 0, 0), iso(w, 0, 0), iso(w, 0, d), iso(0, 0, d),
    iso(0, h, 0), iso(w, h, 0), iso(w, h, d), iso(0, h, d),
  ]

  // 6 个面（顶点索引）
  const faces = [
    { indices: [0, 1, 2, 3], color: 'rgba(244, 114, 182, 0.08)' }, // 底面
    { indices: [4, 5, 6, 7], color: 'rgba(244, 114, 182, 0.12)' }, // 顶面
    { indices: [0, 1, 5, 4], color: 'rgba(244, 114, 182, 0.15)' }, // 前面
    { indices: [2, 3, 7, 6], color: 'rgba(244, 114, 182, 0.06)' }, // 后面
    { indices: [1, 2, 6, 5], color: 'rgba(244, 114, 182, 0.10)' }, // 右面
    { indices: [0, 3, 7, 4], color: 'rgba(244, 114, 182, 0.04)' }, // 左面
  ]

  // 边
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // 底面边
    [4, 5], [5, 6], [6, 7], [7, 4], // 顶面边
    [0, 4], [1, 5], [2, 6], [3, 7], // 竖边
  ]

  const centerX = 80
  const centerY = 70

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Box className="h-3.5 w-3.5 text-rose-400" />
        <span className="text-[11px] font-medium text-foreground">碰撞箱预览</span>
      </div>

      {/* 等距 3D 预览 */}
      <div className="flex justify-center rounded-lg border border-border/30 bg-card/20 py-4">
        <svg width="160" height="140" className="overflow-visible">
          {/* 面 */}
          {faces.map((face, i) => {
            const points = face.indices.map((idx) => {
              const v = vertices[idx]
              return `${centerX + v.x},${centerY + v.y}`
            }).join(' ')
            return (
              <polygon
                key={i}
                points={points}
                fill={face.color}
                stroke="rgba(244, 114, 182, 0.5)"
                strokeWidth="1"
              />
            )
          })}
          {/* 边 */}
          {edges.map((edge, i) => {
            const v1 = vertices[edge[0]]
            const v2 = vertices[edge[1]]
            return (
              <line
                key={i}
                x1={centerX + v1.x}
                y1={centerY + v1.y}
                x2={centerX + v2.x}
                y2={centerY + v2.y}
                stroke="rgba(244, 114, 182, 0.7)"
                strokeWidth="1.5"
              />
            )
          })}
          {/* 顶点 */}
          {vertices.map((v, i) => (
            <circle
              key={i}
              cx={centerX + v.x}
              cy={centerY + v.y}
              r="2"
              fill="rgba(244, 114, 182, 0.9)"
            />
          ))}
          {/* 尺寸标注 */}
          <text x={centerX + iso(w, 0, 0).x + 5} y={centerY + iso(w, 0, 0).y + 10} fill="rgba(244, 114, 182, 0.8)" fontSize="9" fontFamily="monospace">
            {w.toFixed(1)}
          </text>
          <text x={centerX + iso(0, h, 0).x - 15} y={centerY + iso(0, h, 0).y - 2} fill="rgba(244, 114, 182, 0.8)" fontSize="9" fontFamily="monospace">
            {h.toFixed(1)}
          </text>
          <text x={centerX + iso(0, 0, d).x - 20} y={centerY + iso(0, 0, d).y + 10} fill="rgba(244, 114, 182, 0.8)" fontSize="9" fontFamily="monospace">
            {d.toFixed(1)}
          </text>
        </svg>
      </div>

      {/* 滑块控制 */}
      <div className="space-y-2">
        <DimensionSlider
          label="宽度 (X)"
          icon="↔"
          value={width}
          min={0.1}
          max={4}
          step={0.1}
          color="text-rose-300"
          onChange={(v) => onChange('x', v)}
        />
        <DimensionSlider
          label="高度 (Y)"
          icon="↕"
          value={height}
          min={0.1}
          max={4}
          step={0.1}
          color="text-amber-300"
          onChange={(v) => onChange('y', v)}
        />
        <DimensionSlider
          label="深度 (Z)"
          icon="↙"
          value={depth}
          min={0.1}
          max={4}
          step={0.1}
          color="text-cyan-300"
          onChange={(v) => onChange('z', v)}
        />
      </div>

      {/* 预设按钮 */}
      <div className="flex flex-wrap gap-1.5">
        <PresetButton label="小型" dims={{ x: 0.5, y: 0.5, z: 0.5 }} onSelect={onChange} />
        <PresetButton label="标准" dims={{ x: 0.6, y: 1.8, z: 0.6 }} onSelect={onChange} />
        <PresetButton label="大型" dims={{ x: 1.5, y: 2.5, z: 1.5 }} onSelect={onChange} />
        <PresetButton label="Boss" dims={{ x: 3, y: 3, z: 3 }} onSelect={onChange} />
      </div>

      {/* 说明 */}
      <div className="rounded border border-border/20 bg-muted/10 p-2 text-[9px] leading-relaxed text-muted-foreground/60">
        💡 碰撞箱决定实体的物理碰撞体积。标准生物约 0.6×1.8×0.6，Boss 可达 3×3×3。
      </div>
    </div>
  )
}

function DimensionSlider({
  label,
  icon,
  value,
  min,
  max,
  step,
  color,
  onChange,
}: {
  label: string
  icon: string
  value: number
  min: number
  max: number
  step: number
  color: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 text-center text-[10px] text-muted-foreground">{icon}</span>
      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-rose-400"
      />
      <span className={cn('w-10 shrink-0 text-right font-mono text-[10px] font-semibold', color)}>
        {value.toFixed(1)}
      </span>
    </div>
  )
}

function PresetButton({
  label,
  dims,
  onSelect,
}: {
  label: string
  dims: { x: number; y: number; z: number }
  onSelect: (dim: 'x' | 'y' | 'z', value: number) => void
}) {
  return (
    <button
      onClick={() => {
        onSelect('x', dims.x)
        onSelect('y', dims.y)
        onSelect('z', dims.z)
      }}
      className="rounded border border-border/30 bg-card/30 px-2 py-1 text-[9px] text-muted-foreground transition-colors hover:border-rose-500/30 hover:text-rose-300"
    >
      {label} {dims.x}×{dims.y}×{dims.z}
    </button>
  )
}
