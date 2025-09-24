
import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Table,
  Progress,
  Tag,
  Statistic,
  Tabs,
  Empty
} from 'antd'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import type { AxiosError } from 'axios'
import ApiService, {
  Holding as ApiHolding,
  PortfolioSummary as ApiPortfolioSummary
} from '../services/api'

const { Title, Text } = Typography
const { TabPane } = Tabs

interface PortfolioHolding {
  id: string
  code: string
  name: string
  type: string
  shares: number
  avgCost: number
  currentValue: number
  marketValue: number
  totalReturn: number
  totalReturnPercent: number
  dayReturn: number
  dayReturnPercent: number
  weight: number
}

interface PortfolioSummary {
  totalAssets: number
  totalCost: number
  totalReturn: number
  totalReturnPercent: number
  dayReturn: number
  dayReturnPercent: number
}

const mapHolding = (holding: ApiHolding): PortfolioHolding => ({
  id: holding.id,
  code: holding.fund_code,
  name: holding.fund_name,
  type: holding.fund_type,
  shares: holding.shares,
  avgCost: holding.avg_cost,
  currentValue: holding.current_value,
  marketValue: holding.market_value,
  totalReturn: holding.total_return,
  totalReturnPercent: holding.total_return_percent,
  dayReturn: holding.day_return,
  dayReturnPercent: holding.day_return_percent,
  weight: holding.weight
})

const mapSummary = (summary: ApiPortfolioSummary): PortfolioSummary => ({
  totalAssets: summary.total_assets,
  totalCost: summary.total_cost,
  totalReturn: summary.total_return,
  totalReturnPercent: summary.total_return_percent,
  dayReturn: summary.day_return,
  dayReturnPercent: summary.day_return_percent
})

