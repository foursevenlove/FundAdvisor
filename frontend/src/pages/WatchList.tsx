import React, { useState, useEffect } from 'react'
import { Card, Table, Space, Button, Typography, Tag, Popconfirm, Empty, Row, Col, Statistic, message } from 'antd'
import { Star, TrendingUp, TrendingDown, Trash2, Eye, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/api'

const { Title, Text } = Typography

interface WatchedFund {
  id: string
  fund_id: string
  fund_code: string
  fund_name: string
  fund_type: string
  manager?: string
  company?: string
  currentValue?: number
  changePercent?: number
  changeAmount?: number
  created_at: string
  lastUpdate?: string
}

const WatchList: React.FC = () => {
  const navigate = useNavigate()
  const [watchedFunds, setWatchedFunds] = useState<WatchedFund[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const data = await ApiService.getWatchlist()
        // Transform the data to match our interface
        const transformedData: WatchedFund[] = data.map((item: any) => ({
          id: item.id,
          fund_id: item.fund_id,
          fund_code: item.fund_code,
          fund_name: item.fund_name,
          fund_type: item.fund_type || '',
          manager: item.manager,
          company: item.company,
          created_at: item.created_at,
          // Add mock current values since the API doesn't provide them yet
          currentValue: Math.random() * 2 + 1,
          changePercent: (Math.random() - 0.5) * 6,
          changeAmount: (Math.random() - 0.5) * 0.1,
          lastUpdate: new Date().toLocaleString()
        }))
        setWatchedFunds(transformedData)
      } catch (error) {
        console.error('获取关注列表失败:', error)
        message.error('获取关注列表失败，请稍后重试')
        // Fall back to empty list instead of mock data
        setWatchedFunds([])
      } finally {
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [])

  const handleRemoveFromWatchlist = async (fundId: string) => {
    try {
      await ApiService.removeFromWatchlist(fundId)
      setWatchedFunds(prev => prev.filter(fund => fund.fund_id !== fundId))
      message.success('已取消关注')
    } catch (error) {
      console.error('取消关注失败:', error)
      message.error('取消关注失败，请稍后重试')
    }
  }

  const handleViewDetail = (code: string) => {
    navigate(`/fund/${code}`)
  }

  const handleAddFund = () => {
    navigate('/search')
  }

  // 计算统计数据
  const totalFunds = watchedFunds.length
  const gainFunds = watchedFunds.filter(fund => (fund.changePercent || 0) > 0).length
  const lossFunds = watchedFunds.filter(fund => (fund.changePercent || 0) < 0).length
  const avgChange = watchedFunds.length > 0
    ? watchedFunds.reduce((sum, fund) => sum + (fund.changePercent || 0), 0) / watchedFunds.length
    : 0

  const columns = [
    {
      title: '基金信息',
      key: 'info',
      render: (_: any, record: WatchedFund) => (
        <Space direction="vertical" size="small">
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              {record.fund_name}
            </Text>
            <Tag color="blue">{record.fund_code}</Tag>
          </Space>
          <Space>
            <Tag>{record.fund_type}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              关注于 {new Date(record.created_at).toLocaleDateString()}
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
          {value ? value.toFixed(4) : '--'}
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
            {(record.changePercent || 0) > 0 ? (
              <TrendingUp size={16} color="#52c41a" />
            ) : (record.changePercent || 0) < 0 ? (
              <TrendingDown size={16} color="#f5222d" />
            ) : null}
            <Text
              style={{
                color: (record.changePercent || 0) > 0 ? '#52c41a' :
                       (record.changePercent || 0) < 0 ? '#f5222d' : '#8c8c8c',
                fontWeight: 500,
                fontSize: 16
              }}
            >
              {record.changePercent !== undefined
                ? `${(record.changePercent || 0) > 0 ? '+' : ''}${(record.changePercent || 0).toFixed(2)}%`
                : '--'
              }
            </Text>
          </Space>
          <Text
            style={{
              color: (record.changeAmount || 0) > 0 ? '#52c41a' :
                     (record.changeAmount || 0) < 0 ? '#f5222d' : '#8c8c8c',
              fontSize: 14
            }}
          >
            {record.changeAmount !== undefined
              ? `${(record.changeAmount || 0) > 0 ? '+' : ''}${(record.changeAmount || 0).toFixed(4)}`
              : '--'
            }
          </Text>
        </Space>
      ),
      align: 'right' as const,
      sorter: (a: WatchedFund, b: WatchedFund) => (a.changePercent || 0) - (b.changePercent || 0)
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
            onClick={() => handleViewDetail(record.fund_code)}
          >
            详情
          </Button>
          <Popconfirm
            title="确认取消关注"
            description="确定要从关注列表中移除这只基金吗？"
            onConfirm={() => handleRemoveFromWatchlist(record.fund_id)}
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