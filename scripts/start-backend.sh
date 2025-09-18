#!/bin/bash

# FundAdvisor 后端启动脚本

echo "🚀 启动 FundAdvisor 后端服务..."

# 检查是否在正确的目录
if [ ! -f "backend/app/main.py" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 进入后端目录
cd backend

# 检查Python环境
if ! command -v python &> /dev/null; then
    echo "❌ 错误: 未找到Python，请先安装Python 3.11+"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装Python依赖..."
pip install -r requirements.txt

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚙️  创建环境变量文件..."
    cat > .env << EOF
# 数据库配置
DATABASE_URL=sqlite:///./fundadvisor.db

# 安全配置
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS配置
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# 调试模式
DEBUG=True

# 应用配置
APP_NAME=FundAdvisor
APP_VERSION=1.0.0
API_V1_STR=/api/v1
EOF
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
fi

# 启动服务
echo "🌟 启动FastAPI服务..."
echo "📍 API文档: http://localhost:8000/docs"
echo "🔍 健康检查: http://localhost:8000/health"
echo "🛑 按 Ctrl+C 停止服务"
echo ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000