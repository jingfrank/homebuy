import React, { useState, useEffect } from 'react';
import type { Community, HouseListing } from '../types/community';
import { computeListingMetrics, calculateCommunityAvgRentUnitPrice } from '../types/community';
import {
  getStoredCommunities,
  addCommunity,
  updateCommunity,
  deleteCommunity,
  getStoredListings,
  addListing,
  updateListing,
  deleteListing,
} from '../utils/communityStorage';
import { ListingCompareModal } from './ListingCompareModal';
import { CommunityFormModal } from './CommunityFormModal';
import { ListingFormModal } from './ListingFormModal';
import {
  BuildingIcon,
  SparklesIcon,
  TrendingUpIcon,
} from './Icons';

interface CommunityLedgerSectionProps {
  onSelectListingForMortgage?: (totalPriceWuan: number) => void;
}

export const CommunityLedgerSection: React.FC<CommunityLedgerSectionProps> = ({
  onSelectListingForMortgage,
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [listings, setListings] = useState<HouseListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStoredCommunities(), getStoredListings()])
      .then(([comms, lists]) => {
        setCommunities(comms);
        setListings(lists);
        if (comms.length > 0) setActiveCommunityId(comms[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('全上海');
  const [communitySearch, setCommunitySearch] = useState<string>('');

  const [activeCommunityId, setActiveCommunityId] = useState<string>('');

  // Pagination & View Mode State
  const [listingPage, setListingPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const LISTINGS_PER_PAGE = 3;

  const [compareListingsIds, setCompareListingsIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Community Form Modal State (Add & Edit)
  const [isAddingCommunity, setIsAddingCommunity] = useState<boolean>(false);
  const [isEditingCommunity, setIsEditingCommunity] = useState<boolean>(false);
  const [commFormData, setCommFormData] = useState<Partial<Community>>({});

  // House Listing Form Modal State (Add & Edit)
  const [isAddingListing, setIsAddingListing] = useState<boolean>(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);

  const districts = ['全上海', '浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区', '闵行区', '青浦区', '松江区', '嘉定区', '宝山区'];

  const filteredCommunities = communities.filter((c) => {
    const matchDistrict = selectedDistrict === '全上海' || c.district === selectedDistrict;
    const matchSearch =
      c.name.includes(communitySearch) ||
      c.sector.includes(communitySearch) ||
      (c.schoolInfo && c.schoolInfo.includes(communitySearch));
    return matchDistrict && matchSearch;
  });

  const activeCommunity = communities.find((c) => c.id === activeCommunityId) || filteredCommunities[0];

  // Toggle selection for comparison
  const toggleCompare = (listingId: string) => {
    if (compareListingsIds.includes(listingId)) {
      setCompareListingsIds(compareListingsIds.filter((id) => id !== listingId));
    } else {
      if (compareListingsIds.length >= 4) {
        alert('最多支持同时对比 4 套房源');
        return;
      }
      setCompareListingsIds([...compareListingsIds, listingId]);
    }
  };

  // Delete Community Handler
  const handleDeleteCommunity = (commId: string, commName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`确认要删除小区“${commName}”及其旗下所有的具体房源记录吗？`)) {
      deleteCommunity(commId).catch(console.error);

      const updatedCommunities = communities.filter((c) => c.id !== commId);
      const updatedListings = listings.filter((l) => l.communityId !== commId);

      setCommunities(updatedCommunities);
      setListings(updatedListings);

      if (activeCommunityId === commId) {
        setActiveCommunityId(updatedCommunities.length > 0 ? updatedCommunities[0].id : '');
      }
    }
  };

  // Open Edit Community Modal
  const handleOpenEditCommunity = (comm: Community, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCommFormData({ ...comm });
    setIsEditingCommunity(true);
  };

  // Direct Community Save (Add or Update)
  const handleSaveCommunityDirect = (comm: Community) => {
    if (isEditingCommunity) {
      updateCommunity(comm).catch(console.error);
      const updatedCommunities = communities.map((c) => (c.id === comm.id ? comm : c));
      setCommunities(updatedCommunities);
      const updatedListings = listings.map((l) => (l.communityId === comm.id ? { ...l } : l));
      setListings(updatedListings);
      setIsEditingCommunity(false);
    } else {
      addCommunity(comm).catch(console.error);
      setCommunities([comm, ...communities]);
      setActiveCommunityId(comm.id);
      setIsAddingCommunity(false);
    }
  };

  // Delete House Listing Handler
  const handleDeleteListing = (listingId: string) => {
    if (confirm('确认删除这套房源记录吗？')) {
      deleteListing(listingId).catch(console.error);
      setListings(listings.filter((l) => l.id !== listingId));
      setCompareListingsIds(compareListingsIds.filter((id) => id !== listingId));
    }
  };

  // Open Edit Listing Modal
  const handleOpenEditListing = (listing: HouseListing) => {
    setEditingListingId(listing.id);
  };

  // Direct Listing Save (Add or Update)
  const handleSaveListingDirect = (listing: HouseListing) => {
    if (editingListingId) {
      updateListing(listing).catch(console.error);
      const updatedListings = listings.map((l) => (l.id === listing.id ? listing : l));
      setListings(updatedListings);
      setEditingListingId(null);
    } else {
      addListing(listing).catch(console.error);
      setListings([listing, ...listings]);
      setListingPage(1);
      setIsAddingListing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-muted)' }}>
        ⏳ 加载小区与房源数据中...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner (Header controls with PK modal launcher) */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderLeft: '5px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <BuildingIcon color="var(--primary)" size={24} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                🏢 上海意向小区与房源精选账本
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              全能管理意向小区、容积率、车位比与房源信息，支持修改小区参数实时同步重算房源收益率与安全价。
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCommFormData({});
                setIsEditingCommunity(false);
                setIsAddingCommunity(true);
              }}
            >
              + 记录新小区
            </button>

            {compareListingsIds.length > 0 && (
              <button className="btn btn-primary" onClick={() => setIsCompareModalOpen(true)}>
                <SparklesIcon size={16} /> 开启横向 PK ({compareListingsIds.length}套)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* District Filter Chips & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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
                  background: isSelected ? 'var(--primary)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {dis}
              </button>
            );
          })}
        </div>

        <div style={{ maxWidth: '300px', width: '100%' }}>
          <input
            type="text"
            placeholder="🔍 搜索小区名称或板块..."
            value={communitySearch}
            onChange={(e) => setCommunitySearch(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Main Workspace List: SINGLE UNIFIED MASTER COMMUNITY CARDS (ZERO DUPLICATION) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredCommunities.length === 0 ? (
          <div className="glass-card mobile-p-16" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            未找到匹配的意向小区，点击右上角“+ 记录新小区”添加。
          </div>
        ) : (
          filteredCommunities.map((comm) => {
            const commListings = listings.filter((l) => l.communityId === comm.id);
            const isExpandedActive = activeCommunityId === comm.id;

            // Pagination calculations for this specific community
            const commTotalPages = Math.ceil(commListings.length / LISTINGS_PER_PAGE) || 1;
            const commPaginatedListings = commListings.slice(
              (listingPage - 1) * LISTINGS_PER_PAGE,
              listingPage * LISTINGS_PER_PAGE
            );

            return (
              <div
                key={comm.id}
                className="glass-card animate-fade-in mobile-p-16"
                style={{
                  padding: '22px',
                  background: '#ffffff',
                  borderLeft: isExpandedActive ? '6px solid var(--primary)' : '1px solid var(--border-color)',
                  boxShadow: isExpandedActive ? '0 10px 25px -5px rgba(5, 150, 105, 0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {/* Master Community Header & Information */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {comm.name}
                      </h3>
                      <span className="badge badge-primary">{comm.district} · {comm.sector}</span>
                      <span className="badge badge-secondary">{comm.ringLocation || '中外环'}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
                        已录入 {commListings.length} 套房源
                      </span>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                      <span>🏢 容积率: <strong>{comm.plotRatio || '1.8'}</strong> ({comm.plotRatio && comm.plotRatio < 1.8 ? '低密舒适' : '品质适中'})</span>
                      <span>🚗 车位比: <strong>{comm.parkingRatio || '1:1.0'}</strong> (月租约 {comm.parkingRentMonthly || 400}元)</span>
                      <span>物业费: {comm.propertyFee}元/㎡/月</span>
                      <span>建成年份: {comm.builtYear}年</span>
                    </div>

                    {/* Market Avg Price Row */}
                    {(comm.askingAvgUnitPriceYuan || comm.dealAvgUnitPriceYuan || (comm.rentSamples && comm.rentSamples.length > 0)) && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {comm.askingAvgUnitPriceYuan && (
                          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            📈 挂牌均价: <strong style={{ color: 'var(--text-main)' }}>{comm.askingAvgUnitPriceYuan.toLocaleString()} 元/㎡</strong>
                          </span>
                        )}
                        {comm.dealAvgUnitPriceYuan && (
                          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            🤝 成交均价: <strong style={{ color: 'var(--primary)' }}>{comm.dealAvgUnitPriceYuan.toLocaleString()} 元/㎡</strong>
                          </span>
                        )}
                        {comm.askingAvgUnitPriceYuan && comm.dealAvgUnitPriceYuan && (
                          <span style={{ fontSize: '0.8rem', background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, border: '1px solid #fde047' }}>
                            💡 挤水分空间: {Math.round(((comm.askingAvgUnitPriceYuan - comm.dealAvgUnitPriceYuan) / comm.askingAvgUnitPriceYuan) * 1000) / 10}%
                            &nbsp;(约 {(comm.askingAvgUnitPriceYuan - comm.dealAvgUnitPriceYuan).toLocaleString()} 元/㎡)
                          </span>
                        )}
                        {(comm.rentSamples && comm.rentSamples.length > 0) && (
                          <span style={{ fontSize: '0.825rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 9px', borderRadius: '12px', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                            🏷️ 租赁单价: {calculateCommunityAvgRentUnitPrice(comm.rentSamples)} 元/㎡/月 ({comm.rentSamples.length}组样本加权)
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div>🎓 对口学区：{comm.schoolInfo || '暂无学区信息'}</div>
                      <div>🚇 轨交交通：{comm.metroInfoText || '暂无轨交信息'}</div>
                    </div>

                    {/* Pros / Cons Tags */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {comm.pros?.map((p, i) => (
                        <span key={i} className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          👍 {p}
                        </span>
                      ))}
                      {comm.cons?.map((c, i) => (
                        <span key={i} className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                          ⚠️ {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* UNIFIED ACTION BUTTON GROUP (DIRECTLY ON THE COMMUNITY CARD) */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                      onClick={() => {
                        setActiveCommunityId(comm.id);
                        setEditingListingId(null);
                        setIsAddingListing(true);
                      }}
                    >
                      + 录入此小区房源
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={(e) => handleOpenEditCommunity(comm, e)}
                    >
                      ✏️ 编辑小区
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{ color: 'var(--danger)', padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={(e) => handleDeleteCommunity(comm.id, comm.name, e)}
                    >
                      🗑️ 删除小区
                    </button>
                  </div>
                </div>

                {/* Sub-section: Listings Ledger inside this Community */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      【{comm.name}】已录入房源 ({commListings.length}套)
                    </h4>

                    {/* View Toggle Buttons */}
                    <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                      <button
                        onClick={() => setViewMode('card')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.775rem',
                          fontWeight: viewMode === 'card' ? 700 : 500,
                          background: viewMode === 'card' ? '#ffffff' : 'transparent',
                          color: viewMode === 'card' ? 'var(--primary)' : 'var(--text-muted)',
                          border: 'none',
                          boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🖼️ 图文大卡模式
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.775rem',
                          fontWeight: viewMode === 'table' ? 700 : 500,
                          background: viewMode === 'table' ? '#ffffff' : 'transparent',
                          color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                          border: 'none',
                          boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        📊 紧凑 Excel 表格
                      </button>
                    </div>
                  </div>

                  {commListings.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      当前小区暂未录入具体房源，点击上方“+ 录入此小区房源”添加。
                    </div>
                  ) : viewMode === 'table' ? (
                    /* Compact Table View Mode */
                    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#f8fafc' }}>
                            <th style={{ padding: '8px' }}>PK对比</th>
                            <th style={{ padding: '8px' }}>门牌/户型</th>
                            <th style={{ padding: '8px' }}>挂牌价/底价</th>
                            <th style={{ padding: '8px', color: 'var(--danger)' }}>理性入手价</th>
                            <th style={{ padding: '8px' }}>车位情况</th>
                            <th style={{ padding: '8px' }}>建面/实得率</th>
                            <th style={{ padding: '8px', color: 'var(--primary)' }}>真实净收益率</th>
                            <th style={{ padding: '8px' }}>流动性</th>
                            <th style={{ padding: '8px' }}>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commPaginatedListings.map((listing) => {
                            const metrics = computeListingMetrics(listing, comm);
                            const isChecked = compareListingsIds.includes(listing.id);
                            return (
                              <tr key={listing.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px' }}>
                                  <input type="checkbox" checked={isChecked} onChange={() => toggleCompare(listing.id)} />
                                </td>
                                <td style={{ padding: '8px', fontWeight: 700 }}>
                                  {listing.unitNumber} ({listing.layout})
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <span style={{ fontWeight: 800 }}>{listing.totalPrice}万</span> (底价 {listing.targetPrice}万)
                                </td>
                                <td style={{ padding: '8px', color: 'var(--danger)', fontWeight: 800 }}>
                                  {metrics.rationalSafePriceWuan}万
                                </td>
                                <td style={{ padding: '8px' }}>
                                  {listing.hasParkingSpace ? (
                                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>🚗 含产权车位</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>无车位</span>
                                  )}
                                </td>
                                <td style={{ padding: '8px' }}>{listing.buildingArea}㎡ ({metrics.practicalRatioPct}%)</td>
                                <td style={{ padding: '8px', color: 'var(--primary)', fontWeight: 800 }}>
                                  {metrics.netAnnualRentalYieldPct}%
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                                    (净月租 {metrics.netMonthlyRentYuan}元)
                                  </span>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <span className={`badge ${metrics.liquidityBadgeStyle}`} style={{ fontSize: '0.7rem' }}>
                                    {metrics.liquidityScore}分
                                  </span>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleOpenEditListing(listing)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }} title="编辑房源">✏️</button>
                                    <button onClick={() => handleDeleteListing(listing.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }} title="删除房源">🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Card View Mode */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {commPaginatedListings.map((listing) => {
                        const metrics = computeListingMetrics(listing, comm);
                        const isChecked = compareListingsIds.includes(listing.id);
                        return (
                          <div
                            key={listing.id}
                            style={{
                              padding: '20px',
                              borderRadius: '12px',
                              border: isChecked ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                              background: '#f8fafc',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCompare(listing.id)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                                    {listing.unitNumber}
                                  </span>
                                  <span className="badge badge-primary">{listing.layout}</span>
                                  <span className="badge badge-secondary">{listing.renovation}</span>

                                  {listing.hasParkingSpace && (
                                    <span className="badge badge-success" style={{ fontSize: '0.775rem', fontWeight: 700 }}>
                                      🚗 含产权车位 {listing.parkingPriceWuan ? `(${listing.parkingPriceWuan}万)` : ''}
                                    </span>
                                  )}

                                  <span className={`badge ${metrics.liquidityBadgeStyle}`} style={{ fontSize: '0.775rem', fontWeight: 700 }}>
                                    {metrics.liquidityBadge} ({metrics.liquidityScore}分)
                                  </span>

                                  {metrics.totalRiskDiscountPct > 0 && (
                                    <span className="badge badge-warning" style={{ fontSize: '0.775rem', fontWeight: 700 }}>
                                      {metrics.riskDiscountBadge}
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {listing.buildingArea} ㎡ (套内 {listing.insideArea} ㎡，实得率 {metrics.practicalRatioPct}%) · {listing.orientation} · {listing.floorInfo}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                  {metrics.liquidityTags.map((tag, idx) => (
                                    <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1' }}>
                                      {tag}
                                    </span>
                                  ))}
                                  {metrics.riskDiscountTags.map((rt, idx) => (
                                    <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                                      {rt}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                  {listing.totalPrice} <span style={{ fontSize: '0.85rem' }}>万元</span>
                                </div>
                                <div style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 700 }}>
                                  底价预估: {listing.targetPrice} 万元 (单价 {metrics.unitPriceYuan.toLocaleString()} 元/㎡)
                                </div>
                                {metrics.totalRiskDiscountPct > 0 && (
                                  <div style={{ fontSize: '0.775rem', color: 'var(--danger)', fontWeight: 800, marginTop: '2px' }}>
                                    🛡️ 理性入手价: {metrics.rationalSafePriceWuan} 万元
                                  </div>
                                )}
                                {metrics.priceVsDealAvgPct !== null && (
                                  <div style={{ fontSize: '0.735rem', marginTop: '3px', fontWeight: 700, color: metrics.priceVsDealAvgPct > 10 ? '#b91c1c' : metrics.priceVsDealAvgPct < 0 ? '#059669' : '#92400e' }}>
                                    {metrics.priceVsDealAvgPct > 10 ? '⚠️' : metrics.priceVsDealAvgPct < 0 ? '🔥' : '💡'}
                                    {metrics.priceVsDealAvgPct > 0 ? `比近期成交均价高 ${metrics.priceVsDealAvgPct}%` : `比近期成交均价低 ${Math.abs(metrics.priceVsDealAvgPct)}%`}
                                    {metrics.priceVsDealAvgPct > 10 ? ' (挂高·需大砍价)' : metrics.priceVsDealAvgPct < -3 ? ' (诚意卖·性价比高)' : ' (贴近市场真实底线)'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Floorplan & REAL NET RENT Metrics Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                              {/* Floorplan Thumbnail */}
                              <div style={{ width: '100%', height: '130px', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {listing.floorplanUrl ? (
                                  <img src={listing.floorplanUrl} alt="户型图" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>未上传户型图</span>
                                )}
                              </div>

                              {/* Net Rent Box */}
                              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid rgba(5, 150, 105, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <TrendingUpIcon size={14} /> 真实净租金收益率 (Net Yield)
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>到手月均净租金:</span>
                                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{metrics.netMonthlyRentYuan} 元/月</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>真实年化净收益率:</span>
                                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{metrics.netAnnualRentalYieldPct}%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px dashed var(--border-color)', paddingTop: '4px', marginTop: '2px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>净租金对月供覆盖率:</span>
                                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{metrics.mortgageCoveragePct}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions & Notes */}
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                📝 备注：{listing.notes || '暂无说明'}
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.775rem', padding: '3px 8px', color: 'var(--primary)' }}
                                  onClick={() => handleOpenEditListing(listing)}
                                >
                                  ✏️ 编辑房源
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.775rem', padding: '3px 8px', color: 'var(--danger)' }}
                                  onClick={() => handleDeleteListing(listing.id)}
                                >
                                  🗑️ 删除
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.775rem', padding: '3px 10px' }}
                                  onClick={() => {
                                    if (onSelectListingForMortgage) {
                                      onSelectListingForMortgage(listing.totalPrice);
                                    }
                                  }}
                                >
                                  🧮 带入房贷计算器
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Controls per Community */}
                  {commTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 10px', fontSize: '0.775rem' }}
                        disabled={listingPage <= 1}
                        onClick={() => setListingPage((p) => Math.max(1, p - 1))}
                      >
                        ◀ 上一页
                      </button>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        第 {listingPage} / {commTotalPages} 页 (共 {commListings.length} 套)
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 10px', fontSize: '0.775rem' }}
                        disabled={listingPage >= commTotalPages}
                        onClick={() => setListingPage((p) => Math.min(commTotalPages, p + 1))}
                      >
                        下一页 ▶
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add or Edit Community Modal */}
      <CommunityFormModal
        isOpen={isAddingCommunity || isEditingCommunity}
        isEditing={isEditingCommunity}
        communityData={commFormData}
        districts={districts}
        onSave={handleSaveCommunityDirect}
        onClose={() => {
          setIsAddingCommunity(false);
          setIsEditingCommunity(false);
        }}
      />

      {/* Add or Edit House Listing Modal */}
      <ListingFormModal
        isOpen={isAddingListing || editingListingId !== null}
        editingListing={editingListingId ? listings.find((l) => l.id === editingListingId) || null : null}
        activeCommunity={activeCommunity}
        onSave={handleSaveListingDirect}
        onClose={() => {
          setIsAddingListing(false);
          setEditingListingId(null);
        }}
      />

      {/* Floating Sticky PK Action Bar */}
      {compareListingsIds.length > 0 && (
        <aside
          role="region"
          aria-label="房源对比快捷栏"
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '76px', // Above mobile tab bar or bottom of screen
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 150,
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '9999px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            maxWidth: '92vw',
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span aria-hidden="true">⚖️</span>
            已选 <strong style={{ color: '#34d399' }}>{compareListingsIds.length}</strong> 套房源
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="btn btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.825rem',
                minHeight: '32px',
                borderRadius: '9999px',
                background: '#059669',
              }}
            >
              🚀 立即对比 PK
            </button>
            <button
              onClick={() => setCompareListingsIds([])}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              清空
            </button>
          </div>
        </aside>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && (
        <ListingCompareModal
          selectedListings={listings.filter((l) => compareListingsIds.includes(l.id))}
          communities={communities}
          onClose={() => setIsCompareModalOpen(false)}
        />
      )}
    </div>
  );
};
