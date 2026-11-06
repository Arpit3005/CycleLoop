import { Router } from 'express';
import { getAvailableBicycles, identifyBicycle } from '../controllers/bicycle.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public / Authenticated student routes
router.get('/available', getAvailableBicycles);
router.get('/identify/:tokenOrCode', authenticateToken, identifyBicycle);

export default router;
