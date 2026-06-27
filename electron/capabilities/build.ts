/**
 * 构建能力（Electron 主进程）
 *
 * 真实执行 Gradle 构建：spawn gradlew + 流式输出。
 */

import { spawn, type ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

let currentProcess: ChildProcess | null = null

interface GradleOptions {
  offline?: boolean
  daemon?: boolean
  args?: string[]
  jvmArgs?: string[]
}

export async function runGradle(
  projectPath: string,
  task: string,
  options: GradleOptions,
  onOutput: (chunk: string) => void,
  onComplete: (code: number) => void,
): Promise<{ pid: number }> {
  const isWin = process.platform === 'win32'
  const gradlew = isWin ? 'gradlew.bat' : 'gradlew'
  const gradlewPath = path.join(projectPath, gradlew)

  if (!fs.existsSync(gradlewPath)) {
    throw new Error(`gradlew not found at ${gradlewPath}`)
  }

  const args = [task]
  if (options.offline) args.push('--offline')
  if (options.daemon === false) args.push('--no-daemon')
  if (options.args) args.push(...options.args)

  const env: Record<string, string | undefined> = { ...process.env }
  if (options.jvmArgs && options.jvmArgs.length > 0) {
    env.JAVA_TOOL_OPTIONS = options.jvmArgs.map((a) => (a.startsWith('-') ? a : '-' + a)).join(' ')
  }

  currentProcess = spawn(gradlewPath, args, {
    cwd: projectPath,
    env,
    shell: isWin,
  })

  currentProcess.stdout?.on('data', (chunk: Buffer) => {
    onOutput(chunk.toString('utf-8'))
  })
  currentProcess.stderr?.on('data', (chunk: Buffer) => {
    onOutput(chunk.toString('utf-8'))
  })
  currentProcess.on('exit', (code) => {
    currentProcess = null
    onComplete(code ?? 1)
  })
  currentProcess.on('error', (err) => {
    onOutput(`Error: ${err.message}\n`)
    currentProcess = null
    onComplete(1)
  })

  return { pid: currentProcess.pid ?? -1 }
}

export async function stopGradle(): Promise<void> {
  if (currentProcess) {
    currentProcess.kill('SIGTERM')
    setTimeout(() => {
      if (currentProcess) currentProcess.kill('SIGKILL')
    }, 5000)
    currentProcess = null
  }
}

export async function getAvailableTasks(projectPath: string): Promise<string[]> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32'
    const gradlew = isWin ? 'gradlew.bat' : 'gradlew'
    const proc = spawn(path.join(projectPath, gradlew), ['tasks', '--all'], {
      cwd: projectPath,
      shell: isWin,
    })
    let output = ''
    proc.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    proc.on('exit', () => {
      const tasks = output
        .split('\n')
        .filter((l) => /^[a-z][\w:]*\s+-/.test(l))
        .map((l) => l.trim().split(/\s+/)[0])
      resolve(tasks)
    })
    proc.on('error', () => resolve([]))
  })
}
