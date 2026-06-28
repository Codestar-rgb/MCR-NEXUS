'use client'

/**
 * MC 原版贴图选择器
 *
 * 在贴图上传字段旁显示常用 MC 原版物品的图标，
 * 用户可以点击选择作为节点的贴图引用（而非上传自定义贴图）。
 *
 * 数据来源：mcicons.ccleaf.com
 */

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { getMCIconUrl, MCICONS_BASE } from '@/lib/mc-icons'
import { cn } from '@/lib/utils'

/** 常用 MC 物品列表（按分类） */
const COMMON_ITEMS: Record<string, string[]> = {
  '矿物': ['diamond', 'iron_ingot', 'gold_ingot', 'netherite_ingot', 'emerald', 'coal', 'redstone', 'lapis_lazuli'],
  '食物': ['apple', 'bread', 'cooked_beef', 'golden_apple', 'cake', 'cookie', 'sweet_berries'],
  '武器': ['diamond_sword', 'netherite_sword', 'iron_sword', 'bow', 'crossbow', 'trident', 'arrow'],
  '盔甲': ['diamond_helmet', 'diamond_chestplate', 'diamond_leggings', 'diamond_boots', 'shield'],
  '方块': ['diamond_block', 'iron_block', 'gold_block', 'cobblestone', 'stone', 'oak_log', 'oak_planks'],
  '工具': ['diamond_pickaxe', 'iron_pickaxe', 'diamond_axe', 'iron_axe', 'fishing_rod', 'flint_and_steel'],
  '红石': ['redstone', 'redstone_torch', 'lever', 'repeater', 'comparator', 'redstone_block'],
  '其他': ['book', 'enchanted_book', 'paper', 'compass', 'clock', 'map', 'bucket', 'water_bucket'],
}

interface MCTexturePickerProps {
  /** 当前选中的物品 ID（如 'minecraft:diamond'） */
  selectedItemId: string | null
  /** 选择回调 */
  onSelect: (itemId: string) => void
  /** 关闭回调 */
  onClose: () => void
}

export function MCTexturePicker({ selectedItemId, onSelect, onClose }: MCTexturePickerProps) {
  const [search, setSearch] = React.useState('')
  const [failedIcons, setFailedIcons] = React.useState<Set<string>>(new Set())

  // 搜索结果
  const searchResults = React.useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const all = Object.values(COMMON_ITEMS).flat()
    return all.filter((id) => id.includes(q)).slice(0, 20)
  }, [search])

  const markFailed = (id: string) => {
    setFailedIcons((prev) => new Set(prev).add(id))
  }

  return (
    <div className="space-y-3">
      {/* 标题 + 搜索 */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-foreground">MC 原版贴图</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索物品..."
          className="h-7 w-full rounded-md border border-border/40 bg-card/30 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
        />
      </div>

      {/* 搜索结果 */}
      {searchResults ? (
        <div className="grid grid-cols-6 gap-1">
          {searchResults.map((id) => {
            const url = getMCIconUrl(`minecraft:${id}`)
            const isSelected = selectedItemId === `minecraft:${id}`
            return (
              <button
                key={id}
                onClick={() => onSelect(`minecraft:${id}`)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded border transition-colors',
                  isSelected ? 'border-primary bg-primary/10' : 'border-border/30 bg-card/20 hover:border-primary/30',
                )}
                title={id}
              >
                {url && !failedIcons.has(id) ? (
                  <img
                    src={url}
                    alt={id}
                    onError={() => markFailed(id)}
                    className="h-6 w-6"
                    style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                ) : (
                  <span className="text-[7px] font-mono text-muted-foreground">{id.slice(0, 4)}</span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        /* 分类网格 */
        <div className="space-y-2 nexcube-scroll max-h-48 overflow-y-auto">
          {Object.entries(COMMON_ITEMS).map(([category, items]) => (
            <div key={category}>
              <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
                {category}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {items.map((id) => {
                  const url = getMCIconUrl(`minecraft:${id}`)
                  const isSelected = selectedItemId === `minecraft:${id}`
                  return (
                    <button
                      key={id}
                      onClick={() => onSelect(`minecraft:${id}`)}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded border transition-colors',
                        isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-primary/30 hover:bg-card/40',
                      )}
                      title={id}
                    >
                      {url && !failedIcons.has(id) ? (
                        <img
                          src={url}
                          alt={id}
                          onError={() => markFailed(id)}
                          className="h-5 w-5"
                          style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                        />
                      ) : (
                        <span className="text-[7px] font-mono text-muted-foreground/40">{id.slice(0, 3)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提示 */}
      <p className="text-[9px] text-muted-foreground/40">
        💡 图标来源 mcicons.ccleaf.com。选择后将物品 ID 填入字段。
      </p>
    </div>
  )
}
