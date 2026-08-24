import type { HousingNote } from '../types/notes';
import { api } from './api';

export async function getStoredNotes(): Promise<HousingNote[]> {
  return api.get<HousingNote[]>('/notes');
}

export async function addNote(note: HousingNote): Promise<void> {
  await api.post('/notes', note);
}

export async function updateNote(note: HousingNote): Promise<void> {
  await api.put(`/notes/${note.id}`, note);
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}

// Kept for backward compat - now a no-op
export async function saveNotes(_notes: HousingNote[]): Promise<void> {
  // no-op: replaced by addNote / updateNote / deleteNote
}
