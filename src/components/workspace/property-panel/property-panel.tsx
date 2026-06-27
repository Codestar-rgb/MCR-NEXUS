'use client'

/**
 * 右侧属性面板（阶段 3 完整版）
 *
 * - 顶部 header：动态标题（根据选中节点类型切换）
 * - Tabs：[基础属性] [行为逻辑]
 *   - 基础属性：PropertyForm（Schema 驱动真实表单 + 实时同步）
 *   - 行为逻辑：SubgraphEditor（嵌套 React Flow 画布）
 *     - 仅当节点 supportsSubLogic=true 时显示 Tab
 * - 没选中节点时：空状态插画
 * - 底部：贴图纹理拖拽上传区（TextureField 已在 PropertyForm 内，此处保留快捷入口）
 */

import * as React from 'react'
import { useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { MousePointerClick } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasStore } from '@/stores/canvas'
import { useI18n } from '@/hooks/use-i18n'
import { getNodeTypeDefinition } from '@/lib/node-system'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PropertyForm } from './property-form'
import {
  SubgraphEditor,
  SubgraphEditorEmpty,
} from '@/components/workspace/property-panel/subgraph-editor'

const TYPE_LABEL: Record<string, string> = {
  entity: '实体属性',
  block: '方块属性',
  item: '物品属性',
  equipment: '装备属性',
  weapon: '武器属性',
  food: '食物属性',
  biome: '群系属性',
  structure: '结构属性',
  dimension: '维度属性',
  potion: '药水属性',
  group: '节点组属性',
  blackbox: '黑盒代码',
  function: '函数节点',
  recipe: '配方属性',
  logic_event: '事件节点',
  logic_condition: '条件节点',
  logic_loop: '循环节点',
  logic_action: '动作节点',
  logic_variable: '变量节点',
  debug_log: '日志节点',
  debug_breakpoint: '断点节点',
}

const TYPE_COLOR: Record<string, string> = {
  entity: 'text-rose-300',
  block: 'text-amber-300',
  item: 'text-teal-300',
  equipment: 'text-orange-300',
  weapon: 'text-red-300',
  food: 'text-lime-300',
  biome: 'text-emerald-300',
  structure: 'text-stone-300',
  dimension: 'text-purple-300',
  potion: 'text-pink-300',
  group: 'text-slate-300',
  blackbox: 'text-zinc-300',
  function: 'text-cyan-300',
  recipe: 'text-orange-300',
  logic_event: 'text-amber-300',
  logic_condition: 'text-cyan-300',
  logic_loop: 'text-teal-300',
  logic_action: 'text-violet-300',
  logic_variable: 'text-emerald-300',
  debug_log: 'text-sky-300',
  debug_breakpoint: 'text-rose-300',
}

export function PropertyPanel() {
  const width = useWorkspaceStore((s) => s.rightPanelWidth)
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId)
  const selectedNodeName = useWorkspaceStore((s) => s.selectedNodeName)
  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)

  const nodes = useCanvasStore((s) => s.nodes)
  const updateNode = useCanvasStore((s) => s.updateNode)
  const { t } = useI18n()

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId],
  )

  const nodeDef = useMemo(() => {
    if (!selectedNode) return null
    return getNodeTypeDefinition(selectedNode.data.kind) ?? null
  }, [selectedNode])

  const hasSelection = !!selectedNode
  const kind = selectedNode?.data.kind ?? ''
  const typeLabel = TYPE_LABEL[kind] ?? '节点属性'
  const typeColor = TYPE_COLOR[kind] ?? 'text-foreground'
  const supportsSubLogic = nodeDef?.supportsSubLogic === true

  const headerTitle = hasSelection
    ? `${typeLabel} - ${selectedNodeName ?? selectedNode.data.title}`
    : t('property.title')

  const defaultTab = 'basic'

  // 属性变更：立即更新 store + 保存状态反馈
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePropertyChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return
      const newProperties = { ...selectedNode.data.properties, [key]: value }
      updateNode(selectedNode.id, {
        data: { ...selectedNode.data, properties: newProperties },
      })
      if (key === 'name') {
        updateNode(selectedNode.id, {
          data: { ...selectedNode.data, properties: newProperties, title: String(value) },
        })
        setSelectedNode(selectedNode.id, kind as 'entity' | 'block' | 'item' | null, String(value))
      }
      // 保存状态反馈：saving → saved → idle
      setSaveState('saving')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        setSaveState('saved')
        saveTimerRef.current = setTimeout(() => setSaveState('idle'), 1200)
      }, 600)
    },
    [selectedNode, updateNode, kind, setSelectedNode],
  )

  // 卸载时清理定时器
  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return (
    <aside
      style={{ width }}
      className="flex h-full shrink-0 flex-col border-l border-border bg-card/40"
      aria-label="右侧属性面板"
    >
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold text-foreground">{headerTitle}</h2>
          {hasSelection && (
            <SaveIndicator state={saveState} />
          )}
        </div>
        {!hasSelection && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t('property.selectNode')}</p>
        )}
        {hasSelection && (
          <p className={cn('mt-0.5 text-[11px] font-medium', typeColor)}>
            当前选中：{selectedNodeName ?? selectedNode.data.title}
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto nexcube-scroll">
        {hasSelection ? (
          <Tabs defaultValue={defaultTab} className="flex flex-col gap-0">
            <div className="border-b border-border px-3 pt-3">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="basic" className="text-xs">
                  {t('property.basic')}
                </TabsTrigger>
                {supportsSubLogic && (
                  <TabsTrigger value="behavior" className="text-xs">
                    {t('property.behavior')}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="basic" className="m-0 p-3">
              <PropertyForm
                nodeKind={kind}
                properties={selectedNode.data.properties ?? {}}
                onChange={handlePropertyChange}
              />
            </TabsContent>

            {supportsSubLogic && selectedNodeId && (
              <TabsContent value="behavior" className="m-0 p-3">
                <SubgraphEditor
                  parentNodeId={selectedNodeId}
                  parentNodeName={selectedNodeName ?? selectedNode.data.title}
                  parentNodeKind={selectedNode.data.kind}
                  height={420}
                />
              </TabsContent>
            )}

            {!supportsSubLogic && (
              <TabsContent value="behavior" className="m-0 p-4">
                <SubgraphEditorEmpty />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30"
            >
              <MousePointerClick className="h-7 w-7 text-muted-foreground/60" />
            </motion.div>
            <div>
              <p className="text-xs font-medium text-foreground">{t('property.selectNode')}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t('property.clickHint')}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

/** 保存状态指示器 */
function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'saved' }) {
  if (state === 'idle') return null
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium',
        state === 'saving'
          ? 'bg-amber-500/10 text-amber-400'
          : 'bg-emerald-500/10 text-emerald-400',
      )}
    >
      {state === 'saving' ? (
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          保存中
        </>
      ) : (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          已保存
        </>
      )}
    </motion.span>
  )
}
