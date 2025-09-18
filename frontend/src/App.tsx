import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { motion } from 'framer-motion'

import AppLayout from './components/Layout/AppLayout'
import Dashboard from './pages/Dashboard'
import FundSearch from './pages/FundSearch'
import FundDetail from './pages/FundDetail'
import WatchList from './pages/WatchList'
import Portfolio from './pages/Portfolio'
import Strategies from './pages/Strategies'
import NotFound from './pages/NotFound'

const { Content } = Layout

const App: React.FC = () => {
  return (
    <div className="app">
      <AppLayout>
        <Content className="app-content">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<FundSearch />} />
              <Route path="/fund/:code" element={<FundDetail />} />
              <Route path="/watchlist" element={<WatchList />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/strategies" element={<Strategies />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </Content>
      </AppLayout>
    </div>
  )
}

export default App