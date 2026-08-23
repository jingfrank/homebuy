import React, { useState } from 'react';
import type { Community, HouseListing, RentSample } from '../types/community';
import {
  computeListingMetrics,
  calculateCommunityAvgRentUnitPrice,
  suggestMonthlyRentByCommunity,
} from '../types/community';
import {
  getStoredCommunities,
  saveCommunities,
  getStoredListings,
  saveListings,
  DEFAULT_FLOORPLAN_SVG,
} from '../utils/communityStorage';
import { ListingCompareModal } from './ListingCompareModal';
import {
  BuildingIcon,
  SparklesIcon,
  TrendingUpIcon,
  ZapIcon,
  ShieldCheckIcon,
} from './Icons';

interface CommunityLedgerSectionProps {
  onSelectListingForMortgage?: (totalPriceWuan: number) => void;
}

export const CommunityLedgerSection: React.FC<CommunityLedgerSectionProps> = ({
  onSelectListingForMortgage,
}) => {
  const [communities, setCommunities] = useState<Community[]>(() => getStoredCommunities());
  const [listings, setListings] = useState<HouseListing[]>(() => getStoredListings());

  const [selectedDistrict, setSelectedDistrict] = useState<string>('全上海');
  const [communitySearch, setCommunitySearch] = useState<string>('');

  const [activeCommunityId, setActiveCommunityId] = useState<string>(
    communities.length > 0 ? communities[0].id : ''
  );

  // Pagination & View Mode State
  const [listingPage, setListingPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const LISTINGS_PER_PAGE = 3;

  const [compareListingsIds, setCompareListingsIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Community Form Modal State (Add & Edit)
  const [isAddingCommunity, setIsAddingCommunity] = useState<boolean>(false);
  const [isEditingCommunity, setIsEditingCommunity] = useState<boolean>(false);

  const [commFormData, setCommFormData] = useState<Partial<Community>>({
    district: '浦东新区',
    sector: '',
    ringLocation: '中外环',
    name: '',
    builtYear: 2010,
    propertyFee: 3.0,
    metroInfoText: '',
    schoolInfo: '',
    amenities: '',
    pros: [],
    cons: [],
    plotRatio: 1.8,
    parkingRatio: '1:1.1',
    parkingRentMonthly: 400,
    askingAvgUnitPriceYuan: undefined,
    dealAvgUnitPriceYuan: undefined,
    rentSamples: [],
    avgRentUnitPricePerSqm: 0,
  });

  // Temporary state for adding a single rent sample in the community modal
  const [sampleAreaInput, setSampleAreaInput] = useState<string>('');
  const [sampleRentInput, setSampleRentInput] = useState<string>('');
  const [sampleLayoutInput, setSampleLayoutInput] = useState<string>('');
  const [sampleNoteInput, setSampleNoteInput] = useState<string>('');
  const [sampleIsShengxinZuInput, setSampleIsShengxinZuInput] = useState<boolean>(false);

  // House Listing Form Modal State (Add & Edit)
  const [isAddingListing, setIsAddingListing] = useState<boolean>(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);

  const [listingFormData, setListingFormData] = useState<Partial<HouseListing>>({
    unitNumber: '',
    totalPrice: 400,
    targetPrice: 370,
    buildingArea: 89,
    insideArea: 75,
    layout: '3室2厅1卫',
    floorInfo: '中层 (10/18)',
    orientation: '南北通透',
    renovation: '精装',
    expectedMonthlyRent: 4500,
    floorplanUrl: DEFAULT_FLOORPLAN_SVG,
    rating: 5,
    notes: '',
    hasParkingSpace: false,
    parkingPriceWuan: 0,
    isSubNew: true,
    isNearMetro: true,
    isSweetSpotLayout: true,
    hasAgeRisk: false,
    hasLayoutNoiseRisk: false,
    hasParkingPropertyRisk: false,
    hasMetroDistanceRisk: false,
    hasSchoolPolicyRisk: false,
  });

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
      const updatedCommunities = communities.filter((c) => c.id !== commId);
      const updatedListings = listings.filter((l) => l.communityId !== commId);

      setCommunities(updatedCommunities);
      saveCommunities(updatedCommunities);

      setListings(updatedListings);
      saveListings(updatedListings);

      if (activeCommunityId === commId) {
        setActiveCommunityId(updatedCommunities.length > 0 ? updatedCommunities[0].id : '');
      }
    }
  };

  // Open Edit Community Modal
  const handleOpenEditCommunity = (comm: Community, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCommFormData({ ...comm, rentSamples: comm.rentSamples ? [...comm.rentSamples] : [] });
    setSampleAreaInput('');
    setSampleRentInput('');
    setSampleLayoutInput('');
    setSampleNoteInput('');
    setSampleIsShengxinZuInput(false);
    setIsEditingCommunity(true);
  };

  // Add a rent sample to commFormData
  const handleAddRentSample = () => {
    const area = parseFloat(sampleAreaInput);
    const rent = parseFloat(sampleRentInput);
    if (!area || area <= 0 || !rent || rent <= 0) {
      alert('请填写有效的租赁面积（㎡）和月租金（元/月）！');
      return;
    }
    const newSample: RentSample = {
      id: `rs-${Date.now()}`,
      area,
      monthlyRent: rent,
      layout: sampleLayoutInput.trim() || undefined,
      note: sampleNoteInput.trim() || undefined,
      isShengxinZu: sampleIsShengxinZuInput,
    };
    const updatedSamples = [...(commFormData.rentSamples || []), newSample];
    const newAvgUnitRent = calculateCommunityAvgRentUnitPrice(updatedSamples);
    setCommFormData({
      ...commFormData,
      rentSamples: updatedSamples,
      avgRentUnitPricePerSqm: newAvgUnitRent,
    });
    setSampleAreaInput('');
    setSampleRentInput('');
    setSampleLayoutInput('');
    setSampleNoteInput('');
    setSampleIsShengxinZuInput(false);
  };

  // Delete a rent sample from commFormData
  const handleDeleteRentSample = (sampleId: string) => {
    const updatedSamples = (commFormData.rentSamples || []).filter((s) => s.id !== sampleId);
    const newAvgUnitRent = calculateCommunityAvgRentUnitPrice(updatedSamples);
    setCommFormData({
      ...commFormData,
      rentSamples: updatedSamples,
      avgRentUnitPricePerSqm: newAvgUnitRent,
    });
  };

  // Save Community Form (Add or Edit with 100% LISTINGS DATA SYNC)
  const handleSaveCommunityForm = () => {
    if (!commFormData.name || !commFormData.sector) {
      alert('请填写小区名称和所属板块！');
      return;
    }

    const currentRentSamples = commFormData.rentSamples || [];
    const computedAvgRentUnit = calculateCommunityAvgRentUnitPrice(currentRentSamples);

    if (isEditingCommunity && commFormData.id) {
      const targetCommId = commFormData.id;
      // Update existing community
      const updatedCommunities = communities.map((c) => {
        if (c.id === targetCommId) {
          return {
            ...c,
            name: commFormData.name || c.name,
            district: commFormData.district || c.district,
            sector: commFormData.sector || c.sector,
            ringLocation: commFormData.ringLocation || c.ringLocation,
            builtYear: Number(commFormData.builtYear) || c.builtYear,
            propertyFee: Number(commFormData.propertyFee) || c.propertyFee,
            metroInfoText: commFormData.metroInfoText || '',
            schoolInfo: commFormData.schoolInfo || '',
            amenities: commFormData.amenities || '',
            plotRatio: Number(commFormData.plotRatio) || 1.8,
            parkingRatio: commFormData.parkingRatio || '1:1.0',
            parkingRentMonthly: Number(commFormData.parkingRentMonthly) || 400,
            askingAvgUnitPriceYuan: commFormData.askingAvgUnitPriceYuan ? Number(commFormData.askingAvgUnitPriceYuan) : undefined,
            dealAvgUnitPriceYuan: commFormData.dealAvgUnitPriceYuan ? Number(commFormData.dealAvgUnitPriceYuan) : undefined,
            rentSamples: currentRentSamples,
            avgRentUnitPricePerSqm: computedAvgRentUnit,
          };
        }
        return c;
      });

      setCommunities(updatedCommunities);
      saveCommunities(updatedCommunities);

      // Force reference-level update for listings array to ensure all child listings re-render with updated community properties!
      const updatedListings = listings.map((l) => {
        if (l.communityId === targetCommId) {
          return { ...l }; // clone object to trigger React re-calculation
        }
        return l;
      });
      setListings(updatedListings);
      saveListings(updatedListings);

      setIsEditingCommunity(false);
    } else {
      // Add new community
      const newComm: Community = {
        id: `comm-${Date.now()}`,
        name: commFormData.name,
        district: commFormData.district || '浦东新区',
        sector: commFormData.sector,
        ringLocation: commFormData.ringLocation || '中外环',
        builtYear: Number(commFormData.builtYear) || 2010,
        propertyFee: Number(commFormData.propertyFee) || 3.0,
        metroInfoText: commFormData.metroInfoText || '',
        schoolInfo: commFormData.schoolInfo || '',
        amenities: commFormData.amenities || '',
        pros: commFormData.pros || [],
        cons: commFormData.cons || [],
        plotRatio: Number(commFormData.plotRatio) || 1.8,
        parkingRatio: commFormData.parkingRatio || '1:1.0',
        parkingRentMonthly: Number(commFormData.parkingRentMonthly) || 400,
        askingAvgUnitPriceYuan: commFormData.askingAvgUnitPriceYuan ? Number(commFormData.askingAvgUnitPriceYuan) : undefined,
        dealAvgUnitPriceYuan: commFormData.dealAvgUnitPriceYuan ? Number(commFormData.dealAvgUnitPriceYuan) : undefined,
        rentSamples: currentRentSamples,
        avgRentUnitPricePerSqm: computedAvgRentUnit,
      };

      const updated = [newComm, ...communities];
      setCommunities(updated);
      saveCommunities(updated);
      setActiveCommunityId(newComm.id);
      setIsAddingCommunity(false);
    }
  };

  // Delete House Listing Handler
  const handleDeleteListing = (listingId: string) => {
    if (confirm('确认删除这套房源记录吗？')) {
      const updated = listings.filter((l) => l.id !== listingId);
      setListings(updated);
      saveListings(updated);
      setCompareListingsIds(compareListingsIds.filter((id) => id !== listingId));
    }
  };

  // Open Edit Listing Modal
  const handleOpenEditListing = (listing: HouseListing) => {
    setEditingListingId(listing.id);
    setListingFormData({ ...listing });
  };

  // Add or Update house listing handler
  const handleSaveListingForm = () => {
    if (!activeCommunity) return;
    if (!listingFormData.unitNumber || !listingFormData.totalPrice) {
      alert('请填写房源门牌号和挂牌总价！');
      return;
    }

    if (editingListingId) {
      // Update existing listing
      const updatedListings = listings.map((l) => {
        if (l.id === editingListingId) {
          return {
            ...l,
            unitNumber: listingFormData.unitNumber || l.unitNumber,
            totalPrice: Number(listingFormData.totalPrice) || 0,
            targetPrice: Number(listingFormData.targetPrice) || Number(listingFormData.totalPrice) || 0,
            buildingArea: Number(listingFormData.buildingArea) || 0,
            insideArea: Number(listingFormData.insideArea) || 0,
            layout: listingFormData.layout || '3室2厅1卫',
            floorInfo: listingFormData.floorInfo || '中层',
            orientation: listingFormData.orientation || '南',
            renovation: listingFormData.renovation || '精装',
            expectedMonthlyRent: Number(listingFormData.expectedMonthlyRent) || 0,
            floorplanUrl: listingFormData.floorplanUrl || DEFAULT_FLOORPLAN_SVG,
            rating: Number(listingFormData.rating) || 5,
            notes: listingFormData.notes || '',
            hasParkingSpace: !!listingFormData.hasParkingSpace,
            parkingPriceWuan: Number(listingFormData.parkingPriceWuan) || 0,
            isSubNew: !!listingFormData.isSubNew,
            isNearMetro: !!listingFormData.isNearMetro,
            isSweetSpotLayout: !!listingFormData.isSweetSpotLayout,
            hasAgeRisk: !!listingFormData.hasAgeRisk,
            hasLayoutNoiseRisk: !!listingFormData.hasLayoutNoiseRisk,
            hasParkingPropertyRisk: !!listingFormData.hasParkingPropertyRisk,
            hasMetroDistanceRisk: !!listingFormData.hasMetroDistanceRisk,
            hasSchoolPolicyRisk: !!listingFormData.hasSchoolPolicyRisk,
          };
        }
        return l;
      });

      setListings(updatedListings);
      saveListings(updatedListings);
      setEditingListingId(null);
    } else {
      // Create new listing
      const newListing: HouseListing = {
        id: `list-${Date.now()}`,
        communityId: activeCommunity.id,
        unitNumber: listingFormData.unitNumber,
        totalPrice: Number(listingFormData.totalPrice) || 0,
        targetPrice: Number(listingFormData.targetPrice) || Number(listingFormData.totalPrice) || 0,
        buildingArea: Number(listingFormData.buildingArea) || 0,
        insideArea: Number(listingFormData.insideArea) || Number(listingFormData.buildingArea) * 0.8 || 0,
        layout: listingFormData.layout || '3室2厅1卫',
        floorInfo: listingFormData.floorInfo || '中层',
        orientation: listingFormData.orientation || '南',
        renovation: listingFormData.renovation || '精装',
        expectedMonthlyRent: Number(listingFormData.expectedMonthlyRent) || 0,
        floorplanUrl: listingFormData.floorplanUrl || DEFAULT_FLOORPLAN_SVG,
        rating: Number(listingFormData.rating) || 5,
        notes: listingFormData.notes || '',
        hasParkingSpace: !!listingFormData.hasParkingSpace,
        parkingPriceWuan: Number(listingFormData.parkingPriceWuan) || 0,
        isSubNew: !!listingFormData.isSubNew,
        isNearMetro: !!listingFormData.isNearMetro,
        isSweetSpotLayout: !!listingFormData.isSweetSpotLayout,
        hasAgeRisk: !!listingFormData.hasAgeRisk,
        hasLayoutNoiseRisk: !!listingFormData.hasLayoutNoiseRisk,
        hasParkingPropertyRisk: !!listingFormData.hasParkingPropertyRisk,
        hasMetroDistanceRisk: !!listingFormData.hasMetroDistanceRisk,
        hasSchoolPolicyRisk: !!listingFormData.hasSchoolPolicyRisk,
      };

      const updated = [newListing, ...listings];
      setListings(updated);
      saveListings(updated);
      setListingPage(1);
      setIsAddingListing(false);
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setListingFormData((prev) => ({ ...prev, floorplanUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
                setCommFormData({
                  district: '浦东新区',
                  sector: '',
                  ringLocation: '中外环',
                  name: '',
                  builtYear: 2010,
                  propertyFee: 3.0,
                  metroInfoText: '',
                  schoolInfo: '',
                  amenities: '',
                  pros: [],
                  cons: [],
                  plotRatio: 1.8,
                  parkingRatio: '1:1.1',
                  parkingRentMonthly: 400,
                  askingAvgUnitPriceYuan: undefined,
                  dealAvgUnitPriceYuan: undefined,
                });
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {filteredCommunities.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                className="glass-card animate-fade-in"
                style={{
                  padding: '28px',
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
                        setListingFormData({
                          unitNumber: '',
                          totalPrice: 400,
                          targetPrice: 370,
                          buildingArea: 89,
                          insideArea: 75,
                          layout: '3室2厅1卫',
                          floorInfo: '中层 (10/18)',
                          orientation: '南北通透',
                          renovation: '精装',
                          expectedMonthlyRent: 4500,
                          floorplanUrl: DEFAULT_FLOORPLAN_SVG,
                          rating: 5,
                          notes: '',
                          hasParkingSpace: false,
                          parkingPriceWuan: 0,
                          isSubNew: true,
                          isNearMetro: true,
                          isSweetSpotLayout: true,
                          hasAgeRisk: false,
                          hasLayoutNoiseRisk: false,
                          hasParkingPropertyRisk: false,
                          hasMetroDistanceRisk: false,
                          hasSchoolPolicyRisk: false,
                        });
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
      {(isAddingCommunity || isEditingCommunity) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '24px 28px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {isEditingCommunity ? '✏️ 修改小区档案信息' : '🏢 录入新意向小区'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>录入/修改小区板块、容积率、车位比与配套</div>
              </div>
              <button
                onClick={() => {
                  setIsAddingCommunity(false);
                  setIsEditingCommunity(false);
                }}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>小区名称 *</label>
                <input type="text" placeholder="如：联洋年华 / 泗水和鸣" value={commFormData.name} onChange={(e) => setCommFormData({ ...commFormData, name: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>所属行政区</label>
                  <select value={commFormData.district} onChange={(e) => setCommFormData({ ...commFormData, district: e.target.value })}>
                    {districts.filter(d => d !== '全上海').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>所属板块 *</label>
                  <input type="text" placeholder="如：泗泾板块" value={commFormData.sector} onChange={(e) => setCommFormData({ ...commFormData, sector: e.target.value })} />
                </div>
              </div>

              {/* Plot Ratio & Parking Ratio Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>容积率</label>
                  <input type="number" step="0.1" placeholder="1.8" value={commFormData.plotRatio} onChange={(e) => setCommFormData({ ...commFormData, plotRatio: parseFloat(e.target.value) || 1.8 })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>车位配比</label>
                  <input type="text" placeholder="1:1.2" value={commFormData.parkingRatio} onChange={(e) => setCommFormData({ ...commFormData, parkingRatio: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>车位月租 (元/月)</label>
                  <input type="number" placeholder="400" value={commFormData.parkingRentMonthly} onChange={(e) => setCommFormData({ ...commFormData, parkingRentMonthly: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>环线定位</label>
                  <select value={commFormData.ringLocation} onChange={(e) => setCommFormData({ ...commFormData, ringLocation: e.target.value })}>
                    <option value="内环内">内环内</option>
                    <option value="中内环">中内环</option>
                    <option value="中外环">中外环</option>
                    <option value="外环外">外环外</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>建筑年代 (年)</label>
                  <input type="number" placeholder="2018" value={commFormData.builtYear} onChange={(e) => setCommFormData({ ...commFormData, builtYear: parseInt(e.target.value) || 2010 })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>物业费 (元/㎡/月)</label>
                <input type="number" step="0.1" placeholder="3.5" value={commFormData.propertyFee} onChange={(e) => setCommFormData({ ...commFormData, propertyFee: parseFloat(e.target.value) || 0 })} />
              </div>

              {/* Market Avg Price Inputs */}
              <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#065f46', marginBottom: '10px' }}>📊 市场价格锚点 (可选·用于计算房源溢价率)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#047857', marginBottom: '3px', display: 'block' }}>最新挂牌均价 (元/㎡)</label>
                    <input
                      type="number"
                      placeholder="如：82000"
                      value={commFormData.askingAvgUnitPriceYuan ?? ''}
                      onChange={(e) => setCommFormData({ ...commFormData, askingAvgUnitPriceYuan: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#047857', marginBottom: '3px', display: 'block' }}>最近成交均价 (元/㎡)</label>
                    <input
                      type="number"
                      placeholder="如：74000"
                      value={commFormData.dealAvgUnitPriceYuan ?? ''}
                      onChange={(e) => setCommFormData({ ...commFormData, dealAvgUnitPriceYuan: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '0.725rem', color: '#6b7280', marginTop: '6px' }}>💡 数据来源：链家/贝壳「小区成交记录」或安居客挂牌均价（建议每月更新）</div>
              </div>

              {/* Rent Sample Calculator Section */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏷️ 小区租房样本库与单位单价计算器
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(5, 150, 105, 0.1)', padding: '3px 10px', borderRadius: '14px', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                    平均单价: {calculateCommunityAvgRentUnitPrice(commFormData.rentSamples)} 元/㎡/月
                  </span>
                </div>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                  录入任意面积与月租金样本（支持同小区或邻近盘），系统自动推算该小区的租赁单价，用于房源租金智能推算。
                </p>

                {/* Refactored Clean 2-Row Form */}
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px', display: 'block' }}>租赁面积 (㎡) *</label>
                      <input
                        type="number"
                        placeholder="如 60"
                        value={sampleAreaInput}
                        onChange={(e) => setSampleAreaInput(e.target.value)}
                        style={{ fontSize: '0.825rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px', display: 'block' }}>月租金 (元/月) *</label>
                      <input
                        type="number"
                        placeholder="如 4200"
                        value={sampleRentInput}
                        onChange={(e) => setSampleRentInput(e.target.value)}
                        style={{ fontSize: '0.825rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>户型 (可选)</label>
                      <input
                        type="text"
                        placeholder="如 2室1厅"
                        value={sampleLayoutInput}
                        onChange={(e) => setSampleLayoutInput(e.target.value)}
                        style={{ fontSize: '0.825rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>备注/来源 (可选)</label>
                      <input
                        type="text"
                        placeholder="如 贝壳在租/中介打听"
                        value={sampleNoteInput}
                        onChange={(e) => setSampleNoteInput(e.target.value)}
                        style={{ fontSize: '0.825rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={sampleIsShengxinZuInput}
                        onChange={(e) => setSampleIsShengxinZuInput(e.target.checked)}
                      />
                      🏠 链家「省心租/托管」(自动按业主净到手 90% 折算)
                    </label>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '5px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                      onClick={handleAddRentSample}
                    >
                      + 添加租房样本
                    </button>
                  </div>
                </div>

                {/* Sample List Display */}
                {commFormData.rentSamples && commFormData.rentSamples.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {commFormData.rentSamples.map((sample) => {
                      const netRent = sample.isShengxinZu ? (sample.monthlyRent * 0.90) : sample.monthlyRent;
                      const unitRate = sample.area > 0 ? Math.round((netRent / sample.area) * 100) / 100 : 0;
                      return (
                        <div
                          key={sample.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#ffffff',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div>
                            <strong>{sample.area} ㎡</strong> · <strong style={{ color: 'var(--primary)' }}>{sample.monthlyRent} 元/月</strong>
                            {sample.isShengxinZu && (
                              <span style={{ marginLeft: '6px', color: '#1d4ed8', background: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                🏠 省心租 (净到手约 {Math.round(netRent)}元)
                              </span>
                            )}
                            <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                              (折算净单价 <strong>{unitRate}</strong> 元/㎡/月)
                            </span>
                            {sample.layout && <span style={{ marginLeft: '6px', color: '#475569' }}>[{sample.layout}]</span>}
                            {sample.note && <span style={{ marginLeft: '6px', color: '#64748b' }}>({sample.note})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRentSample(sample.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}
                            title="删除样本"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '8px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    暂无租房样本，请在上方填写样本信息后点击“+ 添加租房样本”。
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>对口学区</label>
                <input type="text" placeholder="如：泗泾实验学校（九年一贯制）" value={commFormData.schoolInfo} onChange={(e) => setCommFormData({ ...commFormData, schoolInfo: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>轨交距离与公共交通</label>
                <input type="text" placeholder="如：9号线泗泾站 350米" value={commFormData.metroInfoText} onChange={(e) => setCommFormData({ ...commFormData, metroInfoText: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsAddingCommunity(false);
                    setIsEditingCommunity(false);
                  }}
                >
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSaveCommunityForm}>
                  {isEditingCommunity ? '保存修改' : '保存小区'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add or Edit House Listing Modal */}
      {(isAddingListing || editingListingId !== null) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '24px 28px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {editingListingId ? '✏️ 修改房源信息' : '🏠 录入具体房源信息'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>当前小区：{activeCommunity?.name}</div>
              </div>
              <button
                onClick={() => {
                  setIsAddingListing(false);
                  setEditingListingId(null);
                }}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>栋号/门牌号 *</label>
                <input
                  type="text"
                  placeholder="如：8号楼 1202室 (或 8号楼中层)"
                  value={listingFormData.unitNumber}
                  onChange={(e) => setListingFormData({ ...listingFormData, unitNumber: e.target.value })}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  💡 提示：链家/贝壳 App 出于隐私默认隐藏门牌号，您可以填写如“8号楼中层”或直接询问带看中介。
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>户型格局</label>
                  <input
                    type="text"
                    placeholder="如：3室2厅2卫"
                    value={listingFormData.layout}
                    onChange={(e) => setListingFormData({ ...listingFormData, layout: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>装修状况</label>
                  <select
                    value={listingFormData.renovation}
                    onChange={(e) => setListingFormData({ ...listingFormData, renovation: e.target.value as any })}
                  >
                    <option value="精装">精装</option>
                    <option value="简装">简装</option>
                    <option value="毛坯">毛坯</option>
                    <option value="老旧需重装">老旧需重装</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>挂牌总价 (万元) *</label>
                  <input
                    type="number"
                    value={listingFormData.totalPrice}
                    onChange={(e) => setListingFormData({ ...listingFormData, totalPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>意向底价/心理价 (万元)</label>
                  <input
                    type="number"
                    value={listingFormData.targetPrice}
                    onChange={(e) => setListingFormData({ ...listingFormData, targetPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>建筑面积 (㎡)</label>
                  <input
                    type="number"
                    value={listingFormData.buildingArea}
                    onChange={(e) => setListingFormData({ ...listingFormData, buildingArea: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>套内实用面积 (㎡)</label>
                  <input
                    type="number"
                    value={listingFormData.insideArea}
                    onChange={(e) => setListingFormData({ ...listingFormData, insideArea: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Parking Option Section */}
              <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>
                  🚗 产权车位与打包价格选项
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={!!listingFormData.hasParkingSpace}
                      onChange={(e) => setListingFormData({ ...listingFormData, hasParkingSpace: e.target.checked })}
                    />
                    买房包含/赠送产权车位
                  </label>
                  {listingFormData.hasParkingSpace && (
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#1e40af' }}>车位价值/打包价 (万元)</label>
                      <input
                        type="number"
                        placeholder="25"
                        value={listingFormData.parkingPriceWuan}
                        onChange={(e) => setListingFormData({ ...listingFormData, parkingPriceWuan: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>同户型预估月租金 (元/月)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const avgUnitRent = activeCommunity?.avgRentUnitPricePerSqm || calculateCommunityAvgRentUnitPrice(activeCommunity?.rentSamples);
                        if (!avgUnitRent || avgUnitRent <= 0) {
                          alert('当前小区尚未录入租房样本！请先在主页点击「✏️ 编辑小区」录入租房样本面积与租金。');
                          return;
                        }
                        const suggested = suggestMonthlyRentByCommunity(listingFormData.buildingArea || 0, avgUnitRent);
                        if (suggested > 0) {
                          setListingFormData(prev => ({ ...prev, expectedMonthlyRent: suggested }));
                        }
                      }}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #93c5fd',
                        borderRadius: '4px',
                        fontSize: '0.725rem',
                        padding: '1px 6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                      title="根据小区租房样本加权单价智能推算建议月租金"
                    >
                      🤖 智能推算
                    </button>
                  </div>
                  <input
                    type="number"
                    value={listingFormData.expectedMonthlyRent}
                    onChange={(e) => setListingFormData({ ...listingFormData, expectedMonthlyRent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>楼层 / 朝向</label>
                  <input
                    type="text"
                    placeholder="如：中层(10/18) · 南"
                    value={listingFormData.floorInfo}
                    onChange={(e) => setListingFormData({ ...listingFormData, floorInfo: e.target.value })}
                  />
                </div>
              </div>

              {/* Liquidity Checkboxes */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ZapIcon size={16} color="var(--primary)" /> 流动性特征加分勾选
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.825rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!listingFormData.isSubNew} onChange={(e) => setListingFormData({ ...listingFormData, isSubNew: e.target.checked })} />
                    品质次新房 (&lt;10年)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!listingFormData.isNearMetro} onChange={(e) => setListingFormData({ ...listingFormData, isNearMetro: e.target.checked })} />
                    正地铁房 (&lt;500米)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!listingFormData.isSweetSpotLayout} onChange={(e) => setListingFormData({ ...listingFormData, isSweetSpotLayout: e.target.checked })} />
                    黄金主力户型 (80-110㎡)
                  </label>
                </div>
              </div>

              {/* Risk Discount Checkboxes */}
              <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#b91c1c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheckIcon size={16} color="#b91c1c" /> 瑕疵与风险折价因子勾选 (重算理性入手价)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: '#7f1d1d' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!listingFormData.hasAgeRisk} onChange={(e) => setListingFormData({ ...listingFormData, hasAgeRisk: e.target.checked })} />
                    房龄&gt;20年 (-10%)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!listingFormData.hasLayoutNoiseRisk} onChange={(e) => setListingFormData({ ...listingFormData, hasLayoutNoiseRisk: e.target.checked })} />
                    顶底楼/临高架噪音 (-10%)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!listingFormData.hasParkingPropertyRisk} onChange={(e) => setListingFormData({ ...listingFormData, hasParkingPropertyRisk: e.target.checked })} />
                    车位紧张/物业差 (-6%)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!listingFormData.hasMetroDistanceRisk} onChange={(e) => setListingFormData({ ...listingFormData, hasMetroDistanceRisk: e.target.checked })} />
                    离轨交&gt;1.5km (-8%)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', gridColumn: 'span 2' }}>
                    <input type="checkbox" checked={!!listingFormData.hasSchoolPolicyRisk} onChange={(e) => setListingFormData({ ...listingFormData, hasSchoolPolicyRisk: e.target.checked })} />
                    学区溢价剥离风险 (-15%)
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>上传/更新户型图照片</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>看房随手记与评价</label>
                <textarea rows={3} placeholder="记录采光、通风、噪音、业主卖房动机等..." value={listingFormData.notes} onChange={(e) => setListingFormData({ ...listingFormData, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsAddingListing(false);
                    setEditingListingId(null);
                  }}
                >
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSaveListingForm}>
                  {editingListingId ? '保存修改' : '保存房源'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
