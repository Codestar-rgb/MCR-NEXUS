/**
 * Electron 原生菜单
 *
 * 5 组菜单：文件 / 编辑 / 视图 / 构建 / 帮助
 * 通过 webContents.send 把菜单事件转发到渲染进程
 */

import { app, Menu, BrowserWindow, dialog, shell } from 'electron'

export function buildMenu(): void {
  const isDev = !app.isPackaged

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建项目...',
          accelerator: 'CmdOrCtrl+N',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:new-project'),
        },
        {
          label: '打开项目...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openDirectory'],
              title: '选择项目文件夹',
            })
            if (!result.canceled && result.filePaths[0]) {
              BrowserWindow.getFocusedWindow()?.webContents.send('menu:open-project', result.filePaths[0])
            }
          },
        },
        {
          label: '导入项目...',
          accelerator: 'CmdOrCtrl+I',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:import-project'),
        },
        { type: 'separator' },
        {
          label: '导出 Mod ZIP...',
          accelerator: 'CmdOrCtrl+E',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:export'),
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '构建',
      submenu: [
        {
          label: '构建 JAR',
          accelerator: 'CmdOrCtrl+B',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:build'),
        },
        {
          label: '启动测试客户端',
          accelerator: 'CmdOrCtrl+R',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:run-client'),
        },
        {
          label: '停止',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:stop'),
        },
        { type: 'separator' },
        {
          label: '清理构建',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:clean'),
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 NexCube',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:about'),
        },
        {
          label: '文档',
          click: () => shell.openExternal('https://github.com/Codestar-rgb/MCR-NEXUS'),
        },
        {
          label: '检查更新',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('menu:check-update'),
        },
      ],
    },
  ]

  if (isDev) {
    template.unshift({
      label: '开发',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '重新启动 Electron', click: () => app.relaunch() },
      ],
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
