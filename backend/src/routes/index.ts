import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bicycleRoutes from './bicycle.routes.js';
import rentalRoutes from './rental.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bicycles', bicycleRoutes);
router.use('/rentals', rentalRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'CycleLoop API',
    timestamp: new Date().toISOString()
  });
});

export default router;
