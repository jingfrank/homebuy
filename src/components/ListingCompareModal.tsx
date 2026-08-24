import React, { useState, useEffect } from 'react';
import type { Community, HouseListing } from '../types/community';
import { computeListingMetrics } from '../types/community';

interface ListingCompareModalProps {
  selectedListings: HouseListing[];
  communities: Community[];
  onClose: () => void;
}

export const ListingCompareModal: React.FC<ListingCompareModalProps> = ({
  selectedListings,
  communities,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'matrix'>('card');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!selectedListings || selectedListings.length === 0) return null;

  const communityMap = new Map(communities.map((c) => [c.id, c]));

  // Calculate metrics for each selected listing
  const items = selectedListings.map((listing) => {
    const comm = communityMap.get(listing.communityId);
    const metrics = computeListingMetrics(listing, comm);
    return {
      listing,
      comm,
      metrics,
    };
  });

  // Calculate best metrics across selected listings
  const maxLiquidityScore = Math.max(...items.map((i) => i.metrics.liquidityScore));
  const maxNetYieldPct = Math.max(...items.map((i) => i.metrics.netAnnualRentalYieldPct));
  const maxPracticalRatio = Math.max(...items.map((i) => i.metrics.practicalRatioPct));
  const minTotalPrice = Math.min(...items.map((i) => i.listing.totalPrice));

  return (
    <div
      className="modal-overlay-mobile"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card animate-fade-in modal-card-mobile modal-scroll-body"
        style={{
          maxWidth: '1200px',
          width: '100%',
          maxHeight: '94vh',
          padding: '24px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-drawer)',
          position: 'relative',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
                aria-hidden="true"
              >
                ⚖️
              </div>
              <h2 id="compare-modal-title" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                多房源智能 PK 对比决策看板
              </h2>
              <span className="badge badge-primary tabular-nums">
                已选 {items.length} 套房源
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              深度对比财务净收益率、安全砍价入手点、变现硬通货指数与得房率品质。
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View Mode Toggle */}
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                onClick={() => setViewMode('card')}
                className="btn"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.8rem',
                  fontWeight: viewMode === 'card' ? 700 : 500,
                  background: viewMode === 'card' ? '#ffffff' : 'transparent',
                  color: viewMode === 'card' ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '8px',
                  boxShadow: viewMode === 'card' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  minHeight: '30px',
                }}
              >
                📊 决策卡片
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className="btn"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.8rem',
                  fontWeight: viewMode === 'matrix' ? 700 : 500,
                  background: viewMode === 'matrix' ? '#ffffff' : 'transparent',
                  color: viewMode === 'matrix' ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '8px',
                  boxShadow: viewMode === 'matrix' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  minHeight: '30px',
                }}
              >
                📑 详细矩阵
              </button>
            </div>

            <button
              className="btn btn-secondary"
              onClick={onClose}
              aria-label="关闭对比看板"
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                minHeight: '34px',
              }}
            >
              ✕ 关闭对比
            </button>
          </div>
        </div>

        {/* =========================================================================
            VIEW 1: CARD PK VIEW (Default, Visual, Side-by-Side Cards)
           ========================================================================= */}
        {viewMode === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Quick Verdict Highlight Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${items.length}, minmax(280px, 1fr))`,
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
              className="no-scrollbar"
            >
              {items.map(({ listing, comm, metrics }) => {
                const isBestYield = metrics.netAnnualRentalYieldPct === maxNetYieldPct;
                const isBestLiquidity = metrics.liquidityScore === maxLiquidityScore;
                const isLowestPrice = listing.totalPrice === minTotalPrice;
                const isBestPractical = metrics.practicalRatioPct === maxPracticalRatio;

                return (
                  <div
                    key={listing.id}
                    className="glass-card"
                    style={{
                      padding: '16px',
                      background: isBestYield || isBestLiquidity ? 'linear-gradient(180deg, rgba(5, 150, 105, 0.05) 0%, #ffffff 100%)' : '#ffffff',
                      border: isBestYield ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Header */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                          {comm?.district} · {comm?.sector}
                        </span>
                        <span className="tabular-nums" style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                          {listing.totalPrice} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>万元</span>
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '4px' }}>
                        {comm?.name} · {listing.unitNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {listing.layout} | {listing.buildingArea}㎡ (套内{listing.insideArea}㎡) | {listing.floorInfo}
                      </div>
                    </div>

                    {/* Quick Badges Highlights */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {isBestYield && (
                        <span className="badge badge-success" style={{ fontSize: '0.725rem' }}>
                          🏆 租售比最高 ({metrics.netAnnualRentalYieldPct}%)
                        </span>
                      )}
                      {isBestLiquidity && (
                        <span className="badge badge-warning" style={{ fontSize: '0.725rem' }}>
                          ⚡ 变现硬通货 ({metrics.liquidityScore}分)
                        </span>
                      )}
                      {isLowestPrice && (
                        <span className="badge badge-primary" style={{ fontSize: '0.725rem' }}>
                          💰 总门槛最低
                        </span>
                      )}
                      {isBestPractical && (
                        <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.725rem' }}>
                          📐 得房率最高 ({metrics.practicalRatioPct}%)
                        </span>
                      )}
                    </div>

                    {/* Floorplan Preview */}
                    <div
                      style={{
                        width: '100%',
                        height: '140px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {listing.floorplanUrl ? (
                        <img
                          src={listing.floorplanUrl}
                          alt={`${comm?.name || ''} ${listing.layout} 户型图`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          loading="lazy"
                        />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>未上传户型图</span>
                      )}
                    </div>

                    {/* Core Financial Metrics Breakdown */}
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '12px',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>挂牌单价</span>
                        <span className="tabular-nums" style={{ fontWeight: 700 }}>
                          {Math.round((listing.totalPrice * 10000) / listing.buildingArea).toLocaleString()} 元/㎡
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>预期月租 / 月净收益</span>
                        <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {listing.expectedMonthlyRent} / {metrics.netMonthlyRentYuan} 元/月
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>月供对冲率 (30年)</span>
                        <span className="tabular-nums" style={{ fontWeight: 700 }}>
                          {metrics.mortgageCoveragePct}% (租金抵月供)
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>建议安全砍价值</span>
                        <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--danger)' }}>
                          {metrics.rationalSafePriceWuan} 万元
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}> (砍{metrics.riskDiscountWuan}万)</span>
                        </span>
                      </div>
                    </div>

                    {/* Risk & Quality Factors */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.775rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong>小区配套：</strong>{comm?.metroInfoText || '无轨交信息'}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong>车位与物业：</strong>
                        {listing.hasParkingSpace ? '✅ 含产权车位' : '❌ 无产权车位'} | 车位比 {comm?.parkingRatio || '1:1.0'}
                      </div>
                      {metrics.riskDiscountTags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {metrics.riskDiscountTags.map((t, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.7rem',
                                padding: '1px 6px',
                                background: 'var(--danger-bg)',
                                color: 'var(--danger)',
                                borderRadius: '4px',
                                border: '1px solid rgba(220, 38, 38, 0.2)',
                              }}
                            >
                              ⚠️ {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: FULL MATRIX TABLE (Detailed Comparative Spec)
           ========================================================================= */}
        {viewMode === 'matrix' && (
          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#f8fafc' }}>
                  <th style={{ padding: '14px', width: '160px', color: 'var(--text-muted)', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2 }}>
                    对比维度
                  </th>
                  {items.map(({ listing, comm }) => (
                    <th key={listing.id} style={{ padding: '14px', minWidth: '220px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                        {comm?.name}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginTop: '2px' }}>
                        {listing.unitNumber} ({listing.layout})
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1. 价格与财务 */}
                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                  <td colSpan={items.length + 1} style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    💰 核心财务与性价比指标
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)', position: 'sticky', left: 0, background: '#ffffff' }}>
                    挂牌总价 / 单价
                  </td>
                  {items.map(({ listing }) => (
                    <td key={listing.id} className="tabular-nums" style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {listing.totalPrice} 万元
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {Math.round((listing.totalPrice * 10000) / listing.buildingArea).toLocaleString()} 元/㎡
                      </div>
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(5, 150, 105, 0.04)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary)', position: 'sticky', left: 0, background: 'rgba(240, 253, 244, 0.95)' }}>
                    📈 真实年化净租金收益率
                  </td>
                  {items.map(({ listing, metrics }) => (
                    <td key={listing.id} className="tabular-nums" style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {metrics.netAnnualRentalYieldPct}% / 年
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        净收 {metrics.netMonthlyRentYuan} 元/月 (回本 {metrics.netPaybackYears} 年)
                      </div>
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--danger)', position: 'sticky', left: 0, background: '#ffffff' }}>
                    🛡️ 理性安全入手参考价
                  </td>
                  {items.map(({ listing, metrics }) => (
                    <td key={listing.id} className="tabular-nums" style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--danger)' }}>
                        {metrics.rationalSafePriceWuan} 万元
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        建议砍价让利 {metrics.totalRiskDiscountPct}% (-{metrics.riskDiscountWuan}万)
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 2. 空间与居住舒适度 */}
                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                  <td colSpan={items.length + 1} style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    🏢 户型空间与居住品质
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)', position: 'sticky', left: 0, background: '#ffffff' }}>
                    建筑面积 / 得房率
                  </td>
                  {items.map(({ listing, metrics }) => (
                    <td key={listing.id} className="tabular-nums" style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700 }}>
                        {listing.buildingArea}㎡ (套内{listing.insideArea}㎡)
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                        得房率: {metrics.practicalRatioPct}%
                      </div>
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)', position: 'sticky', left: 0, background: '#ffffff' }}>
                    容积率与密度
                  </td>
                  {items.map(({ listing, comm, metrics }) => (
                    <td key={listing.id} style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700 }}>
                        容积率: {comm?.plotRatio || '1.8'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {metrics.plotRatioText}
                      </div>
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)', position: 'sticky', left: 0, background: '#ffffff' }}>
                    车位配比 & 产权
                  </td>
                  {items.map(({ listing, comm }) => (
                    <td key={listing.id} style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700 }}>
                        配比: {comm?.parkingRatio || '1:1.0'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: listing.hasParkingSpace ? 'var(--primary)' : 'var(--text-dim)', marginTop: '2px' }}>
                        {listing.hasParkingSpace ? '✅ 含产权车位' : '❌ 不含产权车位'}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 3. 流动性与流通周期 */}
                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                  <td colSpan={items.length + 1} style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ⚡ 流动性与二手变现速度
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)', position: 'sticky', left: 0, background: '#ffffff' }}>
                    变现速度评级
                  </td>
                  {items.map(({ listing, metrics }) => (
                    <td key={listing.id} style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${metrics.liquidityBadgeStyle}`} style={{ fontSize: '0.75rem' }}>
                          {metrics.liquidityBadge}
                        </span>
                        <span className="tabular-nums" style={{ fontWeight: 800 }}>({metrics.liquidityScore}分)</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        预估周期: <strong>{metrics.estimatedSellMonths}</strong>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
