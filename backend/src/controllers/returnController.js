import Return from '../models/Return.js';
import RentalOrder from '../models/RentalOrder.js';
import Inventory from '../models/Inventory.js';
import Deposit from '../models/Deposit.js';
import Setting from '../models/Setting.js';
import Invoice from '../models/Invoice.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import RepairTicket from '../models/RepairTicket.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { generateQRCode } from '../services/qrService.js';
import { triggerEvent } from '../services/eventService.js';


// GET ALL RETURNS (role-filtered)

export const getReturns = async (req, res, next) => {
    try {
        const query = {};
        if (req.user.role === 'Customer') {
            query.customer = req.user.id;
        } else if (req.user.role === 'Rental Partner') {
            query.ownerId = req.user.id;
        }

        const returns = await Return.find(query)
            .populate('rentalOrder', 'orderNumber startDate endDate deliveryType status paymentStatus depositStatus totalAmount securityDepositTotal')
            .populate('customer', 'name email phone')
            .populate('assignedEmployee', 'name email phone')
            .populate('assignedExecutiveId', 'name email phone')
            .populate('productId', 'name sku images')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: returns.length, returns });
    } catch (error) {
        next(error);
    }
};


// GET SINGLE RETURN BY ID

export const getReturnById = async (req, res, next) => {
    try {
        const returnDoc = await Return.findById(req.params.id)
            .populate('rentalOrder', 'orderNumber startDate endDate status paymentStatus depositStatus totalAmount securityDepositTotal shippingAddress')
            .populate('customer', 'name email phone')
            .populate('assignedEmployee', 'name email phone')
            .populate('productId', 'name sku images');

        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return not found' });

        // RLS
        if (req.user.role === 'Customer' && returnDoc.customer._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        res.json({ success: true, returnDoc });
    } catch (error) {
        next(error);
    }
};


// ASSIGN RETURN EXECUTIVE

export const assignReturnExecutive = async (req, res, next) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID is required' });

        const returnDoc = await Return.findById(req.params.id).populate('rentalOrder', 'orderNumber status');
        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        // Return can only be processed for Active/Delivered/Return Requested/Overdue orders
        const order = returnDoc.rentalOrder;
        if (order && !['Active', 'Delivered', 'Return Requested', 'Overdue'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Return can only be initiated for Active or Delivered rentals. Current order status: ${order.status}`
            });
        }

        const executive = await User.findById(employeeId).select('name email');

        returnDoc.assignedEmployee = employeeId;
        returnDoc.assignedExecutiveId = employeeId;
        returnDoc.status = 'Assigned';
        returnDoc.timeline.push({
            status: 'Assigned',
            notes: `Return executive assigned: ${executive?.name || employeeId}`,
            updatedBy: req.user.id
        });
        await returnDoc.save();

        // Notify customer
        await Notification.create({
            user: returnDoc.customer,
            title: '🔄 Return Executive Assigned',
            message: `${executive?.name || 'Our executive'} has been assigned to collect your rental return.`,
            type: 'Rental',
            referenceId: returnDoc.rentalOrder._id || returnDoc.rentalOrder
        });

        await ActivityLog.create({
            user: req.user.id,
            action: 'Assign Return Executive',
            module: 'Logistics',
            details: `Assigned ${executive?.name || employeeId} to return for order #${order?.orderNumber || 'unknown'}`
        });

        res.json({ success: true, message: 'Return executive assigned successfully', returnDoc });
    } catch (error) {
        next(error);
    }
};


// SCHEDULE RETURN DATE (generates QR)

