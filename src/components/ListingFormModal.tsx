import React, { useState, useEffect } from 'react';
import type { HouseListing, Community } from '../types/community';
import { suggestMonthlyRentByCommunity, calculateCommunityAvgRentUnitPrice } from '../types/community';
import { DEFAULT_FLOORPLAN_SVG } from '../utils/communityStorage';

interface ListingFormModalProps {
  isOpen: boolean;
  editingListing: HouseListing | null;
  activeCommunity: Community | undefined;
  onSave: (listingData: HouseListing) => void;
  onClose: () => void;
}

const COMMON_LAYOUTS = ['1室1厅1卫', '2室1厅1卫', '2室2厅1卫', '3室2厅1卫', '3室2厅2卫', '4室2厅2卫'];
const COMMON_FLOORS = ['低楼层 (3/18)', '中楼层 (8/18)', '高楼层 (15/18)', '顶楼带露台', '底楼带花园'];
const COMMON_ORIENTATIONS = ['南北通透', '全朝南', '朝东', '朝西', '朝北'];
const RENOVATION_OPTIONS: Array<HouseListing['renovation']> = ['精装', '简装', '毛坯', '老旧需重装'];

export const ListingFormModal: React.FC<ListingFormModalProps> = ({
  isOpen,
  editingListing,
  activeCommunity,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<HouseListing>>({});
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editingListing) {
        setFormData({ ...editingListing });
      } else {
        const avgRent = activeCommunity?.avgRentUnitPricePerSqm || calculateCommunityAvgRentUnitPrice(activeCommunity?.rentSamples) || 50;
        const defaultRent = suggestMonthlyRentByCommunity(89, avgRent);
        setFormData({
          unitNumber: '',
          totalPrice: undefined,
          targetPrice: undefined,
          buildingArea: undefined,
          insideArea: undefined,
          layout: '3室2厅1卫',
          floorInfo: '中楼层 (8/18)',
          orientation: '南北通透',
          renovation: '精装',
          expectedMonthlyRent: defaultRent,
          floorplanUrl: DEFAULT_FLOORPLAN_SVG,
          rating: 5,
          notes: '',
          hasParkingSpace: false,
          parkingPriceWuan: undefined,
          isSubNew: true,
          isNearMetro: true,
          isSweetSpotLayout: true,
          hasAgeRisk: false,
          hasLayoutNoiseRisk: false,
          hasParkingPropertyRisk: false,
          hasMetroDistanceRisk: false,
          hasSchoolPolicyRisk: false,
        });
      }
      setFormError('');
    }
  }, [isOpen, editingListing, activeCommunity]);

  if (!isOpen) return null;

  const buildingArea = formData.buildingArea || 0;
  const totalPrice = formData.totalPrice || 0;
  const insideArea = formData.insideArea || 0;

  // Computed live metrics for real-time validation & feedback
  const calculatedUnitPrice = buildingArea > 0 ? Math.round((totalPrice * 10000) / buildingArea) : 0;
  const calculatedPracticalRatio = buildingArea > 0 && insideArea > 0 ? Math.round((insideArea / buildingArea) * 100) : 0;

  const handleSuggestRent = () => {
    if (activeCommunity && buildingArea > 0) {
      const avgRent = activeCommunity.avgRentUnitPricePerSqm || calculateCommunityAvgRentUnitPrice(activeCommunity.rentSamples) || 50;
      const suggested = suggestMonthlyRentByCommunity(buildingArea, avgRent);
      setFormData((prev) => ({ ...prev, expectedMonthlyRent: suggested }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, floorplanUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unitNumber?.trim()) {
      setFormError('请填写门牌/栋号（如：8号楼 1202室 或 8号楼中层）');
      return;
    }
    if (!formData.totalPrice || formData.totalPrice <= 0) {
      setFormError('请填写有效的挂牌总价');
      return;
    }
    if (!formData.buildingArea || formData.buildingArea <= 0) {
      setFormError('请填写有效的建筑面积');
      return;
    }

    const finalListing: HouseListing = {
      id: editingListing ? editingListing.id : `list-${Date.now()}`,
      communityId: activeCommunity?.id || 'comm-1',
      unitNumber: formData.unitNumber.trim(),
      totalPrice: Number(formData.totalPrice),
      targetPrice: Number(formData.targetPrice || formData.totalPrice),
      buildingArea: Number(formData.buildingArea),
      insideArea: Number(formData.insideArea || formData.buildingArea * 0.8),
      layout: formData.layout || '3室2厅1卫',
      floorInfo: formData.floorInfo || '中楼层',
      orientation: formData.orientation || '南北通透',
      renovation: formData.renovation || '精装',
      expectedMonthlyRent: Number(formData.expectedMonthlyRent || 0),
      floorplanUrl: formData.floorplanUrl || DEFAULT_FLOORPLAN_SVG,
      rating: Number(formData.rating || 5),
      notes: formData.notes || '',
      hasParkingSpace: Boolean(formData.hasParkingSpace),
      parkingPriceWuan: Number(formData.parkingPriceWuan || 0),
      isSubNew: Boolean(formData.isSubNew),
      isNearMetro: Boolean(formData.isNearMetro),
      isSweetSpotLayout: Boolean(formData.isSweetSpotLayout),
      hasAgeRisk: Boolean(formData.hasAgeRisk),
      hasLayoutNoiseRisk: Boolean(formData.hasLayoutNoiseRisk),
      hasParkingPropertyRisk: Boolean(formData.hasParkingPropertyRisk),
      hasMetroDistanceRisk: Boolean(formData.hasMetroDistanceRisk),
      hasSchoolPolicyRisk: Boolean(formData.hasSchoolPolicyRisk),
    };

    onSave(finalListing);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-modal-title"
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
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card animate-fade-in modal-card-mobile"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '92vh',
          height: '100%',
          background: '#ffffff',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          position: 'relative',
        }}
      >
        {/* Sticky Header */}
        <header
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          <div>
            <h2 id="listing-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {editingListing ? '✏️ 编辑房源档案' : '🏠 录入新房源信息'}
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              所属小区：<strong style={{ color: 'var(--primary)' }}>{activeCommunity?.name || '未知小区'}</strong> ({activeCommunity?.district} · {activeCommunity?.sector})
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="关闭弹窗"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.3rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              minHeight: '40px',
              minWidth: '40px',
            }}
          >
            ✕
          </button>
        </header>

        {/* Scrollable Form Body (Single scrollable container, unblocked) */}
        <form
          onSubmit={handleSubmit}
          className="modal-scroll-body"
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '18px 20px 80px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {formError && (
            <div
              role="alert"
              aria-live="polite"
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                border: '1px solid rgba(220, 38, 38, 0.2)',
              }}
            >
              ⚠️ {formError}
            </div>
          )}

          {/* Group 1: Basic Unit & Layout */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📍 1. 房源位置与户型结构
            </legend>

            <div>
              <label htmlFor="listing-unit-number" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                房号 / 栋号信息 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="listing-unit-number"
                type="text"
                placeholder="如：6号楼 1102室 或 8号楼中层西边套"
                value={formData.unitNumber || ''}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                required
              />
            </div>

            {/* Layout Quick Selector */}
            <div>
              <label htmlFor="listing-layout" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                户型格局
              </label>
              <input
                id="listing-layout"
                type="text"
                placeholder="如：3室2厅1卫"
                value={formData.layout || ''}
                onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                style={{ marginBottom: '6px' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {COMMON_LAYOUTS.map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => setFormData({ ...formData, layout })}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: formData.layout === layout ? 'var(--primary-light)' : '#f1f5f9',
                      color: formData.layout === layout ? 'var(--primary)' : 'var(--text-muted)',
                      border: formData.layout === layout ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      fontWeight: formData.layout === layout ? 700 : 500,
                      minHeight: '32px',
                    }}
                  >
                    {layout}
                  </button>
                ))}
              </div>
            </div>

            {/* Renovation 4-Grid Card Selector */}
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                装修状况
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {RENOVATION_OPTIONS.map((reno) => {
                  const isSelected = formData.renovation === reno;
                  return (
                    <button
                      key={reno}
                      type="button"
                      onClick={() => setFormData({ ...formData, renovation: reno })}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? 'var(--primary-light)' : '#f8fafc',
                        color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                        textAlign: 'center',
                        minHeight: '38px',
                      }}
                    >
                      {reno}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floor & Orientation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="listing-floor" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  楼层信息
                </label>
                <input
                  id="listing-floor"
                  type="text"
                  placeholder="如：中楼层 (8/18)"
                  value={formData.floorInfo || ''}
                  onChange={(e) => setFormData({ ...formData, floorInfo: e.target.value })}
                  style={{ marginBottom: '6px' }}
                />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {COMMON_FLOORS.slice(0, 3).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormData({ ...formData, floorInfo: f })}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {f.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="listing-orientation" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  朝向
                </label>
                <input
                  id="listing-orientation"
                  type="text"
                  placeholder="如：南北通透"
                  value={formData.orientation || ''}
                  onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
                  style={{ marginBottom: '6px' }}
                />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {COMMON_ORIENTATIONS.slice(0, 3).map((ori) => (
                    <button
                      key={ori}
                      type="button"
                      onClick={() => setFormData({ ...formData, orientation: ori })}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {ori}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* Group 2: Price & Area (With Live Calculations) */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💰 2. 价格、面积与租金测算
            </legend>

            {/* Price Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="listing-total-price" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  挂牌总价 (万元) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="listing-total-price"
                  type="number"
                  step="1"
                  placeholder="如 400"
                  value={formData.totalPrice ?? ''}
                  onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label htmlFor="listing-target-price" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  心理砍价底价 (万元)
                </label>
                <input
                  id="listing-target-price"
                  type="number"
                  step="1"
                  placeholder="如 370"
                  value={formData.targetPrice ?? ''}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Area Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="listing-building-area" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  建筑面积 (㎡) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="listing-building-area"
                  type="number"
                  step="0.5"
                  placeholder="如 89"
                  value={formData.buildingArea ?? ''}
                  onChange={(e) => setFormData({ ...formData, buildingArea: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label htmlFor="listing-inside-area" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  套内实用面积 (㎡)
                </label>
                <input
                  id="listing-inside-area"
                  type="number"
                  step="0.5"
                  placeholder="如 75"
                  value={formData.insideArea ?? ''}
                  onChange={(e) => setFormData({ ...formData, insideArea: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Live Calculation Metric Badge Banner */}
            <div
              style={{
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '0.825rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>折合挂牌单价：</span>
                <strong className="tabular-nums" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {calculatedUnitPrice > 0 ? calculatedUnitPrice.toLocaleString() : '—'} 元/㎡
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>实得率：</span>
                <strong className="tabular-nums" style={{ color: calculatedPracticalRatio >= 75 ? 'var(--primary)' : 'var(--warning)', fontSize: '0.95rem' }}>
                  {calculatedPracticalRatio > 0 ? `${calculatedPracticalRatio}%` : '—'}
                </strong>
              </div>
            </div>

            {/* Monthly Rent */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="listing-expected-rent" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  预估月租金 (元/月)
                </label>
                {activeCommunity && (
                  <button
                    type="button"
                    onClick={handleSuggestRent}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    💡 按小区租金单价测算
                  </button>
                )}
              </div>
              <input
                id="listing-expected-rent"
                type="number"
                step="100"
                placeholder="如 4500"
                value={formData.expectedMonthlyRent ?? ''}
                onChange={(e) => setFormData({ ...formData, expectedMonthlyRent: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              />
            </div>
          </fieldset>

          {/* Group 3: Parking Space */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚗 3. 车位产权与价格
            </legend>

            <label
              htmlFor="listing-has-parking"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: formData.hasParkingSpace ? 'rgba(5, 150, 105, 0.08)' : '#ffffff',
                border: formData.hasParkingSpace ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                id="listing-has-parking"
                type="checkbox"
                checked={formData.hasParkingSpace || false}
                onChange={(e) => setFormData({ ...formData, hasParkingSpace: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                本房源包含产权车位 (总价已含 / 随房出售)
              </span>
            </label>

            {formData.hasParkingSpace && (
              <div>
                <label htmlFor="listing-parking-price" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  车位估值 / 单独作价 (万元)
                </label>
                <input
                  id="listing-parking-price"
                  type="number"
                  step="1"
                  placeholder="如 15"
                  value={formData.parkingPriceWuan ?? ''}
                  onChange={(e) => setFormData({ ...formData, parkingPriceWuan: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                />
              </div>
            )}
          </fieldset>

          {/* Group 4: Liquidity Tags & Risk Checklist */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚡ 4. 户型通透流动性与硬伤折价排查
            </legend>

            {/* Sweet Spot Liquidity Checklist */}
            <div style={{
              background: '#f8fafc',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🌟 流动性硬通货特征 (抗跌溢价加分项)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* isSubNew */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.isSubNew ? 'rgba(5, 150, 105, 0.08)' : '#ffffff',
                  border: formData.isSubNew ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isSubNew || false}
                    onChange={(e) => setFormData({ ...formData, isSubNew: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>次新房品质</span>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>楼龄 ≤ 10年</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      外立面完好、人车分流、物业管理优质，未来二手流动性高
                    </div>
                  </div>
                </label>

                {/* isNearMetro */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.isNearMetro ? 'rgba(5, 150, 105, 0.08)' : '#ffffff',
                  border: formData.isNearMetro ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isNearMetro || false}
                    onChange={(e) => setFormData({ ...formData, isNearMetro: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>正轨交房</span>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>步行 ≤ 600米</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      真实步行可达地铁站，非公交接驳盘，刚需白领租售硬通货
                    </div>
                  </div>
                </label>

                {/* isSweetSpotLayout */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.isSweetSpotLayout ? 'rgba(5, 150, 105, 0.08)' : '#ffffff',
                  border: formData.isSweetSpotLayout ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isSweetSpotLayout || false}
                    onChange={(e) => setFormData({ ...formData, isSweetSpotLayout: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>主力通透格局</span>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>通透 / 边套全明</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      南北通透、客餐厅一体、双卧朝南或经典飞机户型，无暗间
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Risk Discount Checklist */}
            <div style={{
              background: '#fff8f8',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⚠️ 显著硬伤折价排查 (自动计入建议砍价空间)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* hasAgeRisk */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.hasAgeRisk ? 'rgba(220, 38, 38, 0.08)' : '#ffffff',
                  border: formData.hasAgeRisk ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.hasAgeRisk || false}
                    onChange={(e) => setFormData({ ...formData, hasAgeRisk: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--danger)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>超20年老破小 / 老破大</span>
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>折价 -10%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      商业贷款年限受限，水暖管道老化，无电梯或物业维护缺失
                    </div>
                  </div>
                </label>

                {/* hasLayoutNoiseRisk */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.hasLayoutNoiseRisk ? 'rgba(220, 38, 38, 0.08)' : '#ffffff',
                  border: formData.hasLayoutNoiseRisk ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.hasLayoutNoiseRisk || false}
                    onChange={(e) => setFormData({ ...formData, hasLayoutNoiseRisk: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--danger)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>高架噪音 / 变电站 / 异形手枪户型</span>
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>折价 -8%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      主干道噪音粉尘、异形缺角浪费面积、或采光常年被高楼遮挡
                    </div>
                  </div>
                </label>

                {/* hasParkingPropertyRisk */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.hasParkingPropertyRisk ? 'rgba(220, 38, 38, 0.08)' : '#ffffff',
                  border: formData.hasParkingPropertyRisk ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.hasParkingPropertyRisk || false}
                    onChange={(e) => setFormData({ ...formData, hasParkingPropertyRisk: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--danger)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>无固定车位极度难停 / 物业管理混乱</span>
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>折价 -5%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      车位配比严重不足(&lt;1:0.5)，下班抢车位，垃圾清运不及时
                    </div>
                  </div>
                </label>

                {/* hasMetroDistanceRisk */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.hasMetroDistanceRisk ? 'rgba(220, 38, 38, 0.08)' : '#ffffff',
                  border: formData.hasMetroDistanceRisk ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.hasMetroDistanceRisk || false}
                    onChange={(e) => setFormData({ ...formData, hasMetroDistanceRisk: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--danger)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>轨交距离 &gt; 1.5公里 (假轨交房)</span>
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>折价 -5%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      步行时间 &gt; 20分钟，依赖公交或电瓶车接驳，恶劣天气通勤困难
                    </div>
                  </div>
                </label>

                {/* hasSchoolPolicyRisk */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: formData.hasSchoolPolicyRisk ? 'rgba(220, 38, 38, 0.08)' : '#ffffff',
                  border: formData.hasSchoolPolicyRisk ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.hasSchoolPolicyRisk || false}
                    onChange={(e) => setFormData({ ...formData, hasSchoolPolicyRisk: e.target.checked })}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--danger)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>学区超额预警 / 五年一户名额被占</span>
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>折价 -10%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      落户年限不够面临被统筹分流，或前业主学额尚未释放
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </fieldset>

          {/* Group 5: Floorplan & Notes */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🖼️ 5. 户型图与看房笔记
            </legend>

            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                户型图上传 (支持 JPG / PNG)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ padding: '8px', fontSize: '0.85rem' }}
              />
              {formData.floorplanUrl && (
                <div style={{ marginTop: '8px', width: '100%', height: '140px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={formData.floorplanUrl} alt="户型预览" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="listing-notes" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                看房随手记与现场发现
              </label>
              <textarea
                id="listing-notes"
                rows={3}
                placeholder="记录采光遮挡、通风、噪音、业主出国急售等私聊内幕…"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </fieldset>
        </form>

        {/* Sticky Bottom Action Bar (Unobstructed, pinned at bottom) */}
        <footer
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--border-color)',
            padding: '12px 20px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ minHeight: '44px', padding: '10px 20px', borderRadius: '10px' }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            style={{ minHeight: '44px', flex: 1, padding: '10px 24px', borderRadius: '10px', fontWeight: 700 }}
          >
            💾 {editingListing ? '保存房源修改' : '保存并录入房源'}
          </button>
        </footer>
      </div>
    </div>
  );
};
