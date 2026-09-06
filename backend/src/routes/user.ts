import express from 'express';
import {
  getProfile,
  updateProfile,
  getHealthConditions,
  updateHealthConditionsHandler
} from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require auth
router.use(authenticateToken);

// Profile get/update
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Health conditions get/update
router.get('/health-conditions', getHealthConditions);
router.put('/health-conditions', updateHealthConditionsHandler);

export default router;
