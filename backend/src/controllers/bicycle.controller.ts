import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '../prisma.js';
import { BicycleStatus, RentalStatus } from '@prisma/client';
import { logAudit } from '../utils/audit.js';

const createBicycleSchema = z.object({
  bicycleCode: z.string().min(2).optional(),
  model: z.string().min(2).default('Campus Cruiser Pro V2'),
  location: z.string().min(2).default('Main Gate Station'),
  status: z.nativeEnum(BicycleStatus).default(BicycleStatus.AVAILABLE)
});

const updateBicycleSchema = z.object({
  model: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  status: z.nativeEnum(BicycleStatus).optional()
});

export async function getAvailableBicycles(req: Request, res: Response, next: NextFunction) {
  try {
    const bicycles = await prisma.bicycle.findMany({
      where: { status: BicycleStatus.AVAILABLE },
      select: {
        id: true,
        bicycleCode: true,
        model: true,
        location: true,
        status: true
      },
      orderBy: { bicycleCode: 'asc' }
    });

    const activePricing = await prisma.pricing.findFirst({
      orderBy: { effectiveFrom: 'desc' }
    });

    return res.json({
      success: true,
      count: bicycles.length,
      bicycles,
      hourlyRate: activePricing?.hourlyRate ? Number(activePricing.hourlyRate) : 12.50
    });
  } catch (err) {
    next(err);
  }
}

export async function identifyBicycle(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.params.tokenOrCode;
    if (!query) {
      return res.status(400).json({ success: false, message: 'QR token or bicycle code is required' });
    }

    // Match either qrToken or bicycleCode
    const bicycle = await prisma.bicycle.findFirst({
      where: {
        OR: [
          { qrToken: query },
          { bicycleCode: query.toUpperCase() }
        ]
      }
    });

    if (!bicycle) {
      return res.status(404).json({
        success: false,
        message: `Bicycle with identifier "${query}" was not found in the campus system.`
      });
    }

    // Check if the current student has an active rental
    let studentActiveRental = null;
    if (req.user && req.user.type === 'STUDENT') {
      studentActiveRental = await prisma.rental.findFirst({
        where: {
          studentId: req.user.id,
          status: RentalStatus.ACTIVE
        },
        include: { bicycle: true }
      });
    }

    const isThisBicycleRentedByCurrentStudent = 
      studentActiveRental && studentActiveRental.bicycleId === bicycle.id;

    // Get current hourly rate
    const currentPricing = await prisma.pricing.findFirst({
      orderBy: { effectiveFrom: 'desc' }
    });

    return res.json({
      success: true,
      bicycle: {
        id: bicycle.id,
        bicycleCode: bicycle.bicycleCode,
        model: bicycle.model,
        location: bicycle.location,
        status: bicycle.status,
        qrToken: bicycle.qrToken
      },
      action: isThisBicycleRentedByCurrentStudent ? 'RETURN' : 'START',
      isThisBicycleRentedByCurrentStudent,
      hasActiveRental: Boolean(studentActiveRental),
      activeRental: studentActiveRental ? {
        id: studentActiveRental.id,
        bicycleCode: studentActiveRental.bicycle.bicycleCode,
        startTime: studentActiveRental.startTime
      } : null,
      hourlyRate: currentPricing?.hourlyRate ? Number(currentPricing.hourlyRate) : 12.50
    });
  } catch (err) {
    next(err);
  }
}

// Admin Bicycle Management
export async function adminGetAllBicycles(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && Object.values(BicycleStatus).includes(status as BicycleStatus)) {
      where.status = status as BicycleStatus;
    }
    if (search) {
      where.OR = [
        { bicycleCode: { contains: String(search), mode: 'insensitive' } },
        { location: { contains: String(search), mode: 'insensitive' } },
        { model: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const bicycles = await prisma.bicycle.findMany({
      where,
      include: {
        _count: { select: { rentals: true, maintenance: true } }
      },
      orderBy: { bicycleCode: 'asc' }
    });

    return res.json({ success: true, bicycles });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateBicycle(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBicycleSchema.parse(req.body);

    // Auto-generate bicycleCode if omitted (e.g. CYC-009)
    let code = data.bicycleCode?.toUpperCase().trim();
    if (!code) {
      const count = await prisma.bicycle.count();
      code = `CYC-${String(count + 1).padStart(3, '0')}`;
    }

    const existing = await prisma.bicycle.findUnique({ where: { bicycleCode: code } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Bicycle code ${code} already exists.` });
    }

    const qrToken = 'cyc_tok_' + crypto.randomBytes(16).toString('hex');

    const bicycle = await prisma.bicycle.create({
      data: {
        bicycleCode: code,
        qrToken,
        model: data.model,
        location: data.location,
        status: data.status
      }
    });

    await logAudit({
      actorId: req.user?.id || 'ADMIN',
      actorType: 'ADMIN',
      action: 'BICYCLE_CREATED',
      entityType: 'Bicycle',
      entityId: bicycle.id,
      metadata: { bicycleCode: bicycle.bicycleCode, location: bicycle.location }
    });

    return res.status(201).json({ success: true, message: 'Bicycle created successfully', bicycle });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateBicycle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateBicycleSchema.parse(req.body);

    const existing = await prisma.bicycle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bicycle not found.' });
    }

    // If changing status away from AVAILABLE while rented, check active rental
    if (existing.status === BicycleStatus.RENTED && data.status && data.status !== BicycleStatus.RENTED) {
      const activeRental = await prisma.rental.findFirst({
        where: { bicycleId: id, status: RentalStatus.ACTIVE }
      });
      if (activeRental) {
        return res.status(400).json({
          success: false,
          message: 'Cannot manually change status while bicycle has an active student rental. Resolve the rental first.'
        });
      }
    }

    const updated = await prisma.bicycle.update({
      where: { id },
      data
    });

    await logAudit({
      actorId: req.user?.id || 'ADMIN',
      actorType: 'ADMIN',
      action: 'BICYCLE_UPDATED',
      entityType: 'Bicycle',
      entityId: id,
      metadata: { previous: existing.status, updated: updated.status }
    });

    return res.json({ success: true, message: 'Bicycle updated successfully', bicycle: updated });
  } catch (err) {
    next(err);
  }
}

export async function adminGenerateQr(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const bicycle = await prisma.bicycle.findUnique({ where: { id } });

    if (!bicycle) {
      return res.status(404).json({ success: false, message: 'Bicycle not found.' });
    }

    // QR Payload embeds full token and bicycle code
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrPayload = `${baseUrl}/scan/${bicycle.qrToken}`;

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#15803d', // Tailwind emerald-700
        light: '#ffffff'
      }
    });

    const qrSvg = await QRCode.toString(qrPayload, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#15803d',
        light: '#ffffff'
      }
    });

    return res.json({
      success: true,
      bicycleCode: bicycle.bicycleCode,
      qrToken: bicycle.qrToken,
      qrPayload,
      qrDataUrl,
      qrSvg
    });
  } catch (err) {
    next(err);
  }
}
