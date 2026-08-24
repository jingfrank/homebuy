/**
 * Seed script: import initial sample data into SQLite
 * Run: node --experimental-sqlite server/seed.js  (after build)
 *  OR: npx tsx --experimental-sqlite server/seed.ts (dev)
 */
import { initDb, db } from './db.js';

initDb();

const DEFAULT_FLOORPLAN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="4"/><rect x="20" y="20" width="160" height="130" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="100" y="85" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">主卧 16㎡</text><rect x="200" y="20" width="180" height="110" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="290" y="75" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">客餐厅 28㎡</text><rect x="20" y="160" width="120" height="120" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="80" y="225" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">次卧 12㎡</text><rect x="150" y="160" width="100" height="120" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="200" y="225" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">书房 9㎡</text><rect x="260" y="160" width="120" height="120" fill="%23dbeafe" stroke="%233b82f6" stroke-width="2"/><text x="320" y="225" font-family="sans-serif" font-size="14" fill="%231d4ed8" text-anchor="middle" font-weight="bold">阳台 8㎡</text></svg>`;

const insertComm = db.prepare(`
  INSERT OR IGNORE INTO communities
    (id, name, district, sector, ring_location, built_year, property_fee,
    property_company, metro_info_text, school_info, amenities, pros, cons,
    asking_avg_unit_price_yuan, deal_avg_unit_price_yuan, rent_samples, avg_rent_unit_price_per_sqm)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

insertComm.run(
  'comm-1','联洋年华','浦东新区','联洋板块','中内环',2005,2.8,'陆家嘴物业',
  '9号线芳甸路站 400米 / 2号线上海科技馆站 800米',
  '对口公办名校：进才实验小学 / 进才实验中学',
  '丁香国际商业中心、大拇指广场、世纪公园',
  JSON.stringify(['经典品质次新','双轨交+对口双进才学区','生态宜居离世纪公园近']),
  JSON.stringify(['车位配比稍紧','房龄满20年受部分商业贷款限制']),
  82000, 74000,
  JSON.stringify([
    {id:'rs-1',area:88,monthlyRent:8500,layout:'2室2厅',note:'贝壳最新在租成交'},
    {id:'rs-2',area:98,monthlyRent:9500,layout:'3室2厅',note:'链家中介线下问询'}
  ]),
  96.77
);

insertComm.run(
  'comm-2','泗水和鸣','松江区','泗泾板块','外环外强板块',2021,3.2,'绿城物业',
  '9号线泗泾站 350米','对口泗泾实验学校（九年一贯制）',
  '三湘商业广场、保利悦活荟、泗泾古镇',
  JSON.stringify(['次新大牌物业品质高','人车分流绿化极佳','紧邻9号线30分钟直达张江/徐家汇']),
  JSON.stringify(['早高峰9号线挤','周边老旧厂房仍在拆迁升级中']),
  46000, 42000,
  JSON.stringify([
    {id:'rs-3',area:88,monthlyRent:4300,layout:'3室2厅',note:'小区主打主力精装租金'},
    {id:'rs-4',area:60,monthlyRent:3200,layout:'2室1厅',note:'中介最近两周成交样本'}
  ]),
  50.68
);

const insertListing = db.prepare(`
  INSERT OR IGNORE INTO listings
    (id, community_id, unit_number, total_price, target_price, building_area, inside_area,
    layout, floor_info, orientation, renovation, expected_monthly_rent,
    floorplan_url, rating, notes, is_sub_new, is_near_metro, is_sweet_spot_layout)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

insertListing.run('list-1','comm-1','6号楼 1102室',860,810,98,81,'3室2厅1卫','中高层 (11/18)','南北通透','精装',9500,DEFAULT_FLOORPLAN_SVG,5,'业主出国急售！采光视野无遮挡，看房方便，满五唯一税费少。',0,1,1);
insertListing.run('list-2','comm-1','12号楼 501室',780,740,88,72,'2室2厅1卫','低层 (5/18)','南','简装',8200,DEFAULT_FLOORPLAN_SVG,4,'单价较低，但靠近小区内部水景，客厅带大飘窗。',0,1,1);
insertListing.run('list-3','comm-2','3号楼 802室',420,385,88,74,'3室2厅2卫','中层 (8/18)','南北通透','精装',4300,DEFAULT_FLOORPLAN_SVG,5,'网红边套三房，次新带中央空调+地暖，出租收益率高！',1,1,1);

const insertNote = db.prepare(`
  INSERT OR IGNORE INTO housing_notes (id, title, content, category, district, sector, community_name, importance, created_at, tags)
  VALUES (?,?,?,?,?,?,?,?,?,?)
`);

insertNote.run('note-1','泗水和鸣雨天实测：地下车库防渗水与采光测试','大雨天实地考察泗水和鸣3号楼：地下车库采光井排风正常，地面无积水漏水迹象；中层802室客厅采光即使在阴雨天依然明亮，小区水系循环顺畅。','field_experience','松江区','泗泾板块','泗水和鸣','high','2026-08-01 15:30',JSON.stringify(['雨天看房实测','无渗水','采光充足','次新']));
insertNote.run('note-2','联洋年华中介口风：6号楼业主急需资金打折试探','对接太平洋房屋中介透露：联洋年华6号楼1102室业主因置业换房急需回笼资金，挂牌价860万，中介表示如果付现比例高，810万底价可以直接坐下来谈。','price_negotiate','浦东新区','联洋板块','联洋年华','high','2026-08-02 11:20',JSON.stringify(['业主急售','底价可砍','让利50万']));
insertNote.run('note-3','上海首套房贷利率微调公示','询问招商银行与建设银行信贷经理：目前上海首套房贷利率统一执行 LPR - 45BP (即 2.65%~3.15%)，公积金贷款与商贷组合贷审批时间缩短至 5 个工作日。','policy_mortgage','全上海','全上海','','medium','2026-07-28 09:45',JSON.stringify(['房贷利率下降','组合贷极速审批']));
insertNote.run('note-4','泗泾板块商业配套延伸：保利悦活荟二期开业','9号线泗泾站北侧保利悦活荟二期商场正式招商，盒马鲜生与知名餐饮品牌入驻，周边泗水和鸣、金地玺华邨步行5分钟即达，生活便利度大幅提升。','metro_planning','松江区','泗泾板块','','medium','2026-07-25 14:15',JSON.stringify(['商业利好','盒马鲜生','生活配套升级']));

console.log('✅ Seed data inserted successfully!');
