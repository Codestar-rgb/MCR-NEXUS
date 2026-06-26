# NexCube Electron 桌面版

NexCube 支持作为 Electron 桌面应用运行，提供完整的本地文件系统访问、Gradle 构建执行、JDK 管理等原生能力。

> 本文件覆盖：开发模式 / 生产构建 / 架构 / 能力对比 / 配置 / 打包注意事项。
> 与项目根 `README.md` 互补 —— Web 版使用请参考根 README。

## 快速开始

### 开发模式

```bash
# 1. 启动 Next.js dev server（终端 1）
bun run dev

# 2. 启动 Electron（终端 2，会自动加载 http://localhost:3000）
bun run electron:dev
```

Electron 会加载 `http://localhost:3000`，**支持前端热更新**（修改 `src/` 自动刷新）。
仅当修改 `electron/` 下的主进程代码时需要重启 Electron（`bun run electron:dev` 重跑一次）。

### 生产构建

```bash
# 一键打包（Next.js 静态导出 + tsc + electron-builder）
bun run electron:build
```

产物输出在 `dist-electron/` 目录：

| 平台 | 产物 | 备注 |
|------|------|------|
| macOS | `NexCube-1.0.0.dmg` | x64 + arm64 双架构 |
| Windows | `NexCube Setup 1.0.0.exe` | NSIS 安装器，可选安装目录 |
| Linux | `NexCube-1.0.0.AppImage` | 免安装，下载即用 |
| Linux | `NexCube-1.0.0.deb` | Debian/Ubuntu 系 |

### 沙箱验证（CI / 无显示器环境）

```bash
# 用 xvfb-run 在虚拟显示中验证 Electron 能否启动
bun run electron:verify
```

## 架构

```
┌─────────────────────────────────────────┐
│  Electron 渲染进程（Next.js Web App）    │
│  ┌────────┐┌────────┐┌────────┐        │
│  │节点画布 ││Monaco  ││终端    │        │
│  └────────┘└────────┘└────────┘        │
└──────────────────┬──────────────────────┘
                   │ contextBridge (preload.ts)
                   │ IPC（fs/build/jdk/process/env）
┌──────────────────┴──────────────────────┐
│  Electron 主进程（Node.js）              │
│  ┌─────────┐┌─────────┐┌─────────┐     │
│  │fs.ts    ││build.ts ││jdk.ts   │     │
│  │真实文件 ││真实     ││真实下载 │     │
│  │系统     ││Gradle   ││安装     │     │
│  └─────────┘└─────────┘└─────────┘     │
│  ┌─────────┐┌─────────┐                 │
│  │process  ││env.ts   │                 │
│  │真实     ││真实检测 │                 │
│  │spawn    ││java/git │                 │
│  └─────────┘└─────────┘                 │
└─────────────────────────────────────────┘
```

### 关键路径

| 路径 | 作用 |
|------|------|
| `electron/main.ts` | Electron 主进程入口（创建 BrowserWindow、加载 URL/文件） |
| `electron/preload.ts` | 渲染进程预加载脚本，通过 `contextBridge` 安全暴露 `window.nexcube` |
| `electron/menu.ts` | 应用菜单 |
| `electron/ipc/*.ts` | IPC handler 实现（fs / build / jdk / process / env） |
| `electron/tsconfig.json` | 主进程 TypeScript 配置（CommonJS） |
| `src/lib/capabilities/electron.ts` | 渲染进程侧的能力层实现，调用 `window.nexcube` |
| `src/lib/capabilities/index.ts` | 能力层自动切换（Web ↔ Electron） |
| `build-resources/` | 打包资源（图标 / entitlements） |
| `scripts/build-electron.sh` | 生产构建脚本 |
| `scripts/verify-electron.sh` | xvfb 沙箱验证脚本 |

## 能力对比

| 能力 | Web 版 | Electron 桌面版 |
|------|--------|-----------------|
| 文件读写 | 沙箱模拟 | ✅ 真实本地文件系统 |
| Gradle 构建 | 模拟流式日志 | ✅ 真实 `spawn gradlew` |
| JDK 下载 | 仅 UI 演示 | ✅ 真实下载 + 解压到 `~/.nexcube/jdks/` |
| 进程管理 | 模拟 | ✅ 真实 spawn / kill |
| 环境检测 | 模拟结果 | ✅ 真实检测 `java` / `git` / `gradle` |
| Mod ZIP 导出 | 服务端生成 | ✅ 客户端直接生成 |
| 项目导入（GitHub） | ✅ | ✅ |
| 项目导入（ZIP） | ✅ | ✅ |

## 配置

### 镜像源

启动后在 **设置 → 镜像源** 选择阿里云 / 清华源。

- Web 版：仅生成 `init.gradle` 文本，复制 / 下载供用户手动配置
- Electron 版：自动把 `init.gradle` 写入项目根，并在 Gradle 构建时通过 `-Dorg.gradle.init.script=...` 注入

### JDK

如果系统没有 JDK 17+：

1. 启动后 Electron 检测到 `java -version` 失败
2. 提示一键下载，从镜像源拉取 **Adoptium Temurin 17**
3. 解压到 `~/.nexcube/jdks/temurin-17.<patch>/`
4. 后续 Gradle 构建用 `JAVA_HOME` 环境变量指向该路径

