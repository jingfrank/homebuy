import type { Community, HouseListing } from '../types/community';

const STORAGE_COMMUNITIES_KEY = 'homebuy_shanghai_communities_v1';
const STORAGE_LISTINGS_KEY = 'homebuy_shanghai_listings_v1';

// 示例 SVG 默认示意户型图 (精致3室2厅)
export const DEFAULT_FLOORPLAN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="4"/><rect x="20" y="20" width="160" height="130" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="100" y="85" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">主卧 16㎡</text><rect x="200" y="20" width="180" height="110" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="290" y="75" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">客餐厅 28㎡</text><rect x="20" y="160" width="120" height="120" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="80" y="225" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">次卧 12㎡</text><rect x="150" y="160" width="100" height="120" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="200" y="225" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">书房 9㎡</text><rect x="260" y="160" width="120" height="120" fill="%23dbeafe" stroke="%233b82f6" stroke-width="2"/><text x="320" y="225" font-family="sans-serif" font-size="14" fill="%231d4ed8" text-anchor="middle" font-weight="bold">阳台 8㎡</text></svg>`;

const initialSampleCommunities: Community[] = [
  {
    id: 'comm-1',
    name: '联洋年华',
    district: '浦东新区',
    sector: '联洋板块',
    ringLocation: '中内环',
    builtYear: 2005,
    propertyFee: 2.8,
    propertyCompany: '陆家嘴物业',
    metroInfoText: '9号线芳甸路站 400米 / 2号线上海科技馆站 800米',
    schoolInfo: '对口公办名校：进才实验小学 / 进才实验中学',
    amenities: '丁香国际商业中心、大拇指广场、世纪公园',
    pros: ['经典品质次新', '双轨交+对口双进才学区', '生态宜居离世纪公园近'],
    cons: ['车位配比稍紧', '房龄满20年受部分商业贷款限制'],
    askingAvgUnitPriceYuan: 82000,
    dealAvgUnitPriceYuan: 74000,
    rentSamples: [
      { id: 'rs-1', area: 88, monthlyRent: 8500, layout: '2室2厅', note: '贝壳最新在租成交' },
      { id: 'rs-2', area: 98, monthlyRent: 9500, layout: '3室2厅', note: '链家中介线下问询' },
    ],
    avgRentUnitPricePerSqm: 96.77,
  },
  {
    id: 'comm-2',
    name: '泗水和鸣',
    district: '松江区',
    sector: '泗泾板块',
    ringLocation: '外环外强板块',
    builtYear: 2021,
    propertyFee: 3.2,
    propertyCompany: '绿城物业',
    metroInfoText: '9号线泗泾站 350米',
    schoolInfo: '对口泗泾实验学校（九年一贯制）',
    amenities: '三湘商业广场、保利悦活荟、泗泾古镇',
    pros: ['次新大牌物业品质高', '人车分流绿化极佳', '紧邻9号线30分钟直达张江/徐家汇'],
    cons: ['早高峰9号线挤', '周边老旧厂房仍在拆迁升级中'],
    askingAvgUnitPriceYuan: 46000,
    dealAvgUnitPriceYuan: 42000,
    rentSamples: [
      { id: 'rs-3', area: 88, monthlyRent: 4300, layout: '3室2厅', note: '小区主打主力精装租金' },
      { id: 'rs-4', area: 60, monthlyRent: 3200, layout: '2室1厅', note: '中介最近两周成交样本' },
    ],
    avgRentUnitPricePerSqm: 50.68,
  },
];

const initialSampleListings: HouseListing[] = [
  {
    id: 'list-1',
    communityId: 'comm-1',
    unitNumber: '6号楼 1102室',
    totalPrice: 860,
    targetPrice: 810,
    buildingArea: 98,
    insideArea: 81,
    layout: '3室2厅1卫',
    floorInfo: '中高层 (11/18)',
    orientation: '南北通透',
    renovation: '精装',
    expectedMonthlyRent: 9500,
    floorplanUrl: DEFAULT_FLOORPLAN_SVG,
    rating: 5,
    notes: '业主出国急售！采光视野无遮挡，看房方便，满五唯一税费少。',
    isSubNew: false,
    isNearMetro: true,
    isSweetSpotLayout: true,
  },
  {
    id: 'list-2',
    communityId: 'comm-1',
    unitNumber: '12号楼 501室',
    totalPrice: 780,
    targetPrice: 740,
    buildingArea: 88,
    insideArea: 72,
    layout: '2室2厅1卫',
    floorInfo: '低层 (5/18)',
    orientation: '南',
    renovation: '简装',
    expectedMonthlyRent: 8200,
    floorplanUrl: DEFAULT_FLOORPLAN_SVG,
    rating: 4,
    notes: '单价较低，但靠近小区内部水景，客厅带大飘窗。',
    isSubNew: false,
    isNearMetro: true,
    isSweetSpotLayout: true,
  },
  {
    id: 'list-3',
    communityId: 'comm-2',
    unitNumber: '3号楼 802室',
    totalPrice: 420,
    targetPrice: 385,
    buildingArea: 88,
    insideArea: 74,
    layout: '3室2厅2卫',
    floorInfo: '中层 (8/18)',
    orientation: '南北通透',
    renovation: '精装',
    expectedMonthlyRent: 4300,
    floorplanUrl: DEFAULT_FLOORPLAN_SVG,
    rating: 5,
    notes: '网红边套三房，次新带中央空调+地暖，出租收益率高！',
    isSubNew: true,
    isNearMetro: true,
    isSweetSpotLayout: true,
  },
];

export function getStoredCommunities(): Community[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMMUNITIES_KEY);
    if (raw === null) return initialSampleCommunities;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initialSampleCommunities;
  } catch {
    return initialSampleCommunities;
  }
}

export function saveCommunities(communities: Community[]) {
  try {
    localStorage.setItem(STORAGE_COMMUNITIES_KEY, JSON.stringify(communities));
  } catch (e) {
    console.error('Save communities failed', e);
  }
}

export function getStoredListings(): HouseListing[] {
  try {
    const raw = localStorage.getItem(STORAGE_LISTINGS_KEY);
    if (raw === null) return initialSampleListings;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initialSampleListings;
  } catch {
    return initialSampleListings;
  }
}

export function saveListings(listings: HouseListing[]) {
  try {
    localStorage.setItem(STORAGE_LISTINGS_KEY, JSON.stringify(listings));
  } catch (e) {
    console.error('Save listings failed', e);
  }
}
