import { Request, Response } from 'express';
import {
  getCurrentWeekMealPlan,
  getLastWeekIntakeForEdit,
  deleteMealPlan
} from '../services/mealPlanService.js';
import { saveIntakeRecord, getIntakeRecord } from '../services/intakeService.js';
import { getLastWeekBounds, getCurrentWeekBounds } from '../utils/weekUtils.js';

/**
 * Get current week meal plan
 */
export async function getCurrentMealPlan(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const mealPlan = await getCurrentWeekMealPlan(req.userId);
    
    // Also fetch last week intake
    const lastWeek = getLastWeekBounds();
    const lastWeekRecord = await getIntakeRecord(
      req.userId,
      lastWeek.year,
      lastWeek.weekStartDate
    );

    res.json({
      mealPlan,
      lastWeekRecord: lastWeekRecord || null
    });
  } catch (error: any) {
    console.error('Meal plan query error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while fetching meal plan.' });
  }
}

/**
 * Get last week intake (for edit)
 */
export async function getLastWeekIntake(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const intakeData = await getLastWeekIntakeForEdit(req.userId);
    res.json(intakeData);
  } catch (error: any) {
    console.error('Last week intake query error:', error);
    res.status(500).json({ error: 'An error occurred while fetching last week record.' });
  }
}

/**
 * Save last week intake
 */
export async function saveLastWeekIntake(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { year, week_start_date, week_end_date, intake_data } = req.body;

    if (!year || !week_start_date || !week_end_date || !intake_data) {
      res.status(400).json({ error: 'Please fill in all required fields.' });
      return;
    }

    const record = await saveIntakeRecord(
      req.userId,
      year,
      week_start_date,
      week_end_date,
      intake_data
    );

    res.json({
      message: 'Intake record saved.',
      record
    });
  } catch (error: any) {
    console.error('Intake record save error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while saving intake record.' });
  }
}

/**
 * Regenerate meal plan (delete & create new)
 */
export async function regenerateMealPlan(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const currentWeek = getCurrentWeekBounds();
    
    // Delete existing plan
    await deleteMealPlan(req.userId, currentWeek.year, currentWeek.weekStartDate);
    
    // Generate new plan
    const mealPlan = await getCurrentWeekMealPlan(req.userId);
    
    // Also fetch last week intake
    const lastWeek = getLastWeekBounds();
    const lastWeekRecord = await getIntakeRecord(
      req.userId,
      lastWeek.year,
      lastWeek.weekStartDate
    );

    res.json({
      message: 'New meal plan has been generated.',
      mealPlan,
      lastWeekRecord: lastWeekRecord || null
    });
  } catch (error: any) {
    console.error('Meal plan regeneration error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while regenerating meal plan.' });
  }
}
