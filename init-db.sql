-- 初始化 FundAdvisor 数据库结构及示例数据

-- 创建应用账号（若不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fundadvisor') THEN
        CREATE ROLE fundadvisor WITH LOGIN PASSWORD 'fundadvisor123';
    END IF;
END
$$;

-- 授权应用账号访问当前数据库
GRANT CONNECT ON DATABASE fundadvisor TO fundadvisor;
GRANT USAGE ON SCHEMA public TO fundadvisor;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fundadvisor;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fundadvisor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fundadvisor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fundadvisor;

-- 切换到目标数据库
\c fundadvisor;

-- 确保所需扩展存在
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- =============================
-- 基础表结构
-- =============================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    fund_type VARCHAR(50),
    manager VARCHAR(100),
    company VARCHAR(200),
    establish_date DATE,
    scale DECIMAL(15, 2),
    current_nav DECIMAL(10, 4),
    accumulated_nav DECIMAL(10, 4),
    daily_return DECIMAL(8, 4),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fund_nav_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    nav_date DATE NOT NULL,
    unit_nav DECIMAL(10, 4),
    accumulated_nav DECIMAL(10, 4),
    daily_return DECIMAL(8, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fund_id, nav_date)
);

CREATE TABLE IF NOT EXISTS user_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fund_id)
);

CREATE TABLE IF NOT EXISTS user_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    shares DECIMAL(15, 4) NOT NULL DEFAULT 0,
    avg_cost DECIMAL(10, 4),
    total_cost DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fund_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
    shares DECIMAL(15, 4) NOT NULL,
    price DECIMAL(10, 4) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(10, 2) DEFAULT 0,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investment_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strategy_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID REFERENCES investment_strategies(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
    confidence DECIMAL(5, 2),
    reason TEXT,
    signal_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- 索引与触发器
-- =============================

CREATE INDEX IF NOT EXISTS idx_funds_code ON funds(code);
CREATE INDEX IF NOT EXISTS idx_funds_name ON funds USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fund_nav_history_fund_date ON fund_nav_history(fund_id, nav_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_holdings_user ON user_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_signals_strategy_date ON strategy_signals(strategy_id, signal_date DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_holdings_updated_at BEFORE UPDATE ON user_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_strategies_updated_at BEFORE UPDATE ON investment_strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================
-- 示例数据
-- =============================

INSERT INTO funds (code, name, fund_type, manager, company, establish_date, description) VALUES
('000001', '华夏成长混合', '混合型', '张三', '华夏基金管理有限公司', '2001-12-18', '本基金主要投资于具有良好成长性的上市公司股票'),
('110022', '易方达消费行业股票', '股票型', '李四', '易方达基金管理有限公司', '2010-08-20', '本基金主要投资于消费行业相关的优质上市公司'),
('161725', '招商中证白酒指数', '指数型', '王五', '招商基金管理有限公司', '2015-05-27', '本基金跟踪中证白酒指数，投资于白酒行业相关股票'),
('519066', '汇添富蓝筹稳健混合', '混合型', '赵六', '汇添富基金管理股份有限公司', '2007-03-12', '本基金主要投资于蓝筹股，追求稳健的长期回报')
ON CONFLICT (code) DO NOTHING;

UPDATE funds
SET
    manager = COALESCE(NULLIF(manager, ''), '未知基金经理'),
    company = COALESCE(NULLIF(company, ''), '未知基金公司'),
    description = COALESCE(NULLIF(description, ''), '暂无描述信息');

INSERT INTO fund_nav_history (fund_id, nav_date, unit_nav, accumulated_nav, daily_return)
SELECT 
    f.id,
    CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 30),
    round((1.0000 + (random() * 0.5))::numeric, 4),
    round((1.0000 + (random() * 0.8))::numeric, 4),
    round(((random() - 0.5) * 0.05)::numeric, 4)
FROM funds f
ON CONFLICT (fund_id, nav_date) DO NOTHING;
