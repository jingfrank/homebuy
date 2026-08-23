import type {
  UserInputData,
  PredictionAssessment,
  MortgageResult,
  RentVsBuyResult,
  RentVsBuyYearPoint,
} from '../types/prediction';

/**
 * 房源还款明细单期数据接口
 */
export interface AmortizationScheduleItem {
  monthIndex: number; // 第几期 (1..N)
  year: number; // 第几年 (1..years)
  monthInYear: number; // 年内第几期 (1..12)
  monthlyPayment: number; // 本期总还款 (元)
  principalPayment: number; // 本期偿还本金 (元)
  interestPayment: number; // 本期偿还利息 (元)
  remainingBalanceWuan: number; // 本期还款后剩余本金 (万元)
}

export interface MortgageCalculationSummary {
  repaymentType: 'equal_payment' | 'equal_principal';
  totalLoanWuan: number;
  totalRepaymentWuan: number;
  totalInterestWuan: number;
  // 等额本息
  firstMonthPayment: number; // 等额本息为固定值，等额本金为首月月供
  monthlyDecreaseYuan?: number; // 等额本金每月递减金额 (元)
  lastMonthPaymentYuan?: number; // 等额本金末月月供 (元)
  schedule: AmortizationScheduleItem[];
}

/**
 * 计算房贷月供（等额本息）
 */
export function calculateEqualPaymentMonthly(
  loanAmountWuan: number,
  annualRatePct: number,
  years: number
): number {
  if (loanAmountWuan <= 0 || years <= 0) return 0;
  const principal = loanAmountWuan * 10000;
  const monthlyRate = annualRatePct / 100 / 12;
  const totalMonths = years * 12;

  if (monthlyRate === 0) return principal / totalMonths;

  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return Math.round(monthlyPayment);
}

/**
 * 完整推算组合贷款（商贷+公积金）在“等额本息”或“等额本金”下的逐期明细与汇总
 */
