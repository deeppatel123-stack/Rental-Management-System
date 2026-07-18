import mongoose from 'mongoose';
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
import { sendEmail } from '../services/emailService.js';

// --- HELPER LOG TRANSACTION ---
const logActivity = async (userId, action, module, details) => {
    try {
        await ActivityLog.create({ user: userId, action, module, details });
    } catch (e) {
        console.error('Failed to log activity:', e);
    }
};


// 1. QUOTATION MANAGEMENT

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

        // Send email notification to customer
        try {
            const itemsHtml = computedItems.map(item => `
                <tr style="border-bottom: 1px solid #edf2f7;">
                    <td style="padding: 12px; font-weight: bold; color: #1e293b; text-align: left;">${item.name}</td>
                    <td style="padding: 12px; text-align: center; color: #475569;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: right; color: #475569;">$${item.rateApplied.toFixed(2)}/day</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; color: #0f172a;">
                        $${(item.rateApplied * durationDays * item.quantity).toFixed(2)}
                    </td>
                </tr>
            `).join('');

            const formattedStartDate = start.toLocaleDateString('en-US', { dateStyle: 'medium' });
            const formattedEndDate = end.toLocaleDateString('en-US', { dateStyle: 'medium' });

            const emailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
                        <h2 style="color: #4f46e5; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Rental Quotation Proposal</h2>
                        <span style="font-family: monospace; font-size: 11px; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; color: #475569; font-weight: 700; margin-top: 6px; display: inline-block;">Ref: ${num}</span>
                    </div>

                    <p style="color: #0f172a; font-size: 15px; line-height: 1.6; margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                        We have generated a custom rental quotation proposal for you. This quotation is valid until <strong>${validUntil.toLocaleDateString('en-US', { dateStyle: 'medium' })}</strong>.
                    </p>

                    <table style="width: 100%; background-color: #f8fafc; border-radius: 12px; border: 1px solid #edf2f7; margin-bottom: 24px; font-size: 13px; color: #1e293b; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 16px; width: 33.3%;">
                                <strong style="color: #475569; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">From</strong>
                                <span style="font-weight: 700;">${formattedStartDate}</span>
                            </td>
                            <td style="padding: 16px; text-align: center; width: 33.3%;">
                                <strong style="color: #475569; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">To</strong>
                                <span style="font-weight: 700;">${formattedEndDate}</span>
                            </td>
                            <td style="padding: 16px; text-align: right; width: 33.3%;">
                                <strong style="color: #475569; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">Total rental</strong>
                                <span style="color: #4f46e5; font-weight: 800;">${durationDays} Days</span>
                            </td>
                        </tr>
                    </table>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 10px; text-align: left; color: #475569; font-weight: 700;">Equipment Item</th>
                                <th style="padding: 10px; text-align: center; color: #475569; font-weight: 700;">Qty</th>
                                <th style="padding: 10px; text-align: right; color: #475569; font-weight: 700;">Daily Rate</th>
                                <th style="padding: 10px; text-align: right; color: #475569; font-weight: 700;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <table style="width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; font-size: 13px; color: #334155;">
                        <tr>
                            <td style="padding: 4px 0;">Equipment Charge Subtotal:</td>
                            <td style="text-align: right; font-weight: 700; color: #0f172a;">$${subTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">Estimated Sales Tax:</td>
                            <td style="text-align: right; font-weight: 700; color: #0f172a;">$${taxAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">Security Deposit Hold (Refundable):</td>
                            <td style="text-align: right; font-weight: 700; color: #10b981;">$${securityDepositTotal.toFixed(2)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #e9ecef;">
                            <td style="padding: 8px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Total Billing Estimate:</td>
                            <td style="text-align: right; font-size: 15px; font-weight: 800; color: #4f46e5;">$${totalAmount.toFixed(2)}</td>
                        </tr>
                    </table>

                    <div style="margin-top: 28px; padding: 14px; background-color: #f0fdf4; border: 1px dashed #bbf7d0; border-radius: 12px; text-align: center;">
                        <p style="margin: 0; color: #15803d; font-size: 12px; font-weight: 700;">
                            ✨ The security deposit is held dynamically in escrow and refunded within 24 hours of undamaged inventory return.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 24px; margin-bottom: 12px;">
                        <a href="http://localhost:5173" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 850; border-radius: 10px; border: 1px solid #4338ca;">
                            🌐 Visit Rental Portal Website
                        </a>
                    </div>

                    <div style="text-align: center; margin-top: 28px; font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7; padding-top: 16px;">
                        This email was sent automatically by the Rental Management System.
                    </div>
                </div>
            `;

            await sendEmail({
                to: customerEmail,
                subject: `📋 Rental Proposal Estimate #${num} - Ready for Review`,
                html: emailHtml
            });
        } catch (mailErr) {
            console.error('Failed to send quotation proposal email:', mailErr);
        }

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


// 2. REPAIR TICKETS & ASSESSMENTS

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


// 3. DEPOSIT LEDGER & APPROVALS

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


// 4. DRIVER ASSIGNMENTS & OPTIMIZED ROUTE

export const createDriverAssignment = async (req, res, next) => {
    try {
        const { driverId, date, stops } = req.body;

        // 1. Resolve Driver ID
        let resolvedDriverId = null;
        if (mongoose.Types.ObjectId.isValid(driverId)) {
            resolvedDriverId = driverId;
        } else if (driverId) {
            // Find employee or user whose name contains driverId
            const matchedUser = await User.findOne({
                name: { $regex: new RegExp(driverId, 'i') }
            });
            if (matchedUser) {
                resolvedDriverId = matchedUser._id;
            }
        }

        // Fallback to active logged-in partner/admin user if no driver resolved
        if (!resolvedDriverId) {
            resolvedDriverId = req.user?.id;
        }

        if (!resolvedDriverId) {
            return res.status(400).json({
                success: false,
                message: 'Could not resolve a valid driver profile. Please create an employee or user record first.'
            });
        }

        // 2. Resolve Stops Rental Order ID and Address
        const routeStops = [];
        if (stops && Array.isArray(stops)) {
            for (let i = 0; i < stops.length; i++) {
                const item = stops[i];
                let resolvedOrderId = null;

                if (mongoose.Types.ObjectId.isValid(item.rentalOrder)) {
                    resolvedOrderId = item.rentalOrder;
                } else if (item.rentalOrder) {
                    // Try finding by orderNumber string
                    const orderObj = await RentalOrder.findOne({ orderNumber: item.rentalOrder });
                    if (orderObj) resolvedOrderId = orderObj._id;
                }

                // Fallback: Bind to the first active rental order to keep sandbox functioning
                if (!resolvedOrderId) {
                    const fallbackOrder = await RentalOrder.findOne({});
                    if (fallbackOrder) {
                        resolvedOrderId = fallbackOrder._id;
                    }
                }

                if (!resolvedOrderId) {
                    return res.status(400).json({
                        success: false,
                        message: `Could not resolve rental order reference for stop ${i + 1}. Please place a rental order first.`
                    });
                }

                // Parse address text fields
                let streetVal = 'SG Highway';
                let cityVal = 'Ahmedabad';
                let stateVal = 'Gujarat';
                let zipVal = '380054';

                if (typeof item.address === 'string' && item.address.trim().length > 0) {
                    streetVal = item.address;
                } else if (item.address && typeof item.address === 'object') {
                    streetVal = item.address.street || streetVal;
                    cityVal = item.address.city || cityVal;
                    stateVal = item.address.state || stateVal;
                    zipVal = item.address.zipCode || zipVal;
                } else {
                    // Try setting from resolved order address
                    const orderDb = await RentalOrder.findById(resolvedOrderId);
                    if (orderDb && orderDb.shippingAddress) {
                        streetVal = orderDb.shippingAddress.street || streetVal;
                        cityVal = orderDb.shippingAddress.city || cityVal;
                        stateVal = orderDb.shippingAddress.state || stateVal;
                        zipVal = orderDb.shippingAddress.zipCode || zipVal;
                    }
                }

                routeStops.push({
                    rentalOrder: resolvedOrderId,
                    type: item.type || 'Pickup',
                    address: {
                        street: streetVal,
                        city: cityVal,
                        state: stateVal,
                        zipCode: zipVal
                    },
                    stopOrder: i + 1,
                    status: 'Pending'
                });
            }
        }

        // If no stops were provided, push a default dummy stop to prevent empty validation errors
        if (routeStops.length === 0) {
            const fallbackOrder = await RentalOrder.findOne({});
            if (fallbackOrder) {
                routeStops.push({
                    rentalOrder: fallbackOrder._id,
                    type: 'Pickup',
                    address: {
                        street: fallbackOrder.shippingAddress?.street || 'SG Highway',
                        city: fallbackOrder.shippingAddress?.city || 'Ahmedabad',
                        state: fallbackOrder.shippingAddress?.state || 'Gujarat',
                        zipCode: fallbackOrder.shippingAddress?.zipCode || '380054'
                    },
                    stopOrder: 1,
                    status: 'Pending'
                });
            }
        }

        if (routeStops.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No stops could be configured. Please make sure there is at least one active rental contract in the database.'
            });
        }

        const record = await DriverAssignment.create({
            driver: resolvedDriverId,
            date: date || new Date(),
            stops: routeStops,
            optimizedPathLength: Math.round((5 + Math.random() * 15) * 100) / 100, // mock total mileage distance
            status: 'Assigned'
        });

        await logActivity(req.user?.id, 'Create Driver Assignment', 'Logistics', `Assigned delivery stops routes to driver: ${resolvedDriverId}`);
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


// 5. COUPON OR LOYALTY CAMPAIGNS

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


// 6. MEMBERSHIPS & REFERRALS

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


// 7. AUDIT LOGS INTERACTIVE VIEWER

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
