import React from 'react';
import type { ActiveTab } from './Navbar';

interface MobileTabBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const MOBILE_TABS: { id: ActiveTab; label: string; emoji: string }[] = [
  { id: 'wizard',    label: '诊断',    emoji: '🧭' },
  { id: 'community', label: '房源',    emoji: '🏢' },
  { id: 'notes',     label: '笔记',    emoji: '📝' },
  { id: 'mortgage',  label: '房贷',    emoji: '🧮' },
  { id: 'market',    label: '行情',    emoji: '🌆' },
];

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '60px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {MOBILE_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              padding: '6px 0',
              cursor: 'pointer',
              color: isActive ? 'var(--primary)' : 'var(--text-dim)',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{tab.emoji}</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.02em',
            }}>
              {tab.label}
            </span>
            {isActive && (
              <span style={{
                width: '4px', height: '4px',
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'block',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
};
