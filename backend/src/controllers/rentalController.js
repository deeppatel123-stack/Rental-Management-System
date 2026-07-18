import RentalOrder from '../models/RentalOrder.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Deposit from '../models/Deposit.js';
import Pickup from '../models/Pickup.js';
import Return from '../models/Return.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Contract from '../models/Contract.js';
import { triggerEvent } from '../services/eventService.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { generateQRCode } from '../services/qrService.js';
import { getIo } from '../services/cronService.js';

export const createQuotation = async (req, res, next) => {
    try {
        const { items, startDate, endDate } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);


        const diffMs = end - start;
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        let subTotal = 0;
        let securityDepositTotal = 0;
        let taxAmount = 0;
        const computedItems = [];

        const settings = await Setting.findOne() || {};

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });

            const price = product.priceRate.daily * diffDays;
            const itemSubtotal = price * (item.quantity || 1);
            subTotal += itemSubtotal;
            securityDepositTotal += product.securityDeposit * (item.quantity || 1);

            const productTaxRate = product.taxRate !== undefined ? product.taxRate : (settings.taxRate || 8.5);
            taxAmount += (itemSubtotal * productTaxRate) / 100;

            computedItems.push({
                product: product._id,
                name: product.name,
                rateApplied: product.priceRate.daily,
                quantity: item.quantity || 1,
                securityDepositApplied: product.securityDeposit
            });
        }

        taxAmount = Math.round(taxAmount * 100) / 100;
        const totalAmount = subTotal + taxAmount + securityDepositTotal;

        res.json({
            success: true,
            durationDays: diffDays,
            subTotal,
            taxAmount,
            securityDepositTotal,
            totalAmount,
            items: computedItems
        });
    } catch (error) {
        next(error);
    }
};

