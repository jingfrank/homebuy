import { Hono } from 'hono';
import { db } from '../db.js';
import type { Community } from '../../src/types/community.js';

const app = new Hono();

type Row = Record<string, unknown>;

function rowToCommunity(row: Row): Community {
  return {
    id: row.id as string,
    name: row.name as string,
    district: row.district as string,
    sector: row.sector as string,
    ringLocation: row.ring_location as string,
    builtYear: row.built_year as number,
    propertyFee: row.property_fee as number,
    propertyCompany: row.property_company as string,
    metroInfoText: row.metro_info_text as string,
    schoolInfo: row.school_info as string,
    amenities: row.amenities as string,
    pros: JSON.parse((row.pros as string) || '[]'),
    cons: JSON.parse((row.cons as string) || '[]'),
    plotRatio: row.plot_ratio as number | undefined,
    parkingRatio: row.parking_ratio as string | undefined,
    parkingRentMonthly: row.parking_rent_monthly as number | undefined,
    askingAvgUnitPriceYuan: row.asking_avg_unit_price_yuan as number | undefined,
    dealAvgUnitPriceYuan: row.deal_avg_unit_price_yuan as number | undefined,
    rentSamples: JSON.parse((row.rent_samples as string) || '[]'),
    avgRentUnitPricePerSqm: row.avg_rent_unit_price_per_sqm as number,
  };
}

// GET /api/communities
app.get('/', (c) => {
  const stmt = db.prepare('SELECT * FROM communities ORDER BY created_at ASC');
  const rows = stmt.all() as Row[];
  return c.json(rows.map(rowToCommunity));
});

// POST /api/communities
app.post('/', async (c) => {
  const body = await c.req.json() as Community;
  db.prepare(`
    INSERT INTO communities (id, name, district, sector, ring_location, built_year, property_fee,
      property_company, metro_info_text, school_info, amenities, pros, cons,
      plot_ratio, parking_ratio, parking_rent_monthly,
      asking_avg_unit_price_yuan, deal_avg_unit_price_yuan, rent_samples, avg_rent_unit_price_per_sqm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.id, body.name, body.district, body.sector, body.ringLocation,
    body.builtYear, body.propertyFee, body.propertyCompany ?? '',
    body.metroInfoText, body.schoolInfo, body.amenities,
    JSON.stringify(body.pros || []), JSON.stringify(body.cons || []),
    body.plotRatio ?? null, body.parkingRatio ?? null, body.parkingRentMonthly ?? null,
    body.askingAvgUnitPriceYuan ?? null, body.dealAvgUnitPriceYuan ?? null,
    JSON.stringify(body.rentSamples || []), body.avgRentUnitPricePerSqm ?? 0
  );
  return c.json({ ok: true, id: body.id });
});

// PUT /api/communities/:id
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json() as Community;
  db.prepare(`
    UPDATE communities SET
      name=?, district=?, sector=?, ring_location=?, built_year=?, property_fee=?,
      property_company=?, metro_info_text=?, school_info=?, amenities=?,
      pros=?, cons=?, plot_ratio=?, parking_ratio=?, parking_rent_monthly=?,
      asking_avg_unit_price_yuan=?, deal_avg_unit_price_yuan=?,
      rent_samples=?, avg_rent_unit_price_per_sqm=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    body.name, body.district, body.sector, body.ringLocation,
    body.builtYear, body.propertyFee, body.propertyCompany ?? '',
    body.metroInfoText, body.schoolInfo, body.amenities,
    JSON.stringify(body.pros || []), JSON.stringify(body.cons || []),
    body.plotRatio ?? null, body.parkingRatio ?? null, body.parkingRentMonthly ?? null,
    body.askingAvgUnitPriceYuan ?? null, body.dealAvgUnitPriceYuan ?? null,
    JSON.stringify(body.rentSamples || []), body.avgRentUnitPricePerSqm ?? 0,
    id
  );
  return c.json({ ok: true });
});

// DELETE /api/communities/:id
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM communities WHERE id=?').run(id);
  return c.json({ ok: true });
});

export default app;
