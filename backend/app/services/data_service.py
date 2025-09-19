"""
数据服务 - 集成 akshare 获取基金数据
"""
import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from sqlalchemy.orm import Session
from ..models import Fund, FundNetValue
from ..core.database import get_db

logger = logging.getLogger(__name__)


class DataService:
    """数据服务类 - 负责从 akshare 获取和处理基金数据"""
    
    def __init__(self):
        self.cache_duration = 300  # 5分钟缓存
        self._fund_list_cache = None
        self._cache_time = None
    
    def search_funds(self, keyword: str, limit: int = 20) -> List[Dict]:
        """
        搜索基金
        
        Args:
            keyword: 搜索关键词（基金代码或名称）
            limit: 返回结果数量限制
            
        Returns:
            基金列表
        """
        try:
            # 获取公募基金列表
            fund_list = self._get_fund_list()
            
            if fund_list is None or fund_list.empty:
                return []
            
            # 模糊搜索
            results = []
            keyword_lower = keyword.lower()
            
            for _, fund in fund_list.iterrows():
                fund_code = str(fund.get('基金代码', ''))
                fund_name = str(fund.get('基金简称', ''))
                
                if (keyword_lower in fund_code.lower() or 
                    keyword_lower in fund_name.lower()):
                    
                    # 获取详细信息以补充基金经理和公司
                    detail_info = self.get_fund_info(fund_code)
                    manager = detail_info.get('manager', '') if detail_info else ''
                    company = detail_info.get('company', '') if detail_info else ''

                    results.append({
                        'id': fund_code,
                        'code': fund_code,
                        'name': fund_name,
                        'fund_type': fund.get('基金类型', ''),
                        'manager': manager,
                        'company': company
                    })
                    
                    if len(results) >= limit:
                        break
            
            return results
            
        except Exception as e:
            logger.error(f"搜索基金失败: {e}")
            return []
    
    def get_fund_info(self, fund_code: str) -> Optional[Dict]:
        """
        获取基金基本信息
        
        Args:
            fund_code: 基金代码
            
        Returns:
            基金信息字典
        """
        try:
            # 获取基金基本信息
            fund_info = ak.fund_individual_basic_info_xq(symbol=fund_code)
            
            if fund_info.empty:
                return None
            
            info = fund_info.iloc[0]
            
            return {
                'code': fund_code,
                'name': info.get('基金简称', ''),
                'type': info.get('基金类型', ''),
                'manager': info.get('基金经理', ''),
                'company': info.get('基金公司', ''),
                'establish_date': info.get('成立日期', ''),
                'scale': info.get('基金规模', 0)
            }
            
        except Exception as e:
            logger.error(f"获取基金信息失败 {fund_code}: {e}")
            return None
    
    def get_fund_net_value(self, fund_code: str, start_date: str = None, 
                          end_date: str = None) -> List[Dict]:
        """
        获取基金净值数据
        
        Args:
            fund_code: 基金代码
            start_date: 开始日期 (YYYY-MM-DD)
            end_date: 结束日期 (YYYY-MM-DD)
            
        Returns:
            净值数据列表
        """
        try:
            # 设置默认日期范围（最近一年）
            if not end_date:
                end_date = datetime.now().strftime('%Y%m%d')
            else:
                end_date = end_date.replace('-', '')
                
            if not start_date:
                start_date = (datetime.now() - timedelta(days=365)).strftime('%Y%m%d')
            else:
                start_date = start_date.replace('-', '')
            
            # 获取基金净值数据
            net_value_data = ak.fund_open_fund_info_em(
                fund=fund_code, 
                indicator="单位净值走势"
            )
            
            if net_value_data.empty:
                return []
            
            # 数据处理
            results = []
            for _, row in net_value_data.iterrows():
                date_str = row['净值日期'].strftime('%Y-%m-%d')
                
                # 过滤日期范围
                if start_date <= date_str.replace('-', '') <= end_date:
                    # 计算日收益率
                    daily_return = 0
                    if len(results) > 0:
                        prev_value = results[-1]['net_value']
                        current_value = float(row['单位净值'])
                        daily_return = (current_value - prev_value) / prev_value * 100
                    
                    results.append({
                        'date': date_str,
                        'net_value': float(row['单位净值']),
                        'accumulated_value': float(row.get('累计净值', row['单位净值'])),
                        'daily_return': round(daily_return, 4)
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"获取基金净值失败 {fund_code}: {e}")
            return []
    
    def get_fund_realtime_data(self, fund_code: str) -> Optional[Dict]:
        """
        获取基金实时数据
        
        Args:
            fund_code: 基金代码
            
        Returns:
            实时数据字典
        """
        try:
            # 获取实时净值
            realtime_data = ak.fund_open_fund_info_em(
                fund=fund_code, 
                indicator="实时估值"
            )
            
            if realtime_data.empty:
                return None
            
            latest = realtime_data.iloc[-1]
            
            return {
                'code': fund_code,
                'current_value': float(latest.get('估算净值', 0)),
                'change_percent': float(latest.get('估算增长率', 0)),
                'update_time': latest.get('估值时间', ''),
                'previous_value': float(latest.get('昨日净值', 0))
            }
            
        except Exception as e:
            logger.error(f"获取实时数据失败 {fund_code}: {e}")
            return None
    
    def _get_fund_list(self) -> pd.DataFrame:
        """
        获取基金列表（带缓存）
        
        Returns:
            基金列表 DataFrame
        """
        try:
            # 检查缓存
            if (self._fund_list_cache is not None and 
                self._cache_time is not None and 
                (datetime.now() - self._cache_time).seconds < self.cache_duration):
                return self._fund_list_cache
            
            # 获取公募基金列表
            fund_list = ak.fund_name_em()
            
            if not fund_list.empty:
                logger.info(f"成功获取基金列表，共 {len(fund_list)} 条记录")
                logger.info(f"基金列表列名: {fund_list.columns.tolist()}")
                logger.info(f"基金列表前5条数据: \\n{fund_list.head()}")

            # 更新缓存
            self._fund_list_cache = fund_list
            self._cache_time = datetime.now()
            
            return fund_list
            
        except Exception as e:
            logger.error(f"获取基金列表失败: {e}")
            return pd.DataFrame()
    
    def update_fund_data(self, db: Session, fund_code: str) -> bool:
        """
        更新基金数据到数据库
        
        Args:
            db: 数据库会话
            fund_code: 基金代码
            
        Returns:
            是否更新成功
        """
        try:
            # 获取或创建基金记录
            fund = db.query(Fund).filter(Fund.code == fund_code).first()
            
            fund_info = self.get_fund_info(fund_code)
            if not fund_info:
                return False

            if not fund:
                # 创建新基金记录
                fund = Fund(
                    code=fund_info['code'],
                    name=fund_info['name'],
                    fund_type=fund_info['type'],
                    manager=fund_info['manager'],
                    company=fund_info['company'],
                    establish_date=fund_info.get('establish_date'),
                    scale=fund_info.get('scale')
                )
                db.add(fund)
                db.commit()
                db.refresh(fund)
            else:
                # 更新已有基金信息
                fund.name = fund_info['name']
                fund.fund_type = fund_info['type']
                fund.manager = fund_info['manager']
                fund.company = fund_info['company']
                fund.establish_date = fund_info.get('establish_date')
                fund.scale = fund_info.get('scale')

            # 获取最新净值数据
            net_values = self.get_fund_net_value(fund_code)
            
            if not net_values:
                # 即使没有净值数据，也认为基础数据更新成功
                db.commit()
                return True
            
            # 获取数据库中最新的净值日期
            latest_db_date = db.query(FundNetValue.date).filter(
                FundNetValue.fund_id == fund.id
            ).order_by(FundNetValue.date.desc()).first()
            
            latest_date = latest_db_date[0] if latest_db_date else None
            
            # 插入新的净值数据
            new_records = 0
            for nv in net_values:
                nv_date = datetime.strptime(nv['date'], '%Y-%m-%d').date()
                
                # 只插入新数据
                if not latest_date or nv_date > latest_date:
                    net_value_record = FundNetValue(
                        fund_id=fund.id,
                        date=nv_date,
                        net_value=nv['net_value'],
                        accumulated_value=nv['accumulated_value'],
                        daily_return=nv['daily_return']
                    )
                    db.add(net_value_record)
                    new_records += 1
            
            # 如果有新记录，更新基金主表信息
            if new_records > 0:
                latest_nv = max(net_values, key=lambda x: x['date'])
                fund.current_nav = latest_nv['net_value']
                fund.accumulated_nav = latest_nv['accumulated_value']
                fund.daily_return = latest_nv['daily_return']
                fund.updated_at = datetime.now()

            db.commit()
            logger.info(f"更新基金 {fund_code} 数据，新增 {new_records} 条记录")
            
            return True
            
        except Exception as e:
            logger.error(f"更新基金数据失败 {fund_code}: {e}")
            db.rollback()
            return False


# 创建全局数据服务实例
data_service = DataService()