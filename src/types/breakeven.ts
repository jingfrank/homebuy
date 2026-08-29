/**
 * 🎯 盈亏平衡价分析模块
 *
 * 核心公式：年化持有成本 = 年化持有收益（净租金）
 *
 * 持有成本 = ① 实际国债利率 × 首付额（自有资金实际机会成本）
 *          + ② 折旧率 × 房价（物理折旧，按楼龄分段，不受通胀影响）
 *          + ③ 实际贷款利率 × 贷款额（公积金+商贷组合，名义利率−通胀）
 *
 * 持有收益 = ④ 净年租金 = 月租金 × (12 − 空置月数) − 物业费 × 12
 *
 * 实际利率思路：通胀分别从国债利率和贷款利率中减去，得到实际资金成本
 *   实际国债利率 = 名义国债利率 − 通胀率
 *   实际贷款利率 = 名义贷款利率 − 通胀率
 *   → 盈亏平衡净租金收益率 = 综合实际成本率
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

  // 公积金年冲（冲本金、不改还款年限）
  yearOffsetEnabled: boolean;        // 是否启用年冲模拟
  providentBalanceInitial: number;  // 公积金账户初始余额 (元)
  providentMonthlyDeposit: number;  // 公积金月缴存额 (双方合计, 元)
  holdYears: number;                // 持有期/年冲模拟窗口 (年)
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
  yearOffsetEnabled: false,
  providentBalanceInitial: 100_000,
  providentMonthlyDeposit: 3_000,
  holdYears: 20,
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
//  五维客观合理溢价率量化模型 (5-Dimension Premium Valuation Model)
// ═══════════════════════════════════════════════════════════

export interface PremiumScoreParams {
  locationTierPct: number;    // ① 地段与城市能级溢价 (0% ~ +15%)
  qualityTierPct: number;     // ② 房屋性质与品质溢价 (-8% ~ +10%)
  resourceTierPct: number;    // ③ 确定性公共与学区资源 (0% ~ +8%)
  liquidityTierPct: number;   // ④ 户型流动性与去化速度 (-5% ~ +5%)
  utilityTierPct: number;     // ⑤ 自住通勤特定效用 (0% ~ +5%)
}

export interface PremiumOption {
  id: string;
  label: string;
  subLabel?: string;
  ratePct: number;
  rateLabel: string;
}

export const LOCATION_OPTIONS: PremiumOption[] = [
  { id: 'loc_core', label: '内环核心/一线滨江/前滩', subLabel: '顶级不可再生稀缺资源', ratePct: 0.12, rateLabel: '+12%' },
  { id: 'loc_mid_inner', label: '中内环产业核心区', subLabel: '张江/联洋/大宁/金桥等', ratePct: 0.08, rateLabel: '+8%' },
  { id: 'loc_mid_outer', label: '中外环成熟居住区', subLabel: '三林/北蔡/周家渡等', ratePct: 0.05, rateLabel: '+5%' },
  { id: 'loc_outer_metro', label: '外环外近郊地铁盘', subLabel: '泗泾/周浦/嘉定新城等', ratePct: 0.02, rateLabel: '+2%' },
  { id: 'loc_suburb', label: '远郊非核心/纯睡城', subLabel: '无城市红利溢价', ratePct: 0.00, rateLabel: '0%' },
];

export const QUALITY_OPTIONS: PremiumOption[] = [
  { id: 'q_subnew_brand', label: '大牌优质次新商品房', subLabel: '5~10年内/人车分流/大牌物业', ratePct: 0.08, rateLabel: '+8%' },
  { id: 'q_normal_commodity', label: '普通商品房 (10~20年)', subLabel: '维护尚可/商品房界面', ratePct: 0.02, rateLabel: '+2%' },
  { id: 'q_relocation', label: '动迁安置房 (有电梯)', subLabel: '两梯多户/群租较多/车位紧', ratePct: -0.04, rateLabel: '-4%' },
  { id: 'q_old_public', label: '25年以上老公房/老破小', subLabel: '无电梯/管道老化/高折旧', ratePct: -0.08, rateLabel: '-8%' },
];

export const RESOURCE_OPTIONS: PremiumOption[] = [
  { id: 'res_tier1', label: '一梯队名校 / 核心双轨交 400m', subLabel: '确定性名校学区或核心双枢纽', ratePct: 0.05, rateLabel: '+5%' },
  { id: 'res_normal', label: '普通学区 / 单轨交 800m', subLabel: '常规地铁商业配套', ratePct: 0.02, rateLabel: '+2%' },
  { id: 'res_none', label: '弱学区 / 远离轨交', subLabel: '无特殊公共资源加成', ratePct: 0.00, rateLabel: '0%' },
];

export const LIQUIDITY_OPTIONS: PremiumOption[] = [
  { id: 'liq_golden', label: '黄金主力南北通 2~3 房', subLabel: '80~100㎡全南/南北通(极速去化)', ratePct: 0.03, rateLabel: '+3%' },
  { id: 'liq_normal', label: '常规及格户型', subLabel: '采光正常/主流格局', ratePct: 0.00, rateLabel: '0%' },
  { id: 'liq_bad', label: '异形/采光差/超大动迁', subLabel: '手枪型/顶底楼/转手困难', ratePct: -0.04, rateLabel: '-4%' },
];

export const UTILITY_OPTIONS: PremiumOption[] = [
  { id: 'ut_great', label: '夫妻通勤<25分钟 / 老人带娃极便', subLabel: '大幅省下时间与情绪成本', ratePct: 0.03, rateLabel: '+3%' },
  { id: 'ut_normal', label: '常规通勤自住 / 出租投资', subLabel: '无额外自住情感红利', ratePct: 0.00, rateLabel: '0%' },
];

export function getDefaultPremiumParams(comm?: {
  name?: string;
  ringLocation?: string;
  builtYear?: number;
  schoolInfo?: string;
  metroInfoText?: string;
}): PremiumScoreParams {
  // 1. 地段
  let locationTierPct = 0.05; // 默认中外环
  const ring = comm?.ringLocation || '';
  if (ring.includes('内环内') || (ring.includes('内环') && !ring.includes('中内环'))) {
    locationTierPct = 0.12;
  } else if (ring.includes('中内环')) {
    locationTierPct = 0.08;
  } else if (ring.includes('中外环')) {
    locationTierPct = 0.05;
  } else if (ring.includes('外环外')) {
    locationTierPct = 0.02;
  }

  // 2. 品质与性质
  let qualityTierPct = 0.02;
  const name = comm?.name || '';
  const year = comm?.builtYear || 2015;
  const age = 2026 - year;

  if (name.includes('家园') || name.includes('新村') || name.includes('村') || (name.includes('苑') && age > 15)) {
    if (age > 25) {
      qualityTierPct = -0.08; // 老破小
    } else {
      qualityTierPct = -0.04; // 动迁安置房
    }
  } else if (age <= 10) {
    qualityTierPct = 0.08; // 大牌次新
  } else if (age <= 20) {
    qualityTierPct = 0.02; // 普通商品房
  } else {
    qualityTierPct = -0.08; // 老公房
  }

  // 3. 资源配套
  let resourceTierPct = 0.02;
  const school = comm?.schoolInfo || '';
  const metro = comm?.metroInfoText || '';
  if (school.includes('进才') || school.includes('明珠') || school.includes('实验') || school.includes('华二') || school.includes('名校')) {
    resourceTierPct = 0.05;
  } else if (metro.includes('400米') || metro.includes('300米') || metro.includes('双轨')) {
    resourceTierPct = 0.05;
  } else if (metro) {
    resourceTierPct = 0.02;
  } else {
    resourceTierPct = 0.00;
  }

  return {
    locationTierPct,
    qualityTierPct,
    resourceTierPct,
    liquidityTierPct: 0.00, // 默认常规户型
    utilityTierPct: 0.00,   // 默认常规自住
  };
}

// ═══════════════════════════════════════════════════════════
//  公积金年冲模拟（冲本金、不改还款年限）
// ═══════════════════════════════════════════════════════════
//
// 逐年模型（按月迭代实现，每年初执行一次年冲）：
//   初始贷款余额 L(0) = 房价 × 贷款比例
//   年冲金额 A(t) = min(公积金账户余额 G(t), 剩余贷款本金 L(t))
//   当期利息 I(t) = L(t) × 加权名义贷款利率
//   L(t+1) = L(t) − 常规月供本金部分 − A(t)   （冲后按剩余期限重算月供，月供递减）
//   G(t+1) = G(t) + 年缴存额 − A(t)
//
// 简化假设：组合贷按加权平均利率合并为单一余额口径（上海实际规则年冲
// 仅限公积金贷款部分，此处以加权利率近似整体冲抵效应）。

export interface YearOffsetSimulation {
  avgNominalLoanCostRate: number;    // 平均名义贷款成本率 = Σ利息/窗口/房价
  avgNoOffsetNominalRate: number;   // 同窗口无年冲对照平均费率
  costSavingRate: number;           // 年冲节省的名义成本率 (基点差, avgNoOffset − avgWith)
  totalInterestYuan: number;        // 持有期累计利息 (元)
  totalNoOffsetInterestYuan: number; // 无年冲对照累计利息 (元)
  totalOffsetYuan: number;          // 累计年冲金额 (元)
  firstYearOffsetYuan: number;      // 首年年冲金额 (元)
  remainingLoanEndYuan: number;     // 期末剩余贷款本金 (元)
  monthlyPaymentFirstYuan: number;  // 首年月供 (元)
  monthlyPaymentEndYuan: number;    // 期末月供 (元)
  loanPayoffYear: number | null;    // 持有期内贷款还清年份
}

export function simulateLoanWithYearOffset(
  totalPriceYuan: number,
  weightedAnnualRate: number,
  loanYears: number,
  params: BreakEvenParams,
): YearOffsetSimulation {
  const dp = params.downPaymentRatio;
  const r = weightedAnnualRate / 12;
  const holdMonths = Math.max(12, params.holdYears * 12);
  const loanTotalMonths = loanYears * 12;

  const computePayment = (balance: number, remainingMonths: number): number => {
    if (balance <= 0 || remainingMonths <= 0) return 0;
    if (r <= 0) return balance / remainingMonths;
    const f = Math.pow(1 + r, remainingMonths);
    return (balance * r * f) / (f - 1);
  };

  const run = (withOffset: boolean) => {
    let loanBalance = totalPriceYuan * (1 - dp);
    let providentBalance = withOffset ? params.providentBalanceInitial : 0;
    let totalInterest = 0;
    let totalOffset = 0;
    let firstYearOffset = 0;
    let monthlyPayment = 0;
    let monthlyPaymentFirst = 0;
    let payoffYear: number | null = null;

    for (let m = 1; m <= holdMonths; m++) {
      const remainingLoanMonths = loanTotalMonths - (m - 1);

      // 每年初：执行年冲 + 按剩余期限重算月供（不改还款年限 → 月供递减）
      if ((m - 1) % 12 === 0) {
        if (withOffset) {
          const offset = Math.min(providentBalance, loanBalance);
          if (offset > 0) {
            loanBalance -= offset;
            providentBalance -= offset;
            totalOffset += offset;
            if (m === 1) firstYearOffset = offset;
          }
        }
        monthlyPayment = computePayment(loanBalance, remainingLoanMonths);
        if (m === 1) monthlyPaymentFirst = monthlyPayment;
      }

      // 常规月供（等额本息按月拆分）
      if (loanBalance > 0) {
        const interest = loanBalance * r;
        let principal = monthlyPayment - interest;
        if (principal > loanBalance) principal = loanBalance;
        if (principal < 0) principal = 0;
        loanBalance = Math.max(0, loanBalance - principal);
        totalInterest += interest;
        if (loanBalance <= 0.5 && payoffYear === null) payoffYear = Math.ceil(m / 12);
      }

      // 公积金月缴存（无年冲对照不累计，账户钱不进模型）
      if (withOffset) providentBalance += params.providentMonthlyDeposit;
    }

    return {
      avgNominalRate: totalInterest / holdMonths / totalPriceYuan,
      totalInterest,
      totalOffset,
      firstYearOffset,
      loanBalance,
      monthlyPaymentFirst,
      monthlyPayment: monthlyPayment,
      payoffYear,
    };
  };

  const with_ = run(true);
  const without = run(false);

  return {
    avgNominalLoanCostRate: with_.avgNominalRate,
    avgNoOffsetNominalRate: without.avgNominalRate,
    costSavingRate: without.avgNominalRate - with_.avgNominalRate,
    totalInterestYuan: Math.round(with_.totalInterest),
    totalNoOffsetInterestYuan: Math.round(without.totalInterest),
    totalOffsetYuan: Math.round(with_.totalOffset),
    firstYearOffsetYuan: Math.round(with_.firstYearOffset),
    remainingLoanEndYuan: Math.round(with_.loanBalance),
    monthlyPaymentFirstYuan: Math.round(with_.monthlyPaymentFirst),
    monthlyPaymentEndYuan: Math.round(with_.monthlyPayment),
    loanPayoffYear: with_.payoffYear,
  };
}



export interface BreakEvenResult {
  // 核心底线结果
  breakEvenPricePerSqm: number;   // 盈亏平衡单价 (纯现金流底线价, 元/㎡)
  breakEvenTotalPriceWuan: number; // 盈亏平衡总价 (万元)

  // 五维溢价与合理目标建议价
  premiumParams: PremiumScoreParams;
  totalReasonablePremiumRate: number; // 五维总合理溢价率 (如 0.15 = +15%)
  targetFairPricePerSqm: number;       // 🎯 合理买入目标单价 (元/㎡) = breakEvenPricePerSqm * (1 + totalReasonablePremiumRate)
  targetFairTotalPriceWuan: number;    // 🎯 合理买入目标总价 (万元)

  // 谈判砍价与水分差额 (当前市场价 vs 合理目标建议价)
  bubbleGapPerSqm: number;             // 水分差额 (元/㎡) = 市场价 - 合理建议价 (正数表示虚高需砍价)
  bubbleGapPct: number;                // 溢价/水分百分比 %
  actionVerdict: 'strong_buy' | 'fair_buy' | 'overpriced' | 'extreme_bubble';
  actionVerdictText: string;

  // 成本端拆解（均为年化比率，已用实际利率）
  depreciationRate: number;     // 折旧率（物理折旧，不扣通胀）
  buildingAge: number;          // 楼龄
  realBondRate: number;         // 实际国债利率 = 名义国债利率 − 通胀
  realWeightedLoanRate: number; // 实际加权贷款利率 = 名义加权利率 − 通胀
  bondOpportunityCost: number; // 首付实际机会成本率 = realBondRate × dpRatio
  loanCostRate: number;         // 贷款实际成本率 = realWeightedLoanRate × (1-dpRatio)
  weightedLoanRate: number;    // 名义加权贷款年利率
  totalCostRate: number;       // 综合实际成本率

  // 公积金年冲（未启用时为 null）
  yearOffset: YearOffsetSimulation | null;
  yearOffsetDeltaReal: number; // 年冲带来的实际贷款成本率节省 (开启时为正)

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

  // 对比分析（当前市场价 vs 盈亏平衡底线价）
  askingPricePremiumPct: number | null; // 挂牌均价相对底线溢价率 %
  dealPricePremiumPct: number | null;    // 成交均价相对底线溢价率 %

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
  customPremiumParams?: PremiumScoreParams,
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

  // ── 成本端：实际利率思路，分段求解盈亏平衡总价 P ──
  // 实际国债利率 = 名义国债利率 − 通胀
  // 实际贷款利率 = 名义贷款利率 − 通胀
  // 成本率 = 实际国债利率 × 首付 + 折旧 + 实际贷款利率 × 贷款
  const realBondRate = bondRate - inflationRate;
  const realProvRate = providentRate - inflationRate;
  const realCommRate = commercialRate - inflationRate;

  const costRateAllProv = realBondRate * dp + depreciationRate + realProvRate * (1 - dp);
  const P1 = costRateAllProv > 0 ? totalNetAnnualRent / costRateAllProv : Infinity;
  const allProvThreshold = providentLimit / (1 - dp);

  let breakEvenTotalPrice: number;
  let loanType: 'all_provident' | 'mixed';
  let weightedLoanRate: number;

  if (P1 <= allProvThreshold) {
    breakEvenTotalPrice = P1;
    weightedLoanRate = providentRate;
    loanType = 'all_provident';
  } else {
    const baseCostRate = realBondRate * dp + depreciationRate + realCommRate * (1 - dp);
    const provFundSavings = providentLimit * (commercialRate - providentRate); // 公积金利率优惠（名义值之差，固定额）
    breakEvenTotalPrice = baseCostRate > 0
      ? (totalNetAnnualRent + provFundSavings) / baseCostRate
      : Infinity;

    const totalLoan = breakEvenTotalPrice * (1 - dp);
    const provPart = Math.min(totalLoan, providentLimit);
    const commPart = Math.max(0, totalLoan - providentLimit);
    weightedLoanRate = totalLoan > 0
      ? (provPart * providentRate + commPart * commercialRate) / totalLoan
      : 0;
    loanType = 'mixed';
  }

  // ── 公积金年冲调整（不动点迭代，成本率依赖 P）──
  // 盈亏平衡价 P 越低 → 贷款越少 → 年冲摊薄占比越大 → 成本率越低 → 反过来推高 P。
  // 只计年冲的边际节省（同窗口有无年冲对照之差），叠加到气球口径成本率上，
  // 保证关闭开关时结果与原模型完全一致。
  let yearOffsetSim: YearOffsetSimulation | null = null;
  let yearOffsetDeltaReal = 0;

  if (params.yearOffsetEnabled) {
    let P = breakEvenTotalPrice;
    let wRate = weightedLoanRate;
    let bestSim: YearOffsetSimulation | null = null;
    let deltaReal = 0;

    for (let iter = 0; iter < 100; iter++) {
      const totalLoan = P * (1 - dp);
      const provPart = Math.min(totalLoan, providentLimit);
      const commPart = Math.max(0, totalLoan - providentLimit);
      wRate = totalLoan > 0 ? (provPart * providentRate + commPart * commercialRate) / totalLoan : 0;

      bestSim = simulateLoanWithYearOffset(P, wRate, 30, params);
      const deltaNominal = bestSim.costSavingRate; // avgNoOffset − avgWith
      // 名义费率差 → 实际口径：按通胀占名义利率比例折算
      const realFactor = wRate > inflationRate ? 1 - inflationRate / wRate : 1;
      deltaReal = deltaNominal * realFactor;

      const costRate = (wRate - inflationRate) * (1 - dp) + realBondRate * dp + depreciationRate - deltaReal;
      if (costRate <= 0) break;
      const P_new = totalNetAnnualRent / costRate;
      if (Math.abs(P_new - P) < 1) { P = P_new; break; }
      P = P_new;
    }

    breakEvenTotalPrice = P;
    weightedLoanRate = wRate;
    yearOffsetSim = bestSim;
    yearOffsetDeltaReal = deltaReal;
  }

  const breakEvenPricePerSqm = Math.round(breakEvenTotalPrice / referenceArea);

  // ── 五维合理溢价与目标买入建议价计算 ──
  const premiumParams: PremiumScoreParams = customPremiumParams || getDefaultPremiumParams({ builtYear });
  const totalReasonablePremiumRate = Math.round(
    (
      (premiumParams.locationTierPct +
       premiumParams.qualityTierPct +
       premiumParams.resourceTierPct +
       premiumParams.liquidityTierPct +
       premiumParams.utilityTierPct) * 1000
    )
  ) / 1000;

  const targetFairPricePerSqm = Math.round(breakEvenPricePerSqm * (1 + totalReasonablePremiumRate));
  const wuan = (yuan: number) => Math.round((yuan / 10000) * 100) / 100;
  const targetFairTotalPriceWuan = wuan(targetFairPricePerSqm * referenceArea);

  // ── 市场实际价格与合理买入价对比（砍价空间与水分） ──
  const refMarketPrice = dealPricePerSqm ?? askingPricePerSqm ?? 0;
  let bubbleGapPerSqm = 0;
  let bubbleGapPct = 0;
  let actionVerdict: BreakEvenResult['actionVerdict'] = 'fair_buy';
  let actionVerdictText = '暂无市场价格数据';

  if (refMarketPrice > 0) {
    bubbleGapPerSqm = refMarketPrice - targetFairPricePerSqm;
    bubbleGapPct = Math.round(((refMarketPrice - targetFairPricePerSqm) / targetFairPricePerSqm) * 1000) / 10;

    if (bubbleGapPct <= -5) {
      actionVerdict = 'strong_buy';
      actionVerdictText = `🟢 低于合理买入目标价 ${Math.abs(bubbleGapPct)}%，性价比极高（安全边际充足）`;
    } else if (bubbleGapPct <= 8) {
      actionVerdict = 'fair_buy';
      actionVerdictText = `🟡 处于合理估值带（偏离 ${bubbleGapPct > 0 ? '+' : ''}${bubbleGapPct}%），可正常谈判推进`;
    } else if (bubbleGapPct <= 20) {
      actionVerdict = 'overpriced';
      actionVerdictText = `🔴 高于合理建议价 ${bubbleGapPct}%，建议砍价让利 ${bubbleGapPerSqm.toLocaleString()} 元/㎡`;
    } else {
      actionVerdict = 'extreme_bubble';
      actionVerdictText = `⛔ 严重泡沫虚高 ${bubbleGapPct}%，严重透支未来涨幅，坚决大刀砍价`;
    }
  }

  // ── 贷款结构 ──
  const downPaymentAmount = breakEvenTotalPrice * dp;
  const totalLoanAmount = breakEvenTotalPrice * (1 - dp);
  const providentLoanAmount = Math.min(totalLoanAmount, providentLimit);
  const commercialLoanAmount = Math.max(0, totalLoanAmount - providentLimit);

  // ── 成本拆解（实际利率，年冲开启时贷款成本率已扣除年冲节省） ──
  const realWeightedLoanRate = weightedLoanRate - inflationRate;
  const bondOpportunityCost = realBondRate * dp;
  const loanCostRate = realWeightedLoanRate * (1 - dp) - yearOffsetDeltaReal;
  const totalCostRate = bondOpportunityCost + depreciationRate + loanCostRate;

  // ── 对比分析 ──
  const askingPricePremiumPct = askingPricePerSqm && askingPricePerSqm > 0
    ? Math.round(((askingPricePerSqm - breakEvenPricePerSqm) / breakEvenPricePerSqm) * 1000) / 10
    : null;
  const dealPricePremiumPct = dealPricePerSqm && dealPricePerSqm > 0
    ? Math.round(((dealPricePerSqm - breakEvenPricePerSqm) / breakEvenPricePerSqm) * 1000) / 10
    : null;

  // ── 纯底线判定 ──
  let verdict: BreakEvenResult['verdict'];
  let verdictText: string;
  const refPct = dealPricePremiumPct ?? askingPricePremiumPct;

  if (refMarketPrice > 0 && refPct !== null) {
    if (refPct <= 0) {
      verdict = 'profitable';
      verdictText = `✅ 当前市场价低于纯现金流底线价 ${Math.abs(refPct)}%`;
    } else if (refPct <= 10) {
      verdict = 'marginal';
      verdictText = `🟡 当前市场价略高于纯现金流底线价 ${refPct}%`;
    } else {
      verdict = 'overpriced';
      verdictText = `🔴 当前市场价高于纯现金流底线价 ${refPct}%`;
    }
  } else {
    verdict = 'no_data';
    verdictText = '暂无市场价格数据，无法对比';
  }

  return {
    breakEvenPricePerSqm,
    breakEvenTotalPriceWuan: wuan(breakEvenTotalPrice),
    premiumParams,
    totalReasonablePremiumRate,
    targetFairPricePerSqm,
    targetFairTotalPriceWuan,
    bubbleGapPerSqm,
    bubbleGapPct,
    actionVerdict,
    actionVerdictText,
    depreciationRate,
    buildingAge,
    realBondRate,
    realWeightedLoanRate,
    bondOpportunityCost,
    loanCostRate,
    weightedLoanRate,
    totalCostRate,
    yearOffset: yearOffsetSim,
    yearOffsetDeltaReal,
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
