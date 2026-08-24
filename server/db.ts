/**
 * Database setup using Node.js built-in sqlite module (Node 22.5+)
 * No native compilation required!
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// WAL mode for better performance
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      district TEXT DEFAULT '',
      sector TEXT DEFAULT '',
      ring_location TEXT DEFAULT '',
      built_year INTEGER DEFAULT 0,
      property_fee REAL DEFAULT 0,
      property_company TEXT DEFAULT '',
      metro_info_text TEXT DEFAULT '',
      school_info TEXT DEFAULT '',
      amenities TEXT DEFAULT '',
      pros TEXT DEFAULT '[]',
      cons TEXT DEFAULT '[]',
      plot_ratio REAL,
      parking_ratio TEXT,
      parking_rent_monthly REAL,
      asking_avg_unit_price_yuan REAL,
      deal_avg_unit_price_yuan REAL,
      rent_samples TEXT DEFAULT '[]',
      avg_rent_unit_price_per_sqm REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      community_id TEXT NOT NULL,
      unit_number TEXT DEFAULT '',
      total_price REAL DEFAULT 0,
      target_price REAL DEFAULT 0,
      building_area REAL DEFAULT 0,
      inside_area REAL DEFAULT 0,
      layout TEXT DEFAULT '',
      floor_info TEXT DEFAULT '',
      orientation TEXT DEFAULT '',
      renovation TEXT DEFAULT '',
      expected_monthly_rent REAL DEFAULT 0,
      floorplan_url TEXT DEFAULT '',
      rating INTEGER DEFAULT 3,
      notes TEXT DEFAULT '',
      has_parking_space INTEGER DEFAULT 0,
      parking_price_wuan REAL DEFAULT 0,
      is_sub_new INTEGER DEFAULT 0,
      is_near_metro INTEGER DEFAULT 0,
      is_sweet_spot_layout INTEGER DEFAULT 0,
      has_age_risk INTEGER DEFAULT 0,
      has_layout_noise_risk INTEGER DEFAULT 0,
      has_parking_property_risk INTEGER DEFAULT 0,
      has_metro_distance_risk INTEGER DEFAULT 0,
      has_school_policy_risk INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS housing_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT DEFAULT '',
      category TEXT DEFAULT 'field_experience',
      district TEXT DEFAULT '',
      sector TEXT DEFAULT '',
      community_name TEXT DEFAULT '',
      importance TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
