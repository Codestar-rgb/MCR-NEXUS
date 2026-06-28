"use strict";
/**
 * Electron Preload 脚本
 *
 * 通过 contextBridge 安全暴露主进程 API 到渲染进程。
 * 渲染进程通过 window.nexcube.* 调用，不直接访问 Node.js。
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('nexcube', {
    // 文件系统
    fs: {
        read: (p) => electron_1.ipcRenderer.invoke('fs:read', p),
        write: (p, c) => electron_1.ipcRenderer.invoke('fs:write', p, c),
        readBuffer: (p) => electron_1.ipcRenderer.invoke('fs:readBuffer', p),
        writeBuffer: (p, c) => electron_1.ipcRenderer.invoke('fs:writeBuffer', p, c),
        list: (d) => electron_1.ipcRenderer.invoke('fs:list', d),
        exists: (p) => electron_1.ipcRenderer.invoke('fs:exists', p),
        mkdir: (p, r) => electron_1.ipcRenderer.invoke('fs:mkdir', p, r),
        remove: (p) => electron_1.ipcRenderer.invoke('fs:remove', p),
        stat: (p) => electron_1.ipcRenderer.invoke('fs:stat', p),
        watch: (p, callback) => {
            const handler = (_, event) => callback(event);
            electron_1.ipcRenderer.on('fs:watch:' + p, handler);
            electron_1.ipcRenderer.send('fs:watch:start', p);
            return () => {
                electron_1.ipcRenderer.removeListener('fs:watch:' + p, handler);
                electron_1.ipcRenderer.send('fs:watch:stop', p);
            };
        },
    },
    // 构建（Gradle）
    build: {
        runGradle: (projectPath, task, options) => {
            const outputHandlers = [];
            const completeHandlers = [];
            electron_1.ipcRenderer.on('build:output', (_e, chunk) => {
                outputHandlers.forEach((h) => h(chunk));
            });
            electron_1.ipcRenderer.on('build:complete', (_e, code) => {
                completeHandlers.forEach((h) => h(code));
            });
            return {
                pid: -1,
                onOutput: (cb) => outputHandlers.push(cb),
                onComplete: (cb) => completeHandlers.push(cb),
                start: () => electron_1.ipcRenderer.invoke('build:run', { projectPath, task, options }),
                kill: () => electron_1.ipcRenderer.invoke('build:stop'),
            };
        },
        getAvailableTasks: (projectPath) => electron_1.ipcRenderer.invoke('build:tasks', projectPath),
    },
    // JDK 管理
    jdk: {
        detect: () => electron_1.ipcRenderer.invoke('jdk:detect'),
        listInstalled: () => electron_1.ipcRenderer.invoke('jdk:list'),
        download: (version, mirrorUrl) => {
            const handlers = [];
            electron_1.ipcRenderer.on('jdk:progress', (_e, p) => handlers.forEach((h) => h(p)));
            return {
                onProgress: (cb) => handlers.push(cb),
                start: () => electron_1.ipcRenderer.invoke('jdk:download', { version, mirrorUrl }),
            };
        },
        uninstall: (jdkPath) => electron_1.ipcRenderer.invoke('jdk:uninstall', jdkPath),
    },
    // 进程管理
    process: {
        spawn: (cmd, args, options) => {
            const stdoutHandlers = [];
            const stderrHandlers = [];
            let resolveExit;
            const onExit = new Promise((r) => { resolveExit = r; });
            electron_1.ipcRenderer.on('process:stdout:' + cmd, (_e, chunk) => stdoutHandlers.forEach((h) => h(chunk)));
            electron_1.ipcRenderer.on('process:stderr:' + cmd, (_e, chunk) => stderrHandlers.forEach((h) => h(chunk)));
            electron_1.ipcRenderer.on('process:exit:' + cmd, (_e, code) => resolveExit(code));
            // 异步启动
            electron_1.ipcRenderer.invoke('process:spawn', { cmd, args, options });
            return {
                pid: -1,
                stdout: { [Symbol.asyncIterator]: async function* () { } },
                stderr: { [Symbol.asyncIterator]: async function* () { } },
                onExit,
                kill: (signal) => electron_1.ipcRenderer.invoke('process:kill', { cmd, signal }),
            };
        },
        kill: (pid) => electron_1.ipcRenderer.invoke('process:kill:pid', pid),
        list: () => electron_1.ipcRenderer.invoke('process:list'),
    },
    // 环境检测
    env: {
        detectJava: () => electron_1.ipcRenderer.invoke('env:detect', 'java'),
        detectGit: () => electron_1.ipcRenderer.invoke('env:detect', 'git'),
        detectGradle: () => electron_1.ipcRenderer.invoke('env:detect', 'gradle'),
        detectNetwork: (url) => electron_1.ipcRenderer.invoke('env:network', url),
        getSystemInfo: () => electron_1.ipcRenderer.invoke('env:system'),
    },
    // 平台信息
    platform: process.platform,
    isElectron: true,
});
//# sourceMappingURL=preload.js.map