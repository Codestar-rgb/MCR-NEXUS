'use client'

/**
 * 批量编辑面板
 *
 * 当用户选中多个节点时，属性面板显示此组件替代单节点编辑。
 * 功能：
 *  - 显示选中节点数量 + 类型分布
 *  - 批量修改共享属性（如同类节点的 registryId 前缀、rarity 等）
 *  - 批量删除/克隆/分组
 *
 * 共享属性判断：只显示所有选中节点都有的属性 key。
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Layers, Trash2, CopyPlus, Group as GroupIcon, Edit3 } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas'
import { useClipboardStore } from '@/stores/clipboard'
import { getNodeTypeDefinition, type PropertySchema } from '@/lib/node-system'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BatchEditPanelProps {
  /** 选中的节点 ID 列表 */
  selectedIds: string[]
}

export function BatchEditPanel({ selectedIds }: BatchEditPanelProps) {
  const nodes = useCanvasStore((s) => s.nodes)
  const removeNodes = useCanvasStore((s) => s.removeNodes)
  const cloneNodeById = useCanvasStore((s) => s.cloneNodeById)
  const groupSelected = useCanvasStore((s) => s.groupSelected)
  const updateNode = useCanvasStore((s) => s.updateNode)

  const selectedNodes = React.useMemo(
    () => nodes.filter((n) => selectedIds.includes(n.id)),
    [nodes, selectedIds],
  )

  // 类型分布统计
  const typeStats = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const n of selectedNodes) {
      map.set(n.data.kind, (map.get(n.data.kind) ?? 0) + 1)
    }
    return Array.from(map.entries())
  }, [selectedNodes])

  // 找出所有选中节点共享的属性 schema（同类型节点才有）
  const sharedSchemas = React.useMemo(() => {
    if (selectedNodes.length === 0) return []
    const firstDef = getNodeTypeDefinition(selectedNodes[0].data.kind)
    if (!firstDef) return []

    // 检查所有节点是否同类型
    const allSameType = selectedNodes.every((n) => n.data.kind === selectedNodes[0].data.kind)
    if (!allSameType) return []

    // 返回该类型的所有属性 schema
    return firstDef.propertiesSchema.filter((s) => s.key !== 'name' && s.key !== 'registryId')
  }, [selectedNodes])

  // 批量删除
  const handleBatchDelete = () => {
    if (!window.confirm(`确认删除 ${selectedIds.length} 个节点？`)) return
    removeNodes(selectedIds)
    toast.success(`已删除 ${selectedIds.length} 个节点`)
  }

  // 批量克隆
  const handleBatchClone = () => {
    useClipboardStore.getState().pushUndo(nodes, useCanvasStore.getState().edges, '批量克隆')
    let count = 0
    for (const id of selectedIds) {
      const cloned = cloneNodeById(id)
      if (cloned) count++
    }
    toast.success(`已克隆 ${count} 个节点`)
  }

  // 批量分组
  const handleBatchGroup = () => {
    const groupId = groupSelected('批量分组', 'slate')
    if (groupId) {
      toast.success(`已将 ${selectedIds.length} 个节点打包为节点组`)
    }
  }

  // 批量修改属性
  const handleBatchPropertyChange = (key: string, value: unknown) => {
    for (const node of selectedNodes) {
      const newProperties = { ...node.data.properties, [key]: value }
      updateNode(node.id, {
        data: { ...node.data, properties: newProperties },
      })
    }
    toast.success(`已批量修改 ${selectedNodes.length} 个节点的属性`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 p-3"
    >
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
          <Layers className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">批量编辑</p>
          <p className="text-[10px] text-muted-foreground">
            已选中 {selectedIds.length} 个节点
          </p>
        </div>
      </div>

      {/* 类型分布 */}
      <div className="rounded-lg border border-border/30 bg-card/20 p-2.5">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          类型分布
        </p>
        <div className="flex flex-wrap gap-1.5">
          {typeStats.map(([kind, count]) => {
            const def = getNodeTypeDefinition(kind)
            return (
              <span
                key={kind}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {def?.label ?? kind} ×{count}
              </span>
            )
          })}
        </div>
      </div>

      {/* 批量操作按钮 */}
      <div className="grid grid-cols-3 gap-1.5">
        <ActionButton
          icon={CopyPlus}
          label="克隆"
          onClick={handleBatchClone}
          colorClass="hover:border-cyan-500/40 hover:text-cyan-400"
        />
        <ActionButton
          icon={GroupIcon}
          label="分组"
          onClick={handleBatchGroup}
          colorClass="hover:border-violet-500/40 hover:text-violet-400"
        />
        <ActionButton
          icon={Trash2}
          label="删除"
          onClick={handleBatchDelete}
          colorClass="hover:border-red-500/40 hover:text-red-400"
        />
      </div>

      {/* 批量属性编辑（仅同类型节点） */}
      {sharedSchemas.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 border-t border-border/20 pt-2">
            <Edit3 className="h-3 w-3 text-primary" />
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              批量属性（{sharedSchemas.length} 个共享属性）
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            修改将应用到所有 {selectedNodes.length} 个{getNodeTypeDefinition(selectedNodes[0].data.kind)?.label ?? ''}节点
          </p>

          {/* 显示共享属性列表（简化版，点击展开编辑） */}
          <div className="space-y-1">
            {sharedSchemas.slice(0, 6).map((schema) => (
              <BatchPropertyRow
                key={schema.key}
                schema={schema}
                nodes={selectedNodes}
                onChange={(value) => handleBatchPropertyChange(schema.key, value)}
              />
            ))}
            {sharedSchemas.length > 6 && (
              <p className="text-[9px] text-muted-foreground/40">
                还有 {sharedSchemas.length - 6} 个属性可在单选节点时编辑
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/30 bg-muted/10 p-3 text-center">
          <p className="text-[11px] text-muted-foreground/60">
            {selectedNodes.length > 0 && selectedNodes.every((n) => n.data.kind === selectedNodes[0].data.kind)
              ? '该类型节点无可批量编辑的属性'
              : '选中同类型节点可批量编辑属性'}
          </p>
        </div>
      )}
    </motion.div>
  )
}

/** 操作按钮 */
function ActionButton({
  icon: Icon,
  label,
  onClick,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  colorClass: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border border-border/30 bg-card/30 py-2 text-[10px] font-medium text-muted-foreground transition-colors',
        colorClass,
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

/** 批量属性行（显示当前值，点击修改） */
function BatchPropertyRow({
  schema,
  nodes,
  onChange,
}: {
  schema: PropertySchema
  nodes: ReturnType<typeof useCanvasStore.getState>['nodes']
  onChange: (value: unknown) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState('')

  // 获取所有节点的当前值
  const values = React.useMemo(() => {
    return nodes.map((n) => n.data.properties?.[schema.key])
  }, [nodes, schema.key])

  // 检查值是否一致
  const allSame = values.every((v) => v === values[0])
  const currentValue = values[0] ?? schema.defaultValue

  const handleSave = () => {
    if (schema.type === 'number') {
      onChange(Number(value) || 0)
    } else if (schema.type === 'boolean') {
      onChange(value === 'true')
    } else {
      onChange(value)
    }
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/20 bg-card/20 px-2 py-1.5">
      <span className="text-[11px] text-muted-foreground">{schema.label}</span>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type={schema.type === 'number' ? 'number' : 'text'}
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder={String(currentValue)}
            className="w-20 rounded border border-border/40 bg-background px-1.5 py-0.5 text-[10px] focus:border-primary/40 focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary hover:bg-primary/20"
          >
            应用
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setValue(String(currentValue))
            setEditing(true)
          }}
          className={cn(
            'font-mono text-[10px] hover:text-primary',
            allSame ? 'text-foreground/70' : 'text-amber-400',
          )}
          title={allSame ? '所有节点值相同' : '节点值不一致，点击统一'}
        >
          {allSame
            ? String(currentValue)
            : `${values.filter((v) => v === values[0]).length}/${values.length} 一致`}
        </button>
      )}
    </div>
  )
}
