import express from 'express';
import {
    createQuotation,
    createRentalOrder,
    getRentalOrders,
    getRentalOrderById,
    signAgreement,
    requestReturnAction,
    updateOrderStatus,
    deleteRentalOrder,
    confirmDelivery
} from '../controllers/rentalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();


router.post('/quotation', createQuotation);


router.use(protect);
router.post('/checkout', createRentalOrder);
router.get('/', getRentalOrders);
router.get('/my-rentals', getRentalOrders);
router.get('/:id', getRentalOrderById);
router.post('/:id/sign-agreement', signAgreement);
router.post('/:id/request-return', requestReturnAction);
router.patch('/:id/status', authorize('Super Admin', 'Rental Partner'), updateOrderStatus);
router.post('/:id/confirm-delivery', confirmDelivery);
router.delete('/:id', deleteRentalOrder);


export default router;
