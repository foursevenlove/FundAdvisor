
import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Space, Button, Tag, Switch, Alert, Tabs, Table, Progress, Statistic } from 'antd'
import { Brain, TrendingUp, Target, Settings, Play, Pause, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface Strategy {
  id: string
  name: string
  description: string
  type: string
  riskLevel: 'low' | 'medium' | 'high'
  expectedReturn: number
  maxDrawdown: number
  isActive: boolean
  performance: {
    totalReturn: number
    annualizedReturn: number
    sharpeRatio: number
    winRate: number
  }
  signals: StrategySignal[]
}

interface StrategySignal {
  id: string
  fundCode: string
  fundName: string
  signal: 'buy' | 'sell' | 'hold'
  confidence: number
  reason: string
  timestamp: string
}

const Strategies: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟策略数据
  const mockStrategies: Strategy[] = [
    {
      id: '1',
      name: '均线交叉策略',
      description: '基于移动平均线交叉信号的趋势跟踪策略，适合中长期投资',
      type: '趋势跟踪',
      riskLevel: 'medium',
      expectedReturn: 12.5,
      maxDrawdown: 8.2,
      isActive: true,
      performance: {
        totalReturn: 15.8,
        annualizedReturn: 12.3,
        sharpeRatio: 1.45,
        winRate: 68.5
      },
      signals: [
        {
          id: '1',
          fundCode: '000001',
          fundName: '华夏成长混合',
          signal: 'buy',
          confidence: 85,
          reason: '5日均线上穿20日均线，趋势转强',
          timestamp: '2024-01-20 14:30:00'
        },
        {
          id: '2',
          fundCode: '110022',
          fundName: '易方达消费行业股票',
          signal: 'hold',
          confidence: 72,
          reason: '均线系统保持多头排列',
          timestamp: '2024-01-20 14:30:00'
        }
      ]
    },
    {
      id: '2',
      name: '动态定投策略',
      description: '根据市场估值和波动率动态调整定投金额的智能定投策略',
      type: '定投优化',
      riskLevel: 'low',
      expectedReturn: 8.5,
      maxDrawdown: 5.1,
      isActive: true,
      performance: {
        totalReturn: 9.2,
        annualizedReturn: 8.7,
        sharpeRatio: 1.28,
        winRate: 75.3
      },
      signals: [
        {
          id: '3',
          fundCode: '161725',
          fundName: '招商中证白酒指数',
          signal: 'buy',
          confidence: 78,
          reason: '当前估值偏低，建议增加定投金额',
          timestamp: '2024-01-20 14:30:00'
        }
      ]
    },
    {
      id: '3',
      name: '趋势跟踪策略',
      description: '结合技术指标和市场情绪的综合趋势判断策略',
      type: '技术分析',
      riskLevel: 'high',
      expectedReturn: 18.2,
      maxDrawdown: 12.5,
      isActive: false,
      performance: {
        totalReturn: 22.1,
        annualizedReturn: 18.9,
        sharpeRatio: 1.62,
        winRate: 61.8
      },
      signals: [
        {
          id: '4',
          fundCode: '519066',
          fundName: '汇添富蓝筹稳健混合',
          signal: 'sell',
          confidence: 82,
          reason: 'RSI超买，MACD顶背离',
          timestamp: '2024-01-20 14:30:00'
        }
      ]
    }
  ]

  useEffect(() => {
    // 模拟API调用
    setTimeout(() => {
      setStrategies(mockStrategies)
      setLoading(false)
    }, 1000)
  }, [])

  const handleToggleStrategy = (strategyId: string, active: boolean) => {
    setStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, isActive: active }
          : strategy
      )
    )
    // TODO: 调用API更新策略状态
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'green'
      case 'medium': return 'orange'
      case 'high': return 'red'
      default: return 'blue'
    }
  }

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'low': return '低风险'
      case 'medium': return '中风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return '#52c41a'
      case 'sell': return '#f5222d'
      case 'hold': return '#faad14'
      default: return '#8c8c8c'
    }
  }

  const getSignalText = (signal: string) => {
    switch (signal) {
      case 'buy': return '买入'
      case 'sell': return '卖出'
      case 'hold': return '持有'
      default: return '无信号'
    }
  }

  // 策略表现对比图
  const getPerformanceComparisonOption = () => {
    const strategyNames = strategies.map(s => s.name)
    const returns = strategies.map(s => s.performance.totalReturn)
    const sharpeRatios = strategies.map(s => s.performance.sharpeRatio)

    return {
      title: {
        text: '策略表现对比',
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
      legend: {
        data: ['总收益率', '夏普比率'],
        textStyle: {
          color: '#ffffff'
        }
      },
      xAxis: {
        type: 'category',
        data: strategyNames,
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        },
        axisLabel: {
          color: '#999'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '收益率(%)',
          position: 'left',
          axisLine: {
            lineStyle: {
              color: '#333'
            }
          },
          axisLabel: {
            color: '#999'
          },
          splitLine: {
            lineStyle: {
              color: '#333'
            }
          }
        },
        {
          type: 'value',
          name: '夏普比率',
          position: 'right',
          axisLine: {
            lineStyle: {
              color: '#333'
            }
          },
          axisLabel: {
            color: '#999'
          }
        }
      ],
      series: [
        {
          name: '总收益率',
          type: 'bar',
          data: returns,
          itemStyle: {
            color: '#1890ff'
          }
        },
        {
          name: '夏普比率',
          type: 'line',
          yAxisIndex: 1,
          data: sharpeRatios,
          lineStyle: {
            color: '#52c41a',
            width: 3
          },
          symbol: 'circle',
          symbolSize: 8
        }
      ]
    }
  }

  const signalColumns = [
    {
      title: '基金',
      key: 'fund',
      render: (_: any, record: StrategySignal) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.fundName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.fundCode}
          </Text>
        </Space>
      )
    },
    {
      title: '信号',
      dataIndex: 'signal',
      key: 'signal',
      render: (signal: string) => (
        <Tag color={getSignalColor(signal)} style={{ fontWeight: 500 }}>
          {getSignalText(signal)}
        </Tag>
      ),
      align: 'center' as const
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => (
        <Space direction="vertical" size="small" style={{ width: 80 }}>
          <Text>{confidence}%</Text>
          <Progress 
            percent={confidence} 
            showInfo={false} 
            size="small"
            strokeColor={confidence > 80 ? '#52c41a' : confidence > 60 ? '#faad14' : '#f5222d'}
          />
        </Space>
      ),
      align: 'center' as const
    },
    {
      title: '信号原因',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: '生成时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {timestamp}
        </Text>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={1} className="page-title">
          智能投资策略
        </Title>
        <Text className="page-description">
          基于AI算法的智能投资策略，帮助您做出更明智的投资决策
        </Text>
      </div>

      <Alert
        message="策略提醒"
        description="投资策略基于历史数据和技术分析，不构成投资建议。请结合自身风险承受能力谨慎投资。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 策略卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {strategies.map((strategy, index) => (
          <Col xs={24} lg={8} key={strategy.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={`strategy-card ${strategy.isActive ? 'active' : 'inactive'}`}
                title={
                  <Space>
                    <Brain size={20} />
                    <span>{strategy.name}</span>
                    <Tag color={getRiskLevelColor(strategy.riskLevel)}>
                      {getRiskLevelText(strategy.riskLevel)}
                    </Tag>
                  </Space>
                }
                extra={
                  <Switch
                    checked={strategy.isActive}
                    onChange={(checked) => handleToggleStrategy(strategy.id, checked)}
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                  />
                }
                actions={[
                  <Button type="text" icon={<Settings size={16} />}>
                    配置
                  </Button>,
                  <Button type="text" icon={<BarChart3 size={16} />}>
                    详情
                  </Button>
                ]}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Paragraph ellipsis={{ rows: 2 }}>
                    {strategy.description}
                  </Paragraph>
                  
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Statistic
                        title="预期收益"
                        value={strategy.expectedReturn}
                        precision={1}
                        suffix="%"
                        valueStyle={{ fontSize: 16, color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="最大回撤"
                        value={strategy.maxDrawdown}
                        precision={1}
                        suffix="%"
                        valueStyle={{ fontSize: 16, color: '#f5222d' }}
                      />
                    </Col>
                  </Row>
                  
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Statistic
                        title="夏普比率"
                        value={strategy.performance.sharpeRatio}
                        precision={2}
                        valueStyle={{ fontSize: 14 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="胜率"
                        value={strategy.performance.winRate}
                        precision={1}
                        suffix="%"
                        valueStyle={{ fontSize: 14 }}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* 策略详情 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <Tabs defaultActiveKey="signals" size="large">
            <TabPane tab="最新信号" key="signals">
              <Table
                columns={signalColumns}
                dataSource={strategies.flatMap(s => s.signals)}
                rowKey="id"
                pagination={false}
                loading={loading}
              />
            </TabPane>
            
            <TabPane tab="策略表现" key="performance">
              <div style={{ height: 400 }}>
                <ReactECharts
                  option={getPerformanceComparisonOption()}
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

export default Strategies