export interface RentSample {
  id: string;
  area: number; // 租赁面积 (㎡)
  monthlyRent: number; // 月租金 (元/月)
  layout?: string; // 户型（如：2室1厅）
  note?: string; // 备注来源（如：贝壳在租、中介打听成交）
  isShengxinZu?: boolean; // 是否为链家/贝壳「省心租/托管」房源（勾选后自动按业主到手90%折算）
}

export interface Community {
  id: string;
  name: string; // 小区名称
  district: string; // 行政区（如：浦东新区、松江区）
  sector: string; // 板块（如：联洋、泗泾）
  ringLocation?: string; // 环线定位（如：中外环、内环内）
  builtYear: number; // 建筑年代（如：2006）
  propertyFee: number; // 物业费 (元/㎡/月)
  propertyCompany?: string; // 物业公司名称
  metroInfoText?: string; // 轨交配套（如：9号线泗泾站350米）
  schoolInfo?: string; // 对口学区（如：泗泾实验学校）
  amenities?: string; // 商业/医疗/公园配套
  pros?: string[]; // 优点标签
  cons?: string[]; // 缺点/避坑标签

  // 容积率与车位指标
  plotRatio?: number; // 小区容积率（如：1.8）
  parkingRatio?: string; // 车位配比（如：1:1.2 或 1:0.5）
  parkingRentMonthly?: number; // 小区车位租金 (元/月)

  // 市场价格锚点（挂牌均价与成交均价，均为 元/㎡）
  askingAvgUnitPriceYuan?: number; // 最新挂牌均价 (元/㎡)
  dealAvgUnitPriceYuan?: number; // 最近成交均价 (元/㎡)

  // 租房样本库与单位单价 (元/㎡/月)
  rentSamples?: RentSample[];
  avgRentUnitPricePerSqm?: number; // 小区平均租赁单价 (元/㎡/月)
}

/**
 * 计算小区租房样本的加权平均单价 (元/㎡/月)
 * 若样本标注为“省心租/托管”，自动按 90% 业主真实净到手租金进行折算
 */
export function calculateCommunityAvgRentUnitPrice(samples?: RentSample[]): number {
  if (!samples || samples.length === 0) return 0;
  const totalRent = samples.reduce((sum, s) => {
    const rawRent = s.monthlyRent || 0;
    // 省心租/托管房源通常扣除 1~2个月服务空置费/管理费，房东真实到手约 90%
    const netRent = s.isShengxinZu ? rawRent * 0.90 : rawRent;
    return sum + netRent;
  }, 0);
  const totalArea = samples.reduce((sum, s) => sum + (s.area || 0), 0);
  if (totalArea <= 0) return 0;
  return Math.round((totalRent / totalArea) * 100) / 100;
}

/**
 * 根据小区平均租赁单价和目标房源建面智能推算预估月租金
 */
export function suggestMonthlyRentByCommunity(buildingArea: number, avgUnitRent: number): number {
  if (buildingArea <= 0 || avgUnitRent <= 0) return 0;
  // 户型修正系数：小户型(<70㎡)单价偏高1.05，大户型(>100㎡)单价微折0.92
  let factor = 1.0;
  if (buildingArea < 70) factor = 1.05;
  else if (buildingArea > 100) factor = 0.92;

  const raw = buildingArea * avgUnitRent * factor;
  // 四舍五入到整百
  return Math.round(raw / 100) * 100;
}

export interface HouseListing {
  id: string;
  communityId: string; // 关联小区 ID
  unitNumber: string; // 栋号/房号（如：8号楼 1202室）
  totalPrice: number; // 挂牌总价（万元）
  targetPrice: number; // 意向底价/心理砍价价（万元）
  buildingArea: number; // 建筑面积（㎡）
  insideArea: number; // 套内实用面积（㎡）
  layout: string; // 户型格局（如：3室2厅2卫）
  floorInfo: string; // 楼层（如：中层 12/18）
  orientation: string; // 朝向（如：南北通透）
  renovation: '精装' | '简装' | '毛坯' | '老旧需重装'; // 装修状况
  expectedMonthlyRent: number; // 预估月租金（元/月）
  floorplanUrl?: string; // 户型图图片 (Base64 或预设图)
  rating: number; // 个人看房综合评分 1-5星
  notes: string; // 看房随手记/优点采光记录

