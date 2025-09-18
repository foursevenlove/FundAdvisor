
# FundAdvisor API 文档

## 概述

FundAdvisor API 是一个基于 FastAPI 构建的 RESTful API，提供基金数据查询、用户管理、投资组合管理和智能投资策略等功能。

## 基础信息

- **Base URL**: `http://localhost:8000`
- **API Version**: v1
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token

## 认证

### 获取访问令牌

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**响应示例:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 使用访问令牌

在需要认证的请求中添加 Authorization 头：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API 端点

### 1. 认证相关

#### 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "full_name": "string"
}
```

#### 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

#### 刷新令牌
```http
POST /api/v1/auth/refresh
Authorization: Bearer <token>
```

### 2. 用户管理

#### 获取当前用户信息
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "user@example.com",
  "full_name": "string",
  "is_active": true,
  "created_at": "2024-01-20T10:00:00Z"
}
```

#### 更新用户信息
```http
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "string",
  "email": "user@example.com"
}
```

### 3. 基金数据

#### 获取基金列表
```http
GET /api/v1/funds/?skip=0&limit=20&fund_type=混合型
```

**查询参数:**
- `skip` (int): 跳过的记录数，默认 0
- `limit` (int): 返回的记录数，默认 20，最大 100
- `fund_type` (string): 基金类型筛选
- `search` (string): 搜索关键词

**响应示例:**
```json
{
  "items": [
    {
      "id": "uuid",
      "code": "000001",
      "name": "华夏成长混合",
      "fund_type": "混合型",
      "manager": "张三",
      "company": "华夏基金管理有限公司",
      "establish_date": "2001-12-18",
      "scale": 15678000000.00,
      "current_nav": 1.2345,
      "daily_return": 0.0234,
      "description": "本基金主要投资于具有良好成长性的上市公司股票"
    }
  ],
  "total": 1000,
  "page": 1,
  "pages": 50
}
```

#### 获取基金详情
```http
GET /api/v1/funds/{fund_id}
```

**响应示例:**
```json
{
  "id": "uuid",
  "code": "000001",
  "name": "华夏成长混合",
  "fund_type": "混合型",
  "manager": "张三",
  "company": "华夏基金管理有限公司",
  "establish_date": "2001-12-18",
  "scale": 15678000000.00,
  "current_nav": 1.2345,
  "accumulated_nav": 2.5678,
  "daily_return": 0.0234,
  "description": "本基金主要投资于具有良好成长性的上市公司股票",
  "performance": {
    "1m": 0.0234,
    "3m": 0.0876,
    "6m": 0.1523,
    "1y": 0.2845,
    "2y": 0.4567,
    "3y": 0.7892
  }
}
```

#### 搜索基金
```http
GET /api/v1/funds/search?q=华夏&limit=10
```

#### 获取基金历史净值
```http
GET /api/v1/funds/{fund_id}/nav-history?start_date=2024-01-01&end_date=2024-01-31
```

**响应示例:**
```json
{
  "fund_id": "uuid",
  "data": [
    {
      "date": "2024-01-31",
      "unit_nav": 1.2345,
      "accumulated_nav": 2.5678,
      "daily_return": 0.0234
    }
  ]
}
```

### 4. 关注列表

#### 获取关注列表
```http
GET /api/v1/watchlist/
Authorization: Bearer <token>
```

#### 添加基金到关注列表
```http
POST /api/v1/watchlist/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fund_id": "uuid"
}
```

#### 从关注列表移除基金
```http
DELETE /api/v1/watchlist/{fund_id}
Authorization: Bearer <token>
```

### 5. 投资组合

#### 获取投资组合概览
```http
GET /api/v1/portfolio/
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "summary": {
    "total_assets": 35060.30,
    "total_cost": 32610.00,
    "total_return": 2450.30,
    "total_return_percent": 7.51,
    "day_return": 98.30,
    "day_return_percent": 0.28
  },
  "holdings": [
    {
      "fund_id": "uuid",
      "fund_code": "000001",
      "fund_name": "华夏成长混合",
      "shares": 10000.0000,
      "avg_cost": 1.1500,
      "current_value": 1.2345,
      "market_value": 12345.00,
      "total_return": 845.00,
      "total_return_percent": 7.35,
      "day_return": 283.00,
      "day_return_percent": 2.34,
      "weight": 35.2
    }
  ]
}
```

