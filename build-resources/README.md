# build-resources

NexCube 桌面打包资源目录。

## 文件清单

| 文件 | 用途 | 必须 |
|------|------|------|
| `entitlements.mac.plist` | macOS 权限申请（JIT、未签名内存、库验证关闭） | ✅ macOS 打包必需 |
| `icon.png` | Linux AppImage/deb 图标（512×512 占位） | ✅ Linux 打包必需 |
| `icon.icns` | macOS dmg 图标（**缺失时打包会用默认 Electron 图标**） | ⚠️ macOS 打包前需自行替换 |
| `icon.ico` | Windows NSIS 安装器图标（**缺失时打包会用默认 Electron 图标**） | ⚠️ Windows 打包前需自行替换 |

## 占位图标说明

`icon.png` 当前为脚本生成的纯色占位图（512×512，紫色 + "NexCube" 文字），
用于 Linux 平台打包测试。在正式发布前**必须**替换为以下规格的官方资源：

| 平台 | 文件 | 推荐规格 |
|------|------|----------|
| macOS | `icon.icns` | 1024×1024 多分辨率 `.icns`（包含 16/32/64/128/256/512/1024） |
| Windows | `icon.ico` | 256×256 多分辨率 `.ico`（包含 16/32/48/64/128/256） |
| Linux | `icon.png` | 512×512 PNG（含透明通道） |

## 替换图标的方法

1. 将设计好的图标源文件（推荐 SVG）放到本目录；
2. 用 [`electron-icon-builder`](https://github.com/safu9/electron-icon-builder) 一键生成三平台所需格式：
   ```bash
   bunx electron-icon-builder --input=build-resources/icon-source.svg --output=build-resources
   ```
   生成结果会在 `build-resources/icons/` 下，按需移动到本目录覆盖对应文件即可。

## entitlements.mac.plist 说明

macOS Notarization 要求所有 Electron 应用必须显式声明以下权限：

- `com.apple.security.cs.allow-jit` — V8 JIT 编译（Electron 主进程必需）
- `com.apple.security.cs.allow-unsigned-executable-memory` — 允许未签名可执行内存
  （部分原生模块如 `node-pty`、`better-sqlite3` 等需要）
- `com.apple.security.cs.disable-library-validation` — 关闭库验证
  （允许加载未签名的动态库，方便集成第三方 JDK 工具）

这些权限不影响 Web 版运行，仅在 macOS 打包时被 `codesign` 使用。
