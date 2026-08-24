import { Hono } from 'hono';
import { db } from '../db.js';
import type { HouseListing } from '../../src/types/community.js';

const app = new Hono();

type Row = Record<string, unknown>;

function rowToListing(row: Row): HouseListing {
  return {
    id: row.id as string,
    communityId: row.community_id as string,
    unitNumber: row.unit_number as string,
    totalPrice: row.total_price as number,
    targetPrice: row.target_price as number,
    buildingArea: row.building_area as number,
    insideArea: row.inside_area as number,
    layout: row.layout as string,
    floorInfo: row.floor_info as string,
    orientation: row.orientation as string,
    renovation: row.renovation as string,
    expectedMonthlyRent: row.expected_monthly_rent as number,
    floorplanUrl: row.floorplan_url as string,
    rating: row.rating as number,
    notes: row.notes as string,
    hasParkingSpace: Boolean(row.has_parking_space),
    parkingPriceWuan: row.parking_price_wuan as number | undefined,
    isSubNew: Boolean(row.is_sub_new),
    isNearMetro: Boolean(row.is_near_metro),
    isSweetSpotLayout: Boolean(row.is_sweet_spot_layout),
    hasAgeRisk: Boolean(row.has_age_risk),
    hasLayoutNoiseRisk: Boolean(row.has_layout_noise_risk),
    hasParkingPropertyRisk: Boolean(row.has_parking_property_risk),
    hasMetroDistanceRisk: Boolean(row.has_metro_distance_risk),
    hasSchoolPolicyRisk: Boolean(row.has_school_policy_risk),
  };
}

// GET /api/listings
app.get('/', (c) => {
  const communityId = c.req.query('communityId');
  let rows: Row[];
  if (communityId) {
    rows = db.prepare('SELECT * FROM listings WHERE community_id=? ORDER BY created_at ASC').all(communityId) as Row[];
  } else {
    rows = db.prepare('SELECT * FROM listings ORDER BY created_at ASC').all() as Row[];
  }
  return c.json(rows.map(rowToListing));
});

// POST /api/listings
app.post('/', async (c) => {
  const body = await c.req.json() as HouseListing;
  db.prepare(`
    INSERT INTO listings (
      id, community_id, unit_number, total_price, target_price, building_area, inside_area,
      layout, floor_info, orientation, renovation, expected_monthly_rent,
      floorplan_url, rating, notes, has_parking_space, parking_price_wuan,
      is_sub_new, is_near_metro, is_sweet_spot_layout,
      has_age_risk, has_layout_noise_risk, has_parking_property_risk,
      has_metro_distance_risk, has_school_policy_risk
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    body.id, body.communityId, body.unitNumber ?? '',
    body.totalPrice, body.targetPrice ?? body.totalPrice,
    body.buildingArea, body.insideArea ?? 0,
    body.layout, body.floorInfo, body.orientation, body.renovation,
    body.expectedMonthlyRent ?? 0, body.floorplanUrl ?? '',
    body.rating ?? 3, body.notes ?? '',
    body.hasParkingSpace ? 1 : 0, body.parkingPriceWuan ?? 0,
    body.isSubNew ? 1 : 0, body.isNearMetro ? 1 : 0,
    body.isSweetSpotLayout ? 1 : 0,
    body.hasAgeRisk ? 1 : 0, body.hasLayoutNoiseRisk ? 1 : 0,
    body.hasParkingPropertyRisk ? 1 : 0,
    body.hasMetroDistanceRisk ? 1 : 0, body.hasSchoolPolicyRisk ? 1 : 0
  );
  return c.json({ ok: true, id: body.id });
});

// PUT /api/listings/:id
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json() as HouseListing;
  db.prepare(`
    UPDATE listings SET
      community_id=?, unit_number=?, total_price=?, target_price=?,
      building_area=?, inside_area=?, layout=?, floor_info=?, orientation=?, renovation=?,
      expected_monthly_rent=?, floorplan_url=?, rating=?, notes=?,
      has_parking_space=?, parking_price_wuan=?,
      is_sub_new=?, is_near_metro=?, is_sweet_spot_layout=?,
      has_age_risk=?, has_layout_noise_risk=?, has_parking_property_risk=?,
      has_metro_distance_risk=?, has_school_policy_risk=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    body.communityId, body.unitNumber ?? '',
    body.totalPrice, body.targetPrice ?? body.totalPrice,
    body.buildingArea, body.insideArea ?? 0,
    body.layout, body.floorInfo, body.orientation, body.renovation,
    body.expectedMonthlyRent ?? 0, body.floorplanUrl ?? '',
    body.rating ?? 3, body.notes ?? '',
    body.hasParkingSpace ? 1 : 0, body.parkingPriceWuan ?? 0,
    body.isSubNew ? 1 : 0, body.isNearMetro ? 1 : 0,
    body.isSweetSpotLayout ? 1 : 0,
    body.hasAgeRisk ? 1 : 0, body.hasLayoutNoiseRisk ? 1 : 0,
    body.hasParkingPropertyRisk ? 1 : 0,
    body.hasMetroDistanceRisk ? 1 : 0, body.hasSchoolPolicyRisk ? 1 : 0,
    id
  );
  return c.json({ ok: true });
});

// DELETE /api/listings/:id
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM listings WHERE id=?').run(id);
  return c.json({ ok: true });
});

export default app;
