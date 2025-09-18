import React, { useState } from 'react'
import { Layout, Menu, Button, Space, Typography } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Home, 
  Search, 
  Heart, 
  PieChart, 
  TrendingUp, 
  Menu as MenuIcon,
  X 
} from 'lucide-react'
import { motion } from 'framer-motion'

const { Header, Sider, Content } = Layout
const { Title } = Typography

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
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
      path: '/portfolio'
    },
    {
      key: '/strategies',
      icon: <TrendingUp size={18} />,
      label: '投资策略',
      path: '/strategies'
    }
  ]

  const handleMenuClick = (item: any) => {
    navigate(item.path)
  }

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240}
        collapsedWidth={80}
        style={{
          background: '#141414',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="logo-container" style={{ 
          padding: '16px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <TrendingUp size={32} color="#1890ff" />
          </motion.div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{ marginLeft: '12px' }}
            >
              <Title level={4} style={{ margin: 0, color: '#fff' }}>
                FundAdvisor
              </Title>
            </motion.div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ 
            background: 'transparent',
            border: 'none'
          }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => handleMenuClick(item)
          }))}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#141414',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuIcon size={18} /> : <X size={18} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 40,
              height: 40,
              color: '#fff'
            }}
          />

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
        </Header>

        <Content style={{ 
          margin: 0,
          background: '#0a0a0a',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}>
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