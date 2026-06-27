'use client'

/**
 * 全局 Error Boundary（根级）
 *
 * 捕获 layout.tsx 及更上层的错误（如 hydration 失败、CSS 加载错误）。
 * 必须包含完整的 html/body 结构，因为它替换整个文档。
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#0a0a0f',
          color: '#f4f4f5',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '28px' }}>⚠</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
            应用崩溃
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 24px', lineHeight: 1.6 }}>
            NexCube 遇到了严重错误。你的项目数据已自动保存。请尝试刷新页面，或返回主页继续工作。
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
                color: '#0a0a0f',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↻ 重试
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#f4f4f5',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              ⌂ 返回主页
            </button>
          </div>
          {error.digest && (
            <p style={{ marginTop: '16px', fontSize: '10px', color: 'rgba(161,161,170,0.4)', fontFamily: 'monospace' }}>
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
