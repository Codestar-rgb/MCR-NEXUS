"use strict";
/**
 * 文件系统能力（Electron 主进程）
 *
 * 使用 Node.js fs/promises + chokidar 实现真实文件系统操作。
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
exports.read = read;
exports.readBuffer = readBuffer;
exports.write = write;
exports.writeBuffer = writeBuffer;
exports.list = list;
exports.exists = exists;
exports.mkdir = mkdir;
exports.remove = remove;
exports.stat = stat;
exports.startWatch = startWatch;
exports.stopWatch = stopWatch;
const fsp = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const chokidar_1 = require("chokidar");
const watchers = new Map();
async function read(filePath) {
    return fsp.readFile(filePath, 'utf-8');
}
async function readBuffer(filePath) {
    return fsp.readFile(filePath);
}
async function write(filePath, content) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, content, 'utf-8');
}
async function writeBuffer(filePath, content) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, content);
}
async function list(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const result = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
            const stat = await fsp.stat(fullPath);
            result.push({
                name: entry.name,
                path: fullPath,
                isDirectory: entry.isDirectory(),
                size: stat.size,
                modifiedAt: stat.mtime,
            });
        }
        catch {
            // 跳过无权限的文件
        }
    }
    return result;
}
async function exists(filePath) {
    try {
        await fsp.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function mkdir(dirPath, recursive = true) {
    await fsp.mkdir(dirPath, { recursive });
}
async function remove(filePath) {
    await fsp.rm(filePath, { recursive: true, force: true });
}
async function stat(filePath) {
    const s = await fsp.stat(filePath);
    return {
        size: s.size,
        isDirectory: s.isDirectory(),
        createdAt: s.birthtime,
        modifiedAt: s.mtime,
    };
}
function startWatch(filePath, callback) {
    const watcher = (0, chokidar_1.watch)(filePath, { persistent: true, ignoreInitial: true });
    watchers.set(filePath, watcher);
    watcher
        .on('add', (p) => callback({ type: 'create', path: p }))
        .on('change', (p) => callback({ type: 'modify', path: p }))
        .on('unlink', (p) => callback({ type: 'delete', path: p }))
        .on('addDir', (p) => callback({ type: 'create', path: p }))
        .on('unlinkDir', (p) => callback({ type: 'delete', path: p }));
    return () => {
        watcher.close();
        watchers.delete(filePath);
    };
}
function stopWatch(filePath) {
    const watcher = watchers.get(filePath);
    if (watcher) {
        watcher.close();
        watchers.delete(filePath);
    }
}
//# sourceMappingURL=fs.js.map