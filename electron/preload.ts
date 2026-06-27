/**
 * Electron Preload 脚本
 *
 * 通过 contextBridge 安全暴露主进程 API 到渲染进程。
 * 渲染进程通过 window.nexcube.* 调用，不直接访问 Node.js。
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('nexcube', {
  // 文件系统
  fs: {
    read: (p: string) => ipcRenderer.invoke('fs:read', p),
    write: (p: string, c: string) => ipcRenderer.invoke('fs:write', p, c),
    readBuffer: (p: string) => ipcRenderer.invoke('fs:readBuffer', p),
    writeBuffer: (p: string, c: ArrayBuffer) => ipcRenderer.invoke('fs:writeBuffer', p, c),
    list: (d: string) => ipcRenderer.invoke('fs:list', d),
    exists: (p: string) => ipcRenderer.invoke('fs:exists', p),
    mkdir: (p: string, r?: boolean) => ipcRenderer.invoke('fs:mkdir', p, r),
    remove: (p: string) => ipcRenderer.invoke('fs:remove', p),
    stat: (p: string) => ipcRenderer.invoke('fs:stat', p),
    watch: (p: string, callback: (event: { type: string; path: string }) => void) => {
      const handler = (_: unknown, event: { type: string; path: string }) => callback(event)
      ipcRenderer.on('fs:watch:' + p, handler)
      ipcRenderer.send('fs:watch:start', p)
      return () => {
        ipcRenderer.removeListener('fs:watch:' + p, handler)
        ipcRenderer.send('fs:watch:stop', p)
      }
    },
  },

  // 构建（Gradle）
  build: {
    runGradle: (projectPath: string, task: string, options?: Record<string, unknown>) => {
      const outputHandlers: ((chunk: string) => void)[] = []
      const completeHandlers: ((code: number) => void)[] = []

      ipcRenderer.on('build:output', (_e, chunk: string) => {
        outputHandlers.forEach((h) => h(chunk))
      })
      ipcRenderer.on('build:complete', (_e, code: number) => {
        completeHandlers.forEach((h) => h(code))
      })

      return {
        pid: -1,
        onOutput: (cb: (chunk: string) => void) => outputHandlers.push(cb),
        onComplete: (cb: (code: number) => void) => completeHandlers.push(cb),
        start: () => ipcRenderer.invoke('build:run', { projectPath, task, options }),
        kill: () => ipcRenderer.invoke('build:stop'),
      }
    },
    getAvailableTasks: (projectPath: string) => ipcRenderer.invoke('build:tasks', projectPath),
  },

  // JDK 管理
  jdk: {
    detect: () => ipcRenderer.invoke('jdk:detect'),
    listInstalled: () => ipcRenderer.invoke('jdk:list'),
    download: (version: string, mirrorUrl: string) => {
      const handlers: ((p: unknown) => void)[] = []
      ipcRenderer.on('jdk:progress', (_e, p) => handlers.forEach((h) => h(p)))
      return {
        onProgress: (cb: (p: unknown) => void) => handlers.push(cb),
        start: () => ipcRenderer.invoke('jdk:download', { version, mirrorUrl }),
      }
    },
    uninstall: (jdkPath: string) => ipcRenderer.invoke('jdk:uninstall', jdkPath),
  },

  // 进程管理
  process: {
    spawn: (cmd: string, args: string[], options?: Record<string, unknown>) => {
      const stdoutHandlers: ((chunk: string) => void)[] = []
      const stderrHandlers: ((chunk: string) => void)[] = []
      let resolveExit!: (code: number) => void
      const onExit = new Promise<number>((r) => { resolveExit = r })

      ipcRenderer.on('process:stdout:' + cmd, (_e, chunk) => stdoutHandlers.forEach((h) => h(chunk)))
      ipcRenderer.on('process:stderr:' + cmd, (_e, chunk) => stderrHandlers.forEach((h) => h(chunk)))
      ipcRenderer.on('process:exit:' + cmd, (_e, code) => resolveExit(code))

      // 异步启动
      ipcRenderer.invoke('process:spawn', { cmd, args, options })

      return {
        pid: -1,
        stdout: { [Symbol.asyncIterator]: async function* () {} },
        stderr: { [Symbol.asyncIterator]: async function* () {} },
        onExit,
        kill: (signal?: string) => ipcRenderer.invoke('process:kill', { cmd, signal }),
      }
    },
    kill: (pid: number) => ipcRenderer.invoke('process:kill:pid', pid),
    list: () => ipcRenderer.invoke('process:list'),
  },

  // 环境检测
  env: {
    detectJava: () => ipcRenderer.invoke('env:detect', 'java'),
    detectGit: () => ipcRenderer.invoke('env:detect', 'git'),
    detectGradle: () => ipcRenderer.invoke('env:detect', 'gradle'),
    detectNetwork: (url: string) => ipcRenderer.invoke('env:network', url),
    getSystemInfo: () => ipcRenderer.invoke('env:system'),
  },

  // 平台信息
  platform: process.platform,
  isElectron: true,
})