#### 添加持仓
```http
POST /api/v1/portfolio/holdings
Authorization: Bearer <token>
Content-Type: application/json

{
  "fund_id": "uuid",
  "shares": 1000.0000,
  "cost": 1.2000
}
```

#### 更新持仓
```http
PUT /api/v1/portfolio/holdings/{holding_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "shares": 1500.0000,
  "avg_cost": 1.1800
}
```

#### 删除持仓
```http
DELETE /api/v1/portfolio/holdings/{holding_id}
Authorization: Bearer <token>
```

### 6. 交易记录

#### 获取交易记录
```http
GET /api/v1/transactions/?skip=0&limit=20
Authorization: Bearer <token>
```

#### 添加交易记录
```http
POST /api/v1/transactions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fund_id": "uuid",
  "transaction_type": "buy",
  "shares": 1000.0000,
  "price": 1.2000,
  "fee": 12.00,
  "transaction_date": "2024-01-20T10:00:00Z"
}
```

### 7. 投资策略

#### 获取策略列表
```http
GET /api/v1/strategies/
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "strategies": [
    {
      "id": "uuid",
      "name": "均线交叉策略",
      "strategy_type": "ma_cross",
      "description": "基于移动平均线交叉信号的趋势跟踪策略",
      "is_active": true,
      "parameters": {
        "short_window": 5,
        "long_window": 20,
        "signal_window": 60
      },
      "performance": {
        "total_return": 15.8,
        "annualized_return": 12.3,
        "sharpe_ratio": 1.45,
        "max_drawdown": 8.2,
        "win_rate": 68.5
      }
    }
  ]
}
```

#### 获取策略详情
```http
GET /api/v1/strategies/{strategy_id}
Authorization: Bearer <token>
```

#### 创建策略
```http
POST /api/v1/strategies/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的均线策略",
  "strategy_type": "ma_cross",
  "parameters": {
    "short_window": 5,
    "long_window": 20,
    "signal_window": 60
  }
}
```

#### 更新策略
```http
PUT /api/v1/strategies/{strategy_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新的策略名称",
  "is_active": false,
  "parameters": {
    "short_window": 10,
    "long_window": 30
  }
}
```

#### 获取策略信号
```http
GET /api/v1/strategies/{strategy_id}/signals?limit=20
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "signals": [
    {
      "id": "uuid",
      "fund_id": "uuid",
      "fund_code": "000001",
      "fund_name": "华夏成长混合",
      "signal_type": "buy",
      "confidence": 85.5,
      "reason": "5日均线上穿20日均线，趋势转强",
      "signal_date": "2024-01-20T14:30:00Z"
    }
  ]
}
```

#### 运行策略分析
```http
POST /api/v1/strategies/{strategy_id}/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "fund_ids": ["uuid1", "uuid2"],
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

### 8. 数据更新

#### 手动更新基金数据
```http
POST /api/v1/data/update-funds
Authorization: Bearer <token>
Content-Type: application/json

{
  "fund_codes": ["000001", "110022"],
  "force_update": false
}
```

#### 获取数据更新状态
```http
GET /api/v1/data/update-status
Authorization: Bearer <token>
```

### 9. 系统信息

#### 健康检查
```http
GET /health
```

**响应示例:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

#### 获取系统统计
```http
GET /api/v1/system/stats
Authorization: Bearer <token>
```

## 错误处理

API 使用标准的 HTTP 状态码来表示请求的结果：

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `422` - 数据验证错误
- `500` - 服务器内部错误

**错误响应格式:**
```json
{
  "detail": "错误描述",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

## 限流

API 实施了限流机制：

- 未认证用户: 100 请求/小时
- 认证用户: 1000 请求/小时
- 高级用户: 5000 请求/小时

当达到限流阈值时，API 将返回 `429 Too Many Requests` 状态码。

## 分页

对于返回列表数据的端点，使用以下分页参数：

- `skip` (int): 跳过的记录数
- `limit` (int): 返回的记录数（最大 100）

分页响应格式：
```json
{
  "items": [...],
  "total": 1000,
  "page": 1,
  "pages": 50,
  "has_next": true,
  "has_prev": false
}
```

## WebSocket 连接

实时数据推送使用 WebSocket 连接：

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/realtime');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('实时数据:', data);
};
```

支持的实时数据类型：
- 基金净值更新
- 策略信号推送
- 投资组合变化

## SDK 和示例

### Python SDK 示例

```python
import requests

class FundAdvisorAPI:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        if token:
            self.session.headers.update({
                'Authorization': f'Bearer {token}'
            })
    
    def login(self, username, passwor