/**
 * 进程管理能力（Electron 主进程）
 */

import { spawn, type ChildProcess } from 'child_process'

const processes = new Map<string, ChildProcess>()

interface ProcessOptions {
  cwd?: string
  env?: Record<string, string>
  detached?: boolean
}

interface ProcessInfo {
  pid: number
  name: string
  cmd: string
  cpu: number
  memory: number
}

export function spawnProcess(
  cmd: string,
  args: string[],
  options: ProcessOptions,
  onStdout: (chunk: string) => void,
  onStderr: (chunk: string) => void,
  onExit: (code: number) => void,
): { pid: number } {
  const proc = spawn(cmd, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    shell: options.detached ?? false,
    detached: options.detached,
  })

  processes.set(cmd, proc)

  proc.stdout?.on('data', (chunk: Buffer) => onStdout(chunk.toString()))
  proc.stderr?.on('data', (chunk: Buffer) => onStderr(chunk.toString()))
  proc.on('exit', (code) => {
    processes.delete(cmd)
    onExit(code ?? 1)
  })
  proc.on('error', () => {
    processes.delete(cmd)
    onExit(1)
  })

  return { pid: proc.pid ?? -1 }
}

export async function killByPid(pid: number): Promise<void> {
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // 进程可能已退出
  }
}

export async function killByCmd(cmd: string, signal: string = 'SIGTERM'): Promise<void> {
  const proc = processes.get(cmd)
  if (proc) {
    proc.kill(signal as NodeJS.Signals)
    if (signal === 'SIGTERM') {
      setTimeout(() => {
        if (processes.has(cmd)) {
          proc.kill('SIGKILL')
          processes.delete(cmd)
        }
      }, 5000)
    } else {
      processes.delete(cmd)
    }
  }
}

export async function listProcesses(): Promise<ProcessInfo[]> {
  const result: ProcessInfo[] = []
  for (const [cmd, proc] of processes) {
    result.push({
      pid: proc.pid ?? -1,
      name: cmd,
      cmd,
      cpu: 0,
      memory: 0,
    })
  }
  return result
}
