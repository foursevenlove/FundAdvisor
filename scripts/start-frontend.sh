#!/bin/bash

# FundAdvisor 前端启动脚本

echo "🚀 启动 FundAdvisor 前端应用..."

# 检查是否在正确的目录
if [ ! -f "frontend/package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 进入前端目录
cd frontend

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js 18+"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
else
    echo "✅ 依赖已安装"
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚙️  创建环境变量文件..."
    cat > .env << EOF
# API配置
VITE_API_BASE_URL=http://localhost:8000

# 应用配置
VITE_APP_TITLE=FundAdvisor
EOF
    echo "✅ 已创建 .env 文件"
fi

# 启动开发服务器
echo "🌟 启动Vite开发服务器..."
echo "📍 前端应用: http://localhost:5173"
echo "🛑 按 Ctrl+C 停止服务"
echo ""

npm run dev