export const scheduleReturn = async (req, res, next) => {
    try {
        const { scheduledDate, notes } = req.body;
        if (!scheduledDate) return res.status(400).json({ success: false, message: 'Scheduled date is required' });

        const returnDoc = await Return.findById(req.params.id).populate('rentalOrder', 'orderNumber');
        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        if (['Completed', 'Cancelled'].includes(returnDoc.status)) {
            return res.status(400).json({ success: false, message: 'Cannot reschedule a completed or cancelled return' });
        }

        returnDoc.scheduledDate = new Date(scheduledDate);
        if (notes) returnDoc.notes = notes;
        returnDoc.status = 'Scheduled';

        // Generate QR Code for return verification
        const qrPayload = JSON.stringify({
            type: 'RETURN_QR',
            returnId: returnDoc._id.toString(),
            orderId: returnDoc.rentalOrder._id?.toString() || returnDoc.rentalOrder.toString(),
            otp: returnDoc.otp,
            scheduledDate: returnDoc.scheduledDate.toISOString()
        });
        returnDoc.qrCodeData = await generateQRCode(qrPayload);

        returnDoc.timeline.push({
            status: 'Scheduled',
            notes: `Return scheduled for ${new Date(scheduledDate).toLocaleString()}. QR Code generated. OTP: ${returnDoc.otp}`,
            updatedBy: req.user.id
        });

        await returnDoc.save();

        // Notify customer
        await Notification.create({
            user: returnDoc.customer,
            title: '📅 Return Scheduled',
            message: `Your return is scheduled for ${new Date(scheduledDate).toLocaleString()}. Your Return OTP: ${returnDoc.otp}.`,
            type: 'Rental',
            referenceId: returnDoc.rentalOrder._id || returnDoc.rentalOrder
        });

        res.json({ success: true, message: 'Return scheduled and QR generated successfully!', returnDoc });
    } catch (error) {
        next(error);
    }
};


// UPDATE RETURN STATUS

export const updateReturnStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const ALLOWED_STATUSES = ['Pending', 'Assigned', 'Scheduled', 'On The Way', 'OTP Verified', 'Inspection', 'Damage Review', 'Penalty Calculation', 'Refund Processing', 'Completed', 'Cancelled'];
        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
        }

        const returnDoc = await Return.findById(req.params.id).populate('rentalOrder', 'orderNumber');
        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        returnDoc.status = status;
        returnDoc.timeline.push({
            status,
            notes: notes || `Status changed to ${status}`,
            updatedBy: req.user.id
        });
        await returnDoc.save();

        // Notify customer
        await Notification.create({
            user: returnDoc.customer,
            title: `🔄 Return Status: ${status}`,
            message: notes || `Your return status has been updated to: ${status}`,
            type: 'Rental',
            referenceId: returnDoc.rentalOrder._id || returnDoc.rentalOrder
        });

        res.json({ success: true, message: `Return status updated to ${status}.`, returnDoc });
    } catch (error) {
        next(error);
    }
};


// VERIFY RETURN OTP

export const verifyReturnOtp = async (req, res, next) => {
    try {
        const { otp } = req.body;
        if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

        const returnDoc = await Return.findById(req.params.id);
        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        if (returnDoc.status !== 'On The Way') {
            return res.status(400).json({ success: false, message: 'OTP can only be verified when executive is "On The Way"' });
        }

        if (returnDoc.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid Return OTP. Please ask the customer for the correct code.' });
        }

        returnDoc.isOtpVerified = true;
        returnDoc.status = 'OTP Verified';
        returnDoc.timeline.push({
            status: 'OTP Verified',
            notes: 'Customer return OTP verified successfully. Proceeding to inspection.',
            updatedBy: req.user.id
        });
        await returnDoc.save();

        res.json({ success: true, message: 'Return OTP verified successfully!', returnDoc });
    } catch (error) {
        next(error);
    }
};


// VERIFY RETURN QR CODE

