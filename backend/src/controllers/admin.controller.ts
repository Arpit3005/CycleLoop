import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { BicycleStatus, RentalStatus, PaymentStatus, StudentStatus, MaintenanceStatus } from '@prisma/client';
import { logAudit } from '../utils/audit.js';

const updatePricingSchema = z.object({
  hourlyRate: z.number().positive('Hourly rate must be greater than 0'),
  note: z.string().optional()
});

const overrideRentalSchema = z.object({
  action: z.enum(['FORCE_RETURN', 'CANCEL']),
  notes: z.string().min(5, 'Mandatory notes explaining the override are required for audit compliance')
});

const createMaintenanceSchema = z.object({
  bicycleId: z.string().uuid('Valid bicycle ID required'),
  description: z.string().min(5, 'Detailed description of the issue is required')
});

const updateMaintenanceSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus),
  resolutionNotes: z.string().optional()
});

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalStudents,
      totalBicycles,
      availableBicycles,
      rentedBicycles,
      maintenanceBicycles,
      activeRentals,
      completedRentals,
      revenueResult,
      pendingPaymentsCount,
      currentPricing,
      recentRentals
    ] = await Promise.all([
      prisma.student.count(),
      prisma.bicycle.count(),
      prisma.bicycle.count({ where: { status: BicycleStatus.AVAILABLE } }),
      prisma.bicycle.count({ where: { status: BicycleStatus.RENTED } }),
      prisma.bicycle.count({ where: { status: BicycleStatus.MAINTENANCE } }),
      prisma.rental.count({ where: { status: RentalStatus.ACTIVE } }),
      prisma.rental.count({ where: { status: RentalStatus.COMPLETED } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.SUCCESS }
      }),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      prisma.pricing.findFirst({ orderBy: { effectiveFrom: 'desc' } }),
      prisma.rental.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { name: true, rollNo: true } },
          bicycle: { select: { bicycleCode: true } }
        }
      })
    ]);

    return res.json({
      success: true,
      stats: {
        totalStudents,
        totalBicycles,
        availableBicycles,
        rentedBicycles,
        maintenanceBicycles,
        activeRentals,
        completedRentals,
        totalRevenue: Number(revenueResult._sum.amount || 0),
        pendingPayments: pendingPaymentsCount,
        currentHourlyRate: currentPricing?.hourlyRate ? Number(currentPricing.hourlyRate) : 12.50
      },
      recentRentals: recentRentals.map(r => ({
        id: r.id,
        studentName: r.student.name,
        rollNo: r.student.rollNo,
        bicycleCode: r.bicycle.bicycleCode,
        startTime: r.startTime,
        status: r.status,
        amount: r.totalAmount ? Number(r.totalAmount) : null
      }))
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && (status === 'ACTIVE' || status === 'SUSPENDED')) {
      where.status = status as StudentStatus;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { branch: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          _count: { select: { rentals: true, payments: true } },
          payments: {
            where: { status: PaymentStatus.SUCCESS },
            select: { amount: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      students: students.map(s => {
        const totalSpent = s.payments.reduce((acc, p) => acc + Number(p.amount), 0);
        return {
          id: s.id,
          name: s.name,
          rollNo: s.rollNo,
          branch: s.branch,
          email: s.email,
          phone: s.phone,
          status: s.status,
          createdAt: s.createdAt,
          totalRentals: s._count.rentals,
          totalSpent: Math.round(totalSpent * 100) / 100
        };
      })
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStudentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updated = await prisma.student.update({
      where: { id },
      data: { status: status as StudentStatus }
    });

    await logAudit({
      actorId: req.user!.id,
      actorType: 'ADMIN',
      action: 'STUDENT_STATUS_UPDATE',
      entityType: 'Student',
      entityId: id,
      metadata: { newStatus: status, studentEmail: updated.email }
    });

    return res.json({ success: true, message: `Student status updated to ${status}`, student: updated });
  } catch (err) {
    next(err);
  }
}

export async function getAllRentals(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && Object.values(RentalStatus).includes(status as RentalStatus)) {
      where.status = status as RentalStatus;
    }
    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { rollNo: { contains: search, mode: 'insensitive' } } },
        { bicycle: { bicycleCode: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [total, rentals] = await Promise.all([
      prisma.rental.count({ where }),
      prisma.rental.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, rollNo: true, branch: true, email: true } },
          bicycle: { select: { id: true, bicycleCode: true, model: true, location: true } },
          payment: { select: { id: true, orderId: true, paymentId: true, amount: true, status: true, paymentMethod: true } }
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
        student: r.student,
        bicycle: r.bicycle,
        startTime: r.startTime,
        endTime: r.endTime,
        durationMinutes: r.durationMinutes,
        hourlyRate: Number(r.hourlyRate),
        totalAmount: r.totalAmount ? Number(r.totalAmount) : null,
        status: r.status,
        payment: r.payment ? {
          ...r.payment,
          amount: Number(r.payment.amount)
        } : null
      }))
    });
  } catch (err) {
    next(err);
  }
}

