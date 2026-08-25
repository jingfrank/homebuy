/**
 * 🎯 盈亏平衡价分析模块
 *
 * 核心公式：年化持有成本 = 年化持有收益（净租金）
 *
 * 持有成本 = ① 国债利率 × 首付额（自有资金机会成本）
 *          + ② 折旧率 × 房价（物理折旧，按楼龄分段）
 *          + ③ 加权贷款利率 × 贷款额（公积金+商贷组合）
 *
 * 持有收益 = ④ 净年租金 = 月租金 × (12 − 空置月数) − 物业费 × 12
 *
 * 通胀对冲（Gordon增长模型）：租金随通胀增长，等价于要求的首年收益率降低 g%
 *   → 盈亏平衡净租金收益率 = 综合成本率 − 通胀率
 *   → 盈亏平衡房价 = 净年租金 ÷ 盈亏平衡净租金收益率
 */

// ═══════════════════════════════════════════════════════════
//  参数定义
// ═══════════════════════════════════════════════════════════

export interface BreakEvenParams {
  downPaymentRatio: number;   // 首付比例 (0.15)
  bondRate: number;           // 国债年利率 (0.022)
  providentRate: number;      // 公积金贷款年利率 (0.0285)
  commercialRate: number;     // 商贷年利率 (0.0305)
  providentLimit: number;    // 公积金额度上限 (元, 1300000)
  inflationRate: number;      // 通胀/租金年增速率 (0.009)
  vacancyMonths: number;      // 年空置月数 (0.5)
  referenceArea: number;      // 参考房源面积 (㎡)
  currentYear: number;        // 当前年份
}

export const DEFAULT_BREAKEVEN_PARAMS: BreakEvenParams = {
  downPaymentRatio: 0.15,
  bondRate: 0.022,
  providentRate: 0.0285,
  commercialRate: 0.0305,
  providentLimit: 1_300_000,
  inflationRate: 0.009,
  vacancyMonths: 0.5,
  referenceArea: 90,
  currentYear: 2026,
};

// ═══════════════════════════════════════════════════════════
//  楼龄 → 折旧率 分段表
// ═══════════════════════════════════════════════════════════

export function getDepreciationRate(age: number): number {
  if (age < 0) return 0;
  if (age < 5) return 0.003;  // 0.3%
  if (age < 10) return 0.007; // 0.7%
  if (age < 15) return 0.012; // 1.2%
  if (age < 20) return 0.017;  // 1.7%
  if (age < 25) return 0.022;  // 2.2%
  return 0.027;                // 25-50年 2.7%
}

export const DEPRECIATION_TIERS: { range: string; rate: number; ratePct: string }[] = [
  { range: '0 ~ 5年',   rate: 0.003, ratePct: '0.3%' },
  { range: '5 ~ 10年',  rate: 0.007, ratePct: '0.7%' },
  { range: '10 ~ 15年', rate: 0.012, ratePct: '1.2%' },
  { range: '15 ~ 20年', rate: 0.017, ratePct: '1.7%' },
  { range: '20 ~ 25年', rate: 0.022, ratePct: '2.2%' },
  { range: '25 ~ 50年', rate: 0.027, ratePct: '2.7%' },
];

// ═══════════════════════════════════════════════════════════
//  计算结果
// ═══════════════════════════════════════════════════════════

export interface BreakEvenResult {
  // 核心结果
  breakEvenPricePerSqm: number;   // 盈亏平衡单价 (元/㎡)
  breakEvenTotalPriceWuan: number; // 盈亏平衡总价 (万元)

  // 成本端拆解（均为年化比率）
  depreciationRate: number;     // 折旧率
  buildingAge: number;          // 楼龄
  bondOpportunityCost: number; // 国债机会成本率 = bondRate × dpRatio
  loanCostRate: number;         // 贷款成本率 = weightedLoanRate × (1-dpRatio)
  weightedLoanRate: number;    // 加权贷款年利率
  inflationHedge: number;      // 通胀对冲 (负值，从成本中扣除)
  totalCostRate: number;       // 综合成本率 (已扣除通胀)

