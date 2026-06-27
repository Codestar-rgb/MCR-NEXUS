/**
 * NexCube 能力抽象层（Capability Layer）— 类型定义
 *
 * 设计目标：
 *   同一套前端代码能在 Web 模式（Next.js 浏览器）和 Electron 桌面模式下无缝运行。
 *   系统级操作（文件、构建、JDK、进程、环境检测）必须通过本层接口调用，
 *   底层实现可以是浏览器模拟（web.ts）或桌面 IPC（electron.ts），
 *   上层无需感知。
 *
 * 约定：
 *   - 所有方法均为异步（除非明确标注同步）
 *   - 所有路径使用 POSIX 风格（正斜杠），由实现层负责平台差异
 *   - 错误一律抛出 CapabilityError（见文件末尾）
 */

// =============================================================================
// 文件系统能力
// =============================================================================

/** 文件系统监听事件 */
export interface FsWatchEvent {
  type: 'create' | 'modify' | 'delete' | 'rename'
  /** 事件涉及的目标路径（rename 时为新路径） */
  path: string
  /** rename 事件时为旧路径；其他事件为 undefined */
  oldPath?: string
}

/** 目录条目 */
export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedAt: Date
}

/** 文件元数据 */
export interface FileStat {
  size: number
  isDirectory: boolean
  isFile: boolean
  createdAt: Date
  modifiedAt: Date
  permissions?: string
}

/** 文件系统能力接口 */
export interface FsCapability {
  /** 读取文本文件 */
  read(path: string): Promise<string>
  /** 读取二进制文件 */
  readBuffer(path: string): Promise<Buffer>
  /** 写入文本文件 */
  write(path: string, content: string): Promise<void>
  /** 写入二进制文件 */
  writeBuffer(path: string, content: Buffer): Promise<void>
  /** 列出目录条目 */
  list(dir: string): Promise<DirEntry[]>
  /** 判断路径是否存在 */
  exists(path: string): Promise<boolean>
  /** 创建目录，recursive 为 true 时递归创建 */
  mkdir(path: string, recursive?: boolean): Promise<void>
  /** 删除文件或目录（目录递归删除） */
  remove(path: string): Promise<void>
  /** 重命名 / 移动文件或目录 */
  rename(oldPath: string, newPath: string): Promise<void>
  /** 获取文件元数据 */
  stat(path: string): Promise<FileStat>
  /**
   * 监听文件或目录变更，返回取消监听的函数
   * Web 模式下为内存模拟（写入时触发回调），Electron 模式下使用 chokidar
   */
  watch(path: string, callback: (event: FsWatchEvent) => void): () => void
}

// =============================================================================
// 构建能力
// =============================================================================

/** Gradle 运行选项 */
export interface GradleOptions {
  /** 离线模式（--offline） */
  offline?: boolean
  /** 启用 Daemon */
  daemon?: boolean
  /** 额外命令行参数 */
  args?: string[]
  /** JVM 参数 */
  jvmArgs?: string[]
  /** 工作目录（默认为 projectPath） */
  cwd?: string
  /** 标准输入（用于交互式构建，可选） */
  stdin?: string
}

/** 构建进程句柄 */
export interface BuildHandle {
  /** 进程 ID（Web 模式下为模拟值） */
  pid: number
  /** 注册输出回调（stdout + stderr 合并流） */
  onOutput(callback: (chunk: string) => void): void
  /** 注册完成回调，code=0 表示成功 */
  onComplete(callback: (code: number) => void): void
  /** 注册错误回调（进程异常退出 / 启动失败） */
  onError(callback: (err: Error) => void): void
  /** 终止构建 */
  kill(): Promise<void>
  /** 是否已结束 */
  exited: boolean
}

/** 构建能力接口 */
export interface BuildCapability {
  /** 执行 Gradle 任务 */
  runGradle(projectPath: string, task: string, options?: GradleOptions): Promise<BuildHandle>
  /** 解析构建日志，生成结构化卡片 */
  parseLog(log: string): ParsedLogCard[]
  /** 获取项目可用的 Gradle 任务列表 */
  getAvailableTasks(projectPath: string): Promise<string[]>
}

