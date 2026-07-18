import express from 'express';
import {
    createQuotation,
    getQuotations,
    updateQuotationStatus,
    createRepairTicket,
    getRepairTickets,
    updateRepairTicket,
    getDeposits,
    updateDepositStatus,
    createDriverAssignment,
    getDriverAssignments,
    createCoupon,
    getCoupons,
    validateCoupon,
    createMembershipPlan,
    getMembershipPlans,
    getAuditLogs
} from '../controllers/enterpriseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// Quotation management
router.get('/quotations', authorize('Rental Partner'), getQuotations);
router.post('/quotations', authorize('Rental Partner'), createQuotation);
router.patch('/quotations/:id/status', authorize('Rental Partner'), updateQuotationStatus);

// Damage inspection & repair tickets
router.get('/repairs', authorize('Rental Partner'), getRepairTickets);
router.post('/repairs', authorize('Rental Partner'), createRepairTicket);
router.patch('/repairs/:id', authorize('Rental Partner'), updateRepairTicket);

// Deposit ledger approval
router.get('/deposits', authorize('Rental Partner'), getDeposits);
router.patch('/deposits/:id', authorize('Rental Partner'), updateDepositStatus);

// Drivers route assignment
router.get('/drivers', authorize('Rental Partner'), getDriverAssignments);
router.post('/drivers', authorize('Rental Partner'), createDriverAssignment);

// Marketing campaigns & coupons
router.get('/coupons', authorize('Super Admin'), getCoupons);
router.post('/coupons', authorize('Super Admin'), createCoupon);
router.post('/coupons/validate', validateCoupon);

// Memberships
router.get('/memberships', getMembershipPlans);
router.post('/memberships', authorize('Super Admin'), createMembershipPlan);

// Audit & Activity Logs
router.get('/audit-logs', authorize('Super Admin'), getAuditLogs);

export default router;
