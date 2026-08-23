import { useState } from 'react';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import { AssessmentWizard } from './components/AssessmentWizard';
import { RentVsBuySection } from './components/RentVsBuySection';
import { MortgageCalculatorSection } from './components/MortgageCalculatorSection';
import { MarketMatrixSection } from './components/MarketMatrixSection';
import { ChecklistSection } from './components/ChecklistSection';
import { CommunityLedgerSection } from './components/CommunityLedgerSection';
import { HousingNotesSection } from './components/HousingNotesSection';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('wizard');

  const handleSelectListingForMortgage = (_totalPriceWuan: number) => {
    setActiveTab('mortgage');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View Container */}
      <main
        className="container"
        style={{
          flex: 1,
          paddingTop: '28px',
          paddingBottom: '60px',
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
          {activeTab === 'checklist' && <ChecklistSection />}
        </div>
      </main>

      {/* Footer */}
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
    </div>
  );
}

export default App;
