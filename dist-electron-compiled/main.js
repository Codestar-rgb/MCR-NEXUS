"use strict";
/**
 * NexCube Electron 主进程入口
 *
 * 负责应用生命周期、窗口创建、IPC 注册、菜单构建。
 * dev 模式加载 http://localhost:3000（Next.js dev server）
 * 生产模式加载打包后的静态文件（out/index.html）
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const window_1 = require("./window");
const menu_1 = require("./menu");
const ipc_1 = require("./ipc");
const isDev = !electron_1.app.isPackaged;
electron_1.app.whenReady().then(() => {
    (0, menu_1.buildMenu)();
    (0, ipc_1.registerIpcHandlers)();
    (0, window_1.createWindow)(isDev);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            (0, window_1.createWindow)(isDev);
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// 安全：阻止新窗口默认行为
electron_1.app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});
//# sourceMappingURL=main.js.map