import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0 - 100
  signal: 'BUY_NOW' | 'OBSERVE' | 'DEFER';
  title: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, signal, title }) => {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'var(--success)';
  let bgGradient = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)';
  let badgeText = '最佳入场窗口';
  let badgeStyle = 'badge-success';

  if (signal === 'OBSERVE') {
    colorClass = 'var(--warning)';
    bgGradient = 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)';
    badgeText = '观望蓄力中';
    badgeStyle = 'badge-warning';
  } else if (signal === 'DEFER') {
    colorClass = 'var(--danger)';
    bgGradient = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)';
    badgeText = '建议暂缓买房';
    badgeStyle = 'badge-danger';
  }

  return (
    <div
      style={{
        background: bgGradient,
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
          {/* Back Track */}
          <circle
            stroke="rgba(255, 255, 255, 0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress Arc */}
          <circle
            stroke={colorClass}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              strokeLinecap: 'round',
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {/* Center Text */}
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
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: colorClass, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            / 100分
          </span>
        </div>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <span className={`badge ${badgeStyle}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
          {badgeText}
        </span>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '10px', color: 'var(--text-main)' }}>
          {title}
        </h3>
      </div>
    </div>
  );
};
