import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="page-container" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Result
          status="404"
          title="404"
          subTitle="抱歉，您访问的页面不存在"
          extra={[
            <Button 
              type="primary" 
              key="home"
              icon={<Home size={16} />}
              onClick={handleGoHome}
            >
              返回首页
            </Button>,
            <Button 
              key="back"
              icon={<ArrowLeft size={16} />}
              onClick={handleGoBack}
            >
              返回上页
            </Button>
          ]}
        />
      </motion.div>
    </div>
  )
}

export default NotFound