export function generateAmortizationSchedule(
  commercialLoanWuan: number,
  commercialRatePct: number,
  providentLoanWuan: number,
  providentRatePct: number,
  years: number,
  repaymentType: 'equal_payment' | 'equal_principal'
): MortgageCalculationSummary {
  const totalMonths = Math.max(1, years * 12);
  const commPrincipalYuan = Math.max(0, commercialLoanWuan * 10000);
  const provPrincipalYuan = Math.max(0, providentLoanWuan * 10000);
  const totalLoanYuan = commPrincipalYuan + provPrincipalYuan;

  const commMonthlyRate = (commercialRatePct / 100) / 12;
  const provMonthlyRate = (providentRatePct / 100) / 12;

  const schedule: AmortizationScheduleItem[] = [];

  let totalRepaymentYuan = 0;
  let totalInterestYuan = 0;

  if (repaymentType === 'equal_payment') {
    // 等额本息计算
    const commFixedPayment = commPrincipalYuan > 0
      ? (commMonthlyRate > 0
        ? (commPrincipalYuan * commMonthlyRate * Math.pow(1 + commMonthlyRate, totalMonths)) / (Math.pow(1 + commMonthlyRate, totalMonths) - 1)
        : commPrincipalYuan / totalMonths)
      : 0;

    const provFixedPayment = provPrincipalYuan > 0
      ? (provMonthlyRate > 0
        ? (provPrincipalYuan * provMonthlyRate * Math.pow(1 + provMonthlyRate, totalMonths)) / (Math.pow(1 + provMonthlyRate, totalMonths) - 1)
        : provPrincipalYuan / totalMonths)
      : 0;

    let commBalance = commPrincipalYuan;
    let provBalance = provPrincipalYuan;

    for (let m = 1; m <= totalMonths; m++) {
      // 商贷部分
      const commInterest = commBalance * commMonthlyRate;
      let commPrincipal = commFixedPayment - commInterest;
      if (m === totalMonths) commPrincipal = commBalance; // 最后一期做末位精准平账
      commBalance = Math.max(0, commBalance - commPrincipal);

      // 公积金部分
      const provInterest = provBalance * provMonthlyRate;
      let provPrincipal = provFixedPayment - provInterest;
      if (m === totalMonths) provPrincipal = provBalance;
      provBalance = Math.max(0, provBalance - provPrincipal);

      const monthlyPayment = (commPrincipal + commInterest) + (provPrincipal + provInterest);
      const principalPayment = commPrincipal + provPrincipal;
      const interestPayment = commInterest + provInterest;
      const remainingBalance = commBalance + provBalance;

      totalRepaymentYuan += monthlyPayment;
      totalInterestYuan += interestPayment;

      schedule.push({
        monthIndex: m,
        year: Math.ceil(m / 12),
        monthInYear: ((m - 1) % 12) + 1,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingBalanceWuan: Math.max(0, Math.round((remainingBalance / 10000) * 100) / 100),
      });
    }

    const firstMonthPayment = schedule.length > 0 ? Math.round(schedule[0].monthlyPayment) : 0;

    return {
      repaymentType,
      totalLoanWuan: Math.round((totalLoanYuan / 10000) * 100) / 100,
      totalRepaymentWuan: Math.round((totalRepaymentYuan / 10000) * 100) / 100,
      totalInterestWuan: Math.round((totalInterestYuan / 10000) * 100) / 100,
      firstMonthPayment,
      schedule,
    };
  } else {
    // 等额本金计算
    const commMonthlyPrincipal = commPrincipalYuan / totalMonths;
    const provMonthlyPrincipal = provPrincipalYuan / totalMonths;

    let commBalance = commPrincipalYuan;
    let provBalance = provPrincipalYuan;

    for (let m = 1; m <= totalMonths; m++) {
      const commInterest = commBalance * commMonthlyRate;
      const provInterest = provBalance * provMonthlyRate;

      const commPayment = commMonthlyPrincipal + commInterest;
      const provPayment = provMonthlyPrincipal + provInterest;

      commBalance = Math.max(0, commBalance - commMonthlyPrincipal);
      provBalance = Math.max(0, provBalance - provMonthlyPrincipal);

      const monthlyPayment = commPayment + provPayment;
      const principalPayment = commMonthlyPrincipal + provMonthlyPrincipal;
      const interestPayment = commInterest + provInterest;
      const remainingBalance = commBalance + provBalance;

      totalRepaymentYuan += monthlyPayment;
      totalInterestYuan += interestPayment;

      schedule.push({
        monthIndex: m,
        year: Math.ceil(m / 12),
        monthInYear: ((m - 1) % 12) + 1,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingBalanceWuan: Math.max(0, Math.round((remainingBalance / 10000) * 100) / 100),
      });
    }

    const firstMonthPayment = schedule.length > 0 ? Math.round(schedule[0].monthlyPayment) : 0;
    const lastMonthPaymentYuan = schedule.length > 0 ? Math.round(schedule[schedule.length - 1].monthlyPayment) : 0;
    const monthlyDecreaseYuan = schedule.length > 1
      ? Math.round((schedule[0].monthlyPayment - schedule[1].monthlyPayment) * 100) / 100
      : 0;

    return {
      repaymentType,
      totalLoanWuan: Math.round((totalLoanYuan / 10000) * 100) / 100,
      totalRepaymentWuan: Math.round((totalRepaymentYuan / 10000) * 100) / 100,
      totalInterestWuan: Math.round((totalInterestYuan / 10000) * 100) / 100,
      firstMonthPayment,
      monthlyDecreaseYuan,
      lastMonthPaymentYuan,
      schedule,
    };
  }
}

/**
 * 计算房贷与财务指标
 */
export function calculateMortgageDetails(input: UserInputData): MortgageResult {
  const downPaymentAmount = Math.round(input.targetHousePrice * input.downPaymentRatio * 100) / 100;
  const loanAmount = Math.round((input.targetHousePrice - downPaymentAmount) * 100) / 100;
  
  const monthlyPayment = calculateEqualPaymentMonthly(
    loanAmount,
    input.mortgageRate,
    input.loanTermYears
  );

  const totalMonths = input.loanTermYears * 12;
  const totalRepayment = Math.round(((monthlyPayment * totalMonths) / 10000) * 100) / 100;
  const totalInterest = Math.round((totalRepayment - loanAmount) * 100) / 100;

  const monthlyIncome = (input.annualIncome * 10000) / 12;
  const dtiRatio = monthlyIncome > 0 ? Math.round((monthlyPayment / monthlyIncome) * 1000) / 10 : 0;
  const totalDTI = monthlyIncome > 0 ? Math.round(((monthlyPayment + input.monthlyDebt) / monthlyIncome) * 1000) / 10 : 0;

  // 首付后剩余储蓄
  const remainingReserve = Math.round((input.currentSavings - downPaymentAmount) * 100) / 100;
  
  // 基础月必要生活开支 (粗略估计为月收入的35% + 非房债务)
  const monthlyLivingExpense = monthlyIncome * 0.35 + input.monthlyDebt;
  const monthlyFixedOutflow = monthlyPayment + monthlyLivingExpense;
  
  // 如果没有任何收入，剩余储备资金能维持月供+生活费几个月
  const emergencyFundSurvivingMonths = monthlyFixedOutflow > 0 && remainingReserve > 0
    ? Math.round((remainingReserve * 10000) / monthlyFixedOutflow)
    : 0;

  return {
    downPaymentAmount,
    loanAmount,
    monthlyPayment,
    totalInterest,
    totalRepayment,
    dtiRatio,
    totalDTI,
    remainingReserve,
    emergencyFundSurvivingMonths,
  };
}

