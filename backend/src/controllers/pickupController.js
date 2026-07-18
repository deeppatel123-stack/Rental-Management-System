import Pickup from '../models/Pickup.js';
import RentalOrder from '../models/RentalOrder.js';
import Inventory from '../models/Inventory.js';
import ActivityLog from '../models/ActivityLog.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { generateQRCode } from '../services/qrService.js';

// ─────────────────────────────────────────────
// GET ALL PICKUPS (role-filtered)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET SINGLE PICKUP BY ID
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// ASSIGN PICKUP EXECUTIVE
// ─────────────────────────────────────────────
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

        // Verify order pre-conditions: Rental must be Confirmed, Payment Paid, Deposit Held/Paid
        const order = await RentalOrder.findById(pickup.rentalOrder);
        if (!order) return res.status(404).json({ success: false, message: 'Associated rental order not found' });

        if (order.status !== 'Confirmed') {
            return res.status(400).json({
                success: false,
                message: `Pickup can only be initiated for Confirmed orders. Current status: ${order.status}`
            });
        }
        if (order.paymentStatus !== 'Paid') {
            return res.status(400).json({ success: false, message: 'Payment must be completed before assigning pickup.' });
        }
        if (!['Held', 'Paid'].includes(order.depositStatus)) {
            return res.status(400).json({ success: false, message: 'Security deposit must be collected before assigning pickup.' });
        }

        const executive = await User.findById(employeeId).select('name email');

        pickup.assignedEmployee = employeeId;
        pickup.assignedExecutiveId = employeeId;
        pickup.status = 'Assigned';
        pickup.timeline.push({
            status: 'Assigned',
            notes: `Pickup executive assigned: ${executive?.name || employeeId}`,
            updatedBy: req.user.id
        });
        await pickup.save();

        // Notify customer
        await Notification.create({
            user: pickup.customer,
            title: '🚚 Pickup Executive Assigned',
            message: `A pickup executive (${executive?.name || 'Our team'}) has been assigned to deliver your rental order.`,
            type: 'Order',
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

// ─────────────────────────────────────────────
// SCHEDULE PICKUP DATE & TIME (generates QR)
// ─────────────────────────────────────────────
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
            type: 'Order',
            referenceId: pickup.rentalOrder._id || pickup.rentalOrder
        });

        res.json({ success: true, message: 'Pickup scheduled and QR generated successfully!', pickup });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// UPDATE PICKUP STATUS (On The Way, Cancelled, etc.)
// ─────────────────────────────────────────────
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
            type: 'Order',
            referenceId: pickup.rentalOrder._id || pickup.rentalOrder
        });

        res.json({ success: true, message: `Pickup status updated to ${status}.`, pickup });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// VERIFY OTP OR QR CODE
// ─────────────────────────────────────────────
export const verifyPickupCode = async (req, res, next) => {
    try {
        const { otp, qrScanned } = req.body;
        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder', 'orderNumber');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        if (pickup.status !== 'On The Way') {
            return res.status(400).json({ success: false, message: 'OTP/QR can only be verified when status is "On The Way"' });
        }

        if (otp) {
            if (pickup.otp !== otp) {
                return res.status(400).json({ success: false, message: 'Invalid OTP. Please ask the customer to share the correct code.' });
            }
            pickup.isOtpVerified = true;
            pickup.status = 'OTP Verified';
            pickup.timeline.push({
                status: 'OTP Verified',
                notes: 'Customer OTP verified successfully',
                updatedBy: req.user.id
            });
        } else if (qrScanned) {
            pickup.qrScanned = true;
            pickup.isOtpVerified = true;
            pickup.status = 'QR Verified';
            pickup.timeline.push({
                status: 'QR Verified',
                notes: 'Customer QR code scanned and verified',
                updatedBy: req.user.id
            });
        } else {
            return res.status(400).json({ success: false, message: 'Provide either OTP or QR scan confirmation' });
        }

        await pickup.save();

        res.json({ success: true, message: `${otp ? 'OTP' : 'QR'} verified successfully!`, pickup });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// CONFIRM PICKUP COMPLETION (inventory sync, order → Active)
// ─────────────────────────────────────────────
export const confirmPickup = async (req, res, next) => {
    try {
        const { checklist, signature } = req.body;

        const pickup = await Pickup.findById(req.params.id).populate('rentalOrder');
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && pickup.ownerId && pickup.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        // Must be OTP/QR Verified first
        if (!['OTP Verified', 'QR Verified', 'Picked Up'].includes(pickup.status)) {
            return res.status(400).json({ success: false, message: 'Please verify OTP or QR code before completing pickup' });
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

        if (!signature || !signature.trim()) {
            return res.status(400).json({ success: false, message: 'Customer digital signature is required to complete pickup.' });
        }

        // Update pickup record
        if (checklist && checklist.length > 0) pickup.checklist = checklist;
        pickup.customerSignature = signature;
        pickup.actualPickupDate = new Date();
        pickup.status = 'Completed';
        pickup.timeline.push({
            status: 'Completed',
            notes: 'Pickup completed. Items handed over to customer. Inventory updated.',
            updatedBy: req.user.id
        });
        await pickup.save();

        // Update order to Active
        order.status = 'Active';
        order.timeline.push({
            status: 'Active',
            description: 'Rental pickup completed. Customer received items. Rental is now active.',
            updatedBy: req.user.id
        });
        await order.save();

        // Inventory synchronization: Available → Rented
        let inventoryUpdated = 0;
        for (const item of order.items) {
            if (item.inventoryItem) {
                const physicalUnit = await Inventory.findById(item.inventoryItem);
                if (physicalUnit) {
                    physicalUnit.status = 'Rented';
                    physicalUnit.movementHistory.push({
                        action: 'Rental Pickup Completed',
                        performedBy: req.user.id,
                        notes: `Checked out under Order #${order.orderNumber}. Pickup confirmed.`
                    });
                    await physicalUnit.save();
                    inventoryUpdated++;
                }
            }
        }

        // Product stock: reserved → rented (reduce reserved)
        const productIds = [...new Set(order.items.map(i => i.product.toString()))];
        for (const pid of productIds) {
            const itemsForProduct = order.items.filter(i => i.product.toString() === pid);
            const qty = itemsForProduct.reduce((a, i) => a + (i.quantity || 1), 0);
            await Product.findByIdAndUpdate(pid, {
                $inc: { 'stock.reserved': -qty }
            });
        }

        await ActivityLog.create({
            user: req.user.id,
            action: 'Complete Pickup',
            module: 'Logistics',
            details: `Pickup completed for Order #${order.orderNumber}. ${inventoryUpdated} inventory units updated to Rented.`
        });

        // Notify customer
        await Notification.create({
            user: pickup.customer,
            title: '✅ Rental Now Active!',
            message: `Your rental order #${order.orderNumber} is now active. Enjoy your equipment! Return it by ${new Date(order.endDate).toLocaleDateString()}.`,
            type: 'Order',
            referenceId: order._id
        });

        // Notify admin/partner
        const admins = await User.find({ role: { $in: ['Super Admin'] } }).select('_id');
        for (const admin of admins) {
            await Notification.create({
                user: admin._id,
                title: '📦 Pickup Completed',
                message: `Order #${order.orderNumber} pickup confirmed. Rental is now Active.`,
                type: 'Order',
                referenceId: order._id
            });
        }

        res.json({
            success: true,
            message: `Pickup completed! Order #${order.orderNumber} is now Active. ${inventoryUpdated} inventory items updated.`,
            pickup,
            order
        });
    } catch (error) {
        next(error);
    }
};
