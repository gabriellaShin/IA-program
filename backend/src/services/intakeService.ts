import { getDb } from '../db/firebase.js';
import { WeeklyIntakeRecord, WeeklyIntake, IntakeEvaluation, MealItem } from '../types/index.js';
import { getUserProfile } from './userService.js';
import { evaluateIntake } from './openaiService.js';

const MAX_CHARS_PER_ITEM = 80;
const MAX_ITEMS_PER_MEAL = 10;

function trimItemName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').slice(0, MAX_CHARS_PER_ITEM);
}

function sanitizeMealItems(items: (MealItem | string)[]): MealItem[] {
  return items
    .map((item) => {
      const raw = typeof item === 'string' ? item : (item?.name ?? '');
      const sanitized: MealItem = {
        name: trimItemName(String(raw))
      };
      if (item && typeof item === 'object' && item.portion) {
        sanitized.portion = trimItemName(String(item.portion));
      }
      if (item && typeof item === 'object' && item.note) {
        sanitized.note = trimItemName(String(item.note));
      }
      return sanitized;
    })
    .filter((item) => item.name.length > 0)
    .slice(0, MAX_ITEMS_PER_MEAL);
}

function sanitizeIntakeData(data: WeeklyIntake): WeeklyIntake {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const result: Record<string, any> = {};
  for (const day of days) {
    const d = data[day];
    result[day] = {
      breakfast: sanitizeMealItems(d?.breakfast ?? []),
      lunch: sanitizeMealItems(d?.lunch ?? []),
      dinner: sanitizeMealItems(d?.dinner ?? [])
    };
  }
  return result as WeeklyIntake;
}

/**
 * Get intake record for a specific week
 */
export async function getIntakeRecord(
  userId: string,
  year: number,
  weekStartDate: string
): Promise<WeeklyIntakeRecord | null> {
  const db = getDb();
  const snapshot = await db
    .collection('weekly_intake_records')
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
    intake_data: data.intake_data,
    macro: data.macro,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    improvements: data.improvements,
    cautions: data.cautions,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Save intake record (with AI evaluation)
 */
export async function saveIntakeRecord(
  userId: string,
  year: number,
  weekStartDate: string,
  weekEndDate: string,
  intakeData: WeeklyIntake
): Promise<WeeklyIntakeRecord> {
  const sanitized = sanitizeIntakeData(intakeData);

  // Fetch user profile
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error('User not found.');
  }

  // Generate AI evaluation
  const evaluation = await evaluateIntake(userProfile, sanitized);

  // Check existing record
  const existingRecord = await getIntakeRecord(userId, year, weekStartDate);

  const recordData = {
    user_id: userId,
    year,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    intake_data: sanitized,
    macro: evaluation.macro,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    improvements: evaluation.improvements,
    cautions: evaluation.cautions,
    created_at: existingRecord?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const db = getDb();
  if (existingRecord) {
    await db
      .collection('weekly_intake_records')
      .doc(existingRecord.id)
      .update({
        ...recordData,
        updated_at: new Date().toISOString()
      });

    return {
      id: existingRecord.id,
      ...recordData
    };
  } else {
    // Create new
    const docRef = await db.collection('weekly_intake_records').add(recordData);

    return {
      id: docRef.id,
      ...recordData
    };
  }
}

/**
 * Get intake history (paginated)
 */
export async function getIntakeHistory(
  userId: string,
  page: number = 1,
  limit: number = 3
): Promise<{ records: WeeklyIntakeRecord[]; total: number; hasMore: boolean }> {
  const db = getDb();
  const allSnapshot = await db
    .collection('weekly_intake_records')
    .where('user_id', '==', userId)
    .get();

  const records: WeeklyIntakeRecord[] = allSnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        user_id: data.user_id,
        year: data.year,
        week_start_date: data.week_start_date,
        week_end_date: data.week_end_date,
        intake_data: data.intake_data,
        macro: data.macro,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        improvements: data.improvements,
        cautions: data.cautions,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    })
    .sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.week_start_date.localeCompare(a.week_start_date);
    });

  const offset = (page - 1) * limit;
  const pageRecords = records.slice(offset, offset + limit);

  return {
    records: pageRecords,
    total: records.length,
    hasMore: offset + pageRecords.length < records.length
  };
}

/**
 * Get intake record by ID
 */
export async function getIntakeRecordById(
  userId: string,
  recordId: string
): Promise<WeeklyIntakeRecord | null> {
  const db = getDb();
  const doc = await db.collection('weekly_intake_records').doc(recordId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;

  // Verify user ownership
  if (data.user_id !== userId) {
    return null;
  }

  return {
    id: doc.id,
    user_id: data.user_id,
    year: data.year,
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    intake_data: data.intake_data,
    macro: data.macro,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    improvements: data.improvements,
    cautions: data.cautions,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}
