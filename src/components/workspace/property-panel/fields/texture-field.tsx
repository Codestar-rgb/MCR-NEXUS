'use client'

/**
 * TextureField — 贴图上传字段
 *
 * 用于 PropertySchema.type === 'texture'，存储 base64 字符串。
 *
 * 交互：
 *  - 拖拽 PNG/JPG 到上传区
 *  - 或点击上传区唤起系统文件选择
 *  - 上传后显示圆角预览图 + 文件名 + 删除按钮
 *
 * 限制：
 *  - 最大 512KB
 *  - 仅 PNG / JPG / JPEG
 *  - 转 base64 存入 properties.texture
 */

import { useCallback, useRef, useState } from 'react'
import { Image as ImageIcon, UploadCloud, X, AlertCircle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FieldProps } from './field-types'
import { MCTexturePicker } from './mc-texture-picker'

const MAX_SIZE_BYTES = 512 * 1024 // 512 KB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg']

interface TextureMeta {
  /** base64 data URL（含 mime 前缀，可直接作为 <img src>） */
  dataUrl: string
  /** 原始文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
}

export function TextureField({ schema, value, onChange }: FieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = parseTextureValue(value)

  const processFile = useCallback(
    (file: File) => {
      setError(null)

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('仅支持 PNG / JPG 格式')
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`文件过大（${(file.size / 1024).toFixed(0)} KB），上限 512 KB`)
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        if (typeof dataUrl !== 'string') return
        const next: TextureMeta = {
          dataUrl,
          name: file.name,
          size: file.size,
        }
        onChange(JSON.stringify(next))
      }
      reader.onerror = () => {
        setError('读取文件失败')
      }
      reader.readAsDataURL(file)
    },
    [onChange],
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // 重置 value 以便再次选择同一文件
    e.target.value = ''
  }

  function handleRemove() {
    setError(null)
    onChange(null)
  }

  const [showMCPicker, setShowMCPicker] = useState(false)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {schema.label}
        </span>
        <div className="flex items-center gap-2">
          {/* MC 原版贴图选择按钮 */}
          {!meta && (
            <button
              type="button"
              onClick={() => setShowMCPicker(!showMCPicker)}
              className={cn(
                'flex items-center gap-1 rounded text-[10px] transition-colors',
                showMCPicker ? 'text-primary' : 'text-muted-foreground hover:text-primary',
              )}
            >
              <Package className="h-3 w-3" />
              MC贴图
            </button>
          )}
          {meta && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 rounded text-[10px] text-muted-foreground transition-colors hover:text-rose-400"
              aria-label="移除贴图"
            >
              <X className="h-3 w-3" />
              移除
            </button>
          )}
        </div>
      </div>

      {meta ? (
        /* 已上传：圆角预览图 + 文件信息 */
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
            {/* 棋盘格背景，便于查看透明 PNG */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)',
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
              }}
            />
            <img
              src={meta.dataUrl}
              alt={meta.name}
              className="relative h-32 w-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ImageIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{meta.name}</span>
            <span className="shrink-0 text-muted-foreground/60">
              · {(meta.size / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      ) : (
        /* 空状态：拖拽 / 点击上传 */
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/20 transition-all',
            isDragging
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-primary/40 hover:bg-muted/40',
          )}
        >
          <UploadCloud
            className={cn(
              'h-5 w-5 transition-colors',
              isDragging ? 'text-primary' : 'text-muted-foreground/70',
            )}
          />
          <span className="text-[11px] text-muted-foreground">
            {isDragging ? '松开以上传' : '拖拽贴图到此 / 点击选择'}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            PNG · JPG · ≤ 512 KB
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </button>
      )}

      {error && (
        <div className="flex items-center gap-1.5 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      {/* MC 原版贴图选择器 */}
      {showMCPicker && !meta && (
        <div className="rounded-lg border border-border/30 bg-card/20 p-2.5">
          <MCTexturePicker
            selectedItemId={null}
            onSelect={(itemId) => {
              // 将 MC 物品 ID 存为字符串（非 base64）
              onChange(itemId)
              setShowMCPicker(false)
            }}
            onClose={() => setShowMCPicker(false)}
          />
        </div>
      )}

      {schema.description && !meta && !error && (
        <p className="text-[10px] leading-tight text-muted-foreground/60">
          {schema.description}
        </p>
      )}
    </div>
  )
}

/** 解析 properties.texture 值为 TextureMeta */
function parseTextureValue(value: unknown): TextureMeta | null {
  if (!value || typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value) as TextureMeta
    if (
      typeof parsed.dataUrl === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.size === 'number'
    ) {
      return parsed
    }
    return null
  } catch {
    // 兼容旧数据：直接是 base64 data URL
    if (value.startsWith('data:image/')) {
      return { dataUrl: value, name: 'texture', size: 0 }
    }
    return null
  }
}
