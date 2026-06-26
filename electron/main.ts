/**
 * NexCube Electron 主进程入口
 *
 * 负责应用生命周期、窗口创建、IPC 注册、菜单构建。
 * dev 模式加载 http://localhost:3000（Next.js dev server）
 * 生产模式加载打包后的静态文件（out/index.html）
 */

import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'
import { buildMenu } from './menu'
import { registerIpcHandlers } from './ipc'

const isDev = !app.isPackaged

app.whenReady().then(() => {
  buildMenu()
  registerIpcHandlers()
  createWindow(isDev)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(isDev)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 安全：阻止新窗口默认行为
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})
