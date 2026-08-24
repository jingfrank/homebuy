import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0 - 100
  signal: 'BUY_NOW' | 'OBSERVE' | 'DEFER';
  title: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, signal, title }) => {
  const radius = 68;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  let color = 'var(--primary)';
  let badgeText = '最佳入场窗口';
  let badgeStyle = 'badge-success';
  let bannerDesc = '财务储备与安全边际充裕，当前楼市供需和利率支持适时出手。';

  if (signal === 'OBSERVE') {
    color = 'var(--warning)';
    badgeText = '观望蓄力中';
    badgeStyle = 'badge-warning';
    bannerDesc = '当前处于博弈观望期，建议保持现金流，持续关注板块降价笋盘。';
  } else if (signal === 'DEFER') {
    color = 'var(--danger)';
    badgeText = '建议暂缓买房';
    badgeStyle = 'badge-danger';
    bannerDesc = '月供压力或现金防线不足，强行上车存在断供风险，建议暂缓购房。';
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
      }}
    >
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
          {/* Back Track */}
          <circle
            stroke="#f1f5f9"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress Arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              strokeLinecap: 'round',
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center Score */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="tabular-nums" style={{ fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
            {score}
          </span>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>
            综合时机指数
          </span>
        </div>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <span className={`badge ${badgeStyle}`} style={{ fontSize: '0.85rem', padding: '5px 14px' }}>
          {badgeText}
        </span>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: 1.45, marginTop: '2px' }}>
          {bannerDesc}
        </p>
      </div>
    </div>
  );
};
