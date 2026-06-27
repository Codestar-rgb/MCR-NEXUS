/**
 * NexCube 能力层 — Electron 实现（占位，未来实现）
 *
 * 当前没有 Electron 环境，这些代码不会被执行，但写得完整正确，
 * 作为 Electron 桌面外壳（阶段 7）的代码资产。
 *
 * 设计原则：
 *   - 所有 IPC 调用都通过 window.nexcube（preload 暴露的 contextBridge API）
 *   - 事件流转换为与 web.ts 一致的回调式句柄
 *   - 错误格式统一为 CapabilityError
 *
 * 当 Electron 启用时，前端代码无需任何修改，仅 index.ts 自动切换实现。
 */

import type {
  BuildCapability,
  BuildHandle,
  Capabilities,
  DirEntry,
  EnvCapability,
  FileStat,
  FsCapability,
  FsWatchEvent,
  GradleOptions,
  JdkCapability,
  JdkInfo,
  JdkInstallProgress,
  MirrorConfig,
  NetworkStatus,
  ParsedLogCard,
  ProcessCapability,
  ProcessHandle,
  ProcessInfo,
  ProcessOptions,
  SystemInfo,
  ToolStatus,
} from './types'
import { CapabilityError } from './types'
import { parseGradleLog } from './log-parser'

// =============================================================================
// window.nexcube 类型声明（preload 暴露的 IPC API 契约）
// =============================================================================
// 注：本声明同时通过全局 window 类型扩展（见文件末尾），
// 业务代码可直接使用 (window as any).nexcube.xxx，
// 此处声明用于能力层内部强类型调用。

/**
 * IPC 文件系统接口
 */
interface NexcubeFsIPC {
  read(path: string): Promise<string>
  readBuffer(path: string): Promise<number[]>
  write(path: string, content: string): Promise<void>
  writeBuffer(path: string, content: number[]): Promise<void>
  list(dir: string): Promise<Array<Omit<DirEntry, 'modifiedAt'> & { modifiedAt: number }>>
  exists(path: string): Promise<boolean>
  mkdir(path: string, recursive?: boolean): Promise<void>
  remove(path: string): Promise<void>
  rename(oldPath: string, newPath: string): Promise<void>
  stat(path: string): Promise<Omit<FileStat, 'createdAt' | 'modifiedAt'> & { createdAt: number; modifiedAt: number }>
  watch(path: string, callback: (event: FsWatchEvent) => void): Promise<() => void>
}

/**
 * IPC 构建接口
 */
interface NexcubeBuildIPC {
  runGradle(
    projectPath: string,
    task: string,
    options?: GradleOptions,
  ): Promise<{
    pid: number
    onOutput: (cb: (chunk: string) => void) => () => void
    onComplete: (cb: (code: number) => void) => () => void
    onError: (cb: (err: { message: string; stack?: string }) => void) => () => void
    kill: () => Promise<void>
  }>
  getAvailableTasks(projectPath: string): Promise<string[]>
}

/**
 * IPC JDK 接口
 */
interface NexcubeJdkIPC {
  detect(): Promise<JdkInfo | null>
  listInstalled(): Promise<JdkInfo[]>
  download(version: string, mirror: MirrorConfig): Promise<{
    url: string
    totalBytes: number
    downloadedBytes: number
    percent: number
    speed: number
    status: JdkInstallProgress['status']
    error?: string
    elapsedMs?: number
    onProgress: (cb: (p: JdkInstallProgress) => void) => () => void
  }>
  uninstall(jdkPath: string): Promise<void>
  setDefault(jdkPath: string): Promise<void>
}

/**
 * IPC 进程接口
 */
interface NexcubeProcessIPC {
  spawn(
    cmd: string,
    args: string[],
    options?: ProcessOptions,
  ): Promise<{
    pid: number
    onStdout: (cb: (chunk: string) => void) => () => void
    onStderr: (cb: (chunk: string) => void) => () => void
    onExit: (cb: (code: number) => void) => () => void
    kill: (signal?: string) => Promise<void>
  }>
  kill(pid: number): Promise<void>
  list(): Promise<ProcessInfo[]>
}

