'use client'

/**
 * 函数节点封装组件（Task 3-C）
 *
 * 职责：
 *  - 当用户在画布上选中 2+ 节点时，在画布顶部显示"封装为函数节点"浮动按钮
 *  - 点击按钮弹出 Dialog：输入函数名 + 选择颜色 + 端口预览
 *  - 确认后调用 canvas store.encapsulateToFunction(name, color, nodeIds)
 *
 * 端口预览逻辑（在 Dialog 中展示）：
 *  - 收集选中节点上的"外部入口边" → 推断输入端口列表
 *  - 收集选中节点上的"外部出口边" → 推断输出端口列表
 *  - 显示每个端口的标签 + 数据类型（颜色编码）
 *
 * 封装后的效果：
 *  - 选中节点从主画布消失（subGraphId 被设置）
 *  - 函数节点出现在选中节点包围盒上方
 *  - 双击函数节点 → 打开 function-node-detail 编辑内部
 *
 * 'use client' 必须：组件使用 useState + Dialog 交互。
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FunctionSquare, X, Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCanvasStore } from '@/stores/canvas'
import { getNodeTypeDefinition, PORT_TYPES } from '@/lib/node-system'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* 可选颜色（与 base-node-card COLOR_CLASSES 对齐，禁止 indigo/blue） */
const FUNCTION_COLORS = [
  { name: 'cyan', hex: '#06b6d4', label: '青' },
  { name: 'emerald', hex: '#10b981', label: '翠' },
  { name: 'amber', hex: '#f59e0b', label: '琥' },
  { name: 'rose', hex: '#f43f5e', label: '玫' },
  { name: 'teal', hex: '#14b8a6', label: '蓝' },
  { name: 'violet', hex: '#8b5cf6', label: '紫' },
]

interface InferredPort {
  id: string
  label: string
  dataType: string
}

/**
 * 从选中节点 + 全量连线推断函数节点的输入/输出端口。
 *
 * - 输入端口：外部节点 → 选中节点的边，按 (target, targetHandle) 去重
 * - 输出端口：选中节点 → 外部节点的边，按 (source, sourceHandle) 去重
 */
function inferPorts(
  nodeIds: string[],
  allNodes: ReturnType<typeof useCanvasStore.getState>['nodes'],
  allEdges: ReturnType<typeof useCanvasStore.getState>['edges'],
): { inputs: InferredPort[]; outputs: InferredPort[] } {
  const selectedIdSet = new Set(nodeIds)

  const incomingExternal = allEdges.filter(
    (e) => !selectedIdSet.has(e.source) && selectedIdSet.has(e.target),
  )
  const outgoingExternal = allEdges.filter(
    (e) => selectedIdSet.has(e.source) && !selectedIdSet.has(e.target),
  )

  const inputs: InferredPort[] = []
  const inputKeys = new Set<string>()
  for (const edge of incomingExternal) {
    const key = `${edge.target}:${edge.targetHandle ?? ''}`
    if (inputKeys.has(key)) continue
    inputKeys.add(key)
    const targetNode = allNodes.find((n) => n.id === edge.target)
    if (!targetNode) continue
    const targetDef = getNodeTypeDefinition(targetNode.data.kind)
    const targetPort = targetDef?.inputPorts.find(
      (p) => p.id === edge.targetHandle,
    )
    inputs.push({
      id: `in_${inputs.length + 1}`,
      label: targetPort?.label ?? '输入',
      dataType: targetPort?.dataType ?? 'string',
    })
  }
  if (inputs.length === 0) {
    inputs.push({ id: 'call', label: '调用', dataType: 'boolean' })
  }

  const outputs: InferredPort[] = []
  const outputKeys = new Set<string>()
  for (const edge of outgoingExternal) {
    const key = `${edge.source}:${edge.sourceHandle ?? ''}`
    if (outputKeys.has(key)) continue
    outputKeys.add(key)
    const sourceNode = allNodes.find((n) => n.id === edge.source)
    if (!sourceNode) continue
    const sourceDef = getNodeTypeDefinition(sourceNode.data.kind)
    const sourcePort = sourceDef?.outputPorts.find(
      (p) => p.id === edge.sourceHandle,
    )
    outputs.push({
      id: `out_${outputs.length + 1}`,
      label: sourcePort?.label ?? '输出',
      dataType: sourcePort?.dataType ?? 'string',
    })
  }
  if (outputs.length === 0) {
    outputs.push({ id: 'return', label: '返回', dataType: 'string' })
  }

  return { inputs, outputs }
}

/** 取端口数据类型的 hex 颜色 */
function portHex(dataType: string): string {
  const t = dataType as keyof typeof PORT_TYPES
  return PORT_TYPES[t]?.hex ?? '#71717a'
}

