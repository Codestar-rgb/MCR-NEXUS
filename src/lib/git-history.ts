/**
 * Git 历史保护（mock）（Task 4-D）
 *
 * 目标：
 *  - 在 NexCube 工作区模拟 Git 的 commit / log / diff 行为
 *  - 不真实执行 git 命令（避免污染用户本地仓库）
 *  - 阶段 5+ 可由 Electron 端切换为真实 git 调用
 *
 * 用途：
 *  - 导出 ZIP 时自动 commit 一条 "Export xxx"
 *  - 代码视图编辑后 commit "Code change"
 *  - 属性面板批量修改后 commit "Update properties"
 *  - UI 可显示「最近提交」列表（替代本地 git log）
 *
 * 不做的事：
 *  - 不创建分支 / 不合并 / 不推送
 *  - 不持久化（仅内存，刷新页面后丢失）
 *  - 不存储完整文件内容快照（仅记录路径 + hash 占位）
 */

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

export interface GitCommit {
  /** 提交 ID（mock 格式：commit_<base36 timestamp>_<rand>） */
  id: string
  /** 提交消息 */
  message: string
  /** 时间戳（ms） */
  timestamp: number
  /** 变更的文件路径列表 */
  files: string[]
  /** 作者名（NexCube 不接真实 git config，固定为 "NexCube User"） */
  author: string
  /** 提交类型（决定 UI 图标颜色） */
  type: GitCommitType
  /** 文件 diff 统计（mock） */
  stats: { added: number; modified: number; deleted: number }
}

export type GitCommitType =
  | 'export' // ZIP 导出
  | 'code' // 代码编辑
  | 'property' // 属性面板修改
  | 'canvas' // 节点画布变更
  | 'manual' // 用户手动 commit
  | 'system' // 系统自动（如初始化）

export interface GitDiffResult {
  added: string[]
  modified: string[]
  deleted: string[]
  /** 总变更行数（mock） */
  totalChanges: number
}

/* ------------------------------------------------------------------ */
/* GitHistoryManager                                                   */
/* ------------------------------------------------------------------ */

export class GitHistoryManager {
  private commits: GitCommit[] = []
  private listeners: Array<(commits: GitCommit[]) => void> = []

  /** 创建一条 mock commit */
  commit(
    message: string,
    files: string[],
    type: GitCommitType = 'manual',
  ): GitCommit {
    const id = `commit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    const c: GitCommit = {
      id,
      message,
      timestamp: Date.now(),
      files: [...files],
      author: 'NexCube User',
      type,
      stats: {
        added: type === 'export' || type === 'system' ? files.length : 0,
        modified: type === 'code' || type === 'property' || type === 'canvas' ? files.length : 0,
        deleted: 0,
      },
    }
    this.commits.push(c)
    // 最多保留 100 条
    if (this.commits.length > 100) {
      this.commits = this.commits.slice(-100)
    }
    this.emit()
    return c
  }

  /** 倒序返回提交历史（最新在前） */
  log(limit?: number): GitCommit[] {
    const reversed = [...this.commits].reverse()
    return limit ? reversed.slice(0, limit) : reversed
  }

  /** 返回某次提交涉及的文件 */
  filesOf(commitId: string): string[] {
    return this.commits.find((c) => c.id === commitId)?.files ?? []
  }

  /** mock diff（不真实计算文件内容差异） */
  diff(commitId: string): GitDiffResult {
    const c = this.commits.find((x) => x.id === commitId)
    if (!c) {
      return { added: [], modified: [], deleted: [], totalChanges: 0 }
    }
    if (c.type === 'export' || c.type === 'system') {
      return { added: [...c.files], modified: [], deleted: [], totalChanges: c.files.length }
    }
    if (c.type === 'manual' && c.stats.deleted > 0) {
      return { added: [], modified: [], deleted: [...c.files], totalChanges: c.files.length }
    }
    return { added: [], modified: [...c.files], deleted: [], totalChanges: c.files.length }
  }

  /** 回退到指定 commit（mock：删除该 commit 之后的所有记录） */
  resetTo(commitId: string): boolean {
    const idx = this.commits.findIndex((c) => c.id === commitId)
    if (idx < 0) return false
    this.commits = this.commits.slice(0, idx + 1)
    this.emit()
    return true
  }

  /** 清空历史 */
  clear(): void {
    this.commits = []
    this.emit()
  }

  /** 订阅历史变更（用于 UI 自动刷新） */
  subscribe(listener: (commits: GitCommit[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const i = this.listeners.indexOf(listener)
      if (i >= 0) this.listeners.splice(i, 1)
    }
  }

  private emit(): void {
    const snapshot = this.log()
    for (const l of this.listeners) {
      try {
        l(snapshot)
      } catch (err) {
        console.error('[GitHistory] listener error:', err)
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 单例 + 便捷工具                                                     */
/* ------------------------------------------------------------------ */

export const gitHistory = new GitHistoryManager()

/** 初始化一条系统 commit（应用启动时由 UI 调用一次） */
export function initGitHistory(projectName: string): GitCommit {
  return gitHistory.commit(`Initialize NexCube project: ${projectName}`, ['README.md'], 'system')
}

/** 格式化时间戳为相对描述（如 "5 分钟前"） */
export function formatRelativeTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts)
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

/** 根据 commit type 返回 UI 标签颜色（Tailwind 类名片段） */
export function commitTypeColor(type: GitCommitType): string {
  switch (type) {
    case 'export':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    case 'code':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
    case 'property':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'canvas':
      return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
    case 'manual':
      return 'bg-teal-500/15 text-teal-300 border-teal-500/30'
    case 'system':
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  }
}
