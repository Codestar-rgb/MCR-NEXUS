"use strict";
/**
 * JDK 能力（Electron 主进程）
 *
 * 真实 JDK 检测、下载、安装。
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
exports.detect = detect;
exports.listInstalled = listInstalled;
exports.download = download;
exports.uninstall = uninstall;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const fsp = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const https = __importStar(require("https"));
const JDK_INSTALL_DIR = path.join(os.homedir(), '.nexcube', 'jdks');
async function detect() {
    return new Promise((resolve) => {
        const proc = (0, child_process_1.spawn)('java', ['-version'], { shell: true });
        let stderr = '';
        proc.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        proc.on('exit', (code) => {
            if (code !== 0)
                return resolve(null);
            const match = stderr.match(/version "(\d+)(?:\.(\d+))?/);
            if (!match)
                return resolve(null);
            const major = match[1] === '1' ? match[2] : match[1];
            resolve({
                version: major,
                path: process.env.JAVA_HOME || '/usr/bin/java',
                isDefault: true,
            });
        });
        proc.on('error', () => resolve(null));
    });
}
async function listInstalled() {
    const result = [];
    const detected = await detect();
    if (detected)
        result.push(detected);
    if (fs.existsSync(JDK_INSTALL_DIR)) {
        try {
            const entries = await fsp.readdir(JDK_INSTALL_DIR);
            for (const entry of entries) {
                const jdkPath = path.join(JDK_INSTALL_DIR, entry);
                const javaBin = path.join(jdkPath, 'bin', 'java');
                if (fs.existsSync(javaBin)) {
                    result.push({
                        version: entry.replace('jdk-', ''),
                        path: jdkPath,
                        isDefault: false,
                    });
                }
            }
        }
        catch {
            // 忽略读取错误
        }
    }
    return result;
}
async function download(version, mirrorUrl, onProgress) {
    const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';
    const arch = process.arch === 'arm64' ? 'aarch64' : 'x64';
    const ext = platform === 'windows' ? 'zip' : 'tar.gz';
    const url = `${mirrorUrl}/${version}/jdk/${arch}/${platform}/OpenJDK${version}U-jdk_${arch}_${platform}_hotspot_${version}.${ext}`;
    await fsp.mkdir(JDK_INSTALL_DIR, { recursive: true });
    const archivePath = path.join(JDK_INSTALL_DIR, `jdk-${version}.${ext}`);
    await downloadFile(url, archivePath, (downloaded, total) => {
        onProgress?.({
            url,
            totalBytes: total,
            downloadedBytes: downloaded,
            percent: total > 0 ? (downloaded / total) * 100 : 0,
            speed: 0,
            status: 'downloading',
        });
    });
    onProgress?.({
        url,
        totalBytes: 0,
        downloadedBytes: 0,
        percent: 0,
        speed: 0,
        status: 'extracting',
    });
    const extractDir = path.join(JDK_INSTALL_DIR, `jdk-${version}`);
    if (ext === 'tar.gz') {
        await new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)('tar', ['-xzf', archivePath, '-C', JDK_INSTALL_DIR]);
            proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('extract failed'))));
            proc.on('error', reject);
        });
    }
    else {
        // Windows zip 解压（简化：假设有 unzip 或用 PowerShell）
        await new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)('powershell', [
                '-Command',
                `Expand-Archive -Path "${archivePath}" -DestinationPath "${JDK_INSTALL_DIR}" -Force`,
            ]);
            proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('extract failed'))));
            proc.on('error', reject);
        });
    }
    await fsp.unlink(archivePath);
    onProgress?.({
        url,
        totalBytes: 0,
        downloadedBytes: 0,
        percent: 100,
        speed: 0,
        status: 'done',
    });
    return extractDir;
}
function downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        let downloaded = 0;
        let total = 0;
        const request = https.get(url, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                file.close();
                fs.unlinkSync(dest);
                if (res.headers.location) {
                    downloadFile(res.headers.location, dest, onProgress).then(resolve).catch(reject);
                }
                else {
                    reject(new Error('redirect without location'));
                }
                return;
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            total = parseInt(res.headers['content-length'] || '0', 10);
            res.on('data', (chunk) => {
                downloaded += chunk.length;
                onProgress(downloaded, total);
            });
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        request.on('error', (err) => {
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}
async function uninstall(jdkPath) {
    await fsp.rm(jdkPath, { recursive: true, force: true });
}
//# sourceMappingURL=jdk.js.map