/**
 * IPC 环境检测接口
 */
interface NexcubeEnvIPC {
  detectJava(): Promise<ToolStatus>
  detectGit(): Promise<ToolStatus>
  detectGradle(): Promise<ToolStatus>
  detectNetwork(url: string): Promise<NetworkStatus>
  getSystemInfo(): Promise<SystemInfo>
}

/**
 * preload 完整 API
 */
interface NexcubeIPC {
  fs: NexcubeFsIPC
  build: NexcubeBuildIPC
  jdk: NexcubeJdkIPC
  process: NexcubeProcessIPC
  env: NexcubeEnvIPC
  /** 暴露的应用版本（来自 package.json） */
  version: string
  /** 平台标识，固定为 'electron' */
  platform: 'electron'
}

// =============================================================================
// 辅助：取 IPC 句柄
// =============================================================================

function ipc(): NexcubeIPC {
  if (typeof window === 'undefined') {
    throw new CapabilityError('ENOENV', 'Electron IPC 仅在浏览器/Electron 渲染进程可用', 'fs')
  }
  // 使用类型断言访问 window.nexcube
  const nexcube = (window as unknown as { nexcube?: NexcubeIPC }).nexcube
  if (!nexcube) {
    throw new CapabilityError('ENOIPC', 'window.nexcube 未注入（preload 未加载或被禁用）', 'fs')
  }
  return nexcube
}

/** 把 IPC 抛出的 unknown 错误统一为 CapabilityError */
function wrapError(
  module: 'fs' | 'build' | 'jdk' | 'process' | 'env',
  err: unknown,
  fallback: string,
): CapabilityError {
  if (err instanceof CapabilityError) return err
  const message = err instanceof Error ? err.message : String(err)
  return new CapabilityError('EIPC', `${fallback}: ${message}`, module, err)
}

// =============================================================================
// 文件系统能力
// =============================================================================

class ElectronFsCapability implements FsCapability {
  async read(path: string): Promise<string> {
    try {
      return await ipc().fs.read(path)
    } catch (err) {
      throw wrapError('fs', err, `读取文件失败 ${path}`)
    }
  }
  async readBuffer(path: string): Promise<Buffer> {
    try {
      const arr = await ipc().fs.readBuffer(path)
      return Buffer.from(arr)
    } catch (err) {
      throw wrapError('fs', err, `读取二进制失败 ${path}`)
    }
  }
  async write(path: string, content: string): Promise<void> {
    try {
      await ipc().fs.write(path, content)
    } catch (err) {
      throw wrapError('fs', err, `写入文件失败 ${path}`)
    }
  }
  async writeBuffer(path: string, content: Buffer): Promise<void> {
    try {
      // IPC 只能传可结构化克隆的数据，Buffer 转为 number[]
      await ipc().fs.writeBuffer(path, Array.from(content))
    } catch (err) {
      throw wrapError('fs', err, `写入二进制失败 ${path}`)
    }
  }
  async list(dir: string): Promise<DirEntry[]> {
    try {
      const items = await ipc().fs.list(dir)
      return items.map((i) => ({
        ...i,
        modifiedAt: new Date(i.modifiedAt),
      }))
    } catch (err) {
      throw wrapError('fs', err, `列出目录失败 ${dir}`)
    }
  }
  async exists(path: string): Promise<boolean> {
    try {
      return await ipc().fs.exists(path)
    } catch (err) {
      throw wrapError('fs', err, `检测存在失败 ${path}`)
    }
  }
  async mkdir(path: string, recursive?: boolean): Promise<void> {
    try {
      await ipc().fs.mkdir(path, recursive)
    } catch (err) {
      throw wrapError('fs', err, `创建目录失败 ${path}`)
    }
  }
  async remove(path: string): Promise<void> {
    try {
      await ipc().fs.remove(path)
    } catch (err) {
      throw wrapError('fs', err, `删除失败 ${path}`)
    }
  }
  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      await ipc().fs.rename(oldPath, newPath)
    } catch (err) {
      throw wrapError('fs', err, `重命名失败 ${oldPath} -> ${newPath}`)
    }
  }
  async stat(path: string): Promise<FileStat> {
    try {
      const s = await ipc().fs.stat(path)
      return {
        ...s,
        createdAt: new Date(s.createdAt),
        modifiedAt: new Date(s.modifiedAt),
      }
    } catch (err) {
      throw wrapError('fs', err, `获取元数据失败 ${path}`)
    }
  }
  watch(path: string, callback: (event: FsWatchEvent) => void): () => void {
    let unwatch: (() => void) | null = null
    let cancelled = false
    // IPC 的 watch 返回 Promise<取消函数>
    ipc()
      .fs.watch(path, (event) => {
        try {
          callback(event)
        } catch {
          // 忽略回调错误
        }
      })
      .then((un) => {
        if (cancelled) {
          // 在等待期间已取消，立即取消订阅
          un()
        } else {
          unwatch = un
        }
      })
      .catch((err) => {
        // 监听启动失败：仅打印，不抛出（避免阻塞 UI）
        console.error('[capability.fs.watch] 启动失败', err)
      })
    return () => {
      cancelled = true
      if (unwatch) {
        try {
          unwatch()
        } catch {
          // 忽略
        }
      }
    }
  }
}

