import React from 'react'
import { Card, Row, Col, Typography, Space } from 'antd'
import { TrendingUp, BarChart3, Target, Zap } from 'lucide-react'

const { Title, Paragraph } = Typography

const Dashboard: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={1} className="page-title">
          FundAdvisor - 智能基金投资顾问
        </Title>
        <Paragraph className="page-description">
          专业的基金投资策略分析平台，提供智能投资建议和实时市场数据
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space direction="vertical" size="middle">
              <TrendingUp size={32} color="#1890ff" />
              <Title level={4}>实时数据</Title>
              <Paragraph>
                基于 akshare 的实时基金数据，确保投资决策基于最新市场信息
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space direction="vertical" size="middle">
              <BarChart3 size={32} color="#52c41a" />
              <Title level={4}>智能策略</Title>
              <Paragraph>
                三大核心投资策略：移动均线交叉、动态定投、趋势跟踪
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space direction="vertical" size="middle">
              <Target size={32} color="#faad14" />
              <Title level={4}>精准分析</Title>
              <Paragraph>
                多重技术指标综合分析，提供准确的买入、卖出、持有建议
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space direction="vertical" size="middle">
              <Zap size={32} color="#f5222d" />
              <Title level={4}>极致体验</Title>
              <Paragraph>
                深色模式优先，极简设计，流畅动效，对标顶级科技公司产品
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24} lg={16}>
          <Card title="项目架构" className="architecture-card">
            <div className="architecture-content">
              <Title level={5}>后端技术栈</Title>
              <ul>
                <li>FastAPI - 高性能 Python Web 框架</li>
                <li>SQLAlchemy - 强大的 ORM 框架</li>
                <li>PostgreSQL - 企业级关系数据库</li>
                <li>akshare - 专业金融数据接口</li>
                <li>智能策略引擎 - 自研投资策略算法</li>
              </ul>

              <Title level={5} style={{ marginTop: 24 }}>前端技术栈</Title>
              <ul>
                <li>React 18 + TypeScript - 现代化前端框架</li>
                <li>Ant Design - 企业级 UI 组件库</li>
                <li>Apache ECharts - 专业数据可视化</li>
                <li>Framer Motion - 流畅动画效果</li>
                <li>Zustand - 轻量级状态管理</li>
              </ul>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="核心功能" className="features-card">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={5}>基金搜索与关注</Title>
                <Paragraph type="secondary">
                  实时联想搜索，一键添加关注列表
                </Paragraph>
              </div>

              <div>
                <Title level={5}>智能策略分析</Title>
                <Paragraph type="secondary">
                  多策略综合分析，提供投资建议
                </Paragraph>
              </div>

              <div>
                <Title level={5}>持仓管理</Title>
                <Paragraph type="secondary">
                  实时盈亏计算，投资组合分析
                </Paragraph>
              </div>

              <div>
                <Title level={5}>数据可视化</Title>
                <Paragraph type="secondary">
                  交互式图表，策略信号标注
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="开发状态" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div className="status-item completed">
              <Title level={5}>✅ 已完成</Title>
              <ul>
                <li>项目架构设计</li>
                <li>后端 API 开发</li>
                <li>智能策略引擎</li>
                <li>数据源集成</li>
                <li>前端基础框架</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="status-item in-progress">
              <Title level={5}>🚧 进行中</Title>
              <ul>
                <li>前端组件开发</li>
                <li>数据可视化集成</li>
                <li>响应式设计</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="status-item pending">
              <Title level={5}>📋 待完成</Title>
              <ul>
                <li>数据库配置</li>
                <li>Docker 部署</li>
                <li>文档编写</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard