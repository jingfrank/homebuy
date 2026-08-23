export type NoteCategory = 
  | 'district_intel'  // 板块/小区情报
  | 'metro_planning'  // 轨交/城市规划
  | 'price_negotiate' // 中介/业主底价口风
  | 'policy_mortgage' // 政策与利率微调
  | 'field_experience';// 实地看房心得/雨天实测

export interface HousingNote {
  id: string;
  title: string; // 情报标题
  content: string; // 详细内容/随记
  category: NoteCategory;
  district?: string; // 关联行政区 (如: 浦东新区)
  sector?: string; // 关联板块 (如: 联洋)
  communityName?: string; // 关联小区 (如: 泗水和鸣)
  importance: 'high' | 'medium' | 'normal'; // 重要程度
  createdAt: string; // 记录时间 (如: 2026-08-02 18:30)
  tags: string[]; // 标签列表
}

export const CATEGORY_MAP: Record<NoteCategory, { label: string; icon: string; badgeStyle: string }> = {
  price_negotiate: { label: '💰 中介/业主底价口风', icon: '💰', badgeStyle: 'badge-warning' },
  field_experience: { label: '☔ 实地看房心得/雨天实测', icon: '☔', badgeStyle: 'badge-success' },
  district_intel: { label: '📌 板块/小区情报', icon: '📌', badgeStyle: 'badge-primary' },
  metro_planning: { label: '🚆 轨交/城市规划利好', icon: '🚆', badgeStyle: 'badge-primary' },
  policy_mortgage: { label: '⚖️ 政策与利率微调', icon: '⚖️', badgeStyle: 'badge-secondary' },
};
