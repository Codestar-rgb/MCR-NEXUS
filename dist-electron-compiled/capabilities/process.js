"use strict";
/**
 * 进程管理能力（Electron 主进程）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnProcess = spawnProcess;
exports.killByPid = killByPid;
exports.killByCmd = killByCmd;
exports.listProcesses = listProcesses;
const child_process_1 = require("child_process");
const processes = new Map();
function spawnProcess(cmd, args, options, onStdout, onStderr, onExit) {
    const proc = (0, child_process_1.spawn)(cmd, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        shell: options.detached ?? false,
        detached: options.detached,
    });
    processes.set(cmd, proc);
    proc.stdout?.on('data', (chunk) => onStdout(chunk.toString()));
    proc.stderr?.on('data', (chunk) => onStderr(chunk.toString()));
    proc.on('exit', (code) => {
        processes.delete(cmd);
        onExit(code ?? 1);
    });
    proc.on('error', () => {
        processes.delete(cmd);
        onExit(1);
    });
    return { pid: proc.pid ?? -1 };
}
async function killByPid(pid) {
    try {
        process.kill(pid, 'SIGTERM');
    }
    catch {
        // 进程可能已退出
    }
}
async function killByCmd(cmd, signal = 'SIGTERM') {
    const proc = processes.get(cmd);
    if (proc) {
        proc.kill(signal);
        if (signal === 'SIGTERM') {
            setTimeout(() => {
                if (processes.has(cmd)) {
                    proc.kill('SIGKILL');
                    processes.delete(cmd);
                }
            }, 5000);
        }
        else {
            processes.delete(cmd);
        }
    }
}
async function listProcesses() {
    const result = [];
    for (const [cmd, proc] of processes) {
        result.push({
            pid: proc.pid ?? -1,
            name: cmd,
            cmd,
            cpu: 0,
            memory: 0,
        });
    }
    return result;
}
//# sourceMappingURL=process.js.map