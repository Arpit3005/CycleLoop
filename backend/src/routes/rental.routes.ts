import { Router } from 'express';
import { startRental, getActiveRental, returnRental, getStudentRentals } from '../controllers/rental.controller.js';
import { authenticateToken, requireStudent } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireStudent);

router.post('/start', startRental);
router.get('/active', getActiveRental);
router.post('/return', returnRental);
router.get('/history', getStudentRentals);

export default router;
