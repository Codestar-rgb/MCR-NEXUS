/**
 * 环境检测能力（Electron 主进程）
 *
 * 真实检测 Java/Git/Gradle + 网络 + 系统信息。
 */

import { spawn } from 'child_process'
import * as https from 'https'
import * as os from 'os'

interface ToolStatus {
  name: string
  installed: boolean
  version?: string
  path?: string
  fixAction?: string
}

interface NetworkStatus {
  reachable: boolean
  latency: number
  url: string
}

interface SystemInfo {
  platform: 'windows' | 'macos' | 'linux'
  arch: 'x64' | 'arm64'
  hostname: string
  totalMemory: number
  freeMemory: number
  cpus: number
}

export async function detectTool(name: 'java' | 'git' | 'gradle'): Promise<ToolStatus> {
  const args = name === 'java' ? ['-version'] : ['--version']
  return new Promise((resolve) => {
    const proc = spawn(name, args, { shell: true })
    let output = ''
    proc.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    proc.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    proc.on('exit', (code) => {
      if (code !== 0) {
        resolve({ name, installed: false, fixAction: `download_${name}` })
        return
      }
      const versionMatch = output.match(/version "?(?:1\.)?(\d+)[."]/) || output.match(/(\d+\.\d+\.\d+)/)
      const version = versionMatch?.[1] ?? 'unknown'
      resolve({
        name,
        installed: true,
        version,
        path: name === 'java' ? process.env.JAVA_HOME || '/usr/bin/java' : `/usr/bin/${name}`,
      })
    })
    proc.on('error', () => resolve({ name, installed: false, fixAction: `download_${name}` }))
  })
}

export async function detectNetwork(url: string): Promise<NetworkStatus> {
  const start = Date.now()
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve({
        reachable: res.statusCode !== undefined && res.statusCode < 500,
        latency: Date.now() - start,
        url,
      })
      req.destroy()
    })
    req.on('error', () => resolve({ reachable: false, latency: 0, url }))
    req.on('timeout', () => {
      req.destroy()
      resolve({ reachable: false, latency: 0, url })
    })
  })
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return {
    platform: process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux',
    arch: process.arch === 'arm64' ? 'arm64' : 'x64',
    hostname: os.hostname(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
  }
}
