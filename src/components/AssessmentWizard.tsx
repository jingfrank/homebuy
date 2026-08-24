import React, { useState } from 'react';
import type { UserInputData, PredictionAssessment } from '../types/prediction';
import { evaluateHomePurchaseTiming } from '../utils/calculator';
import { ScoreGauge } from './ScoreGauge';
import {
  DollarSignIcon,
  HomeIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  PrinterIcon,
} from './Icons';

const STORAGE_WIZARD_KEY = 'homebuy_assessment_wizard_v1';

const defaultInputs: UserInputData = {
  annualIncome: 37.5, // 万元/年
  currentSavings: 80, // 万元
  targetHousePrice: 350, // 350万元
  monthlyDebt: 0, // 元/月
  monthlyRent: 4200, // 4200元/月
  careerStability: 'high',
  emergencyReserveMonths: 6,
  purpose: 'first_home',
  hasUrgentNeedIn2Years: true,
  cityTier: 'tier1',
  downPaymentRatio: 0.2, // 20%
  mortgageRate: 3.15, // 3.15%
  loanTermYears: 30,
  inventoryCycleMonths: 18,
  priceNegotiationSpace: 'high',
};

function getStoredInputs(): UserInputData {
  try {
    const raw = localStorage.getItem(STORAGE_WIZARD_KEY);
    if (!raw) return defaultInputs;
    const parsed = JSON.parse(raw);
    return { ...defaultInputs, ...parsed };
  } catch {
    return defaultInputs;
  }
}

