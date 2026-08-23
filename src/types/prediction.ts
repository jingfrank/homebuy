export type CityTier = 'tier1' | 'new_tier1' | 'tier2' | 'tier3_4';

export type HousingPurpose = 'first_home' | 'marriage' | 'education' | 'upgrade' | 'investment';

export type StabilityLevel = 'high' | 'medium' | 'low';

export interface UserInputData {
  annualIncome: number; // 万元/年
  currentSavings: number; // 万元
  targetHousePrice: number; // 万元
  monthlyDebt: number; // 元/月 (除房贷外其他非房负债)
  monthlyRent: number; // 元/月
  careerStability: StabilityLevel;
  emergencyReserveMonths: number; // 购房后保留几月生活开支
  
  purpose: HousingPurpose;
  hasUrgentNeedIn2Years: boolean; // 1-2年内有结婚/子女入学强需
  cityTier: CityTier;
  
  downPaymentRatio: number; // 首付比例 0.15, 0.2, 0.3等
  mortgageRate: number; // 房贷年利率 %
  loanTermYears: number; // 贷款年限
  inventoryCycleMonths: number; // 当地去化周期（月）
  priceNegotiationSpace: 'high' | 'medium' | 'low'; // 议价空间
}

export interface DimensionScore {
  name: string;
  score: number; // 0 - 100
  weight: number; // 权重
  status: 'safe' | 'warning' | 'danger';
  summary: string;
  details: string[];
}

export interface MortgageResult {
  downPaymentAmount: number; // 首付款(万元)
  loanAmount: number; // 贷款金额(万元)
  monthlyPayment: number; // 月供(元)
  totalInterest: number; // 总利息(万元)
  totalRepayment: number; // 总还款额(万元)
  dtiRatio: number; // 房贷月供收入比 %
  totalDTI: number; // 总债务月供收入比 %
  remainingReserve: number; // 购房后剩余现金缓冲(万元)
  emergencyFundSurvivingMonths: number; // 剩余资金可持续无收入支撑月数
}

export interface PredictionAssessment {
  totalScore: number; // 0 - 100
  recommendationSignal: 'BUY_NOW' | 'OBSERVE' | 'DEFER';
  recommendationTitle: string;
  recommendationSubtitle: string;
  optimalTimeWindow: string; // 预计合适入场时间
  
  dimensions: {
    financial: DimensionScore;
    market: DimensionScore;
    need: DimensionScore;
  };
  
  mortgage: MortgageResult;
  keyRisks: string[];
  actionItems: string[];
}

export interface RentVsBuyYearPoint {
  year: number;
  buyNetWorth: number; // 买房净资产 (万元)
  rentNetWorth: number; // 租房理财净资产 (万元)
  houseMarketValue: number; // 房屋总市值 (万元)
  remainingLoan: number; // 剩余贷款本金 (万元)
  cumulativeRentPaid: number; // 累计租金支出 (万元)
}

export interface RentVsBuyResult {
  breakEvenYear: number | null; // 买房净资产超越租房的年份
  yearPoints: RentVsBuyYearPoint[];
  summaryMessage: string;
  buy30YearNetWorth: number;
  rent30YearNetWorth: number;
}
