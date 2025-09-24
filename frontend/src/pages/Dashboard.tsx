import React from 'react'
import { Card, Row, Col, Typography, Space } from 'antd'
import { TrendingUp, BarChart3, Target, Zap, Compass, ShieldCheck } from 'lucide-react'

const { Title, Paragraph } = Typography

const Dashboard: React.FC = () => {
  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <Title level={1} className="page-title">
          FundAdvisor - 智能基金投资顾问
        </Title>
        <Paragraph className="page-description">
          集实时行情、量化策略、组合管理于一体的基金投资决策平台，为用户提供可解释、可执行的智能顾问服务
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space
              direction="vertical"
              size="large"
              align="start"
              className="feature-card-content"
            >
              <TrendingUp size={36} className="feature-icon" />
              <Title level={4} className="feature-card-title">
                实时数据监控
              </Title>
              <Paragraph className="feature-card-description">
                依托 AkShare 与多源行情通道，实时同步基金净值、估值与风险指标；系统自动识别异常波动并生成提醒，让策略与仓位始终跟随市场节奏。
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space
              direction="vertical"
              size="large"
              align="start"
              className="feature-card-content"
            >
              <BarChart3 size={36} className="feature-icon feature-icon-success" />
              <Title level={4} className="feature-card-title">
                智能策略工坊
              </Title>
              <Paragraph className="feature-card-description">
                内置移动均线交叉、动态定投、趋势跟踪等核心策略，支持参数自定义、历史回测与情景对比，帮助不同风险偏好的投资者构建专属组合。
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space
              direction="vertical"
              size="large"
              align="start"
              className="feature-card-content"
            >
              <Target size={36} className="feature-icon feature-icon-warning" />
              <Title level={4} className="feature-card-title">
                精准决策引擎
              </Title>
              <Paragraph className="feature-card-description">
                综合技术指标、基本面与资金面信号，输出买入、卖出与调仓建议，并附带胜率评估与风险提示，实现全流程决策闭环。
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="feature-card">
            <Space
              direction="vertical"
              size="large"
              align="start"
              className="feature-card-content"
            >
              <Zap size={36} className="feature-icon feature-icon-danger" />
              <Title level={4} className="feature-card-title">
                极致交互体验
              </Title>
              <Paragraph className="feature-card-description">
                深色模式优先的现代化界面结合快捷键、响应式布局与动画反馈，保证桌面端与移动端在高频操作下依旧清晰高效。
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24} md={12} lg={12}>
          <Card title="核心功能" className="dashboard-detail-card">
            <Space direction="vertical" size="large" className="dashboard-detail-list">
              <div className="dashboard-detail-item">
                <Title level={5}>基金搜索与深度洞察</Title>
                <Paragraph type="secondary">
                  支持多条件组合检索，结合晨星评级、历史波动率、规模等指标筛选目标基金；详情页同步展示基金经理履历与业绩拆解，帮助快速建立研究画像。
                </Paragraph>
              </div>
              <div className="dashboard-detail-item">
                <Title level={5}>智能策略分析</Title>
                <Paragraph type="secondary">
                  针对不同周期与风险偏好提供策略推荐，回测结果以收益、回撤、胜率等维度呈现，便于评估策略稳定性与适配度。
                </Paragraph>
              </div>
              <div className="dashboard-detail-item">
                <Title level={5}>持仓监控与调仓建议</Title>
                <Paragraph type="secondary">
                  结合净值波动与策略信号自动识别调仓窗口，生成盈亏归因、仓位健康度与风险提示，辅助管理投资组合的执行动作。
                </Paragraph>
              </div>
              <div className="dashboard-detail-item">
                <Title level={5}>可视化报告生成</Title>
                <Paragraph type="secondary">
                  通过交互式图表展示净值曲线、资金流向与策略信号标注，一键导出分享给团队或客户，强化沟通效率。
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={12}>
          <Card title="顾问服务亮点" className="dashboard-highlight-card">
            <Space direction="vertical" size="large" className="dashboard-highlight-list">
              <div className="dashboard-highlight-item">
                <Space align="start" size="middle">
                  <ShieldCheck size={28} className="highlight-icon highlight-icon-safety" />
                  <div>
                    <Title level={5}>风险防护机制</Title>
                    <Paragraph type="secondary">
                      多级预警与风控规则叠加，自动捕捉回撤、波动率与流动性风险，保障策略执行的安全边界。
                    </Paragraph>
                  </div>
                </Space>
              </div>
              <div className="dashboard-highlight-item">
                <Space align="start" size="middle">
                  <Compass size={28} className="highlight-icon highlight-icon-advice" />
                  <div>
                    <Title level={5}>个性化配置建议</Title>
                    <Paragraph type="secondary">
                      根据投资目标、资金周期与风险偏好动态生成资产配置建议，并支持随时调节策略权重快速迭代。
                    </Paragraph>
                  </div>
                </Space>
              </div>
              <div className="dashboard-highlight-item">
                <Space align="start" size="middle">
                  <Zap size={28} className="highlight-icon highlight-icon-efficiency" />
                  <div>
                    <Title level={5}>效率驱动的工作台</Title>
                    <Paragraph type="secondary">
                      常用操作一键直达，结合键盘快捷键与模板化操作流程，大幅缩短分析、沟通与执行周期。
                    </Paragraph>
                  </div>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="智能顾问使用指南" className="dashboard-guide-card">
            <ol className="dashboard-guide-steps">
              <li>
                <div className="guide-step-content">
                  <Title level={5}>建立个人投资画像</Title>
                  <Paragraph type="secondary">
                    输入资金规模、收益目标、风险承受能力等基础信息，系统即刻完成组合画像，为后续策略匹配提供依据。
                  </Paragraph>
                </div>
              </li>
              <li>
                <div className="guide-step-content">
                  <Title level={5}>挑选并验证策略</Title>
                  <Paragraph type="secondary">
                    通过策略工坊筛选候选方案，查看历史表现、风险指标与最优仓位建议，确认最契合的投资组合路径。
                  </Paragraph>
                </div>
              </li>
              <li>
                <div className="guide-step-content">
                  <Title level={5}>落地投资计划</Title>
                  <Paragraph type="secondary">
                    按照系统生成的建仓节奏执行，开启持仓跟踪与再平衡提醒，实现自动化的投后管理。
                  </Paragraph>
                </div>
              </li>
              <li>
                <div className="guide-step-content">
                  <Title level={5}>复盘并持续优化</Title>
                  <Paragraph type="secondary">
                    定期下载可视化报告，与团队或客户复盘策略表现；结合回测与实时数据持续优化资金配置。
                  </Paragraph>
                </div>
              </li>
            </ol>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
