import React from 'react';
import type { Community, HouseListing } from '../types/community';
import { computeListingMetrics } from '../types/community';
import { SparklesIcon } from './Icons';

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

  // Find best metrics across the list for highlighting
  const maxLiquidityScore = Math.max(...items.map((i) => i.metrics.liquidityScore));
  const maxNetYieldPct = Math.max(...items.map((i) => i.metrics.netAnnualRentalYieldPct));
  const minTargetUnitPrice = Math.min(...items.map((i) => i.metrics.targetUnitPriceYuan));
  const maxPracticalRatio = Math.max(...items.map((i) => i.metrics.practicalRatioPct));
  const maxMortgageCoverage = Math.max(...items.map((i) => i.metrics.mortgageCoveragePct));
  const maxRiskDiscountPct = Math.max(...items.map((i) => i.metrics.totalRiskDiscountPct));

  return (
    <div
      className="modal-overlay-mobile"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card animate-fade-in modal-card-mobile"
        style={{
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '20px 22px',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SparklesIcon color="var(--primary)" size={22} />
              多房源横向多维度 PK 对比表
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              并排对比 {items.length} 套精选房源（支持左右横向滑动查看全部房源与维度）。
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem' }}>
            ✕ 关闭对比
          </button>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#f8fafc' }}>
                <th style={{ padding: '12px', width: '150px', color: 'var(--text-muted)' }}>对比维度</th>
                {items.map(({ listing, comm }) => (
                  <th key={listing.id} style={{ padding: '12px', minWidth: '220px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                      {comm?.name || '未知小区'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {listing.unitNumber} ({listing.layout})
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 户型图 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>户型结构图</td>
                {items.map(({ listing }) => (
                  <td key={listing.id} style={{ padding: '12px' }}>
                    <div style={{ width: '180px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
                      {listing.floorplanUrl ? (
                        <img src={listing.floorplanUrl} alt="户型图" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                          未上传户型图
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 真实年化净租金收益率 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(5, 150, 105, 0.06)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  📈 真实年化净租金收益率 (Net Yield)
                </td>
                {items.map(({ listing, metrics }) => {
                  const isBestNetYield = metrics.netAnnualRentalYieldPct === maxNetYieldPct;
                  return (
                    <td key={listing.id} style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
                        {metrics.netAnnualRentalYieldPct}% / 年
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        月均到手净租金: <strong style={{ color: 'var(--text-main)' }}>{metrics.netMonthlyRentYuan} 元/月</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        (扣除1个月空置/物业费/契税中介费 | 回本 {metrics.netPaybackYears}年)
                      </div>
                      {isBestNetYield && (
                        <span className="badge badge-success" style={{ marginTop: '6px', fontSize: '0.725rem' }}>
                          🏆 真实净收益率最高
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 🏢 容积率与居住舒适度 (NEW ROW) */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  🏢 容积率与拥挤度
                </td>
                {items.map(({ listing, comm, metrics }) => (
                  <td key={listing.id} style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      容积率: {comm?.plotRatio || '1.8'} ({metrics.plotRatioText})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {comm?.plotRatio && comm.plotRatio < 1.8 ? '低密舒适·采光优秀' : comm?.plotRatio && comm.plotRatio > 2.8 ? '高密高层·采光易受遮挡' : '楼间距适中'}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 🚗 车位配比与产权车位 (NEW ROW) */}
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(59, 130, 246, 0.04)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  🚗 车位配比 & 产权车位
                </td>
                {items.map(({ listing, comm }) => (
                  <td key={listing.id} style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      车位配比: {comm?.parkingRatio || '1:1.0'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px' }}>
                      {listing.hasParkingSpace
                        ? `✅ 含产权车位 ${listing.parkingPriceWuan ? `(打包价${listing.parkingPriceWuan}万)` : ''}`
                        : '❌ 不含车位 (需单独购买/租用)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      月租参考: {comm?.parkingRentMonthly || 400} 元/月
                    </div>
                  </td>
                ))}
              </tr>

              {/* 📊 挂牌均价 vs 成交均价 (挤水分空间) */}
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(234, 179, 8, 0.05)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: '#854d0e' }}>
                  📊 挂牌/成交均价 (挤水分空间)
                </td>
                {items.map(({ listing, comm, metrics }) => (
                  <td key={listing.id} style={{ padding: '12px' }}>
                    {(comm?.askingAvgUnitPriceYuan || comm?.dealAvgUnitPriceYuan) ? (
                      <>
                        {comm?.askingAvgUnitPriceYuan && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            挂牌均价: <strong style={{ color: 'var(--text-main)' }}>{comm.askingAvgUnitPriceYuan.toLocaleString()} 元/㎡</strong>
                          </div>
                        )}
                        {comm?.dealAvgUnitPriceYuan && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            成交均价: <strong style={{ color: 'var(--primary)' }}>{comm.dealAvgUnitPriceYuan.toLocaleString()} 元/㎡</strong>
                          </div>
                        )}
                        {metrics.dealAvgGapPct !== null && (
                          <div style={{ fontSize: '0.775rem', marginTop: '4px', fontWeight: 700, color: '#854d0e', background: '#fef9c3', display: 'inline-block', padding: '1px 7px', borderRadius: '8px', border: '1px solid #fde047' }}>
                            💡 挤水分空间: {metrics.dealAvgGapPct}%
                          </div>
                        )}
                        {metrics.priceVsDealAvgPct !== null && (
                          <div style={{ marginTop: '5px', fontSize: '0.775rem', fontWeight: 700, color: metrics.priceVsDealAvgPct > 10 ? '#b91c1c' : metrics.priceVsDealAvgPct < 0 ? '#059669' : '#92400e' }}>
                            {metrics.priceVsDealAvgPct > 10 ? '⚠️' : metrics.priceVsDealAvgPct < 0 ? '🔥' : '💡'}
                            {metrics.priceVsDealAvgPct > 0
                              ? ` 此房挂高 ${metrics.priceVsDealAvgPct}% (需狠砍)`
                              : ` 此房低于均价 ${Math.abs(metrics.priceVsDealAvgPct)}% (性价比高)`}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>未填写小区均价数据</div>
                    )}
                  </td>
                ))}
              </tr>

              {/* 风险折价因子与理性安全入手价 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--danger)' }}>
                  🛡️ 风险折价 & 理性安全价
                </td>
                {items.map(({ listing, metrics }) => {
                  const isHighestDiscount = metrics.totalRiskDiscountPct === maxRiskDiscountPct && maxRiskDiscountPct > 0;
                  return (
                    <td key={listing.id} style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--danger)' }}>
                        理性入手价: {metrics.rationalSafePriceWuan} 万元
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        挂牌 {listing.totalPrice}万 (建议让利 {metrics.totalRiskDiscountPct}% / 扣减 {metrics.riskDiscountWuan}万)
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {metrics.riskDiscountTags.map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#ffffff', borderRadius: '4px', border: '1px solid #fca5a5', color: '#b91c1c' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      {isHighestDiscount && (
                        <span className="badge badge-warning" style={{ marginTop: '6px', fontSize: '0.725rem' }}>
                          🛡️ 缺陷最多·需狠狠砍价
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 流动性与变现速度 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(245, 158, 11, 0.06)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: '#d97706' }}>
                  ⚡ 流动性与变现速度
                </td>
                {items.map(({ listing, metrics }) => {
                  const isBestLiquidity = metrics.liquidityScore === maxLiquidityScore;
                  return (
                    <td key={listing.id} style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${metrics.liquidityBadgeStyle}`} style={{ fontSize: '0.75rem' }}>
                          {metrics.liquidityBadge}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>({metrics.liquidityScore}分)</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        预估变现周期: <strong style={{ color: 'var(--text-main)' }}>{metrics.estimatedSellMonths}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {metrics.liquidityTags.map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      {isBestLiquidity && (
                        <span className="badge badge-success" style={{ marginTop: '6px', fontSize: '0.725rem' }}>
                          ⚡ 变现速度最快·硬通货
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 价格与意向底价 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>挂牌价 / 心理底价</td>
                {items.map(({ listing }) => (
                  <td key={listing.id} style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                      {listing.totalPrice} 万元
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
                      意向底价: {listing.targetPrice} 万元 (让利 {Math.round(listing.totalPrice - listing.targetPrice)}万)
                    </div>
                  </td>
                ))}
              </tr>

              {/* 折合单价 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>折合挂牌/底价单价</td>
                {items.map(({ listing, metrics }) => {
                  const isBest = metrics.targetUnitPriceYuan === minTargetUnitPrice;
                  return (
                    <td key={listing.id} style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {metrics.unitPriceYuan.toLocaleString()} 元/㎡
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        底价单价: {metrics.targetUnitPriceYuan.toLocaleString()} 元/㎡
                      </div>
                      {isBest && (
                        <span className="badge badge-success" style={{ marginTop: '4px', fontSize: '0.725rem' }}>
                          💰 最低底价单价
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 真实净租金对月供覆盖率 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>以租养贷月供覆盖率</td>
                {items.map(({ listing, metrics }) => {
                  const isBestCoverage = metrics.mortgageCoveragePct === maxMortgageCoverage;
                  return (
                    <td key={listing.id} style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {metrics.mortgageCoveragePct}% 覆盖
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        (月供 {metrics.estimatedMonthlyMortgage} 元 | 净租金 {metrics.netMonthlyRentYuan} 元)
                      </div>
                      {isBestCoverage && (
                        <span className="badge badge-primary" style={{ marginTop: '4px', fontSize: '0.725rem' }}>
                          🛡️ 月供抗风险能力最强
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 面积与套内实得率 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>建面 / 套内实得率</td>
                {items.map(({ listing, metrics }) => {
                  const isBestPractical = metrics.practicalRatioPct === maxPracticalRatio;
                  return (
                    <td key={listing.id} style={{ padding: '12px' }}>
                      <div>{listing.buildingArea} ㎡ (套内 {listing.insideArea} ㎡)</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        实得率: {metrics.practicalRatioPct}%
                      </div>
                      {isBestPractical && (
                        <span className="badge badge-warning" style={{ marginTop: '4px', fontSize: '0.725rem' }}>
                          📐 实得得房率最高
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 学区与轨交 */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>对口学区 / 轨交配套</td>
                {items.map(({ listing, comm }) => (
                  <td key={listing.id} style={{ padding: '12px', fontSize: '0.825rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{comm?.schoolInfo || '暂无学区信息'}</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{comm?.metroInfoText || '暂无轨交信息'}</div>
                  </td>
                ))}
              </tr>

              {/* 现场看房备注 */}
              <tr>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>看房随手记与买房评价</td>
                {items.map(({ listing }) => (
                  <td key={listing.id} style={{ padding: '12px', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <div style={{ color: 'var(--warning)', fontWeight: 700, marginBottom: '4px' }}>
                      {'★'.repeat(listing.rating)}{'☆'.repeat(5 - listing.rating)} ({listing.rating}星推荐)
                    </div>
                    {listing.notes || '暂无备注'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
