import { Router } from 'express';
import { studentRegister, studentLogin, adminLogin, getMe, updateStudentProfile } from '../controllers/auth.controller.js';
import { authenticateToken, requireStudent } from '../middleware/auth.js';

const router = Router();

router.post('/student/register', studentRegister);
router.post('/student/login', studentLogin);
router.post('/admin/login', adminLogin);
router.get('/me', authenticateToken, getMe);
router.patch('/profile', authenticateToken, requireStudent, updateStudentProfile);

export default router;