export function FunctionEncapsulator() {
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds)
  const groupingSelection = useCanvasStore((s) => s.groupingSelection)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const encapsulateToFunction = useCanvasStore(
    (s) => s.encapsulateToFunction,
  )
  const encapsulatorRequestCount = useCanvasStore(
    (s) => s.encapsulatorRequestCount,
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [functionName, setFunctionName] = useState('myFunction')
  const [color, setColor] = useState<string>('cyan')

  /* 监听右键菜单的"封装为函数节点"触发 */
  const lastRequestCount = useRef(0)
  useEffect(() => {
    if (encapsulatorRequestCount === 0) return
    if (encapsulatorRequestCount === lastRequestCount.current) return
    lastRequestCount.current = encapsulatorRequestCount
    // 仅当选中节点 ≥ 2 时才打开
    const ids =
      selectedNodeIds.length >= 2
        ? selectedNodeIds
        : groupingSelection.length >= 2
          ? groupingSelection
          : []
    if (ids.length < 2) {
      toast.warning('请先选择至少 2 个节点')
      return
    }
    // 用微任务避免 effect 内同步 setState
    queueMicrotask(() => {
      setFunctionName(`func_${ids.length}`)
      setColor('cyan')
      setDialogOpen(true)
    })
  }, [encapsulatorRequestCount, selectedNodeIds, groupingSelection])

  /* 有效的选中节点 ID 列表（selectedNodeIds 优先，否则用 groupingSelection） */
  const effectiveIds = useMemo(() => {
    if (selectedNodeIds.length >= 2) return selectedNodeIds
    if (groupingSelection.length >= 2) return groupingSelection
    return []
  }, [selectedNodeIds, groupingSelection])

  /* 推断端口（仅 Dialog 打开时计算） */
  const inferred = useMemo(() => {
    if (!dialogOpen || effectiveIds.length === 0) {
      return { inputs: [], outputs: [] }
    }
    return inferPorts(effectiveIds, nodes, edges)
  }, [dialogOpen, effectiveIds, nodes, edges])

  /* 是否显示浮动按钮（2+ 节点选中且未打开 Dialog） */
  const showButton = effectiveIds.length >= 2 && !dialogOpen

  const handleOpen = () => {
    setFunctionName(`func_${effectiveIds.length}`)
    setColor('cyan')
    setDialogOpen(true)
  }

  const handleConfirm = () => {
    if (!functionName.trim()) {
      toast.error('请输入函数名')
      return
    }
    const id = encapsulateToFunction(functionName.trim(), color, effectiveIds)
    if (id) {
      toast.success('已封装为函数节点', {
        description: `${functionName.trim()} · ${effectiveIds.length} 个子节点`,
      })
      setDialogOpen(false)
    } else {
      toast.error('封装失败：未选中任何节点')
    }
  }

  const handleCancel = () => {
    setDialogOpen(false)
  }

  return (
    <>
      {/* 浮动按钮（多选时显示） */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={handleOpen}
            className={cn(
              'pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2',
              'flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5',
              'text-xs font-medium text-cyan-200 shadow-lg backdrop-blur-md',
              'transition-colors hover:bg-cyan-500/20 hover:text-cyan-100',
            )}
            title="将选中的节点封装为可复用的函数节点"
          >
            <FunctionSquare className="h-3.5 w-3.5" />
            <span>封装为函数节点</span>
            <span className="ml-1 rounded-full bg-cyan-500/20 px-1.5 py-px text-[10px]">
              {effectiveIds.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 封装对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FunctionSquare className="h-4 w-4 text-cyan-400" />
              封装为函数节点
            </DialogTitle>
            <DialogDescription>
              将选中的 {effectiveIds.length} 个节点封装为可复用的函数节点。
              <br />
              封装后这些节点将移入函数内部，可在函数节点中双击查看。
            </DialogDescription>
          </DialogHeader>

          {/* 表单 */}
          <div className="space-y-4">
            {/* 函数名 */}
            <div className="space-y-1.5">
              <Label htmlFor="function-name" className="text-xs">
                函数名
              </Label>
              <Input
                id="function-name"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder="如 calculateDamage"
                className="h-9 font-mono text-sm"
                autoFocus
              />
            </div>

            {/* 颜色选择 */}
            <div className="space-y-1.5">
              <Label className="text-xs">颜色</Label>
              <div className="flex items-center gap-2">
                {FUNCTION_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform',
                      color === c.name
                        ? 'scale-110 border-foreground'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: c.hex }}
                    aria-label={`选择颜色 ${c.label}`}
                    title={c.label}
                  >
                    {color === c.name && (
                      <Check className="h-3.5 w-3.5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 端口预览 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">端口预览</Label>
                <span className="text-[10px] text-muted-foreground">
                  自动从连线推断
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 输入端口 */}
                <div className="rounded-md border border-border bg-muted/30 p-2">
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <ChevronDown className="h-3 w-3 rotate-90" />
                    输入 ({inferred.inputs.length})
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto nexcube-scroll">
                    {inferred.inputs.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1.5 rounded bg-background/60 px-1.5 py-1"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: portHex(p.dataType) }}
                        />
                        <span className="truncate text-[11px] text-foreground">
                          {p.label}
                        </span>
                        <span className="ml-auto text-[9px] text-muted-foreground">
                          {p.dataType}
                        </span>
                      </div>
                    ))}
                    {inferred.inputs.length === 0 && (
                      <p className="text-[10px] text-muted-foreground">无</p>
                    )}
                  </div>
                </div>

                {/* 输出端口 */}
                <div className="rounded-md border border-border bg-muted/30 p-2">
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <ChevronDown className="h-3 w-3 -rotate-90" />
                    输出 ({inferred.outputs.length})
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto nexcube-scroll">
                    {inferred.outputs.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1.5 rounded bg-background/60 px-1.5 py-1"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: portHex(p.dataType) }}
                        />
                        <span className="truncate text-[11px] text-foreground">
                          {p.label}
                        </span>
                        <span className="ml-auto text-[9px] text-muted-foreground">
                          {p.dataType}
                        </span>
                      </div>
                    ))}
                    {inferred.outputs.length === 0 && (
                      <p className="text-[10px] text-muted-foreground">无</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-3.5 w-3.5" />
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              <Check className="h-3.5 w-3.5" />
              确认封装
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
