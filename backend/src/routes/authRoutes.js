import express from 'express';
import {
    register,
    verifyEmail,
    login,
    logout,
    getMe,
    updateProfile,
    addAddress,
    deleteAddress,
    requestPasswordReset,
    resetPassword,
    resendVerification,
    getEmployeeList,
    getCustomerList,
    deleteCustomer,
    addExecutive
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/resend-verification', resendVerification);


router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.post('/address', protect, addAddress);
router.delete('/address/:id', protect, deleteAddress);
router.get('/employees', protect, authorize('Super Admin', 'Rental Partner'), getEmployeeList);
router.post('/employees', protect, authorize('Super Admin', 'Rental Partner'), addExecutive);
router.get('/partners', protect, authorize('Super Admin'), getEmployeeList);
router.get('/customers', protect, authorize('Super Admin'), getCustomerList);
router.delete('/customers/:id', protect, authorize('Super Admin'), deleteCustomer);

export default router;
