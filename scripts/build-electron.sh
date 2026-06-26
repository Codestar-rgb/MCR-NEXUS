#!/bin/bash
# NexCube Electron 一键构建脚本
# 流程：Next.js 静态导出 → TypeScript 编译 → electron-builder 打包
set -e

cd "$(dirname "$0")/.."

echo "=== NexCube Electron 构建 ==="
echo ""

# 1. Next.js 静态导出（不会破坏开发模式下的 API Routes）
echo "[1/3] 构建 Next.js（静态导出，BUILD_TARGET=electron）..."
BUILD_TARGET=electron bun run build
echo "    ✓ 静态资源输出到 out/"
echo ""

# 2. 编译 Electron TypeScript
echo "[2/3] 编译 Electron TypeScript..."
bunx tsc -p electron/tsconfig.json
echo "    ✓ 编译输出到 dist-electron-compiled/"
echo ""

# 3. electron-builder 打包
echo "[3/3] 运行 electron-builder..."
bunx electron-builder
echo "    ✓ 打包输出到 dist-electron/"
echo ""

echo "=== ✅ 构建完成 ==="
echo ""
echo "产物路径："
echo "  - macOS:  dist-electron/NexCube-1.0.0.dmg"
echo "  - Windows: dist-electron/NexCube Setup 1.0.0.exe"
echo "  - Linux:  dist-electron/NexCube-1.0.0.AppImage / NexCube-1.0.0.deb"
