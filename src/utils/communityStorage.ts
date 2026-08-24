import type { Community, HouseListing } from '../types/community';
import { api } from './api';

// ── Fallback default data (used only if API fails on first load) ───
export const DEFAULT_FLOORPLAN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="4"/><rect x="20" y="20" width="160" height="130" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="100" y="85" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">主卧 16㎡</text><rect x="200" y="20" width="180" height="110" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="290" y="75" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">客餐厅 28㎡</text><rect x="20" y="160" width="120" height="120" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="80" y="225" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">次卧 12㎡</text><rect x="150" y="160" width="100" height="120" fill="%23e2e8f0" stroke="%2364748b" stroke-width="2"/><text x="200" y="225" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="middle" font-weight="bold">书房 9㎡</text><rect x="260" y="160" width="120" height="120" fill="%23dbeafe" stroke="%233b82f6" stroke-width="2"/><text x="320" y="225" font-family="sans-serif" font-size="14" fill="%231d4ed8" text-anchor="middle" font-weight="bold">阳台 8㎡</text></svg>`;

// ── Communities ───────────────────────────────────────────────────
export async function getStoredCommunities(): Promise<Community[]> {
  return api.get<Community[]>('/communities');
}

export async function addCommunity(community: Community): Promise<void> {
  await api.post('/communities', community);
}

export async function updateCommunity(community: Community): Promise<void> {
  await api.put(`/communities/${community.id}`, community);
}

export async function deleteCommunity(id: string): Promise<void> {
  await api.delete(`/communities/${id}`);
}

// Kept for backward compat - now a no-op (use granular functions above)
export async function saveCommunities(_communities: Community[]): Promise<void> {
  // no-op: replaced by addCommunity / updateCommunity / deleteCommunity
}

// ── Listings ──────────────────────────────────────────────────────
export async function getStoredListings(communityId?: string): Promise<HouseListing[]> {
  const qs = communityId ? `?communityId=${communityId}` : '';
  return api.get<HouseListing[]>(`/listings${qs}`);
}

export async function addListing(listing: HouseListing): Promise<void> {
  await api.post('/listings', listing);
}

export async function updateListing(listing: HouseListing): Promise<void> {
  await api.put(`/listings/${listing.id}`, listing);
}

export async function deleteListing(id: string): Promise<void> {
  await api.delete(`/listings/${id}`);
}

// Kept for backward compat - now a no-op
export async function saveListings(_listings: HouseListing[]): Promise<void> {
  // no-op
}
