#!/bin/bash

# FundAdvisor 完整应用启动脚本

echo "🚀 启动 FundAdvisor 完整应用..."
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 函数：启动后端服务
start_backend() {
    echo "🔧 启动后端服务..."
    cd backend
    
    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        echo "📦 创建Python虚拟环境..."
        python -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装依赖
    pip install -r requirements.txt
    
    # 创建环境变量文件
    if [ ! -f ".env" ]; then
        cat > .env << EOF
DATABASE_URL=sqlite:///./fundadvisor.db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=True
APP_NAME=FundAdvisor
APP_VERSION=1.0.0
API_V1_STR=/api/v1
EOF
    fi
    
    # 启动后端服务
    echo "🌟 启动FastAPI服务 (端口: 8000)..."
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    cd ..
    return $BACKEND_PID
}

# 函数：启动前端服务
start_frontend() {
    echo "🎨 启动前端服务..."
    cd frontend
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        npm install
    fi
    
    # 创建环境变量文件
    if [ ! -f ".env" ]; then
        cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=FundAdvisor
EOF
    fi
    
    # 启动前端服务
    echo "🌟 启动Vite开发服务器 (端口: 5173)..."
    npm run dev &
    FRONTEND_PID=$!
    
    cd ..
    return $FRONTEND_PID
}

# 函数：清理进程
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ 后端服务已停止"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务已停止"
    fi
    echo "👋 再见！"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 启动服务
start_backend
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

start_frontend
FRONTEND_PID=$!

# 显示服务信息
echo ""
echo "🎉 FundAdvisor 应用启动成功！"
echo "=================================="
echo "📍 前端应用: http://localhost:5173"
echo "📍 后端API: http://localhost:8000"
echo "📍 API文档: http://localhost:8000/docs"
echo "📍 健康检查: http://localhost:8000/health"
echo ""
echo "🛑 按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait