import React, { useState, useEffect } from 'react'
import { Card, Table, Space, Button, Typography, Tag, Popconfirm, Empty, Row, Col, Statistic, message, Select, Spin } from 'antd'
import { Star, TrendingUp, TrendingDown, Trash2, Eye, Plus, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import ApiService, { ApplyStrategyResponse, WatchlistFund } from '../services/api'

const { Title, Text } = Typography

// 扩展的关注列表项接口
interface WatchlistItem extends WatchlistFund {
  selectedStrategy: string
  analysisResult?: ApplyStrategyResponse | null
  isAnalyzing: boolean
}

// 策略列表 (暂时硬编码)
const STRATEGIES = [
  { label: '移动平均线策略', value: 'MA_CROSS' },
  { label: '趋势跟踪策略', value: 'TREND_FOLLOWING' },
  { label: '动态定投策略', value: 'DYNAMIC_DCA' },
]

const WatchList: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([])

  // 使用 React Query 获取关注列表
  const { data: watchedFunds = [], isLoading, error } = useQuery(
    'watchlist',
    () => ApiService.getWatchlist(),
    {
      onSuccess: (data) => {
        // 数据获取成功后，初始化前端状态
        const initialItems = data.map(fund => ({
          ...fund,
          selectedStrategy: STRATEGIES[0].value, // 默认选择第一个策略
          analysisResult: null,
          isAnalyzing: false,
        }))
        setWatchlistItems(initialItems)
      },
      staleTime: 0,
      refetchOnMount: 'always',
    }
  )
  
  const watchedFundsData = watchedFunds || []
  const totalFunds = watchedFundsData.length
  const gainFunds = watchedFundsData.filter(fund => (fund.daily_return ?? 0) > 0).length
  const lossFunds = watchedFundsData.filter(fund => (fund.daily_return ?? 0) < 0).length
  const avgChange = totalFunds > 0 
    ? watchedFundsData.reduce((sum, fund) => sum + (fund.daily_return ?? 0), 0) / totalFunds 
    : 0
  
  useEffect(() => {
    if (error) {
      message.error('获取关注列表失败，请稍后重试')
    }
  }, [error])

  // 使用 useMutation 来执行策略分析
  const applyStrategyMutation = useMutation(ApiService.applyStrategy, {
    onMutate: (variables) => {
      // 开始分析，更新UI状态
      setWatchlistItems(prev =>
        prev.map(item =>
          item.code === variables.fund_code ? { ...item, isAnalyzing: true } : item
        )
      )
    },
    onSuccess: (data, variables) => {
      // 分析成功，更新结果
      setWatchlistItems(prev =>
        prev.map(item =>
          item.code === variables.fund_code
            ? { ...item, analysisResult: data, isAnalyzing: false }
            : item
        )
      )
      message.success(`基金 ${variables.fund_code} 分析完成`)
    },
    onError: (err: any, variables) => {
      // 分析失败
      message.error(`分析失败: ${err.response?.data?.detail || err.message}`)
      setWatchlistItems(prev =>
        prev.map(item =>
          item.code === variables.fund_code ? { ...item, isAnalyzing: false, analysisResult: null } : item
        )
      )
    },
  })

  const handleStrategyChange = (fundCode: string, strategyName: string) => {
    setWatchlistItems(prev =>
      prev.map(item =>
        item.code === fundCode ? { ...item, selectedStrategy: strategyName } : item
      )
    )
  }

  const handleAnalyze = (fundCode: string) => {
    const item = watchlistItems.find(i => i.code === fundCode)
    if (item) {
      applyStrategyMutation.mutate({
        fund_code: fundCode,
        strategy_name: item.selectedStrategy,
      })
    }
  }

  const handleRemoveFromWatchlist = async (fundCode: string) => {
    try {
      await ApiService.removeFromWatchlist(fundCode)
      queryClient.invalidateQueries('watchlist')
      message.success('已取消关注')
    } catch (err) {
      message.error('取消关注失败，请稍后重试')
    }
  }

  const handleViewDetail = (code: string) => navigate(`/fund/${code}`)
  const handleAddFund = () => navigate('/search')

  const renderSignalTag = (result: ApplyStrategyResponse | null | undefined) => {
    if (!result) return null

    const { signal } = result
    let color = 'grey'
    let text = '持有'

    if (signal === 'buy') {
      color = 'green'
      text = '买入'
    } else if (signal === 'sell') {
      color = 'red'
      text = '卖出'
    }

    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    {
      title: '基金信息',
      dataIndex: 'name',
      key: 'info',
      render: (name: string, record: WatchlistItem) => (
        <div>
          <Text strong>{name}</Text>
          <div><Tag color="blue">{record.code}</Tag></div>
        </div>
      ),
    },
    {
      title: '策略选择',
      key: 'strategy',
      render: (_: any, record: WatchlistItem) => (
        <Select
          value={record.selectedStrategy}
          style={{ width: 150 }}
          onChange={(value) => handleStrategyChange(record.code, value)}
          options={STRATEGIES}
        />
      ),
    },
    {
      title: '分析操作',
      key: 'analyze',
      render: (_: any, record: WatchlistItem) => (
        <Button
          type="primary"
          icon={<BarChart2 size={16} />}
          loading={record.isAnalyzing}
          onClick={() => handleAnalyze(record.code)}
        >
          分析
        </Button>
      ),
    },
    {
      title: '操作建议',
      key: 'suggestion',
      render: (_: any, record: WatchlistItem) => (
        record.isAnalyzing ? <Spin size="small" /> : renderSignalTag(record.analysisResult)
      ),
    },
    {
      title: '基金管理',
      key: 'actions',
      render: (_: any, record: WatchlistItem) => (
        <Space>
          <Button icon={<Eye size={16} />} onClick={() => handleViewDetail(record.code)}>详情</Button>
          <Popconfirm
            title="确认取消关注？"
            onConfirm={() => handleRemoveFromWatchlist(record.code)}
            okText="确认"
            cancelText="取消"
          >
            <Button danger icon={<Trash2 size={16} />}>取消关注</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={1} className="page-title">
          我的关注
        </Title>
        <Text className="page-description">
          管理您关注的基金，实时跟踪净值变化和收益表现
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <Statistic
                title="关注总数"
                value={totalFunds}
                suffix="只"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </motion.div>
        </Col>
        <Col xs={12} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <Statistic
                title="上涨基金"
                value={gainFunds}
                suffix="只"
                valueStyle={{ color: '#52c41a' }}
                prefix={<TrendingUp size={16} />}
              />
            </Card>
          </motion.div>
        </Col>
        <Col xs={12} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <Statistic
                title="下跌基金"
                value={lossFunds}
                suffix="只"
                valueStyle={{ color: '#f5222d' }}
                prefix={<TrendingDown size={16} />}
              />
            </Card>
          </motion.div>
        </Col>
        <Col xs={12} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <Statistic
                title="平均涨幅"
                value={avgChange}
                precision={2}
                suffix="%"
                valueStyle={{ 
                  color: avgChange > 0 ? '#52c41a' : avgChange < 0 ? '#f5222d' : '#8c8c8c' 
                }}
                prefix={avgChange > 0 ? '+' : ''}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* 关注列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card
          title={
            <Space>
              <Star size={20} />
              <span>关注列表</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleAddFund}
            >
              添加关注
            </Button>
          }
        >
          {watchlistItems.length > 0 ? (
            <Table
              columns={columns}
              dataSource={watchlistItems}
              rowKey="code"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
              }}
              scroll={{ x: 800 }}
            />
          ) : (
            !isLoading && (
              <Empty
                description="暂无关注的基金"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={handleAddFund}>
                  立即添加
                </Button>
              </Empty>
            )
          )}
        </Card>
      </motion.div>
    </div>
  )
}

export default WatchList
