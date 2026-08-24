import React, { useState, useEffect } from 'react';
import type { HousingNote, NoteCategory } from '../types/notes';
import { CATEGORY_MAP } from '../types/notes';
import { getStoredNotes, addNote, deleteNote } from '../utils/notesStorage';
import { BookOpenIcon, SparklesIcon } from './Icons';

export const HousingNotesSection: React.FC = () => {
  const [notes, setNotes] = useState<HousingNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredNotes()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('全上海');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination & Accordion State
  const [notesPage, setNotesPage] = useState<number>(1);
  const [expandedNotesIds, setExpandedNotesIds] = useState<string[]>([]);
  const NOTES_PER_PAGE = 5;

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
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
    { id: 'all', label: '🌐 全部情报' },
    { id: 'price_negotiate', label: '💰 底价口风' },
    { id: 'field_experience', label: '☔ 实地看房' },
    { id: 'district_intel', label: '📌 板块情报' },
    { id: 'metro_planning', label: '🚆 轨交规划' },
    { id: 'policy_mortgage', label: '⚖️ 政策微调' },
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
    if (!newNote.title?.trim() || !newNote.content?.trim()) {
      setFormError('请填写情报标题和详细随记内容');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const created: HousingNote = {
      id: `note-${Date.now()}`,
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      category: (newNote.category as NoteCategory) || 'field_experience',
      district: newNote.district || '浦东新区',
      sector: newNote.sector?.trim() || '',
      communityName: newNote.communityName?.trim() || '',
      importance: (newNote.importance as any) || 'normal',
      createdAt: formattedDate,
      tags: newNote.tags || [],
    };

    addNote(created).catch(console.error);
    setNotes([created, ...notes]);
    setNotesPage(1);
    setIsAddModalOpen(false);
    setFormError('');
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
      deleteNote(id).catch(console.error);
      setNotes(notes.filter((n) => n.id !== id));
    }
  };

  const handleToggleQuickTag = (tag: string) => {
    const cleanTag = tag.replace('#', '');
    const currentTags = newNote.tags || [];
    if (currentTags.includes(cleanTag)) {
      setNewNote({ ...newNote, tags: currentTags.filter((t) => t !== cleanTag) });
    } else {
      setNewNote({ ...newNote, tags: [...currentTags, cleanTag] });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderLeft: '5px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <BookOpenIcon color="var(--primary)" size={26} aria-hidden="true" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                置业情报与看房随手记
              </h2>
              <span className="badge badge-primary tabular-nums">{notes.length}&nbsp;条情报记录</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              随时随地记录看房踩坑实况、业主底价口风、中介私聊内幕与板块城市规划利好。
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
          >
            + 记一条情报 / 看房心得
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Category Chips */}
          <div role="tablist" aria-label="情报分类" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setNotesPage(1);
                  }}
                  className="btn"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? 'var(--primary)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    minHeight: '34px',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ maxWidth: '300px', width: '100%' }}>
            <input
              type="search"
              aria-label="搜索置业情报"
              placeholder="搜索情报（如：采光、让利、泗泾）…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setNotesPage(1);
              }}
            />
          </div>
        </div>

        {/* District Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            行政区域：
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
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                  minHeight: '30px',
                }}
              >
                {dis}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="skeleton" style={{ height: '140px' }} />
            <div className="skeleton" style={{ height: '140px' }} />
          </div>
        ) : paginatedNotes.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }} aria-hidden="true">📝</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              暂无匹配的置业随记
            </div>
            <p style={{ fontSize: '0.875rem' }}>
              实地看房时发现的采光、物业、噪音或房东真实底价，随时点击上方按钮记录下来。
            </p>
          </div>
        ) : (
          paginatedNotes.map((note) => {
            const catInfo = CATEGORY_MAP[note.category] || { label: '随记', icon: '📝', badgeStyle: 'badge-secondary' };
            const impColor = note.importance === 'high' ? 'var(--danger)' : note.importance === 'medium' ? 'var(--warning)' : 'var(--text-dim)';
            const impLabel = note.importance === 'high' ? '🔴 核心情报' : note.importance === 'medium' ? '🟡 重点关注' : '⚪ 普通随记';

            const isExpanded = expandedNotesIds.includes(note.id);
            const isLongText = note.content.length > 100;
            const displayContent = !isExpanded && isLongText ? `${note.content.slice(0, 100)}…` : note.content;

            return (
              <article
                key={note.id}
                className="glass-card"
                style={{
                  padding: '22px',
                  background: '#ffffff',
                  borderLeft: `5px solid ${note.importance === 'high' ? 'var(--danger)' : 'var(--primary)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span className={`badge ${catInfo.badgeStyle}`} style={{ fontSize: '0.775rem' }}>
                        {catInfo.label}
                      </span>
                      <span style={{ fontSize: '0.775rem', color: impColor, fontWeight: 700 }}>
                        {impLabel}
                      </span>
                      <time className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        🕒 {note.createdAt}
                      </time>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>
                      {note.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label={`删除情报：${note.title}`}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      minHeight: '30px',
                      borderRadius: '6px',
                      color: 'var(--text-dim)',
                    }}
                  >
                    🗑️ 删除
                  </button>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.75rem',
                          background: '#f8fafc',
                          color: 'var(--primary)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontWeight: 600,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                    {note.communityName && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        🏢 {note.communityName}
                      </span>
                    )}
                  </div>
                )}

                {/* Content text */}
                <div style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
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
                        fontSize: '0.85rem',
                        padding: '0 4px',
                      }}
                    >
                      {isExpanded ? '收起 ▴' : '展开全文 ▾'}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalNotesPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <button
            className="btn btn-secondary"
            disabled={notesPage === 1}
            onClick={() => setNotesPage((p) => Math.max(1, p - 1))}
            style={{ opacity: notesPage === 1 ? 0.5 : 1 }}
          >
            ◀ 上一页
          </button>
          <span className="tabular-nums" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {notesPage} / {totalNotesPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={notesPage === totalNotesPages}
            onClick={() => setNotesPage((p) => Math.min(totalNotesPages, p + 1))}
            style={{ opacity: notesPage === totalNotesPages ? 0.5 : 1 }}
          >
            下一页 ▶
          </button>
        </div>
      )}

      {/* Add Note Modal (Bottom Sheet on Mobile) */}
      {isAddModalOpen && (
        <div
          className="modal-overlay-mobile"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-add-note-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="glass-card animate-fade-in modal-card-mobile"
            style={{
              maxWidth: '580px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px',
              background: '#ffffff',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 id="modal-add-note-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SparklesIcon color="var(--primary)" size={22} aria-hidden="true" />
                记一条置业情报 / 看房随记
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="关闭弹窗"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  minHeight: '36px',
                  minWidth: '36px',
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  marginBottom: '16px',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                }}
              >
                ⚠️ {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveNote();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label htmlFor="note-title" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  情报标题 <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="note-title"
                  type="text"
                  placeholder="如：泗水和鸣雨天实测：无漏水防渗效果佳…"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="note-category" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    情报分类
                  </label>
                  <select
                    id="note-category"
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value as any })}
                  >
                    <option value="price_negotiate">💰 底价口风与让利</option>
                    <option value="field_experience">☔ 实地看房与踩坑</option>
                    <option value="district_intel">📌 板块与小区内幕</option>
                    <option value="metro_planning">🚆 轨交与城市规划</option>
                    <option value="policy_mortgage">⚖️ 政策与房贷微调</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="note-importance" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    重要程度
                  </label>
                  <select
                    id="note-importance"
                    value={newNote.importance}
                    onChange={(e) => setNewNote({ ...newNote, importance: e.target.value as any })}
                  >
                    <option value="high">🔴 核心情报 (高优)</option>
                    <option value="medium">🟡 重点关注 (中等)</option>
                    <option value="normal">⚪ 普通随记 (常规)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="note-district" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    行政区
                  </label>
                  <select
                    id="note-district"
                    value={newNote.district}
                    onChange={(e) => setNewNote({ ...newNote, district: e.target.value })}
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="note-sector" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    所属板块
                  </label>
                  <input
                    id="note-sector"
                    type="text"
                    placeholder="如：泗泾"
                    value={newNote.sector}
                    onChange={(e) => setNewNote({ ...newNote, sector: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="note-community" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    小区名称
                  </label>
                  <input
                    id="note-community"
                    type="text"
                    placeholder="如：泗水和鸣"
                    value={newNote.communityName}
                    onChange={(e) => setNewNote({ ...newNote, communityName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="note-content" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  详细随记内容 <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  id="note-content"
                  rows={4}
                  placeholder="记录中介透露的底价范围、房东卖房真实动机、看房时发现的采光/隔音/渗水情况…"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  required
                />
              </div>

              {/* Quick Tags Selector */}
              <div>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
                  快捷标签（点击增删）：
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {quickTags.map((t) => {
                    const clean = t.replace('#', '');
                    const isTagged = (newNote.tags || []).includes(clean);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToggleQuickTag(t)}
                        style={{
                          fontSize: '0.775rem',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background: isTagged ? 'var(--primary)' : '#f1f5f9',
                          color: isTagged ? '#ffffff' : 'var(--text-muted)',
                          border: isTagged ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          fontWeight: isTagged ? 700 : 500,
                          minHeight: '30px',
                        }}
                      >
                        {isTagged ? `✓ ${clean}` : t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  保存随记情报
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