export const verifyReturnQr = async (req, res, next) => {
    try {
        const returnDoc = await Return.findById(req.params.id);
        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        if (returnDoc.status !== 'On The Way') {
            return res.status(400).json({ success: false, message: 'QR can only be scanned when executive is "On The Way"' });
        }

        returnDoc.qrScanned = true;
        returnDoc.isOtpVerified = true;
        returnDoc.status = 'OTP Verified'; // same verification gate
        returnDoc.timeline.push({
            status: 'OTP Verified',
            notes: 'Customer Return QR code scanned and verified.',
            updatedBy: req.user.id
        });
        await returnDoc.save();

        res.json({ success: true, message: 'Return QR code verified successfully!', returnDoc });
    } catch (error) {
        next(error);
    }
};


// START INSPECTION (move to Inspection status)

export const startInspection = async (req, res, next) => {
    try {
        const returnDoc = await Return.findById(req.params.id);
        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        if (!returnDoc.isOtpVerified && !returnDoc.qrScanned) {
            return res.status(400).json({ success: false, message: 'OTP or QR verification is required before starting inspection.' });
        }

        returnDoc.status = 'Inspection';
        returnDoc.timeline.push({
            status: 'Inspection',
            notes: 'Physical inspection of returned items commenced.',
            updatedBy: req.user.id
        });
        await returnDoc.save();

        res.json({ success: true, message: 'Inspection started', returnDoc });
    } catch (error) {
        next(error);
    }
};


// CONFIRM RETURN (full business logic: penalty + deposit + inventory + invoice)

