import React, { useState } from 'react';
import { BuildingIcon, SparklesIcon } from './Icons';

interface ShanghaiSectorInfo {
  district: string; // 行政区
  sector: string; // 代表板块
  ringLocation: string; // 环线定位 (内环/中内环/中外环/外环外)
  avgPriceRange: string; // 均价区间 (元/㎡)
  inventoryCycleMonths: number; // 当地去化周期（月）
  bargainingSpace: '极高 (10-15%+)' | '高 (8-12%)' | '中 (5-8%)' | '低 (<5%)'; // 砍价空间
  buyerType: string; // 主力购房人群
  timingAdvice: string; // 择时策略建议
}

const shanghaiSectors: ShanghaiSectorInfo[] = [
  // 1. 核心内环与黄浦江沿岸
  {
    district: '黄浦区',
    sector: '新天地 / 老西门 / 外滩',
    ringLocation: '内环内',
    avgPriceRange: '11.5万 - 16.5万/㎡',
    inventoryCycleMonths: 14,
    bargainingSpace: '中 (5-8%)',
    buyerType: '高净值终极改善 / 资产配置',
    timingAdvice: '顶豪次新盘抗跌性极强；老破小溢价挤净，老西门/老城厢老破小需谨慎。',
  },
  {
    district: '浦东新区',
    sector: '陆家嘴 / 源深 / 联洋 / 碧云',
    ringLocation: '内环内 ~ 中内环',
    avgPriceRange: '9.5万 - 14.0万/㎡',
    inventoryCycleMonths: 16,
    bargainingSpace: '高 (8-12%)',
    buyerType: '金融/高管改善、尚德/洋径学区房',
    timingAdvice: '联洋/源深前期泡沫挤水充分，优质次新三房呈极佳议价抄底窗口期。',
  },
  {
    district: '徐汇区',
    sector: '徐汇滨江 / 衡复 / 万体馆',
    ringLocation: '内环内 ~ 中环',
    avgPriceRange: '9.0万 - 15.5万/㎡',
    inventoryCycleMonths: 15,
    bargainingSpace: '中 (5-8%)',
    buyerType: '高端品质改善 / 名校学区强需',
    timingAdvice: '徐汇滨江次新房保值度高；万体馆/南站板块次新二手房议价空间大。',
  },

  // 2. 中环与近郊强改善热点
  {
    district: '浦东新区',
    sector: '张江 / 前滩 / 三林 / 世博',
    ringLocation: '中外环',
    avgPriceRange: '7.2万 - 11.5万/㎡',
    inventoryCycleMonths: 18,
    bargainingSpace: '高 (8-12%)',
    buyerType: '张江码农新贵 / 华二前滩学区 / 改善',
    timingAdvice: '前滩与张江二手房挤水分明显，倒挂消除，适合刚需/改善冷静淘笋盘。',
  },
  {
    district: '静安区',
    sector: '大宁 / 不夜城 / 曹家渡',
    ringLocation: '内环 ~ 中环',
    avgPriceRange: '8.5万 - 11.5万/㎡',
    inventoryCycleMonths: 17,
    bargainingSpace: '中 (5-8%)',
    buyerType: '市中心品质改善 / 市西市北学区',
    timingAdvice: '大宁金茂府等次新房流动性好，老旧小区可严苛砍价。',
  },
  {
    district: '长宁区',
    sector: '古北 / 中山公园 / 天山',
    ringLocation: '内环 ~ 中内环',
    avgPriceRange: '8.0万 - 12.0万/㎡',
    inventoryCycleMonths: 18,
    bargainingSpace: '高 (8-12%)',
    buyerType: '涉外租赏高 / 虹桥枢纽高管',
    timingAdvice: '古北一期二期次新房租售比佳，“以租养贷”转化性价比极高。',
  },

  // 3. 刚需与大虹桥/五大新城性价比板块
  {
    district: '闵行区',
    sector: '莘庄 / 七宝 / 梅陇 / 虹桥前湾',
    ringLocation: '中外环 ~ 外环外',
    avgPriceRange: '5.5万 - 8.8万/㎡',
    inventoryCycleMonths: 20,
    bargainingSpace: '高 (8-12%)',
    buyerType: '漕河泾/外企首套刚需与二套改善',
    timingAdvice: '典型买方市场，莘庄/七宝轨交次新房源充沛，按 8.8 折尝试挂牌砍价。',
  },
  {
    district: '青浦区',
    sector: '徐泾 / 赵巷 / 朱家角',
    ringLocation: '外环外 (大虹桥核心)',
    avgPriceRange: '4.2万 - 6.2万/㎡',
    inventoryCycleMonths: 22,
    bargainingSpace: '极高 (10-15%+)',
    buyerType: '大虹桥商务区溢出刚需 / 首次置业',
    timingAdvice: '徐泾新房次新房库存充沛，二手房议价空间大，切勿急于加价。',
  },
  {
    district: '松江区',
    sector: '泗泾 / 九亭 / 松江新城',
    ringLocation: '外环外',
    avgPriceRange: '3.5万 - 5.2万/㎡',
    inventoryCycleMonths: 21,
    bargainingSpace: '极高 (10-15%+)',
    buyerType: '9号线沿线首套刚需 (预算300-450万)',
    timingAdvice: '泗泾/九亭近轨交次新房性价比高，适合首套刚需上车淘低价捡漏房。',
  },
  {
    district: '嘉定区',
    sector: '南翔 / 嘉定新城 / 安亭',
    ringLocation: '外环外',
    avgPriceRange: '3.2万 - 4.8万/㎡',
    inventoryCycleMonths: 23,
    bargainingSpace: '极高 (10-15%+)',
    buyerType: '11号线汽车城 / 北上海刚需',
    timingAdvice: '买方市场深入，南翔印象城周边次新房议价让利空间很大。',
  },
  {
    district: '宝山区',
    sector: '杨行 / 顾村 / 上大板块',
    ringLocation: '外环外',
    avgPriceRange: '3.5万 - 4.8万/㎡',
    inventoryCycleMonths: 24,
    bargainingSpace: '极高 (10-15%+)',
    buyerType: '1号/7号线刚需 (预算250-400万)',
    timingAdvice: '去化周期超 2 年，二手房卖家心态普遍松动，可按 8 折严苛议价。',
  },
  {
    district: '浦东新区',
    sector: '川沙 / 周浦 / 康桥 / 临港',
    ringLocation: '外环外 ~ 远郊',
    avgPriceRange: '2.0万(临港) - 5.8万(周康)/㎡',
    inventoryCycleMonths: 26,
    bargainingSpace: '极高 (10-15%+)',
    buyerType: '迪士尼/张江溢出/临港人才特区',
    timingAdvice: '周康次新自住适宜挑选；临港侧重人才房与自住，纯投资需谨慎。',
  },
];

