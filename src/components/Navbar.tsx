import React from 'react';
import { HomeIcon, TrendingUpIcon, CalculatorIcon, BuildingIcon, BookOpenIcon, SparklesIcon } from './Icons';

export type ActiveTab = 'wizard' | 'rent_vs_buy' | 'mortgage' | 'market' | 'checklist' | 'community' | 'notes';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const tabs = [
    { id: 'wizard', label: '🧭 智能买房诊断', icon: HomeIcon },
    { id: 'market', label: '🌆 上海板块行情地图', icon: BuildingIcon },
    { id: 'community', label: '🏢 小区房源精选PK', icon: SparklesIcon },
    { id: 'notes', label: '📝 置业情报与看房随记', icon: BookOpenIcon },
    { id: 'rent_vs_buy', label: '📈 买房vs租房 30年对比', icon: TrendingUpIcon },
    { id: 'mortgage', label: '🧮 房贷与极端压力测试', icon: CalculatorIcon },
    { id: 'checklist', label: '🛡️ 避坑指南Checklist', icon: BookOpenIcon },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '72px',
          paddingTop: '10px',
          paddingBottom: '10px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              flexShrink: 0,
            }}
          >
            🏠
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.2 }}>
              居安择时 <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>HomeBuy AI</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              个人买房最佳时机评估与智能决策系统
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '4px 2px',
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className="btn"
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--primary)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn"
            title="退出登录"
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 500,
              background: '#f1f5f9',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            🔓 退出
          </button>
        )}
      </div>
    </header>
  );
};
