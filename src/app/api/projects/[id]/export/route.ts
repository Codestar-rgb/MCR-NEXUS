import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { db } from '@/lib/db'
import {
  generateProjectCode,
  type CodegenNode,
  type CodegenOptions,
} from '@/lib/codegen'
import { gitHistory } from '@/lib/git-history'

/**
 * POST /api/projects/[id]/export
 *
 * 导出完整 Forge 1.20.1 项目 ZIP。
 *
 * 请求体（可选，默认全包含）:
 *   {
 *     "includeGradleWrapper": boolean,
 *     "includeReadme":        boolean,
 *     "includeGitignore":     boolean,
 *     "commitMessage":        string  // 默认 "Export project"
 *   }
 *
 * 响应:
 *   - 200: application/zip 文件流（Content-Disposition: attachment）
 *   - 404: 项目不存在
 *   - 500: 内部错误
 *
 * 工作流:
 *   1. 从 DB 加载 project + 主画布节点（subGraphId IS NULL）
 *   2. 调用 generateProjectCode 生成所有文件
 *   3. 用 JSZip 打包成 ZIP（含 gradlew、build.gradle、Java 源、资源）
 *   4. 写一条 Git 历史 commit（mock）
 *   5. 返回 application/zip
 */

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params

    // 1) 加载项目 + 节点
    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
    }

    const dbNodes = await db.node.findMany({
      where: { projectId: id, subGraphId: null },
      select: {
        id: true,
        type: true,
        title: true,
        properties: true,
        sourceCode: true,
      },
    })

    // 2) 解析请求选项
    let body: Partial<CodegenOptions & { commitMessage?: string }> = {}
    try {
      body = (await req.json()) as Partial<CodegenOptions & { commitMessage?: string }>
    } catch {
      // 允许无 body
      body = {}
    }
    const options: CodegenOptions = {
      includeGradleWrapper: body.includeGradleWrapper !== false,
      includeReadme: body.includeReadme !== false,
      includeGitignore: body.includeGitignore !== false,
    }

    // 3) 转换节点 → CodegenNode
    const codegenNodes: CodegenNode[] = dbNodes.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      properties: n.properties,
      sourceCode: n.sourceCode,
    }))

    // 4) 生成所有文件
    const files = generateProjectCode(project, codegenNodes, options)

    // 5) 打包 ZIP
    const zip = new JSZip()
    const topFolder = project.modId || 'mod'
    for (const f of files) {
      zip.file(`${topFolder}/${f.path}`, f.content)
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    // 6) 记录 Git 历史（mock）
    const commitMsg = body.commitMessage || `Export ${project.name} v${project.version}`
    gitHistory.commit(commitMsg, files.map((f) => f.path))

    // 7) 构建响应
    const filename = `${project.modId}-${project.version}.zip`
    const safeFilename = encodeURIComponent(filename)

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${safeFilename}`,
        'Content-Length': String(zipBuffer.byteLength),
        'Cache-Control': 'no-store',
        'X-NexCube-File-Count': String(files.length),
        'X-NexCube-Project-Id': project.id,
      },
    })
  } catch (err) {
    console.error('[API] POST /api/projects/[id]/export error:', err)
    return NextResponse.json(
      {
        error: 'failed_to_export',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/projects/[id]/export?preview=true
 *
 * 返回导出预览（文件清单 + 总字节数），不生成 ZIP。
 * 用于 UI 在用户点击"导出"前显示将要打包的文件。
 */
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
    }

    const dbNodes = await db.node.findMany({
      where: { projectId: id, subGraphId: null },
      select: {
        id: true,
        type: true,
        title: true,
        properties: true,
        sourceCode: true,
      },
    })

    const codegenNodes: CodegenNode[] = dbNodes.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      properties: n.properties,
      sourceCode: n.sourceCode,
    }))

    const files = generateProjectCode(project, codegenNodes, {
      includeGradleWrapper: true,
      includeReadme: true,
      includeGitignore: true,
    })

    return NextResponse.json({
      projectId: project.id,
      modId: project.modId,
      version: project.version,
      totalFiles: files.length,
      totalBytes: files.reduce((sum, f) => sum + Buffer.byteLength(f.content, 'utf-8'), 0),
      files: files.map((f) => ({
        path: f.path,
        bytes: Buffer.byteLength(f.content, 'utf-8'),
        executable: f.executable ?? false,
      })),
    })
  } catch (err) {
    console.error('[API] GET /api/projects/[id]/export error:', err)
    return NextResponse.json({ error: 'failed_to_preview_export' }, { status: 500 })
  }
}
