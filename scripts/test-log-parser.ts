import { parseGradleLog, getRuleCount, listParseRules } from '../src/lib/capabilities/log-parser'

console.log('=== Total Rule Count ===')
console.log(`Total: ${getRuleCount()}`)

console.log('\n=== Rule Categories (by ID prefix) ===')
const rules = listParseRules()
const categories: Record<string, number> = {}
for (const r of rules) {
  const prefix = r.id.split('-')[0]
  categories[prefix] = (categories[prefix] || 0) + 1
}
for (const [prefix, count] of Object.entries(categories).sort()) {
  console.log(`  ${prefix}: ${count}`)
}

console.log('\n=== Levels ===')
const levels: Record<string, number> = {}
for (const r of rules) {
  levels[r.level] = (levels[r.level] || 0) + 1
}
for (const [lvl, count] of Object.entries(levels)) {
  console.log(`  ${lvl}: ${count}`)
}

console.log('\n=== Unique IDs check ===')
const ids = new Set<string>()
let dupes = 0
for (const r of rules) {
  if (ids.has(r.id)) {
    console.log(`  DUPLICATE: ${r.id}`)
    dupes++
  }
  ids.add(r.id)
}
console.log(`  Unique IDs: ${ids.size} / Total: ${rules.length} (dupes: ${dupes})`)

console.log('\n=== Test Sample Log Parsing ===')
const sample = `
> Task :compileJava
src/main/java/com/example/Mod.java:10: error: cannot find symbol
  symbol:   class Block
  location: class com.example.Mod
src/main/java/com/example/Mod.java:15: error: ';' expected
src/main/java/com/example/Mod.java:20: error: incompatible types: bad type in code
  required: String
  found:    int
Execution failed for task ':compileJava'.
> Could not resolve all dependencies for configuration 'runtimeClasspath'.
> Could not find net.minecraftforge:forge:1.20.1-47.3.7.
Dependency resolution failed for configuration ':compileClasspath'

> Task :compileJava FAILED
BUILD FAILED in 12s

java.lang.OutOfMemoryError: Java heap space
java.lang.StackOverflowError
java.lang.NullPointerException
    at com.example.Mod.onInit(Mod.java:42)

SSL handshake failed
Connection timed out
Unknown host: repo.maven.apache.org

ModLoadingException: Failed to load mod examplemod
Missing mod dependency: forge@47.3.7
@Mod annotation missing in main class

error: unclosed string literal
error: variable x might not have been initialized

reobfJar failed
ForgeGradle not configured
`
const cards = parseGradleLog(sample)
console.log(`Parsed ${cards.length} cards:`)
for (const c of cards) {
  console.log(`  [${c.level}] L${c.lineRange?.[0] || '?'} ${c.title} — ${c.analysis.substring(0, 80)}${c.analysis.length > 80 ? '...' : ''}`)
}