export async function overrideRental(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { action, notes } = overrideRentalSchema.parse(req.body);

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { bicycle: true, student: true }
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      return res.status(400).json({ success: false, message: `Rental is already in ${rental.status} state.` });
    }

    const now = new Date();
    const durationMinutes = Math.max(1, Math.ceil((now.getTime() - new Date(rental.startTime).getTime()) / (1000 * 60)));
    const hourlyRate = Number(rental.hourlyRate);
    const amount = action === 'CANCEL' ? 0 : Math.max(1, Math.round(((durationMinutes / 60) * hourlyRate) * 100) / 100);

    const result = await prisma.$transaction(async (tx) => {
      const updatedRental = await tx.rental.update({
        where: { id },
        data: {
          status: action === 'CANCEL' ? RentalStatus.CANCELLED : RentalStatus.COMPLETED,
          endTime: now,
          durationMinutes,
          totalAmount: amount
        }
      });

      await tx.bicycle.update({
        where: { id: rental.bicycleId },
        data: { status: BicycleStatus.AVAILABLE }
      });

      return updatedRental;
    });

    await logAudit({
      actorId: req.user!.id,
      actorType: 'ADMIN',
      action: `RENTAL_OVERRIDE_${action}`,
      entityType: 'Rental',
      entityId: id,
      metadata: {
        notes,
        action,
        bicycleCode: rental.bicycle.bicycleCode,
        studentRollNo: rental.student.rollNo,
        durationMinutes,
        amount
      }
    });

    return res.json({
      success: true,
      message: `Rental successfully resolved with action ${action}. Audit log recorded.`,
      rental: result
    });
  } catch (err) {
    next(err);
  }
}

export async function getPricingHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const pricing = await prisma.pricing.findMany({
      orderBy: { effectiveFrom: 'desc' }
    });
    return res.json({ success: true, pricing });
  } catch (err) {
    next(err);
  }
}

export async function updatePricing(req: Request, res: Response, next: NextFunction) {
  try {
    const { hourlyRate, note } = updatePricingSchema.parse(req.body);

    const created = await prisma.pricing.create({
      data: {
        hourlyRate,
        note: note || `Updated by ${req.user!.name}`,
        updatedBy: req.user!.name,
        effectiveFrom: new Date()
      }
    });

    await logAudit({
      actorId: req.user!.id,
      actorType: 'ADMIN',
      action: 'PRICING_UPDATED',
      entityType: 'Pricing',
      entityId: created.id,
      metadata: { newHourlyRate: hourlyRate, note }
    });

    return res.status(201).json({
      success: true,
      message: `Hourly rate updated to ₹${hourlyRate.toFixed(2)}. Applies to all new rentals.`,
      pricing: created
    });
  } catch (err) {
    next(err);
  }
}

export async function getMaintenanceList(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await prisma.maintenance.findMany({
      include: {
        bicycle: { select: { bicycleCode: true, model: true, location: true } }
      },
      orderBy: { reportedAt: 'desc' }
    });
    return res.json({ success: true, maintenance: list });
  } catch (err) {
    next(err);
  }
}

export async function createMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const { bicycleId, description } = createMaintenanceSchema.parse(req.body);

    const bicycle = await prisma.bicycle.findUnique({ where: { id: bicycleId } });
    if (!bicycle) {
      return res.status(404).json({ success: false, message: 'Bicycle not found' });
    }

    const record = await prisma.$transaction(async (tx) => {
      const maint = await tx.maintenance.create({
        data: {
          bicycleId,
          description,
          status: MaintenanceStatus.OPEN
        }
      });

      await tx.bicycle.update({
        where: { id: bicycleId },
        data: { status: BicycleStatus.MAINTENANCE }
      });

      return maint;
    });

    await logAudit({
      actorId: req.user!.id,
      actorType: 'ADMIN',
      action: 'MAINTENANCE_LOGGED',
      entityType: 'Maintenance',
      entityId: record.id,
      metadata: { bicycleCode: bicycle.bicycleCode, description }
    });

    return res.status(201).json({
      success: true,
      message: `Maintenance scheduled. Bicycle ${bicycle.bicycleCode} marked under maintenance.`,
      maintenance: record
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = updateMaintenanceSchema.parse(req.body);

    const existing = await prisma.maintenance.findUnique({
      where: { id },
      include: { bicycle: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    const resolved = status === MaintenanceStatus.RESOLVED;

    const updated = await prisma.$transaction(async (tx) => {
      const m = await tx.maintenance.update({
        where: { id },
        data: {
          status,
          resolutionNotes: resolutionNotes || existing.resolutionNotes,
          resolvedAt: resolved ? new Date() : null
        }
      });

      if (resolved) {
        await tx.bicycle.update({
          where: { id: existing.bicycleId },
          data: { status: BicycleStatus.AVAILABLE }
        });
      }

      return m;
    });

    await logAudit({
      actorId: req.user!.id,
      actorType: 'ADMIN',
      action: 'MAINTENANCE_STATUS_UPDATE',
      entityType: 'Maintenance',
      entityId: id,
      metadata: { status, bicycleCode: existing.bicycle.bicycleCode, resolutionNotes }
    });

    return res.json({
      success: true,
      message: `Maintenance status updated to ${status}. Bicycle restored to fleet if resolved.`,
      maintenance: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Group rentals and revenue by last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedRentals = await prisma.rental.findMany({
      where: {
        status: RentalStatus.COMPLETED,
        endTime: { gte: sevenDaysAgo }
      },
      select: { endTime: true, totalAmount: true, durationMinutes: true }
    });

    const dayMap = new Map<string, { date: string, rentals: number, revenue: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dayMap.set(key, { date: key, rentals: 0, revenue: 0 });
    }

    for (const r of completedRentals) {
      if (r.endTime) {
        const key = new Date(r.endTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (dayMap.has(key)) {
          const entry = dayMap.get(key)!;
          entry.rentals += 1;
          entry.revenue += Number(r.totalAmount || 0);
        }
      }
    }

    const chartData = Array.from(dayMap.values()).map(item => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100
    }));

    // 2. Bicycle station fleet distribution
    const stationDistribution = await prisma.bicycle.groupBy({
      by: ['location'],
      _count: { id: true }
    });

    return res.json({
      success: true,
      chartData,
      stationDistribution: stationDistribution.map(s => ({
        location: s.location,
        count: s._count.id
      }))
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      logs
    });
  } catch (err) {
    next(err);
  }
}
