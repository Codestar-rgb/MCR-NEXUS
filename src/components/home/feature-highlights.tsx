'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Boxes, Code2, Zap, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

const FEATURES: Feature[] = [
  {
    icon: Boxes,
    title: '双轨协同',
    description: '节点可视化 + 代码 IDE 无缝切换',
    color: 'text-primary',
  },
  {
    icon: Code2,
    title: '智能同步',
    description: 'AST 双向映射 + 黑盒降级机制',
    color: 'text-teal-300',
  },
  {
    icon: Zap,
    title: '开箱即用',
    description: '国内镜像源 + 零配置环境',
    color: 'text-cyan-300',
  },
  {
    icon: Globe,
    title: '多加载器',
    description: 'Forge / Fabric / NeoForge 支持',
    color: 'text-violet-300',
  },
]

export function FeatureHighlights() {
  return (
    <section className="mt-12" aria-label="核心特性">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FEATURES.map((f, idx) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
            className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/20 p-3"
          >
            <f.icon className={cn('h-4 w-4', f.color)} />
            <div>
              <h4 className="text-xs font-semibold text-foreground">{f.title}</h4>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
