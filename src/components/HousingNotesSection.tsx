import React, { useState } from 'react';
import type { HousingNote, NoteCategory } from '../types/notes';
import { CATEGORY_MAP } from '../types/notes';
import { getStoredNotes, saveNotes } from '../utils/notesStorage';
import { BookOpenIcon, SparklesIcon } from './Icons';

export const HousingNotesSection: React.FC = () => {
  const [notes, setNotes] = useState<HousingNote[]>(() => getStoredNotes());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('全上海');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination & Accordion State
  const [notesPage, setNotesPage] = useState<number>(1);
  const [expandedNotesIds, setExpandedNotesIds] = useState<string[]>([]);
  const NOTES_PER_PAGE = 5;

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<Partial<HousingNote>>({
    title: '',
    content: '',
    category: 'field_experience',
    district: '浦东新区',
    sector: '',
    communityName: '',
    importance: 'high',
    tags: [],
  });

  const districts = ['全上海', '浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区', '闵行区', '青浦区', '松江区', '嘉定区', '宝山区'];

  const categories = [
    { id: 'all', label: '🌐 全部情报与随记' },
    { id: 'price_negotiate', label: '💰 中介/业主底价口风' },
    { id: 'field_experience', label: '☔ 实地看房心得/雨天实测' },
    { id: 'district_intel', label: '📌 板块/小区情报' },
    { id: 'metro_planning', label: '🚆 轨交/规划利好' },
    { id: 'policy_mortgage', label: '⚖️ 政策与利率微调' },
  ];

  const quickTags = ['#雨天看房实测', '#业主降价急售', '#底价可砍', '#学区划片', '#车位充裕', '#采光无遮挡', '#商贷利率'];

  const filteredNotes = notes.filter((n) => {
    const matchCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchDistrict = selectedDistrict === '全上海' || n.district === selectedDistrict || n.district === '全上海';
    const matchSearch =
      n.title.includes(searchTerm) ||
      n.content.includes(searchTerm) ||
      (n.communityName && n.communityName.includes(searchTerm)) ||
      (n.sector && n.sector.includes(searchTerm)) ||
      n.tags.some((t) => t.includes(searchTerm));

    return matchCategory && matchDistrict && matchSearch;
  });

  // Pagination calculation
  const totalNotesPages = Math.ceil(filteredNotes.length / NOTES_PER_PAGE) || 1;
  const paginatedNotes = filteredNotes.slice(
    (notesPage - 1) * NOTES_PER_PAGE,
    notesPage * NOTES_PER_PAGE
  );

  const toggleExpandNote = (id: string) => {
    if (expandedNotesIds.includes(id)) {
      setExpandedNotesIds(expandedNotesIds.filter((item) => item !== id));
    } else {
      setExpandedNotesIds([...expandedNotesIds, id]);
    }
  };

  const handleSaveNote = () => {
    if (!newNote.title || !newNote.content) {
      alert('请填写情报标题和详细随记内容！');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const created: HousingNote = {
      id: `note-${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      category: (newNote.category as NoteCategory) || 'field_experience',
      district: newNote.district || '浦东新区',
      sector: newNote.sector || '',
      communityName: newNote.communityName || '',
      importance: newNote.importance as any || 'normal',
      createdAt: formattedDate,
      tags: newNote.tags || [],
    };

    const updated = [created, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setNotesPage(1);
    setIsAddModalOpen(false);
    setNewNote({
      title: '',
      content: '',
      category: 'field_experience',
      district: '浦东新区',
      sector: '',
      communityName: '',
      importance: 'high',
      tags: [],
    });
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('确认删除这条随记情报吗？')) {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);
      saveNotes(updated);
    }
  };

  const handleAddQuickTag = (tag: string) => {
    const cleanTag = tag.replace('#', '');
    const currentTags = newNote.tags || [];
    if (!currentTags.includes(cleanTag)) {
      setNewNote({ ...newNote, tags: [...currentTags, cleanTag] });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderLeft: '5px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <BookOpenIcon color="var(--primary)" size={24} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                📝 我的置业情报与看房随记 (Housing Intel & Field Notes)
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              记录看房途中的底价口风、雨天防渗水实测、中介议价细节与轨交规划情报，打造专属置业大脑。
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            + 记一条情报 / 看房心得
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setNotesPage(1);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? 'var(--primary)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ maxWidth: '280px', width: '100%' }}>
            <input
              type="text"
              placeholder="搜索情报 (如: 采光, 让利, 泗泾)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setNotesPage(1);
              }}
            />
          </div>
        </div>

        {/* District Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            按区域筛选：
          </span>
          {districts.map((dis) => {
            const isSelected = selectedDistrict === dis;
            return (
              <button
                key={dis}
                onClick={() => {
                  setSelectedDistrict(dis);
                  setNotesPage(1);
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.775rem',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                }}
              >
                {dis}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {paginatedNotes.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            未找到相关置业随记，点击右上角“+ 记一条情报”录入。
          </div>
        ) : (
          paginatedNotes.map((note) => {
            const catInfo = CATEGORY_MAP[note.category] || { label: '随记', icon: '📝', badgeStyle: 'badge-secondary' };
            const impColor = note.importance === 'high' ? 'var(--danger)' : note.importance === 'medium' ? 'var(--warning)' : 'var(--text-dim)';
            const impLabel = note.importance === 'high' ? '🔴 核心情报' : note.importance === 'medium' ? '🟡 重点关注' : '⚪ 普通随记';

            const isExpanded = expandedNotesIds.includes(note.id);
            const isLongText = note.content.length > 80;
            const displayContent = !isExpanded && isLongText ? `${note.content.slice(0, 80)}...` : note.content;

            return (
              <div
                key={note.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  background: '#ffffff',
                  borderLeft: `5px solid ${note.importance === 'high' ? 'var(--danger)' : 'var(--primary)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span className={`badge ${catInfo.badgeStyle}`} style={{ fontSize: '0.775rem' }}>
                        {catInfo.label}
                      </span>
                      <span style={{ fontSize: '0.775rem', color: impColor, fontWeight: 700 }}>
                        {impLabel}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        🕒 {note.createdAt}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
                      {note.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'transparent' }}
                  >
                    🗑️ 删除
                  </button>
                </div>

                {/* Content text with Accordion Toggle */}
                <div style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '10px' }}>
                  {displayContent}
                  {isLongText && (
                    <button
                      onClick={() => toggleExpandNote(note.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginLeft: '8px',
                        fontSize: '0.825rem',
                      }}
                    >
                      {isExpanded ? '收起全文 👆' : '展开全文 👇'}
                    </button>
                  )}
                </div>

                {/* Meta details & tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📍 关联区域：{note.district || '全上海'} {note.sector ? `· ${note.sector}` : ''} {note.communityName ? `(${note.communityName})` : ''}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {note.tags?.map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '0.725rem', padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar for Notes */}
      {totalNotesPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 14px', fontSize: '0.8rem' }}
            disabled={notesPage <= 1}
            onClick={() => setNotesPage((p) => Math.max(1, p - 1))}
          >
            ◀ 上一页
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            第 {notesPage} / {totalNotesPages} 页 (共 {filteredNotes.length} 条情报)
          </span>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 14px', fontSize: '0.8rem' }}
            disabled={notesPage >= totalNotesPages}
            onClick={() => setNotesPage((p) => Math.min(totalNotesPages, p + 1))}
          >
            下一页 ▶
          </button>
        </div>
      )}

      {/* Add Note Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '24px 28px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SparklesIcon color="var(--primary)" size={20} />
                  记一条置业情报 / 看房随记
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>情报标题 *</label>
                <input
                  type="text"
                  placeholder="如：泗水和鸣雨天实测：无漏水防渗效果佳"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>情报分类</label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value as any })}
                  >
                    <option value="price_negotiate">💰 中介/业主底价口风</option>
                    <option value="field_experience">☔ 实地看房心得/雨天实测</option>
                    <option value="district_intel">📌 板块/小区情报</option>
                    <option value="metro_planning">🚆 轨交/城市规划利好</option>
                    <option value="policy_mortgage">⚖️ 政策与利率微调</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>重要程度</label>
                  <select
                    value={newNote.importance}
                    onChange={(e) => setNewNote({ ...newNote, importance: e.target.value as any })}
                  >
                    <option value="high">🔴 核心情报 (高优先)</option>
                    <option value="medium">🟡 重点关注 (中等)</option>
                    <option value="normal">⚪ 普通随记 (正常)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>关联行政区</label>
                  <select
                    value={newNote.district}
                    onChange={(e) => setNewNote({ ...newNote, district: e.target.value })}
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>关联板块</label>
                  <input
                    type="text"
                    placeholder="如：泗泾"
                    value={newNote.sector}
                    onChange={(e) => setNewNote({ ...newNote, sector: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>关联小区名称</label>
                  <input
                    type="text"
                    placeholder="如：泗水和鸣"
                    value={newNote.communityName}
                    onChange={(e) => setNewNote({ ...newNote, communityName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>详细随记与笔记内容 *</label>
                <textarea
                  rows={4}
                  placeholder="记录中介透露的底价范围、房东卖房真实动机、看房时发现的噪音/采光情况等..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                />
              </div>

              {/* Quick Tags Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>
                  一键添加标签：
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {quickTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddQuickTag(t)}
                      style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleSaveNote}>保存随记情报</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
