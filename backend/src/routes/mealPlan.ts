import express from 'express';
import {
  getCurrentMealPlan,
  getLastWeekIntake,
  saveLastWeekIntake,
  regenerateMealPlan
} from '../controllers/mealPlanController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require auth
router.use(authenticateToken);

// Get current week meal plan
router.get('/current', getCurrentMealPlan);

// Regenerate meal plan
router.post('/regenerate', regenerateMealPlan);

// Get last week intake (for edit)
router.get('/last-week-intake', getLastWeekIntake);

// Save last week intake
router.post('/save-intake', saveLastWeekIntake);

export default router;
