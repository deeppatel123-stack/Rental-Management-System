import express from 'express';
import {
    getPickups,
    getPickupById,
    assignPickup,
    schedulePickup,
    updatePickupStatus,
    verifyPickupCode,
    confirmPickup
} from '../controllers/pickupController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// All authenticated roles can view pickups (result filtered by role)
router.get('/', getPickups);
router.get('/:id', getPickupById);

// Admin & Partner workflows
router.put('/:id/assign', authorize('Super Admin', 'Rental Partner'), assignPickup);
router.put('/:id/schedule', authorize('Super Admin', 'Rental Partner'), schedulePickup);
router.patch('/:id/status', authorize('Super Admin', 'Rental Partner'), updatePickupStatus);
router.post('/:id/verify', authorize('Super Admin', 'Rental Partner'), verifyPickupCode);
router.post('/:id/confirm', authorize('Super Admin', 'Rental Partner'), confirmPickup);

export default router;