const Portfolio: React.FC = () => {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const portfolio = await ApiService.getPortfolio()
        const mappedHoldings = portfolio.holdings?.map(mapHolding) ?? []
        setHoldings(mappedHoldings)
        setSummary(
          portfolio.summary ? mapSummary(portfolio.summary) : null
        )
        setError(null)
      } catch (err) {
        console.error('Failed to load portfolio', err)
        const status = (err as AxiosError)?.response?.status
        if (status === 404) {
          setHoldings([])
          setSummary(null)
          setError(null)
        } else {
          setHoldings([])
          setSummary(null)
          setError('获取投资组合数据失败，请稍后重试。')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [])

  // 资产配置饼图
  const getAssetAllocationOption = () => {
    const data = holdings.map(holding => ({
      name: holding.name,
      value: holding.marketValue,
      code: holding.code
    }))

    return {
      title: {
        text: '资产配置',
        left: 'center',
        textStyle: {
          color: '#ffffff',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: {
          color: '#fff'
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: '#ffffff'
        }
      },
      series: [
        {
          name: '持仓',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#ffffff'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    }
  }

  // 收益趋势图
  const getReturnTrendOption = () => {
    const dates = []
    const returns = []
    
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (30 - i))
      dates.push(date.toISOString().split('T')[0])
      
      // 模拟收益波动
      const baseReturn = 2000
      const randomChange = (Math.random() - 0.5) * 200
      const returnValue: number = i === 0 ? baseReturn : returns[i - 1] + randomChange
      returns.push(Number(returnValue.toFixed(2)))
    }

    return {
      title: {
        text: '30日收益趋势',
        textStyle: {
          color: '#ffffff',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: {
          color: '#fff'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        },
        axisLabel: {
          color: '#999'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        },
        axisLabel: {
          color: '#999',
          formatter: '¥{value}'
        },
        splitLine: {
          lineStyle: {
            color: '#333'
          }
        }
      },
      series: [
        {
          name: '累计收益',
          type: 'line',
          data: returns,
          smooth: true,
          lineStyle: {
            color: '#f5222d',
            width: 3
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(245, 34, 45, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(245, 34, 45, 0.05)'
                }
              ]
            }
          }
        }
      ]
    }
  }

  const columns = [
    {
      title: '基金信息',
      key: 'info',
      render: (_: any, record: PortfolioHolding) => (
        <Space direction="vertical" size="small">
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              {record.name}
            </Text>
            <Tag color="blue">{record.code}</Tag>
          </Space>
          <Tag>{record.type}</Tag>
        </Space>
      ),
      width: 250
    },
    {
      title: '持有份额',
      dataIndex: 'shares',
      key: 'shares',
      render: (value: number) => (
        <Text>{value.toLocaleString()}</Text>
      ),
      align: 'right' as const
    },
    {
      title: '成本净值',
      dataIndex: 'avgCost',
      key: 'avgCost',
      render: (value: number) => (
        <Text>{value.toFixed(4)}</Text>
      ),
      align: 'right' as const
    },
    {
      title: '当前净值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (value: number) => (
        <Text strong>{value.toFixed(4)}</Text>
      ),
      align: 'right' as const
    },
    {
      title: '市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      render: (value: number) => (
        <Text strong style={{ fontSize: 16 }}>
          ¥{value.toLocaleString()}
        </Text>
      ),
      align: 'right' as const
    },
    {
      title: '持仓收益',
      key: 'totalReturn',
      render: (_: any, record: PortfolioHolding) => (
        <Space direction="vertical" size="small" style={{ textAlign: 'right' }}>
          <Text
            style={{
              color: record.totalReturn > 0 ? '#f5222d' : '#52c41a',
              fontWeight: 500
            }}
          >
            ¥{record.totalReturn > 0 ? '+' : ''}{record.totalReturn.toFixed(2)}
          </Text>
          <Text
            style={{
              color: record.totalReturnPercent > 0 ? '#f5222d' : '#52c41a',
              fontSize: 14
            }}
          >
            {record.totalReturnPercent > 0 ? '+' : ''}{record.totalReturnPercent.toFixed(2)}%
          </Text>
        </Space>
      ),
      align: 'right' as const,
      sorter: (a: PortfolioHolding, b: PortfolioHolding) => a.totalReturn - b.totalReturn
    },
    {
      title: '日收益',
      key: 'dayReturn',
      render: (_: any, record: PortfolioHolding) => (
        <Space direction="vertical" size="small" style={{ textAlign: 'right' }}>
          <Space>
            {record.dayReturn > 0 ? (
              <TrendingUp size={14} color="#f5222d" />
            ) : record.dayReturn < 0 ? (
              <TrendingDown size={14} color="#52c41a" />
            ) : null}
            <Text
              style={{
                color: record.dayReturn > 0 ? '#f5222d' : 
                       record.dayReturn < 0 ? '#52c41a' : '#8c8c8c',
                fontWeight: 500
              }}
            >
              ¥{record.dayReturn > 0 ? '+' : ''}{record.dayReturn.toFixed(2)}
            </Text>
          </Space>
          <Text
            style={{
              color: record.dayReturnPercent > 0 ? '#f5222d' : 
                     record.dayReturnPercent < 0 ? '#52c41a' : '#8c8c8c',
              fontSize: 14
            }}
          >
            {record.dayReturnPercent > 0 ? '+' : ''}{record.dayReturnPercent.toFixed(2)}%
          </Text>
        </Space>
      ),
      align: 'right' as const
    },
    {
      title: '仓位占比',
      dataIndex: 'weight',
      key: 'weight',
      render: (value: number) => (
        <Space direction="vertical" size="small" style={{ width: 80 }}>
          <Text>{value.toFixed(1)}%</Text>
          <Progress 
            percent={value} 
            showInfo={false} 
            size="small"
            strokeColor="#1890ff"
          />
        </Space>
      ),
      align: 'center' as const
    }
  ]

  if (loading) {
    return (
      <div className="page-container">
        <Card loading={true} style={{ minHeight: 400 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <Card style={{ minHeight: 400 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            <Text type="danger">{error}</Text>
          </Space>
        </Card>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="page-container">
        <Card style={{ minHeight: 400 }}>
          <Empty description="暂无投资组合数据" />
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={1} className="page-title">
          我的投资组合
        </Title>
        <Text className="page-description">
          查看您的基金投资组合详情，跟踪收益表现和资产配置
        </Text>
      </div>

      {/* 投资组合概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <Statistic
                title="总资产"
                value={summary.totalAssets}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff', fontSize: 20 }}
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
                title="累计收益"
                value={summary.totalReturn}
                precision={2}
                prefix={summary.totalReturn > 0 ? '+¥' : '¥'}
                valueStyle={{ 
                  color: summary.totalReturn > 0 ? '#f5222d' : '#52c41a',
                  fontSize: 20
                }}
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
                title="累计收益率"
                value={summary.totalReturnPercent}
                precision={2}
                suffix="%"
                prefix={summary.totalReturnPercent > 0 ? '+' : ''}
                valueStyle={{
                  color: summary.totalReturnPercent > 0 ? '#f5222d' : '#52c41a',
                  fontSize: 20
                }}
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
                title="今日收益"
                value={summary.dayReturn}
                precision={2}
                prefix={summary.dayReturn > 0 ? '+¥' : '¥'}
                valueStyle={{
                  color: summary.dayReturn > 0 ? '#f5222d' : '#52c41a',
                  fontSize: 20
                }}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* 图表和持仓详情 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <Tabs defaultActiveKey="holdings" size="large">
            <TabPane tab="持仓明细" key="holdings">
              <Table
                columns={columns}
                dataSource={holdings}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1200 }}
              />
            </TabPane>
            
            <TabPane tab="资产配置" key="allocation">
              <div style={{ height: 400 }}>
                <ReactECharts
                  option={getAssetAllocationOption()}
                  style={{ height: '100%', width: '100%' }}
                  theme="dark"
                />
              </div>
            </TabPane>
            
            <TabPane tab="收益趋势" key="trend">
              <div style={{ height: 400 }}>
                <ReactECharts
                  option={getReturnTrendOption()}
                  style={{ height: '100%', width: '100%' }}
                  theme="dark"
                />
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  )
}

export default Portfolio
