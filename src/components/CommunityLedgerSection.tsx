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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Top Banner (Header controls with PK modal launcher) */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <BuildingIcon color="var(--primary)" size={24} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                🏢 上海意向小区与房源精选账本
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              全能管理意向小区、容积率、车位比与房源信息，实时测算真实净租金收益率与安全砍价值。
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.825rem' }}
              onClick={() => {
                setCommFormData({});
                setIsEditingCommunity(false);
                setIsAddingCommunity(true);
              }}
            >
              + 记录新小区
            </button>

            {compareListingsIds.length > 0 && (
              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.825rem' }} onClick={() => setIsCompareModalOpen(true)}>
                <SparklesIcon size={16} /> 开启横向 PK ({compareListingsIds.length}套)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* District Filter Chips & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', width: '100%', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
          {districts.map((dis) => {
            const isSelected = selectedDistrict === dis;
            return (
              <button
                key={dis}
                onClick={() => setSelectedDistrict(dis)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--primary)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
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
            style={{ fontSize: '0.85rem', padding: '8px 12px' }}
          />
        </div>
      </div>

      {/* Horizontal Community Selector Bar (Quick Switcher) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '6px',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          意向小区：
        </span>
        {filteredCommunities.map((c) => {
          const isSelected = activeCommunityId === c.id;
          const count = listings.filter((l) => l.communityId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => {
                setActiveCommunityId(c.id);
                setListingPage(1);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 800 : 500,
                background: isSelected ? 'var(--primary)' : '#ffffff',
                color: isSelected ? '#ffffff' : 'var(--text-main)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 8px rgba(5, 150, 105, 0.2)' : '0 1px 2px rgba(0,0,0,0.03)',
                flexShrink: 0,
              }}
            >
              <span>🏢 {c.name}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                {count}套
              </span>
            </button>
          );
        })}

        <button
          onClick={() => {
            setCommFormData({});
            setIsEditingCommunity(false);
            setIsAddingCommunity(true);
          }}
          style={{
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            border: '1px dashed var(--primary)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          + 录入新小区
        </button>
      </div>

      {/* Main Workspace List: SINGLE UNIFIED MASTER COMMUNITY CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {filteredCommunities.length === 0 ? (
          <div className="glass-card mobile-p-14" style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            未找到匹配的意向小区，点击上方“+ 录入新小区”添加。
          </div>
        ) : (
          filteredCommunities.map((comm) => {
            const commListings = listings.filter((l) => l.communityId === comm.id);
            // Only show active community or all if active is empty
            if (activeCommunityId && activeCommunityId !== comm.id) {
              return null; // Focus mode: show only active selected community
            }

            // Pagination calculations for this specific community
            const commTotalPages = Math.ceil(commListings.length / LISTINGS_PER_PAGE) || 1;
            const commPaginatedListings = commListings.slice(
              (listingPage - 1) * LISTINGS_PER_PAGE,
              listingPage * LISTINGS_PER_PAGE
            );

            return (
              <div
                key={comm.id}
                className="glass-card animate-fade-in mobile-p-14"
                style={{
                  padding: '20px',
                  background: '#ffffff',
                  borderLeft: '5px solid var(--primary)',
                  boxShadow: '0 4px 16px rgba(5, 150, 105, 0.06)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                {/* Master Community Header */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
                  {/* Top Row: Title + Status + Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {comm.name}
                      </h3>
                      <span className="badge badge-primary">{comm.district} · {comm.sector}</span>
                      <span className="badge badge-secondary">{comm.ringLocation || '中外环'}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                        已录入 {commListings.length} 套房源
                      </span>
                    </div>

                    {/* TOP ACTION BUTTONS */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.825rem', fontWeight: 700, borderRadius: '8px' }}
                        onClick={() => {
                          setActiveCommunityId(comm.id);
                          setEditingListingId(null);
                          setIsAddingListing(true);
                        }}
                      >
                        ➕ 录入房源
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.825rem', borderRadius: '8px' }}
                        onClick={(e) => handleOpenEditCommunity(comm, e)}
                      >
                        ✏️ 编辑小区
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ color: 'var(--danger)', padding: '6px 10px', fontSize: '0.825rem', borderRadius: '8px' }}
                        onClick={(e) => handleDeleteCommunity(comm.id, comm.name, e)}
                        title="删除小区档案"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Compact Community Key Metrics */}
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>🏢 容积率: <strong>{comm.plotRatio || '1.8'}</strong></span>
                    <span>🚗 车位比: <strong>{comm.parkingRatio || '1:1.0'}</strong> (月租约 {comm.parkingRentMonthly || 400}元)</span>
                    <span>物业费: {comm.propertyFee}元/㎡/月</span>
                    <span>建成年份: {comm.builtYear}年</span>
                  </div>

                  {/* Market Avg Price Row */}
                  {(comm.askingAvgUnitPriceYuan || comm.dealAvgUnitPriceYuan || (comm.rentSamples && comm.rentSamples.length > 0)) && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {comm.askingAvgUnitPriceYuan && (
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          📈 挂牌均价: <strong style={{ color: 'var(--text-main)' }}>{comm.askingAvgUnitPriceYuan.toLocaleString()} 元/㎡</strong>
                        </span>
                      )}
                      {comm.dealAvgUnitPriceYuan && (
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          🤝 成交均价: <strong style={{ color: 'var(--primary)' }}>{comm.dealAvgUnitPriceYuan.toLocaleString()} 元/㎡</strong>
                        </span>
                      )}
                      {comm.askingAvgUnitPriceYuan && comm.dealAvgUnitPriceYuan && (
                        <span style={{ fontSize: '0.78rem', background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, border: '1px solid #fde047' }}>
                          💡 挤水分空间: {Math.round(((comm.askingAvgUnitPriceYuan - comm.dealAvgUnitPriceYuan) / comm.askingAvgUnitPriceYuan) * 1000) / 10}%
                          &nbsp;(约 {(comm.askingAvgUnitPriceYuan - comm.dealAvgUnitPriceYuan).toLocaleString()} 元/㎡)
                        </span>
                      )}
                      {(Boolean(comm.avgRentUnitPricePerSqm || (comm.rentSamples && comm.rentSamples.length > 0))) && (
                        <span style={{ fontSize: '0.8rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                          🏷️ 租赁单价: {comm.avgRentUnitPricePerSqm || calculateCommunityAvgRentUnitPrice(comm.rentSamples)} 元/㎡/月
                          {comm.rentSamples && comm.rentSamples.length > 0 ? ` (${comm.rentSamples.length}组样本加权)` : ''}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div>🎓 对口学区：{comm.schoolInfo || '暂无学区信息'}</div>
                    <div>🚇 轨交交通：{comm.metroInfoText || '暂无轨交信息'}</div>
                  </div>

                  {/* Pros / Cons Tags */}
                  {((comm.pros && comm.pros.length > 0) || (comm.cons && comm.cons.length > 0)) && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {comm.pros?.map((p, i) => (
                        <span key={i} className="badge badge-success" style={{ fontSize: '0.725rem' }}>
                          👍 {p}
                        </span>
                      ))}
                      {comm.cons?.map((c, i) => (
                        <span key={i} className="badge badge-warning" style={{ fontSize: '0.725rem' }}>
                          ⚠️ {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-Header: Active Listing List with View Mode Switch */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>房源列表 ({commListings.length} 套)</span>
                      <button
                        onClick={() => {
                          setActiveCommunityId(comm.id);
                          setEditingListingId(null);
                          setIsAddingListing(true);
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(5, 150, 105, 0.2)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        + 快速加一套
                      </button>
                    </div>

                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                      <button
                        onClick={() => setViewMode('card')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: viewMode === 'card' ? 700 : 500,
                          background: viewMode === 'card' ? '#ffffff' : 'transparent',
                          color: viewMode === 'card' ? 'var(--primary)' : 'var(--text-muted)',
                          border: 'none',
                          boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🖼️ 图文大卡
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: viewMode === 'table' ? 700 : 500,
                          background: viewMode === 'table' ? '#ffffff' : 'transparent',
                          color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                          border: 'none',
                          boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        📊 紧凑表格
                      </button>
                    </div>
                  </div>

                  {commListings.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>🏠</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                        当前小区尚未录入具体房源
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        点击下方按钮录入关注房源，系统将自动推算真实净租金收益率与安全砍价值。
                      </p>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.825rem' }}
                        onClick={() => {
                          setActiveCommunityId(comm.id);
                          setEditingListingId(null);
                          setIsAddingListing(true);
                        }}
                      >
                        ➕ 立即录入此小区第一套房源
                      </button>
                    </div>
                  ) : viewMode === 'table' ? (
                    /* Compact Table View Mode */
                    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', minWidth: '640px' }}>
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
                    /* Card View Mode WITH TOP-ROW EDIT BUTTONS */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0 }}>
                      {commPaginatedListings.map((listing) => {
                        const metrics = computeListingMetrics(listing, comm);
                        const isChecked = compareListingsIds.includes(listing.id);
                        return (
                          <div
                            key={listing.id}
                            className="mobile-p-14"
                            style={{
                              padding: '18px 20px',
                              borderRadius: '14px',
                              border: isChecked ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                              background: '#ffffff',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box',
                            }}
                          >
                            {/* Listing Header Row with Direct Action Buttons at Top-Right */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px', width: '100%', minWidth: 0 }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCompare(listing.id)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                  />
                                  <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                                    {listing.unitNumber}
                                  </span>
                                  <span className="badge badge-primary">{listing.layout}</span>
                                  <span className="badge badge-secondary">{listing.renovation}</span>

                                  {listing.hasParkingSpace && (
                                    <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      🚗 含产权车位 {listing.parkingPriceWuan ? `(${listing.parkingPriceWuan}万)` : ''}
                                    </span>
                                  )}

                                  <span className={`badge ${metrics.liquidityBadgeStyle}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                    {metrics.liquidityBadge} ({metrics.liquidityScore}分)
                                  </span>

                                  {metrics.totalRiskDiscountPct > 0 && (
                                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      {metrics.riskDiscountBadge}
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {listing.buildingArea} ㎡ (套内 {listing.insideArea} ㎡，实得率 {metrics.practicalRatioPct}%) · {listing.orientation} · {listing.floorInfo}
                                </div>
                              </div>

                              {/* TOP-RIGHT DIRECT ACTION BUTTONS & PRICE */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--primary)', fontWeight: 700 }}
                                    onClick={() => handleOpenEditListing(listing)}
                                  >
                                    ✏️ 编辑
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                    onClick={() => {
                                      if (onSelectListingForMortgage) {
                                        onSelectListingForMortgage(listing.totalPrice);
                                      }
                                    }}
                                  >
                                    🧮 算房贷
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--danger)' }}
                                    onClick={() => handleDeleteListing(listing.id)}
                                    title="删除房源"
                                  >
                                    🗑️
                                  </button>
                                </div>

                                <div style={{ textAlign: 'right', marginTop: '2px' }}>
                                  <span className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                    {listing.totalPrice} <span style={{ fontSize: '0.8rem' }}>万元</span>
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginLeft: '6px' }}>
                                    (底价 {listing.targetPrice}万)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Floorplan & REAL NET RENT Metrics Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', width: '100%', minWidth: 0 }}>
                              {/* Floorplan Thumbnail */}
                              <div style={{ width: '100%', height: '120px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {listing.floorplanUrl ? (
                                  <img src={listing.floorplanUrl} alt="户型图" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>未上传户型图</span>
                                )}
                              </div>

                              {/* Net Rent & Valuation Box */}
                              <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px', minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <TrendingUpIcon size={14} /> 真实净租金收益率 (Net Yield)
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                  <span style={{ color: '#065f46' }}>净到手月租金:</span>
                                  <strong className="tabular-nums" style={{ color: 'var(--primary)' }}>{metrics.netMonthlyRentYuan} 元/月</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                  <span style={{ color: '#065f46' }}>真实年化净收益率:</span>
                                  <strong className="tabular-nums" style={{ color: 'var(--primary)' }}>{metrics.netAnnualRentalYieldPct}%</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', borderTop: '1px dashed #bbf7d0', paddingTop: '4px', marginTop: '2px' }}>
                                  <span style={{ color: '#065f46' }}>建议安全砍价值:</span>
                                  <strong className="tabular-nums" style={{ color: 'var(--danger)' }}>{metrics.rationalSafePriceWuan} 万元</strong>
                                </div>
                              </div>
                            </div>

                            {/* Tags and Notes */}
                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', width: '100%', minWidth: 0 }}>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                                📝 备注：{listing.notes || '暂无私聊备注'}
                              </div>

                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {metrics.liquidityTags.map((tag, idx) => (
                                  <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
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
          onUpdateListing={handleSaveListingDirect}
        />
      )}
    </div>
  );
};