  // 车位信息
  hasParkingSpace?: boolean; // 是否包含产权车位/固定地下车位
  parkingPriceWuan?: number; // 产权车位打包价格（万元）

  // 流动性属性
  isSubNew?: boolean; // 是否为10年内次新房
  isNearMetro?: boolean; // 是否为正地铁房 (<500m)
  isSweetSpotLayout?: boolean; // 是否为黄金主力户型 (80-110㎡)

  // 风险折价因子勾选
  hasAgeRisk?: boolean; // 房龄>20年 (-10%)
  hasLayoutNoiseRisk?: boolean; // 顶底楼/临高架噪音/暗卫 (-10%)
  hasParkingPropertyRisk?: boolean; // 车位紧张/物业差 (-6%)
  hasMetroDistanceRisk?: boolean; // 离轨交>1.5km (-8%)
  hasSchoolPolicyRisk?: boolean; // 学区溢价剥离风险 (-15%)
}

export interface ComputedListingMetrics {
  unitPriceYuan: number; // 挂牌单价（元/㎡）
  targetUnitPriceYuan: number; // 意向底价单价（元/㎡）
  practicalRatioPct: number; // 实得率 %

  // 真实净租金与收益率指标
  netMonthlyRentYuan: number; // 真实月均净租金 (扣除1个月空置期+物业费后)
  netAnnualRentalYieldPct: number; // 真实年化净租金收益率 % (含契税中介费成本扣除)
  grossAnnualRentalYieldPct: number; // 毛租金收益率 % (对比参考)
  netPaybackYears: number; // 真实租金回收成本年数

  estimatedMonthlyMortgage: number; // 预估月供
  mortgageCoveragePct: number; // 真实净租金对月供覆盖率 %

  // 流动性指标
  liquidityScore: number; // 流动性评分 (0 - 100)
  liquidityBadge: string;
  liquidityBadgeStyle: 'badge-success' | 'badge-warning' | 'badge-danger' | 'badge-primary';
  estimatedSellMonths: string; // 预估二手房变现周期
  liquidityTags: string[];

  // 风险折价与理性安全入手价指标
  totalRiskDiscountPct: number; // 综合风险折价比例 (%)
  riskDiscountWuan: number; // 建议砍价折扣金额 (万元)
  rationalSafePriceWuan: number; // 理性安全入手价 (万元)
  riskDiscountBadge: string; // 勋章文字
  riskDiscountTags: string[]; // 缺陷风险标签

  // 容积率舒适度描述
  plotRatioText: string;

  // 挂牌价 vs 小区成交均价偏离分析
  priceVsDealAvgPct: number | null; // 房源挂牌单价相对小区近期成交均价的溢价率 (%)
  dealAvgGapPct: number | null;     // 小区挂压价差率 (挂牌均价 - 成交均价) / 挂牌均价 (%)
}

/**
 * 房源派生计算指标帮助函数 (100% 实时响应小区属性变更)
 */
