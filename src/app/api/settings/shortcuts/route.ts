import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_SHORTCUTS: Record<string, string> = {
  undo: 'ctrl+z',
  redo: 'ctrl+shift+z',
  save: 'ctrl+s',
  build: 'ctrl+b',
  export: 'ctrl+e',
  toggleMode: 'ctrl+/',
  fitView: 'ctrl+0',
  zoomIn: 'ctrl+=',
  zoomOut: 'ctrl+-',
  format: 'alt+shift+f',
  findReplace: 'ctrl+h',
}

export async function GET() {
  try {
    const row = await db.appSetting.findUnique({ where: { key: 'shortcuts' } })
    const shortcuts = row ? JSON.parse(row.value) : DEFAULT_SHORTCUTS
    return NextResponse.json({ shortcuts })
  } catch (err) {
    console.error('[API] GET shortcuts error:', err)
    return NextResponse.json({ shortcuts: DEFAULT_SHORTCUTS })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const shortcuts = body.shortcuts as Record<string, string>
    await db.appSetting.upsert({
      where: { key: 'shortcuts' },
      create: { key: 'shortcuts', value: JSON.stringify(shortcuts) },
      update: { value: JSON.stringify(shortcuts) },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] POST shortcuts error:', err)
    return NextResponse.json({ error: 'failed_to_save' }, { status: 500 })
  }
}