export const confirmReturn = async (req, res, next) => {
    try {
        const { checklist, notes, overallCondition, customerSignature } = req.body;

        const returnDoc = await Return.findById(req.params.id).populate('rentalOrder');
        if (!returnDoc) return res.status(404).json({ success: false, message: 'Return record not found' });

        // RLS
        if (req.user.role === 'Rental Partner' && returnDoc.ownerId && returnDoc.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized partner access' });
        }

        if (!returnDoc.isOtpVerified && !returnDoc.qrScanned) {
            returnDoc.isOtpVerified = true;
        }

        const order = await RentalOrder.findById(returnDoc.rentalOrder._id || returnDoc.rentalOrder);
        if (!order) return res.status(404).json({ success: false, message: 'Associated rental order not found' });

        const settings = await Setting.findOne() || {};
        const now = new Date();

        returnDoc.actualReturnDate = now;
        if (checklist && checklist.length > 0) returnDoc.checklist = checklist;
        if (notes) returnDoc.notes = notes;
        if (overallCondition) returnDoc.overallCondition = overallCondition;
        if (customerSignature) returnDoc.customerSignature = customerSignature;

        // ── 1. LATE RETURN PENALTY ENGINE ──
        let isLate = false;
        let lateHours = 0;
        let lateFee = 0;

        if (now > order.endDate) {
            isLate = true;
            const diffMs = now - order.endDate;
            lateHours = Math.floor(diffMs / (1000 * 60 * 60));

            const gracePeriodMinutes = settings.gracePeriodMinutes || 60;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));

            if (diffMinutes > gracePeriodMinutes) {
                // Calculate daily penalty total based on product.penaltyAmount
                let orderDailyPenalty = 0;
                for (const it of order.items) {
                    const prodObj = await Product.findById(it.product);
                    if (prodObj) {
                        orderDailyPenalty += (prodObj.penaltyAmount || 0) * (it.quantity || 1);
                    }
                }

                // Fallback to dailyRateTotal * lateFeeMultiplier if penaltyAmount is not defined
                if (orderDailyPenalty === 0) {
                    const dailyRateTotal = order.items.reduce((acc, it) => acc + (it.rateApplied || 0), 0);
                    orderDailyPenalty = dailyRateTotal * (settings.lateFeeMultiplier || 1.5);
                }

                const diffDays = Math.max(1, Math.ceil(lateHours / 24));
                lateFee = diffDays * orderDailyPenalty;

                if (settings.maxLateFeeLimit && lateFee > settings.maxLateFeeLimit) {
                    lateFee = settings.maxLateFeeLimit;
                }
                lateFee = Math.round(lateFee * 100) / 100;
            }
        }

        // Verify that if lateFee is calculated, it matches paid penalty record
        if (isLate && lateFee > 0) {
            const penaltyPayment = await Payment.findOne({
                rentalOrder: order._id,
                purpose: 'Late Return Penalty',
                status: 'Completed'
            });
            if (!penaltyPayment) {
                return res.status(400).json({
                    success: false,
                    errorType: 'OUTSTANDING_PENALTY',
                    message: `Customer has an outstanding late return penalty of $${lateFee.toFixed(2)}. Make them pay first before finalizing return.`,
                    lateFee
                });
            }
        }

        returnDoc.isLateReturn = isLate;
        returnDoc.lateDurationHours = lateHours;
        returnDoc.calculatedLateFee = lateFee;

        // ── 2. DAMAGE / LOST VALUATION ENGINE ──
        let totalDamageCost = 0;
        let requiresRepair = false;
        const checklistData = checklist || returnDoc.checklist || [];

        checklistData.forEach(item => {
            if (['Damaged', 'Missing Accessories', 'Lost'].includes(item.status)) {
                totalDamageCost += item.damageCost || 0;
                if (item.status === 'Damaged') requiresRepair = true;
            }
        });

        returnDoc.requiresRepair = requiresRepair;
        returnDoc.repairCostTotal = totalDamageCost;

        // Timeline updates for return record
        returnDoc.timeline.push({ status: 'Damage Review', notes: `Damage assessment complete. Total: $${totalDamageCost}`, updatedBy: req.user.id });
        returnDoc.timeline.push({ status: 'Penalty Calculation', notes: `Late fee: $${lateFee.toFixed(2)} (${lateHours}hrs late)`, updatedBy: req.user.id });
        returnDoc.timeline.push({ status: 'Refund Processing', notes: 'Calculating deposit refund...', updatedBy: req.user.id });

        const penaltyTotal = lateFee + totalDamageCost;
        const refundAmount = Math.max(0, order.securityDepositTotal - penaltyTotal);

        returnDoc.depositRefundAmount = refundAmount;
        returnDoc.depositDeductionAmount = Math.min(order.securityDepositTotal, penaltyTotal);

        returnDoc.status = 'Completed';
        returnDoc.timeline.push({
            status: 'Completed',
            notes: `Return fully settled via Event system. Late fee: $${lateFee.toFixed(2)}, Damage: $${totalDamageCost.toFixed(2)}, Penalty total: $${penaltyTotal.toFixed(2)}`,
            updatedBy: req.user.id
        });
        await returnDoc.save();

        // ── 3. EXECUTE EVENT TRANSITION ──
        // This will update the Master RentalOrder status, Timeline, Inventory available/maintenance stock counters,
        // update Deposit balances, trigger Penalty Invoices, create RepairTickets, and send notifications.
        const inspectionData = {
            isLateReturn: isLate,
            lateHours,
            lateFeeCalculated: lateFee,
            requiresRepair,
            repairCost: totalDamageCost,
            overallCondition: overallCondition || 'Excellent',
            checkListResults: checklistData
        };

        await triggerEvent('ReturnCompleted', {
            orderId: order._id,
            userId: req.user.id,
            extraData: { inspectionData }
        });

        await ActivityLog.create({
            user: req.user.id,
            action: 'Confirm Return',
            module: 'Logistics',
            details: `Return completed for Order #${order.orderNumber}. Late fee: $${lateFee.toFixed(2)}, Damage: $${totalDamageCost.toFixed(2)}`
        });

        const updatedOrder = await RentalOrder.findById(order._id);
        res.json({
            success: true,
            message: `Return completed for Order #${order.orderNumber}. Penalty: $${penaltyTotal.toFixed(2)}.`,
            returnDoc,
            order: updatedOrder,
            summary: {
                lateFee,
                damageCost: totalDamageCost,
                penaltyTotal,
                depositRefund: refundAmount
            }
        });
    } catch (error) {
        next(error);
    }
};
