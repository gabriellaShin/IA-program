import { getDb } from '../db/firebase.js';
import { WeeklyMealPlan, WeeklyIntake } from '../types/index.js';
import { getUserProfile } from './userService.js';
import { getIntakeRecord } from './intakeService.js';
import { generateMealPlan } from './openaiService.js';
import { getCurrentWeekBounds, getLastWeekBounds } from '../utils/weekUtils.js';
import { normalizeMealPlanRationale } from '../utils/rationaleUtils.js';

/**
 * Get meal plan for a specific week
 */
export async function getMealPlan(
  userId: string,
  year: number,
  weekStartDate: string
): Promise<WeeklyMealPlan | null> {
  const db = getDb();
  const snapshot = await db
    .collection('weekly_meal_plans')
    .where('user_id', '==', userId)
    .where('year', '==', year)
    .where('week_start_date', '==', weekStartDate)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    user_id: data.user_id,
    year: data.year,
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    plan_data: data.plan_data,
    plan_macro: data.plan_macro,
    rationale: normalizeMealPlanRationale(data.rationale),
    shopping_list: data.shopping_list,
    substitutions: data.substitutions,
    created_at: data.created_at
  };
}

/**
 * Get or create current week meal plan
 */
export async function getCurrentWeekMealPlan(userId: string): Promise<WeeklyMealPlan> {
  const currentWeek = getCurrentWeekBounds();
  const { year, weekStartDate, weekEndDate } = currentWeek;

  // Check if plan already exists
  let existingPlan = await getMealPlan(userId, year, weekStartDate);
  if (existingPlan) {
    return existingPlan;
  }

  // Fetch user profile
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error('User not found.');
  }

  // Fetch last week intake
  const lastWeek = getLastWeekBounds();
  const lastWeekRecord = await getIntakeRecord(userId, lastWeek.year, lastWeek.weekStartDate);

  // Generate meal plan via AI
  const mealPlanData = await generateMealPlan(
    userProfile,
    weekStartDate,
    weekEndDate,
    lastWeekRecord ? {
      macro: lastWeekRecord.macro,
      strengths: lastWeekRecord.strengths,
      weaknesses: lastWeekRecord.weaknesses,
      improvements: lastWeekRecord.improvements,
      cautions: lastWeekRecord.cautions
    } : undefined,
    lastWeekRecord?.intake_data
  );

  // Save to Firestore
  const planDoc = {
    user_id: userId,
    year,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    plan_data: mealPlanData.plan,
    plan_macro: mealPlanData.plan_macro,
    rationale: mealPlanData.rationale,
    shopping_list: mealPlanData.shopping_list,
    substitutions: mealPlanData.substitutions,
    created_at: new Date().toISOString()
  };

  const db = getDb();
  const docRef = await db.collection('weekly_meal_plans').add(planDoc);

  return {
    id: docRef.id,
    ...planDoc
  };
}

/**
 * Get last week intake for edit
 * Returns existing record or empty template
 */
export async function getLastWeekIntakeForEdit(userId: string): Promise<{
  hasRecord: boolean;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  intakeData: WeeklyIntake;
}> {
  const lastWeek = getLastWeekBounds();
  const record = await getIntakeRecord(userId, lastWeek.year, lastWeek.weekStartDate);

  if (record) {
    return {
      hasRecord: true,
      year: record.year,
      weekStartDate: record.week_start_date,
      weekEndDate: record.week_end_date,
      intakeData: record.intake_data
    };
  }

  // Return empty template
  const emptyDay = {
    breakfast: [],
    lunch: [],
    dinner: []
  };

  return {
    hasRecord: false,
    year: lastWeek.year,
    weekStartDate: lastWeek.weekStartDate,
    weekEndDate: lastWeek.weekEndDate,
    intakeData: {
      sun: { ...emptyDay },
      mon: { ...emptyDay },
      tue: { ...emptyDay },
      wed: { ...emptyDay },
      thu: { ...emptyDay },
      fri: { ...emptyDay },
      sat: { ...emptyDay }
    }
  };
}

/**
 * Delete meal plan
 */
export async function deleteMealPlan(
  userId: string,
  year: number,
  weekStartDate: string
): Promise<void> {
  const db = getDb();
  const snapshot = await db
    .collection('weekly_meal_plans')
    .where('user_id', '==', userId)
    .where('year', '==', year)
    .where('week_start_date', '==', weekStartDate)
    .get();

  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}
