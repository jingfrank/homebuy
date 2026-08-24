import { Hono } from 'hono';
import { db } from '../db.js';
import type { HousingNote } from '../../src/types/notes.js';

const app = new Hono();

type Row = Record<string, unknown>;

function rowToNote(row: Row): HousingNote {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    category: row.category as HousingNote['category'],
    district: row.district as string,
    sector: row.sector as string,
    communityName: row.community_name as string,
    importance: row.importance as HousingNote['importance'],
    createdAt: row.created_at as string,
    tags: JSON.parse((row.tags as string) || '[]'),
  };
}

// GET /api/notes
app.get('/', (c) => {
  const rows = db.prepare('SELECT * FROM housing_notes ORDER BY rowid DESC').all() as Row[];
  return c.json(rows.map(rowToNote));
});

// POST /api/notes
app.post('/', async (c) => {
  const body = await c.req.json() as HousingNote;
  db.prepare(`
    INSERT INTO housing_notes (id, title, content, category, district, sector, community_name, importance, created_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.id, body.title, body.content ?? '',
    body.category ?? 'field_experience',
    body.district ?? '', body.sector ?? '', body.communityName ?? '',
    body.importance ?? 'normal',
    body.createdAt ?? new Date().toISOString(),
    JSON.stringify(body.tags || [])
  );
  return c.json({ ok: true, id: body.id });
});

// PUT /api/notes/:id
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json() as HousingNote;
  db.prepare(`
    UPDATE housing_notes SET
      title=?, content=?, category=?, district=?, sector=?,
      community_name=?, importance=?, tags=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    body.title, body.content ?? '', body.category ?? 'field_experience',
    body.district ?? '', body.sector ?? '', body.communityName ?? '',
    body.importance ?? 'normal',
    JSON.stringify(body.tags || []),
    id
  );
  return c.json({ ok: true });
});

// DELETE /api/notes/:id
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM housing_notes WHERE id=?').run(id);
  return c.json({ ok: true });
});

export default app;
