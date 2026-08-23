import React, { useState, useEffect } from 'react';
import { generateAmortizationSchedule } from '../utils/calculator';
import { CalculatorIcon, AlertTriangleIcon } from './Icons';

const STORAGE_MORTGAGE_KEY = 'homebuy_mortgage_calc_v2';

interface StoredMortgageData {
  totalHousePriceWuan: number;
  downPaymentRatio: number;
  providentLoanWuan: number;
  providentRatePct: number;
  commercialLoanWuan: number;
  commercialRatePct: number;
  loanYears: number;
  repaymentType: 'equal_payment' | 'equal_principal';
  monthlyIncomeYuan: number;
  liquidEmergencySavingsWuan: number;
  incomeDropPct: number;
}

const defaultMortgageData: StoredMortgageData = {
  totalHousePriceWuan: 240,
  downPaymentRatio: 0.2, // 20%
  providentLoanWuan: 50,
  providentRatePct: 2.6,
  commercialLoanWuan: 142,
  commercialRatePct: 3.05,
  loanYears: 30,
  repaymentType: 'equal_payment',
  monthlyIncomeYuan: 25000,
  liquidEmergencySavingsWuan: 30,
  incomeDropPct: 20,
};

function getStoredMortgageData(): StoredMortgageData {
  try {
    const raw = localStorage.getItem(STORAGE_MORTGAGE_KEY);
    if (!raw) return defaultMortgageData;
    const parsed = JSON.parse(raw);
    return { ...defaultMortgageData, ...parsed };
  } catch {
    return defaultMortgageData;
  }
}

