import React from 'react';
import type { ActiveTab } from './Navbar';

interface MobileTabBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const MOBILE_TABS: { id: ActiveTab; label: string; emoji: string }[] = [
  { id: 'wizard',    label: '买房诊断', emoji: '🧭' },
  { id: 'community', label: '房源PK',   emoji: '🏢' },
  { id: 'notes',     label: '看房随记', emoji: '📝' },
  { id: 'mortgage',  label: '房贷测算', emoji: '🧮' },
  { id: 'market',    label: '行情地图', emoji: '🌆' },
];

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      role="tablist"
      aria-label="移动端主导航"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      {MOBILE_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              padding: '6px 0',
              cursor: 'pointer',
              color: isActive ? 'var(--primary)' : 'var(--text-dim)',
              minHeight: '48px',
              position: 'relative',
            }}
          >
            <span
              style={{
                fontSize: '1.25rem',
                lineHeight: 1,
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              aria-hidden="true"
            >
              {tab.emoji}
            </span>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.01em',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  width: '16px',
                  height: '3px',
                  borderRadius: '9999px',
                  background: 'var(--primary)',
                  display: 'block',
                }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