### 数据存储

| 数据 | Web 版 | Electron 版 |
|------|--------|-------------|
| Prisma SQLite | `db/custom.db` | `~/.nexcube/data/custom.db` |
| 用户设置 | DB `AppSetting` 表 | 同上 |
| 项目缓存 | `.next/cache/` | `~/.nexcube/cache/` |
| JDK 安装 | — | `~/.nexcube/jdks/` |

## 开发说明

### 双轨制核心思想

```
src/lib/capabilities/index.ts
  ├─ typeof window.nexcube === 'object' → 使用 electron.ts
  └─ 否则                              → 使用 web.ts
```

**前端代码完全一致** —— 通过能力抽象层自动适配运行环境。
不需要在组件里写 `if (isElectron)`，只要调用 `capabilities.fs.read(...)` 等抽象 API。

### 主进程代码（`electron/`）

- **CommonJS 模块**（`electron/tsconfig.json` 的 `module: commonjs`）
- 用 `bunx tsc -p electron/tsconfig.json` 编译到 `dist-electron-compiled/`
- 主进程代码运行在 Node.js，可以使用 `fs` / `child_process` / `net` 等所有原生模块

### 渲染进程代码（`src/`）

- 与 Web 版完全共用
- `next.config.ts` 在 `BUILD_TARGET=electron` 时启用 `output: 'export'`，生成纯静态
- 静态资源会被 Electron 用 `file://` 或自定义 protocol 加载

### 安全模型

- `contextIsolation: true`（默认）—— 渲染进程与主进程 JS 上下文完全隔离
- `nodeIntegration: false`（默认）—— 渲染进程不能直接 `require('fs')`
- `preload.ts` 通过 `contextBridge.exposeInMainWorld('nexcube', ...)` 安全暴露 API
- 所有原生能力都必须显式通过 IPC handler 注册，避免任意 JS 调用 `fs.delete('/')` 等危险操作

## 打包注意事项

### macOS

- **必须签名**才能在 Apple Silicon 上运行（arm64 强制要求）
- **公证（Notarization）**才能避免 Gatekeeper 拦截
- 当前配置已开启 `hardenedRuntime: true`，并应用 `entitlements.mac.plist`
- 开发阶段（无证书）可临时关闭：把 `hardenedRuntime` 改为 `false`，并删除 `entitlements` 字段
- **图标**：`build-resources/icon.icns`（缺失时用默认 Electron 图标，建议替换）

### Windows

- 用 NSIS 安装器（`oneClick: false` 让用户选择安装目录）
- 创建桌面快捷方式 + 开始菜单快捷方式（名称 `NexCube`）
- 签名可选（未签名会显示 SmartScreen 警告，不影响运行）
- **图标**：`build-resources/icon.ico`（建议 256×256 多分辨率）

### Linux

- 输出 `AppImage`（推荐，免安装，下载即用）+ `.deb`（Debian/Ubuntu 系）
- `category: Development`（桌面环境分类）
- **图标**：`build-resources/icon.png`（512×512）

### 静态导出注意

`next.config.ts` 的 `output: 'export'` 会**禁用所有 API Routes**（因为没有服务端），
所以 Electron 模式下必须：

1. 项目数据通过 IPC 调用主进程读写（不依赖 `/api/projects/*`）
2. 构建命令通过 IPC 触发主进程 spawn Gradle（不依赖 `/api/projects/[id]/sync`）
3. 用户设置通过 IPC 持久化到 `~/.nexcube/`（不依赖 `/api/settings/*`）

**Web 版仍可正常使用 API Routes**（默认 `output: 'standalone'`），
切换仅在 `BUILD_TARGET=electron` 时发生。

## 常见问题

### Q: Electron 启动白屏？

A: 检查 `bun run dev` 是否在 `http://localhost:3000` 正常运行；
生产模式下检查 `out/` 目录是否完整生成（`BUILD_TARGET=electron bun run build`）。

### Q: macOS 提示"无法验证开发者"？

A: 右键点击应用 → 打开 → 仍要打开；或终端执行 `xattr -d com.apple.quarantine /Applications/NexCube.app`。
正式发布请用 Apple 开发者证书签名 + 公证。

### Q: Windows SmartScreen 拦截？

A: 点击"更多信息" → "仍要运行"。正式发布请用代码签名证书签名。

### Q: Linux AppImage 无法启动？

A: `chmod +x NexCube-*.AppImage`；若仍失败，安装 `libnss3` / `libgtk-3`：`sudo apt-get install libnss3 libgtk-3-0 libasound2`。

### Q: 验证脚本失败但代码是对的？

A: `verify-electron.sh` 在无显示器环境用 xvfb-run，部分 GPU 加速特性会失效。
查看 `/tmp/nexcube-electron-verify.log` 中是否有 `GPU process isn't usable` 等警告，
如有可临时禁用 GPU：在 `electron/main.ts` 中添加 `app.disableHardwareAcceleration()`。

## 相关链接

- 仓库：https://github.com/Codestar-rgb/MCR-NEXUS
- 工作日志：`worklog.md`
- Web 版使用文档：`README.md`
- 打包资源说明：`build-resources/README.md`
