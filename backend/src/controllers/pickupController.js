import Pickup from '../models/Pickup.js';
import RentalOrder from '../models/RentalOrder.js';
import Inventory from '../models/Inventory.js';
import ActivityLog from '../models/ActivityLog.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { generateQRCode } from '../services/qrService.js';
import { triggerEvent } from '../services/eventService.js';

// 
// GET ALL PICKUPS (role-filtered)
// 
export const getPickups = async (req, res, next) => {
    try {
        const query = {};
        if (req.user.role === 'Customer') {
            query.customer = req.user.id;
        } else if (req.user.role === 'Rental Partner') {
            query.ownerId = req.user.id;
        }

        const pickups = await Pickup.find(query)
            .populate('rentalOrder', 'orderNumber startDate endDate deliveryType status paymentStatus depositStatus totalAmount securityDepositTotal')
            .populate('customer', 'name email phone')
            .populate('assignedEmployee', 'name email phone')
            .populate('assignedExecutiveId', 'name email phone')
            .populate('productId', 'name sku images')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: pickups.length, pickups });
    } catch (error) {
        next(error);
    }
};

// 
// GET SINGLE PICKUP BY ID
// 
export const getPickupById = async (req, res, next) => {
    try {
        const pickup = await Pickup.findById(req.params.id)
            .populate('rentalOrder', 'orderNumber startDate endDate deliveryType status paymentStatus depositStatus totalAmount securityDepositTotal shippingAddress')
            .populate('customer', 'name email phone')
            .populate('assignedEmployee', 'name email phone')
            .populate('productId', 'name sku images');

        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Customer' && pickup.customer._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        res.json({ success: true, pickup });
    } catch (error) {
        next(error);
    }
};

// 
// ASSIGN PICKUP EXECUTIVE
// 
export const assignPickup = async (req, res, next) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID is required' });

        const pickup = await Pickup.findById(req.params.id);
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        // Verify order pre-conditions: allow assignment for any non-completed/non-cancelled rental
        const order = await RentalOrder.findById(pickup.rentalOrder);
        if (!order) return res.status(404).json({ success: false, message: 'Associated rental order not found' });

        const ASSIGNABLE_STATUSES = ['Confirmed', 'Ready for Pickup', 'Active', 'Picked Up'];
        if (!ASSIGNABLE_STATUSES.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot assign pickup for order with status: ${order.status}. Order must be Confirmed, Ready for Pickup, or Active.`
            });
        }

        // Verify the executive belongs to this Rental Partner
        const executive = await User.findById(employeeId).select('name email role addedBy');
        if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });
        if (executive.role !== 'Delivery Executive') {
            return res.status(400).json({ success: false, message: 'Selected user is not a Delivery Executive.' });
        }
        if (req.user.role === 'Rental Partner' && executive.addedBy?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only assign executives that you have registered.' });
        }

        pickup.assignedEmployee = employeeId;
        pickup.assignedExecutiveId = employeeId;
        pickup.status = 'Assigned';
        // Auto-generate OTP on assignment so customer can see it immediately
        pickup.otp = Math.floor(100000 + Math.random() * 900000).toString();
        pickup.timeline.push({
            status: 'Assigned',
            notes: `Pickup executive assigned: ${executive?.name || employeeId}. OTP auto-generated.`,
            updatedBy: req.user.id
        });
        await pickup.save();

        // Notify customer
        await Notification.create({
            user: pickup.customer,
            title: '🚚 Pickup Executive Assigned',
            message: `A pickup executive (${executive?.name || 'Our team'}) has been assigned to deliver your rental order.`,
            type: 'Rental',
            referenceId: pickup.rentalOrder
        });

        await ActivityLog.create({
            user: req.user.id,
            action: 'Assign Pickup Executive',
            module: 'Logistics',
            details: `Assigned ${executive?.name || employeeId} to pickup for order #${order.orderNumber}`
        });

        res.json({ success: true, message: 'Executive assigned to pickup successfully', pickup });
    } catch (error) {
        next(error);
    }
};

