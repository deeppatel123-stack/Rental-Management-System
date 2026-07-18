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

// Partner workflows only
router.put('/:id/assign', authorize('Rental Partner'), assignPickup);
router.put('/:id/schedule', authorize('Rental Partner'), schedulePickup);
router.patch('/:id/status', authorize('Rental Partner'), updatePickupStatus);
router.post('/:id/verify', authorize('Rental Partner'), verifyPickupCode);
router.post('/:id/confirm', authorize('Rental Partner'), confirmPickup);

export default router;
