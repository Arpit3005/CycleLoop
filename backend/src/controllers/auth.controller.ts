import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateToken } from '../middleware/auth.js';
import { StudentStatus } from '@prisma/client';
import { logAudit } from '../utils/audit.js';

const studentRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rollNo: z.string().min(3, 'Roll number must be at least 3 characters').toUpperCase(),
  branch: z.string().min(2, 'Branch is required'),
  email: z.string().email('Valid college email required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const studentLoginSchema = z.object({
  identifier: z.string().min(3, 'Email or Roll Number required'),
  password: z.string().min(1, 'Password required')
});

const adminLoginSchema = z.object({
  email: z.string().email('Valid admin email required'),
  password: z.string().min(1, 'Password required')
});

export async function studentRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = studentRegisterSchema.parse(req.body);

    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { email: validated.email.toLowerCase() },
          { rollNo: validated.rollNo.toUpperCase() }
        ]
      }
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: existingStudent.email === validated.email.toLowerCase()
          ? 'An account with this email address already exists.'
          : 'An account with this roll number already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const student = await prisma.student.create({
      data: {
        name: validated.name.trim(),
        rollNo: validated.rollNo.toUpperCase().trim(),
        branch: validated.branch.trim(),
        email: validated.email.toLowerCase().trim(),
        phone: validated.phone?.trim() || null,
        passwordHash,
        status: StudentStatus.ACTIVE
      }
    });

    const token = generateToken({
      id: student.id,
      email: student.email,
      name: student.name,
      type: 'STUDENT'
    });

    await logAudit({
      actorId: student.id,
      actorType: 'STUDENT',
      action: 'STUDENT_REGISTER',
      entityType: 'Student',
      entityId: student.id,
      metadata: { rollNo: student.rollNo, email: student.email }
    });

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        branch: student.branch,
        email: student.email,
        phone: student.phone,
        type: 'STUDENT'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function studentLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = studentLoginSchema.parse(req.body);
    const cleanId = identifier.trim();

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { email: cleanId.toLowerCase() },
          { rollNo: cleanId.toUpperCase() }
        ]
      }
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/roll number and password.'
      });
    }

    if (student.status !== StudentStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact the campus transportation administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/roll number and password.'
      });
    }

    const token = generateToken({
      id: student.id,
      email: student.email,
      name: student.name,
      type: 'STUDENT'
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        branch: student.branch,
        email: student.email,
        phone: student.phone,
        type: 'STUDENT'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      type: 'ADMIN'
    });

    await logAudit({
      actorId: admin.id,
      actorType: 'ADMIN',
      action: 'ADMIN_LOGIN',
      entityType: 'Admin',
      entityId: admin.id
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        type: 'ADMIN'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (req.user.type === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          rollNo: true,
          branch: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true
        }
      });
      if (!student) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, user: { ...student, type: 'STUDENT' } });
    } else {
      const admin = await prisma.admin.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });
      if (!admin) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, user: { ...admin, type: 'ADMIN' } });
    }
  } catch (err) {
    next(err);
  }
}

export async function updateStudentProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.type !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { phone, branch } = req.body;
    const updated = await prisma.student.update({
      where: { id: req.user.id },
      data: {
        phone: phone ? String(phone).trim() : undefined,
        branch: branch ? String(branch).trim() : undefined
      },
      select: {
        id: true,
        name: true,
        rollNo: true,
        branch: true,
        email: true,
        phone: true,
        status: true
      }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: { ...updated, type: 'STUDENT' }
    });
  } catch (err) {
    next(err);
  }
}