export const createRentalOrder = async (req, res, next) => {
    try {
        const { items, startDate, endDate, deliveryType, shippingAddress, paymentMethod, couponCode, deliveryFee } = req.body;
        const customerId = req.user.id;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const settings = await Setting.findOne() || {};

        let subTotal = 0;
        let securityDepositTotal = 0;
        let minTaxRate = Infinity;
        const computedItems = [];

        let orderOwnerId = null;
        let orderOwnerName = '';
        let orderBranchId = '';
        let orderWarehouseId = '';

        for (const [index, item] of items.entries()) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });

            if (index === 0) {
                orderOwnerId = product.ownerId;
                orderOwnerName = product.ownerName || 'Partner';
                orderBranchId = product.branchId || 'BRANCH-MAIN';
                orderWarehouseId = product.warehouseId || 'WH-MAIN';
            } else {
                if (product.ownerId && orderOwnerId && product.ownerId.toString() !== orderOwnerId.toString()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Products belong to different rental partners. Create separate rental orders?'
                    });
                }
            }

            if (product.stock.available < (item.quantity || 1)) {
                return res.status(400).json({ success: false, message: `Product '${product.name}' is out of stock!` });
            }


            const availUnits = await Inventory.find({ product: product._id, status: 'Available' }).limit(item.quantity || 1);
            if (availUnits.length < (item.quantity || 1)) {
                return res.status(400).json({ success: false, message: `No active warehouse serials available for product: ${product.name}` });
            }

            const price = product.priceRate.daily * diffDays;
            subTotal += price * (item.quantity || 1);
            securityDepositTotal += product.securityDeposit * (item.quantity || 1);
            const productTaxRate = product.taxRate !== undefined ? product.taxRate : (settings.taxRate || 8.5);
            if (productTaxRate < minTaxRate) {
                minTaxRate = productTaxRate;
            }


            for (const unit of availUnits) {
                unit.status = 'Reserved';
                unit.movementHistory.push({
                    action: 'Reserved',
                    performedBy: customerId,
                    notes: `Reserved for online order execution`
                });
                await unit.save();

                computedItems.push({
                    product: product._id,
                    inventoryItem: unit._id,
                    name: product.name,
                    rateApplied: product.priceRate.daily,
                    quantity: 1,
                    securityDepositApplied: product.securityDeposit
                });
            }


            product.stock.available -= (item.quantity || 1);
            product.stock.reserved += (item.quantity || 1);
        }

        if (minTaxRate === Infinity) {
            minTaxRate = settings.taxRate || 8.5;
        }
        const totalPreDiscountTax = (subTotal * minTaxRate) / 100;

        let discountAmount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (coupon) {
                const now = new Date();
                if (new Date(coupon.expiryDate) >= now && subTotal >= coupon.minPurchase) {
                    if (coupon.discountType === 'Percentage') {
                        discountAmount = (subTotal * coupon.value) / 100;
                        if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
                            discountAmount = coupon.maxDiscountAmount;
                        }
                    } else {
                        discountAmount = coupon.value;
                    }
                    coupon.usesCount += 1;
                    if (coupon.usesCount >= coupon.usageLimit) {
                        coupon.isActive = false;
                    }
                    await coupon.save();
                }
            }
        }

        const discountedSubtotal = Math.max(0, subTotal - discountAmount);
        const taxAmount = subTotal > 0
            ? Math.round(((discountedSubtotal / subTotal) * totalPreDiscountTax) * 100) / 100
            : 0;
        const totalAmount = discountedSubtotal + taxAmount + securityDepositTotal + (Number(deliveryFee) || 0);

        const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
        const rentalOrder = await RentalOrder.create({
            orderNumber: orderNum,
            customer: customerId,
            items: computedItems,
            startDate: start,
            endDate: end,
            deliveryType,
            shippingAddress,
            subTotal,
            taxAmount,
            securityDepositTotal,
            discountAmount,
            deliveryFee: Number(deliveryFee) || 0,
            totalAmount,
            status: 'Pending',
            paymentStatus: 'Unpaid',
            depositStatus: 'Not Collected',
            ownerId: orderOwnerId,
            ownerName: orderOwnerName,
            branchId: orderBranchId,
            warehouseId: orderWarehouseId,
            timeline: [{
                status: 'Pending',
                description: 'Order placed successfully — awaiting partner review and approval.',
                updatedBy: customerId
            }]
        });


        const invoiceNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
        const invoiceObj = await Invoice.create({
            invoiceNumber: invoiceNum,
            rentalOrder: rentalOrder._id,
            customer: customerId,
            subTotal,
            taxAmount,
            discountAmount,
            totalAmount,
            paymentStatus: 'Unpaid'
        });


        invoiceObj.customer = req.user;
        const pdfUrl = await generateInvoicePDF(invoiceObj);
        invoiceObj.pdfUrl = pdfUrl;
        await invoiceObj.save();

        rentalOrder.agreementUrl = pdfUrl;
        await rentalOrder.save();


        const txId = `TX-${Math.floor(10000000 + Math.random() * 90000000)}`;
        await Deposit.create({
            rentalOrder: rentalOrder._id,
            customer: customerId,
            amountHeld: 0,
            status: 'Not Collected',
            depositTransactionId: txId,
            ownerId: orderOwnerId
        });


        await Payment.create({
            rentalOrder: rentalOrder._id,
            invoice: invoiceObj._id,
            customer: customerId,
            amount: totalAmount,
            paymentMethod: paymentMethod || 'Card',
            transactionId: txId,
            status: 'Unpaid',
            ownerId: orderOwnerId
        });


        // Create Contract in Draft status
        const contractNum = `CON-${Math.floor(100000 + Math.random() * 900000)}`;
        const product = rentalOrder.items && rentalOrder.items.length > 0 ? rentalOrder.items[0].product : null;
        await Contract.create({
            contractNumber: contractNum,
            rentalOrderId: rentalOrder._id,
            customerId: customerId,
            ownerId: orderOwnerId,
            product,
            rentalPeriod: {
                startDate: rentalOrder.startDate,
                endDate: rentalOrder.endDate
            },
            securityDeposit: securityDepositTotal,
            status: 'Draft'
        });


        const pointsEarned = Math.floor(subTotal / 10);
        if (pointsEarned > 0) {
            await User.findByIdAndUpdate(customerId, { $inc: { loyaltyPoints: pointsEarned } });
        }

        // Notify all Admin + Employee staff of new order (real-time)
        const io = getIo();
        if (io) {
            const staff = await User.find({ role: { $in: ['Super Admin', 'Rental Partner'] } }).select('_id');
            const productNames = rentalOrder.items.map(it => it.name).join(', ');
            staff.forEach(s => {
                io.to(s._id.toString()).emit('new_order', {
                    orderId: rentalOrder._id,
                    orderNumber: rentalOrder.orderNumber,
                    customerName: req.user?.name || 'A customer',
                    products: productNames,
                    totalAmount: rentalOrder.totalAmount,
                    message: `New rental request #${rentalOrder.orderNumber} — awaiting your confirmation!`
                });
            });
        }

        res.status(201).json({
            success: true,
            message: 'Rental order completed successfully!',
            order: rentalOrder,
            invoiceId: invoiceObj._id,
            pdfUrl
        });
    } catch (error) {
        next(error);
    }
};

