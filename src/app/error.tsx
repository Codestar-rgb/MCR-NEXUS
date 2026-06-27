'use client'

/**
 * 路由级 Error Boundary
 *
 * 捕获 src/app 路由树内的运行时错误，避免整个应用白屏。
 * 提供重试 + 返回主页 + 查看错误详情。
 */

import * as React from 'react'
import { AlertTriangle, RotateCcw, Home, Bug } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = React.useState(false)

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        {/* 图标 */}
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full bg-destructive/10 blur-2xl" aria-hidden />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* 标题 */}
        <div>
          <h1 className="text-xl font-bold text-foreground">出错了</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            应用遇到了意外错误。你的项目数据已自动保存，可以尝试重试或返回主页。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重试
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/40 px-4 py-2 text-[13px] font-medium text-foreground hover:border-primary/40"
          >
            <Home className="h-3.5 w-3.5" />
            返回主页
          </button>
        </div>

        {/* 错误详情 */}
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground"
        >
          <Bug className="h-3 w-3" />
          {showDetails ? '隐藏' : '查看'}错误详情
        </button>
        {showDetails && (
          <div className="w-full rounded-lg border border-border/40 bg-card/30 p-3 text-left">
            <p className="mb-1 font-mono text-[11px] text-destructive">{error.name}: {error.message}</p>
            {error.digest && (
              <p className="mb-1 font-mono text-[10px] text-muted-foreground/50">digest: {error.digest}</p>
            )}
            {error.stack && (
              <pre className="nexcube-scroll max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground/70">
                {error.stack.slice(0, 800)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
