/**
 * 文件系统能力（Electron 主进程）
 *
 * 使用 Node.js fs/promises + chokidar 实现真实文件系统操作。
 */

import * as fsp from 'fs/promises'
import * as path from 'path'
import { watch, type FSWatcher } from 'chokidar'

const watchers = new Map<string, FSWatcher>()

export async function read(filePath: string): Promise<string> {
  return fsp.readFile(filePath, 'utf-8')
}

export async function readBuffer(filePath: string): Promise<Buffer> {
  return fsp.readFile(filePath)
}

export async function write(filePath: string, content: string): Promise<void> {
  await fsp.mkdir(path.dirname(filePath), { recursive: true })
  await fsp.writeFile(filePath, content, 'utf-8')
}

export async function writeBuffer(filePath: string, content: Buffer): Promise<void> {
  await fsp.mkdir(path.dirname(filePath), { recursive: true })
  await fsp.writeFile(filePath, content)
}

export async function list(dir: string) {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  const result: Array<{ name: string; path: string; isDirectory: boolean; size: number; modifiedAt: Date }> = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    try {
      const stat = await fsp.stat(fullPath)
      result.push({
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtime,
      })
    } catch {
      // 跳过无权限的文件
    }
  }
  return result
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function mkdir(dirPath: string, recursive = true): Promise<void> {
  await fsp.mkdir(dirPath, { recursive })
}

export async function remove(filePath: string): Promise<void> {
  await fsp.rm(filePath, { recursive: true, force: true })
}

export async function stat(filePath: string) {
  const s = await fsp.stat(filePath)
  return {
    size: s.size,
    isDirectory: s.isDirectory(),
    createdAt: s.birthtime,
    modifiedAt: s.mtime,
  }
}

export function startWatch(
  filePath: string,
  callback: (event: { type: string; path: string }) => void,
): () => void {
  const watcher = watch(filePath, { persistent: true, ignoreInitial: true })
  watchers.set(filePath, watcher)

  watcher
    .on('add', (p) => callback({ type: 'create', path: p }))
    .on('change', (p) => callback({ type: 'modify', path: p }))
    .on('unlink', (p) => callback({ type: 'delete', path: p }))
    .on('addDir', (p) => callback({ type: 'create', path: p }))
    .on('unlinkDir', (p) => callback({ type: 'delete', path: p }))

  return () => {
    watcher.close()
    watchers.delete(filePath)
  }
}

export function stopWatch(filePath: string): void {
  const watcher = watchers.get(filePath)
  if (watcher) {
    watcher.close()
    watchers.delete(filePath)
  }
}
