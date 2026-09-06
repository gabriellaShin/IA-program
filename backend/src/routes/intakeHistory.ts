import express from 'express';
import { getHistory, getRecordDetail } from '../controllers/intakeHistoryController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require auth
router.use(authenticateToken);

// Get intake history (paginated)
router.get('/', getHistory);

// Get record detail
router.get('/:id', getRecordDetail);

export default router;
