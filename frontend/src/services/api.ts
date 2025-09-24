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
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
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

export interface FundRealtimeData {
  code: string
  current_value: number
  change_percent: number
  update_time: string
  previous_value: number
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

export interface WatchlistItem {
  id: string
  fund_id: string
  fund_code: string
  fund_name: string
  fund_type?: string
  manager?: string
  company?: string
  created_at: string
}

export interface WatchlistFund extends Fund {
  watchlistId: string
  watchedAt: string
}

const normalizeFund = (fund: any): Fund => ({
  id: String(fund?.id ?? fund?.code ?? ''),
  code: fund?.code ?? '',
  name: fund?.name ?? '',
  fund_type: fund?.fund_type ?? '',
  manager: fund?.manager ?? '',
  company: fund?.company ?? '',
  establish_date: fund?.establish_date ?? '',
  scale: fund?.scale ?? undefined,
  current_nav: fund?.current_nav ?? undefined,
  accumulated_nav: fund?.accumulated_nav ?? undefined,
  daily_return: fund?.daily_return ?? undefined,
  description: fund?.description ?? '',
})

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

export interface ApplyStrategyPayload {
  fund_code: string
  strategy_name: string
}

export interface ApplyStrategyResponse {
  signal: 'buy' | 'sell' | 'hold'
  reason: string
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
  static async getFundById(fundCode: string): Promise<Fund> {
    const response = await apiClient.get(`/api/v1/funds/${fundCode}/info`)
    return normalizeFund(response.data)
  }

  static async getFundNavHistory(
    fundCode: string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<FundNavHistory[]> {
    const response = await apiClient.get(`/api/v1/funds/${fundCode}/net-values`, {
      params,
    })
    return response.data
  }

  static async getFunds(
    params?: {
      skip?: number
      limit?: number
      fund_type?: string
      search?: string
      page?: number
    }
  ): Promise<PaginatedResponse<Fund>> {
    const response = await apiClient.get('/api/v1/funds', {
      params,
    })
    const payload = response.data

    return {
      ...payload,
      items: Array.isArray(payload.items)
        ? payload.items.map((item: any) => normalizeFund(item))
        : [],
    }
  }

  static async searchFunds(
    keyword: string,
    limit = 20
  ): Promise<FundSearchResult[]> {
    const response = await apiClient.get('/api/v1/funds/search', {
      params: { q: keyword, limit },
    })
    return response.data
  }

  // 关注列表相关
  static async getWatchlist(options: { enrich?: boolean } = {}): Promise<WatchlistFund[]> {
    const { enrich = true } = options
    const response = await apiClient.get('/api/v1/watchlist')
    const items: WatchlistItem[] = response.data

    if (!Array.isArray(items) || items.length === 0) {
      return []
    }

    const buildFund = async (item: WatchlistItem): Promise<WatchlistFund> => {
      const baseFund = normalizeFund({
        id: item.fund_id,
        code: item.fund_code,
        name: item.fund_name,
        fund_type: item.fund_type,
        manager: item.manager,
        company: item.company,
      })

      if (!enrich) {
        return {
          ...baseFund,
          watchlistId: item.id,
          watchedAt: item.created_at,
        }
      }

        try {
          const fund = await ApiService.getFundById(item.fund_code)
          return {
            ...fund,
            watchlistId: item.id,
            watchedAt: item.created_at,
          } as WatchlistFund
        } catch (error) {
          return {
            ...baseFund,
            watchlistId: item.id,
            watchedAt: item.created_at,
          }
        }
      }

    const results = await Promise.all(items.map((item) => buildFund(item)))

    return results
  }

  static async addToWatchlist(fundCode: string): Promise<ApiResponse> {
    const response = await apiClient.post('/api/v1/watchlist', {
      fund_code: fundCode,
    })
    const result: ApiResponse = response.data
    if (!result.success) {
      throw new Error(result.message || '添加关注失败')
    }
    return result
  }

  static async removeFromWatchlist(fundCode: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/api/v1/watchlist/${fundCode}`)
    const result: ApiResponse = response.data
    if (!result.success) {
      throw new Error(result.message || '取消关注失败')
    }
    return result
  }

  static async isFundWatched(fundCode: string): Promise<boolean> {
    const watchlist = await ApiService.getWatchlist({ enrich: false })
    return watchlist.some((item) => item.code === fundCode)
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
    return response.data.strategies ?? response.data
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
      params: { limit },
    })
    return response.data.signals ?? response.data
  }

  static async updateStrategy(
    strategyId: string,
    updates: Partial<Strategy>
  ): Promise<void> {
    await apiClient.put(`/api/v1/strategies/${strategyId}`, updates)
  }

  static async applyStrategy(
    payload: ApplyStrategyPayload
  ): Promise<ApplyStrategyResponse> {
    const response = await apiClient.post('/api/v1/strategies/apply', payload)
    return response.data
  }

  // 系统相关
  static async healthCheck(): Promise<{ status: string }> {
    const response = await apiClient.get('/health')
    return response.data
  }
}

export default ApiService
