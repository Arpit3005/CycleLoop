import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { BicycleStatus, RentalStatus, PaymentStatus } from '@prisma/client';
import { logAudit } from '../utils/audit.js';

const scanRentalSchema = z.object({
  qrTokenOrCode: z.string().min(1, 'QR token or bicycle code is required'),
  returnNotes: z.string().optional()
});

export async function startRental(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const { qrTokenOrCode } = scanRentalSchema.parse(req.body);
    const identifier = qrTokenOrCode.trim();

    // 1. Check if student already has an active rental
    const activeRental = await prisma.rental.findFirst({
      where: {
        studentId,
        status: RentalStatus.ACTIVE
      },
      include: { bicycle: true }
    });

    if (activeRental) {
      return res.status(400).json({
        success: false,
        message: `You already have an active rental on bicycle ${activeRental.bicycle.bicycleCode}. Please return it before starting a new rental.`,
        activeRentalId: activeRental.id,
        bicycleCode: activeRental.bicycle.bicycleCode
      });
    }

    // 2. Check for outstanding pending payments
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        studentId,
        status: PaymentStatus.PENDING
      },
      include: { rental: { include: { bicycle: true } } }
    });

    if (pendingPayment) {
      return res.status(402).json({
        success: false,
        message: `You have an outstanding payment of ₹${Number(pendingPayment.amount).toFixed(2)} from a previous rental. Please complete the pending payment before renting another bicycle.`,
        pendingPayment: {
          id: pendingPayment.id,
          orderId: pendingPayment.orderId,
          amount: Number(pendingPayment.amount),
          rentalId: pendingPayment.rentalId,
          bicycleCode: pendingPayment.rental?.bicycle?.bicycleCode
        }
      });
    }

    // 3. Identify and verify bicycle availability
    const bicycle = await prisma.bicycle.findFirst({
      where: {
        OR: [
          { qrToken: identifier },
          { bicycleCode: identifier.toUpperCase() }
        ]
      }
    });

    if (!bicycle) {
      return res.status(404).json({
        success: false,
        message: `Bicycle identifier "${identifier}" not found in campus system.`
      });
    }

    if (bicycle.status === BicycleStatus.RENTED) {
      return res.status(409).json({
        success: false,
        message: `Bicycle ${bicycle.bicycleCode} is currently rented by another student.`
      });
    }

    if (bicycle.status === BicycleStatus.MAINTENANCE) {
      return res.status(400).json({
        success: false,
        message: `Bicycle ${bicycle.bicycleCode} is currently under maintenance and cannot be rented.`
      });
    }

    if (bicycle.status === BicycleStatus.DECOMMISSIONED) {
      return res.status(400).json({
        success: false,
        message: `Bicycle ${bicycle.bicycleCode} is decommissioned from service.`
      });
    }

    // 4. Get active hourly rate snapshot
    const currentPricing = await prisma.pricing.findFirst({
      orderBy: { effectiveFrom: 'desc' }
    });
    const snapshotHourlyRate = currentPricing?.hourlyRate ? Number(currentPricing.hourlyRate) : 12.50;

    // 5. ACID Transaction to start rental
    const rental = await prisma.$transaction(async (tx) => {
      // Re-verify bicycle status inside transaction to prevent race conditions
      const freshBike = await tx.bicycle.findUnique({
        where: { id: bicycle.id }
      });

      if (!freshBike || freshBike.status !== BicycleStatus.AVAILABLE) {
        throw new Error('Bicycle was just rented by another user. Please try another bicycle.');
      }

      // Update bicycle status
      await tx.bicycle.update({
        where: { id: bicycle.id },
        data: { status: BicycleStatus.RENTED }
      });

      // Create Rental record with authoritative server timestamp
      const newRental = await tx.rental.create({
        data: {
          studentId,
          bicycleId: bicycle.id,
          startTime: new Date(),
          hourlyRate: snapshotHourlyRate,
          status: RentalStatus.ACTIVE
        },
        include: {
          bicycle: true,
          student: {
            select: { id: true, name: true, rollNo: true, branch: true }
          }
        }
      });

      return newRental;
    });

    await logAudit({
      actorId: studentId,
      actorType: 'STUDENT',
      action: 'RENTAL_STARTED',
      entityType: 'Rental',
      entityId: rental.id,
      metadata: { bicycleCode: bicycle.bicycleCode, hourlyRate: snapshotHourlyRate }
    });

    return res.status(201).json({
      success: true,
      message: `Rental started successfully for bicycle ${bicycle.bicycleCode}. Enjoy your campus ride!`,
      rental: {
        id: rental.id,
        bicycleId: rental.bicycleId,
        bicycleCode: rental.bicycle.bicycleCode,
        model: rental.bicycle.model,
        location: rental.bicycle.location,
        startTime: rental.startTime,
        hourlyRate: Number(rental.hourlyRate),
        student: rental.student
      }
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Bicycle was just rented')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    next(err);
  }
}

