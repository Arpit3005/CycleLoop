import { Router } from 'express';
import {
  getDashboardStats,
  getStudents,
  updateStudentStatus,
  getAllRentals,
  overrideRental,
  getPricingHistory,
  updatePricing,
  getMaintenanceList,
  createMaintenance,
  updateMaintenance,
  getAnalytics,
  getAuditLogs
} from '../controllers/admin.controller.js';
import {
  adminGetAllBicycles,
  adminCreateBicycle,
  adminUpdateBicycle,
  adminGenerateQr
} from '../controllers/bicycle.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes
router.use(authenticateToken, requireAdmin);

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);

// Students
router.get('/students', getStudents);
router.patch('/students/:id/status', updateStudentStatus);

// Bicycles
router.get('/bicycles', adminGetAllBicycles);
router.post('/bicycles', adminCreateBicycle);
router.patch('/bicycles/:id', adminUpdateBicycle);
router.get('/bicycles/:id/qr', adminGenerateQr);

// Rentals
router.get('/rentals', getAllRentals);
router.post('/rentals/:id/override', overrideRental);

// Pricing
router.get('/pricing', getPricingHistory);
router.post('/pricing', updatePricing);

// Maintenance
router.get('/maintenance', getMaintenanceList);
router.post('/maintenance', createMaintenance);
router.patch('/maintenance/:id', updateMaintenance);

export default router;