export const AssessmentWizard: React.FC = () => {
  const [inputs, setInputs] = useState<UserInputData>(() => getStoredInputs());
  const [assessment, setAssessment] = useState<PredictionAssessment>(() =>
    evaluateHomePurchaseTiming(inputs)
  );

  const handleInputChange = (field: keyof UserInputData, value: any) => {
    const updated = { ...inputs, [field]: value };
    setInputs(updated);
    setAssessment(evaluateHomePurchaseTiming(updated));

    try {
      localStorage.setItem(STORAGE_WIZARD_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save assessment inputs to localStorage', e);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const calculatedDownPayment = Number((inputs.targetHousePrice * inputs.downPaymentRatio).toFixed(1));
  const calculatedLoanAmount = Number((inputs.targetHousePrice - calculatedDownPayment).toFixed(1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderLeft: '5px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <SparklesIcon color="var(--primary)" size={24} aria-hidden="true" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                智能买房时机多维度诊断系统
              </h2>
              <span className="badge badge-primary">实时动态测算</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              结合家庭现金储备防线、目标城市供需去化周期、房贷利率及刚需迫切度，全方位测算“当下是否适合买房”。
            </p>
          </div>

          <button className="btn btn-secondary" onClick={handlePrintReport}>
            <PrinterIcon size={16} aria-hidden="true" /> 导出评估报告
          </button>
        </div>
      </div>

      {/* Main Workspace (Asymmetric Split: Left Form Controls, Right Sticky Dashboard) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Interactive Form Parameter Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Financial & Reserve */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                color: 'var(--text-main)',
              }}
            >
              <DollarSignIcon color="var(--primary)" size={20} aria-hidden="true" />
              1. 个人与家庭财务资金储备
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Annual Income */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="annual-income" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    家庭年总可支配收入（万元/年）
                  </label>
                  <span className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {inputs.annualIncome} 万元/年
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>
                      (月均 {Math.round((inputs.annualIncome * 10000) / 12).toLocaleString()} 元)
                    </span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    step={0.5}
                    value={inputs.annualIncome}
                    onChange={(e) => handleInputChange('annualIncome', parseFloat(e.target.value) || 0)}
                    style={{ flex: 1 }}
                  />
                  <input
                    id="annual-income"
                    type="number"
                    value={inputs.annualIncome}
                    onChange={(e) => handleInputChange('annualIncome', parseFloat(e.target.value) || 0)}
                    style={{ width: '90px', padding: '6px 10px', textAlign: 'right' }}
                  />
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[20, 35, 50, 80, 120].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleInputChange('annualIncome', val)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: inputs.annualIncome === val ? 'var(--primary-light)' : '#f1f5f9',
                        color: inputs.annualIncome === val ? 'var(--primary)' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        fontWeight: inputs.annualIncome === val ? 700 : 500,
                      }}
                    >
                      {val}万
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Cash Savings */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="current-savings" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    当前可动用现金储备（万元）
                  </label>
                  <span className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {inputs.currentSavings} 万元
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={5}
                    value={inputs.currentSavings}
                    onChange={(e) => handleInputChange('currentSavings', parseFloat(e.target.value) || 0)}
                    style={{ flex: 1 }}
                  />
                  <input
                    id="current-savings"
                    type="number"
                    value={inputs.currentSavings}
                    onChange={(e) => handleInputChange('currentSavings', parseFloat(e.target.value) || 0)}
                    style={{ width: '90px', padding: '6px 10px', textAlign: 'right' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[30, 50, 80, 120, 200, 300].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleInputChange('currentSavings', val)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: inputs.currentSavings === val ? 'var(--primary-light)' : '#f1f5f9',
                        color: inputs.currentSavings === val ? 'var(--primary)' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        fontWeight: inputs.currentSavings === val ? 700 : 500,
                      }}
                    >
                      {val}万
                    </button>
                  ))}
                </div>
              </div>

              {/* Target House Price */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="target-price" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    意向购买房产总价（万元）
                  </label>
                  <span className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {inputs.targetHousePrice} 万元
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="range"
                    min={50}
                    max={1500}
                    step={10}
                    value={inputs.targetHousePrice}
                    onChange={(e) => handleInputChange('targetHousePrice', parseFloat(e.target.value) || 0)}
                    style={{ flex: 1 }}
                  />
                  <input
                    id="target-price"
                    type="number"
                    value={inputs.targetHousePrice}
                    onChange={(e) => handleInputChange('targetHousePrice', parseFloat(e.target.value) || 0)}
                    style={{ width: '90px', padding: '6px 10px', textAlign: 'right' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[200, 350, 500, 700, 900, 1200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleInputChange('targetHousePrice', val)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: inputs.targetHousePrice === val ? 'var(--primary-light)' : '#f1f5f9',
                        color: inputs.targetHousePrice === val ? 'var(--primary)' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        fontWeight: inputs.targetHousePrice === val ? 700 : 500,
                      }}
                    >
                      {val}万
                    </button>
                  ))}
                </div>
              </div>

              {/* Down Payment & Career Stability */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="down-payment-ratio" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    首付比例 (首付{calculatedDownPayment}万/贷{calculatedLoanAmount}万)
                  </label>
                  <select
                    id="down-payment-ratio"
                    value={inputs.downPaymentRatio}
                    onChange={(e) => handleInputChange('downPaymentRatio', parseFloat(e.target.value))}
                  >
                    <option value={0.15}>15% (最低首付 {Number((inputs.targetHousePrice * 0.15).toFixed(1))}万)</option>
                    <option value={0.2}>20% (二成首付 {Number((inputs.targetHousePrice * 0.2).toFixed(1))}万)</option>
                    <option value={0.3}>30% (三成首付 {Number((inputs.targetHousePrice * 0.3).toFixed(1))}万)</option>
                    <option value={0.4}>40% (四成首付 {Number((inputs.targetHousePrice * 0.4).toFixed(1))}万)</option>
                    <option value={0.5}>50% (五成首付 {Number((inputs.targetHousePrice * 0.5).toFixed(1))}万)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="career-stability" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    职业与行业稳定性
                  </label>
                  <select
                    id="career-stability"
                    value={inputs.careerStability}
                    onChange={(e) => handleInputChange('careerStability', e.target.value)}
                  >
                    <option value="high">🟢 高 (体制内/国央企/稳健)</option>
                    <option value="medium">🟡 中 (成熟企业/平稳行业)</option>
                    <option value="low">🔴 低 (高波动/创业/易替换)</option>
                  </select>
                </div>
              </div>

              {/* Monthly Debt & Monthly Rent */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="monthly-debt" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    非房月负债（元/月）
                  </label>
                  <input
                    id="monthly-debt"
                    type="number"
                    value={inputs.monthlyDebt}
                    onChange={(e) => handleInputChange('monthlyDebt', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label htmlFor="monthly-rent" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    当前月租金支出（元/月）
                  </label>
                  <input
                    id="monthly-rent"
                    type="number"
                    value={inputs.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Need & Market Environment */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                color: 'var(--text-main)',
              }}
            >
              <HomeIcon color="var(--primary)" size={20} aria-hidden="true" />
              2. 刚需用途与目标楼市环境
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="purchase-purpose" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    主要购房目的
                  </label>
                  <select
                    id="purchase-purpose"
                    value={inputs.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                  >
                    <option value="first_home">自住首套刚需</option>
                    <option value="marriage">结婚置业强需</option>
                    <option value="education">孩子入学学区</option>
                    <option value="upgrade">改善置换升级</option>
                    <option value="investment">资产保值投资</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="city-tier" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    目标城市级别
                  </label>
                  <select
                    id="city-tier"
                    value={inputs.cityTier}
                    onChange={(e) => handleInputChange('cityTier', e.target.value)}
                  >
                    <option value="tier1">一线城市 (沪/京/深/穗)</option>
                    <option value="new_tier1">新一线 (杭/蓉/汉/苏等)</option>
                    <option value="tier2">强二线城市</option>
                    <option value="tier3_4">三四线城市/县城</option>
                  </select>
                </div>
              </div>

              {/* Mortgage Rate */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="mortgage-rate" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    预估房贷执行利率 (年化 %)
                  </label>
                  <span className="tabular-nums" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {inputs.mortgageRate}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="range"
                    min={2.5}
                    max={4.5}
                    step={0.05}
                    value={inputs.mortgageRate}
                    onChange={(e) => handleInputChange('mortgageRate', parseFloat(e.target.value) || 0)}
                    style={{ flex: 1 }}
                  />
                  <input
                    id="mortgage-rate"
                    type="number"
                    step="0.05"
                    value={inputs.mortgageRate}
                    onChange={(e) => handleInputChange('mortgageRate', parseFloat(e.target.value) || 0)}
                    style={{ width: '80px', padding: '6px 10px', textAlign: 'right' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[2.85, 3.0, 3.15, 3.35, 3.65].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleInputChange('mortgageRate', val)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: inputs.mortgageRate === val ? 'var(--primary-light)' : '#f1f5f9',
                        color: inputs.mortgageRate === val ? 'var(--primary)' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        fontWeight: inputs.mortgageRate === val ? 700 : 500,
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Inventory Cycle & Price Space */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="inventory-cycle" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    目标板块去化周期
                  </label>
                  <select
                    id="inventory-cycle"
                    value={inputs.inventoryCycleMonths}
                    onChange={(e) => handleInputChange('inventoryCycleMonths', parseInt(e.target.value))}
                  >
                    <option value={8}>&lt; 12个月 (紧俏求大于供)</option>
                    <option value={15}>12 - 18个月 (供需基本平衡)</option>
                    <option value={24}>&gt; 18个月 (典型买方市场)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="price-space" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    业主/开发商议价空间
                  </label>
                  <select
                    id="price-space"
                    value={inputs.priceNegotiationSpace}
                    onChange={(e) => handleInputChange('priceNegotiationSpace', e.target.value)}
                  >
                    <option value="high">大 (&gt; 8% 砍价空间)</option>
                    <option value="medium">中 (5% - 8% 议价空间)</option>
                    <option value="low">小 (&lt; 5% 态度坚挺)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Real-time Sticky Assessment Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '88px' }}>
          {/* Gauge & Main Verdict */}
          <ScoreGauge
            score={assessment.totalScore}
            signal={assessment.recommendationSignal}
            title={assessment.recommendationTitle}
          />

          {/* Core Quantitative Metrics */}
          <div
            className="glass-card"
            style={{
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              textAlign: 'center',
              background: '#ffffff',
            }}
          >
            <div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                预估月供 (30年)
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                {assessment.mortgage.monthlyPayment}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: '2px' }}>元/月</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                月供收入比 (DTI)
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color:
                    assessment.mortgage.dtiRatio <= 40
                      ? 'var(--success)'
                      : assessment.mortgage.dtiRatio <= 50
                      ? 'var(--warning)'
                      : 'var(--danger)',
                }}
              >
                {assessment.mortgage.dtiRatio}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                购房后剩余现金
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: assessment.mortgage.remainingReserve >= 0 ? 'var(--primary)' : 'var(--danger)',
                }}
              >
                {assessment.mortgage.remainingReserve}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: '2px' }}>万元</span>
              </div>
            </div>
          </div>

          {/* 3 Key Dimension Breakdown Bars */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
            <h4
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                marginBottom: '16px',
                color: 'var(--text-main)',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
              }}
            >
              三大核心评估维度得分
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Financial Dimension (45%) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    💰 {assessment.dimensions.financial.name} (权重 45%)
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontWeight: 800,
                      color: assessment.dimensions.financial.score >= 75 ? 'var(--success)' : 'var(--warning)',
                    }}
                  >
                    {assessment.dimensions.financial.score} 分
                  </span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${assessment.dimensions.financial.score}%`,
                      background: assessment.dimensions.financial.score >= 75 ? 'var(--success)' : 'var(--warning)',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
                <ul style={{ paddingLeft: '18px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {assessment.dimensions.financial.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              {/* Market Dimension (30%) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    📈 {assessment.dimensions.market.name} (权重 30%)
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontWeight: 800,
                      color: assessment.dimensions.market.score >= 70 ? 'var(--success)' : 'var(--warning)',
                    }}
                  >
                    {assessment.dimensions.market.score} 分
                  </span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${assessment.dimensions.market.score}%`,
                      background: 'var(--accent-cyan)',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
                <ul style={{ paddingLeft: '18px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {assessment.dimensions.market.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              {/* Need Dimension (25%) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    🏠 {assessment.dimensions.need.name} (权重 25%)
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {assessment.dimensions.need.score} 分
                  </span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${assessment.dimensions.need.score}%`,
                      background: 'var(--primary)',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
                <ul style={{ paddingLeft: '18px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {assessment.dimensions.need.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Customized Action Plan & Risk Mitigation Roadmap */}
      <div className="glass-card" style={{ padding: '26px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheckIcon color="var(--primary)" size={24} aria-hidden="true" />
            定制化买房决策建议与避坑策略
          </h3>
          <span className="badge badge-primary">
            建议行动窗口：{assessment.optimalTimeWindow}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Key Risks Mitigation */}
          <div
            style={{
              background: 'var(--danger-bg)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--danger)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangleIcon size={20} aria-hidden="true" />
              关键避坑与风险控制防线
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assessment.keyRisks.map((risk, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.55,
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ color: 'var(--danger)', fontWeight: 800 }}>•</span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Roadmap */}
          <div
            style={{
              background: 'var(--primary-light)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(5, 150, 105, 0.2)',
            }}
          >
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircleIcon size={20} aria-hidden="true" />
              建议买房行动路径规划
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assessment.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    lineHeight: 1.55,
                  }}
                >
                  <span
                    style={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
