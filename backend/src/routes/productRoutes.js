import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createReview,
    getReviews
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/reviews', getReviews);


router.post('/reviews', protect, createReview);


router.post('/', protect, authorize('Super Admin'), upload.array('images', 5), createProduct);
router.put('/:id', protect, authorize('Super Admin'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('Super Admin'), deleteProduct);

export default router;
