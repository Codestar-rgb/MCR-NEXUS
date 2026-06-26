/**
 * IPC Handlers 注册（Electron 主进程）
 *
 * 将渲染进程的 IPC 调用路由到对应的能力模块。
 */

import { ipcMain } from 'electron'
import * as fsCap from '../capabilities/fs'
import * as buildCap from '../capabilities/build'
import * as jdkCap from '../capabilities/jdk'
import * as procCap from '../capabilities/process'
import * as envCap from '../capabilities/env'

export function registerIpcHandlers(): void {
  // === 文件系统 ===
  ipcMain.handle('fs:read', (_e, p: string) => fsCap.read(p))
  ipcMain.handle('fs:write', (_e, p: string, c: string) => fsCap.write(p, c))
  ipcMain.handle('fs:readBuffer', (_e, p: string) => fsCap.readBuffer(p))
  ipcMain.handle('fs:writeBuffer', (_e, p: string, c: Buffer) => fsCap.writeBuffer(p, c))
  ipcMain.handle('fs:list', (_e, d: string) => fsCap.list(d))
  ipcMain.handle('fs:exists', (_e, p: string) => fsCap.exists(p))
  ipcMain.handle('fs:mkdir', (_e, p: string, r?: boolean) => fsCap.mkdir(p, r))
  ipcMain.handle('fs:remove', (_e, p: string) => fsCap.remove(p))
  ipcMain.handle('fs:stat', (_e, p: string) => fsCap.stat(p))

  // 文件监听
  ipcMain.on('fs:watch:start', (event, p: string) => {
    fsCap.startWatch(p, (ev) => {
      event.sender.send('fs:watch:' + p, ev)
    })
  })
  ipcMain.on('fs:watch:stop', (_e, p: string) => {
    fsCap.stopWatch(p)
  })

  // === 构建（Gradle）===
  ipcMain.handle('build:run', async (event, { projectPath, task, options }) => {
    const win = event.sender
    return buildCap.runGradle(
      projectPath,
      task,
      options || {},
      (chunk) => win.send('build:output', chunk),
      (code) => win.send('build:complete', code),
    )
  })
  ipcMain.handle('build:stop', () => buildCap.stopGradle())
  ipcMain.handle('build:tasks', (_e, p: string) => buildCap.getAvailableTasks(p))

  // === JDK ===
  ipcMain.handle('jdk:detect', () => jdkCap.detect())
  ipcMain.handle('jdk:list', () => jdkCap.listInstalled())
  ipcMain.handle('jdk:download', async (event, { version, mirrorUrl }) => {
    return jdkCap.download(version, mirrorUrl, (p) => {
      event.sender.send('jdk:progress', p)
    })
  })
  ipcMain.handle('jdk:uninstall', (_e, p: string) => jdkCap.uninstall(p))

  // === 进程 ===
  ipcMain.handle('process:spawn', (event, { cmd, args, options }) => {
    return procCap.spawnProcess(
      cmd,
      args || [],
      options || {},
      (chunk) => event.sender.send('process:stdout:' + cmd, chunk),
      (chunk) => event.sender.send('process:stderr:' + cmd, chunk),
      (code) => event.sender.send('process:exit:' + cmd, code),
    )
  })
  ipcMain.handle('process:kill', (_e, { cmd, signal }) => procCap.killByCmd(cmd, signal || 'SIGTERM'))
  ipcMain.handle('process:kill:pid', (_e, pid: number) => procCap.killByPid(pid))
  ipcMain.handle('process:list', () => procCap.listProcesses())

  // === 环境 ===
  ipcMain.handle('env:detect', (_e, name: string) => envCap.detectTool(name as 'java' | 'git' | 'gradle'))
  ipcMain.handle('env:network', (_e, url: string) => envCap.detectNetwork(url))
  ipcMain.handle('env:system', () => envCap.getSystemInfo())
}
