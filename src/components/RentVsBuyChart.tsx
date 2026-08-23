import React, { useState } from 'react';
import type { RentVsBuyYearPoint } from '../types/prediction';

interface RentVsBuyChartProps {
  data: RentVsBuyYearPoint[];
  breakEvenYear: number | null;
}

export const RentVsBuyChart: React.FC<RentVsBuyChartProps> = ({ data, breakEvenYear }) => {
  const [hoveredYear, setHoveredYear] = useState<RentVsBuyYearPoint | null>(null);

  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 40, bottom: 40, left: 60 };

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.buyNetWorth, d.rentNetWorth, d.houseMarketValue))
  ) * 1.1;

  const minVal = Math.min(
    0,
    ...data.map((d) => Math.min(d.buyNetWorth, d.rentNetWorth))
  );

  const getX = (year: number) => {
    return padding.left + ((year - 1) / 29) * (width - padding.left - padding.right);
  };

  const getY = (val: number) => {
    const chartHeight = height - padding.top - padding.bottom;
    const range = maxVal - minVal;
    return height - padding.bottom - ((val - minVal) / range) * chartHeight;
  };

  const buyPath = data.reduce((acc, pt, idx) => {
    const command = idx === 0 ? 'M' : 'L';
    return `${acc} ${command} ${getX(pt.year)} ${getY(pt.buyNetWorth)}`;
  }, '');

  const rentPath = data.reduce((acc, pt, idx) => {
    const command = idx === 0 ? 'M' : 'L';
    return `${acc} ${command} ${getX(pt.year)} ${getY(pt.rentNetWorth)}`;
  }, '');

  const houseValuePath = data.reduce((acc, pt, idx) => {
    const command = idx === 0 ? 'M' : 'L';
    return `${acc} ${command} ${getX(pt.year)} ${getY(pt.houseMarketValue)}`;
  }, '');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => minVal + pct * (maxVal - minVal));

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '4px', background: '#6366f1', borderRadius: '2px' }} />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>买房净资产（房产价值-剩余贷款）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '4px', background: '#06b6d4', borderRadius: '2px' }} />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>租房理财净资产（投资复利总值）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '2px', borderTop: '2px dashed #9ca3af' }} />
          <span style={{ color: 'var(--text-muted)' }}>房屋总市场估值</span>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: 'rgba(15, 22, 38, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          {/* Y Grid Lines */}
          {yTicks.map((val, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={getY(val)}
                x2={width - padding.right}
                y2={getY(val)}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={getY(val) + 4}
                fill="var(--text-dim)"
                fontSize="11"
                textAnchor="end"
              >
                {Math.round(val)}万
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {data.filter((d) => d.year === 1 || d.year % 5 === 0).map((pt) => (
            <g key={pt.year}>
              <line
                x1={getX(pt.year)}
                y1={height - padding.bottom}
                x2={getX(pt.year)}
                y2={height - padding.bottom + 6}
                stroke="rgba(255, 255, 255, 0.2)"
              />
              <text
                x={getX(pt.year)}
                y={height - padding.bottom + 20}
                fill="var(--text-muted)"
                fontSize="11"
                textAnchor="middle"
              >
                第{pt.year}年
              </text>
            </g>
          ))}

          {/* House Market Value Dashed Line */}
          <path d={houseValuePath} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />

          {/* Rent Net Worth Line */}
          <path d={rentPath} fill="none" stroke="#06b6d4" strokeWidth="3" />

          {/* Buy Net Worth Line */}
          <path d={buyPath} fill="none" stroke="#6366f1" strokeWidth="3" />

          {/* Break Even Highlight Circle */}
          {breakEvenYear && (
            <g>
              <circle
                cx={getX(breakEvenYear)}
                cy={getY(data[breakEvenYear - 1].buyNetWorth)}
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={getX(breakEvenYear)}
                y={getY(data[breakEvenYear - 1].buyNetWorth) - 12}
                fill="#10b981"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                第{breakEvenYear}年反超
              </text>
            </g>
          )}

          {/* Hover Interaction Areas */}
          {data.map((pt) => (
            <rect
              key={pt.year}
              x={getX(pt.year) - (width - padding.left - padding.right) / 60}
              y={padding.top}
              width={(width - padding.left - padding.right) / 30}
              height={height - padding.top - padding.bottom}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredYear(pt)}
              onMouseLeave={() => setHoveredYear(null)}
            />
          ))}

          {/* Hover Highlight Marker */}
          {hoveredYear && (
            <g>
              <line
                x1={getX(hoveredYear.year)}
                y1={padding.top}
                x2={getX(hoveredYear.year)}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="2 2"
              />
              <circle cx={getX(hoveredYear.year)} cy={getY(hoveredYear.buyNetWorth)} r="5" fill="#6366f1" />
              <circle cx={getX(hoveredYear.year)} cy={getY(hoveredYear.rentNetWorth)} r="5" fill="#06b6d4" />
            </g>
          )}
        </svg>
      </div>

      {/* Tooltip Overlay */}
      {hoveredYear && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '20px',
            background: 'rgba(21, 28, 46, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            boxShadow: 'var(--shadow-card)',
            fontSize: '0.85rem',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            第 {hoveredYear.year} 年对比数据
          </div>
          <div style={{ color: '#6366f1', fontWeight: 600 }}>买房净资产: {hoveredYear.buyNetWorth} 万元</div>
          <div style={{ color: '#06b6d4', fontWeight: 600 }}>租房理财净资产: {hoveredYear.rentNetWorth} 万元</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>房屋市值: {hoveredYear.houseMarketValue} 万元</div>
          <div style={{ color: 'var(--text-muted)' }}>剩余贷款本金: {hoveredYear.remainingLoan} 万元</div>
          <div style={{ color: 'var(--text-muted)' }}>累计支付租金: {hoveredYear.cumulativeRentPaid} 万元</div>
        </div>
      )}
    </div>
  );
};
