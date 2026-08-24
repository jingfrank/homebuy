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
      document.body.style.overflow = 'hidden';
      if (editingListing) {
        setFormData({ ...editingListing });
      } else {
        const avgRent = activeCommunity?.avgRentUnitPricePerSqm || calculateCommunityAvgRentUnitPrice(activeCommunity?.rentSamples) || 50;
        const defaultRent = suggestMonthlyRentByCommunity(89, avgRent);
        setFormData({
          unitNumber: '',
          totalPrice: 400,
          targetPrice: 370,
          buildingArea: 89,
          insideArea: 75,
          layout: '3室2厅1卫',
          floorInfo: '中楼层 (8/18)',
          orientation: '南北通透',
          renovation: '精装',
          expectedMonthlyRent: defaultRent,
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
      }
      setFormError('');
      return () => {
        document.body.style.overflow = '';
      };
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
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h2 id="listing-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {editingListing ? '✏️ 编辑房源档案' : '🏠 录入新房源'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              所属小区：<strong style={{ color: 'var(--primary)' }}>{activeCommunity?.name || '未知小区'}</strong>
              {activeCommunity?.district && ` · ${activeCommunity.district}`}
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

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="modal-scroll-body"
          style={{
            padding: '20px 22px 100px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
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

          {/* Group 1: Unit & Layout */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📌 1. 栋号、格局与装修
            </legend>

            <div>
              <label htmlFor="listing-unit-number" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                栋号 / 门牌号 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="listing-unit-number"
                type="text"
                placeholder="如：8号楼 1202室 (或 8号楼中层)"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                required
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                💡 提示：链家/贝壳出于隐私默认隐藏房号，可先填写“8号楼中层”或向中介询问。
              </span>
            </div>

            {/* Layout Quick-Pick */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="listing-layout" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  户型格局
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>快捷点选：</span>
              </div>
              <input
                id="listing-layout"
                type="text"
                value={formData.layout}
                onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                placeholder="如：3室2厅1卫"
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {COMMON_LAYOUTS.map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => setFormData({ ...formData, layout })}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
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
                  value={formData.floorInfo}
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
                  value={formData.orientation}
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
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
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
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: parseFloat(e.target.value) || 0 })}
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
                  value={formData.buildingArea}
                  onChange={(e) => setFormData({ ...formData, buildingArea: parseFloat(e.target.value) || 0 })}
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
                  value={formData.insideArea}
                  onChange={(e) => setFormData({ ...formData, insideArea: parseFloat(e.target.value) || 0 })}
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
                  {calculatedUnitPrice.toLocaleString()} 元/㎡
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>实得率：</span>
                <strong className="tabular-nums" style={{ color: calculatedPracticalRatio >= 75 ? 'var(--primary)' : 'var(--warning)', fontSize: '0.95rem' }}>
                  {calculatedPracticalRatio}%
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
                      background: 'var(--primary-light)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(5, 150, 105, 0.2)',
                    }}
                  >
                    ⚡ 按小区均价自动推算
                  </button>
                )}
              </div>
              <input
                id="listing-expected-rent"
                type="number"
                step="100"
                value={formData.expectedMonthlyRent}
                onChange={(e) => setFormData({ ...formData, expectedMonthlyRent: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </fieldset>

          {/* Group 3: Parking Space */}
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚗 3. 车位与产权
            </legend>
            <div
              style={{
                background: formData.hasParkingSpace ? 'var(--primary-light)' : '#f8fafc',
                padding: '14px',
                borderRadius: '12px',
                border: formData.hasParkingSpace ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                <input
                  type="checkbox"
                  checked={!!formData.hasParkingSpace}
                  onChange={(e) => setFormData({ ...formData, hasParkingSpace: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                本房源包含 / 赠送产权地下车位
              </label>

              {formData.hasParkingSpace && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <label htmlFor="parking-price" style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    车位打包估值 (万元)：
                  </label>
                  <input
                    id="parking-price"
                    type="number"
                    value={formData.parkingPriceWuan}
                    onChange={(e) => setFormData({ ...formData, parkingPriceWuan: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100px', padding: '6px 10px' }}
                  />
                </div>
              )}
            </div>
          </fieldset>

          {/* Group 4: Liquidity Highlights & Risk Checks (Big Tactile Chips) */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚡ 4. 流动性优势与缺陷排查 (点击增删)
            </legend>

            {/* Positive Highlights */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>
                ✨ 优势亮点 (加分项)：
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'isSubNew', label: '✨ 10年内次新房' },
                  { key: 'isNearMetro', label: '🚇 步行500m正地铁房' },
                  { key: 'isSweetSpotLayout', label: '📐 80-110㎡黄金主力户型' },
                ].map((item) => {
                  const isChecked = Boolean((formData as any)[item.key]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, [item.key]: !isChecked })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: isChecked ? 700 : 500,
                        background: isChecked ? 'var(--primary)' : '#f1f5f9',
                        color: isChecked ? '#ffffff' : 'var(--text-muted)',
                        border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        minHeight: '34px',
                      }}
                    >
                      {isChecked ? `✓ ${item.label}` : `+ ${item.label}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Risk Discount Factors */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)', display: 'block', marginBottom: '6px' }}>
                ⚠️ 缺陷与风险扣减项 (建议砍价)：
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'hasAgeRisk', label: '⚠️ 房龄>20年 (-10%)' },
                  { key: 'hasLayoutNoiseRisk', label: '⚠️ 临高架/顶底楼/暗卫 (-10%)' },
                  { key: 'hasParkingPropertyRisk', label: '⚠️ 车位紧张/物业差 (-6%)' },
                  { key: 'hasMetroDistanceRisk', label: '⚠️ 离轨交>1.5km (-8%)' },
                  { key: 'hasSchoolPolicyRisk', label: '⚠️ 学区溢价剥离风险 (-15%)' },
                ].map((item) => {
                  const isChecked = Boolean((formData as any)[item.key]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, [item.key]: !isChecked })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: isChecked ? 700 : 500,
                        background: isChecked ? 'var(--danger-bg)' : '#f1f5f9',
                        color: isChecked ? 'var(--danger)' : 'var(--text-muted)',
                        border: isChecked ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                        minHeight: '34px',
                      }}
                    >
                      {isChecked ? `✓ ${item.label}` : `+ ${item.label}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </fieldset>

          {/* Group 5: Photo & Notes */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📷 5. 户型图与看房随记
            </legend>

            <div>
              <label htmlFor="listing-floorplan" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                上传/更新户型图照片
              </label>
              <input
                id="listing-floorplan"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ padding: '8px' }}
              />
            </div>

            <div>
              <label htmlFor="listing-notes" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                看房随手记与现场发现
              </label>
              <textarea
                id="listing-notes"
                rows={3}
                placeholder="记录采光遮挡、通风、噪音、业主出国急售等私聊内幕…"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </fieldset>
        </form>

        {/* Sticky Bottom Action Bar (Thumb-Friendly on Mobile) */}
        <footer
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--border-color)',
            padding: '12px 22px',
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
