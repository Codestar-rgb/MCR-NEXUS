'use client'

/**
 * NexCube Code Editor — Monaco Editor 集成
 *
 * 功能：
 *  - Monaco Editor（dynamic import + ssr:false，避免 Next.js 16 SSR 报 window is not defined）
 *  - Java 语法高亮（Monaco 内置）
 *  - MC API 智能补全（来自 mc-api-dictionary 390+ 类）
 *  - 深色主题 'nexcube-dark'（背景 #0a0a0a，与项目主题一致）
 *  - 光标位置回调（onSelectionChange）
 *
 * 集成点：
 *  - workspace-shell.tsx 模式 === 'code' 时显示
 *  - file-tabs.tsx 切换文件时更新 value
 *  - code-toolbar.tsx 同步按钮触发 AST 解析（Task 4-B）
 */

import dynamic from 'next/dynamic'
import { useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'
import {
  MC_API_DICTIONARY,
  getMonacoSuggestions,
} from '@/lib/codegen/mc-api-dictionary'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 动态加载 Monaco（避免 SSR 报错）                                    */
/* ------------------------------------------------------------------ */

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          加载 Monaco 编辑器...
        </div>
      </div>
    ),
  },
)

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

export interface CodeEditorProps {
  /** 当前文件内容 */
  value: string
  /** 语言（默认 'java'，Monaco 内置支持） */
  language?: string
  /** 内容变化回调 */
  onChange?: (value: string) => void
  /** 光标位置变化回调 */
  onSelectionChange?: (line: number, column: number) => void
  /** 文件路径（用于 Monaco model URI，避免切换文件时残留状态） */
  filePath?: string
  /** 只读模式 */
  readOnly?: boolean
  className?: string
}

/* ------------------------------------------------------------------ */
/* 主题与补全配置（模块级常量避免重复注册）                              */
/* ------------------------------------------------------------------ */

const THEME_NAME = 'nexcube-dark'

