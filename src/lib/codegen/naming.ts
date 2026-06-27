/**
 * 字符串命名转换工具（代码生成专用）
 *
 * - modId → PascalCase（用于主类名）
 * - registryId → ClassName（用于派生 Java 类名）
 * - 非法字符过滤（Forge modId 只允许 [a-z0-9_]
 *   Java 类名只允许 [A-Za-z0-9_$]）
 */

/** modId → PascalCase，例如 "example_mod" → "ExampleMod" */
export function modIdToPascalCase(modId: string): string {
  const cleaned = modId.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  return cleaned
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

/**
 * registryId → Java 类名片段，例如 "ruby_block" → "RubyBlock"
 * 已是 PascalCase 时原样返回（保持大写）
 */
export function registryIdToClassName(registryId: string, fallback: string): string {
  const raw = (registryId || '').trim()
  if (!raw) return fallback
  // 先按非字母数字下划线分割
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '_')
  const parts = cleaned
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
  return parts.join('') || fallback
}

/** modId + author → Java 包路径，例如 ("example_mod","Alice") → "com.alice.example_mod" */
export function buildJavaPackage(modId: string, author: string): string {
  const cleanAuthor = (author || 'nexcube')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^数字+/, '') // 不能以数字开头
    || 'nexcube'
  const cleanMod = (modId || 'example_mod')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]+/, '')
    || 'example_mod'
  return `com.${cleanAuthor}.${cleanMod}`
}

/** Java 包名 → 路径片段，例如 "com.alice.example_mod" → "com/alice/example_mod" */
export function packageToPath(pkg: string): string {
  return pkg.replace(/\./g, '/')
}

/** 读取 properties JSON 中的字段，提供默认值 */
export function readProp<T>(
  properties: Record<string, unknown> | null | undefined,
  key: string,
  fallback: T,
): T {
  if (!properties) return fallback
  const v = properties[key]
  return v === undefined || v === null ? fallback : (v as T)
}

/** 解析节点 properties JSON 字符串 → 对象（容错） */
export function parseProperties(json: string | null | undefined): Record<string, unknown> {
  if (!json) return {}
  try {
    const parsed = JSON.parse(json)
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
