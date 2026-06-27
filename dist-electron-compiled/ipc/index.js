"use strict";
/**
 * IPC Handlers 注册（Electron 主进程）
 *
 * 将渲染进程的 IPC 调用路由到对应的能力模块。
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const fsCap = __importStar(require("../capabilities/fs"));
const buildCap = __importStar(require("../capabilities/build"));
const jdkCap = __importStar(require("../capabilities/jdk"));
const procCap = __importStar(require("../capabilities/process"));
const envCap = __importStar(require("../capabilities/env"));
function registerIpcHandlers() {
    // === 文件系统 ===
    electron_1.ipcMain.handle('fs:read', (_e, p) => fsCap.read(p));
    electron_1.ipcMain.handle('fs:write', (_e, p, c) => fsCap.write(p, c));
    electron_1.ipcMain.handle('fs:readBuffer', (_e, p) => fsCap.readBuffer(p));
    electron_1.ipcMain.handle('fs:writeBuffer', (_e, p, c) => fsCap.writeBuffer(p, c));
    electron_1.ipcMain.handle('fs:list', (_e, d) => fsCap.list(d));
    electron_1.ipcMain.handle('fs:exists', (_e, p) => fsCap.exists(p));
    electron_1.ipcMain.handle('fs:mkdir', (_e, p, r) => fsCap.mkdir(p, r));
    electron_1.ipcMain.handle('fs:remove', (_e, p) => fsCap.remove(p));
    electron_1.ipcMain.handle('fs:stat', (_e, p) => fsCap.stat(p));
    // 文件监听
    electron_1.ipcMain.on('fs:watch:start', (event, p) => {
        fsCap.startWatch(p, (ev) => {
            event.sender.send('fs:watch:' + p, ev);
        });
    });
    electron_1.ipcMain.on('fs:watch:stop', (_e, p) => {
        fsCap.stopWatch(p);
    });
    // === 构建（Gradle）===
    electron_1.ipcMain.handle('build:run', async (event, { projectPath, task, options }) => {
        const win = event.sender;
        return buildCap.runGradle(projectPath, task, options || {}, (chunk) => win.send('build:output', chunk), (code) => win.send('build:complete', code));
    });
    electron_1.ipcMain.handle('build:stop', () => buildCap.stopGradle());
    electron_1.ipcMain.handle('build:tasks', (_e, p) => buildCap.getAvailableTasks(p));
    // === JDK ===
    electron_1.ipcMain.handle('jdk:detect', () => jdkCap.detect());
    electron_1.ipcMain.handle('jdk:list', () => jdkCap.listInstalled());
    electron_1.ipcMain.handle('jdk:download', async (event, { version, mirrorUrl }) => {
        return jdkCap.download(version, mirrorUrl, (p) => {
            event.sender.send('jdk:progress', p);
        });
    });
    electron_1.ipcMain.handle('jdk:uninstall', (_e, p) => jdkCap.uninstall(p));
    // === 进程 ===
    electron_1.ipcMain.handle('process:spawn', (event, { cmd, args, options }) => {
        return procCap.spawnProcess(cmd, args || [], options || {}, (chunk) => event.sender.send('process:stdout:' + cmd, chunk), (chunk) => event.sender.send('process:stderr:' + cmd, chunk), (code) => event.sender.send('process:exit:' + cmd, code));
    });
    electron_1.ipcMain.handle('process:kill', (_e, { cmd, signal }) => procCap.killByCmd(cmd, signal || 'SIGTERM'));
    electron_1.ipcMain.handle('process:kill:pid', (_e, pid) => procCap.killByPid(pid));
    electron_1.ipcMain.handle('process:list', () => procCap.listProcesses());
    // === 环境 ===
    electron_1.ipcMain.handle('env:detect', (_e, name) => envCap.detectTool(name));
    electron_1.ipcMain.handle('env:network', (_e, url) => envCap.detectNetwork(url));
    electron_1.ipcMain.handle('env:system', () => envCap.getSystemInfo());
}
//# sourceMappingURL=index.js.map