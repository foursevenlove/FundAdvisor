import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Row, Col, Typography, Space, Tag, Button, Statistic, Tabs, Table, Alert } from 'antd'
import { ArrowUp, ArrowDown, Star, TrendingUp, Calendar, User, Building } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface FundInfo {
  code: string
  name: string
  type: string
  manager: string
  company: string
  establishDate: string
  scale: string
  currentValue: number
  changePercent: number
  changeAmount: number
  description: string
}

interface PerformanceData {
  period: string
  return: number
  benchmark: number
}

const FundDetail: React.FC = () => {
  const { code } = useParams<{ code: string }>()
  const [fundInfo, setFundInfo] = useState<FundInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWatched, setIsWatched] = useState(false)

  // 模拟基金数据
  const mockFundInfo: FundInfo = {
    code: code || '000001',
    name: '华夏成长混合',
    type: '混合型基金',
    manager: '张三',
    company: '华夏基金管理有限公司',
    establishDate: '2001-12-18',
    scale: '156.78亿元',
    currentValue: 1.2345,
    changePercent: 2.34,
    changeAmount: 0.0283,
    description: '本基金主要投资于具有良好成长性的上市公司股票，通过精选个股和严格的风险管理，力争实现基金资产的长期稳健增值。'
  }

  // 模拟历史净值数据
  const getHistoryChartOption = () => {
    const dates = []
    const values = []
    const baseValue = 1.0
    
    for (let i = 0; i < 365; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (365 - i))
      dates.push(date.toISOString().split('T')[0])
      
      // 模拟净值波动
      const randomChange = (Math.random() - 0.5) * 0.02
      const value: number = i === 0 ? baseValue : values[i - 1] * (1 + randomChange)
      values.push(Number(value.toFixed(4)))
    }

    return {
      title: {
        text: '净值走势',
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
          color: '#999'
        },
        splitLine: {
          lineStyle: {
            color: '#333'
          }
        }
      },
      series: [
        {
          name: '净值',
          type: 'line',
          data: values,
          smooth: true,
          lineStyle: {
            color: '#1890ff',
            width: 2
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
                  color: 'rgba(24, 144, 255, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(24, 144, 255, 0.05)'
                }
              ]
            }
          }
        }
      ]
    }
  }

  // 模拟业绩数据
  const performanceData: PerformanceData[] = [
    { period: '近1月', return: 2.34, benchmark: 1.85 },
    { period: '近3月', return: 8.76, benchmark: 6.42 },
    { period: '近6月', return: 15.23, benchmark: 12.67 },
    { period: '近1年', return: 28.45, benchmark: 22.18 },
    { period: '近2年', return: 45.67, benchmark: 35.29 },
    { period: '近3年', return: 78.92, benchmark: 58.43 }
  ]

  const performanceColumns = [
    {
      title: '时间段',
      dataIndex: 'period',
      key: 'period'
    },
    {
      title: '基金收益率',
      dataIndex: 'return',
      key: 'return',
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}%
        </Text>
      )
    },
    {
      title: '基准收益率',
      dataIndex: 'benchmark',
      key: 'benchmark',
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#f5222d' }}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}%
        </Text>
      )
    },
    {
      title: '超额收益',
      key: 'excess',
      render: (_: any, record: PerformanceData) => {
        const excess = record.return - record.benchmark
        return (
          <Text style={{ color: excess > 0 ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
            {excess > 0 ? '+' : ''}{excess.toFixed(2)}%
          </Text>
        )
      }
    }
  ]

  useEffect(() => {
    // 模拟API调用
    setTimeout(() => {
      setFundInfo(mockFundInfo)
      setLoading(false)
    }, 1000)
  }, [code])

  const handleToggleWatch = () => {
    setIsWatched(!isWatched)
    // TODO: 实现关注/取消关注逻辑
  }

  if (loading || !fundInfo) {
    return (
      <div className="page-container">
        <Card loading={true} style={{ minHeight: 400 }} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 基金基本信息 */}
        <Card className="fund-header-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Space align="center" wrap>
                    <Title level={2} style={{ margin: 0 }}>
                      {fundInfo.name}
                    </Title>
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {fundInfo.code}
                    </Tag>
                    <Tag>{fundInfo.type}</Tag>
                  </Space>
                </div>
                
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="单位净值"
                      value={fundInfo.currentValue}
                      precision={4}
                      valueStyle={{ color: '#1890ff', fontSize: 24 }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="日涨跌幅"
                      value={fundInfo.changePercent}
                      precision={2}
                      suffix="%"
                      prefix={fundInfo.changePercent > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      valueStyle={{ 
                        color: fundInfo.changePercent > 0 ? '#52c41a' : '#f5222d',
                        fontSize: 20
                      }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="日涨跌额"
                      value={fundInfo.changeAmount}
                      precision={4}
                      prefix={fundInfo.changeAmount > 0 ? '+' : ''}
                      valueStyle={{ 
                        color: fundInfo.changeAmount > 0 ? '#52c41a' : '#f5222d',
                        fontSize: 20
                      }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Button
                        type={isWatched ? "default" : "primary"}
                        icon={<Star size={16} fill={isWatched ? "#faad14" : "none"} />}
                        onClick={handleToggleWatch}
                        size="large"
                      >
                        {isWatched ? '已关注' : '关注'}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Space>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card size="small" className="fund-info-card">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <User size={16} />
                    <Text>基金经理：</Text>
                    <Text strong>{fundInfo.manager}</Text>
                  </Space>
                  <Space>
                    <Building size={16} />
                    <Text>基金公司：</Text>
                    <Text strong>{fundInfo.company}</Text>
                  </Space>
                  <Space>
                    <Calendar size={16} />
                    <Text>成立日期：</Text>
                    <Text strong>{fundInfo.establishDate}</Text>
                  </Space>
                  <Space>
                    <TrendingUp size={16} />
                    <Text>基金规模：</Text>
                    <Text strong>{fundInfo.scale}</Text>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 详细信息标签页 */}
        <Card style={{ marginTop: 24 }}>
          <Tabs defaultActiveKey="chart" size="large">
            <TabPane tab="净值走势" key="chart">
              <div style={{ height: 400 }}>
                <ReactECharts 
                  option={getHistoryChartOption()} 
                  style={{ height: '100%', width: '100%' }}
                  theme="dark"
                />
              </div>
            </TabPane>
            
            <TabPane tab="业绩表现" key="performance">
              <Alert
                message="业绩提示"
                description="基金的过往业绩并不预示其未来表现，基金管理人管理的其他基金的业绩并不构成基金业绩表现的保证。"
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
              <Table
                columns={performanceColumns}
                dataSource={performanceData}
                pagination={false}
                size="middle"
                rowKey="period"
              />
            </TabPane>
            
            <TabPane tab="基金概况" key="overview">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={4}>投资目标</Title>
                  <Paragraph>{fundInfo.description}</Paragraph>
                </div>
                
                <div>
                  <Title level={4}>投资策略</Title>
                  <Paragraph>
                    本基金采用积极的资产配置策略，在严格控制风险的前提下，通过大类资产配置和精选个股相结合的投资策略，
                    力争实现基金资产的长期稳健增值。基金将重点关注具有良好成长性、合理估值的优质上市公司。
                  </Paragraph>
                </div>
                
                <div>
                  <Title level={4}>风险收益特征</Title>
                  <Paragraph>
                    本基金为混合型基金，其预期收益及预期风险水平高于债券型基金和货币市场基金，但低于股票型基金。
                    本基金将投资港股通标的股票，需承担港股通机制下因投资环境、投资标的、市场制度以及交易规则等差异带来的特有风险。
                  </Paragraph>
                </div>
              </Space>
            </TabPane>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  )
}

export default FundDetail