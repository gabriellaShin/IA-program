import type { MealPlanRationale } from '../types/index.js';

export function normalizeRationaleNotes(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return '';
}

export function normalizeMealPlanRationale(raw: unknown): MealPlanRationale {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const considered = Array.isArray(r.considered)
    ? r.considered.map((x) => String(x)).filter(Boolean)
    : [];
  return {
    considered,
    notes: normalizeRationaleNotes(r.notes)
  };
}
