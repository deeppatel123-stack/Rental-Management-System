import express from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('Super Admin', 'Rental Partner'), getDashboardStats);
router.get('/', protect, authorize('Super Admin', 'Rental Partner'), getDashboardStats);

export default router;