export const MortgageCalculatorSection: React.FC = () => {
  const initial = getStoredMortgageData();

  // 1. Step 1: House Price & Down Payment
  const [totalHousePriceWuan, setTotalHousePriceWuan] = useState<number>(initial.totalHousePriceWuan);
  const [downPaymentRatio, setDownPaymentRatio] = useState<number>(initial.downPaymentRatio);

  // Derived loan values
  const downPaymentWuan = Math.round((totalHousePriceWuan * downPaymentRatio) * 10) / 10;
  const totalLoanNeededWuan = Math.max(0, Math.round((totalHousePriceWuan - downPaymentWuan) * 10) / 10);

  // 2. Step 2: Provident Fund & Commercial Loan
  const [providentLoanWuan, setProvidentLoanWuan] = useState<number>(initial.providentLoanWuan);
  const [providentRatePct, setProvidentRatePct] = useState<number>(initial.providentRatePct);

  const [commercialLoanWuan, setCommercialLoanWuan] = useState<number>(initial.commercialLoanWuan);
  const [commercialRatePct, setCommercialRatePct] = useState<number>(initial.commercialRatePct);

  const [loanYears, setLoanYears] = useState<number>(initial.loanYears);
  const [repaymentType, setRepaymentType] = useState<'equal_payment' | 'equal_principal'>(initial.repaymentType);

  // Auto-sync commercial loan when total house price, down payment, or provident loan changes
  const handleHousePriceChange = (price: number) => {
    setTotalHousePriceWuan(price);
    const newNeeded = Math.max(0, price * (1 - downPaymentRatio));
    setCommercialLoanWuan(Math.max(0, Math.round((newNeeded - providentLoanWuan) * 10) / 10));
  };

  const handleDownPaymentRatioChange = (ratio: number) => {
    setDownPaymentRatio(ratio);
    const newNeeded = Math.max(0, totalHousePriceWuan * (1 - ratio));
    setCommercialLoanWuan(Math.max(0, Math.round((newNeeded - providentLoanWuan) * 10) / 10));
  };

  const handleProvidentLoanChange = (provident: number) => {
    setProvidentLoanWuan(provident);
    setCommercialLoanWuan(Math.max(0, Math.round((totalLoanNeededWuan - provident) * 10) / 10));
  };

  // 3. Stress test input
  const [monthlyIncomeYuan, setMonthlyIncomeYuan] = useState<number>(initial.monthlyIncomeYuan);
  const [liquidEmergencySavingsWuan, setLiquidEmergencySavingsWuan] = useState<number>(initial.liquidEmergencySavingsWuan);
  const [incomeDropPct, setIncomeDropPct] = useState<number>(initial.incomeDropPct);

  // Auto-save state changes to localStorage
  useEffect(() => {
    try {
      const dataToSave: StoredMortgageData = {
        totalHousePriceWuan,
        downPaymentRatio,
        providentLoanWuan,
        providentRatePct,
        commercialLoanWuan,
        commercialRatePct,
        loanYears,
        repaymentType,
        monthlyIncomeYuan,
        liquidEmergencySavingsWuan,
        incomeDropPct,
      };
      localStorage.setItem(STORAGE_MORTGAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save mortgage data to localStorage', e);
    }
  }, [
    totalHousePriceWuan,
    downPaymentRatio,
    providentLoanWuan,
    providentRatePct,
    commercialLoanWuan,
    commercialRatePct,
    loanYears,
    repaymentType,
    monthlyIncomeYuan,
    liquidEmergencySavingsWuan,
    incomeDropPct,
  ]);

  // State for Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [selectedScheduleYear, setSelectedScheduleYear] = useState<number>(0); // 0 = 全部 360 期

  // 核心房贷逐期计算
  const mortgageCalc = generateAmortizationSchedule(
    commercialLoanWuan,
    commercialRatePct,
    providentLoanWuan,
    providentRatePct,
    loanYears,
    repaymentType
  );

  // 对比参考计算（如果选了等额本金，计算等额本息作为参考比对，反之亦然）
  const comparisonCalc = generateAmortizationSchedule(
    commercialLoanWuan,
    commercialRatePct,
    providentLoanWuan,
    providentRatePct,
    loanYears,
    repaymentType === 'equal_payment' ? 'equal_principal' : 'equal_payment'
  );

  const totalMonthlyPayment = mortgageCalc.firstMonthPayment;
  const totalLoanWuan = mortgageCalc.totalLoanWuan;
  const totalRepaymentWuan = mortgageCalc.totalRepaymentWuan;
  const totalInterestWuan = mortgageCalc.totalInterestWuan;

  // DTI (基于首月月供)
  const currentDTI = monthlyIncomeYuan > 0 ? Math.round((totalMonthlyPayment / monthlyIncomeYuan) * 1000) / 10 : 0;

  // Stress testing
  const stressedMonthlyIncome = monthlyIncomeYuan * (1 - incomeDropPct / 100);
  const stressedDTI = stressedMonthlyIncome > 0 ? Math.round((totalMonthlyPayment / stressedMonthlyIncome) * 1000) / 10 : 0;
  const netMonthlySurplus = stressedMonthlyIncome - totalMonthlyPayment - (stressedMonthlyIncome * 0.35); // 扣去35%基础生活费

  const survivingMonths = netMonthlySurplus < 0 && liquidEmergencySavingsWuan > 0
    ? Math.round((liquidEmergencySavingsWuan * 10000) / Math.abs(netMonthlySurplus))
    : 999;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="glass-card mobile-p-16" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <CalculatorIcon color="var(--primary)" size={22} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            全能房贷试算与极端压力测试器
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
          从<strong>房屋总价 ➔ 首付比例 ➔ 公积金/商业组合贷款</strong>依次推算月供，并进行极端收入缩水压力测试。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
        {/* Left Inputs (REORDERED & RESTRUCTURED AS REQUESTED) */}
        <div className="glass-card mobile-p-16" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            1. 房屋总价与首付配置
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Step 1: House Price & Down Payment Ratio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  房屋挂牌总价 (万元) *
                </label>
                <input
                  type="number"
                  value={totalHousePriceWuan}
                  onChange={(e) => handleHousePriceChange(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  首付比例 (%) *
                </label>
                <select
                  value={downPaymentRatio}
                  onChange={(e) => handleDownPaymentRatioChange(parseFloat(e.target.value))}
                >
                  <option value={0.15}>15% (最低首付)</option>
                  <option value={0.20}>20% (常见首付)</option>
                  <option value={0.30}>30% (三成首付)</option>
                  <option value={0.40}>40% (四成首付)</option>
                  <option value={0.50}>50% (五成首付)</option>
                </select>
              </div>
            </div>

            {/* Calculated Summary Badge */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>首付款: <strong style={{ color: 'var(--primary)' }}>{downPaymentWuan} 万元</strong></span>
              <span>尚需贷款总额: <strong style={{ color: 'var(--danger)' }}>{totalLoanNeededWuan} 万元</strong></span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              2. 组合贷款配置 (总贷款 {totalLoanNeededWuan} 万元)
            </h3>

            {/* Step 2: Provident Fund Loan */}
            <div style={{ background: 'rgba(5, 150, 105, 0.04)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '10px', color: 'var(--primary)' }}>
                🏛️ 第一步：公积金贷款部分
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>公积金金额 (万元)</label>
                  <input
                    type="number"
                    value={providentLoanWuan}
                    onChange={(e) => handleProvidentLoanChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>公积金年利率 (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={providentRatePct}
                    onChange={(e) => setProvidentRatePct(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Commercial Loan */}
            <div style={{ background: 'rgba(99, 102, 241, 0.04)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '10px', color: 'var(--accent-purple)' }}>
                🏢 第二步：商业贷款部分 (自动计算余额)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>商贷金额 (万元)</label>
                  <input
                    type="number"
                    value={commercialLoanWuan}
                    onChange={(e) => setCommercialLoanWuan(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>商贷年利率 (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={commercialRatePct}
                    onChange={(e) => setCommercialRatePct(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Loan Term & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  按揭贷款年限
                </label>
                <select value={loanYears} onChange={(e) => setLoanYears(parseInt(e.target.value))}>
                  <option value={10}>10 年 (120期)</option>
                  <option value={15}>15 年 (180期)</option>
                  <option value={20}>20 年 (240期)</option>
                  <option value={25}>25 年 (300期)</option>
                  <option value={30}>30 年 (360期)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  还款方式
                </label>
                <select value={repaymentType} onChange={(e) => setRepaymentType(e.target.value as any)}>
                  <option value="equal_payment">等额本息 (每月还款固定)</option>
                  <option value="equal_principal">等额本金 (递减还款)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Overview & Stress Test */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Repayment Summary Card */}
          <div className="glass-card mobile-p-16" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                月供与还款汇总
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
                {repaymentType === 'equal_payment' ? '等额本息 (每月固定)' : '等额本金 (逐月递减)'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {repaymentType === 'equal_payment' ? '预估每月月供' : '预估首月月供'}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {totalMonthlyPayment.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>元/月</span>
                </div>
                {repaymentType === 'equal_principal' ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    每月递减 <strong>{mortgageCalc.monthlyDecreaseYuan}</strong> 元 | 末月 {mortgageCalc.lastMonthPaymentYuan?.toLocaleString()} 元
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    全期 360 个月还款额保持固定
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>支付利息总额</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {totalInterestWuan} <span style={{ fontSize: '0.85rem' }}>万元</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  累计还款总额 {totalRepaymentWuan} 万元
                </div>
              </div>
            </div>

            {/* Interest Comparison Note */}
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {repaymentType === 'equal_principal' ? (
                  <strong style={{ color: 'var(--success)' }}>
                    💡 相比等额本息，选【等额本金】可少还利息约 {Math.max(0, Math.round((comparisonCalc.totalInterestWuan - totalInterestWuan) * 100) / 100)} 万元
                  </strong>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    💡 若换成【等额本金】，首月需还 {comparisonCalc.firstMonthPayment.toLocaleString()} 元，但总利息可节省约 {Math.max(0, Math.round((totalInterestWuan - comparisonCalc.totalInterestWuan) * 100) / 100)} 万元
                  </span>
                )}
              </span>
            </div>

            {/* Schedule Launcher Button */}
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => {
                setSelectedScheduleYear(0);
                setIsScheduleModalOpen(true);
              }}
            >
              📅 查看 360 期逐月还款明细表 ({repaymentType === 'equal_payment' ? '等额本息' : '等额本金'})
            </button>
          </div>

          {/* Stress Test Simulator Card */}
          <div
            className="glass-card mobile-p-16"
            style={{
              padding: '20px',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, #ffffff 100%)',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.06)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangleIcon size={20} color="var(--danger)" />
              ⚡ 极端收入缩水压力测试
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>家庭当前总月收入 (元/月)</label>
                <input
                  type="number"
                  value={monthlyIncomeYuan}
                  onChange={(e) => setMonthlyIncomeYuan(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>购房后可动用备用金 (万元)</label>
                <input
                  type="number"
                  value={liquidEmergencySavingsWuan}
                  onChange={(e) => setLiquidEmergencySavingsWuan(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>模拟降薪/降收幅度 (%)</label>
                <select value={incomeDropPct} onChange={(e) => setIncomeDropPct(parseInt(e.target.value))}>
                  <option value={10}>微幅调整 (-10%)</option>
                  <option value={20}>行业阵痛 (-20%)</option>
                  <option value={30}>显著下降 (-30%)</option>
                  <option value={50}>腰斩极端 (-50%)</option>
                  <option value={100}>完全失业 (-100%)</option>
                </select>
              </div>
            </div>

            {/* Stress Test Outcomes */}
            <div style={{ padding: '14px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220, 38, 38, 0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>正常状态下月供收入比:</span>
                <span style={{ fontWeight: 700, color: currentDTI <= 40 ? 'var(--success)' : 'var(--danger)' }}>{currentDTI}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>降薪 {incomeDropPct}% 后月供收入比:</span>
                <span style={{ fontWeight: 700, color: stressedDTI <= 50 ? 'var(--warning)' : 'var(--danger)' }}>{stressedDTI}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>极端断供风险预警:</span>
                <span style={{ fontWeight: 700, color: survivingMonths >= 6 ? 'var(--success)' : 'var(--danger)' }}>
                  {survivingMonths === 999 ? '现金流安全充裕' : `备用金能支撑 ${survivingMonths} 个月`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 360 Period Repayment Schedule Modal */}
      {isScheduleModalOpen && (
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
            padding: '20px',
          }}
        >
          <div
            className="glass-card animate-fade-in modal-card-mobile"
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              background: '#ffffff',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '2px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📅 房贷逐期还款明细表 ({repaymentType === 'equal_payment' ? '等额本息' : '等额本金'})
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  贷款总额: <strong>{totalLoanWuan}万元</strong> (商贷 {commercialLoanWuan}万@{commercialRatePct}% + 公积金 {providentLoanWuan}万@{providentRatePct}%) · 期限 {loanYears}年 ({loanYears * 12}期)
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ padding: '6px 14px', borderRadius: '20px' }}
              >
                ✕ 关闭
              </button>
            </div>

            {/* Modal Summary Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '18px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>还款方式</span>
                <strong style={{ color: 'var(--primary)' }}>{repaymentType === 'equal_payment' ? '等额本息 (固定)' : '等额本金 (递减)'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>首月还款</span>
                <strong style={{ color: 'var(--text-main)' }}>{mortgageCalc.firstMonthPayment.toLocaleString()} 元</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>支付总利息</span>
                <strong style={{ color: 'var(--warning)' }}>{totalInterestWuan} 万元</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>还款总金额</span>
                <strong style={{ color: 'var(--danger)' }}>{totalRepaymentWuan} 万元</strong>
              </div>
            </div>

            {/* Year Filter Dropdown & Quick Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>筛选年份：</span>
                <select
                  value={selectedScheduleYear}
                  onChange={(e) => setSelectedScheduleYear(parseInt(e.target.value))}
                  style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}
                >
                  <option value={0}>显示全量 {loanYears * 12} 期</option>
                  {Array.from({ length: loanYears }, (_, i) => i + 1).map((y) => (
                    <option key={y} value={y}>
                      第 {y} 年 (第 {(y - 1) * 12 + 1} - {y * 12} 期)
                    </option>
                  ))}
                </select>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                显示 {selectedScheduleYear === 0 ? mortgageCalc.schedule.length : 12} 期明细
              </span>
            </div>

            {/* Detailed Table */}
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', maxHeight: '55vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px' }}>期数</th>
                    <th style={{ padding: '10px' }}>年份月份</th>
                    <th style={{ padding: '10px', color: 'var(--primary)' }}>本期月供 (元)</th>
                    <th style={{ padding: '10px' }}>偿还本金 (元)</th>
                    <th style={{ padding: '10px', color: 'var(--warning)' }}>偿还利息 (元)</th>
                    <th style={{ padding: '10px' }}>剩余本金 (万元)</th>
                  </tr>
                </thead>
                <tbody>
                  {mortgageCalc.schedule
                    .filter((item) => selectedScheduleYear === 0 || item.year === selectedScheduleYear)
                    .map((item) => (
                      <tr
                        key={item.monthIndex}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: item.monthInYear === 1 ? 'rgba(5, 150, 105, 0.03)' : '#ffffff',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                          第 {item.monthIndex} 期
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                          第 {item.year} 年 第 {item.monthInYear} 月
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: 'var(--primary)' }}>
                          ￥{item.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          ￥{item.principalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--warning)', fontWeight: 600 }}>
                          ￥{item.interestPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.remainingBalanceWuan} 万
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
