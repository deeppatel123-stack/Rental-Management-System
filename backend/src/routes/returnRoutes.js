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

// Partner actions only
router.put('/:id/assign', authorize('Rental Partner'), assignReturnExecutive);
router.put('/:id/schedule', authorize('Rental Partner'), scheduleReturn);
router.patch('/:id/status', authorize('Rental Partner'), updateReturnStatus);
router.post('/:id/verify-otp', authorize('Rental Partner'), verifyReturnOtp);
router.post('/:id/verify-qr', authorize('Rental Partner'), verifyReturnQr);
router.post('/:id/start-inspection', authorize('Rental Partner'), startInspection);
router.post('/:id/confirm', authorize('Rental Partner'), confirmReturn);

export default router;
