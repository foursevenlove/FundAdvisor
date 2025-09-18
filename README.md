# FundAdvisor - 智能基金投资顾问

一个基于AI算法的高端基金投资应用，提供智能投资策略、实时数据分析和专业的投资建议。

## 🚀 项目特色

### 核心功能
- **智能投资策略**: 基于技术指标的三大核心策略（均线交叉、动态定投、趋势跟踪）
- **实时数据集成**: 集成akshare数据源，提供实时基金净值和市场数据
- **数据可视化**: 使用ECharts提供专业的图表分析
- **投资组合管理**: 完整的持仓跟踪和收益分析
- **响应式设计**: 支持桌面端和移动端的完美体验
- **深色模式**: 专业的深色主题设计

### 技术架构
- **前端**: React 18 + TypeScript + Ant Design + ECharts + Framer Motion
- **后端**: FastAPI + SQLAlchemy + PostgreSQL + Redis
- **部署**: Docker + Docker Compose + Nginx
- **数据源**: akshare (A股数据接口)

## 📋 系统要求

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (推荐)

## 🛠️ 快速开始

### 使用Docker Compose（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd FundAdvisor
```

2. **启动所有服务**
```bash
# 启动基础服务
docker-compose up -d postgres redis

# 等待数据库启动后，运行数据库迁移
docker-compose run --rm migration

# 启动所有服务
docker-compose up -d
```

3. **访问应用**
- 前端应用: http://localhost
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

### 本地开发

#### 后端设置

1. **创建虚拟环境**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

4. **数据库迁移**
```bash
alembic upgrade head
```

5. **启动后端服务**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端设置

1. **安装依赖**
```bash
cd frontend
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

3. **构建生产版本**
```bash
npm run build
```

## 📁 项目结构

```
FundAdvisor/
├── backend/                 # 后端API服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic模式
│   │   ├── services/       # 业务逻辑
│   │   └── strategies/     # 投资策略
│   ├── alembic/            # 数据库迁移
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── styles/         # 样式文件
│   │   └── utils/          # 工具函数
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml      # Docker编排配置
├── init-db.sql            # 数据库初始化脚本
└── README.md
```

## 🎯 核心功能详解

### 1. 智能投资策略

#### 均线交叉策略 (MA Cross Strategy)
- 基于5日、20日、60日移动平均线
- 自动识别金叉和死叉信号
- 适合中长期趋势跟踪

#### 动态定投策略 (Dynamic DCA Strategy)
- 根据市场估值动态调整定投金额
- 低估值时增加投入，高估值时减少投入
- 有效降低投资成本

#### 趋势跟踪策略 (Trend Following Strategy)
- 结合RSI、MACD、布林带等技术指标
- 多维度分析市场趋势
- 适合波段操作

### 2. 数据可视化

- **净值走势图**: 展示基金历史净值变化
- **收益分析图**: 对比基金与基准收益
- **资产配置图**: 投资组合饼图分析
- **策略信号图**: 买卖信号可视化展示

### 3. 投资组合管理

- **持仓跟踪**: 实时跟踪持有基金的净值变化
- **收益分析**: 计算总收益、年化收益率、夏普比率
- **风险评估**: 最大回撤、波动率等风险指标
- **资产配置**: 可视化展示投资组合结构

## 🔧 配置说明

### 环境变量

#### 后端配置 (.env)
```env
# 数据库配置
DATABASE_URL=postgresql://fundadvisor:fundadvisor123@localhost:5432/fundadvisor

# Redis配置
REDIS_URL=redis://:fundadvisor123@localhost:6379/0

# 安全配置
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS配置
CORS_ORIGINS=http://localhost:3000,http://localhost:80

# 调试模式
DEBUG=True
```

#### 前端配置
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=FundAdvisor
```

## 📊 API文档

启动后端服务后，访问以下地址查看完整的API文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 主要API端点

#### 基金相关
- `GET /api/v1/funds/` - 获取基金列表
- `GET /api/v1/funds/{fund_id}` - 获取基金详情
- `GET /api/v1/funds/search` - 搜索基金

#### 用户相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `GET /api/v1/users/me` - 获取当前用户信息

#### 投资组合
- `GET /api/v1/portfolio/` - 获取投资组合
- `POST /api/v1/portfolio/holdings` - 添加持仓
- `GET /api/v1/portfolio/performance` - 获取组合表现

#### 投资策略
- `GET /api/v1/strategies/` - 获取策略列表
- `POST /api/v1/strategies/signals` - 获取策略信号
- `PUT /api/v1/strategies/{strategy_id}` - 更新策略配置

## 🚀 部署指南

### 生产环境部署

1. **准备服务器**
   - 安装Docker和Docker Compose
   - 配置防火墙规则
   - 准备SSL证书（可选）

2. **配置环境变量**
```bash
# 复制并编辑生产环境配置
cp .env.example .env.production
```

3. **启动生产服务**
```bash
# 使用生产配置启动
docker-compose -f docker-compose.yml --profile production up -d
```

4. **配置反向代理**
   - 使用Nginx或Traefik配置HTTPS
   - 设置域名解析
   - 配置SSL证书

### 监控和维护

- **日志查看**: `docker-compose logs -f [service_name]`
- **数据备份**: 定期备份PostgreSQL数据
- **性能监控**: 使用Prometheus + Grafana监控系统性能
- **健康检查**: 所有服务都配置了健康检查

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 开发规范

### 代码风格
- **Python**: 遵循PEP 8规范，使用black格式化
- **TypeScript**: 使用ESLint + Prettier
- **提交信息**: 遵循Conventional Commits规范

### 测试
```bash
# 后端测试
cd backend && pytest

# 前端测试
cd frontend && npm test
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [akshare](https://github.com/akfamily/akshare) - 提供金融数据接口
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的Python Web框架
- [React](https://reactjs.org/) - 用户界面构建库
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [ECharts](https://echarts.apache.org/) - 数据可视化图表库

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

---

**FundAdvisor** - 让投资更智能，让财富增长更稳健 🚀