export const getRentalOrders = async (req, res, next) => {
    try {
        const query = {};
        if (req.user.role === 'Customer') {
            query.customer = req.user.id;
        } else if (req.user.role === 'Rental Partner') {
            query.ownerId = req.user.id;
        }

        const rawOrders = await RentalOrder.find(query)
            .populate('customer', 'name email phone')
            .populate('items.product', 'images brand category')
            .sort({ createdAt: -1 })
            .lean();

        const orders = await Promise.all(rawOrders.map(async (order) => {
            const pickupDoc = await Pickup.findOne({ rentalOrder: order._id }).select('otp status');
            const returnDoc = await Return.findOne({ rentalOrder: order._id }).select('otp status');
            return {
                ...order,
                pickupId: pickupDoc ? pickupDoc._id : null,
                pickupStatus: pickupDoc ? pickupDoc.status : null,
                pickupOtp: pickupDoc ? pickupDoc.otp : null,
                returnId: returnDoc ? returnDoc._id : null,
                returnStatus: returnDoc ? returnDoc.status : null,
                returnOtp: returnDoc ? returnDoc.otp : null
            };
        }));

        res.json({ success: true, count: orders.length, orders });
    } catch (error) {
        next(error);
    }
};

export const getRentalOrderById = async (req, res, next) => {
    try {
        const order = await RentalOrder.findById(req.params.id)
            .populate('customer', 'name email phone')
            .populate('items.product')
            .populate('items.inventoryItem');

        if (!order) return res.status(404).json({ success: false, message: 'Rental order not found' });

        // Row-Level Security: Customer check
        if (req.user.role === 'Customer' && order.customer.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized profile access' });
        }

        // Row-Level Security: Employee check
        if (req.user.role === 'Rental Partner' && order.ownerId && order.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized staff rental order access' });
        }

        const pickup = await Pickup.findOne({ rentalOrder: order._id });
        const returnData = await Return.findOne({ rentalOrder: order._id });

        res.json({
            success: true,
            order,
            schedules: {
                pickup: pickup || null,
                return: returnData || null
            }
        });
    } catch (error) {
        next(error);
    }
};

export const signAgreement = async (req, res, next) => {
    try {
        const { signature } = req.body;
        const order = await RentalOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Rental order not found' });

        await triggerEvent('ContractSigned', { orderId: order._id, userId: req.user.id, extraData: { signature } });
        await triggerEvent('PaymentCompleted', { orderId: order._id, userId: req.user.id });

        const updated = await RentalOrder.findById(order._id);
        res.json({ success: true, message: 'Agreement e-signed & payments completed successfully!', order: updated });
    } catch (error) {
        next(error);
    }
};

export const requestReturnAction = async (req, res, next) => {
    try {
        const order = await RentalOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Rental order not found' });

        await triggerEvent('ReturnRequested', { orderId: order._id, userId: req.user.id });

        const updated = await RentalOrder.findById(order._id);
        res.json({ success: true, message: 'Return request submitted successfully!', order: updated });
    } catch (error) {
        next(error);
    }
};

