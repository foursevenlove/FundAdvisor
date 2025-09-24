import React, { useState, useEffect } from 'react'
import { Card, Input, List, Typography, Space, Tag, Button, Empty, message } from 'antd'
import { Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from 'react-query'
import ApiService, { Fund, FundSearchResult } from '../services/api'

const { Title, Text } = Typography

const FundSearch: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [popularFunds, setPopularFunds] = useState<Fund[]>([])

  // 获取热门基金
  useEffect(() => {
    const fetchPopularFunds = async () => {
      try {
        const response = await ApiService.getFunds({ limit: 12 })
        setPopularFunds(response.items)
      } catch (error) {
        console.error('获取热门基金失败:', error)
        // 使用模拟数据作为后备
        setPopularFunds([
          {
            id: '1',
            code: '000001',
            name: '华夏成长混合',
            fund_type: '混合型',
            manager: '张三',
            company: '华夏基金',
            establish_date: '2001-12-18',
            current_nav: 1.2345,
            daily_return: 0.0234,
            description: '本基金主要投资于具有良好成长性的上市公司股票'
          },
          {
            id: '2',
            code: '110022',
            name: '易方达消费行业股票',
            fund_type: '股票型',
            manager: '李四',
            company: '易方达基金',
            establish_date: '2010-08-20',
            current_nav: 3.4567,
            daily_return: -0.0123,
            description: '本基金主要投资于消费行业相关的优质上市公司'
          },
          {
            id: '3',
            code: '161725',
            name: '招商中证白酒指数',
            fund_type: '指数型',
            manager: '王五',
            company: '招商基金',
            establish_date: '2015-05-27',
            current_nav: 0.9876,
            daily_return: 0.0056,
            description: '本基金跟踪中证白酒指数，投资于白酒行业相关股票'
          },
          {
            id: '4',
            code: '519066',
            name: '汇添富蓝筹稳健混合',
            fund_type: '混合型',
            manager: '赵六',
            company: '汇添富基金',
            establish_date: '2007-03-12',
            current_nav: 2.1234,
            daily_return: 0.0187,
            description: '本基金主要投资于蓝筹股，追求稳健的长期回报'
          }
        ])
      }
    }

    fetchPopularFunds()
  }, [])

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results = await ApiService.searchFunds(value, 20)
      setSearchResults(results)
    } catch (error) {
      console.error('搜索基金失败:', error)
      message.error('搜索失败，请稍后重试')
      // 使用模拟搜索作为后备
      const mockResults = popularFunds.filter(
        fund => 
          fund.code.includes(value) || 
          fund.name.toLowerCase().includes(value.toLowerCase())
      )
      setSearchResults(mockResults)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWatchlist = async (fund: FundSearchResult) => {
    try {
      await ApiService.addToWatchlist(fund.code)
      queryClient.invalidateQueries('watchlist')
      message.success(`已添加 ${fund.name} 到关注列表`)
    } catch (error) {
      console.error('添加到关注列表失败:', error)
      message.error('添加失败，请稍后重试')
    }
  }

  const handleViewDetail = (code: string) => {
    navigate(`/fund/${code}`)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={1} className="page-title">
          基金搜索
        </Title>
        <Text className="page-description">
          搜索基金代码或名称，获取实时基金信息和投资策略建议
        </Text>
      </div>

      <Card className="search-card">
        <Input.Search
          placeholder="请输入基金代码或名称"
          size="large"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          loading={loading}
          prefix={<Search size={18} />}
          style={{ marginBottom: 24 }}
        />

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <List
                dataSource={searchResults}
                renderItem={(fund, index) => (
                  <motion.div
                    key={fund.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <List.Item
                      className="fund-search-item"
                      actions={[
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => handleAddToWatchlist(fund)}
                        >
                          关注
                        </Button>,
                        <Button 
                          size="small"
                          onClick={() => handleViewDetail(fund.code)}
                        >
                          详情
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong style={{ fontSize: 16 }}>
                              {fund.name}
                            </Text>
                            <Tag color="blue">{fund.code}</Tag>
                            <Tag>{fund.fund_type}</Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">
                              基金经理：{fund.manager || '暂无'} | 基金公司：{fund.company || '暂无'}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  </motion.div>
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {searchValue && searchResults.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Empty
              description="未找到相关基金"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </motion.div>
        )}

        {!searchValue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Empty
              description="请输入基金代码或名称进行搜索"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </motion.div>
        )}
      </Card>

      <Card title="热门基金" style={{ marginTop: 24 }}>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={popularFunds}
          renderItem={(fund, index) => (
            <List.Item key={fund.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card 
                  size="small" 
                  className="fund-card-mini"
                  hoverable
                  actions={[
                    <Button 
                      type="text" 
                      size="small"
                      onClick={() => handleAddToWatchlist(fund)}
                    >
                      关注
                    </Button>,
                    <Button 
                      type="text" 
                      size="small"
                      onClick={() => handleViewDetail(fund.code)}
                    >
                      详情
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space direction="vertical" size="small">
                        <Text strong ellipsis style={{ fontSize: 14 }}>
                          {fund.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {fund.code}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Tag>{fund.fund_type}</Tag>
                        {fund.current_nav && (
                          <div>
                            <Text style={{ fontSize: 12 }}>
                              {fund.current_nav.toFixed(4)}
                            </Text>
                            <br />
                            {fund.daily_return !== undefined && (
                              <Text 
                                style={{ 
                                  fontSize: 12,
                                  color: fund.daily_return > 0 ? '#52c41a' : 
                                         fund.daily_return < 0 ? '#f5222d' : '#8c8c8c'
                                }}
                              >
                                {fund.daily_return > 0 ? '+' : ''}{(fund.daily_return * 100).toFixed(2)}%
                              </Text>
                            )}
                          </div>
                        )}
                      </Space>
                    }
                  />
                </Card>
              </motion.div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default FundSearch
