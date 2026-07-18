import express from 'express';
import {
    getReturns,
    getReturnById,
    assignReturnExecutive,
    scheduleReturn,
    updateReturnStatus,
    verifyReturnOtp,
    verifyReturnQr,
    startInspection,
    confirmReturn
} from '../controllers/returnController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// All authenticated roles can view returns (filtered by role)
router.get('/', getReturns);
router.get('/:id', getReturnById);

// Admin & Partner workflows
router.put('/:id/assign', authorize('Super Admin', 'Rental Partner'), assignReturnExecutive);
router.put('/:id/schedule', authorize('Super Admin', 'Rental Partner'), scheduleReturn);
router.patch('/:id/status', authorize('Super Admin', 'Rental Partner'), updateReturnStatus);
router.post('/:id/verify-otp', authorize('Super Admin', 'Rental Partner'), verifyReturnOtp);
router.post('/:id/verify-qr', authorize('Super Admin', 'Rental Partner'), verifyReturnQr);
router.post('/:id/start-inspection', authorize('Super Admin', 'Rental Partner'), startInspection);
router.post('/:id/confirm', authorize('Super Admin', 'Rental Partner'), confirmReturn);

export default router;
