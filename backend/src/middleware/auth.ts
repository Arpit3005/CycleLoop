import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { StudentStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'cycleloop_super_secret_jwt_key_2026_campus';

export interface AuthUser {
  id: string;
  email: string;
  type: 'STUDENT' | 'ADMIN';
  role?: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export async function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.type !== 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Forbidden. Student access required.' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found.' });
    }

    if (student.status !== StudentStatus.ACTIVE) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your student account is suspended. Please contact the campus administrator.' 
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authentication verification failed.' });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.type !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden. Administrator access required.' });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id }
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Admin authentication verification failed.' });
  }
}
