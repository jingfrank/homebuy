import React, { useState, useMemo } from 'react';
import { simulateRentVsBuy30Years } from '../utils/calculator';
import { RentVsBuyChart } from './RentVsBuyChart';
import { TrendingUpIcon, SlidersIcon, SparklesIcon } from './Icons';

export const RentVsBuySection: React.FC = () => {
  const [housePrice, setHousePrice] = useState<number>(240); // 240万
  const [downPayment, setDownPayment] = useState<number>(48); // 48万
  const [mortgageRate, setMortgageRate] = useState<number>(3.15); // 3.15%
  const [loanYears, setLoanYears] = useState<number>(30); // 30年（可选20~40）
  const [monthlyRent, setMonthlyRent] = useState<number>(3800); // 3800元/月

  // Dynamic Simulation Parameters
  const [houseAppreciationRate, setHouseAppreciationRate] = useState<number>(1.2); // 房价年增长 %
  const [investmentReturnRate, setInvestmentReturnRate] = useState<number>(3.5); // 理财年收益 %
  const [rentInflationRate, setRentInflationRate] = useState<number>(1.5); // 租金年上涨 %

  const simulationResult = useMemo(() => {
    return simulateRentVsBuy30Years(
      housePrice,
      downPayment,
      mortgageRate,
      loanYears,
      monthlyRent,
      houseAppreciationRate,
      investmentReturnRate,
      rentInflationRate
    );
  }, [
    housePrice,
    downPayment,
    mortgageRate,
    loanYears,
    monthlyRent,
    houseAppreciationRate,
    investmentReturnRate,
    rentInflationRate,
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Title Banner */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <TrendingUpIcon color="var(--accent-cyan)" size={24} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            买房 vs 租房理财 30年净资产轨迹模拟器
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          对比“买房积累房屋净资产”与“租房并将省下的首付与月供差额用于理财”在30年间的复利积累差异。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        {/* Left Interactive Sliders */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersIcon color="var(--primary)" size={18} />
            基础房产与租金参数
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>房屋预估总价</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{housePrice} 万元</span>
              </div>
              <input
                type="range"
                min={80}
                max={1000}
                step={10}
                value={housePrice}
                onChange={(e) => setHousePrice(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>首付款金额 (首付比 {Math.round((downPayment / housePrice) * 100)}%)</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{downPayment} 万元</span>
              </div>
              <input
                type="range"
                min={Math.round(housePrice * 0.15)}
                max={Math.round(housePrice * 0.7)}
                step={2}
                value={downPayment}
                onChange={(e) => setDownPayment(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>当前月租金</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{monthlyRent} 元/月</span>
              </div>
              <input
                type="range"
                min={1000}
                max={20000}
                step={200}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>房贷利率 (年化 %)</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{mortgageRate}%</span>
              </div>
              <input
                type="range"
                min={2.5}
                max={5.5}
                step={0.05}
                value={mortgageRate}
                onChange={(e) => setMortgageRate(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>贷款期限 (年)</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{loanYears} 年 ({loanYears * 12}期)</span>
              </div>
              <input
                type="range"
                min={20}
                max={40}
                step={5}
                value={loanYears}
                onChange={(e) => setLoanYears(parseInt(e.target.value))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                最新政策最长可贷 40 年；期限越长月供越低，总利息越多
              </span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '12px', marginBottom: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SparklesIcon color="var(--accent-purple)" size={18} />
              未来 30 年假设变动率
            </h3>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>预期房价年平均涨跌幅</span>
                <span style={{ fontWeight: 700, color: houseAppreciationRate >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {houseAppreciationRate > 0 ? `+${houseAppreciationRate}` : houseAppreciationRate}%
                </span>
              </div>
              <input
                type="range"
                min={-3}
                max={6}
                step={0.1}
                value={houseAppreciationRate}
                onChange={(e) => setHouseAppreciationRate(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>租房理财年化复利收益率</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{investmentReturnRate}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={0.1}
                value={investmentReturnRate}
                onChange={(e) => setInvestmentReturnRate(parseFloat(e.target.value))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                参考：国债/稳健理财约2.5%-3.5%，指数基金长期组合约5%-7%
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>租金年平均涨幅</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{rentInflationRate}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={rentInflationRate}
                onChange={(e) => setRentInflationRate(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Right Chart & Comparative Insight */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            30 年净资产复利演进曲线
          </h3>

          <RentVsBuyChart data={simulationResult.yearPoints} breakEvenYear={simulationResult.breakEvenYear} />

          {/* Key Summary Alert Box */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.925rem',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
              💡 结论摘要：
            </div>
            {simulationResult.summaryMessage}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 'auto' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>30年后买房净资产</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1' }}>
                {simulationResult.buy30YearNetWorth} 万元
              </div>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>30年后租房理财净资产</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4' }}>
                {simulationResult.rent30YearNetWorth} 万元
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
