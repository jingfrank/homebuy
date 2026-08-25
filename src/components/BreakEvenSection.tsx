import React, { useState, useEffect, useMemo } from 'react';
import type { Community } from '../types/community';
import { calculateCommunityAvgRentUnitPrice } from '../types/community';
import {
  computeBreakEven,
  DEFAULT_BREAKEVEN_PARAMS,
  DEPRECIATION_TIERS,
  getDefaultPremiumParams,
  LOCATION_OPTIONS,
  QUALITY_OPTIONS,
  RESOURCE_OPTIONS,
  LIQUIDITY_OPTIONS,
  UTILITY_OPTIONS,
} from '../types/breakeven';
import type { BreakEvenParams, BreakEvenResult, PremiumScoreParams } from '../types/breakeven';
import { getStoredCommunities, updateCommunity } from '../utils/communityStorage';

// ── helpers ──────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('zh-CN');
const pct = (n: number, d = 2) => `${(n * 100).toFixed(d)}%`;

export const BreakEvenSection: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rentOverrides, setRentOverrides] = useState<Record<string, number>>({});
  const [premiumOverrides, setPremiumOverrides] = useState<Record<string, PremiumScoreParams>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});

  const fetchCommunities = () => {
    setLoading(true);
    getStoredCommunities()
      .then((data) => {
        setCommunities(data);
        setLastUpdated(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // 每次组件挂载（即每次切换到此 Tab）时自动拉取最新数据
  useEffect(() => {
    fetchCommunities();
  }, []);

  // 可调宏观与贷款参数
  const [params, setParams] = useState<BreakEvenParams>(DEFAULT_BREAKEVEN_PARAMS);

  const updateParam = <K extends keyof BreakEvenParams>(key: K, value: BreakEvenParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }));

  const handleUpdateCommunityRent = (commId: string, rent: number) => {
    setRentOverrides((prev) => ({ ...prev, [commId]: rent }));
  };

  const handleUpdatePremiumParam = (
    commId: string,
    field: keyof PremiumScoreParams,
    value: number
  ) => {
    setPremiumOverrides((prev) => {
      const comm = communities.find((c) => c.id === commId);
      const current = prev[commId] || getDefaultPremiumParams(comm);
      return {
        ...prev,
        [commId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveRentToCommunity = async (commId: string, rent: number) => {
    const targetComm = communities.find((c) => c.id === commId);
    if (!targetComm) return;

    try {
      setSaveStatus((prev) => ({ ...prev, [commId]: 'saving' }));
      const updated: Community = {
        ...targetComm,
        avgRentUnitPricePerSqm: rent,
      };
      await updateCommunity(updated);
      setCommunities((prev) => prev.map((c) => (c.id === commId ? updated : c)));
      setSaveStatus((prev) => ({ ...prev, [commId]: 'saved' }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [commId]: '' }));
      }, 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus((prev) => ({ ...prev, [commId]: 'error' }));
    }
  };

  // 每个小区的计算结果（含五维合理溢价与目标建议价）
  const results = useMemo(() => {
    return communities.map((comm) => {
      const dbAvgRent = (comm.rentSamples && comm.rentSamples.length > 0)
        ? calculateCommunityAvgRentUnitPrice(comm.rentSamples)
        : (comm.avgRentUnitPricePerSqm || 50);
      const effectiveAvgRent = rentOverrides[comm.id] !== undefined
        ? rentOverrides[comm.id]
        : dbAvgRent;

      const effectivePremium = premiumOverrides[comm.id] || getDefaultPremiumParams(comm);

      const result = computeBreakEven(
        effectiveAvgRent,
        comm.propertyFee ?? 0,
        comm.builtYear,
        comm.askingAvgUnitPriceYuan,
        comm.dealAvgUnitPriceYuan,
        params,
        effectivePremium,
      );
      return { community: comm, result, avgRent: effectiveAvgRent, premiumParams: effectivePremium };
    });
  }, [communities, params, rentOverrides, premiumOverrides]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-muted)' }}>
        ⏳ 正在从数据库拉取最新小区数据...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* ── 顶部标题 ── */}
      <div
        className="glass-card mobile-p-14"
        style={{
          padding: '22px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderLeft: '5px solid var(--primary)',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎯</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              小区盈亏平衡价与五维合理估值分析
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchCommunities}
              title="重新从数据库加载最新小区数据"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.3)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              🔄 刷新数据
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          <strong>🛡️ 纯现金流底线价</strong> = 租金仅凭自身收益覆盖首付机会成本、贷款利息与楼龄折旧的极限安全底线。<br />
          <strong>🎯 合理买入目标价</strong> = 底线价 × (1 + 五维硬指标溢价率)。综合考量地段、品质、学区轨交、户型流动性与自住通勤，精准锁定实战砍价底牌。
        </p>
      </div>

      {/* ── 核心参数面板 + 折旧表 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {/* 参数设置 */}
        <div className="glass-card mobile-p-14" style={{ padding: '18px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ 核心财务与贷款参数
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 125px), 1fr))', gap: '12px', width: '100%', minWidth: 0 }}>
            <ParamSlider
              label="首付比例"
              value={params.downPaymentRatio * 100}
              min={15} max={70} step={5}
              format={(v) => `${v}%`}
              onChange={(v) => updateParam('downPaymentRatio', v / 100)}
            />
            <ParamSlider
              label="国债无风险利率"
              value={params.bondRate * 100}
              min={1.5} max={3.5} step={0.1}
              format={(v) => `${v.toFixed(1)}%`}
              onChange={(v) => updateParam('bondRate', v / 100)}
            />
            <ParamSlider
              label="商业贷款利率"
              value={params.commercialRate * 100}
              min={2.5} max={4.5} step={0.05}
              format={(v) => `${v.toFixed(2)}%`}
              onChange={(v) => updateParam('commercialRate', v / 100)}
            />
            <ParamSlider
              label="公积金贷款利率"
              value={params.providentRate * 100}
              min={2} max={4} step={0.05}
              format={(v) => `${v.toFixed(2)}%`}
              onChange={(v) => updateParam('providentRate', v / 100)}
            />
            <ParamSlider
              label="公积金贷款额度"
              value={params.providentLimit / 10000}
              min={40} max={200} step={10}
              format={(v) => `${v}万`}
              onChange={(v) => updateParam('providentLimit', v * 10000)}
            />
            <ParamSlider
              label="通胀/租金增长率"
              value={params.inflationRate * 100}
              min={0} max={4} step={0.1}
              format={(v) => `${v.toFixed(1)}%`}
              onChange={(v) => updateParam('inflationRate', v / 100)}
            />
            <ParamSlider
              label="年空置月数"
              value={params.vacancyMonths}
              min={0} max={2} step={0.5}
              format={(v) => `${v}个月`}
              onChange={(v) => updateParam('vacancyMonths', v)}
            />
            <ParamSlider
              label="参考房源面积"
              value={params.referenceArea}
              min={50} max={150} step={5}
              format={(v) => `${v}㎡`}
              onChange={(v) => updateParam('referenceArea', v)}
            />
          </div>
        </div>

        {/* 楼龄折旧率表 */}
        <div className="glass-card mobile-p-14" style={{ padding: '18px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📐 楼龄物理折旧率表
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEPRECIATION_TIERS.map((tier) => (
              <div
                key={tier.range}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>{tier.range}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{tier.ratePct} / 年</span>
              </div>
            ))}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', lineHeight: 1.4 }}>
              💡 随楼龄增加，管道老化与外立面折旧加快，模型自动匹配对应折旧费率。
            </div>
          </div>
        </div>
      </div>

      {/* ── 全小区盈亏平衡与合理目标价一览汇总表 ── */}
      {results.filter((r) => r.result).length > 0 && (
        <div className="glass-card mobile-p-14" style={{ padding: '18px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              📊 全小区底线价 vs 合理买入目标价对比
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              💡 砍价空间 = 当前市场价 与 🎯 合理入手目标价之差
            </span>
          </div>

          <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', minWidth: '760px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#f8fafc' }}>
                  <th style={th}>小区名称</th>
                  <th style={th}>楼龄 / 测算租金</th>
                  <th style={th}>🛡️ 纯现金流底线价</th>
                  <th style={th}>📈 5维合理溢价率</th>
                  <th style={th}>🎯 合理买入目标价</th>
                  <th style={th}>当前市场价</th>
                  <th style={th}>✂️ 实战砍价谈判空间</th>
                  <th style={th}>决策行动建议</th>
                </tr>
              </thead>
              <tbody>
                {results.filter((r) => r.result).map(({ community, result, avgRent }) => {
                  const r = result!;
                  const refPrice = community.dealAvgUnitPriceYuan || community.askingAvgUnitPriceYuan || 0;
                  const isOverpriced = r.bubbleGapPct > 0;

                  return (
                    <tr key={community.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={td}>
                        <strong>{community.name}</strong>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{community.district} · {community.sector}</div>
                      </td>
                      <td style={td}>
                        <div>{r.buildingAge}年 (折旧{pct(r.depreciationRate)})</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                          {avgRent} 元/㎡/月
                        </div>
                      </td>
                      <td style={{ ...td, fontWeight: 700, color: 'var(--text-muted)' }}>
                        {fmt(r.breakEvenPricePerSqm)} 元/㎡
                      </td>
                      <td style={{ ...td, fontWeight: 800, color: r.totalReasonablePremiumRate >= 0.1 ? 'var(--primary)' : 'var(--text-main)' }}>
                        {r.totalReasonablePremiumRate >= 0 ? '+' : ''}{(r.totalReasonablePremiumRate * 100).toFixed(1)}%
                      </td>
                      <td style={{ ...td, fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                        {fmt(r.targetFairPricePerSqm)} 元/㎡
                      </td>
                      <td style={td}>
                        {community.dealAvgUnitPriceYuan ? (
                          <div><strong>{fmt(community.dealAvgUnitPriceYuan)}</strong> 元/㎡ <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>(成交)</span></div>
                        ) : community.askingAvgUnitPriceYuan ? (
                          <div>{fmt(community.askingAvgUnitPriceYuan)} 元/㎡ <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>(挂牌)</span></div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ ...td, fontWeight: 700, color: isOverpriced ? 'var(--danger)' : 'var(--success)' }}>
                        {refPrice > 0 ? (
                          isOverpriced ? (
                            <div>
                              需砍 -{fmt(r.bubbleGapPerSqm)} 元/㎡
                              <div style={{ fontSize: '0.725rem', color: 'var(--danger)' }}>
                                (砍价幅度 {r.bubbleGapPct}%)
                              </div>
                            </div>
                          ) : (
                            <div>
                              🟢 低于合理价 {Math.abs(r.bubbleGapPct)}%
                              <div style={{ fontSize: '0.725rem', color: 'var(--success)' }}>
                                (安全边际 {Math.abs(r.bubbleGapPerSqm).toLocaleString()}元/㎡)
                              </div>
                            </div>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={td}>
                        <span
                          className={`badge ${
                            r.actionVerdict === 'strong_buy' ? 'badge-success'
                            : r.actionVerdict === 'fair_buy' ? 'badge-primary'
                            : r.actionVerdict === 'overpriced' ? 'badge-warning'
                            : 'badge-danger'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {r.actionVerdict === 'strong_buy' ? '🟢 超值买入'
                            : r.actionVerdict === 'fair_buy' ? '🟡 合理博弈'
                            : r.actionVerdict === 'overpriced' ? '🟠 偏高需砍'
                            : '🔴 泡沫虚高'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 各小区详细卡片 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {results.map(({ community, result, avgRent, premiumParams }) => {
          if (!result) {
            return (
              <div key={community.id} className="glass-card mobile-p-14" style={{ padding: '20px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>🏢 {community.name}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  ⚠️ 缺少租赁样本数据，无法计算盈亏平衡价。请先在「房源PK」中录入租房样本或基准租金。
                </div>
              </div>
            );
          }
          return (
            <BreakEvenCard
              key={community.id}
              community={community}
              result={result}
              avgRent={avgRent}
              params={params}
              premiumParams={premiumParams}
              onUpdateRent={(newRent) => handleUpdateCommunityRent(community.id, newRent)}
              onUpdatePremium={(field, value) => handleUpdatePremiumParam(community.id, field, value)}
              onSaveRent={(newRent) => handleSaveRentToCommunity(community.id, newRent)}
              saveStatus={saveStatus[community.id]}
            />
          );
        })}
        {results.length === 0 && (
          <div className="glass-card mobile-p-14" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            暂无小区数据，请先在「房源PK」中录入意向小区。
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  小区盈亏平衡详情卡片 (含五维合理溢价打分器)
// ═══════════════════════════════════════════════════════════

const BreakEvenCard: React.FC<{
  community: Community;
  result: BreakEvenResult;
  avgRent: number;
  params: BreakEvenParams;
  premiumParams: PremiumScoreParams;
  onUpdateRent: (newRent: number) => void;
  onUpdatePremium: (field: keyof PremiumScoreParams, value: number) => void;
  onSaveRent: (newRent: number) => void;
  saveStatus?: string;
}> = ({ community, result: r, avgRent, params, premiumParams, onUpdateRent, onUpdatePremium, onSaveRent, saveStatus }) => {
  const asking = community.askingAvgUnitPriceYuan ?? 0;
  const deal = community.dealAvgUnitPriceYuan ?? 0;
  const refPrice = deal || asking;
  const refLabel = deal ? '成交均价' : asking ? '挂牌均价' : '';

  // 可视化条比例
  const maxPrice = Math.max(r.targetFairPricePerSqm, r.breakEvenPricePerSqm, asking, deal) * 1.15;
  const barWidth = (price: number) => maxPrice > 0 ? `${(price / maxPrice) * 100}%` : '0%';

  return (
    <div
      className="glass-card animate-fade-in mobile-p-14"
      style={{
        padding: '22px',
        borderLeft: `6px solid ${
          r.actionVerdict === 'strong_buy' ? 'var(--success)'
          : r.actionVerdict === 'fair_buy' ? 'var(--primary)'
          : r.actionVerdict === 'overpriced' ? 'var(--warning)'
          : 'var(--danger)'
        }`,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* ── 头部信息 ── */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{community.name}</h3>
          <span className="badge badge-primary">{community.district} · {community.sector}</span>
          <span className="badge badge-secondary">{community.ringLocation || '中外环'}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span>🏗️ 建成 {community.builtYear} 年 (楼龄 {r.buildingAge}年)</span>
          <span>📐 物理折旧率 <strong style={{ color: 'var(--primary)' }}>{pct(r.depreciationRate)} / 年</strong></span>
          <span>物业费 {community.propertyFee} 元/㎡/月</span>
        </div>

        {/* Interactive Rental Unit Price Adjustment Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary)' }}>
              🏷️ 测算租赁单价:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <button
                type="button"
                onClick={() => onUpdateRent(Math.max(1, Math.round((avgRent - 1) * 10) / 10))}
                style={{ padding: '2px 7px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                title="-1元/㎡/月"
              >
                -1
              </button>
              <input
                type="number"
                step="0.5"
                value={avgRent}
                onChange={(e) => onUpdateRent(parseFloat(e.target.value) || 0)}
                style={{
                  width: '68px',
                  padding: '2px 4px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  textAlign: 'center',
                  borderRadius: '6px',
                  border: '1.5px solid var(--primary)',
                  background: '#fff',
                }}
              />
              <button
                type="button"
                onClick={() => onUpdateRent(Math.round((avgRent + 1) * 10) / 10)}
                style={{ padding: '2px 7px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                title="+1元/㎡/月"
              >
                +1
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>元/㎡/月</span>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {saveStatus === 'saving' && <span>⏳ 保存中...</span>}
            {saveStatus === 'saved' && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✅ 已保存！</span>}
            {saveStatus === 'error' && <span style={{ color: 'var(--danger)' }}>❌ 保存失败</span>}

            <button
              type="button"
              onClick={() => onSaveRent(avgRent)}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="将此单价持久化保存为该小区的基准租金"
            >
              💾 保存基准租金
            </button>
          </div>
        </div>
      </div>

      {/* ── 🎯 五维客观合理溢价打分器 ── */}
      <div
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1rem' }}>🎛️</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)' }}>
              五维客观溢价打分器（点击切换档位测算）
            </span>
          </div>
          <div
            style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '0.8rem',
              fontWeight: 800,
            }}
          >
            综合合理溢价加成：{r.totalReasonablePremiumRate >= 0 ? '+' : ''}{(r.totalReasonablePremiumRate * 100).toFixed(1)}%
          </div>
        </div>

        {/* 5 Row Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', minWidth: 0 }}>
          <PremiumRow
            title="1. 地段与城市能级"
            options={LOCATION_OPTIONS}
            selectedValue={premiumParams.locationTierPct}
            onSelect={(val) => onUpdatePremium('locationTierPct', val)}
          />
          <PremiumRow
            title="2. 房屋性质与品质"
            options={QUALITY_OPTIONS}
            selectedValue={premiumParams.qualityTierPct}
            onSelect={(val) => onUpdatePremium('qualityTierPct', val)}
          />
          <PremiumRow
            title="3. 学区与公共配套"
            options={RESOURCE_OPTIONS}
            selectedValue={premiumParams.resourceTierPct}
            onSelect={(val) => onUpdatePremium('resourceTierPct', val)}
          />
          <PremiumRow
            title="4. 户型通透与流动性"
            options={LIQUIDITY_OPTIONS}
            selectedValue={premiumParams.liquidityTierPct}
            onSelect={(val) => onUpdatePremium('liquidityTierPct', val)}
          />
          <PremiumRow
            title="5. 家庭自住通勤效用"
            options={UTILITY_OPTIONS}
            selectedValue={premiumParams.utilityTierPct}
            onSelect={(val) => onUpdatePremium('utilityTierPct', val)}
          />
        </div>
      </div>

      {/* ── 核心三级价格锚点与实战底牌 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', marginBottom: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <PriceBox
          label="🛡️ 纯现金流底线价"
          value={r.breakEvenPricePerSqm}
          subLabel={`总价约 ${r.breakEvenTotalPriceWuan}万`}
          color="var(--text-muted)"
        />
        <PriceBox
          label="🎯 合理买入建议价"
          value={r.targetFairPricePerSqm}
          subLabel={`总价约 ${r.targetFairTotalPriceWuan}万 (底线+${(r.totalReasonablePremiumRate * 100).toFixed(1)}%)`}
          color="var(--primary)"
          highlight
        />
        {refPrice > 0 && (
          <PriceBox
            label={`🤝 当前市场${refLabel}`}
            value={refPrice}
            subLabel={deal > 0 ? '贝壳真实成交均价' : '房东挂牌均价'}
            color="var(--accent-cyan)"
          />
        )}
        {refPrice > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: r.bubbleGapPct > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
              border: `1px solid ${r.bubbleGapPct > 0 ? 'rgba(220,38,38,0.3)' : 'rgba(5,150,105,0.3)'}`,
              textAlign: 'center',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: r.bubbleGapPct > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700, marginBottom: '2px' }}>
              {r.bubbleGapPct > 0 ? '✂️ 建议砍价空间' : '🟢 相对合理价安全边际'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: r.bubbleGapPct > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {r.bubbleGapPct > 0 ? `-${fmt(r.bubbleGapPerSqm)}` : `+${fmt(Math.abs(r.bubbleGapPerSqm))}`}{' '}
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>元/㎡</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: r.bubbleGapPct > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '2px', fontWeight: 600 }}>
              {r.bubbleGapPct > 0 ? `需砍价 ${r.bubbleGapPct}%` : `低于合理估值 ${Math.abs(r.bubbleGapPct)}%`}
            </div>
          </div>
        )}
      </div>

      {/* ── 三梯级定价可视化对比条 ── */}
      {refPrice > 0 && (
        <div style={{ marginBottom: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
            <span>📊 三梯级价格对比条（底线价 $\to$ 目标价 $\to$ 市场价）</span>
            <span style={{ color: r.bubbleGapPct > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {r.bubbleGapPct > 0 ? `市场溢价偏高 +${r.bubbleGapPct}%` : `当前价格极度安全 -${Math.abs(r.bubbleGapPct)}%`}
            </span>
          </div>

          <div style={{ position: 'relative', height: '38px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0 }}>
            {/* 底线价条 */}
            <div
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: barWidth(r.breakEvenPricePerSqm),
                background: 'rgba(100, 116, 139, 0.15)',
                borderRight: '2px dashed #94a3b8',
                display: 'flex', alignItems: 'center', paddingLeft: '6px',
                zIndex: 1,
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>底线 {fmt(r.breakEvenPricePerSqm)}</span>
            </div>

            {/* 合理买入目标建议价条 */}
            <div
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: barWidth(r.targetFairPricePerSqm),
                background: 'linear-gradient(90deg, rgba(5, 150, 105, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)',
                borderRight: '3px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px',
                zIndex: 2,
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                🎯 目标 {fmt(r.targetFairPricePerSqm)}
              </span>
            </div>

            {/* 真实市场价标记 */}
            <div
              style={{
                position: 'absolute', left: barWidth(refPrice), top: 0, bottom: 0,
                width: '3px', background: r.bubbleGapPct > 15 ? 'var(--danger)' : r.bubbleGapPct > 0 ? 'var(--warning)' : 'var(--success)',
                zIndex: 3,
              }}
            >
              <span style={{
                position: 'absolute', top: '-1px', left: '4px', whiteSpace: 'nowrap',
                fontSize: '0.7rem', fontWeight: 800,
                color: r.bubbleGapPct > 15 ? 'var(--danger)' : r.bubbleGapPct > 0 ? '#b45309' : 'var(--success)',
                background: '#ffffff', padding: '1px 5px', borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid var(--border-color)',
              }}>
                {refLabel} {fmt(refPrice)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 判定与砍价实战结论 ── */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: r.actionVerdict === 'strong_buy' ? 'var(--success-bg)'
            : r.actionVerdict === 'fair_buy' ? 'var(--primary-light)'
            : r.actionVerdict === 'overpriced' ? 'var(--warning-bg)'
            : 'var(--danger-bg)',
          border: `1px solid ${
            r.actionVerdict === 'strong_buy' ? 'rgba(5,150,105,0.25)'
            : r.actionVerdict === 'fair_buy' ? 'rgba(5,150,105,0.3)'
            : r.actionVerdict === 'overpriced' ? 'rgba(217,119,6,0.25)'
            : 'rgba(220,38,38,0.25)'
          }`,
          marginBottom: '16px',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <span>{r.actionVerdictText}</span>
        {refPrice > 0 && r.bubbleGapPct > 0 && (
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            谈判底牌：首轮直接以 <strong>{fmt(r.targetFairPricePerSqm)} 元/㎡</strong>（约 {r.targetFairTotalPriceWuan}万）作为心理底价
          </span>
        )}
      </div>

      {/* ── 成本拆解 + 收益拆解 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {/* 成本端 */}
        <div style={{ minWidth: 0 }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
            💸 年化持有成本拆解（扣除通胀）
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <CostRow label="首付机会成本 (国债收益)" detail={`国债${pct(params.bondRate)} × 首付${pct(params.downPaymentRatio)}`} rate={r.bondOpportunityCost} />
            <CostRow label="房屋物理折旧与老化" detail={`楼龄${r.buildingAge}年 → 费率${pct(r.depreciationRate)}`} rate={r.depreciationRate} />
            <CostRow
              label={r.loanType === 'mixed' ? '组合房贷利息成本' : '公积金贷款利息成本'}
              detail={r.loanType === 'mixed'
                ? `加权利率${pct(r.weightedLoanRate)} × 贷款${pct(1 - params.downPaymentRatio)}`
                : `公积金${pct(params.providentRate)} × 贷款${pct(1 - params.downPaymentRatio)}`}
              rate={r.loanCostRate}
            />
            <CostRow label="长期通胀租金增长对冲" detail={`长期通胀预期${pct(params.inflationRate)}`} rate={r.inflationHedge} negative />
            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>净综合持有成本率</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{pct(r.totalCostRate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 收益端 */}
        <div style={{ minWidth: 0 }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
            🏠 租金收益与真实租售比
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <RevenueRow label="毛月租金单价" value={`${avgRent} 元/㎡/月`} />
            <RevenueRow label={`空置扣减 (${params.vacancyMonths}个月/年)`} value={`-${fmt(Math.round(avgRent * params.vacancyMonths))} 元/㎡/年`} negative />
            <RevenueRow label="物业管理费支出" value={`-${fmt(Math.round((community.propertyFee ?? 0) * 12))} 元/㎡/年`} negative />
            <RevenueRow label="净月租金收益" value={`${r.netMonthlyRentPerSqm} 元/㎡/月`} highlight />
            <RevenueRow label="净年租金收益" value={`${fmt(r.netAnnualRentPerSqm)} 元/㎡/年`} highlight />
            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>目标价下净租金回报率</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {pct(r.netAnnualRentPerSqm / r.targetFairPricePerSqm)}
                </span>
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                当前市场价净回报率：{community.dealAvgUnitPriceYuan ? pct(r.netAnnualRentPerSqm / community.dealAvgUnitPriceYuan) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 目标建议价下的首付与月供结构 ── */}
      <div style={{
        marginTop: '16px', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
        background: '#f8fafc', border: '1px solid var(--border-color)',
        fontSize: '0.8rem',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
          🏦 目标建议价下的购房资金结构（参考面积 {params.referenceArea}㎡）
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
          <span>建议买入总价：<strong style={{ color: 'var(--primary)' }}>{r.targetFairTotalPriceWuan} 万</strong></span>
          <span>首付({pct(params.downPaymentRatio)})：<strong>{Math.round(r.targetFairTotalPriceWuan * params.downPaymentRatio * 100) / 100} 万</strong></span>
          <span>贷款总额：<strong>{Math.round(r.targetFairTotalPriceWuan * (1 - params.downPaymentRatio) * 100) / 100} 万</strong></span>
          <span>公积金顶格：<strong style={{ color: 'var(--success)' }}>{Math.min(params.providentLimit / 10000, Math.round(r.targetFairTotalPriceWuan * (1 - params.downPaymentRatio)))} 万</strong></span>
          {Math.round(r.targetFairTotalPriceWuan * (1 - params.downPaymentRatio)) > params.providentLimit / 10000 && (
            <span>商业贷款：<strong style={{ color: 'var(--warning)' }}>{Math.round((r.targetFairTotalPriceWuan * (1 - params.downPaymentRatio) - params.providentLimit / 10000) * 100) / 100} 万</strong></span>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  五维打分单行组件
// ═══════════════════════════════════════════════════════════

const PremiumRow: React.FC<{
  title: string;
  options: { id: string; label: string; subLabel?: string; ratePct: number; rateLabel: string }[];
  selectedValue: number;
  onSelect: (value: number) => void;
}> = ({ title, options, selectedValue, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', minWidth: 0 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
        {options.map((opt) => {
          const isSelected = Math.abs(opt.ratePct - selectedValue) < 0.001;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.ratePct)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                background: isSelected ? 'var(--primary-light)' : '#ffffff',
                color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.15s ease',
                maxWidth: '100%',
                wordBreak: 'break-word',
              }}
            >
              <span>{opt.label}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: opt.ratePct > 0 ? (isSelected ? 'var(--primary)' : '#059669') : opt.ratePct < 0 ? '#dc2626' : 'var(--text-muted)',
                }}
              >
                {opt.rateLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  小组件
// ═══════════════════════════════════════════════════════════

const PriceBox: React.FC<{
  label: string;
  value: number;
  subLabel?: string;
  color: string;
  highlight?: boolean;
}> = ({ label, value, subLabel, color, highlight }) => (
  <div
    style={{
      padding: '12px 10px',
      borderRadius: 'var(--radius-sm)',
      background: highlight ? 'var(--primary-light)' : '#f8fafc',
      border: highlight ? '1.5px solid rgba(5,150,105,0.4)' : '1px solid var(--border-color)',
      textAlign: 'center',
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
    }}
  >
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: highlight ? '1.2rem' : '1.05rem', fontWeight: 800, color }}>
      {fmt(value)} <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>元/㎡</span>
    </div>
    {subLabel && (
      <div style={{ fontSize: '0.68rem', color: highlight ? 'var(--primary)' : 'var(--text-dim)', marginTop: '2px' }}>
        {subLabel}
      </div>
    )}
  </div>
);

const CostRow: React.FC<{ label: string; detail: string; rate: number; negative?: boolean }> = ({ label, detail, rate, negative }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', overflowWrap: 'break-word' }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{detail}</div>
    </div>
    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: negative ? 'var(--success)' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
      {negative ? '−' : ''}{pct(Math.abs(rate))}
    </span>
  </div>
);

const RevenueRow: React.FC<{ label: string; value: string; highlight?: boolean; negative?: boolean }> = ({ label, value, highlight, negative }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '0.825rem', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--text-main)' : 'var(--text-muted)', overflowWrap: 'break-word' }}>{label}</span>
    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: negative ? 'var(--danger)' : highlight ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

const ParamSlider: React.FC<{
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}> = ({ label, value, min, max, step, format, onChange }) => (
  <div style={{ minWidth: 0, width: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px', gap: '4px' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600, overflowWrap: 'break-word' }}>{label}</span>
      <span style={{ fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{format(value)}</span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%' }}
    />
  </div>
);

// table cell styles
const th: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontWeight: 700,
  color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '10px 12px', color: 'var(--text-main)', fontSize: '0.8rem', whiteSpace: 'nowrap',
};