export const MarketMatrixSection: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('全上海');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const districts = ['全上海', '浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区', '闵行区', '青浦区', '松江区', '嘉定区', '宝山区'];

  const filteredSectors = shanghaiSectors.filter((item) => {
    const matchDistrict = selectedDistrict === '全上海' || item.district === selectedDistrict;
    const matchSearch =
      item.district.includes(searchTerm) ||
      item.sector.includes(searchTerm) ||
      item.ringLocation.includes(searchTerm) ||
      item.buyerType.includes(searchTerm);
    return matchDistrict && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Shanghai Live Policy Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderLeft: '5px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <BuildingIcon color="var(--primary)" size={24} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            🏛️ 上海楼市最新房贷利率与信贷政策指引 (2026年最新)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>上海首套房贷利率基准</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
              2.65% ~ 3.05%
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              (LPR 3.10% 减 45~55个基点，历史新低)
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>最低首付款比例限制</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
              首套 15% / 二套 20%
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              (外环外二套首付降至 20%)
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>非沪籍购房社保门槛</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              外环外 1年 / 外环内 3年
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              (持人才引进/积分享受沪籍待遇)
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>公积金最高贷款额度</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
              家庭最高 160 万元
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              (多子女家庭最高可上浮20%至192万元)
            </div>
          </div>
        </div>
      </div>

      {/* Sector Filter & Search Controls */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SparklesIcon color="var(--primary)" size={20} />
            上海各区重点板块行情与择时策略地图
          </h3>

          <div style={{ maxWidth: '320px', width: '100%' }}>
            <input
              type="text"
              placeholder="搜索板块/轨交/学区 (如: 联洋, 泗泾)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* District Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {districts.map((dis) => {
            const isSelected = selectedDistrict === dis;
            return (
              <button
                key={dis}
                onClick={() => setSelectedDistrict(dis)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--primary)' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {dis}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shanghai Sector Detailed Table */}
      <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 10px', minWidth: '80px' }}>行政区</th>
              <th style={{ padding: '14px 10px', minWidth: '160px' }}>代表板块</th>
              <th style={{ padding: '14px 10px', minWidth: '100px' }}>环线定位</th>
              <th style={{ padding: '14px 10px', minWidth: '140px' }}>均价参考</th>
              <th style={{ padding: '14px 10px', minWidth: '100px' }}>去化周期</th>
              <th style={{ padding: '14px 10px', minWidth: '130px' }}>砍价议价空间</th>
              <th style={{ padding: '14px 10px', minWidth: '160px' }}>主力客群定位</th>
              <th style={{ padding: '14px 10px', minWidth: '240px' }}>择时与买房策略建议</th>
            </tr>
          </thead>
          <tbody>
            {filteredSectors.map((sector, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(241, 245, 249, 0.4)',
                }}
              >
                <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {sector.district}
                </td>
                <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--primary)' }}>
                  {sector.sector}
                </td>
                <td style={{ padding: '14px 10px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    {sector.ringLocation}
                  </span>
                </td>
                <td style={{ padding: '14px 10px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {sector.avgPriceRange}
                </td>
                <td style={{ padding: '14px 10px', color: sector.inventoryCycleMonths >= 20 ? 'var(--warning)' : 'var(--text-main)' }}>
                  {sector.inventoryCycleMonths} 个月
                </td>
                <td style={{ padding: '14px 10px' }}>
                  <span
                    className={`badge ${
                      sector.bargainingSpace.includes('极高') || sector.bargainingSpace.includes('高')
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {sector.bargainingSpace}
                  </span>
                </td>
                <td style={{ padding: '14px 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {sector.buyerType}
                </td>
                <td style={{ padding: '14px 10px', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {sector.timingAdvice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