// 
// SCHEDULE PICKUP DATE & TIME (generates QR)
// 
export const schedulePickup = async (req, res, next) => {
    try {
        const { scheduledDate, vehicleDetails, notes } = req.body;
        if (!scheduledDate) return res.status(400).json({ success: false, message: 'Scheduled date is required' });

        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder', 'orderNumber');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        if (['Completed', 'Cancelled'].includes(pickup.status)) {
            return res.status(400).json({ success: false, message: 'Cannot reschedule a completed or cancelled pickup' });
        }

        // Track reschedule history if already scheduled
        if (pickup.scheduledDate && pickup.status === 'Scheduled') {
            pickup.rescheduleHistory.push({
                previousDate: pickup.scheduledDate,
                newDate: new Date(scheduledDate),
                reason: notes || 'Rescheduled by partner'
            });
        }

        pickup.scheduledDate = new Date(scheduledDate);
        if (vehicleDetails) pickup.vehicleDetails = vehicleDetails;
        if (notes) pickup.notes = notes;
        pickup.status = 'Scheduled';

        // Generate QR Code data for pickup verification
        const qrPayload = JSON.stringify({
            type: 'PICKUP_QR',
            pickupId: pickup._id.toString(),
            orderId: pickup.rentalOrder._id?.toString() || pickup.rentalOrder.toString(),
            otp: pickup.otp,
            scheduledDate: pickup.scheduledDate.toISOString()
        });
        pickup.qrCodeData = await generateQRCode(qrPayload);

        pickup.timeline.push({
            status: 'Scheduled',
            notes: `Pickup scheduled for ${new Date(scheduledDate).toLocaleString()}. Vehicle: ${vehicleDetails || 'N/A'}. QR Code generated.`,
            updatedBy: req.user.id
        });

        await pickup.save();

        // Notify customer with OTP
        await Notification.create({
            user: pickup.customer,
            title: '📅 Pickup Scheduled',
            message: `Your pickup is scheduled for ${new Date(scheduledDate).toLocaleString()}. Your OTP: ${pickup.otp}. Show this to the executive.`,
            type: 'Rental',
            referenceId: pickup.rentalOrder._id || pickup.rentalOrder
        });

        res.json({ success: true, message: 'Pickup scheduled and QR generated successfully!', pickup });
    } catch (error) {
        next(error);
    }
};

// 
// UPDATE PICKUP STATUS (On The Way, Cancelled, etc.)
// 
export const updatePickupStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const ALLOWED_STATUSES = ['Pending', 'Assigned', 'Scheduled', 'On The Way', 'OTP Verified', 'QR Verified', 'Picked Up', 'Completed', 'Cancelled'];
        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
        }

        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder', 'orderNumber');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        pickup.status = status;
        pickup.timeline.push({
            status,
            notes: notes || `Status changed to ${status}`,
            updatedBy: req.user.id
        });
        await pickup.save();

        // Notify customer
        await Notification.create({
            user: pickup.customer,
            title: `📦 Pickup Update: ${status}`,
            message: notes || `Your pickup status has been updated to: ${status}`,
            type: 'Rental',
            referenceId: pickup.rentalOrder._id || pickup.rentalOrder
        });

        res.json({ success: true, message: `Pickup status updated to ${status}.`, pickup });
    } catch (error) {
        next(error);
    }
};

// 
// VERIFY OTP OR QR CODE
// 
export const verifyPickupCode = async (req, res, next) => {
    try {
        const { otp, qrScanned } = req.body;
        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        // Must be in an active logistics state
        const VERIFIABLE_STATUSES = ['On The Way', 'Assigned', 'Scheduled', 'OTP Verified'];
        if (!VERIFIABLE_STATUSES.includes(pickup.status)) {
            return res.status(400).json({
                success: false,
                message: `Pickup must be in an active delivery state to verify. Current: ${pickup.status}`
            });
        }

        if (otp) {
            if (pickup.otp !== otp.toString()) {
                return res.status(400).json({ success: false, message: 'Invalid OTP. Please ask the customer to share the correct code.' });
            }
        } else if (!qrScanned) {
            return res.status(400).json({ success: false, message: 'Provide either OTP or QR scan confirmation' });
        }

        // Directly complete the pickup
        pickup.isOtpVerified = true;
        pickup.customerSignature = 'OTP Verified Handoff';
        pickup.actualPickupDate = new Date();
        pickup.status = 'Completed';
        pickup.timeline.push({
            status: 'Completed',
            notes: otp ? `Partner verified customer OTP. Pickup marked Completed.` : 'QR Code scanned. Pickup marked Completed.',
            updatedBy: req.user.id
        });
        await pickup.save();

        // Trigger order → Active + auto-create Return record
        const order = await RentalOrder.findById(pickup.rentalOrder._id || pickup.rentalOrder);
        if (order) {
            await triggerEvent('PickupCompleted', { orderId: order._id, userId: req.user.id });
        }

        await ActivityLog.create({
            user: req.user.id,
            action: 'Verify Pickup OTP',
            module: 'Logistics',
            details: `Pickup for order #${order?.orderNumber} completed via OTP verification`
        });

        res.json({
            success: true,
            message: 'Pickup completed successfully! Order is now Active and queued for return.',
            pickup
        });
    } catch (error) {
        next(error);
    }
};

