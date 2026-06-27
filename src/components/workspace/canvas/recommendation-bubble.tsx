'use client'

/**
 * AI 节点推荐气泡
 *
 * 创建节点后，在画布右上角弹出推荐气泡：
 * "检测到创建了实体，推荐创建生怪蛋"
 * 点击"创建"→ 自动创建推荐节点
 * 点击"忽略"→ 关闭气泡
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, X } from 'lucide-react'
import { useCanvasStore, createFlowNode } from '@/stores/canvas'
import { getRecommendations, type Recommendation } from '@/lib/node-recommendations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RecommendationBubbleProps {
  /** 最近创建的节点 ID（由父组件传入） */
  lastCreatedNodeId: string | null
  /** 最近创建的节点类型 */
  lastCreatedNodeKind: string | null
  /** 最近创建的节点名称 */
  lastCreatedNodeName: string | null
  /** 最近创建的节点位置 */
  lastCreatedNodePosition: { x: number; y: number } | null
}

export function RecommendationBubble({
  lastCreatedNodeId,
  lastCreatedNodeKind,
  lastCreatedNodeName,
  lastCreatedNodePosition,
}: RecommendationBubbleProps) {
  const [dismissed, setDismissed] = React.useState(false)
  const [currentNodeId, setCurrentNodeId] = React.useState<string | null>(null)

  const addNode = useCanvasStore((s) => s.addNode)
  const nodes = useCanvasStore((s) => s.nodes)

  // 获取推荐
  const recommendations = React.useMemo(() => {
    if (!lastCreatedNodeKind || !lastCreatedNodeName || dismissed) return []
    if (currentNodeId !== lastCreatedNodeId) return []
    return getRecommendations(lastCreatedNodeKind, lastCreatedNodeName)
  }, [lastCreatedNodeKind, lastCreatedNodeName, dismissed, currentNodeId, lastCreatedNodeId])

  // 新节点创建时重置 dismissed
  React.useEffect(() => {
    if (lastCreatedNodeId && lastCreatedNodeId !== currentNodeId) {
      setDismissed(false)
      setCurrentNodeId(lastCreatedNodeId)
    }
  }, [lastCreatedNodeId, currentNodeId])

  const handleCreate = (rec: Recommendation) => {
    if (!lastCreatedNodePosition) return
    // 在原节点旁边创建推荐节点
    const pos = {
      x: lastCreatedNodePosition.x + rec.positionOffset.x,
      y: lastCreatedNodePosition.y + rec.positionOffset.y,
    }
    // 用 createFlowNode 创建节点
    const newNode = createFlowNode(rec.kind, pos)
    // 覆盖标题和属性
    newNode.data.title = rec.title
    newNode.data.properties = { ...newNode.data.properties, ...rec.properties }
    addNode(newNode)
    toast.success(`已创建：${rec.title}`)
    setDismissed(true)
  }

  if (recommendations.length === 0) return null

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute right-4 top-16 z-30 w-72"
        >
          <div className="rounded-xl border border-primary/30 bg-popover/95 p-3 shadow-floating backdrop-blur-xl">
            {/* 标题 */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">智能推荐</span>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:bg-accent/40 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* 推荐列表 */}
            <div className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/30 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-foreground">{rec.title}</div>
                    <div className="truncate text-[9px] text-muted-foreground/60">{rec.reason}</div>
                  </div>
                  <button
                    onClick={() => handleCreate(rec)}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    创建
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
