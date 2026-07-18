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

router.use(protect);

router.post('/quotation', authorize('Rental Partner'), createQuotation);
router.post('/checkout', authorize('Customer'), createRentalOrder);
router.get('/', authorize('Super Admin', 'Rental Partner'), getRentalOrders);
router.get('/my-rentals', authorize('Customer'), getRentalOrders);
router.get('/:id', authorize('Super Admin', 'Rental Partner', 'Customer'), getRentalOrderById);
router.post('/:id/sign-agreement', authorize('Customer'), signAgreement);
router.post('/:id/request-return', authorize('Customer'), requestReturnAction);
router.patch('/:id/status', authorize('Rental Partner'), updateOrderStatus);
router.post('/:id/confirm-delivery', authorize('Customer'), confirmDelivery);
router.delete('/:id', authorize('Customer'), deleteRentalOrder);


export default router;
