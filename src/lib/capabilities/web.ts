/**
 * NexCube 能力层 — Web 实现（当前可用，模拟）
 *
 * 在浏览器环境中用内存数据结构模拟系统操作。所有"真实"行为通过：
 *   - 文件系统：内存 Map（虚拟项目）
 *   - Gradle 构建：预录制日志流（按任务名生成真实格式）
 *   - JDK / 环境检测：mock 已安装状态
 *   - 网络探测：真实 fetch（探测镜像可达性）
 *   - 进程：模拟（伪 PID + 定时器）
 *
 * 切换到 Electron 时仅需替换本文件为 electron.ts，上层代码不变。
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
// 内存虚拟文件系统
// =============================================================================

interface VirtualNode {
  path: string
  name: string
  isDirectory: boolean
  content: string // 文件内容（目录为空）
  buffer?: Buffer // 二进制内容
  createdAt: Date
  modifiedAt: Date
  children: Map<string, VirtualNode> // 仅目录有
}

class VirtualFs implements FsCapability {
  private root: VirtualNode = {
    path: '/',
    name: '/',
    isDirectory: true,
    content: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    children: new Map(),
  }
  private watchers = new Map<string, Set<(e: FsWatchEvent) => void>>()

  constructor() {
    this.seedDemoProject()
  }

  /** 在虚拟 FS 中预置一个示例 Forge MDK 项目结构 */
  private seedDemoProject(): void {
    const now = new Date()
    const mkdir = (path: string) => {
      this.mkdirInternal(path, true)
    }
    const writeFile = (path: string, content: string) => {
      this.writeInternal(path, content)
    }

    // 示例项目根：/workspace/example-mod
    mkdir('/workspace')
    mkdir('/workspace/example-mod')
    mkdir('/workspace/example-mod/src')
    mkdir('/workspace/example-mod/src/main')
    mkdir('/workspace/example-mod/src/main/java')
    mkdir('/workspace/example-mod/src/main/java/com')
    mkdir('/workspace/example-mod/src/main/java/com/example')
    mkdir('/workspace/example-mod/src/main/java/com/example/mod')
    mkdir('/workspace/example-mod/src/main/resources')
    mkdir('/workspace/example-mod/gradle')
    mkdir('/workspace/example-mod/gradle/wrapper')

    writeFile(
      '/workspace/example-mod/build.gradle',
      `plugins {
    id 'net.minecraftforge.gradle' version '6.0.+'
    id 'eclipse'
    id 'maven-publish'
}

version = '1.0.0'
group = 'com.example.mod'
archivesBaseName = 'examplemod'

java.toolchain.languageVersion = JavaLanguageVersion.of(17)

minecraft {
    mappings channel: 'official', version: '1.20.1'
    runs {
        client { workingDirectory project.file('run') }
        server { workingDirectory project.file('run-server') }
    }
}

dependencies {
    minecraft 'net.minecraftforge:forge:1.20.1-47.3.0'
}
`,
    )
    writeFile(
      '/workspace/example-mod/settings.gradle',
      `pluginManagement {
    repositories {
        gradlePluginPortal()
        maven { url = 'https://maven.minecraftforge.net/' }
    }
}

rootProject.name = 'examplemod'
`,
    )
    writeFile(
      '/workspace/example-mod/gradle.properties',
      `# Gradle 内存配置
org.gradle.jvmargs=-Xmx3G
org.gradle.daemon=true
# Forge 版本
minecraft_version=1.20.1
forge_version=47.3.0
`,
    )
    writeFile(
      '/workspace/example-mod/gradle/wrapper/gradle-wrapper.properties',
      `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.1.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
    )
    writeFile(
      '/workspace/example-mod/src/main/java/com/example/mod/ExampleMod.java',
      `package com.example.mod;

import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

@Mod(ExampleMod.MODID)
public class ExampleMod {
    public static final String MODID = "examplemod";

    public ExampleMod() {
        IEventBus bus = FMLJavaModLoadingContext.get().getModEventBus();
        System.out.println("Hello NexCube!");
    }
}
`,
    )
    writeFile(
      '/workspace/example-mod/src/main/resources/META-INF/mods.toml',
      `modLoader="javafml"
loaderVersion="[47,)"
license="MIT"

[[mods]]
modId="examplemod"
version="1.0.0"
displayName="Example Mod"
description='''
A sample Forge mod created with NexCube.
'''
`,
    )

    // 让根目录时间保持创建时间
    this.root.modifiedAt = now
  }

  /** 规范化路径：以 / 开头，去除多余斜杠 */
  private normalize(path: string): string {
    if (!path || typeof path !== 'string') {
      throw CapabilityError.notSupported('路径不能为空')
    }
    let p = path.replace(/\\/g, '/').replace(/\/+/g, '/')
    if (!p.startsWith('/')) p = '/' + p
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
    return p
  }

  /** 切分路径为段 */
  private split(path: string): string[] {
    return this.normalize(path).split('/').filter(Boolean)
  }

  /** 根据路径找到节点（不存在返回 null） */
  private find(path: string): VirtualNode | null {
    const segments = this.split(path)
    if (segments.length === 0) return this.root
    let cur: VirtualNode = this.root
    for (const seg of segments) {
      if (!cur.isDirectory) return null
      const next = cur.children.get(seg)
      if (!next) return null
      cur = next
    }
    return cur
  }

  /** 内部 mkdir，不触发 watcher */
  private mkdirInternal(path: string, recursive: boolean): void {
    const segments = this.split(path)
    if (segments.length === 0) {
      throw CapabilityError.alreadyExists(path)
    }
    let cur: VirtualNode = this.root
    const walked: string[] = []
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      walked.push(seg)
      let next = cur.children.get(seg)
      if (!next) {
        // 创建
        next = {
          path: '/' + walked.join('/'),
          name: seg,
          isDirectory: true,
          content: '',
          createdAt: new Date(),
          modifiedAt: new Date(),
          children: new Map(),
        }
        cur.children.set(seg, next)
        cur.modifiedAt = new Date()
        this.emitWatch(cur.path, { type: 'create', path: next.path })
      } else if (!next.isDirectory && i < segments.length - 1) {
        throw CapabilityError.notSupported(`路径冲突: ${next.path} 是文件`)
      } else if (!next.isDirectory && i === segments.length - 1) {
        throw CapabilityError.alreadyExists(next.path)
      }
      cur = next
      if (!recursive && i === segments.length - 1 && !cur.isDirectory) {
        // 不允许创建中间目录
      }
    }
  }

  /** 内部写入文件 */
  private writeInternal(path: string, content: string): void {
    const segments = this.split(path)
    if (segments.length === 0) {
      throw CapabilityError.notSupported('不能写入根目录')
    }
    const fileName = segments[segments.length - 1]
    const parentSegments = segments.slice(0, -1)
    let parent: VirtualNode = this.root
    const walked: string[] = []
    for (const seg of parentSegments) {
      walked.push(seg)
      let next = parent.children.get(seg)
      if (!next) {
        // 自动创建目录
        next = {
          path: '/' + walked.join('/'),
          name: seg,
          isDirectory: true,
          content: '',
          createdAt: new Date(),
          modifiedAt: new Date(),
          children: new Map(),
        }
        parent.children.set(seg, next)
        parent.modifiedAt = new Date()
        this.emitWatch(parent.path, { type: 'create', path: next.path })
      }
      parent = next
    }
    const existed = parent.children.get(fileName)
    const isCreate = !existed
    const node: VirtualNode = {
      path: '/' + segments.join('/'),
      name: fileName,
      isDirectory: false,
      content,
      createdAt: existed ? existed.createdAt : new Date(),
      modifiedAt: new Date(),
      children: new Map(),
    }
    parent.children.set(fileName, node)
    parent.modifiedAt = new Date()
    this.emitWatch(parent.path, {
      type: isCreate ? 'create' : 'modify',
      path: node.path,
    })
  }

  /** 触发监听器 */
  private emitWatch(_watchRoot: string, event: FsWatchEvent): void {
    // 对所有可能受影响的 watcher 触发（简化实现：触发所有 watcher）
    for (const [, cbs] of this.watchers) {
      for (const cb of cbs) {
        try {
          cb(event)
        } catch {
          // 忽略回调错误
        }
      }
    }
  }

  async read(path: string): Promise<string> {
    const node = this.find(path)
    if (!node) throw CapabilityError.notFound(path)
    if (node.isDirectory) throw CapabilityError.notSupported('不能读取目录: ' + path)
    return node.content
  }

  async readBuffer(path: string): Promise<Buffer> {
    const node = this.find(path)
    if (!node) throw CapabilityError.notFound(path)
    if (node.isDirectory) throw CapabilityError.notSupported('不能读取目录: ' + path)
    return node.buffer ?? Buffer.from(node.content, 'utf-8')
  }

  async write(path: string, content: string): Promise<void> {
    this.writeInternal(path, content)
  }

  async writeBuffer(path: string, content: Buffer): Promise<void> {
    const segments = this.split(path)
    if (segments.length === 0) throw CapabilityError.notSupported('不能写入根目录')
    const fileName = segments[segments.length - 1]
    const parentSegments = segments.slice(0, -1)
    let parent: VirtualNode = this.root
    const walked: string[] = []
    for (const seg of parentSegments) {
      walked.push(seg)
      let next = parent.children.get(seg)
      if (!next) {
        next = {
          path: '/' + walked.join('/'),
          name: seg,
          isDirectory: true,
          content: '',
          createdAt: new Date(),
          modifiedAt: new Date(),
          children: new Map(),
        }
        parent.children.set(seg, next)
      }
      parent = next
    }
    const existed = parent.children.get(fileName)
    const isCreate = !existed
    const node: VirtualNode = {
      path: '/' + segments.join('/'),
      name: fileName,
      isDirectory: false,
      content: content.toString('utf-8'),
      buffer: content,
      createdAt: existed ? existed.createdAt : new Date(),
      modifiedAt: new Date(),
      children: new Map(),
    }
    parent.children.set(fileName, node)
    parent.modifiedAt = new Date()
    this.emitWatch(parent.path, { type: isCreate ? 'create' : 'modify', path: node.path })
  }

  async list(dir: string): Promise<DirEntry[]> {
    const node = this.find(dir)
    if (!node) throw CapabilityError.notFound(dir)
    if (!node.isDirectory) throw CapabilityError.notSupported('不是目录: ' + dir)
    const entries: DirEntry[] = []
    for (const child of node.children.values()) {
      entries.push({
        name: child.name,
        path: child.path,
        isDirectory: child.isDirectory,
        size: child.isDirectory ? 0 : Buffer.byteLength(child.content, 'utf-8'),
        modifiedAt: child.modifiedAt,
      })
    }
    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return entries
  }

  async exists(path: string): Promise<boolean> {
    return this.find(path) !== null
  }

  async mkdir(path: string, recursive?: boolean): Promise<void> {
    this.mkdirInternal(path, recursive ?? true)
  }

  async remove(path: string): Promise<void> {
    const node = this.find(path)
    if (!node) throw CapabilityError.notFound(path)
    if (node === this.root) throw CapabilityError.notSupported('不能删除根目录')
    const segments = this.split(path)
    const fileName = segments[segments.length - 1]
    const parentSegments = segments.slice(0, -1)
    let parent: VirtualNode = this.root
    for (const seg of parentSegments) {
      const next = parent.children.get(seg)
      if (!next) throw CapabilityError.notFound(path)
      parent = next
    }
    parent.children.delete(fileName)
    parent.modifiedAt = new Date()
    this.emitWatch(parent.path, { type: 'delete', path: node.path })
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const node = this.find(oldPath)
    if (!node) throw CapabilityError.notFound(oldPath)
    if (node === this.root) throw CapabilityError.notSupported('不能重命名根目录')
    if (this.find(newPath)) throw CapabilityError.alreadyExists(newPath)
    const content = node.content
    const buffer = node.buffer
    await this.remove(oldPath)
    if (buffer) {
      await this.writeBuffer(newPath, buffer)
    } else {
      await this.write(newPath, content)
    }
    this.emitWatch('/', { type: 'rename', path: newPath, oldPath })
  }

  async stat(path: string): Promise<FileStat> {
    const node = this.find(path)
    if (!node) throw CapabilityError.notFound(path)
    return {
      size: node.isDirectory ? 0 : Buffer.byteLength(node.content, 'utf-8'),
      isDirectory: node.isDirectory,
      isFile: !node.isDirectory,
      createdAt: node.createdAt,
      modifiedAt: node.modifiedAt,
    }
  }

  watch(path: string, callback: (event: FsWatchEvent) => void): () => void {
    const norm = this.normalize(path)
    let set = this.watchers.get(norm)
    if (!set) {
      set = new Set()
      this.watchers.set(norm, set)
    }
    set.add(callback)
    return () => {
      set?.delete(callback)
      if (set && set.size === 0) {
        this.watchers.delete(norm)
      }
    }
  }
}

// =============================================================================
// 模拟构建能力
// =============================================================================

class WebBuildCapability implements BuildCapability {
  /**
   * 模拟运行 Gradle 任务，返回预录制日志流
   * 依据任务名生成真实格式的输出
   */
  async runGradle(projectPath: string, task: string, options?: GradleOptions): Promise<BuildHandle> {
    const pid = Math.floor(Math.random() * 90000) + 10000
    const outputCallbacks = new Set<(chunk: string) => void>()
    const completeCallbacks = new Set<(code: number) => void>()
    const errorCallbacks = new Set<(err: Error) => void>()

    const handle: BuildHandle = {
      pid,
      exited: false,
      onOutput: (cb) => outputCallbacks.add(cb),
      onComplete: (cb) => completeCallbacks.add(cb),
      onError: (cb) => errorCallbacks.add(cb),
      kill: async () => {
        if (handle.exited) return
        handle.exited = true
        for (const cb of completeCallbacks) cb(137) // SIGKILL
      },
    }

    // 异步推流日志
    this.streamMockLog(task, projectPath, options, (chunk) => {
      for (const cb of outputCallbacks) cb(chunk)
    })
      .then((code) => {
        handle.exited = true
        for (const cb of completeCallbacks) cb(code)
      })
      .catch((err) => {
        handle.exited = true
        for (const cb of errorCallbacks) cb(err instanceof Error ? err : new Error(String(err)))
      })

    return handle
  }

  /**
   * 按任务名选择并推送模拟日志
   * 返回退出码
   */
  private async streamMockLog(
    task: string,
    projectPath: string,
    options: GradleOptions | undefined,
    emit: (chunk: string) => void,
  ): Promise<number> {
    const logs = this.getMockLog(task, projectPath, options)
    for (const line of logs) {
      await this.delay(40 + Math.random() * 80)
      emit(line + '\n')
    }
    // 退出码：失败任务（clean/build 失败）返回 1，其他返回 0
    const failed = logs.some((l) => l.includes('BUILD FAILED'))
    return failed ? 1 : 0
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }

  /**
   * 根据任务名返回模拟日志
   */
  private getMockLog(task: string, projectPath: string, options?: GradleOptions[]): string[] {
    const offline = options && (options as GradleOptions).offline
    const daemon = !options || (options as GradleOptions).daemon !== false
    const head = [
      `> Task :${task}`,
      `Working directory: ${projectPath}`,
      daemon ? '[Gradle Daemon] 启动守护进程...' : '[No-daemon] 单次运行',
      offline ? 'Mode: --offline' : 'Mode: online',
    ]
    switch (task) {
      case 'help':
        return [
          ...head,
          '',
          'Welcome to Gradle 8.1.1.',
          'To run a build, run gradlew <task>',
          '',
          'To see a list of available tasks, run gradlew tasks',
          '',
          'BUILD SUCCESSFUL in 1s',
        ]
      case 'tasks':
        return [
          ...head,
          '',
          '> Task :tasks',
          '------------------------------------------------------------',
          'All tasks runnable from root project',
          '------------------------------------------------------------',
          'Build tasks',
          '-----------',
          'assemble - Assembles the outputs of this project.',
          'build - Assembles and tests this project.',
          'buildDependents - Assembles and tests this project and all projects that depend on it.',
          'classes - Assembles main classes.',
          'clean - Deletes the build directory.',
          'jar - Assembles a jar archive containing the classes of the \'main\' feature.',
          'Build Setup tasks',
          '-----------------',
          'init - Initializes a new Gradle build in current directory.',
          'wrapper - Generates Gradle wrapper files.',
          'Documentation tasks',
          '-------------------',
          'javadoc - Generates Javadoc API documentation for the main source code.',
          'Forge tasks',
          '-----------',
          '["forge", "runs", "client"] - Generate Forge client run config',
          '["forge", "runs", "server"] - Generate Forge server run config',
          '',
          'BUILD SUCCESSFUL in 2s',
          '8 actionable tasks: 8 executed',
        ]
      case 'clean':
        return [
          ...head,
          'Deleting build directory...',
          'Removed: build/',
          '',
          'BUILD SUCCESSFUL in 1s',
          '1 actionable task: 1 executed',
        ]
      case 'build':
        // 模拟一次编译失败 + OutOfMemory 场景
        return [
          ...head,
          '',
          '> Task :compileJava',
          'Compiling with JDK 17...',
          '/workspace/example-mod/src/main/java/com/example/mod/ExampleMod.java:14: error: cannot find symbol',
          '        IEventBus bus = FMLJavaModLoadingContext.get().getModEventBus();',
          '                                              ^',
          '  symbol:   method getModEventBus()',
          '  location: class FMLJavaModLoadingContext',
          '/workspace/example-mod/src/main/java/com/example/mod/ExampleMod.java:20: error: incompatible types: String cannot be converted to int',
          '        int v = "1";',
          '                 ^',
          'Note: Some input files use or override a deprecated API.',
          'Note: Recompile with -Xlint:deprecation for details.',
          '2 errors',
          '',
          '> Task :compileJava FAILED',
          'java.lang.OutOfMemoryError: Java heap space',
          '  at com.sun.tools.javac.jvm.Gen.generate(Gen.java:2243)',
          '',
          'FAILURE: Build failed with an exception.',
          '* What went wrong:',
          'Execution failed for task \':compileJava\'.',
          '> java.lang.OutOfMemoryError: Java heap space',
          '',
          '* Try:',
          '> Run with --stacktrace option to get the stack trace.',
          '> Run with --debug option to get more log output.',
          '> Run with --scan to get full insights.',
          '',
          'BUILD FAILED in 12s',
          '7 actionable tasks: 6 executed, 1 from cache',
        ]
      case 'runClient':
        return [
          ...head,
          'Preparing Forge runs...',
          'Mapping official 1.20.1...',
          'Downloading assets...',
          '[13:45:21] [main/INFO]: Mod Loader 47.3.0 starting',
          '[13:45:21] [main/INFO]: Loading mods: examplemod',
          '[13:45:22] [main/INFO]: Hello NexCube!',
          'Game window opened.',
          '',
          'BUILD SUCCESSFUL in 35s',
        ]
      default:
        return [
          ...head,
          `Running task ${task}...`,
          '',
          'BUILD SUCCESSFUL in 2s',
        ]
    }
  }

  parseLog(log: string): ParsedLogCard[] {
    return parseGradleLog(log)
  }

  async getAvailableTasks(_projectPath: string): Promise<string[]> {
    return [
      'help',
      'tasks',
      'clean',
      'build',
      'assemble',
      'compileJava',
      'jar',
      'runClient',
      'runServer',
      'genIntellijRuns',
      'genEclipseRuns',
      'runData',
    ]
  }
}

// =============================================================================
// 模拟 JDK 能力
// =============================================================================

class WebJdkCapability implements JdkCapability {
  private installed: JdkInfo[] = [
    {
      version: '17',
      fullVersion: '17.0.9+9',
      path: '/usr/lib/jvm/temurin-17',
      vendor: 'temurin',
      isDefault: false,
    },
    {
      version: '21',
      fullVersion: '21.0.5+11',
      path: '/usr/lib/jvm/temurin-21',
      vendor: 'temurin',
      isDefault: true,
    },
  ]

  async detect(): Promise<JdkInfo | null> {
    return this.installed.find((j) => j.isDefault) ?? null
  }

  async listInstalled(): Promise<JdkInfo[]> {
    return [...this.installed]
  }

  async download(version: string, mirror: MirrorConfig): Promise<JdkInstallProgress> {
    const jdkMirror = mirror.jdks.find((j) => j.version === version) ?? {
      version,
      url: `${mirror.gradleUrl}/jdk/${version}/x64`,
      checksum: '',
    }
    const callbacks = new Set<(p: JdkInstallProgress) => void>()
    const progress: JdkInstallProgress = {
      url: jdkMirror.url,
      totalBytes: 200 * 1024 * 1024, // 200MB
      downloadedBytes: 0,
      percent: 0,
      speed: 0,
      status: 'downloading',
      onProgress: (cb) => {
        callbacks.add(cb)
      },
    }

    // 异步推送下载进度
    ;(async () => {
      const start = Date.now()
      const chunk = progress.totalBytes / 50
      for (let i = 1; i <= 50; i++) {
        await new Promise((r) => setTimeout(r, 60))
        progress.downloadedBytes = Math.round(chunk * i)
        progress.percent = Math.round((i / 50) * 90) // 90% 下载阶段
        progress.speed = Math.round(chunk / 0.06)
        progress.elapsedMs = Date.now() - start
        for (const cb of callbacks) cb({ ...progress })
      }
      progress.status = 'extracting'
      progress.percent = 92
      for (const cb of callbacks) cb({ ...progress })
      await new Promise((r) => setTimeout(r, 400))
      progress.status = 'configuring'
      progress.percent = 96
      for (const cb of callbacks) cb({ ...progress })
      await new Promise((r) => setTimeout(r, 400))
      progress.status = 'done'
      progress.percent = 100
      // 注册到已安装列表
      const newPath = `/usr/lib/jvm/temurin-${version}`
      if (!this.installed.find((j) => j.path === newPath)) {
        this.installed.push({
          version,
          fullVersion: `${version}.0.1+1`,
          path: newPath,
          vendor: 'temurin',
          isDefault: false,
        })
      }
      for (const cb of callbacks) cb({ ...progress })
    })().catch((err) => {
      progress.status = 'failed'
      progress.error = err instanceof Error ? err.message : String(err)
      for (const cb of callbacks) cb({ ...progress })
    })

    return progress
  }

  async uninstall(jdkPath: string): Promise<void> {
    this.installed = this.installed.filter((j) => j.path !== jdkPath)
  }

  async setDefault(jdkPath: string): Promise<void> {
    this.installed = this.installed.map((j) => ({
      ...j,
      isDefault: j.path === jdkPath,
    }))
  }
}

// =============================================================================
// 模拟进程能力
// =============================================================================

class WebProcessCapability implements ProcessCapability {
  private processes = new Map<number, ProcessInfo & { killSignal?: () => Promise<void> }>()
  private counter = 1000

  spawn(cmd: string, args: string[], options?: ProcessOptions): ProcessHandle {
    const pid = ++this.counter
    const stdoutQueue: string[] = []
    const stderrQueue: string[] = []
    const stdoutWaiters: Array<(v: IteratorResult<string>) => void> = []
    const stderrWaiters: Array<(v: IteratorResult<string>) => void> = []
    let stdoutDone = false
    let stderrDone = false
    let exitCode: number | null = null
    const exitResolvers: Array<(code: number) => void> = []
    let killed = false

    const info: ProcessInfo & { killSignal?: () => Promise<void> } = {
      pid,
      name: cmd,
      cmd: `${cmd} ${args.join(' ')}`,
      cpu: Math.random() * 5,
      memory: Math.floor(Math.random() * 100 * 1024 * 1024),
    }
    this.processes.set(pid, info)

    info.killSignal = async () => {
      killed = true
      stdoutDone = true
      stderrDone = true
      for (const w of stdoutWaiters) w({ value: undefined, done: true })
      for (const w of stderrWaiters) w({ value: undefined, done: true })
      if (exitCode === null) {
        exitCode = 137
        for (const r of exitResolvers) r(exitCode)
      }
    }

    // 模拟输出
    const emitStdout = (chunk: string) => {
      if (stdoutDone) return
      if (stdoutWaiters.length > 0) {
        const w = stdoutWaiters.shift()!
        w({ value: chunk, done: false })
      } else {
        stdoutQueue.push(chunk)
      }
    }
    const emitStderr = (chunk: string) => {
      if (stderrDone) return
      if (stderrWaiters.length > 0) {
        const w = stderrWaiters.shift()!
        w({ value: chunk, done: false })
      } else {
        stderrQueue.push(chunk)
      }
    }
    const finish = (code: number) => {
      stdoutDone = true
      stderrDone = true
      exitCode = code
      for (const w of stdoutWaiters) w({ value: undefined, done: true })
      for (const w of stderrWaiters) w({ value: undefined, done: true })
      for (const r of exitResolvers) r(code)
    }

    // 模拟：每 200ms 推送一行示例输出，3 行后结束
    const cwd = options?.cwd ?? '/workspace/example-mod'
    setTimeout(() => emitStdout(`> cwd: ${cwd}\n`), 50)
    setTimeout(() => emitStdout(`> ${cmd} ${args.join(' ')}\n`), 200)
    setTimeout(() => emitStderr(`[warn] Web 模式下为模拟输出\n`), 400)
    setTimeout(() => {
      if (killed) return
      finish(0)
      this.processes.delete(pid)
    }, 800)

    const stdoutIterator: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<string>> {
            if (stdoutQueue.length > 0) {
              return Promise.resolve({ value: stdoutQueue.shift()!, done: false })
            }
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
            if (stderrQueue.length > 0) {
              return Promise.resolve({ value: stderrQueue.shift()!, done: false })
            }
            if (stderrDone) return Promise.resolve({ value: undefined, done: true })
            return new Promise((resolve) => stderrWaiters.push(resolve))
          },
        }
      },
    }

    return {
      pid,
      stdout: stdoutIterator,
      stderr: stderrIterator,
      onExit: new Promise<number>((resolve) => {
        if (exitCode !== null) resolve(exitCode)
        else exitResolvers.push(resolve)
      }),
      kill: async () => {
        await info.killSignal?.()
      },
    }
  }

  async kill(pid: number): Promise<void> {
    const info = this.processes.get(pid)
    if (info) {
      await info.killSignal?.()
      this.processes.delete(pid)
    }
  }

  async list(): Promise<ProcessInfo[]> {
    return Array.from(this.processes.values()).map((p) => ({
      pid: p.pid,
      name: p.name,
      cmd: p.cmd,
      cpu: p.cpu,
      memory: p.memory,
    }))
  }
}

// =============================================================================
// 环境检测能力（网络为真实探测，其他 mock）
// =============================================================================

class WebEnvCapability implements EnvCapability {
  async detectJava(): Promise<ToolStatus> {
    return {
      name: 'java',
      installed: true,
      version: '21.0.5',
      path: '/usr/lib/jvm/temurin-21/bin/java',
      fixHint: '检测到 JDK 21（模拟），实际环境需通过能力层获取真实信息。',
    }
  }

  async detectGit(): Promise<ToolStatus> {
    return {
      name: 'git',
      installed: true,
      version: '2.43.0',
      path: '/usr/bin/git',
    }
  }

  async detectGradle(): Promise<ToolStatus> {
    return {
      name: 'gradle',
      installed: true,
      version: '8.1.1',
      path: '/usr/share/gradle/bin/gradle',
      fixHint: '使用 Gradle Wrapper（./gradlew）时无需全局 Gradle。',
    }
  }

  async detectNetwork(url: string): Promise<NetworkStatus> {
    const start = Date.now()
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)
      const latency = Date.now() - start
      return {
        reachable: res.ok || res.type === 'opaque',
        latency,
        url,
      }
    } catch (err) {
      return {
        reachable: false,
        latency: Date.now() - start,
        url,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  async getSystemInfo(): Promise<SystemInfo> {
    // Web 模式无法获取真实系统信息，返回近似 mock
    const platform: SystemInfo['platform'] = this.guessPlatform()
    const arch: SystemInfo['arch'] = (typeof navigator !== 'undefined' && navigator.userAgent.includes('ARM')) ? 'arm64' : 'x64'
    return {
      platform,
      arch,
      hostname: typeof navigator !== 'undefined' ? navigator.platform || 'web-sandbox' : 'web-sandbox',
      totalMemory: 16 * 1024 * 1024 * 1024, // mock 16GB
      freeMemory: 8 * 1024 * 1024 * 1024,
      cpus: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 8,
      osVersion: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    }
  }

  private guessPlatform(): SystemInfo['platform'] {
    if (typeof navigator === 'undefined') return 'linux'
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('win')) return 'windows'
    if (ua.includes('mac')) return 'macos'
    return 'linux'
  }
}

// =============================================================================
// 组装 Web 能力集合
// =============================================================================

const fs = new VirtualFs()
const build = new WebBuildCapability()
const jdk = new WebJdkCapability()
const process = new WebProcessCapability()
const env = new WebEnvCapability()

export const webCapabilities: Capabilities = {
  fs,
  build,
  jdk,
  process,
  env,
  isDesktop: false,
  platform: 'web',
  version: '0.1.0',
}

export { VirtualFs, WebBuildCapability, WebJdkCapability, WebProcessCapability, WebEnvCapability }
