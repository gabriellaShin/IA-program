import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  createUser,
  authenticateUser,
  findUserByUsername,
  findUserById
} from '../services/userService.js';

// Load env vars
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = '7d';

/**
 * Register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const {
      username,
      password,
      name,
      gender,
      age,
      diet_goal,
      diet_characteristics,
      health_conditions
    } = req.body;

    // Validate input
    if (!username || !password || !name || !gender || !age || !diet_goal) {
      res.status(400).json({ error: 'Please fill in all required fields.' });
      return;
    }

    // Check username uniqueness
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      res.status(409).json({ error: 'Username already exists.' });
      return;
    }

    // Create user
    const user = await createUser({
      username,
      password,
      name,
      gender,
      age,
      diet_goal,
      diet_characteristics: diet_characteristics || [],
      health_conditions: health_conditions || []
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Registration completed.',
      token,
      user
    });
  } catch (error: any) {
    console.error('Registration error:', error);
      res.status(500).json({ error: 'An error occurred during registration.' });
  }
}

/**
 * Login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({ error: 'Please enter username and password.' });
      return;
    }

    // Authenticate
    const user = await authenticateUser(username, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    // Create JWT token
    console.log('🔑 JWT token created:', { 
      userId: user.id, 
      username: user.username,
      jwtSecret: JWT_SECRET 
    });
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error: any) {
    console.error('Login error:', error);
      res.status(500).json({ error: 'An error occurred during login.' });
  }
}

/**
 * Get current user
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    console.error('User query error:', error);
    res.status(500).json({ error: 'An error occurred while fetching user information.' });
  }
}
