import React, { useState, useEffect } from 'react';
import type { Community, RentSample } from '../types/community';
import { calculateCommunityAvgRentUnitPrice } from '../types/community';

interface CommunityFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  communityData: Partial<Community>;
  districts: string[];
  onSave: (data: Community) => void;
  onClose: () => void;
}

const COMMON_RING_LOCATIONS = ['内环内', '中内环', '中外环', '外环外'];
const COMMON_PLOT_RATIOS = [
  { val: 1.2, label: '1.2 洋房低密' },
  { val: 1.8, label: '1.8 标准舒适' },
  { val: 2.5, label: '2.5 常见高层' },
  { val: 3.2, label: '3.2 高密紧凑' },
];

export const CommunityFormModal: React.FC<CommunityFormModalProps> = ({
  isOpen,
  isEditing,
  communityData,
  districts,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<Community>>({});
  const [formError, setFormError] = useState<string>('');
  const [showAdvancedRent, setShowAdvancedRent] = useState<boolean>(false);
  const [sampleArea, setSampleArea] = useState<string>('');
  const [sampleRent, setSampleRent] = useState<string>('');
  const [sampleLayout, setSampleLayout] = useState<string>('');
  const [sampleNote, setSampleNote] = useState<string>('');
  const [sampleIsShengxinZu, setSampleIsShengxinZu] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        district: '浦东新区',
        sector: '',
        ringLocation: '中外环',
        name: '',
        builtYear: 2015,
        propertyFee: 3.0,
        propertyCompany: '',
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
        ...communityData,
      });
      setShowAdvancedRent(Boolean(communityData?.rentSamples && communityData.rentSamples.length > 0));
      setFormError('');
    }
  }, [isOpen, communityData]);

  if (!isOpen) return null;

  const handleAddSample = () => {
    const areaNum = parseFloat(sampleArea);
    const rentNum = parseFloat(sampleRent);
    if (!areaNum || !rentNum || areaNum <= 0 || rentNum <= 0) {
      alert('请填写有效的租赁面积与月租金');
      return;
    }

    const newSample: RentSample = {
      id: `rs-${Date.now()}`,
      area: areaNum,
      monthlyRent: rentNum,
      layout: sampleLayout || undefined,
      note: sampleNote || undefined,
      isShengxinZu: sampleIsShengxinZu,
    };

    const updatedSamples = [...(formData.rentSamples || []), newSample];
    const newAvg = calculateCommunityAvgRentUnitPrice(updatedSamples);

    setFormData((prev) => ({
      ...prev,
      rentSamples: updatedSamples,
      avgRentUnitPricePerSqm: newAvg,
    }));

    setSampleArea('');
    setSampleRent('');
    setSampleLayout('');
    setSampleNote('');
    setSampleIsShengxinZu(false);
  };

  const handleDeleteSample = (id: string) => {
    const updated = (formData.rentSamples || []).filter((s) => s.id !== id);
    const newAvg = calculateCommunityAvgRentUnitPrice(updated);
    setFormData((prev) => ({
      ...prev,
      rentSamples: updated,
      avgRentUnitPricePerSqm: newAvg,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFormError('请填写小区名称');
      return;
    }
    if (!formData.sector?.trim()) {
      setFormError('请填写所属板块（如：联洋板块 / 泗泾板块）');
      return;
    }

    const calculatedAvgRent = calculateCommunityAvgRentUnitPrice(formData.rentSamples);
    const userRentInput = Number(formData.avgRentUnitPricePerSqm);
    const effectiveAvgRent = userRentInput > 0 ? userRentInput : (calculatedAvgRent > 0 ? calculatedAvgRent : 0);

    const finalComm: Community = {
      id: formData.id || `comm-${Date.now()}`,
      name: formData.name.trim(),
      district: formData.district || '浦东新区',
      sector: formData.sector.trim(),
      ringLocation: formData.ringLocation || '中外环',
      builtYear: Number(formData.builtYear || 2015),
      propertyFee: Number(formData.propertyFee || 3.0),
      propertyCompany: formData.propertyCompany?.trim() || '',
      metroInfoText: formData.metroInfoText?.trim() || '',
      schoolInfo: formData.schoolInfo?.trim() || '',
      amenities: formData.amenities?.trim() || '',
      pros: formData.pros || [],
      cons: formData.cons || [],
      plotRatio: formData.plotRatio ? Number(formData.plotRatio) : 1.8,
      parkingRatio: formData.parkingRatio?.trim() || '1:1.1',
      parkingRentMonthly: formData.parkingRentMonthly ? Number(formData.parkingRentMonthly) : 400,
      askingAvgUnitPriceYuan: formData.askingAvgUnitPriceYuan ? Number(formData.askingAvgUnitPriceYuan) : undefined,
      dealAvgUnitPriceYuan: formData.dealAvgUnitPriceYuan ? Number(formData.dealAvgUnitPriceYuan) : undefined,
      rentSamples: formData.rentSamples || [],
      avgRentUnitPricePerSqm: effectiveAvgRent,
    };

    onSave(finalComm);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-modal-title"
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
            <h2 id="community-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {isEditing ? '✏️ 编辑小区档案' : '🏢 录入新意向小区'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              维护小区板块位置、容积率、车位比与配套画像
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

          {/* Group 1: Basic Identity */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📍 1. 小区名称与区位
            </legend>

            <div>
              <label htmlFor="comm-name" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                小区名称 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="comm-name"
                type="text"
                placeholder="如：联洋年华 / 泗水和鸣"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="comm-district" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  行政区
                </label>
                <select
                  id="comm-district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                >
                  {districts.filter((d) => d !== '全上海').map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="comm-sector" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  所属板块 <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="comm-sector"
                  type="text"
                  placeholder="如：联洋板块 / 泗泾板块"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="comm-ring" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  环线位置
                </label>
                <select
                  id="comm-ring"
                  value={formData.ringLocation}
                  onChange={(e) => setFormData({ ...formData, ringLocation: e.target.value })}
                >
                  {COMMON_RING_LOCATIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="comm-year" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  建筑年代 (年)
                </label>
                <input
                  id="comm-year"
                  type="number"
                  placeholder="如 2018"
                  value={formData.builtYear}
                  onChange={(e) => setFormData({ ...formData, builtYear: parseInt(e.target.value) || 2015 })}
                />
              </div>
            </div>
          </fieldset>

          {/* Group 2: Density & Parking */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏢 2. 容积率、车位与物业管理
            </legend>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="comm-plot-ratio" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  容积率 (密度与采光)
                </label>
                <span className="tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {formData.plotRatio}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {COMMON_PLOT_RATIOS.map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, plotRatio: item.val })}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: formData.plotRatio === item.val ? 'var(--primary-light)' : '#f1f5f9',
                      color: formData.plotRatio === item.val ? 'var(--primary)' : 'var(--text-muted)',
                      border: formData.plotRatio === item.val ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      fontWeight: formData.plotRatio === item.val ? 700 : 500,
                      minHeight: '32px',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="comm-parking-ratio" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  车位配比
                </label>
                <input
                  id="comm-parking-ratio"
                  type="text"
                  placeholder="如：1:1.1"
                  value={formData.parkingRatio}
                  onChange={(e) => setFormData({ ...formData, parkingRatio: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="comm-property-fee" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  物业费 (元/㎡/月)
                </label>
                <input
                  id="comm-property-fee"
                  type="number"
                  step="0.1"
                  placeholder="如：3.2"
                  value={formData.propertyFee}
                  onChange={(e) => setFormData({ ...formData, propertyFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </fieldset>

          {/* Group 3: Metro & Schools */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚇 3. 轨交交通与配套学区
            </legend>

            <div>
              <label htmlFor="comm-metro" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                轨交线路与距离
              </label>
              <input
                id="comm-metro"
                type="text"
                placeholder="如：9号线泗泾站 350米 / 2号线科技馆站 800米"
                value={formData.metroInfoText}
                onChange={(e) => setFormData({ ...formData, metroInfoText: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="comm-school" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                对口学校 / 学区
              </label>
              <input
                id="comm-school"
                type="text"
                placeholder="如：泗泾实验学校（九年一贯制）"
                value={formData.schoolInfo}
                onChange={(e) => setFormData({ ...formData, schoolInfo: e.target.value })}
              />
            </div>
          </fieldset>

          {/* Group 4: Market Price & Rental Unit Price Benchmark */}
          <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <legend style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💰 4. 租售行情与租金基准单价
            </legend>

            {/* Price Row: Asking, Deal, and Rent Unit Price */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div>
                <label htmlFor="comm-asking-price" style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  挂牌均价 (元/㎡)
                </label>
                <input
                  id="comm-asking-price"
                  type="number"
                  placeholder="如 82000"
                  value={formData.askingAvgUnitPriceYuan ?? ''}
                  onChange={(e) => setFormData({ ...formData, askingAvgUnitPriceYuan: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>

              <div>
                <label htmlFor="comm-deal-price" style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  成交均价 (元/㎡)
                </label>
                <input
                  id="comm-deal-price"
                  type="number"
                  placeholder="如 74000"
                  value={formData.dealAvgUnitPriceYuan ?? ''}
                  onChange={(e) => setFormData({ ...formData, dealAvgUnitPriceYuan: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>

              <div>
                <label htmlFor="comm-rent-unit-price" style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  小区租金单价 (元/㎡/月) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="comm-rent-unit-price"
                  type="number"
                  step="0.1"
                  placeholder="如 55.0"
                  value={formData.avgRentUnitPricePerSqm ?? ''}
                  onChange={(e) => setFormData({ ...formData, avgRentUnitPricePerSqm: e.target.value ? parseFloat(e.target.value) : 0 })}
                  style={{
                    borderColor: 'var(--primary)',
                    background: 'rgba(5, 150, 105, 0.03)',
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            {/* Quick Sample Sync Notice */}
            {(() => {
              const sampleAvg = calculateCommunityAvgRentUnitPrice(formData.rentSamples);
              if (sampleAvg > 0) {
                return (
                  <div
                    style={{
                      background: 'rgba(5, 150, 105, 0.06)',
                      border: '1px solid rgba(5, 150, 105, 0.2)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: 'var(--text-main)' }}>
                      📊 样本库当前包含 <strong>{formData.rentSamples?.length || 0}</strong> 条样本，加权均价为 <strong style={{ color: 'var(--primary)' }}>{sampleAvg} 元/㎡/月</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, avgRentUnitPricePerSqm: sampleAvg })}
                      style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      采用样本均价 ({sampleAvg})
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Collapsible Rent Sample Management */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAdvancedRent(!showAdvancedRent)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: 'none',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  📋 详细租房样本库录入 ({formData.rentSamples?.length || 0} 条样本)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                  {showAdvancedRent ? '收起 ▴' : '展开维护 ▾'}
                </span>
              </button>

              {showAdvancedRent && (
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Quick Add Sample Form */}
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                      + 添加新租房成交/在租样本
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder="面积 (㎡) *"
                        value={sampleArea}
                        onChange={(e) => setSampleArea(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="月租 (元/月) *"
                        value={sampleRent}
                        onChange={(e) => setSampleRent(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="户型 (如 2室1厅)"
                        value={sampleLayout}
                        onChange={(e) => setSampleLayout(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="备注 (如 贝壳在租/自如)"
                        value={sampleNote}
                        onChange={(e) => setSampleNote(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddSample}
                      style={{ minHeight: '34px', fontSize: '0.8rem', marginTop: '4px' }}
                    >
                      + 加入小区样本库并同步均价
                    </button>
                  </div>

                  {/* Sample List */}
                  {formData.rentSamples && formData.rentSamples.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {formData.rentSamples.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.775rem',
                          }}
                        >
                          <div>
                            <strong>{s.layout || '户型未填'}</strong> | {s.area}㎡ |{' '}
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                              {s.monthlyRent}元/月 ({Math.round(s.monthlyRent / s.area)}元/㎡)
                            </span>
                            {s.note && <span style={{ color: 'var(--text-dim)', marginLeft: '6px' }}>({s.note})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSample(s.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              fontSize: '0.8rem',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
            💾 {isEditing ? '保存小区修改' : '保存并录入小区'}
          </button>
        </footer>
      </div>
    </div>
  );
};
