# Agent Work Record — Task 0-B

- **Task ID**: 0-B
- **Agent**: full-stack-developer
- **Task**: 设计能力抽象层（Capability Layer）接口与实现
- **日期**: 2025

## 工作内容

为 NexCube 项目（MC 模组双轨制 IDE）设计能力抽象层，让同一套前端代码能在 Web 模式（Next.js）和 Electron 桌面模式下无缝运行。

### 产出文件（5 个）

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/lib/capabilities/types.ts` | ~330 | 能力层所有 TS 接口定义 + CapabilityError 错误类 |
| `src/lib/capabilities/log-parser.ts` | ~430 | 智能日志解析引擎（21 条规则） |
| `src/lib/capabilities/web.ts` | ~620 | Web 模式模拟实现（内存 FS + 预录制 Gradle 日志） |
| `src/lib/capabilities/electron.ts` | ~440 | Electron 占位实现 + `window.nexcube` IPC 类型声明 |
| `src/lib/capabilities/index.ts` | ~100 | 运行时选择 + 3 个预定义镜像源 |

### 关键设计

1. **接口解耦**：业务代码只依赖 `Capabilities` 接口，不直接 import `web.ts` / `electron.ts`，自动通过 `typeof window.nexcube` 探测环境切换实现。
2. **错误统一**：所有错误封装为 `CapabilityError`，含 `code` / `module` / `cause`。
3. **日志解析引擎真实可用**：21 条规则（>15 条要求），覆盖：
   - 依赖解析失败 / 未找到
   - JVM OOM（Heap / Metaspace / GC overhead）
   - javac 编译错误（cannot find symbol、incompatible types、unclosed string、illegal start、package not exist、method apply、syntax error）
   - Forge 特定（mapping not found、ModLoadingException、registry duplicate）
   - 网络（connection refused / timeout）
   - 权限（permission denied）
   - 构建总览（BUILD FAILED / SUCCESSFUL）
4. **Web 实现完整模拟**：
   - 内存虚拟 FS 预置示例 Forge MDK 项目（`/workspace/example-mod/`）
   - `runGradle` 按任务名返回真实格式的预录制日志（含 `clean` / `build` / `tasks` / `runClient` 等）
   - `build` 任务日志内嵌 `OutOfMemoryError + cannot find symbol + incompatible types` 多种错误，可直接演示解析引擎
   - `env.detectNetwork` 使用真实 `fetch`（HEAD + no-cors + 5s 超时）探测镜像可达性
5. **Electron 实现为代码资产**：完整调用 `window.nexcube.fs/build/jdk/process/env` IPC API，事件流转换为 web 一致的回调式 BuildHandle / ProcessHandle，未来 Electron 启用时无需修改。

### 验证结果

- `bun run lint` ✅ 通过（exit 0，无 error / warning）
- 运行时 smoke test ✅ 通过：
  - `capabilities.platform === 'web'`、`isDesktop === false`
  - `PREDEFINED_MIRRORS.length === 3`、`DEFAULT_MIRROR.id === 'aliyun'`
  - `getRuleCount() === 21`
  - `fs.exists('/workspace/example-mod/build.gradle') === true`
  - `env.detectJava()` 返回 JDK 21.0.5
  - `parseGradleLog(sample)` 正确匹配 `JAVAC-CANNOT-FIND-SYMBOL` / `JVM-OOM-HEAP` / `GRADLE-BUILD-FAILED` 三条规则

## 给后续 Agent 的提示

1. **统一导入入口**：所有需要访问系统能力的代码必须使用：
   ```ts
   import { capabilities, PREDEFINED_MIRRORS, findMirror, DEFAULT_MIRROR } from '@/lib/capabilities'
   ```
   **禁止**直接 import `web.ts` / `electron.ts`，否则会破坏环境切换。

2. **日志解析可在前端任意位置调用**：`parseGradleLog(log)` 是纯函数，与平台无关。web 和 electron 实现都已绑定到 `capabilities.build.parseLog`。

3. **修复动作约定**：`fixAction.action` 是字符串 key，由前端按需 dispatch。已定义的 key：
   - `fix.configure-mirror`（payload: `{ mirrorId }`）
   - `fix.search-maven`
   - `fix.adjust-jvm-memory`（payload: `{ suggested }`）
   - `fix.show-memory-guide`
   - `fix.goto-symbol`（payload: `{ symbol, location }`）
   - `fix.show-dependency-tree`
   - `fix.show-mappings-doc`
   - `fix.show-stacktrace`

4. **Virtual FS 示例项目**：路径 `/workspace/example-mod/`，可用于创建向导、文件树、构建演示等场景的默认 mock 数据。

5. **JDK 已 mock 17 和 21 两个版本**，21 为默认。若需新增 mock JDK，编辑 `WebJdkCapability.installed`。

6. **Electron 启用时**（阶段 7）只需：
   - 在 preload 中通过 `contextBridge.exposeInMainWorld('nexcube', {...})` 暴露 IPC API
   - 接口契约见 `electron.ts` 顶部的 `NexcubeFsIPC / NexcubeBuildIPC / NexcubeJdkIPC / NexcubeProcessIPC / NexcubeEnvIPC`
   - `index.ts` 会自动切换到 `electronCapabilities`，前端代码零修改