/**
 * 核心综合买房合适度评估算法
 */
export function evaluateHomePurchaseTiming(input: UserInputData): PredictionAssessment {
  const mortgage = calculateMortgageDetails(input);
  const monthlyIncome = (input.annualIncome * 10000) / 12;

  // 1. 财务安全维度 (权重 45%)
  let finScore = 0;
  const finDetails: string[] = [];

  // DTI 得分
  if (mortgage.dtiRatio <= 30) {
    finScore += 40;
    finDetails.push(`月供占收入比为 ${mortgage.dtiRatio}%（低于30%黄金安全线），充裕度高`);
  } else if (mortgage.dtiRatio <= 42) {
    finScore += 28;
    finDetails.push(`月供占收入比为 ${mortgage.dtiRatio}%（位于30%-42%较安全区间）`);
  } else if (mortgage.dtiRatio <= 50) {
    finScore += 16;
    finDetails.push(`月供占收入比高达 ${mortgage.dtiRatio}%（接近50%警戒线），月度现金流偏紧`);
  } else {
    finScore += 0;
    finDetails.push(`月供占收入比达 ${mortgage.dtiRatio}%（超过50%红线），严重挤占日常生活开支`);
  }

  // 应急备用金得分
  if (mortgage.remainingReserve < 0) {
    finScore += 0;
    finDetails.push(`资金不足以支付首付款，缺口约 ${Math.abs(mortgage.remainingReserve)} 万元`);
  } else if (mortgage.emergencyFundSurvivingMonths >= 12) {
    finScore += 35;
    finDetails.push(`购房后仍保留 ${mortgage.remainingReserve} 万元极度充裕备用金，防失业抗风险能力极强（支撑${mortgage.emergencyFundSurvivingMonths}个月）`);
  } else if (mortgage.emergencyFundSurvivingMonths >= 6) {
    finScore += 25;
    finDetails.push(`购房后保留 ${mortgage.remainingReserve} 万元备用金，可支撑 ${mortgage.emergencyFundSurvivingMonths} 个月正常开支`);
  } else if (mortgage.emergencyFundSurvivingMonths >= 3) {
    finScore += 12;
    finDetails.push(`购房后备用金仅剩 ${mortgage.remainingReserve} 万元（维持约${mortgage.emergencyFundSurvivingMonths}个月），抗风险缓冲薄弱`);
  } else {
    finScore += 3;
    finDetails.push(`购房后几乎裸奔（备用金不足3个月开支），一旦遇到收入波动风险极大`);
  }

  // 非房债务与职业稳定性
  if (input.monthlyDebt > 0 && monthlyIncome > 0) {
    const debtRatio = (input.monthlyDebt / monthlyIncome) * 100;
    if (debtRatio < 15) finScore += 15;
    else if (debtRatio < 30) finScore += 8;
    else finDetails.push(`现有车贷/信用卡等非房月供偏高（占收入${debtRatio.toFixed(1)}%）`);
  } else {
    finScore += 15;
  }

  // 职业稳定性修正
  if (input.careerStability === 'high') finScore = Math.min(100, finScore + 10);
  else if (input.careerStability === 'low') finScore = Math.max(0, finScore - 15);

  finScore = Math.round(Math.min(100, Math.max(0, finScore)));
  const finStatus = finScore >= 75 ? 'safe' : finScore >= 55 ? 'warning' : 'danger';

  // 2. 楼市周期与价格边际维度 (权重 30%)
  let mktScore = 0;
  const mktDetails: string[] = [];

  // 利率与LPR环境
  if (input.mortgageRate <= 3.25) {
    mktScore += 35;
    mktDetails.push(`当前房贷利率 (${input.mortgageRate}%) 处于历史极低水平，资金杠杆成本极低`);
  } else if (input.mortgageRate <= 3.75) {
    mktScore += 25;
    mktDetails.push(`当前房贷利率 (${input.mortgageRate}%) 处于温和宽松区间`);
  } else {
    mktScore += 12;
    mktDetails.push(`房贷利率 (${input.mortgageRate}%) 相对偏高，仍有下行期待`);
  }

  // 去化周期与买方市场
  if (input.inventoryCycleMonths >= 20) {
    mktScore += 35;
    mktDetails.push(`目标区域去化周期达 ${input.inventoryCycleMonths} 个月，呈典型买方市场，挑房余地极大`);
  } else if (input.inventoryCycleMonths >= 12) {
    mktScore += 25;
    mktDetails.push(`去化周期 ${input.inventoryCycleMonths} 个月，供需基本平衡，适宜从容挑选`);
  } else {
    mktScore += 15;
    mktDetails.push(`去化周期偏短 (${input.inventoryCycleMonths}个月)，热点区域房源竞争可能较激烈`);
  }

  // 议价空间
  if (input.priceNegotiationSpace === 'high') {
    mktScore += 30;
    mktDetails.push(`当前业主/开发商议价让利空间大，容易砸出性价比极高的割肉盘`);
  } else if (input.priceNegotiationSpace === 'medium') {
    mktScore += 20;
    mktDetails.push(`价格存在合理议价弹档（约 5%~8% 折扣空间）`);
  } else {
    mktScore += 10;
    mktDetails.push(`卖家心态坚挺，让利空间有限`);
  }

  mktScore = Math.round(Math.min(100, Math.max(0, mktScore)));
  const mktStatus = mktScore >= 70 ? 'safe' : mktScore >= 50 ? 'warning' : 'danger';

  // 3. 刚需迫切度与居住替代成本 (权重 25%)
  let needScore = 0;
  const needDetails: string[] = [];

  // 购房目的与近两年迫切度
  if (input.hasUrgentNeedIn2Years) {
    needScore += 45;
    needDetails.push(`近2年内有结婚/子女入学/落户等强绑定需求，居住确定性权重极高`);
  } else if (input.purpose === 'first_home') {
    needScore += 35;
    needDetails.push(`自住首套刚需，建立长期生活居所基石`);
  } else if (input.purpose === 'upgrade') {
    needScore += 25;
    needDetails.push(`改善置业，提升生活品质与居住面积`);
  } else {
    needScore += 15;
    needDetails.push(`非迫切刚需，置业容错度较高，可灵活择时`);
  }

  // 租房替代成本 (租金 vs 月供)
  if (input.monthlyRent > 0 && mortgage.monthlyPayment > 0) {
    const rentCoverage = (input.monthlyRent / mortgage.monthlyPayment) * 100;
    if (rentCoverage >= 60) {
      needScore += 35;
      needDetails.push(`当前月租金 (${input.monthlyRent}元) 占预估月供的 ${rentCoverage.toFixed(0)}%，租房消费偏高，“以租养贷”转换性价比极高`);
    } else if (rentCoverage >= 40) {
      needScore += 25;
      needDetails.push(`当前租金占月供 ${rentCoverage.toFixed(0)}%，租买转换适中`);
    } else {
      needScore += 15;
      needDetails.push(`租金相对月供占比仅 ${rentCoverage.toFixed(0)}%，继续租房的机会成本很低`);
    }
  } else {
    needScore += 25;
  }

  // 城市居住稳定性
  if (input.cityTier === 'tier1' || input.cityTier === 'new_tier1') {
    needScore += 20;
    needDetails.push(`所在城市产业与人口吸引力强，长期房产流动性与保值度较高`);
  } else {
    needScore += 15;
    needDetails.push(`二三线或县城注重选择核心板块、优质学区与公办配套齐全房源`);
  }

  needScore = Math.round(Math.min(100, Math.max(0, needScore)));
  const needStatus = needScore >= 70 ? 'safe' : needScore >= 50 ? 'warning' : 'danger';

  // 综合总分计算 (加权平均)
  const totalScore = Math.round(finScore * 0.45 + mktScore * 0.30 + needScore * 0.25);

  // 决策信号判决
  let recommendationSignal: 'BUY_NOW' | 'OBSERVE' | 'DEFER' = 'OBSERVE';
  let recommendationTitle = '';
  let recommendationSubtitle = '';
  let optimalTimeWindow = '';

  if (totalScore >= 75 && mortgage.remainingReserve >= 0) {
    recommendationSignal = 'BUY_NOW';
    recommendationTitle = '🟢 最佳买房窗口期（建议适时入场）';
    recommendationSubtitle = '您的财务承载力充裕，市场议价与利率条件利好，且刚需匹配度极高。';
    optimalTimeWindow = '未来 1 ~ 6 个月内（挑房议价最佳时期）';
  } else if (totalScore >= 55 || (totalScore >= 50 && input.hasUrgentNeedIn2Years)) {
    recommendationSignal = 'OBSERVE';
    recommendationTitle = '🟡 观望蓄力期（建议等待 6~12 个月）';
    recommendationSubtitle = '当前条件基本可行但存在一定现金流防线或价格压制风险，建议增加首付积蓄、从容看房对比后再定夺。';
    optimalTimeWindow = '预计 6 ~ 12 个月后（蓄力补强备用金后再入场）';
  } else {
    recommendationSignal = 'DEFER';
    recommendationTitle = '🔴 暂缓买房期（建议优先保持流动性）';
    recommendationSubtitle = '当前买房杠杆偏高或应急资金薄弱，强行上车易引发流动性危机，建议继续租房理财、积蓄资金。';
    optimalTimeWindow = '建议观望 12 ~ 24 个月以上（优先优化个人资产负债表）';
  }

  // Key Risks Summary
  const keyRisks: string[] = [];
  if (mortgage.dtiRatio > 45) {
    keyRisks.push(`⚠️ 月供占收入比 ${mortgage.dtiRatio}% 偏高，遭遇降薪或换工作期间还款压力大`);
  }
  if (mortgage.emergencyFundSurvivingMonths < 6) {
    keyRisks.push(`⚠️ 购房后备用金仅能支撑 ${mortgage.emergencyFundSurvivingMonths} 个月，缺乏抵御极端风险的隔离垫`);
  }
  if (input.careerStability === 'low') {
    keyRisks.push(`⚠️ 职业/行业稳定性评价偏低，需预防断供风险`);
  }
  if (input.inventoryCycleMonths > 24) {
    keyRisks.push(`⚠️ 目标市场去化周期长，切勿急于加价，二手房未来再次转手变现周期可能较长`);
  }
  if (keyRisks.length === 0) {
    keyRisks.push('✅ 当前财务与债务结构健康，风险处于完全可控范围');
  }

  // Actionable checklist items
  const actionItems: string[] = [
    `制定底价策略：在评估价基础上按当前市场行情争取 8%~12% 的谈判议价空间`,
    `确认房贷首套优惠：锁定当前 LPR (${input.mortgageRate}%) 及当地最新首套房贷加点减免政策`,
    `保留 ${Math.max(6, Math.ceil(mortgage.monthlyPayment * 6 / 10000))} 万元以上作为不可动用的失业应急备用金`,
    `看房避坑：重点排查房屋物业品质、二手房产权抵押情况及周边新房未来划片规划`,
  ];

  return {
    totalScore,
    recommendationSignal,
    recommendationTitle,
    recommendationSubtitle,
    optimalTimeWindow,
    dimensions: {
      financial: {
        name: '财务健康与安全度',
        score: finScore,
        weight: 45,
        status: finStatus,
        summary: finStatus === 'safe' ? '财务抗风险防线稳固' : finStatus === 'warning' ? '月供与备用金处于临界区' : '现金流防线偏紧，高杠杆风险',
        details: finDetails,
      },
      market: {
        name: '楼市周期与价格安全边际',
        score: mktScore,
        weight: 30,
        status: mktStatus,
        summary: mktStatus === 'safe' ? '处于极佳买方谈判窗口期' : mktStatus === 'warning' ? '周期适中，宜细心淘房' : '让利空间有限或利率偏高',
        details: mktDetails,
      },
      need: {
        name: '刚需迫切度与租买替代',
        score: needScore,
        weight: 25,
        status: needStatus,
        summary: needStatus === 'safe' ? '居住绑定迫切，租买转化划算' : needStatus === 'warning' ? '需求明确，可择优选房' : '需求弹性大，可继续租房',
        details: needDetails,
      },
    },
    mortgage,
    keyRisks,
    actionItems,
  };
}

