import express from 'express';
import {
    createTicket,
    getTickets,
    getTicketById,
    addMessageToTicket,
    updateTicketStatus
} from '../controllers/supportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/:id/reply', addMessageToTicket);
router.put('/:id/status', authorize('Super Admin', 'Rental Partner'), updateTicketStatus);

export default router;