// =============================================================================
// 构建能力
// =============================================================================

class ElectronBuildCapability implements BuildCapability {
  async runGradle(projectPath: string, task: string, options?: GradleOptions): Promise<BuildHandle> {
    let ipcHandle: Awaited<ReturnType<NexcubeBuildIPC['runGradle']>> | null = null
    try {
      ipcHandle = await ipc().build.runGradle(projectPath, task, options)
    } catch (err) {
      throw wrapError('build', err, `启动 Gradle 任务失败 ${task}`)
    }

    const outputCallbacks = new Set<(chunk: string) => void>()
    const completeCallbacks = new Set<(code: number) => void>()
    const errorCallbacks = new Set<(err: Error) => void>()

    const unsubscribeOutput = ipcHandle.onOutput((chunk) => {
      for (const cb of outputCallbacks) cb(chunk)
    })
    const unsubscribeComplete = ipcHandle.onComplete((code) => {
      handle.exited = true
      for (const cb of completeCallbacks) cb(code)
    })
    const unsubscribeError = ipcHandle.onError((err) => {
      const e = new Error(err.message)
      if (err.stack) e.stack = err.stack
      for (const cb of errorCallbacks) cb(e)
    })

    const handle: BuildHandle = {
      pid: ipcHandle.pid,
      exited: false,
      onOutput: (cb) => {
        outputCallbacks.add(cb)
      },
      onComplete: (cb) => {
        completeCallbacks.add(cb)
      },
      onError: (cb) => {
        errorCallbacks.add(cb)
      },
      kill: async () => {
        try {
          await ipcHandle.kill()
        } finally {
          unsubscribeOutput()
          unsubscribeComplete()
          unsubscribeError()
          handle.exited = true
        }
      },
    }
    return handle
  }

  parseLog(log: string): ParsedLogCard[] {
    // 解析逻辑与平台无关，直接复用 log-parser
    return parseGradleLog(log)
  }

  async getAvailableTasks(projectPath: string): Promise<string[]> {
    try {
      return await ipc().build.getAvailableTasks(projectPath)
    } catch (err) {
      throw wrapError('build', err, '获取 Gradle 任务列表失败')
    }
  }
}

// =============================================================================
// JDK 能力
// =============================================================================

class ElectronJdkCapability implements JdkCapability {
  async detect(): Promise<JdkInfo | null> {
    try {
      return await ipc().jdk.detect()
    } catch (err) {
      throw wrapError('jdk', err, '检测默认 JDK 失败')
    }
  }

