"use strict";
/**
 * 构建能力（Electron 主进程）
 *
 * 真实执行 Gradle 构建：spawn gradlew + 流式输出。
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
exports.runGradle = runGradle;
exports.stopGradle = stopGradle;
exports.getAvailableTasks = getAvailableTasks;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let currentProcess = null;
async function runGradle(projectPath, task, options, onOutput, onComplete) {
    const isWin = process.platform === 'win32';
    const gradlew = isWin ? 'gradlew.bat' : 'gradlew';
    const gradlewPath = path.join(projectPath, gradlew);
    if (!fs.existsSync(gradlewPath)) {
        throw new Error(`gradlew not found at ${gradlewPath}`);
    }
    const args = [task];
    if (options.offline)
        args.push('--offline');
    if (options.daemon === false)
        args.push('--no-daemon');
    if (options.args)
        args.push(...options.args);
    const env = { ...process.env };
    if (options.jvmArgs && options.jvmArgs.length > 0) {
        env.JAVA_TOOL_OPTIONS = options.jvmArgs.map((a) => (a.startsWith('-') ? a : '-' + a)).join(' ');
    }
    currentProcess = (0, child_process_1.spawn)(gradlewPath, args, {
        cwd: projectPath,
        env,
        shell: isWin,
    });
    currentProcess.stdout?.on('data', (chunk) => {
        onOutput(chunk.toString('utf-8'));
    });
    currentProcess.stderr?.on('data', (chunk) => {
        onOutput(chunk.toString('utf-8'));
    });
    currentProcess.on('exit', (code) => {
        currentProcess = null;
        onComplete(code ?? 1);
    });
    currentProcess.on('error', (err) => {
        onOutput(`Error: ${err.message}\n`);
        currentProcess = null;
        onComplete(1);
    });
    return { pid: currentProcess.pid ?? -1 };
}
async function stopGradle() {
    if (currentProcess) {
        currentProcess.kill('SIGTERM');
        setTimeout(() => {
            if (currentProcess)
                currentProcess.kill('SIGKILL');
        }, 5000);
        currentProcess = null;
    }
}
async function getAvailableTasks(projectPath) {
    return new Promise((resolve) => {
        const isWin = process.platform === 'win32';
        const gradlew = isWin ? 'gradlew.bat' : 'gradlew';
        const proc = (0, child_process_1.spawn)(path.join(projectPath, gradlew), ['tasks', '--all'], {
            cwd: projectPath,
            shell: isWin,
        });
        let output = '';
        proc.stdout?.on('data', (chunk) => {
            output += chunk.toString();
        });
        proc.on('exit', () => {
            const tasks = output
                .split('\n')
                .filter((l) => /^[a-z][\w:]*\s+-/.test(l))
                .map((l) => l.trim().split(/\s+/)[0]);
            resolve(tasks);
        });
        proc.on('error', () => resolve([]));
    });
}
//# sourceMappingURL=build.js.map