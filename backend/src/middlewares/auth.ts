import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface JwtPayload {
  userId: string;
  username: string;
}

/**
 * JWT token verification middleware
 */
export function authenticateToken(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Auth check:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    jwtSecret: process.env.JWT_SECRET ? 'set' : 'not set'
  });

  if (!token) {
    console.log('❌ No token.');
    res.status(401).json({ error: 'Authentication token is required.' });
    return;
  }

  try {
    const payload = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;
    
    console.log('✅ Token verified:', { userId: payload.userId });
    req.userId = payload.userId;
    next();
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    res.status(403).json({ error: 'Invalid token.' });
    return;
  }
}