/**
 * 30年买房 vs 租房理财 净资产对比模拟引擎
 */
export function simulateRentVsBuy30Years(
  housePriceWuan: number,
  downPaymentWuan: number,
  mortgageRatePct: number,
  loanYears: number,
  currentRentYuan: number,
  annualHouseAppreciationPct: number = 1.0,
  annualInvestmentReturnPct: number = 3.5,
  annualRentInflationPct: number = 1.5
): RentVsBuyResult {
  const loanAmountWuan = Math.max(0, housePriceWuan - downPaymentWuan);
  const monthlyMortgage = calculateEqualPaymentMonthly(loanAmountWuan, mortgageRatePct, loanYears);
  
  const initialTransactionCostsWuan = housePriceWuan * 0.035;
  const initialBuyCashOutWuan = downPaymentWuan + initialTransactionCostsWuan;

  const yearPoints: RentVsBuyYearPoint[] = [];

  let houseMarketValue = housePriceWuan;
  let remainingLoanBalance = loanAmountWuan;
  let cumulativeRentPaidWuan = 0;
  
  let rentInvestmentPortfolioWuan = initialBuyCashOutWuan;

  const monthlyMortgageRate = mortgageRatePct / 100 / 12;

  let breakEvenYear: number | null = null;

  for (let year = 1; year <= 30; year++) {
    houseMarketValue = houseMarketValue * (1 + annualHouseAppreciationPct / 100);

    if (year <= loanYears && remainingLoanBalance > 0) {
      for (let m = 1; m <= 12; m++) {
        const monthlyInterestWuan = (remainingLoanBalance * 10000 * monthlyMortgageRate) / 10000;
        const monthlyPrincipalWuan = (monthlyMortgage / 10000) - monthlyInterestWuan;
        remainingLoanBalance = Math.max(0, remainingLoanBalance - monthlyPrincipalWuan);
      }
    } else {
      remainingLoanBalance = 0;
    }

    const annualMaintenanceCostWuan = houseMarketValue * 0.005;
    const buyNetWorth = houseMarketValue - remainingLoanBalance;

    const currentYearMonthlyRent = currentRentYuan * Math.pow(1 + annualRentInflationPct / 100, year - 1);
    const annualRentWuan = (currentYearMonthlyRent * 12) / 10000;
    cumulativeRentPaidWuan += annualRentWuan;

    const annualBuyCashOutWuan = (year <= loanYears ? (monthlyMortgage * 12) / 10000 : 0) + annualMaintenanceCostWuan;
    const annualSavingsDiffWuan = annualBuyCashOutWuan - annualRentWuan;

    rentInvestmentPortfolioWuan = rentInvestmentPortfolioWuan * (1 + annualInvestmentReturnPct / 100);
    rentInvestmentPortfolioWuan += annualSavingsDiffWuan;

    const rentNetWorth = rentInvestmentPortfolioWuan;

    yearPoints.push({
      year,
      buyNetWorth: Math.round(buyNetWorth * 10) / 10,
      rentNetWorth: Math.round(rentNetWorth * 10) / 10,
      houseMarketValue: Math.round(houseMarketValue * 10) / 10,
      remainingLoan: Math.round(remainingLoanBalance * 10) / 10,
      cumulativeRentPaid: Math.round(cumulativeRentPaidWuan * 10) / 10,
    });

    if (breakEvenYear === null && buyNetWorth > rentNetWorth) {
      breakEvenYear = year;
    }
  }

  const buy30YearNetWorth = yearPoints[29].buyNetWorth;
  const rent30YearNetWorth = yearPoints[29].rentNetWorth;

  let summaryMessage = '';
  if (buy30YearNetWorth > rent30YearNetWorth) {
    const diff = Math.round((buy30YearNetWorth - rent30YearNetWorth) * 10) / 10;
    summaryMessage = `在 30 年长期视角下，买房积累的房屋净资产比租房理财高出约 ${diff} 万元${
      breakEvenYear ? `（买房净资产在第 ${breakEvenYear} 年超越租房）` : ''
    }。`;
  } else {
    const diff = Math.round((rent30YearNetWorth - buy30YearNetWorth) * 10) / 10;
    summaryMessage = `在当前假设下（房价涨幅 ${annualHouseAppreciationPct}% vs 理财收益率 ${annualInvestmentReturnPct}%），30年后租房理财积累的净资产比买房高出约 ${diff} 万元。`;
  }

  return {
    breakEvenYear,
    yearPoints,
    summaryMessage,
    buy30YearNetWorth,
    rent30YearNetWorth,
  };
}
