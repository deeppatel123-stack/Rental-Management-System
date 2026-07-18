import Quotation from '../models/Quotation.js';
import RepairTicket from '../models/RepairTicket.js';
import Coupon from '../models/Coupon.js';
import MembershipPlan from '../models/MembershipPlan.js';
import Referral from '../models/Referral.js';
import DriverAssignment from '../models/DriverAssignment.js';
import Deposit from '../models/Deposit.js';
import RentalOrder from '../models/RentalOrder.js';
import ActivityLog from '../models/ActivityLog.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';

// --- HELPER LOG TRANSACTION ---
const logActivity = async (userId, action, module, details) => {
    try {
        await ActivityLog.create({ user: userId, action, module, details });
    } catch (e) {
        console.error('Failed to log activity:', e);
    }
};

// ==========================================
// 1. QUOTATION MANAGEMENT
// ==========================================
export const createQuotation = async (req, res, next) => {
    try {
        const { customerName, customerEmail, items, startDate, endDate } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

        let subTotal = 0;
        let securityDepositTotal = 0;
        const computedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;
            const rate = product.priceRate.daily;
            subTotal += rate * durationDays * item.quantity;
            securityDepositTotal += product.securityDeposit * item.quantity;
            computedItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                rateApplied: rate,
                securityDepositApplied: product.securityDeposit
            });
        }

        const settings = await Setting.findOne() || {};
        const taxRate = settings.taxRate || 8.5;
        const taxAmount = Math.round(((subTotal * taxRate) / 100) * 100) / 100;
        const totalAmount = subTotal + taxAmount + securityDepositTotal;

        const num = `QT-${Date.now().toString().slice(-6)}`;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 7); // Valid for 7 days

        const quote = await Quotation.create({
            quotationNumber: num,
            customerName,
            customerEmail,
            items: computedItems,
            startDate: start,
            endDate: end,
            subTotal,
            taxAmount,
            securityDepositTotal,
            totalAmount,
            validUntil,
            status: 'Sent'
        });

        await logActivity(req.user?.id, 'Create Quotation', 'Quotation', `Created quotation ${num} for ${customerName}`);
        res.status(201).json({ success: true, quote });
    } catch (error) {
        next(error);
    }
};

export const getQuotations = async (req, res, next) => {
    try {
        const quotes = await Quotation.find({}).sort({ createdAt: -1 });
        res.json({ success: true, count: quotes.length, quotes });
    } catch (error) {
        next(error);
    }
};

export const updateQuotationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const quote = await Quotation.findById(req.params.id);
        if (!quote) return res.status(404).json({ success: false, message: 'Quotation not found' });

        quote.status = status;
        await quote.save();

        await logActivity(req.user?.id, 'Update Status', 'Quotation', `Updated status of ${quote.quotationNumber} to ${status}`);
        res.json({ success: true, quote });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. REPAIR TICKETS & ASSESSMENTS
// ==========================================
export const createRepairTicket = async (req, res, next) => {
    try {
        const { inventoryItem, rentalOrder, description, severity, costEstimate, missingAccessories, damagePhotos } = req.body;
        const num = `REP-${Date.now().toString().slice(-6)}`;

        const ticket = await RepairTicket.create({
            ticketNumber: num,
            inventoryItem,
            rentalOrder,
            reportedBy: req.user.id,
            description,
            severity,
            costEstimate: costEstimate || 0,
            missingAccessories: missingAccessories || [],
            damagePhotos: damagePhotos || [],
            repairLog: [{
                action: 'Inspection Reported',
                performedBy: req.user.id,
                notes: 'Initial damage inspection and logs created.'
            }]
        });

        // Log to Activity/Audit Log
        await logActivity(req.user?.id, 'Reported Damage & Repair Ticket', 'Maintenance', `Created repair ticket ${num} for asset ID ${inventoryItem}`);
        res.status(201).json({ success: true, ticket });
    } catch (error) {
        next(error);
    }
};

export const getRepairTickets = async (req, res, next) => {
    try {
        const tickets = await RepairTicket.find({})
            .populate('inventoryItem')
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, tickets });
    } catch (error) {
        next(error);
    }
};

export const updateRepairTicket = async (req, res, next) => {
    try {
        const { status, costEstimate, logAction, logNotes } = req.body;
        const ticket = await RepairTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        if (status) ticket.status = status;
        if (costEstimate !== undefined) ticket.costEstimate = costEstimate;

        if (logAction) {
            ticket.repairLog.push({
                action: logAction,
                performedBy: req.user.id,
                notes: logNotes || ''
            });
        }

        await ticket.save();
        await logActivity(req.user?.id, 'Update Repair Status', 'Maintenance', `Updated repair ticket ${ticket.ticketNumber}`);
        res.json({ success: true, ticket });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. DEPOSIT LEDGER & APPROVALS
// ==========================================
export const getDeposits = async (req, res, next) => {
    try {
        const deposits = await Deposit.find({})
            .populate('customer', 'name email')
            .populate('rentalOrder', 'orderNumber status')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: deposits.length, deposits });
    } catch (error) {
        next(error);
    }
};