  // 收益端
  netMonthlyRentPerSqm: number;   // 净月租金 (元/㎡/月)
  netAnnualRentPerSqm: number;    // 净年租金 (元/㎡/年)
  breakEvenNetRentalYield: number; // 盈亏平衡净租金收益率 = totalCostRate

  // 贷款结构（按盈亏平衡总价计算）
  loanType: 'all_provident' | 'mixed';
  downPaymentAmountWuan: number;    // 首付 (万元)
  totalLoanAmountWuan: number;     // 贷款总额 (万元)
  providentLoanAmountWuan: number; // 公积金贷款 (万元)
  commercialLoanAmountWuan: number; // 商贷 (万元)

  // 对比分析（当前市场价 vs 盈亏平衡价）
  askingPricePremiumPct: number | null; // 挂牌均价溢价率 %
  dealPricePremiumPct: number | null;    // 成交均价溢价率 %

  // 判定
  verdict: 'profitable' | 'marginal' | 'overpriced' | 'no_data';
  verdictText: string;
}

// ═══════════════════════════════════════════════════════════
//  核心计算函数
// ═══════════════════════════════════════════════════════════

export function computeBreakEven(
  avgRentUnitPrice: number,  // 元/㎡/月
  propertyFee: number,       // 元/㎡/月
  builtYear: number,
  askingPricePerSqm?: number,
  dealPricePerSqm?: number,
  params: BreakEvenParams = DEFAULT_BREAKEVEN_PARAMS,
): BreakEvenResult | null {
  if (avgRentUnitPrice <= 0) return null;

  const buildingAge = params.currentYear - builtYear;
  const depreciationRate = getDepreciationRate(buildingAge);
  const { referenceArea, downPaymentRatio: dp, bondRate, providentRate, commercialRate, providentLimit, inflationRate, vacancyMonths } = params;

  // ── 收益端：净年租金 ──
  const netAnnualRentPerSqm = avgRentUnitPrice * (12 - vacancyMonths) - propertyFee * 12;
  const netMonthlyRentPerSqm = netAnnualRentPerSqm / 12;

  if (netAnnualRentPerSqm <= 0) return null;

  const totalNetAnnualRent = netAnnualRentPerSqm * referenceArea; // 参考面积的总净年租金

  // ── 成本端：分段求解盈亏平衡总价 P ──
  //  P 满足: totalNetAnnualRent = P × (costRate − inflationRate)
  //  costRate = bondRate×dp + depRate + weightedLoanRate×(1−dp)
  //  weightedLoanRate 取决于 P（因公积金额度上限是固定值）

  // Case 1: 全公积金 (贷款 ≤ 公积金上限)
  //   P × (1−dp) ≤ providentLimit  →  P ≤ providentLimit / (1−dp)
  //   weightedLoanRate = providentRate
  const costRateAllProv = bondRate * dp + depreciationRate + providentRate * (1 - dp) - inflationRate;
  const P1 = costRateAllProv > 0 ? totalNetAnnualRent / costRateAllProv : Infinity;
  const allProvThreshold = providentLimit / (1 - dp);

  let breakEvenTotalPrice: number;
  let loanType: 'all_provident' | 'mixed';
  let weightedLoanRate: number;

  if (P1 <= allProvThreshold) {
    // 全公积金即可覆盖
    breakEvenTotalPrice = P1;
    weightedLoanRate = providentRate;
    loanType = 'all_provident';
  } else {
    // Case 2: 组合贷 (贷款 > 公积金上限)
    //   weightedLoanRate = commRate + providentLimit×(provRate−commRate) / (P×(1−dp))
    //   代入后:
    //   totalNetAnnualRent = P×[bondRate×dp + dep + commRate×(1−dp) − inflation] + providentLimit×(provRate−commRate)
    //   P = [totalNetAnnualRent + providentLimit×(commRate−provRate)] / baseCostRate
    const baseCostRate = bondRate * dp + depreciationRate + commercialRate * (1 - dp) - inflationRate;
    const provFundSavings = providentLimit * (commercialRate - providentRate); // 公积金利率优惠节省 (正数)
    breakEvenTotalPrice = baseCostRate > 0
      ? (totalNetAnnualRent + provFundSavings) / baseCostRate
      : Infinity;

    // 回算实际加权利率
    const totalLoan = breakEvenTotalPrice * (1 - dp);
    const provPart = Math.min(totalLoan, providentLimit);
    const commPart = Math.max(0, totalLoan - providentLimit);
    weightedLoanRate = totalLoan > 0
      ? (provPart * providentRate + commPart * commercialRate) / totalLoan
      : 0;
    loanType = 'mixed';
  }

  const breakEvenPricePerSqm = breakEvenTotalPrice / referenceArea;

  // ── 贷款结构 ──
  const downPaymentAmount = breakEvenTotalPrice * dp;
  const totalLoanAmount = breakEvenTotalPrice * (1 - dp);
  const providentLoanAmount = Math.min(totalLoanAmount, providentLimit);
  const commercialLoanAmount = Math.max(0, totalLoanAmount - providentLimit);

  // ── 成本拆解 ──
  const bondOpportunityCost = bondRate * dp;
  const loanCostRate = weightedLoanRate * (1 - dp);
  const totalCostRate = bondOpportunityCost + depreciationRate + loanCostRate - inflationRate;

  // ── 对比分析 ──
  const askingPricePremiumPct = askingPricePerSqm && askingPricePerSqm > 0
    ? Math.round(((askingPricePerSqm - breakEvenPricePerSqm) / breakEvenPricePerSqm) * 1000) / 10
    : null;
  const dealPricePremiumPct = dealPricePerSqm && dealPricePerSqm > 0
    ? Math.round(((dealPricePerSqm - breakEvenPricePerSqm) / breakEvenPricePerSqm) * 1000) / 10
    : null;

  // ── 判定 ──
  let verdict: BreakEvenResult['verdict'];
  let verdictText: string;
  const refPrice = dealPricePerSqm ?? askingPricePerSqm ?? 0;
  const refPct = dealPricePremiumPct ?? askingPricePremiumPct;

  if (refPrice > 0 && refPct !== null) {
    if (refPct <= 0) {
      verdict = 'profitable';
      verdictText = `✅ 当前${dealPricePerSqm ? '成交' : '挂牌'}价低于盈亏平衡价 ${Math.abs(refPct)}%，持有成本 ≤ 持有收益`;
    } else if (refPct <= 10) {
      verdict = 'marginal';
      verdictText = `🟡 当前${dealPricePerSqm ? '成交' : '挂牌'}价略高于盈亏平衡价 ${refPct}%，接近临界点`;
    } else {
      verdict = 'overpriced';
      verdictText = `🔴 当前${dealPricePerSqm ? '成交' : '挂牌'}价高于盈亏平衡价 ${refPct}%，纯持有不划算`;
    }
  } else {
    verdict = 'no_data';
    verdictText = '暂无市场价格数据，无法对比';
  }

  const wuan = (yuan: number) => Math.round((yuan / 10000) * 100) / 100;

  return {
    breakEvenPricePerSqm: Math.round(breakEvenPricePerSqm),
    breakEvenTotalPriceWuan: wuan(breakEvenTotalPrice),
    depreciationRate,
    buildingAge,
    bondOpportunityCost,
    loanCostRate,
    weightedLoanRate,
    inflationHedge: -inflationRate,
    totalCostRate,
    netMonthlyRentPerSqm: Math.round(netMonthlyRentPerSqm * 100) / 100,
    netAnnualRentPerSqm: Math.round(netAnnualRentPerSqm * 100) / 100,
    breakEvenNetRentalYield: totalCostRate,
    loanType,
    downPaymentAmountWuan: wuan(downPaymentAmount),
    totalLoanAmountWuan: wuan(totalLoanAmount),
    providentLoanAmountWuan: wuan(providentLoanAmount),
    commercialLoanAmountWuan: wuan(commercialLoanAmount),
    askingPricePremiumPct,
    dealPricePremiumPct,
    verdict,
    verdictText,
  };
}
