import api from './api';
import { WeeklyMealPlan, WeeklyIntakeRecord, WeeklyIntake } from '../types';

/**
 * Get current week meal plan
 */
export async function getCurrentMealPlan(): Promise<{
  mealPlan: WeeklyMealPlan;
  lastWeekRecord: WeeklyIntakeRecord | null;
}> {
  const response = await api.get('/meal-plan/current');
  return response.data;
}

/**
 * Regenerate meal plan
 */
export async function regenerateMealPlan(): Promise<{
  message: string;
  mealPlan: WeeklyMealPlan;
  lastWeekRecord: WeeklyIntakeRecord | null;
}> {
  const response = await api.post('/meal-plan/regenerate');
  return response.data;
}

/**
 * Get last week intake (for edit)
 */
export async function getLastWeekIntake(): Promise<{
  hasRecord: boolean;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  intakeData: WeeklyIntake;
}> {
  const response = await api.get('/meal-plan/last-week-intake');
  return response.data;
}

/**
 * Save last week intake
 */
export async function saveLastWeekIntake(data: {
  year: number;
  week_start_date: string;
  week_end_date: string;
  intake_data: WeeklyIntake;
}): Promise<{ message: string; record: WeeklyIntakeRecord }> {
  const response = await api.post('/meal-plan/save-intake', data);
  return response.data;
}

/**
 * Get intake history
 */
export async function getIntakeHistory(page: number = 1, limit: number = 3): Promise<{
  records: WeeklyIntakeRecord[];
  total: number;
  hasMore: boolean;
}> {
  const response = await api.get('/intake-history', {
    params: { page, limit }
  });
  return response.data;
}

/**
 * Get intake record detail
 */
export async function getIntakeRecordDetail(id: number): Promise<WeeklyIntakeRecord> {
  const response = await api.get(`/intake-history/${id}`);
  return response.data.record;
}
