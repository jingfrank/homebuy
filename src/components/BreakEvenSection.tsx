import React, { useState, useEffect, useMemo } from 'react';
import type { Community } from '../types/community';
import { calculateCommunityAvgRentUnitPrice } from '../types/community';
import {
  computeBreakEven,
  DEFAULT_BREAKEVEN_PARAMS,
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

// ── localStorage 持久化（与 AssessmentWizard / MortgageCalculator 同模式）────
const STORAGE_BREAKEVEN_PARAMS_KEY = 'homebuy_breakeven_params';
const STORAGE_PREMIUM_OVERRIDES_KEY = 'homebuy_breakeven_premium_overrides';

function getStoredParams(): BreakEvenParams {
  try {
    const raw = localStorage.getItem(STORAGE_BREAKEVEN_PARAMS_KEY);
    if (!raw) return DEFAULT_BREAKEVEN_PARAMS;
    return { ...DEFAULT_BREAKEVEN_PARAMS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BREAKEVEN_PARAMS;
  }
}

function getStoredPremiumOverrides(): Record<string, PremiumScoreParams> {
  try {
    const raw = localStorage.getItem(STORAGE_PREMIUM_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const BreakEvenSection: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rentOverrides, setRentOverrides] = useState<Record<string, number>>({});
  const [premiumOverrides, setPremiumOverrides] = useState<Record<string, PremiumScoreParams>>(() => getStoredPremiumOverrides());
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error' | ''>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

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

  // 可调宏观与贷款参数（从 localStorage 恢复，变更时自动存回）
  const [params, setParams] = useState<BreakEvenParams>(() => getStoredParams());

  const updateParam = <K extends keyof BreakEvenParams>(key: K, value: BreakEvenParams[K]) =>
    setParams((p) => {
      const next = { ...p, [key]: value };
      try { localStorage.setItem(STORAGE_BREAKEVEN_PARAMS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

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
      const next = {
        ...prev,
        [commId]: {
          ...current,
          [field]: value,
        },
      };
      try { localStorage.setItem(STORAGE_PREMIUM_OVERRIDES_KEY, JSON.stringify(next)); } catch {}
      return next;
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

  const handleToggleExpand = (commId: string, defaultVal: boolean) => {
    setExpandedIds((prev) => {
      const current = prev[commId] !== undefined ? prev[commId] : defaultVal;
      return { ...prev, [commId]: !current };
    });
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

  const isAllExpanded = results.length > 0 && results.every(({ community }, idx) => {
    return expandedIds[community.id] !== undefined ? expandedIds[community.id] : (idx === 0);
  });

  const handleToggleAll = () => {
    const nextState = !isAllExpanded;
    const newMap: Record<string, boolean> = {};
    results.forEach(({ community }) => {
      newMap[community.id] = nextState;
    });
    setExpandedIds(newMap);
  };

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
              label="公积金贷款上限"
              value={params.providentLimit / 10000}
              min={50} max={200} step={10}
              format={(v) => `${v}万`}
              onChange={(v) => updateParam('providentLimit', v * 10000)}
            />
            <ParamSlider
              label="预估通胀率 (费雪效应)"
              value={params.inflationRate * 100}
              min={0} max={4} step={0.1}
              format={(v) => `${v.toFixed(1)}%`}
              onChange={(v) => updateParam('inflationRate', v / 100)}
            />
            <ParamSlider
              label="年化空置期"
              value={params.vacancyMonths}
              min={0} max={3} step={0.5}
              format={(v) => `${v}个月`}
              onChange={(v) => updateParam('vacancyMonths', v)}
            />
            <ParamSlider
              label="参考测算面积"
              value={params.referenceArea}
              min={40} max={180} step={5}
              format={(v) => `${v}㎡`}
              onChange={(v) => updateParam('referenceArea', v)}
            />
          </div>

          {/* ── 公积金年冲子面板 ── */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                💰 公积金年冲（冲本金·不改年限）
              </h4>
              <button
                className={`btn ${params.yearOffsetEnabled ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 14px', fontSize: '0.78rem', minHeight: '32px' }}
                onClick={() => updateParam('yearOffsetEnabled', !params.yearOffsetEnabled)}
              >
                {params.yearOffsetEnabled ? '✅ 已启用' : '未启用'}
              </button>
            </div>
            {params.yearOffsetEnabled ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 125px), 1fr))', gap: '12px' }}>
                  <ParamSlider
                    label="公积金账户初始余额"
                    value={params.providentBalanceInitial / 10000}
                    min={0} max={50} step={1}
                    format={(v) => `${v}万`}
                    onChange={(v) => updateParam('providentBalanceInitial', v * 10000)}
                  />
                  <ParamSlider
                    label="公积金月缴存(双方)"
                    value={params.providentMonthlyDeposit}
                    min={0} max={8000} step={200}
                    format={(v) => `${v}元`}
                    onChange={(v) => updateParam('providentMonthlyDeposit', v)}
                  />
                  <ParamSlider
                    label="持有测算年限"
                    value={params.holdYears}
                    min={5} max={40} step={5}
                    format={(v) => `${v}年`}
                    onChange={(v) => updateParam('holdYears', v)}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px', lineHeight: 1.5 }}>
                  每年用公积金账户余额一次性冲抵贷款本金，期限不变月供递减。
                  组合贷按加权利率合并口径近似（上海实际年冲仅限公积金贷款部分）。
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                启用后按"每年冲一次本金、贷款年限不变"模拟，贷款成本率按持有期平均利息计，
                盈亏平衡价会上移。
              </div>
            )}
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.73rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            💡 首付机会成本与贷款利息均已按费雪效应扣除通胀率，反映<strong>实际持有成本</strong>；折旧率不受通胀影响。
          </div>
        </div>

        {/* 楼龄 × 区位系数 二维折旧矩阵 */}
        <div className="glass-card mobile-p-14" style={{ padding: '18px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📐 楼龄 × 区位系数 二维折旧矩阵
            </h3>
            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>已实装土地稀缺韧性</span>
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
            核心区土地价值占比达 70%+（抗衰极强，折旧打折）；远郊新城物理价值占比高，折旧磨损衰减快（折旧上浮）。
          </div>

          <div className="table-scroll-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid var(--border-color)' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>楼龄阶段 (基准)</th>
                  <th style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--primary)' }}>内环核心<br/><span style={{ fontSize: '0.68rem', fontWeight: 500 }}>打5.5折 (0.55x)</span></th>
                  <th style={{ padding: '6px 8px', fontWeight: 700 }}>中内环<br/><span style={{ fontSize: '0.68rem', fontWeight: 500 }}>打8折 (0.80x)</span></th>
                  <th style={{ padding: '6px 8px', fontWeight: 700, background: '#e2e8f0' }}>中外环标准<br/><span style={{ fontSize: '0.68rem', fontWeight: 500 }}>1.0x 基准</span></th>
                  <th style={{ padding: '6px 8px', fontWeight: 700 }}>近郊地铁<br/><span style={{ fontSize: '0.68rem', fontWeight: 500 }}>上浮20% (1.2x)</span></th>
                  <th style={{ padding: '6px 8px', fontWeight: 700, color: '#dc2626' }}>远郊新城<br/><span style={{ fontSize: '0.68rem', fontWeight: 500 }}>上浮45% (1.45x)</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { range: '0 ~ 5年 (次新)', base: 0.003 },
                  { range: '5 ~ 10年 (成熟)', base: 0.007 },
                  { range: '10 ~ 15年 (黄金)', base: 0.012 },
                  { range: '15 ~ 20年 (老牌)', base: 0.017 },
                  { range: '20 ~ 25年 (老龄)', base: 0.022 },
                  { range: '25 ~ 50年 (高龄)', base: 0.027 },
                ].map((row, rIdx) => (
                  <tr key={row.range} style={{ borderBottom: '1px solid var(--border-color)', background: rIdx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.range} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>({(row.base * 100).toFixed(1)}%)</span>
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--primary)', fontWeight: 700 }}>
                      {(row.base * 0.55 * 100).toFixed(2)}%
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                      {(row.base * 0.80 * 100).toFixed(2)}%
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, background: '#f1f5f9' }}>
                      {(row.base * 1.00 * 100).toFixed(2)}%
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                      {(row.base * 1.20 * 100).toFixed(2)}%
                    </td>
                    <td style={{ padding: '6px 8px', color: '#dc2626', fontWeight: 700 }}>
                      {(row.base * 1.45 * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
            📌 提示：在各小区的「五维打分器」中切换地段档位，系统会自动联动计算该小区的折旧率与合理溢价率。
          </div>
        </div>
      </div>

      {/* ── 各小区核心指标横向对比看板 ── */}
      {results.length > 0 && (
        <div className="glass-card mobile-p-14" style={{ padding: '18px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 全小区估值与砍价空间对比总览
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              左右滑动查看完整横向数据
            </span>
          </div>

          <div className="table-scroll-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#f8fafc' }}>
                  <th style={th}>小区名称</th>
                  <th style={th}>楼龄 / 租金单价</th>
                  <th style={th}>🛡️ 纯现金流底线价</th>
                  <th style={th}>🎛️ 五维合理溢价</th>
                  <th style={th}>🎯 合理建议目标价</th>
                  <th style={th}>🤝 当前市场价</th>
                  <th style={th}>✂️ 砍价空间 / 安全边际</th>
                  <th style={th}>判定建议</th>
                </tr>
              </thead>
              <tbody>
                {results.map(({ community, result: r, avgRent }) => {
                  if (!r) return null;
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

      {/* ── 各小区详细卡片列表 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              🏢 各小区盈亏平衡与五维打分模型 ({results.length} 个小区)
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              (支持独立折叠/展开各小区测算)
            </span>
          </div>

          {results.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleToggleAll}
                className="btn btn-secondary"
                style={{
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  minHeight: '32px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isAllExpanded ? '📁 全部折叠' : '📂 全部展开'}
              </button>
            </div>
          )}
        </div>

        {results.map(({ community, result, avgRent, premiumParams }, idx) => {
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
          const isExpanded = expandedIds[community.id] !== undefined ? expandedIds[community.id] : (idx === 0);
          return (
            <BreakEvenCard
              key={community.id}
              community={community}
              result={result}
              avgRent={avgRent}
              params={params}
              premiumParams={premiumParams}
              isExpanded={isExpanded}
              onToggleExpand={() => handleToggleExpand(community.id, idx === 0)}
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
//  小区盈亏平衡详情卡片 (含可折叠视图 + 五维合理溢价打分器)
// ═══════════════════════════════════════════════════════════

const BreakEvenCard: React.FC<{
  community: Community;
  result: BreakEvenResult;
  avgRent: number;
  params: BreakEvenParams;
  premiumParams: PremiumScoreParams;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateRent: (newRent: number) => void;
  onUpdatePremium: (field: keyof PremiumScoreParams, value: number) => void;
  onSaveRent: (newRent: number) => void;
  saveStatus?: string;
}> = ({
  community,
  result: r,
  avgRent,
  params,
  premiumParams,
  isExpanded,
  onToggleExpand,
  onUpdateRent,
  onUpdatePremium,
  onSaveRent,
  saveStatus,
}) => {
  const asking = community.askingAvgUnitPriceYuan ?? 0;
  const deal = community.dealAvgUnitPriceYuan ?? 0;
  const refPrice = deal || asking;
  const refLabel = deal ? '成交均价' : asking ? '挂牌均价' : '';

  // 可视化条比例
  const maxPrice = Math.max(r.targetFairPricePerSqm, r.breakEvenPricePerSqm, asking, deal) * 1.15;
  const barWidth = (price: number) => maxPrice > 0 ? `${(price / maxPrice) * 100}%` : '0%';

  const verdictBadge = (
    <span
      className={`badge ${
        r.actionVerdict === 'strong_buy' ? 'badge-success'
        : r.actionVerdict === 'fair_buy' ? 'badge-primary'
        : r.actionVerdict === 'overpriced' ? 'badge-warning'
        : 'badge-danger'
      }`}
      style={{ fontSize: '0.725rem', fontWeight: 700 }}
    >
      {r.actionVerdict === 'strong_buy' ? '🟢 超值买入'
        : r.actionVerdict === 'fair_buy' ? '🟡 合理博弈'
        : r.actionVerdict === 'overpriced' ? '🟠 偏高需砍'
        : '🔴 泡沫虚高'}
    </span>
  );

  return (
    <div
      className="glass-card animate-fade-in mobile-p-14"
      style={{
        padding: isExpanded ? '22px' : '16px 18px',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        transition: 'padding 0.15s ease',
      }}
    >
      {/* ── 头部信息 (Clickable Header Bar) ── */}
      <div
        style={{
          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
          paddingBottom: isExpanded ? '14px' : 0,
          marginBottom: isExpanded ? '16px' : 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div
            onClick={onToggleExpand}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer', flex: 1 }}
            title="点击展开/折叠该小区测算详情"
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{community.name}</h3>
            <span className="badge badge-primary">{community.district} · {community.sector}</span>
            <span className="badge badge-secondary">{community.ringLocation || '中外环'}</span>
            {verdictBadge}
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="btn btn-secondary"
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              borderRadius: '8px',
              minHeight: '34px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{isExpanded ? '收起详情 ▴' : '展开测算 ▾'}</span>
          </button>
        </div>

        {/* ── 折叠时的快速核心指标概览行 (Compact Summary Chips) ── */}
        {!isExpanded && (
          <div
            onClick={onToggleExpand}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
              gap: '8px',
              marginTop: '12px',
              cursor: 'pointer',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🛡️ 纯现金流底线价</div>
              <div className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {fmt(r.breakEvenPricePerSqm)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>元/㎡</span>
              </div>
            </div>

            <div style={{ background: 'var(--primary-light)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(5, 150, 105, 0.3)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>🎯 合理建议目标价</div>
              <div className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                {fmt(r.targetFairPricePerSqm)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>元/㎡</span>
              </div>
            </div>

            {refPrice > 0 && (
              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🤝 市场{refLabel}</div>
                <div className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {fmt(refPrice)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>元/㎡</span>
                </div>
              </div>
            )}

            {refPrice > 0 && (
              <div style={{
                background: r.bubbleGapPct > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${r.bubbleGapPct > 0 ? 'rgba(220,38,38,0.3)' : 'rgba(5,150,105,0.3)'}`,
              }}>
                <div style={{ fontSize: '0.7rem', color: r.bubbleGapPct > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                  {r.bubbleGapPct > 0 ? '✂️ 需砍价空间' : '🟢 安全边际'}
                </div>
                <div className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800, color: r.bubbleGapPct > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '2px' }}>
                  {r.bubbleGapPct > 0 ? `-${r.bubbleGapPct}%` : `+${Math.abs(r.bubbleGapPct)}%`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 展开时的副标题与测算租金调整条 ── */}
        {isExpanded && (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px', marginBottom: '10px' }}>
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
          </>
        )}
      </div>

      {/* ── 展开后的全部详情内容 ── */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* ── 🎯 五维客观合理溢价打分器 ── */}
          <div
            style={{
              background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
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
            <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
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
              fontSize: '0.875rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px',
              width: '100%',
              maxWidth: '100%',
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
                💸 年化持有成本拆解（实际利率）
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <CostRow
                  label="首付实际机会成本"
                  detail={`实际国债利率 ${pct(params.bondRate)}−${pct(params.inflationRate)}=${pct(r.realBondRate)} × 首付${pct(params.downPaymentRatio)}`}
                  rate={r.bondOpportunityCost}
                />
                <CostRow
                  label="房屋物理与区位折旧"
                  detail={`楼龄${r.buildingAge}年 (基准${pct(r.baseDepreciationRate)}) × ${r.locationDepreciationLabel} → 综合折旧${pct(r.depreciationRate)}`}
                  rate={r.depreciationRate}
                />
                <CostRow
                  label={r.loanType === 'mixed' ? '组合房贷实际利息成本' : '公积金贷款实际利息成本'}
                  detail={r.loanType === 'mixed'
                    ? `实际利率 ${pct(r.weightedLoanRate)}−${pct(params.inflationRate)}=${pct(r.realWeightedLoanRate)} × 贷款${pct(1 - params.downPaymentRatio)}`
                    : `实际利率 ${pct(params.providentRate)}−${pct(params.inflationRate)}=${pct(r.realBondRate)} × 贷款${pct(1 - params.downPaymentRatio)}`}
                  rate={r.loanCostRate}
                />
                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>综合实际持有成本率</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{pct(r.totalCostRate)}</span>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    通胀已分别从国债与贷款利率中扣除，折旧不受通胀影响
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
            padding: '12px 14px', borderRadius: 'var(--radius-sm)',
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

          {/* ── 公积金年冲模拟摘要 ── */}
          {r.yearOffset && (
            <div style={{
              marginTop: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.2)',
              fontSize: '0.825rem',
            }}>
              <div style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💰 公积金年冲模拟（持有 {params.holdYears} 年）
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '8px' }}>
                <YearOffsetStat label="首年月供" value={`${fmt(r.yearOffset.monthlyPaymentFirstYuan)} 元`} />
                <YearOffsetStat label={`${params.holdYears}年后月供`} value={`${fmt(r.yearOffset.monthlyPaymentEndYuan)} 元`} highlight />
                <YearOffsetStat label={`累计年冲本金`} value={`${fmt(r.yearOffset.totalOffsetYuan)} 元`} highlight />
                <YearOffsetStat label="累计利息(有年冲)" value={`${fmt(r.yearOffset.totalInterestYuan)} 元`} />
                <YearOffsetStat label="累计利息(无年冲)" value={`${fmt(r.yearOffset.totalNoOffsetInterestYuan)} 元`} />
                <YearOffsetStat label="利息节省" value={`${fmt(r.yearOffset.totalNoOffsetInterestYuan - r.yearOffset.totalInterestYuan)} 元`} highlight />
                {r.yearOffset.loanPayoffYear && (
                  <YearOffsetStat label="贷款还清年份" value={`第 ${r.yearOffset.loanPayoffYear} 年`} highlight />
                )}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                年冲每年用公积金余额冲抵本金、期限不变月供递减。
                实际贷款成本率节省 <strong style={{ color: 'var(--primary)' }}>{(r.yearOffsetDeltaReal * 100).toFixed(2)}%</strong>，
                盈亏平衡价较无年冲上移约 <strong style={{ color: 'var(--primary)' }}>
                  {fmt(Math.round(r.breakEvenPricePerSqm * r.yearOffsetDeltaReal / (r.totalCostRate || 0.001)))} 元/㎡
                </strong>。
              </div>
            </div>
          )}
        </div>
      )}
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

// 年冲模拟统计格
const YearOffsetStat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div style={{
    padding: '8px 10px', borderRadius: '6px',
    background: highlight ? 'rgba(5, 150, 105, 0.08)' : '#f8fafc',
    border: highlight ? '1px solid rgba(5,150,105,0.2)' : '1px solid var(--border-color)',
  }}>
    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: highlight ? 'var(--primary)' : 'var(--text-main)' }}>{value}</div>
  </div>
);
