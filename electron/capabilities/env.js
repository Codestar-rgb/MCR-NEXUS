"use strict";
/**
 * 环境检测能力（Electron 主进程）
 *
 * 真实检测 Java/Git/Gradle + 网络 + 系统信息。
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
exports.detectTool = detectTool;
exports.detectNetwork = detectNetwork;
exports.getSystemInfo = getSystemInfo;
const child_process_1 = require("child_process");
const https = __importStar(require("https"));
const os = __importStar(require("os"));
async function detectTool(name) {
    const args = name === 'java' ? ['-version'] : ['--version'];
    return new Promise((resolve) => {
        const proc = (0, child_process_1.spawn)(name, args, { shell: true });
        let output = '';
        proc.stdout?.on('data', (chunk) => {
            output += chunk.toString();
        });
        proc.stderr?.on('data', (chunk) => {
            output += chunk.toString();
        });
        proc.on('exit', (code) => {
            if (code !== 0) {
                resolve({ name, installed: false, fixAction: `download_${name}` });
                return;
            }
            const versionMatch = output.match(/version "?(?:1\.)?(\d+)[."]/) || output.match(/(\d+\.\d+\.\d+)/);
            const version = versionMatch?.[1] ?? 'unknown';
            resolve({
                name,
                installed: true,
                version,
                path: name === 'java' ? process.env.JAVA_HOME || '/usr/bin/java' : `/usr/bin/${name}`,
            });
        });
        proc.on('error', () => resolve({ name, installed: false, fixAction: `download_${name}` }));
    });
}
async function detectNetwork(url) {
    const start = Date.now();
    return new Promise((resolve) => {
        const req = https.get(url, { timeout: 5000 }, (res) => {
            resolve({
                reachable: res.statusCode !== undefined && res.statusCode < 500,
                latency: Date.now() - start,
                url,
            });
            req.destroy();
        });
        req.on('error', () => resolve({ reachable: false, latency: 0, url }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ reachable: false, latency: 0, url });
        });
    });
}
async function getSystemInfo() {
    return {
        platform: process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux',
        arch: process.arch === 'arm64' ? 'arm64' : 'x64',
        hostname: os.hostname(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
    };
}
//# sourceMappingURL=env.js.map