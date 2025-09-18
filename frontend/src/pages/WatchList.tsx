import React, { useState, useEffect } from 'react'
import { Card, Table, Space, Button, Typography, Tag, Popconfirm, Empty, Row, Col, Statistic } from 'antd'
import { Star, TrendingUp, TrendingDown, Trash2, Eye, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface WatchedFund {
  id: string
  code: string
  name: string
  type: string
  currentValue: number
  changePercent: number
  changeAmount: number
  addedDate: string
  lastUpdate: string
}

const WatchList: React.FC = () => {
  const navigate = useNavigate()
  const [watchedFunds, setWatchedFunds] = useState<WatchedFund[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟关注的基金数据
  const mockWatchedFunds: WatchedFund[] = [
    {
      id: '1',
      code: '000001',
      name: '华夏成长混合',
      type: '混合型',
      currentValue: 1.2345,
      changePercent: 2.34,
      changeAmount: 0.0283,
      addedDate: '2024-01-15',
      lastUpdate: '2024-01-20 15:00:00'
    },
    {
      id: '2',
      code: '110022',
      name: '易方达消费行业股票',
      type: '股票型',
      currentValue: 3.4567,
      changePercent: -1.23,
      changeAmount: -0.0431,
      addedDate: '2024-01-10',
      lastUpdate: '2024-01-20 15:00:00'
    },
    {
      id: '3',
      code: '161725',
      name: '招商中证白酒指数',
      type: '指数型',
      currentValue: 0.9876,
      changePercent: 0.56,
      changeAmount: 0.0055,
      addedDate: '2024-01-08',
      lastUpdate: '2024-01-20 15:00:00'
    },
    {
      id: '4',
      code: '519066',
      name: '汇添富蓝筹稳健混合',
      type: '混合型',
      currentValue: 2.1234,
      changePercent: 1.87,
      changeAmount: 0.0390,
      addedDate: '2024-01-05',
      lastUpdate: '2024-01-20 15:00:00'
    }
  ]

  useEffect(() => {
    // 模拟API调用
    setTimeout(() => {
      setWatchedFunds(mockWatchedFunds)
      setLoading(false)
    }, 1000)
  }, [])

  const handleRemoveFromWatchlist = (fundId: string) => {
    setWatchedFunds(prev => prev.filter(fund => fund.id !== fundId))
    // TODO: 调用API删除关注
  }

  const handleViewDetail = (code: string) => {
    navigate(`/fund/${code}`)
  }

  const handleAddFund = () => {
    navigate('/search')
  }

  // 计算统计数据
  const totalFunds = watchedFunds.length
  const gainFunds = watchedFunds.filter(fund => fund.changePercent > 0).length
  const lossFunds = watchedFunds.filter(fund => fund.changePercent < 0).length
  const avgChange = watchedFunds.length > 0 
    ? watchedFunds.reduce((sum, fund) => sum + fund.changePercent, 0) / watchedFunds.length 
    : 0

  const columns = [
    {
      title: '基金信息',
      key: 'info',
      render: (_: any, record: WatchedFund) => (
        <Space direction="vertical" size="small">
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              {record.name}
            </Text>
            <Tag color="blue">{record.code}</Tag>
          </Space>
          <Space>
            <Tag>{record.type}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              关注于 {record.addedDate}
            </Text>
          </Space>
        </Space>
      ),
      width: 300
    },
    {
      title: '单位净值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (value: number) => (
        <Text strong style={{ fontSize: 16 }}>
          {value.toFixed(4)}
        </Text>
      ),
      align: 'right' as const
    },
    {
      title: '日涨跌幅',
      key: 'change',
      render: (_: any, record: WatchedFund) => (
        <Space direction="vertical" size="small" style={{ textAlign: 'right' }}>
          <Space>
            {record.changePercent > 0 ? (
              <TrendingUp size={16} color="#52c41a" />
            ) : record.changePercent < 0 ? (
              <TrendingDown size={16} color="#f5222d" />
            ) : null}
            <Text
              style={{
                color: record.changePercent > 0 ? '#52c41a' : 
                       record.changePercent < 0 ? '#f5222d' : '#8c8c8c',
                fontWeight: 500,
                fontSize: 16
              }}
            >
              {record.changePercent > 0 ? '+' : ''}{record.changePercent.toFixed(2)}%
            </Text>
          </Space>
          <Text
            style={{
              color: record.changeAmount > 0 ? '#52c41a' : 
                     record.changeAmount < 0 ? '#f5222d' : '#8c8c8c',
              fontSize: 14
            }}
          >
            {record.changeAmount > 0 ? '+' : ''}{record.changeAmount.toFixed(4)}
          </Text>
        </Space>
      ),
      align: 'right' as const,
      sorter: (a: WatchedFund, b: WatchedFund) => a.changePercent - b.changePercent
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      render: (value: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {value}
        </Text>
      ),
      align: 'center' as const
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: WatchedFund) => (
        <Space>
          <Button
            type="text"
            icon={<Eye size={16} />}
            onClick={() => handleViewDetail(record.code)}
          >
            详情
          </Button>
          <Popconfirm
            title="确认取消关注"
            description="确定要从关注列表中移除这只基金吗？"
            onConfirm={() => handleRemoveFromWatchlist(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
            >
              取消关注
            </Button>
          </Popconfirm>
        </Space>
      ),
      align: 'center' as const
    }
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
          {watchedFunds.length > 0 ? (
            <Table
              columns={columns}
              dataSource={watchedFunds}
              rowKey="id"
              loading={loading}
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
            !loading && (
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