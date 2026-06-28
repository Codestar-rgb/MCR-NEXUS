import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/settings/templates
 * 获取用户自定义工作区模板列表
 *
 * POST /api/settings/templates
 * 保存/更新用户自定义模板
 * body: { id, name, icon, color, nodes, edges }
 */

export async function GET() {
  try {
    const setting = await db.appSetting.findUnique({
      where: { key: 'user_templates' },
    })
    if (!setting) {
      return NextResponse.json({ templates: [] })
    }
    const templates = JSON.parse(setting.value)
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Failed to load user templates:', error)
    return NextResponse.json({ templates: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, icon, color, nodes, edges } = body

    if (!id || !name || !Array.isArray(nodes)) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, nodes' },
        { status: 400 },
      )
    }

    // 读取现有模板
    const existing = await db.appSetting.findUnique({
      where: { key: 'user_templates' },
    })
    const templates: unknown[] = existing ? JSON.parse(existing.value) : []

    // 构建模板对象
    const template = {
      id,
      name,
      description: `用户自定义模板（${nodes.length} 节点）`,
      icon: icon ?? 'Boxes',
      color: color ?? 'teal',
      isCustom: true,
      createdAt: Date.now(),
      nodes: nodes.map((n: { type: string; title: string; positionX: number; positionY: number; properties?: unknown }) => ({
        type: n.type,
        title: n.title,
        positionX: n.positionX,
        positionY: n.positionY,
        properties: n.properties ?? {},
      })),
      edges: Array.isArray(edges) ? edges : [],
    }

    // 替换或添加
    const idx = templates.findIndex((t: { id?: string }) => (t as { id?: string }).id === id)
    if (idx >= 0) {
      templates[idx] = template
    } else {
      templates.push(template)
    }

    // 保存
    await db.appSetting.upsert({
      where: { key: 'user_templates' },
      create: { key: 'user_templates', value: JSON.stringify(templates) },
      update: { value: JSON.stringify(templates) },
    })

    return NextResponse.json({ ok: true, template })
  } catch (error) {
    console.error('Failed to save user template:', error)
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const existing = await db.appSetting.findUnique({
      where: { key: 'user_templates' },
    })
    if (!existing) {
      return NextResponse.json({ ok: true })
    }

    const templates = JSON.parse(existing.value) as { id: string }[]
    const filtered = templates.filter((t) => t.id !== id)

    await db.appSetting.update({
      where: { key: 'user_templates' },
      data: { value: JSON.stringify(filtered) },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete user template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 },
    )
  }
}
