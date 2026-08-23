import type { HousingNote } from '../types/notes';

const STORAGE_NOTES_KEY = 'homebuy_shanghai_housing_notes_v1';

const initialSampleNotes: HousingNote[] = [
  {
    id: 'note-1',
    title: '泗水和鸣雨天实测：地下车库防渗水与采光测试',
    content: '大雨天实地考察泗水和鸣3号楼：地下车库采光井排风正常，地面无积水漏水迹象；中层802室客厅采光即使在阴雨天依然明亮，小区水系循环顺畅。',
    category: 'field_experience',
    district: '松江区',
    sector: '泗泾板块',
    communityName: '泗水和鸣',
    importance: 'high',
    createdAt: '2026-08-01 15:30',
    tags: ['雨天看房实测', '无渗水', '采光充足', '次新'],
  },
  {
    id: 'note-2',
    title: '联洋年华中介口风：6号楼业主急需资金打折试探',
    content: '对接太平洋房屋中介透露：联洋年华6号楼1102室业主因置业换房急需回笼资金，挂牌价860万，中介表示如果付现比例高，810万底价可以直接坐下来谈。',
    category: 'price_negotiate',
    district: '浦东新区',
    sector: '联洋板块',
    communityName: '联洋年华',
    importance: 'high',
    createdAt: '2026-08-02 11:20',
    tags: ['业主急售', '底价可砍', '让利50万'],
  },
  {
    id: 'note-3',
    title: '上海首套房贷利率微调公示',
    content: '询问招商银行与建设银行信贷经理：目前上海首套房贷利率统一执行 LPR - 45BP (即 2.65%~3.15%)，公积金贷款与商贷组合贷审批时间缩短至 5 个工作日。',
    category: 'policy_mortgage',
    district: '全上海',
    sector: '全上海',
    importance: 'medium',
    createdAt: '2026-07-28 09:45',
    tags: ['房贷利率下降', '组合贷极速审批'],
  },
  {
    id: 'note-4',
    title: '泗泾板块商业配套延伸：保利悦活荟二期开业',
    content: '9号线泗泾站北侧保利悦活荟二期商场正式招商，盒马鲜生与知名餐饮品牌入驻，周边泗水和鸣、金地玺华邨步行5分钟即达，生活便利度大幅提升。',
    category: 'metro_planning',
    district: '松江区',
    sector: '泗泾板块',
    importance: 'medium',
    createdAt: '2026-07-25 14:15',
    tags: ['商业利好', '盒马鲜生', '生活配套升级'],
  },
];

export function getStoredNotes(): HousingNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTES_KEY);
    if (!raw) return initialSampleNotes;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialSampleNotes;
  } catch {
    return initialSampleNotes;
  }
}

export function saveNotes(notes: HousingNote[]) {
  try {
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Save notes failed', e);
  }
}