export function computeListingMetrics(
  listing: HouseListing,
  comm?: Community,
  downPaymentRatio = 0.2,
  ratePct = 3.15
): ComputedListingMetrics {
  const unitPriceYuan = listing.buildingArea > 0 ? Math.round((listing.totalPrice * 10000) / listing.buildingArea) : 0;
  const targetUnitPriceYuan = listing.buildingArea > 0 ? Math.round((listing.targetPrice * 10000) / listing.buildingArea) : 0;
  const practicalRatioPct = listing.buildingArea > 0 ? Math.round((listing.insideArea / listing.buildingArea) * 1000) / 10 : 0;

  // 实时采用小区最新物业费支出 (元/年)
  const propertyFeePerMonth = comm?.propertyFee !== undefined ? comm.propertyFee : 3.0;
  const annualPropertyFeeYuan = propertyFeePerMonth * listing.buildingArea * 12;

  // 真实年化净租金
  const netAnnualRentYuan = Math.max(0, (listing.expectedMonthlyRent * 11) - annualPropertyFeeYuan);
  const netMonthlyRentYuan = Math.round(netAnnualRentYuan / 12);

  // 实际买入总成本分母 = 房屋总价 * 1.03 (含契税中介费)
  const totalPurchaseCostYuan = (listing.totalPrice * 10000) * 1.03;

  // 真实年化净租金收益率 %
  const netAnnualRentalYieldPct = totalPurchaseCostYuan > 0
    ? Math.round((netAnnualRentYuan / totalPurchaseCostYuan) * 10000) / 100
    : 0;

  const grossAnnualRentYuan = listing.expectedMonthlyRent * 12;
  const grossAnnualRentalYieldPct = (listing.totalPrice * 10000) > 0
    ? Math.round((grossAnnualRentYuan / (listing.totalPrice * 10000)) * 10000) / 100
    : 0;

  const netPaybackYears = netAnnualRentYuan > 0
    ? Math.round((totalPurchaseCostYuan / netAnnualRentYuan) * 10) / 10
    : 0;

  // 估算月供
  const loanWuan = listing.totalPrice * (1 - downPaymentRatio);
  const monthlyRate = ratePct / 100 / 12;
  const totalMonths = 360;
  const principal = loanWuan * 10000;
  const estimatedMonthlyMortgage = Math.round(
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );

  const mortgageCoveragePct = estimatedMonthlyMortgage > 0
    ? Math.round((netMonthlyRentYuan / estimatedMonthlyMortgage) * 1000) / 10
    : 0;

  // 容积率描述
  let plotRatioText = '容积率适中 (1.8)';
  if (comm?.plotRatio) {
    if (comm.plotRatio < 1.5) {
      plotRatioText = `低密舒适 (${comm.plotRatio})`;
    } else if (comm.plotRatio <= 2.5) {
      plotRatioText = `品质适中 (${comm.plotRatio})`;
    } else {
      plotRatioText = `高密高层 (${comm.plotRatio})`;
    }
  }

  // 流动性评估算法 (0 - 100分)
  let liquidityScore = 0;
  const liquidityTags: string[] = [];

  if (comm) {
    const ring = comm.ringLocation || '';
    if (['内环内', '中内环', '内环'].some(r => ring.includes(r))) {
      liquidityScore += 30;
      liquidityTags.push('核心市中心地段');
    } else if (['中外环', '大虹桥', '近郊强板块'].some(r => ring.includes(r) || comm.sector.includes(r))) {
      liquidityScore += 24;
      liquidityTags.push('热点强板块');
    } else {
      liquidityScore += 14;
    }

    const age = 2026 - comm.builtYear;
    if (age <= 10 || listing.isSubNew) {
      liquidityScore += 30;
      liquidityTags.push('品质次新');
    } else if (age <= 20) {
      liquidityScore += 20;
    } else {
      liquidityScore += 8;
    }

    const metro = comm.metroInfoText || '';
    if (listing.isNearMetro || ['350米', '400米', '500米', '正地铁'].some(m => metro.includes(m))) {
      liquidityScore += 20;
      liquidityTags.push('正地铁房');
    } else if (metro) {
      liquidityScore += 14;
    } else {
      liquidityScore += 6;
    }

    // 实时读取车位配比标签
    if (comm.parkingRatio) {
      liquidityTags.push(`车位比 ${comm.parkingRatio}`);
    }
  } else {
    liquidityScore += 50;
  }

  if (listing.hasParkingSpace) {
    liquidityTags.push('带产权车位');
  }

  if (listing.isSweetSpotLayout || (listing.buildingArea >= 75 && listing.buildingArea <= 110)) {
    liquidityScore += 20;
    liquidityTags.push('黄金主力户型');
  } else {
    liquidityScore += 10;
  }

  liquidityScore = Math.min(100, Math.max(0, liquidityScore));

  let liquidityBadge = '🔥 极高流动性·硬通货';
  let liquidityBadgeStyle: 'badge-success' | 'badge-warning' | 'badge-danger' | 'badge-primary' = 'badge-success';
  let estimatedSellMonths = '1 ~ 3 个月';

  if (liquidityScore >= 80) {
    liquidityBadge = '🔥 极高流动性·硬通货';
    liquidityBadgeStyle = 'badge-success';
    estimatedSellMonths = '1 ~ 3 个月';
  } else if (liquidityScore >= 65) {
    liquidityBadge = '🟢 良好流动性·稳健盘';
    liquidityBadgeStyle = 'badge-primary';
    estimatedSellMonths = '3 ~ 6 个月';
  } else if (liquidityScore >= 50) {
    liquidityBadge = '🟡 流动性平平·观望盘';
    liquidityBadgeStyle = 'badge-warning';
    estimatedSellMonths = '6 ~ 12 个月';
  } else {
    liquidityBadge = '🔴 流动性偏弱·流动性陷阱';
    liquidityBadgeStyle = 'badge-danger';
    estimatedSellMonths = '12 个月以上';
  }

  // 风险折价因子与理性安全入手价模型
  let totalRiskDiscountPct = 0;
  const riskDiscountTags: string[] = [];

  const commAge = comm ? 2026 - comm.builtYear : 0;
  if (listing.hasAgeRisk || commAge > 20) {
    totalRiskDiscountPct += 10;
    riskDiscountTags.push('房龄>20年 (-10%)');
  }
  if (listing.hasLayoutNoiseRisk) {
    totalRiskDiscountPct += 10;
    riskDiscountTags.push('顶底楼/临高架噪音 (-10%)');
  }

  // 自动根据小区最新车位配比判断车位紧张瑕疵 (-6%)
  const isTightParkingRatio = comm?.parkingRatio && ['1:0.5', '1:0.6', '1:0.7', '紧张', '偏紧', '不足'].some(p => comm.parkingRatio?.includes(p));
  if ((listing.hasParkingPropertyRisk || isTightParkingRatio) && !listing.hasParkingSpace) {
    totalRiskDiscountPct += 6;
    riskDiscountTags.push(`小区车位比紧张 ${comm?.parkingRatio ? `(${comm.parkingRatio})` : ''} (-6%)`);
  }

  if (listing.hasMetroDistanceRisk) {
    totalRiskDiscountPct += 8;
    riskDiscountTags.push('离轨交>1.5km (-8%)');
  }
  if (listing.hasSchoolPolicyRisk) {
    totalRiskDiscountPct += 15;
    riskDiscountTags.push('学区溢价剥离风险 (-15%)');
  }

  totalRiskDiscountPct = Math.min(35, totalRiskDiscountPct);

  const riskDiscountWuan = Math.round(((listing.totalPrice * totalRiskDiscountPct) / 100) * 10) / 10;
  const rationalSafePriceWuan = Math.round((listing.totalPrice - riskDiscountWuan) * 10) / 10;

  const riskDiscountBadge = totalRiskDiscountPct === 0
    ? '🛡️ 无明显缺陷·标准盘'
    : `🛡️ 建议风险折价让利 ${totalRiskDiscountPct}% (需砍 ${riskDiscountWuan}万)`;

  // 房源挂牌单价 vs 小区近期成交均价的溢价率
  let priceVsDealAvgPct: number | null = null;
  if (comm?.dealAvgUnitPriceYuan && comm.dealAvgUnitPriceYuan > 0 && unitPriceYuan > 0) {
    priceVsDealAvgPct = Math.round(((unitPriceYuan - comm.dealAvgUnitPriceYuan) / comm.dealAvgUnitPriceYuan) * 1000) / 10;
  }

  // 小区挂压价差率 (成交均价相对挂牌均价的议价空间)
  let dealAvgGapPct: number | null = null;
  if (comm?.askingAvgUnitPriceYuan && comm.askingAvgUnitPriceYuan > 0 && comm?.dealAvgUnitPriceYuan && comm.dealAvgUnitPriceYuan > 0) {
    dealAvgGapPct = Math.round(((comm.askingAvgUnitPriceYuan - comm.dealAvgUnitPriceYuan) / comm.askingAvgUnitPriceYuan) * 1000) / 10;
  }

  return {
    unitPriceYuan,
    targetUnitPriceYuan,
    practicalRatioPct,
    netMonthlyRentYuan,
    netAnnualRentalYieldPct,
    grossAnnualRentalYieldPct,
    netPaybackYears,
    estimatedMonthlyMortgage,
    mortgageCoveragePct,
    liquidityScore,
    liquidityBadge,
    liquidityBadgeStyle,
    estimatedSellMonths,
    liquidityTags,
    totalRiskDiscountPct,
    riskDiscountWuan,
    rationalSafePriceWuan,
    riskDiscountBadge,
    riskDiscountTags,
    plotRatioText,
    priceVsDealAvgPct,
    dealAvgGapPct,
  };
}
