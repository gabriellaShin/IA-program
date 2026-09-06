import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Current user (auth required)
router.get('/me', authenticateToken, me);

export default router;
