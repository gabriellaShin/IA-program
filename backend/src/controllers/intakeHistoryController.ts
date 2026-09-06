import { Request, Response } from 'express';
import { getIntakeHistory, getIntakeRecordById } from '../services/intakeService.js';

/**
 * Get intake history (paginated)
 */
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 3;

    const result = await getIntakeHistory(req.userId, page, limit);
    
    res.json(result);
  } catch (error: any) {
    console.error('History query error:', error);
    res.status(500).json({ error: 'An error occurred while fetching history.' });
  }
}

/**
 * Get intake record detail
 */
export async function getRecordDetail(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

  const recordId = req.params.id;
  if (!recordId) {
    res.status(400).json({ error: 'Please provide a valid ID.' });
    return;
  }

  const record = await getIntakeRecordById(req.userId, recordId);
    if (!record) {
      res.status(404).json({ error: 'Record not found.' });
      return;
    }

    res.json({ record });
  } catch (error: any) {
    console.error('Record detail query error:', error);
    res.status(500).json({ error: 'An error occurred while fetching record details.' });
  }
}