/** 解析后的日志卡片（前端可渲染） */
export interface ParsedLogCard {
  /** 卡片唯一 ID */
  id: string
  /** 严重等级 */
  level: 'error' | 'warn' | 'info'
  /** 中文标题 */
  title: string
  /** 原始英文文本（截取关键片段） */
  originalText: string
  /** 中文原因分析 */
  analysis: string
  /** 中文修复建议 */
  suggestion: string
  /** 可选的修复动作（前端处理） */
  fixAction?: {
    /** 按钮文案 */
    label: string
    /** 动作 key，由前端 dispatch */
    action: string
    /** 携带的额外数据 */
    payload?: Record<string, unknown>
  }
  /** 在原日志中的行号区间 */
  lineRange?: [number, number]
  /** 规则 ID（用于审计 / 反馈） */
  ruleId?: string
}

// =============================================================================
// JDK 能力
// =============================================================================

/** JDK 信息 */
export interface JdkInfo {
  /** 主版本号，如 "17"、"21" */
  version: string
  /** 完整版本号，如 "21.0.5+11" */
  fullVersion?: string
  /** JDK 安装路径 */
  path: string
  /** 发行方（temurin / oracle / zulu ...） */
  vendor?: string
  /** 是否为系统默认 JDK */
  isDefault: boolean
}

/** JDK 安装进度 */
export interface JdkInstallProgress {
  /** 下载地址 */
  url: string
  /** 总字节数（未知则为 0） */
  totalBytes: number
  /** 已下载字节数 */
  downloadedBytes: number
  /** 百分比 0-100 */
  percent: number
  /** 下载速度 bytes/s */
  speed: number
  /** 当前状态 */
  status: 'downloading' | 'extracting' | 'configuring' | 'done' | 'failed'
  /** 错误信息（status=failed 时） */
  error?: string
  /** 已下载耗时（毫秒） */
  elapsedMs?: number
  /** 进度回调注册 */
  onProgress(callback: (p: JdkInstallProgress) => void): void
}

/** JDK 能力接口 */
export interface JdkCapability {
  /** 检测系统默认 JDK */
  detect(): Promise<JdkInfo | null>
  /** 列出所有已安装的 JDK */
  listInstalled(): Promise<JdkInfo[]>
  /** 下载并安装指定版本的 JDK */
  download(version: string, mirror: MirrorConfig): Promise<JdkInstallProgress>
  /** 卸载 JDK */
  uninstall(jdkPath: string): Promise<void>
  /** 设置默认 JDK */
  setDefault(jdkPath: string): Promise<void>
}

// =============================================================================
// 进程能力
// =============================================================================

/** 进程启动选项 */
export interface ProcessOptions {
  /** 工作目录 */
  cwd?: string
  /** 环境变量（合并到 process.env） */
  env?: Record<string, string>
  /** 是否脱离父进程 */
  detached?: boolean
  /** shell 模式 */
  shell?: boolean
}

/** 进程句柄 */
export interface ProcessHandle {
  pid: number
  /** stdout 异步可迭代 */
  stdout: AsyncIterable<string>
  /** stderr 异步可迭代 */
  stderr: AsyncIterable<string>
  /** 进程退出 Promise，resolve 为退出码 */
  onExit: Promise<number>
  /** 终止进程 */
  kill(signal?: string): Promise<void>
}

/** 进程信息 */
export interface ProcessInfo {
  pid: number
  name: string
  cmd: string
  /** CPU 占用百分比 */
  cpu: number
  /** 内存占用 bytes */
  memory: number
}

/** 进程能力接口 */
export interface ProcessCapability {
  /** 启动子进程 */
  spawn(cmd: string, args: string[], options?: ProcessOptions): ProcessHandle
  /** 杀掉指定 PID */
  kill(pid: number): Promise<void>
  /** 列出当前活跃的子进程（仅 NexCube 派生的） */
  list(): Promise<ProcessInfo[]>
}