export async function getActiveRental(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;

    const rental = await prisma.rental.findFirst({
      where: {
        studentId,
        status: RentalStatus.ACTIVE
      },
      include: {
        bicycle: true,
        student: {
          select: { id: true, name: true, rollNo: true, branch: true }
        }
      }
    });

    if (!rental) {
      return res.json({
        success: true,
        active: false,
        rental: null
      });
    }

    const now = new Date();
    const elapsedMs = now.getTime() - new Date(rental.startTime).getTime();
    const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / (1000 * 60)));
    const hourlyRate = Number(rental.hourlyRate);
    const estimatedAmount = Math.max(1, Math.round(((elapsedMinutes / 60) * hourlyRate) * 100) / 100);

    return res.json({
      success: true,
      active: true,
      rental: {
        id: rental.id,
        bicycleId: rental.bicycleId,
        bicycleCode: rental.bicycle.bicycleCode,
        model: rental.bicycle.model,
        location: rental.bicycle.location,
        qrToken: rental.bicycle.qrToken,
        startTime: rental.startTime,
        serverTime: now,
        elapsedMinutes,
        hourlyRate,
        estimatedAmount,
        student: rental.student
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function returnRental(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const { qrTokenOrCode } = scanRentalSchema.parse(req.body);
    const identifier = qrTokenOrCode.trim();

    // 1. Find active rental for this student
    const activeRental = await prisma.rental.findFirst({
      where: {
        studentId,
        status: RentalStatus.ACTIVE
      },
      include: { bicycle: true }
    });

    if (!activeRental) {
      return res.status(400).json({
        success: false,
        message: 'You do not have any active bicycle rental to return.'
      });
    }

    // 2. Identify the scanned bicycle
    const scannedBicycle = await prisma.bicycle.findFirst({
      where: {
        OR: [
          { qrToken: identifier },
          { bicycleCode: identifier.toUpperCase() }
        ]
      }
    });

    if (!scannedBicycle) {
      return res.status(404).json({
        success: false,
        message: `Bicycle identifier "${identifier}" not found in campus system.`
      });
    }

    // 3. Verification: Scanned bicycle must match active rental bicycle!
    if (scannedBicycle.id !== activeRental.bicycleId) {
      return res.status(400).json({
        success: false,
        message: `Mismatched bicycle! Your active rental is for ${activeRental.bicycle.bicycleCode}, but you scanned ${scannedBicycle.bicycleCode}. Please scan the bicycle you actually rented.`
      });
    }

    // 4. Server authoritative timestamp and duration calculation
    const returnTime = new Date();
    const startMs = new Date(activeRental.startTime).getTime();
    const durationMinutes = Math.max(1, Math.ceil((returnTime.getTime() - startMs) / (1000 * 60)));
    const hourlyRate = Number(activeRental.hourlyRate);

    // Rental amount formula: (duration in minutes / 60) * hourlyRate
    // Round to 2 decimal places; minimum charge ₹1.00
    const rawAmount = (durationMinutes / 60) * hourlyRate;
    const finalAmount = Math.max(1.00, Math.round(rawAmount * 100) / 100);

    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 5. Atomic Transaction: Complete Rental, mark Bicycle AVAILABLE, create Pending Payment
    const result = await prisma.$transaction(async (tx) => {
      const updatedRental = await tx.rental.update({
        where: { id: activeRental.id },
        data: {
          status: RentalStatus.COMPLETED,
          endTime: returnTime,
          durationMinutes,
          totalAmount: finalAmount
        },
        include: {
          bicycle: true,
          student: { select: { id: true, name: true, rollNo: true } }
        }
      });

      await tx.bicycle.update({
        where: { id: activeRental.bicycleId },
        data: { status: BicycleStatus.AVAILABLE }
      });

      const payment = await tx.payment.create({
        data: {
          rentalId: activeRental.id,
          studentId,
          orderId,
          amount: finalAmount,
          currency: 'INR',
          status: PaymentStatus.PENDING,
          paymentMethod: 'UPI'
        }
      });

      return { updatedRental, payment };
    });

    await logAudit({
      actorId: studentId,
      actorType: 'STUDENT',
      action: 'RENTAL_RETURNED',
      entityType: 'Rental',
      entityId: activeRental.id,
      metadata: {
        bicycleCode: activeRental.bicycle.bicycleCode,
        durationMinutes,
        finalAmount,
        orderId
      }
    });

    return res.json({
      success: true,
      message: `Bicycle ${activeRental.bicycle.bicycleCode} returned successfully!`,
      summary: {
        rentalId: result.updatedRental.id,
        bicycleCode: result.updatedRental.bicycle.bicycleCode,
        startTime: result.updatedRental.startTime,
        returnTime: result.updatedRental.endTime,
        durationMinutes: result.updatedRental.durationMinutes,
        hourlyRate: Number(result.updatedRental.hourlyRate),
        finalAmount: Number(result.updatedRental.totalAmount),
        payment: {
          id: result.payment.id,
          orderId: result.payment.orderId,
          amount: Number(result.payment.amount),
          status: result.payment.status
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentRentals(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const [total, rentals] = await Promise.all([
      prisma.rental.count({ where: { studentId } }),
      prisma.rental.findMany({
        where: { studentId },
        include: {
          bicycle: { select: { bicycleCode: true, model: true } },
          payment: { select: { id: true, orderId: true, paymentId: true, amount: true, status: true, paymentMethod: true, updatedAt: true } }
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit
      })
    ]);

    return res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      rentals: rentals.map(r => ({
        id: r.id,
        bicycleCode: r.bicycle.bicycleCode,
        model: r.bicycle.model,
        startTime: r.startTime,
        endTime: r.endTime,
        durationMinutes: r.durationMinutes,
        hourlyRate: Number(r.hourlyRate),
        totalAmount: r.totalAmount ? Number(r.totalAmount) : null,
        status: r.status,
        payment: r.payment ? {
          id: r.payment.id,
          orderId: r.payment.orderId,
          paymentId: r.payment.paymentId,
          amount: Number(r.payment.amount),
          status: r.payment.status,
          updatedAt: r.payment.updatedAt
        } : null
      }))
    });
  } catch (err) {
    next(err);
  }
}
