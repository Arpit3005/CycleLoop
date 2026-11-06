import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../prisma.js';
import { PaymentStatus } from '@prisma/client';
import { logAudit } from '../utils/audit.js';

const PAYMENT_MODE = process.env.PAYMENT_MODE || 'SIMULATED';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_campuscycleloop';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_campuscycleloop';

let razorpayClient: any = null;
if (PAYMENT_MODE === 'RAZORPAY' && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  try {
    razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.warn('[Payment] Razorpay client init failed, falling back to simulated mode.');
  }
}

const createOrderSchema = z.object({
  rentalId: z.string().uuid('Invalid rental ID')
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().optional(),
  method: z.string().default('UPI')
});

export async function createPaymentOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const { rentalId } = createOrderSchema.parse(req.body);

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        bicycle: { select: { bicycleCode: true } },
        payment: true
      }
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental record not found.' });
    }

    if (rental.studentId !== studentId && req.user!.type !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized rental access.' });
    }

    // Amount to pay
    const amount = Number(rental.totalAmount || rental.payment?.amount || 1.00);
    const amountInPaise = Math.round(amount * 100);

    let payment = rental.payment;

    if (!payment) {
      const generatedOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      payment = await prisma.payment.create({
        data: {
          rentalId,
          studentId,
          orderId: generatedOrderId,
          amount,
          currency: 'INR',
          status: PaymentStatus.PENDING,
          paymentMethod: 'UPI'
        }
      });
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return res.status(400).json({
        success: false,
        message: 'This rental has already been paid for.',
        payment
      });
    }

    // If Razorpay live/test mode with real client
    let gatewayOrderId = payment.orderId;
    if (PAYMENT_MODE === 'RAZORPAY' && razorpayClient) {
      try {
        const rzpOrder = await razorpayClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: payment.id,
          notes: {
            rentalId: rental.id,
            bicycleCode: rental.bicycle.bicycleCode,
            studentId
          }
        });
        gatewayOrderId = rzpOrder.id;

        // Update payment with Razorpay order ID
        await prisma.payment.update({
          where: { id: payment.id },
          data: { orderId: gatewayOrderId }
        });
      } catch (rzpErr) {
        console.warn('[Payment] Failed creating Razorpay order, using fallback simulation:', rzpErr);
      }
    }

    return res.json({
      success: true,
      mode: PAYMENT_MODE,
      order: {
        paymentId: payment.id,
        orderId: gatewayOrderId,
        amount,
        amountInPaise,
        currency: 'INR',
        bicycleCode: rental.bicycle.bicycleCode,
        durationMinutes: rental.durationMinutes,
        keyId: PAYMENT_MODE === 'RAZORPAY' ? RAZORPAY_KEY_ID : 'simulated_campus_upi_key'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const { orderId, paymentId, signature, method } = verifyPaymentSchema.parse(req.body);

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        rental: { include: { bicycle: true } },
        student: { select: { id: true, name: true, rollNo: true, email: true } }
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this order ID.' });
    }

    if (payment.studentId !== studentId && req.user!.type !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized payment verification.' });
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return res.json({
        success: true,
        message: 'Payment already marked as successful.',
        payment
      });
    }

    // Verify signature if Razorpay mode
    if (PAYMENT_MODE === 'RAZORPAY' && signature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED }
        });
        return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
      }
    }

    // Update payment record to SUCCESS
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentId,
        status: PaymentStatus.SUCCESS,
        paymentMethod: method || 'UPI',
        updatedAt: new Date()
      },
      include: {
        rental: { include: { bicycle: true } }
      }
    });

    await logAudit({
      actorId: studentId,
      actorType: 'STUDENT',
      action: 'PAYMENT_COMPLETED',
      entityType: 'Payment',
      entityId: updatedPayment.id,
      metadata: {
        orderId,
        paymentId,
        amount: Number(updatedPayment.amount),
        method: updatedPayment.paymentMethod
      }
    });

    return res.json({
      success: true,
      message: 'Payment verified and completed successfully!',
      receipt: {
        paymentId: updatedPayment.paymentId,
        orderId: updatedPayment.orderId,
        amount: Number(updatedPayment.amount),
        status: updatedPayment.status,
        method: updatedPayment.paymentMethod,
        timestamp: updatedPayment.updatedAt,
        bicycleCode: updatedPayment.rental.bicycle.bicycleCode,
        durationMinutes: updatedPayment.rental.durationMinutes
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function paymentWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'cycleloop_webhook_secret';
    const signature = req.headers['x-razorpay-signature'] as string;

    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderEntity = payload.order ? payload.order.entity : payload.payment.entity;
      const orderId = orderEntity.id || orderEntity.order_id;
      const paymentId = payload.payment?.entity?.id;

      if (orderId) {
        const payment = await prisma.payment.findUnique({ where: { orderId } });
        if (payment && payment.status !== PaymentStatus.SUCCESS) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              paymentId: paymentId || payment.paymentId || 'webhook_captured',
              updatedAt: new Date()
            }
          });

          await logAudit({
            actorId: 'WEBHOOK',
            actorType: 'SYSTEM',
            action: 'PAYMENT_WEBHOOK_PROCESSED',
            entityType: 'Payment',
            entityId: payment.id,
            metadata: { orderId, paymentId, event }
          });
        }
      }
    }

    return res.json({ status: 'ok', received: true });
  } catch (err) {
    next(err);
  }
}

export async function getStudentPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where: { studentId } }),
      prisma.payment.findMany({
        where: { studentId },
        include: {
          rental: {
            include: { bicycle: { select: { bicycleCode: true, model: true } } }
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
      payments: payments.map(p => ({
        id: p.id,
        orderId: p.orderId,
        paymentId: p.paymentId,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        rental: {
          id: p.rental.id,
          bicycleCode: p.rental.bicycle.bicycleCode,
          durationMinutes: p.rental.durationMinutes,
          startTime: p.rental.startTime,
          endTime: p.rental.endTime
        }
      }))
    });
  } catch (err) {
    next(err);
  }
}
