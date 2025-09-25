
import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Space, Button, Tag, Switch, Alert, Statistic } from 'antd'
import { Brain, Settings, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

const { Title, Text, Paragraph } = Typography

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
}

const Strategies: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([])

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
      }
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
      }
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
      }
    }
  ]

  useEffect(() => {
    // 模拟API调用
    const timeoutId = setTimeout(() => {
      setStrategies(mockStrategies)
    }, 1000)

    return () => clearTimeout(timeoutId)
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

  // 策略表现对比图
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
      {/*<motion.div*/}
      {/*  initial={{ opacity: 0, y: 20 }}*/}
      {/*  animate={{ opacity: 1, y: 0 }}*/}
      {/*  transition={{ duration: 0.5, delay: 0.4 }}*/}
      {/*>*/}
      {/*  <Card>*/}
      {/*    <Tabs defaultActiveKey="signals" size="large">*/}
      {/*      <TabPane tab="最新信号" key="signals">*/}
      {/*        <Table*/}
      {/*          columns={signalColumns}*/}
      {/*          dataSource={strategies.flatMap(s => s.signals)}*/}
      {/*          rowKey="id"*/}
      {/*          pagination={false}*/}
      {/*          loading={loading}*/}
      {/*        />*/}
      {/*      </TabPane>*/}
      {/*      */}
      {/*      <TabPane tab="策略表现" key="performance">*/}
      {/*        <div style={{ height: 400 }}>*/}
      {/*          <ReactECharts*/}
      {/*            option={getPerformanceComparisonOption()}*/}
      {/*            style={{ height: '100%', width: '100%' }}*/}
      {/*            theme="dark"*/}
      {/*          />*/}
      {/*        </div>*/}
      {/*      </TabPane>*/}
      {/*    </Tabs>*/}
      {/*  </Card>*/}
      {/*</motion.div>*/}
    </div>
  )
}

export default Strategies