// 
// CONFIRM PICKUP COMPLETION (inventory sync, order → Active)
// 
export const confirmPickup = async (req, res, next) => {
    try {
        const { checklist, signature } = req.body;

        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        // Verify order conditions
        const order = await RentalOrder.findById(pickup.rentalOrder._id || pickup.rentalOrder);
        if (!order) return res.status(404).json({ success: false, message: 'Associated rental order not found' });

        if (order.paymentStatus !== 'Paid') {
            return res.status(400).json({ success: false, message: 'Payment must be verified before completing pickup.' });
        }
        if (!['Held', 'Paid'].includes(order.depositStatus)) {
            return res.status(400).json({ success: false, message: 'Security deposit must be collected before completing pickup.' });
        }

        const finalSignature = signature?.trim() || 'Handover E-Signed';

        // Update pickup record
        if (checklist && checklist.length > 0) pickup.checklist = checklist;
        pickup.customerSignature = finalSignature;
        pickup.actualPickupDate = new Date();
        pickup.status = 'Completed';
        pickup.timeline.push({
            status: 'Completed',
            notes: 'Pickup completed. Items handed over to customer. Inventory updated.',
            updatedBy: req.user.id
        });
        await pickup.save();

        // Trigger Event - handles order state, timeline, inventory stock sync, user notifications
        await triggerEvent('PickupCompleted', { orderId: order._id, userId: req.user.id });

        await ActivityLog.create({
            user: req.user.id,
            action: 'Complete Pickup',
            module: 'Logistics',
            details: `Pickup completed via Event System for Order #${order.orderNumber}.`
        });

        const updatedOrder = await RentalOrder.findById(order._id);
        res.json({
            success: true,
            message: `Pickup completed! Order #${order.orderNumber} is now Active.`,
            pickup,
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};

// 
// GENERATE OTP (called by executive/partner when they reach customer)
// 
export const generatePickupOtp = async (req, res, next) => {
    try {
        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder', 'orderNumber');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        pickup.otp = newOtp;
        pickup.status = 'On The Way';
        pickup.timeline.push({
            status: 'On The Way',
            notes: 'Executive generated new handoff verification OTP.',
            updatedBy: req.user.id
        });
        await pickup.save();

        await Notification.create({
            user: pickup.customer,
            title: '🔑 Delivery Verification OTP',
            message: `Your executive has generated a receipt verification OTP: ${newOtp}. Enter this to confirm delivery receipt.`,
            type: 'Rental',
            referenceId: pickup.rentalOrder._id || pickup.rentalOrder
        });

        res.json({ success: true, message: 'Handoff verification OTP generated!', pickup });
    } catch (error) {
        next(error);
    }
};

// 
// CUSTOMER VERIFY OTP (called by customer from their panel to confirm order receipt)
// 
export const customerVerifyOtp = async (req, res, next) => {
    try {
        const { otp } = req.body;
        if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        if (pickup.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please enter the correct code.' });
        }

        const order = await RentalOrder.findById(pickup.rentalOrder._id || pickup.rentalOrder);
        if (!order) return res.status(404).json({ success: false, message: 'Associated order not found' });

        pickup.isOtpVerified = true;
        pickup.customerSignature = 'OTP Verified Handoff';
        pickup.actualPickupDate = new Date();
        pickup.status = 'Completed';
        pickup.timeline.push({
            status: 'Completed',
            notes: 'Customer verified handoff OTP. Pickup marked Completed.',
            updatedBy: req.user.id
        });
        await pickup.save();

        await triggerEvent('PickupCompleted', { orderId: order._id, userId: req.user.id });

        await ActivityLog.create({
            user: req.user.id,
            action: 'Customer Verify OTP',
            module: 'Logistics',
            details: `Customer verified pickup OTP for Order #${order.orderNumber}`
        });

        const updatedOrder = await RentalOrder.findById(order._id);

        res.json({
            success: true,
            message: 'OTP verified successfully! Order is now confirmed and Active.',
            pickup,
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};
