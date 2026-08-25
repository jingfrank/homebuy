import React, { useState, useEffect, useMemo } from 'react';
import type { Community } from '../types/community';
import { calculateCommunityAvgRentUnitPrice } from '../types/community';
import {
  computeBreakEven,
  DEFAULT_BREAKEVEN_PARAMS,
  DEPRECIATION_TIERS,
} from '../types/breakeven';
import type { BreakEvenParams, BreakEvenResult } from '../types/breakeven';
import { getStoredCommunities } from '../utils/communityStorage';

// ── helpers ──────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('zh-CN');
const pct = (n: number, d = 2) => `${(n * 100).toFixed(d)}%`;

export const BreakEvenSection: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  // 可调参数
  const [params, setParams] = useState<BreakEvenParams>(DEFAULT_BREAKEVEN_PARAMS);

  const updateParam = <K extends keyof BreakEvenParams>(key: K, value: BreakEvenParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }));

  // 每个小区的计算结果
  const results = useMemo(() => {
    return communities.map((comm) => {
      const avgRent = comm.rentSamples && comm.rentSamples.length > 0
        ? calculateCommunityAvgRentUnitPrice(comm.rentSamples)
        : (comm.avgRentUnitPricePerSqm ?? 0);
      const result = computeBreakEven(
        avgRent,
        comm.propertyFee ?? 0,
        comm.builtYear,
        comm.askingAvgUnitPriceYuan,
        comm.dealAvgUnitPriceYuan,
        params,
      );
      return { community: comm, result, avgRent };
    });
  }, [communities, params]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-muted)' }}>
        ⏳ 正在从数据库拉取最新小区数据...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── 顶部标题 ── */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderLeft: '5px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
              小区盈亏平衡价分析
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                数据更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchCommunities}
              title="重新从数据库加载最新小区数据"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.3)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '0.82rem',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              🔄 刷新数据
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.7 }}>
          持有成本 = 国债机会成本 + 房屋折旧 + 贷款成本；持有收益 = 净租金（扣空置与物业费）。
          <br />
          通胀环境下租金增长对冲部分成本 → <strong>盈亏平衡价 = 净年租金 ÷ (综合成本率 − 通胀率)</strong>
        </p>
      </div>

      {/* ── 参数面板 + 折旧表 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* 参数设置 */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ 核心参数
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <ParamSlider
              label="首付比例"
              value={params.downPaymentRatio * 100}
              min={10} max={50} step={5}
              format={(v) => `${v}%`}
              onChange={(v) => updateParam('downPaymentRatio', v / 100)}
            />
            <ParamSlider
              label="国债利率"
              value={params.bondRate * 100}
              min={1} max={4} step={0.1}
              format={(v) => `${v.toFixed(1)}%`}
              onChange={(v) => updateParam('bondRate', v / 100)}
            />
            <ParamSlider
              label="商贷利率"
              value={params.commercialRate * 100}
              min={2.5} max={5} step={0.05}
              format={(v) => `${v.toFixed(2)}%`}
              onChange={(v) => updateParam('commercialRate', v / 100)}
            />
            <ParamSlider
              label="公积金利率"
              value={params.providentRate * 100}
              min={2} max={4} step={0.05}
              format={(v) => `${v.toFixed(2)}%`}
              onChange={(v) => updateParam('providentRate', v / 100)}
            />
            <ParamSlider
              label="公积金额度"
              value={params.providentLimit / 10000}
              min={40} max={200} step={10}
              format={(v) => `${v}万`}
              onChange={(v) => updateParam('providentLimit', v * 10000)}
            />
            <ParamSlider
              label="通胀/租金增速"
              value={params.inflationRate * 100}
              min={0} max={5} step={0.1}
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
              label="参考面积"
              value={params.referenceArea}
              min={50} max={150} step={5}
              format={(v) => `${v}㎡`}
              onChange={(v) => updateParam('referenceArea', v)}
            />
          </div>
        </div>

        {/* 折旧率表 */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📐 楼龄折旧率表
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEPRECIATION_TIERS.map((tier) => (
              <div
                key={tier.range}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>{tier.range}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{tier.ratePct}</span>
              </div>
            ))}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', lineHeight: 1.5 }}>
              💡 折旧率按建成年份自动判定楼龄区间。线性折旧模型：房屋价值随年限递减。
            </div>
          </div>
        </div>
      </div>

      {/* ── 汇总对比表 ── */}
      {results.filter((r) => r.result).length > 0 && (
        <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
            📊 全小区盈亏平衡价一览
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={th}>小区</th>
                <th style={th}>楼龄</th>
                <th style={th}>折旧率</th>
                <th style={th}>盈亏平衡价</th>
                <th style={th}>挂牌均价</th>
                <th style={th}>成交均价</th>
                <th style={th}>成交溢价率</th>
                <th style={th}>判定</th>
              </tr>
            </thead>
            <tbody>
              {results.filter((r) => r.result).map(({ community, result }) => {
                const r = result!;
                return (
                  <tr key={community.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={td}><strong>{community.name}</strong></td>
                    <td style={td}>{r.buildingAge}年</td>
                    <td style={td}>{pct(r.depreciationRate)}</td>
                    <td style={{ ...td, fontWeight: 800, color: 'var(--primary)' }}>
                      {fmt(r.breakEvenPricePerSqm)} 元/㎡
                    </td>
                    <td style={td}>{community.askingAvgUnitPriceYuan ? `${fmt(community.askingAvgUnitPriceYuan)} 元/㎡` : '—'}</td>
                    <td style={td}>{community.dealAvgUnitPriceYuan ? `${fmt(community.dealAvgUnitPriceYuan)} 元/㎡` : '—'}</td>
                    <td style={{ ...td, fontWeight: 700, color: (r.dealPricePremiumPct ?? 0) > 10 ? 'var(--danger)' : (r.dealPricePremiumPct ?? 0) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {r.dealPricePremiumPct !== null ? `${r.dealPricePremiumPct > 0 ? '+' : ''}${r.dealPricePremiumPct}%` : '—'}
                    </td>
                    <td style={td}>
                      <span className={`badge ${r.verdict === 'profitable' ? 'badge-success' : r.verdict === 'marginal' ? 'badge-warning' : r.verdict === 'overpriced' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.72rem' }}>
                        {r.verdict === 'profitable' ? '✅ 可持有' : r.verdict === 'marginal' ? '🟡 临界' : r.verdict === 'overpriced' ? '🔴 溢价' : '— 数据不足'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 各小区详细卡片 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {results.map(({ community, result, avgRent }) => {
          if (!result) {
            return (
              <div key={community.id} className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>🏢 {community.name}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  ⚠️ 缺少租赁样本数据，无法计算盈亏平衡价。请先在「小区房源精选PK」中录入租房样本。
                </div>
              </div>
            );
          }
          return <BreakEvenCard key={community.id} community={community} result={result} avgRent={avgRent} params={params} />;
        })}
        {results.length === 0 && (
          <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            暂无小区数据，请先在「小区房源精选PK」中录入小区。
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  小区盈亏平衡详情卡片
// ═══════════════════════════════════════════════════════════

const BreakEvenCard: React.FC<{
  community: Community;
  result: BreakEvenResult;
  avgRent: number;
  params: BreakEvenParams;
}> = ({ community, result: r, avgRent, params }) => {
  const asking = community.askingAvgUnitPriceYuan ?? 0;
  const deal = community.dealAvgUnitPriceYuan ?? 0;
  const refPrice = deal || asking;
  const refLabel = deal ? '成交均价' : asking ? '挂牌均价' : '';

  // 可视化条比例
  const maxPrice = Math.max(r.breakEvenPricePerSqm, asking, deal) * 1.15;
  const barWidth = (price: number) => maxPrice > 0 ? `${(price / maxPrice) * 100}%` : '0%';

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '24px',
        borderLeft: `6px solid ${r.verdict === 'profitable' ? 'var(--success)' : r.verdict === 'marginal' ? 'var(--warning)' : r.verdict === 'overpriced' ? 'var(--danger)' : 'var(--border-color)'}`
      }}
    >
      {/* 小区标题 */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{community.name}</h3>
          <span className="badge badge-primary">{community.district} · {community.sector}</span>
          <span className="badge badge-secondary">{community.ringLocation || ''}</span>
        </div>
        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>🏗️ 建成 {community.builtYear} 年 (楼龄 {r.buildingAge}年)</span>
          <span>📐 折旧率 <strong style={{ color: 'var(--primary)' }}>{pct(r.depreciationRate)}</strong></span>
          <span>🏷️ 租赁单价 {avgRent} 元/㎡/月</span>
          <span>物业服务费 {community.propertyFee} 元/㎡/月</span>
        </div>
      </div>

      {/* ── 三价对比 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <PriceBox label="🎯 盈亏平衡价" value={r.breakEvenPricePerSqm} color="var(--primary)" highlight />
        {asking > 0 && <PriceBox label="📈 挂牌均价" value={asking} color="var(--text-muted)" />}
        {deal > 0 && <PriceBox label="🤝 成交均价" value={deal} color="var(--accent-cyan)" />}
      </div>

      {/* ── 可视化对比条 ── */}
      {refPrice > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            📊 价格对比可视化
          </div>
          <div style={{ position: 'relative', height: '36px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
            {/* 盈亏平衡价条 */}
            <div
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: barWidth(r.breakEvenPricePerSqm),
                background: 'linear-gradient(90deg, rgba(5, 150, 105, 0.3), rgba(5, 150, 105, 0.15))',
                borderRight: '3px solid var(--primary)',
                display: 'flex', alignItems: 'center', paddingLeft: '10px',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>盈亏平衡 {fmt(r.breakEvenPricePerSqm)}</span>
            </div>
            {/* 当前市场价标记 */}
            <div
              style={{
                position: 'absolute', left: barWidth(refPrice), top: 0, bottom: 0,
                width: '3px', background: r.verdict === 'overpriced' ? 'var(--danger)' : 'var(--warning)',
              }}
            >
              <span style={{
                position: 'absolute', top: '-2px', left: '6px', whiteSpace: 'nowrap',
                fontSize: '0.72rem', fontWeight: 700,
                color: r.verdict === 'overpriced' ? 'var(--danger)' : 'var(--warning)',
              }}>
                {refLabel} {fmt(refPrice)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 判定结论 ── */}
      <div style={{
        padding: '14px 18px', borderRadius: 'var(--radius-sm)',
        background: r.verdict === 'profitable' ? 'var(--success-bg)'
          : r.verdict === 'marginal' ? 'var(--warning-bg)'
          : r.verdict === 'overpriced' ? 'var(--danger-bg)'
          : '#f1f5f9',
        border: `1px solid ${r.verdict === 'profitable' ? 'rgba(5,150,105,0.25)'
          : r.verdict === 'marginal' ? 'rgba(217,119,6,0.25)'
          : r.verdict === 'overpriced' ? 'rgba(220,38,38,0.25)'
          : 'var(--border-color)'}`,
        marginBottom: '20px', fontSize: '0.925rem', fontWeight: 600,
      }}>
        {r.verdictText}
      </div>

      {/* ── 成本拆解 + 收益拆解 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* 成本端 */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
            💸 年化持有成本拆解
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <CostRow label="国债机会成本" detail={`国债${pct(params.bondRate)} × 首付${pct(params.downPaymentRatio)}`} rate={r.bondOpportunityCost} />
            <CostRow label="房屋折旧" detail={`楼龄${r.buildingAge}年 → ${pct(r.depreciationRate)}`} rate={r.depreciationRate} />
            <CostRow
              label={r.loanType === 'mixed' ? '组合贷成本' : '公积金贷成本'}
              detail={r.loanType === 'mixed'
                ? `加权${pct(r.weightedLoanRate)} × 贷款${pct(1 - params.downPaymentRatio)}`
                : `公积金${pct(params.providentRate)} × 贷款${pct(1 - params.downPaymentRatio)}`}
              rate={r.loanCostRate}
            />
            <CostRow label="通胀对冲（租金增长）" detail={`通胀率${pct(params.inflationRate)}`} rate={r.inflationHedge} negative />
            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>综合成本率</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{pct(r.totalCostRate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 收益端 */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
            🏠 年化持有收益
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <RevenueRow label="毛月租金" value={`${avgRent} 元/㎡/月`} />
            <RevenueRow label={`空置扣减 (${params.vacancyMonths}个月)`} value={`-${fmt(Math.round(avgRent * params.vacancyMonths))} 元/㎡/年`} negative />
            <RevenueRow label="物业费扣减" value={`-${fmt(Math.round((community.propertyFee ?? 0) * 12))} 元/㎡/年`} negative />
            <RevenueRow label="净月租金" value={`${r.netMonthlyRentPerSqm} 元/㎡/月`} highlight />
            <RevenueRow label="净年租金" value={`${fmt(r.netAnnualRentPerSqm)} 元/㎡/年`} highlight />
            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>盈亏平衡净租金收益率</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{pct(r.breakEvenNetRentalYield)}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                当前成交价净收益率：{community.dealAvgUnitPriceYuan ? pct(r.netAnnualRentPerSqm / community.dealAvgUnitPriceYuan) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 盈亏平衡价下的贷款结构 ── */}
      <div style={{
        marginTop: '18px', padding: '14px 18px', borderRadius: 'var(--radius-sm)',
        background: '#f8fafc', border: '1px solid var(--border-color)',
        fontSize: '0.825rem',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
          🏦 盈亏平衡价下的贷款结构（参考面积 {params.referenceArea}㎡）
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
          <span>盈亏平衡总价：<strong style={{ color: 'var(--primary)' }}>{r.breakEvenTotalPriceWuan} 万</strong></span>
          <span>首付({pct(params.downPaymentRatio)})：<strong>{r.downPaymentAmountWuan} 万</strong></span>
          <span>贷款总额：<strong>{r.totalLoanAmountWuan} 万</strong></span>
          {r.loanType === 'mixed' ? (
            <>
              <span>公积金：<strong style={{ color: 'var(--success)' }}>{r.providentLoanAmountWuan} 万</strong> ({pct(params.providentRate)})</span>
              <span>商贷：<strong style={{ color: 'var(--warning)' }}>{r.commercialLoanAmountWuan} 万</strong> ({pct(params.commercialRate)})</span>
            </>
          ) : (
            <span>全额公积金：<strong style={{ color: 'var(--success)' }}>{r.providentLoanAmountWuan} 万</strong> ({pct(params.providentRate)})</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  小组件
// ═══════════════════════════════════════════════════════════

const PriceBox: React.FC<{ label: string; value: number; color: string; highlight?: boolean }> = ({ label, value, color, highlight }) => (
  <div
    style={{
      padding: '14px 16px', borderRadius: 'var(--radius-sm)',
      background: highlight ? 'var(--primary-light)' : '#f8fafc',
      border: highlight ? '1px solid rgba(5,150,105,0.3)' : '1px solid var(--border-color)',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: highlight ? '1.3rem' : '1.1rem', fontWeight: 800, color }}>
      {fmt(value)} <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>元/㎡</span>
    </div>
  </div>
);

const CostRow: React.FC<{ label: string; detail: string; rate: number; negative?: boolean }> = ({ label, detail, rate, negative }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{label}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{detail}</div>
    </div>
    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: negative ? 'var(--success)' : 'var(--text-main)' }}>
      {negative ? '−' : ''}{pct(Math.abs(rate))}
    </span>
  </div>
);

const RevenueRow: React.FC<{ label: string; value: string; highlight?: boolean; negative?: boolean }> = ({ label, value, highlight, negative }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '0.875rem', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--text-main)' : 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: negative ? 'var(--danger)' : highlight ? 'var(--primary)' : 'var(--text-main)' }}>{value}</span>
  </div>
);

const ParamSlider: React.FC<{
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}> = ({ label, value, min, max, step, format, onChange }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{format(value)}</span>
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
  color: 'var(--text-muted)', fontSize: '0.825rem', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '10px 12px', color: 'var(--text-main)', fontSize: '0.825rem', whiteSpace: 'nowrap',
};
