import axios, { AxiosInstance, AxiosResponse } from 'axios'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API响应类型定义
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

// 基金相关类型
export interface Fund {
  id: string
  code: string
  name: string
  fund_type: string
  manager: string
  company: string
  establish_date: string
  scale?: number
  current_nav?: number
  accumulated_nav?: number
  daily_return?: number
  description: string
}

export interface FundSearchResult {
  id: string
  code: string
  name: string
  fund_type?: string
  manager?: string
  company?: string
}

export interface FundNavHistory {
  date: string
  unit_nav: number
  accumulated_nav: number
  daily_return: number
}

export interface FundPerformance {
  '1m': number
  '3m': number
  '6m': number
  '1y': number
  '2y': number
  '3y': number
}

// 用户相关类型
export interface User {
  id: string
  username: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

// 投资组合相关类型
export interface PortfolioSummary {
  total_assets: number
  total_cost: number
  total_return: number
  total_return_percent: number
  day_return: number
  day_return_percent: number
}

export interface Holding {
  id: string
  fund_id: string
  fund_code: string
  fund_name: string
  fund_type: string
  shares: number
  avg_cost: number
  current_value: number
  market_value: number
  total_return: number
  total_return_percent: number
  day_return: number
  day_return_percent: number
  weight: number
}

export interface Portfolio {
  summary: PortfolioSummary
  holdings: Holding[]
}

// 策略相关类型
export interface Strategy {
  id: string
  name: string
  strategy_type: string
  description: string
  is_active: boolean
  parameters: Record<string, any>
  performance: {
    total_return: number
    annualized_return: number
    sharpe_ratio: number
    max_drawdown: number
    win_rate: number
  }
}

export interface StrategySignal {
  id: string
  fund_id: string
  fund_code: string
  fund_name: string
  signal_type: 'buy' | 'sell' | 'hold'
  confidence: number
  reason: string
  signal_date: string
}

// API服务类
export class ApiService {
  // 认证相关
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/api/v1/auth/login', credentials)
    return response.data
  }

  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/api/v1/users/me')
    return response.data
  }

  // 基金相关
  static async getFunds(params?: {
    skip?: number
    limit?: number
    fund_type?: string
    search?: string
  }): Promise<PaginatedResponse<Fund>> {
    const response = await apiClient.get('/api/v1/funds/', { params })
    return response.data
  }

  static async getFundById(fundId: string): Promise<Fund> {
    const response = await apiClient.get(`/api/v1/funds/${fundId}/detail`)
    // The backend returns a FundDetailResponse object, we need to extract fund_info from it
    return response.data.fund_info
  }

  static async searchFunds(query: string, limit = 10): Promise<FundSearchResult[]> {
    const response = await apiClient.get('/api/v1/funds/search', {
      params: { q: query, limit }
    })
    return response.data
  }

  static async getFundNavHistory(
    fundId: string,
    startDate?: string,
    endDate?: string
  ): Promise<FundNavHistory[]> {
    const response = await apiClient.get(`/api/v1/funds/${fundId}/net-values`, {
      params: { start_date: startDate, end_date: endDate }
    })
    // 确保数据格式正确映射
    const rawData = response.data
    if (Array.isArray(rawData)) {
      return rawData.map(item => ({
        date: item.date,
        unit_nav: item.unit_nav || item.net_value,
        accumulated_nav: item.accumulated_nav || item.accumulated_value,
        daily_return: item.daily_return
      }))
    }
    return []
  }

  // 关注列表相关
  static async getWatchlist(): Promise<Fund[]> {
    const response = await apiClient.get('/api/v1/watchlist/')
    return response.data
  }

  static async addToWatchlist(fundCode: string): Promise<void> {
    await apiClient.post('/api/v1/watchlist/', { fund_id: fundCode })
  }

  static async removeFromWatchlist(fundId: string): Promise<void> {
    await apiClient.delete(`/api/v1/watchlist/${fundId}`)
  }

  // 投资组合相关
  static async getPortfolio(): Promise<Portfolio> {
    const response = await apiClient.get('/api/v1/portfolio/')
    return response.data
  }

  static async addHolding(holding: {
    fund_id: string
    shares: number
    cost: number
  }): Promise<void> {
    await apiClient.post('/api/v1/portfolio/holdings', holding)
  }

  static async updateHolding(
    holdingId: string,
    updates: { shares?: number; avg_cost?: number }
  ): Promise<void> {
    await apiClient.put(`/api/v1/portfolio/holdings/${holdingId}`, updates)
  }

  static async deleteHolding(holdingId: string): Promise<void> {
    await apiClient.delete(`/api/v1/portfolio/holdings/${holdingId}`)
  }

  // 策略相关
  static async getStrategies(): Promise<Strategy[]> {
    const response = await apiClient.get('/api/v1/strategies/')
    return response.data.strategies
  }

  static async getStrategyById(strategyId: string): Promise<Strategy> {
    const response = await apiClient.get(`/api/v1/strategies/${strategyId}`)
    return response.data
  }

  static async getStrategySignals(
    strategyId: string,
    limit = 20
  ): Promise<StrategySignal[]> {
    const response = await apiClient.get(`/api/v1/strategies/${strategyId}/signals`, {
      params: { limit }
    })
    return response.data.signals
  }

  static async updateStrategy(
    strategyId: string,
    updates: Partial<Strategy>
  ): Promise<void> {
    await apiClient.put(`/api/v1/strategies/${strategyId}`, updates)
  }

  // 系统相关
  static async healthCheck(): Promise<{ status: string }> {
    const response = await apiClient.get('/health')
    return response.data
  }
}

export default ApiService