  async listInstalled(): Promise<JdkInfo[]> {
    try {
      return await ipc().jdk.listInstalled()
    } catch (err) {
      throw wrapError('jdk', err, '列出已安装 JDK 失败')
    }
  }

  async download(version: string, mirror: MirrorConfig): Promise<JdkInstallProgress> {
    let ipcProgress: Awaited<ReturnType<NexcubeJdkIPC['download']>>
    try {
      ipcProgress = await ipc().jdk.download(version, mirror)
    } catch (err) {
      throw wrapError('jdk', err, `启动 JDK ${version} 下载失败`)
    }
    const callbacks = new Set<(p: JdkInstallProgress) => void>()
    const current: JdkInstallProgress = {
      url: ipcProgress.url,
      totalBytes: ipcProgress.totalBytes,
      downloadedBytes: ipcProgress.downloadedBytes,
      percent: ipcProgress.percent,
      speed: ipcProgress.speed,
      status: ipcProgress.status,
      error: ipcProgress.error,
      elapsedMs: ipcProgress.elapsedMs,
      onProgress: (cb) => {
        callbacks.add(cb)
      },
    }
    // 将 IPC 的进度事件桥接到 onProgress 注册的回调
    ipcProgress.onProgress((p) => {
      Object.assign(current, p)
      for (const cb of callbacks) cb({ ...current })
    })
    return current
  }

  async uninstall(jdkPath: string): Promise<void> {
    try {
      await ipc().jdk.uninstall(jdkPath)
    } catch (err) {
      throw wrapError('jdk', err, `卸载 JDK 失败 ${jdkPath}`)
    }
  }

  async setDefault(jdkPath: string): Promise<void> {
    try {
      await ipc().jdk.setDefault(jdkPath)
    } catch (err) {
      throw wrapError('jdk', err, `设置默认 JDK 失败 ${jdkPath}`)
    }
  }
}

// =============================================================================
// 进程能力
// =============================================================================

