import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import { MobileTabBar } from './components/MobileTabBar';
import { LoginPage } from './components/LoginPage';
import { AssessmentWizard } from './components/AssessmentWizard';
import { RentVsBuySection } from './components/RentVsBuySection';
import { MortgageCalculatorSection } from './components/MortgageCalculatorSection';
import { BreakEvenSection } from './components/BreakEvenSection';
import { MarketMatrixSection } from './components/MarketMatrixSection';
import { ChecklistSection } from './components/ChecklistSection';
import { CommunityLedgerSection } from './components/CommunityLedgerSection';
import { HousingNotesSection } from './components/HousingNotesSection';
import { isLoggedIn, clearToken } from './utils/api';

// 手机端断点：<= 768px 显示底部 Tab Bar
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => isLoggedIn());
  const [activeTab, setActiveTab] = useState<ActiveTab>('wizard');
  const isMobile = useIsMobile();

  // 每次切换到盈亏平衡 Tab 时自增，触发 BreakEvenSection 重新挂载并拉取最新数据
  const [breakevenKey, setBreakevenKey] = useState(0);
  const prevTabRef = useRef<ActiveTab>('wizard');

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'breakeven' && prevTabRef.current !== 'breakeven') {
      setBreakevenKey((k) => k + 1);
    }
    prevTabRef.current = tab;
    setActiveTab(tab);
  };

  // 监听 401 事件自动退出
  useEffect(() => {
    const handler = () => setLoggedIn(false);
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const handleLogin = () => setLoggedIn(true);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  const handleSelectListingForMortgage = (_totalPriceWuan: number) => {
    setActiveTab('mortgage');
  };

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 桌面端：顶部导航 */}
      {!isMobile && (
        <Navbar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} />
      )}

      {/* Main Content */}
      <main
        className="container"
        style={{
          flex: 1,
          paddingTop: '28px',
          paddingBottom: isMobile ? '80px' : '60px', // 给底部 Tab Bar 留空间
        }}
      >
        <div className="animate-fade-in">
          {activeTab === 'wizard' && <AssessmentWizard />}
          {activeTab === 'market' && <MarketMatrixSection />}
          {activeTab === 'community' && (
            <CommunityLedgerSection onSelectListingForMortgage={handleSelectListingForMortgage} />
          )}
          {activeTab === 'notes' && <HousingNotesSection />}
          {activeTab === 'rent_vs_buy' && <RentVsBuySection />}
          {activeTab === 'mortgage' && <MortgageCalculatorSection />}
          {activeTab === 'breakeven' && <BreakEvenSection key={breakevenKey} />}
          {activeTab === 'checklist' && <ChecklistSection />}
        </div>
      </main>

      {/* Footer（仅桌面端显示）*/}
      {!isMobile && (
        <footer
          style={{
            borderTop: '1px solid var(--border-color)',
            background: '#ffffff',
            padding: '24px 0',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.825rem',
          }}
        >
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div>
              🏠 居安择时 - 个人买房时机评估与智能决策工具 | 助力理性置业与财务防线筑造
            </div>
            <div>
              提示：本工具测算模型基于财务杠杆数理模型及常见楼市指标，测算结果仅供理性置业决策参考。
            </div>
          </div>
        </footer>
      )}

      {/* 手机端：底部 Tab Bar */}
      {isMobile && (
        <MobileTabBar activeTab={activeTab} setActiveTab={handleTabChange} />
      )}
    </div>
  );
}

export default App;