// Customer: confirm delivery received (Active → Delivered)
export const confirmDelivery = async (req, res, next) => {
    try {
        const order = await RentalOrder.findById(req.params.id).populate('customer', '_id name');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        // Only the owner can confirm
        if (order.customer._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorised.' });
        }

        if (order.status !== 'Active') {
            return res.status(400).json({ success: false, message: 'Only Active orders can be confirmed as delivered.' });
        }

        order.status = 'Delivered';
        order.timeline.push({
            status: 'Delivered',
            description: 'Customer confirmed delivery received — order settled & closed.',
            updatedBy: req.user.id
        });
        await order.save();

        // Notify all Admin + Employee staff in real-time
        const io = getIo();
        if (io) {
            const staff = await User.find({ role: { $in: ['Super Admin', 'Rental Partner'] } }).select('_id');
            staff.forEach(s => {
                io.to(s._id.toString()).emit('order_status_updated', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    newStatus: 'Delivered',
                    message: `Customer confirmed delivery for order #${order.orderNumber} ✅`
                });
            });
        }

        res.json({ success: true, message: 'Delivery confirmed! Order is now settled & closed.', order });
    } catch (error) {
        next(error);
    }
};

// Customer: delete own order only if still Pending
export const deleteRentalOrder = async (req, res, next) => {
    try {
        const order = await RentalOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        // Only the owner can delete
        if (order.customer.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorised to delete this order.' });
        }

        // Only allow deletion when Pending (not yet confirmed by staff)
        if (order.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Only Pending orders can be cancelled. Please contact staff for assistance.' });
        }

        // Restore inventory reservations back to Available
        for (const item of order.items) {
            if (item.inventoryItem) {
                await Inventory.findByIdAndUpdate(item.inventoryItem, { status: 'Available' });
            }
            // Restore product stock counts
            await Product.findByIdAndUpdate(item.product, {
                $inc: { 'stock.available': item.quantity || 1, 'stock.reserved': -(item.quantity || 1) }
            });
        }

        await RentalOrder.findByIdAndDelete(order._id);

        res.json({ success: true, message: 'Order cancelled and removed successfully.' });
    } catch (error) {
        next(error);
    }
};

// Super Admin/Rental Partner: update order status directly from dropdown
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const ALLOWED = ['Pending', 'Confirmed', 'Ready for Pickup', 'Active', 'Delivered', 'Return Requested', 'Completed', 'Overdue', 'Cancelled'];
        if (!ALLOWED.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ALLOWED.join(', ')}` });
        }

        const order = await RentalOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        // Row-Level Security: Only the owner partner can modify this order.
        if (req.user.role === 'Rental Partner' && order.ownerId && order.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this order' });
        }

        if (status === 'Confirmed') {
            await triggerEvent('RentalApproved', { orderId: order._id, userId: req.user.id });
        } else if (status === 'Ready for Pickup') {
            await triggerEvent('ContractSigned', { orderId: order._id, userId: req.user.id, extraData: { signature: order.customerSignature || 'E-Signed' } });
            await triggerEvent('PaymentCompleted', { orderId: order._id, userId: req.user.id });
        } else if (status === 'Active' || status === 'Delivered') {
            await triggerEvent('PickupCompleted', { orderId: order._id, userId: req.user.id });
        } else if (status === 'Completed') {
            await triggerEvent('ReturnCompleted', { orderId: order._id, userId: req.user.id, extraData: { inspectionData: { overallCondition: 'Excellent' } } });
        } else if (status === 'Cancelled') {
            await triggerEvent('OrderCancelled', { orderId: order._id, userId: req.user.id });
        } else if (status === 'Return Requested') {
            await triggerEvent('ReturnRequested', { orderId: order._id, userId: req.user.id });
        } else {
            order.status = status;
            await order.save();
        }

        const updated = await RentalOrder.findById(order._id);
        res.json({ success: true, message: `Order status updated and dependent modules synchronized.`, order: updated });
    } catch (error) {
        next(error);
    }
};