class ElectronProcessCapability implements ProcessCapability {
  spawn(cmd: string, args: string[], options?: ProcessOptions): ProcessHandle {
    // 同步返回句柄，内部异步初始化 IPC 句柄
    const stdoutQueue: string[] = []
    const stderrQueue: string[] = []
    const stdoutWaiters: Array<(v: IteratorResult<string>) => void> = []
    const stderrWaiters: Array<(v: IteratorResult<string>) => void> = []
    let stdoutDone = false
    let stderrDone = false
    let exitCode: number | null = null
    const exitResolvers: Array<(code: number) => void> = []

    let ipcHandle: Awaited<ReturnType<NexcubeProcessIPC['spawn']>> | null = null
    let killFn: ((signal?: string) => Promise<void>) | null = null

    // 异步获取 IPC 句柄
    const ready = (async () => {
      try {
        ipcHandle = await ipc().process.spawn(cmd, args, options)
        killFn = ipcHandle.kill
        ipcHandle.onStdout((chunk) => {
          if (stdoutWaiters.length > 0) {
            stdoutWaiters.shift()!({ value: chunk, done: false })
          } else {
            stdoutQueue.push(chunk)
          }
        })
        ipcHandle.onStderr((chunk) => {
          if (stderrWaiters.length > 0) {
            stderrWaiters.shift()!({ value: chunk, done: false })
          } else {
            stderrQueue.push(chunk)
          }
        })
        ipcHandle.onExit((code) => {
          stdoutDone = true
          stderrDone = true
          exitCode = code
          for (const w of stdoutWaiters) w({ value: undefined, done: true })
          for (const w of stderrWaiters) w({ value: undefined, done: true })
          for (const r of exitResolvers) r(code)
        })
        return true
      } catch (err) {
        // 启动失败：当作 stderr 推送错误并立即结束
        const msg = err instanceof Error ? err.message : String(err)
        stderrQueue.push(`[spawn failed] ${msg}\n`)
        stdoutDone = true
        stderrDone = true
        exitCode = -1
        for (const w of stdoutWaiters) w({ value: undefined, done: true })
        for (const w of stderrWaiters) w({ value: undefined, done: true })
        for (const r of exitResolvers) r(exitCode)
        return false
      }
    })()

    const stdoutIterator: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<string>> {
            if (stdoutQueue.length > 0) return Promise.resolve({ value: stdoutQueue.shift()!, done: false })
            if (stdoutDone) return Promise.resolve({ value: undefined, done: true })
            return new Promise((resolve) => stdoutWaiters.push(resolve))
          },
        }
      },
    }
    const stderrIterator: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<string>> {
            if (stderrQueue.length > 0) return Promise.resolve({ value: stderrQueue.shift()!, done: false })
            if (stderrDone) return Promise.resolve({ value: undefined, done: true })
            return new Promise((resolve) => stderrWaiters.push(resolve))
          },
        }
      },
    }

    return {
      pid: (ipcHandle as any)?.pid ?? 0, // 0 表示尚未拿到（spawn 是同步的，pid 在 ready 后才有效）
      stdout: stdoutIterator,
      stderr: stderrIterator,
      onExit: new Promise<number>((resolve) => {
        if (exitCode !== null) resolve(exitCode)
        else exitResolvers.push(resolve)
      }),
      kill: async (signal?: string) => {
        // 确保 IPC 句柄已就绪
        await ready
        if (killFn) await killFn(signal)
      },
    }
  }

  async kill(pid: number): Promise<void> {
    try {
      await ipc().process.kill(pid)
    } catch (err) {
      throw wrapError('process', err, `终止进程失败 ${pid}`)
    }
  }

  async list(): Promise<ProcessInfo[]> {
    try {
      return await ipc().process.list()
    } catch (err) {
      throw wrapError('process', err, '列出进程失败')
    }
  }
}

// =============================================================================
// 环境检测能力
// =============================================================================

class ElectronEnvCapability implements EnvCapability {
  async detectJava(): Promise<ToolStatus> {
    try {
      return await ipc().env.detectJava()
    } catch (err) {
      throw wrapError('env', err, '检测 Java 失败')
    }
  }
  async detectGit(): Promise<ToolStatus> {
    try {
      return await ipc().env.detectGit()
    } catch (err) {
      throw wrapError('env', err, '检测 Git 失败')
    }
  }
  async detectGradle(): Promise<ToolStatus> {
    try {
      return await ipc().env.detectGradle()
    } catch (err) {
      throw wrapError('env', err, '检测 Gradle 失败')
    }
  }
  async detectNetwork(url: string): Promise<NetworkStatus> {
    try {
      return await ipc().env.detectNetwork(url)
    } catch (err) {
      throw wrapError('env', err, `网络探测失败 ${url}`)
    }
  }
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      return await ipc().env.getSystemInfo()
    } catch (err) {
      throw wrapError('env', err, '获取系统信息失败')
    }
  }
}

// =============================================================================
// 组装 Electron 能力集合
// =============================================================================

export const electronCapabilities: Capabilities = {
  fs: new ElectronFsCapability(),
  build: new ElectronBuildCapability(),
  jdk: new ElectronJdkCapability(),
  process: new ElectronProcessCapability(),
  env: new ElectronEnvCapability(),
  isDesktop: true,
  platform: 'electron',
  version: '0.1.0',
}

export {
  ElectronFsCapability,
  ElectronBuildCapability,
  ElectronJdkCapability,
  ElectronProcessCapability,
  ElectronEnvCapability,
}

// =============================================================================
// 全局类型扩展：声明 window.nexcube
// =============================================================================
// 这样在 TS 项目里 (window as any).nexcube 可改为 window.nexcube 直接访问
// 注：仅当 Electron preload 真正注入时才存在

declare global {
  interface Window {
    nexcube?: NexcubeIPC
  }
}
