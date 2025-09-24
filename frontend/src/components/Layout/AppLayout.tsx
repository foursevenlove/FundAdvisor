import React, { useState } from 'react'
import { Layout, Menu, Button, Space, Typography } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Search,
  Heart,
  PieChart,
  TrendingUp,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'

import ThemeToggle from '../ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'

const { Header, Sider, Content } = Layout
const { Title } = Typography

interface AppLayoutProps {
  children: React.ReactNode
}

interface MenuItemConfig {
  key: string
  icon: React.ReactNode
  label: string
  path: string
  hidden?: boolean
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { resolvedTheme } = useTheme()
  const menuTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

  const menuItems: MenuItemConfig[] = [
    {
      key: '/',
      icon: <Home size={18} />,
      label: '仪表盘',
      path: '/'
    },
    {
      key: '/search',
      icon: <Search size={18} />,
      label: '基金搜索',
      path: '/search'
    },
    {
      key: '/watchlist',
      icon: <Heart size={18} />,
      label: '我的关注',
      path: '/watchlist'
    },
    {
      key: '/portfolio',
      icon: <PieChart size={18} />,
      label: '我的持仓',
      path: '/portfolio',
      hidden: true
    },
    {
      key: '/strategies',
      icon: <TrendingUp size={18} />,
      label: '投资策略',
      path: '/strategies'
    }
  ]

  const handleMenuClick = (item: MenuItemConfig) => {
    navigate(item.path)
  }

  const showInvestmentCTA = false

  return (
    <Layout className="app-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240}
        collapsedWidth={80}
        className="app-sider"
      >
        <div className={`logo-container ${collapsed ? 'is-collapsed' : ''}`}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <TrendingUp size={32} className="logo-icon" />
          </motion.div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="logo-text"
            >
              <Title level={4} className="logo-title" style={{ margin: 0 }}>
                FundAdvisor
              </Title>
            </motion.div>
          )}
        </div>

        <Menu
          theme={menuTheme}
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ 
            background: 'transparent',
            border: 'none'
          }}
          items={menuItems
            .filter(item => !item.hidden)
            .map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => handleMenuClick(item)
            }))}
        />
      </Sider>

      <Layout>
        <Header className="app-header">
          <Button
            type="text"
            icon={collapsed ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            onClick={() => setCollapsed(!collapsed)}
            className="sider-trigger-button"
          />

          {showInvestmentCTA && (
            <Space>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button type="primary" size="large">
                  开始投资
                </Button>
              </motion.div>
            </Space>
          )}

          <div className="app-header-actions">
            <ThemeToggle />
          </div>
        </Header>

        <Content className="app-main-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ height: '100%' }}
          >
            {children}
          </motion.div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