// =============================================================================
// 环境检测能力
// =============================================================================

/** 工具状态 */
export interface ToolStatus {
  /** 工具名（java / git / gradle） */
  name: string
  /** 是否已安装 */
  installed: boolean
  /** 版本号 */
  version?: string
  /** 可执行文件路径 */
  path?: string
  /** 修复动作 key（前端处理） */
  fixAction?: string
  /** 修复动作的中文说明 */
  fixHint?: string
}

/** 网络状态 */
export interface NetworkStatus {
  /** 目标是否可达 */
  reachable: boolean
  /** 延迟 ms */
  latency: number
  /** 测试的 URL */
  url: string
  /** 错误信息（不可达时） */
  error?: string
}

/** 系统信息 */
export interface SystemInfo {
  platform: 'windows' | 'macos' | 'linux'
  arch: 'x64' | 'arm64'
  hostname: string
  /** 总内存 bytes */
  totalMemory: number
  /** 空闲内存 bytes */
  freeMemory: number
  /** CPU 核心数 */
  cpus: number
  /** 操作系统版本 */
  osVersion?: string
}

/** 环境检测能力接口 */
export interface EnvCapability {
  /** 检测 Java 环境 */
  detectJava(): Promise<ToolStatus>
  /** 检测 Git 环境 */
  detectGit(): Promise<ToolStatus>
  /** 检测 Gradle 环境 */
  detectGradle(): Promise<ToolStatus>
  /** 探测网络可达性 */
  detectNetwork(url: string): Promise<NetworkStatus>
  /** 获取系统信息 */
  getSystemInfo(): Promise<SystemInfo>
}

// =============================================================================
// 镜像源配置
// =============================================================================

/** 镜像源配置 */
export interface MirrorConfig {
  /** 唯一 ID */
  id: string
  /** 短名（用于 settings.gradle 引用） */
  name: string
  /** 显示名（中文） */
  displayName: string
  /** Maven 仓库地址 */
  mavenUrl: string
  /** Gradle 发行版地址 */
  gradleUrl: string
  /** 该镜像可用的 JDK 列表 */
  jdks: JdkMirror[]
}

/** JDK 镜像条目 */
export interface JdkMirror {
  version: string
  url: string
  /** 校验和（SHA256） */
  checksum: string
}

// =============================================================================
// 统一能力接口
// =============================================================================

/** NexCube 能力集合 */
export interface Capabilities {
  /** 文件系统能力 */
  fs: FsCapability
  /** 构建能力 */
  build: BuildCapability
  /** JDK 能力 */
  jdk: JdkCapability
  /** 进程能力 */
  process: ProcessCapability
  /** 环境检测能力 */
  env: EnvCapability
  /** 是否为桌面环境（Electron） */
  isDesktop: boolean
  /** 当前运行平台 */
  platform: 'web' | 'electron'
  /** 能力版本号（用于灰度 / 兼容检测） */
  version: string
}

// =============================================================================
// 错误类型
// =============================================================================

/** 能力层错误 */
export class CapabilityError extends Error {
  /** 错误码 */
  code: string
  /** 涉及的能力模块 */
  module: 'fs' | 'build' | 'jdk' | 'process' | 'env'
  /** 原始错误 */
  cause?: unknown

  constructor(
    code: string,
    message: string,
    module: 'fs' | 'build' | 'jdk' | 'process' | 'env',
    cause?: unknown,
  ) {
    super(message)
    this.name = 'CapabilityError'
    this.code = code
    this.module = module
    if (cause !== undefined) {
      this.cause = cause
    }
  }

  static notFound(path: string): CapabilityError {
    return new CapabilityError('ENOENT', `路径不存在: ${path}`, 'fs')
  }

  static alreadyExists(path: string): CapabilityError {
    return new CapabilityError('EEXIST', `路径已存在: ${path}`, 'fs')
  }

  static notSupported(message: string): CapabilityError {
    return new CapabilityError('ENOTSUP', message, 'fs')
  }
}
