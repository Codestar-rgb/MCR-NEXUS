/**
 * JDK 能力（Electron 主进程）
 *
 * 真实 JDK 检测、下载、安装。
 */

import { spawn } from 'child_process'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import * as https from 'https'

const JDK_INSTALL_DIR = path.join(os.homedir(), '.nexcube', 'jdks')

interface JdkInfo {
  version: string
  path: string
  isDefault: boolean
}

interface JdkProgress {
  url: string
  totalBytes: number
  downloadedBytes: number
  percent: number
  speed: number
  status: 'downloading' | 'extracting' | 'configuring' | 'done' | 'failed'
}

export async function detect(): Promise<JdkInfo | null> {
  return new Promise((resolve) => {
    const proc = spawn('java', ['-version'], { shell: true })
    let stderr = ''
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    proc.on('exit', (code) => {
      if (code !== 0) return resolve(null)
      const match = stderr.match(/version "(\d+)(?:\.(\d+))?/)
      if (!match) return resolve(null)
      const major = match[1] === '1' ? match[2] : match[1]
      resolve({
        version: major,
        path: process.env.JAVA_HOME || '/usr/bin/java',
        isDefault: true,
      })
    })
    proc.on('error', () => resolve(null))
  })
}

export async function listInstalled(): Promise<JdkInfo[]> {
  const result: JdkInfo[] = []
  const detected = await detect()
  if (detected) result.push(detected)

  if (fs.existsSync(JDK_INSTALL_DIR)) {
    try {
      const entries = await fsp.readdir(JDK_INSTALL_DIR)
      for (const entry of entries) {
        const jdkPath = path.join(JDK_INSTALL_DIR, entry)
        const javaBin = path.join(jdkPath, 'bin', 'java')
        if (fs.existsSync(javaBin)) {
          result.push({
            version: entry.replace('jdk-', ''),
            path: jdkPath,
            isDefault: false,
          })
        }
      }
    } catch {
      // 忽略读取错误
    }
  }
  return result
}

export async function download(
  version: string,
  mirrorUrl: string,
  onProgress?: (p: JdkProgress) => void,
): Promise<string> {
  const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux'
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x64'
  const ext = platform === 'windows' ? 'zip' : 'tar.gz'

  const url = `${mirrorUrl}/${version}/jdk/${arch}/${platform}/OpenJDK${version}U-jdk_${arch}_${platform}_hotspot_${version}.${ext}`

  await fsp.mkdir(JDK_INSTALL_DIR, { recursive: true })
  const archivePath = path.join(JDK_INSTALL_DIR, `jdk-${version}.${ext}`)

  await downloadFile(url, archivePath, (downloaded, total) => {
    onProgress?.({
      url,
      totalBytes: total,
      downloadedBytes: downloaded,
      percent: total > 0 ? (downloaded / total) * 100 : 0,
      speed: 0,
      status: 'downloading',
    })
  })

  onProgress?.({
    url,
    totalBytes: 0,
    downloadedBytes: 0,
    percent: 0,
    speed: 0,
    status: 'extracting',
  })

  const extractDir = path.join(JDK_INSTALL_DIR, `jdk-${version}`)

  if (ext === 'tar.gz') {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('tar', ['-xzf', archivePath, '-C', JDK_INSTALL_DIR])
      proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('extract failed'))))
      proc.on('error', reject)
    })
  } else {
    // Windows zip 解压（简化：假设有 unzip 或用 PowerShell）
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('powershell', [
        '-Command',
        `Expand-Archive -Path "${archivePath}" -DestinationPath "${JDK_INSTALL_DIR}" -Force`,
      ])
      proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('extract failed'))))
      proc.on('error', reject)
    })
  }

  await fsp.unlink(archivePath)

  onProgress?.({
    url,
    totalBytes: 0,
    downloadedBytes: 0,
    percent: 100,
    speed: 0,
    status: 'done',
  })

  return extractDir
}

function downloadFile(
  url: string,
  dest: string,
  onProgress: (downloaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    let downloaded = 0
    let total = 0

    const request = https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close()
        fs.unlinkSync(dest)
        if (res.headers.location) {
          downloadFile(res.headers.location, dest, onProgress).then(resolve).catch(reject)
        } else {
          reject(new Error('redirect without location'))
        }
        return
      }
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      total = parseInt(res.headers['content-length'] || '0', 10)
      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length
        onProgress(downloaded, total)
      })
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    })
    request.on('error', (err) => {
      fs.unlinkSync(dest)
      reject(err)
    })
  })
}

export async function uninstall(jdkPath: string): Promise<void> {
  await fsp.rm(jdkPath, { recursive: true, force: true })
}