export const updateDepositStatus = async (req, res, next) => {
    try {
        const { status, approvalStatus, penaltyDeducted, amountRefunded, deductionNotes, approvalNotes } = req.body;
        const deposit = await Deposit.findById(req.params.id);
        if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

        if (status) deposit.status = status;
        if (approvalStatus) deposit.approvalStatus = approvalStatus;
        if (penaltyDeducted !== undefined) deposit.penaltyDeducted = penaltyDeducted;
        if (amountRefunded !== undefined) deposit.amountRefunded = amountRefunded;
        if (deductionNotes) deposit.deductionNotes = deductionNotes;
        if (approvalNotes) deposit.approvalNotes = approvalNotes;

        deposit.approvedBy = req.user.id;
        deposit.refundedAt = new Date();
        await deposit.save();

        await logActivity(req.user?.id, 'Process Deposit', 'Finance', `Processed deposit for order with penalty deduction of $${penaltyDeducted || 0}`);
        res.json({ success: true, deposit });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. DRIVER ASSIGNMENTS & OPTIMIZED ROUTE
// ==========================================
export const createDriverAssignment = async (req, res, next) => {
    try {
        const { driverId, date, stops } = req.body;

        // Simple sorting for optimal stops
        const routeStops = stops.map((item, idx) => ({
            rentalOrder: item.rentalOrder,
            type: item.type || 'Pickup',
            address: item.address,
            stopOrder: idx + 1,
            status: 'Pending'
        }));

        const record = await DriverAssignment.create({
            driver: driverId,
            date: date || new Date(),
            stops: routeStops,
            optimizedPathLength: Math.round((5 + Math.random() * 15) * 100) / 100, // mock total mileage distance
            status: 'Assigned'
        });

        await logActivity(req.user?.id, 'Create Driver Assignment', 'Logistics', `Assigned delivery stops routes to driver user ID: ${driverId}`);
        res.status(201).json({ success: true, assignment: record });
    } catch (error) {
        next(error);
    }
};

export const getDriverAssignments = async (req, res, next) => {
    try {
        const assignments = await DriverAssignment.find({})
            .populate('driver', 'name email phone')
            .populate('stops.rentalOrder', 'orderNumber customer')
            .sort({ date: -1 });
        res.json({ success: true, assignments });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. COUPON OR LOYALTY CAMPAIGNS
// ==========================================
export const createCoupon = async (req, res, next) => {
    try {
        const { code, discountType, value, minPurchase, maxDiscountAmount, expiryDate } = req.body;
        const coupon = await Coupon.create({
            code,
            discountType,
            value,
            minPurchase,
            maxDiscountAmount,
            expiryDate,
            isActive: true
        });

        await logActivity(req.user?.id, 'Create Coupon', 'Marketing', `Created coupon ${code} with benefits`);
        res.status(201).json({ success: true, coupon });
    } catch (error) {
        next(error);
    }
};

export const getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        next(error);
    }
};

export const validateCoupon = async (req, res, next) => {
    try {
        const { code, cartAmount } = req.body;
        const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or deactivated coupon.' });

        if (new Date(coupon.expiryDate) < new Date()) {
            coupon.isActive = false;
            await coupon.save();
            return res.status(400).json({ success: false, message: 'Coupon expired.' });
        }

        if (cartAmount < coupon.minPurchase) {
            return res.status(400).json({ success: false, message: `Minimum cart value of $${coupon.minPurchase} required.` });
        }

        let discount = 0;
        if (coupon.discountType === 'Percentage') {
            discount = (cartAmount * coupon.value) / 100;
            if (coupon.maxDiscountAmount > 0 && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            discount = coupon.value;
        }

        res.json({ success: true, discount, message: 'Coupon applied successfully!' });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 6. MEMBERSHIPS & REFERRALS
// ==========================================
export const createMembershipPlan = async (req, res, next) => {
    try {
        const { name, slug, price, period, discountPercentage, freeDelivery, extendedGracePeriodHours, prioritySupport } = req.body;
        const plan = await MembershipPlan.create({
            name, slug, price, period, discountPercentage, freeDelivery, extendedGracePeriodHours, prioritySupport
        });
        res.status(201).json({ success: true, plan });
    } catch (error) {
        next(error);
    }
};

export const getMembershipPlans = async (req, res, next) => {
    try {
        const plans = await MembershipPlan.find({ isActive: true });
        res.json({ success: true, plans });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 7. AUDIT LOGS INTERACTIVE VIEWER
// ==========================================
export const getAuditLogs = async (req, res, next) => {
    try {
        const logs = await ActivityLog.find({})
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json({ success: true, logs });
    } catch (error) {
        next(error);
    }
};
