import { Request, Response } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateHealthConditions
} from '../services/userService.js';

/**
 * Get user profile
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const profile = await getUserProfile(req.userId);
    if (!profile) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Profile query error:', error);
    res.status(500).json({ error: 'An error occurred while fetching profile.' });
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { name, gender, age, diet_goal, diet_characteristics } = req.body;

    const updatedUser = await updateUserProfile(req.userId, {
      name,
      gender,
      age,
      diet_goal,
      diet_characteristics
    });

    res.json({
      message: 'Profile updated.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'An error occurred while updating profile.' });
  }
}

/**
 * Get health conditions
 */
export async function getHealthConditions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const profile = await getUserProfile(req.userId);
    if (!profile) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ health_conditions: profile.health_conditions });
  } catch (error: any) {
    console.error('Health conditions query error:', error);
    res.status(500).json({ error: 'An error occurred while fetching health conditions.' });
  }
}

/**
 * Update health conditions
 */
export async function updateHealthConditionsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { health_conditions } = req.body;

    if (!Array.isArray(health_conditions)) {
      res.status(400).json({ error: 'Health conditions must be an array.' });
      return;
    }

    await updateHealthConditions(req.userId, health_conditions);

    res.json({ message: 'Health conditions updated.' });
  } catch (error: any) {
    console.error('Health conditions update error:', error);
    res.status(500).json({ error: 'An error occurred while updating health conditions.' });
  }
}