/** 防止多次注册同一语言补全提供者（StrictMode 双调用） */
let completionProviderRegistered = false
/** 防止多次定义同一主题 */
let themeDefined = false

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function CodeEditor({
  value,
  language = 'java',
  onChange,
  onSelectionChange,
  filePath,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  /* ---------------------------------------------------------------- */
  /* beforeMount：注册主题 + 补全提供者                                 */
  /* ---------------------------------------------------------------- */

  const handleBeforeMount = useCallback((monaco: typeof import('monaco-editor')) => {
    // 1. 定义深色主题（仅一次）
    if (!themeDefined) {
      monaco.editor.defineTheme(THEME_NAME, {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff7b72' },
          { token: 'string', foreground: 'a5d6ff' },
          { token: 'string.html', foreground: 'a5d6ff' },
          { token: 'number', foreground: '79c0ff' },
          { token: 'type', foreground: 'ffa657' },
          { token: 'type.identifier', foreground: 'ffa657' },
          { token: 'identifier', foreground: 'c9d1d9' },
          { token: 'delimiter', foreground: 'c9d1d9' },
          { token: 'delimiter.bracket', foreground: 'c9d1d9' },
          { token: 'delimiter.parenthesis', foreground: 'c9d1d9' },
          { token: 'annotation', foreground: 'd2a8ff' },
          { token: 'namespace', foreground: '7ee787' },
        ],
        colors: {
          'editor.background': '#0a0a0a',
          'editor.foreground': '#c9d1d9',
          'editorLineNumber.foreground': '#484f58',
          'editorLineNumber.activeForeground': '#c9d1d9',
          'editor.selectionBackground': '#264f78',
          'editor.inactiveSelectionBackground': '#3a3d41',
          'editor.lineHighlightBackground': '#161b22',
          'editor.lineHighlightBorder': '#00000000',
          'editorCursor.foreground': '#6fb3d2',
          'editorIndentGuide.background1': '#21262d',
          'editorIndentGuide.activeBackground1': '#484f58',
          'editorBracketMatch.background': '#2ea04340',
          'editorBracketMatch.border': '#2ea043',
          'editorGutter.background': '#0d1117',
          'editorError.foreground': '#f85149',
          'editorWarning.foreground': '#d29922',
          'editorWidget.background': '#161b22',
          'editorWidget.border': '#30363d',
          'editorSuggestWidget.background': '#161b22',
          'editorSuggestWidget.border': '#30363d',
          'editorSuggestWidget.selectedBackground': '#1f6feb40',
          'editorSuggestWidget.highlightForeground': '#58a6ff',
          'editorHoverWidget.background': '#161b22',
          'editorHoverWidget.border': '#30363d',
          'scrollbarSlider.background': '#30363d80',
          'scrollbarSlider.hoverBackground': '#484f58',
          'scrollbarSlider.activeBackground': '#6e7681',
          'minimap.background': '#0d1117',
        },
      })
      themeDefined = true
    }

    // 2. 注册 MC API 补全提供者（仅一次）
    if (!completionProviderRegistered) {
      monaco.languages.registerCompletionItemProvider('java', {
        triggerCharacters: ['.', '@', '<'],
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position)
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          }

          // 取光标前的整行文本，判断是否在 import 上下文（提供完整包路径建议）
          const lineContentUpToCursor = model
            .getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            })
            .trimStart()

          const isImportContext = lineContentUpToCursor.startsWith('import')

          // 基于当前 word 过滤字典
          const matched = getMonacoSuggestions(word.word || '')

          // 顶层类建议（class）
          const classSuggestions = matched.slice(0, 200).map((c) => ({
            label: c.className,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: c.className,
            detail: c.package,
            documentation: {
              value: `**${c.className}**\n\n\`${c.package}.${c.className}\`\n\n${c.description}${
                c.methods && c.methods.length > 0
                  ? `\n\n**关键方法** (${c.methods.length})：\n${c.methods
                      .slice(0, 8)
                      .map((m) => `- \`${m.signature}\` — ${m.description}`)
                      .join('\n')}${
                      c.methods.length > 8
                        ? `\n- _... 共 ${c.methods.length} 个方法_`
                        : ''
                    }`
                  : ''
              }`,
            },
            range,
          }))

          // 在 import 上下文：额外提供完整包路径建议
          const importSuggestions = isImportContext
            ? MC_API_DICTIONARY.slice(0, 200).map((c) => ({
                label: `${c.package}.${c.className}`,
                kind: monaco.languages.CompletionItemKind.Module,
                insertText: `${c.package}.${c.className};`,
                detail: c.className,
                documentation: c.description,
                range,
                sortText: `0_${c.className}`, // import 上下文优先显示
              }))
            : []

          return {
            suggestions: [...importSuggestions, ...classSuggestions],
          }
        },
      })

      // 注册悬停提示提供者：当光标在某个类名上时显示中文描述
      monaco.languages.registerHoverProvider('java', {
        provideHover: (model, position) => {
          const word = model.getWordAtPosition(position)
          if (!word) return null

          const found = MC_API_DICTIONARY.find((c) => c.className === word.word)
          if (!found) return null

          const markdown = [
            `**${found.className}**`,
            '',
            `\`${found.package}.${found.className}\``,
            '',
            found.description,
          ]

          if (found.fields && found.fields.length > 0) {
            markdown.push('', '**字段**：')
            found.fields.forEach((f) => {
              markdown.push(`- \`${f.type} ${f.name}\` — ${f.description}`)
            })
          }

          if (found.methods && found.methods.length > 0) {
            markdown.push('', '**关键方法**：')
            found.methods.forEach((m) => {
              markdown.push(`- \`${m.signature}\` — ${m.description}`)
            })
          }

          return {
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            },
            contents: [{ value: markdown.join('\n'), isTrusted: true }],
          }
        },
      })

      completionProviderRegistered = true
    }

    // 3. 注册 Java 代码片段补全
    if (!completionProviderRegistered) {
      const snippets: Array<{ label: string; insertText: string; detail: string }> = [
        { label: 'psvm', detail: 'public static void main', insertText: 'public static void main(String[] args) {\n\t$0\n}' },
        { label: 'sout', detail: 'System.out.println', insertText: 'System.out.println($0);' },
        { label: 'mod', detail: '@Mod annotation', insertText: '@Mod("${1:modid}")\npublic class ${2:ClassName} {\n\t$0\n}' },
        { label: 'register', detail: 'DeferredRegister', insertText: "public static final DeferredRegister<Item> ITEMS =\n\tDeferredRegister.create(ForgeRegistries.ITEMS, MOD_ID);" },
        { label: 'event', detail: 'SubscribeEvent', insertText: '@SubscribeEvent\npublic void onEvent(${1:Event} event) {\n\t$0\n}' },
        { label: 'try', detail: 'try-catch', insertText: 'try {\n\t$0\n} catch (Exception e) {\n\te.printStackTrace();\n}' },
        { label: 'for', detail: 'for loop', insertText: 'for (int i = 0; i < ${1:count}; i++) {\n\t$0\n}' },
        { label: 'if', detail: 'if statement', insertText: 'if ($1) {\n\t$0\n}' },
      ]
      monaco.languages.registerCompletionItemProvider('java', {
        triggerCharacters: [''],
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position)
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          }
          return {
            suggestions: snippets.map((s) => ({
              label: s.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: s.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: s.detail,
              range,
            })),
          }
        },
      })
    }
  }, [])

  /* ---------------------------------------------------------------- */
  /* onMount：拿到 editor 实例 + 注册光标变化监听                       */
  /* ---------------------------------------------------------------- */

  const handleMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, _monaco: typeof import('monaco-editor')) => {
      editorRef.current = editor

      // 光标位置变化回调
      editor.onDidChangeCursorPosition((e) => {
        onSelectionChange?.(e.position.lineNumber, e.position.column)
      })

      // 保存快捷键（Ctrl/Cmd + S）—— 阻止浏览器默认保存
      // monaco.KeyMod.CtrlCmd = 2048, monaco.KeyCode.KeyS = 49
      editor.addCommand(2048 | 49, () => {
        // 由 code-toolbar 的保存按钮接管实际保存逻辑
        const ev = new CustomEvent('nexcube:editor-save')
        window.dispatchEvent(ev)
      })
    },
    [onSelectionChange],
  )

  /* ---------------------------------------------------------------- */
  /* 渲染                                                              */
  /* ---------------------------------------------------------------- */

  return (
    <div className={cn('h-full w-full overflow-hidden bg-zinc-950', className)}>
      <MonacoEditor
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        language={language}
        value={value}
        // 使用 path 让 Monaco 为每个文件创建独立 model（保留撤销栈）
        path={filePath ?? undefined}
        onChange={(v) => onChange?.(v ?? '')}
        theme={THEME_NAME}
        options={{
          fontSize: 13,
          fontFamily:
            'ui-monospace, "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
          fontLigatures: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 4,
          minimap: { enabled: true, scale: 1, renderCharacters: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'off',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
            highlightActiveBracketPair: true,
            highlightActiveIndentation: true,
          },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          cursorWidth: 2,
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          renderControlCharacters: false,
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          quickSuggestionsDelay: 120,
          suggest: {
            showClasses: true,
            showFunctions: true,
            showVariables: true,
            showModules: true,
            showWords: true,
            insertMode: 'insert',
          },
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'allDocuments',
          parameterHints: { enabled: true },
          hover: { enabled: true, delay: 200 },
          linkedEditing: true,
          formatOnPaste: true,
          formatOnType: true,
          readOnly,
          domReadOnly: readOnly,
          contextmenu: true,
          mouseWheelZoom: true,
          multiCursorModifier: 'ctrlCmd',
          stickyScroll: { enabled: true, maxLineCount: 5 },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12,
            useShadows: false,
          },
          padding: { top: 8, bottom: 8 },
          overviewRulerBorder: false,
        }}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              加载 Monaco 编辑器...
            </div>
          </div>
        }
      />
    </div>
  )
}

export default CodeEditor
