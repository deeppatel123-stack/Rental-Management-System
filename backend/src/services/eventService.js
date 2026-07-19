import RentalOrder from '../models/RentalOrder.js';
import Contract from '../models/Contract.js';
import Payment from '../models/Payment.js';
import Deposit from '../models/Deposit.js';
import Invoice from '../models/Invoice.js';
import Pickup from '../models/Pickup.js';
import Return from '../models/Return.js';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import RepairTicket from '../models/RepairTicket.js';
import { getIo } from './cronService.js';
import { generateInvoicePDF } from './pdfService.js';

// Send Real-time notification and persist to DB
export const sendNotification = async (userId, title, message, type = 'Rental', referenceId = null) => {
    try {
        const notif = await Notification.create({
            user: userId,
            title,
            message,
            type,
            referenceId
        });
        const io = getIo();
        if (io) {
            io.to(userId.toString()).emit('notification_received', notif);
        }
        return notif;
    } catch (err) {
        console.error('Error sending notification:', err);
    }
};

// Notify specific roles (e.g. Super Admin, Partner)
export const broadcastNotification = async (roles, title, message, type = 'Rental', referenceId = null) => {
    try {
        const users = await User.find({ role: { $in: roles } }).select('_id');
        for (const user of users) {
            await sendNotification(user._id, title, message, type, referenceId);
        }
    } catch (err) {
        console.error('Broadcast failed:', err);
    }
};

// Central Event System orchestrator
export const triggerEvent = async (eventName, payload) => {
    console.log(`[EVENT SYSTEM] Event received: ${eventName}`, payload);
    const { orderId, userId, extraData } = payload;

    try {
        const order = await RentalOrder.findById(orderId).populate('customer');
        if (!order) {
            console.error(`Order not found: ${orderId}`);
            return;
        }

        const io = getIo();

        switch (eventName) {
            case 'RentalApproved': {
                // Change status to Approved
                order.status = 'Confirmed'; // Backwards compatibility for Confirm API but enterprise Approved
                order.timeline.push({
                    status: 'Approved',
                    description: 'Your rental order has been approved by the partner. Contract is now generated.',
                    updatedBy: userId
                });
                await order.save();

                // 1. Auto-generate contract
                const contractNum = `CON-${Math.floor(100000 + Math.random() * 900000)}`;
                const product = order.items && order.items.length > 0 ? order.items[0].product : null;

                await Contract.create({
                    contractNumber: contractNum,
                    rentalOrderId: order._id,
                    customerId: order.customer._id,
                    ownerId: order.ownerId,
                    product,
                    rentalPeriod: {
                        startDate: order.startDate,
                        endDate: order.endDate
                    },
                    securityDeposit: order.securityDepositTotal,
                    status: 'Generated'
                });

                // Update order contract indicator
                order.status = 'Confirmed'; // compatible
                await order.save();

                // Auto-create Pickup record so it goes into logistics pickup
                const existingPickup = await Pickup.findOne({ rentalOrder: order._id });
                if (!existingPickup) {
                    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    const pickupChecklist = order.items.map(it => ({
                        productName: it.name,
                        serialNumber: '',
                        isVerified: false
                    }));

                    await Pickup.create({
                        rentalOrder: order._id,
                        customer: order.customer._id,
                        productId: order.items[0]?.product,
                        scheduledDate: order.startDate,
                        checklist: pickupChecklist,
                        otp: pickupOtp,
                        status: 'Pending',
                        ownerId: order.ownerId,
                        timeline: [{
                            status: 'Pending',
                            notes: 'Pickup request generated automatically after operator activation.'
                        }]
                    });
                }

                // 2. Notify Customer & Admin
                await sendNotification(
                    order.customer._id,
                    'Action Required: Rental Approved',
                    `Order #${order.orderNumber} is approved! Please check, sign the contract agreement, and proceed.`,
                    'Rental',
                    order._id
                );
                await broadcastNotification(
                    ['Super Admin'],
                    'Rental Order Approved',
                    `Rental order #${order.orderNumber} was approved. Contract generated.`,
                    'Rental',
                    order._id
                );

                if (io) {
                    io.emit('order_refreshed', { orderId: order._id, status: 'Confirmed' });
                }
                break;
            }

            case 'ContractSigned': {
                const { signature } = extraData || {};

                // Update Contract status to Signed
                const contract = await Contract.findOne({ rentalOrderId: order._id });
                if (contract) {
                    contract.status = 'Signed';
                    contract.digitalSignature = signature || 'E-Signed';
                    await contract.save();
                }

                // Update Order status
                order.status = 'Confirmed'; // Compatible while we proceed to payment
                order.agreementSigned = true;
                order.customerSignature = signature || 'E-Signed';
                order.timeline.push({
                    status: 'Contract Signed',
                    description: `Contract signed digitally by customer (${signature || 'E-Signed'}).`,
                    updatedBy: userId
                });
                await order.save();

                // Notify Partner
                await sendNotification(
                    order.ownerId,
                    'Contract Signed',
                    `Contract for Order #${order.orderNumber} was signed by the customer. Payment is now pending.`,
                    'Rental',
                    order._id
                );

                // Trigger payment pending check (since online card check is auto done at checkout, this usually auto clears or moves to next step)
                if (io) {
                    io.emit('order_refreshed', { orderId: order._id, status: 'Confirmed' });
                }
                break;
            }

            case 'PaymentCompleted': {
                // If payment is successful (this is the rental fee booking payment)
                order.paymentStatus = 'Paid';
                // depositStatus remains 'Not Collected' until paid separately
                order.timeline.push({
                    status: 'Paid',
                    description: 'Rental booking fee payment confirmed. Security deposit hold payment is now pending to unlock pickup OTP.',
                    updatedBy: userId
                });
                await order.save();

                // Notify Customer
                await sendNotification(
                    order.customer._id,
                    'Rental Fee Paid Successfully',
                    `Payment of $${order.totalAmount} received for order #${order.orderNumber}! Please pay the security deposit of $${order.securityDepositTotal} to unlock your pickup OTP.`,
                    'Rental',
                    order._id
                );

                if (io) {
                    io.emit('order_refreshed', { orderId: order._id });
                }
                break;
            }

            case 'DepositHeld': {
                // If deposit hold payment is successful
                order.depositStatus = 'Held';
                order.status = 'Ready for Pickup';

                // Update Deposit record in DB to show actual deposit held
                const depositObj = await Deposit.findOne({ rentalOrder: order._id });
                if (depositObj) {
                    depositObj.amountHeld = order.securityDepositTotal;
                    depositObj.status = 'Held';
                    await depositObj.save();
                }

                // Add timeline entry
                order.timeline.push({
                    status: 'Ready for Pickup',
                    description: `Security deposit of $${order.securityDepositTotal} received & held. Order is ready for pickup!`,
                    updatedBy: userId
                });
                await order.save();

                // Let's resolve ownerId if not directly set
                let orderOwnerId = order.ownerId;
                if (!orderOwnerId && order.items && order.items.length > 0) {
                    const firstProduct = await Product.findById(order.items[0].product);
                    if (firstProduct) {
                        orderOwnerId = firstProduct.ownerId;
                    }
                }

                // Let's create payment record for deposit
                const invoiceObj = await Invoice.findOne({ rentalOrder: order._id });
                await Payment.create({
                    rentalOrder: order._id,
                    invoice: invoiceObj ? invoiceObj._id : null,
                    customer: order.customer._id,
                    amount: order.securityDepositTotal,
                    paymentMethod: 'Card',
                    transactionId: `DEP-${Math.floor(10000000 + Math.random() * 90000000)}`,
                    status: 'Completed',
                    ownerId: orderOwnerId,
                    purpose: 'Security Deposit'
                });

                // Auto-create Pickup record
                const existingPickup = await Pickup.findOne({ rentalOrder: order._id });
                if (!existingPickup) {
                    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    const pickupChecklist = order.items.map(it => ({
                        productName: it.name,
                        serialNumber: '',
                        isVerified: false
                    }));

                    await Pickup.create({
                        rentalOrder: order._id,
                        customer: order.customer._id,
                        productId: order.items[0]?.product,
                        scheduledDate: order.startDate,
                        checklist: pickupChecklist,
                        otp: pickupOtp,
                        status: 'Pending',
                        ownerId: orderOwnerId,
                        timeline: [{
                            status: 'Pending',
                            notes: 'Pickup request generated automatically after deposit hold confirmation.'
                        }]
                    });
                }

                // Notify Customer
                await sendNotification(
                    order.customer._id,
                    'Security Deposit Held',
                    `Security deposit of $${order.securityDepositTotal} has been successfully paid & held. Pickup OTP is now unlocked!`,
                    'Deposit',
                    order._id
                );

                if (io) {
                    io.emit('order_refreshed', { orderId: order._id });
                }
                break;
            }

            case 'PickupCompleted': {
                // Update Order status to Delivered
                order.status = 'Delivered';
                order.timeline.push({
                    status: 'Delivered',
                    description: 'Handover complete! Item delivered successfully and rental period commenced.',
                    updatedBy: userId
                });
                await order.save();

                // Synchronize Stock: Available --, Rented ++ for each item
                for (const item of order.items) {
                    const productObj = await Product.findById(item.product);
                    if (productObj) {
                        // Deduct from reserved (which was deducted on checkout) or adjust stock
                        productObj.stock.reserved = Math.max(0, productObj.stock.reserved - 1);
                        productObj.stock.rented += 1;
                        await productObj.save();
                    }

                    if (item.inventoryItem) {
                        const invUnit = await Inventory.findById(item.inventoryItem);
                        if (invUnit) {
                            invUnit.status = 'Rented';
                            invUnit.movementHistory.push({
                                action: 'Handover Completed',
                                performedBy: userId,
                                notes: `Rented in active rental agreement #${order.orderNumber}`
                            });
                            await invUnit.save();
                        }
                    }
                }

                // Send notification
                await sendNotification(
                    order.customer._id,
                    'Rental Commenced',
                    `Your items for Order #${order.orderNumber} are picked up. Rental is now active!`,
                    'Rental',
                    order._id
                );

                if (io) {
                    io.emit('order_refreshed', { orderId: order._id, status: 'Delivered' });
                }
                break;
            }

            case 'ReturnRequested': {
                // Update Order status
                order.status = 'Return Requested';
                order.timeline.push({
                    status: 'Return Requested',
                    description: 'Return request submitted by customer. Awaiting pickup assignment.',
                    updatedBy: userId
                });
                await order.save();

                // Auto-create Return record if not exists
                const existingReturn = await Return.findOne({ rentalOrder: order._id });
                if (!existingReturn) {
                    const returnOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    const returnChecklist = order.items.map(it => ({
                        productName: it.name,
                        serialNumber: '',
                        status: 'Returned',
                        conditionRating: 'Excellent'
                    }));

                    await Return.create({
                        rentalOrder: order._id,
                        customer: order.customer._id,
                        productId: order.items[0]?.product,
                        scheduledDate: order.endDate,
                        checklist: returnChecklist,
                        otp: returnOtp,
                        status: 'Pending',
                        ownerId: order.ownerId,
                        timeline: [{
                            status: 'Pending',
                            notes: 'Return item record initialized automatically after request.'
                        }]
                    });
                }

                // Notify Partner
                await sendNotification(
                    order.ownerId,
                    'Return Requested',
                    `Return has been requested for Active Rental Order #${order.orderNumber}.`,
                    'Rental',
                    order._id
                );

                if (io) {
                    io.emit('order_refreshed', { orderId: order._id, status: 'Return Requested' });
                }
                break;
            }
            case 'ReturnCompleted': {
                const { inspectionData } = extraData || {};

                // Update Order status to Completed
                order.status = 'Completed';
                order.actualReturnDate = new Date();

                const { isLateReturn, lateHours, lateFeeCalculated, requiresRepair, repairCost, overallCondition, checkListResults } = inspectionData || {};

                // Process inventory updates based on return checklist
                for (const item of order.items) {
                    const productObj = await Product.findById(item.product);
                    if (productObj) {
                        productObj.stock.rented = Math.max(0, productObj.stock.rented - 1);

                        // Condition mapping:
                        if (overallCondition === 'Damaged' || requiresRepair) {
                            productObj.stock.maintenance += 1;
                        } else if (overallCondition === 'Lost') {
                            productObj.stock.lost = (productObj.stock.lost || 0) + 1;
                        } else {
                            productObj.stock.available += 1;
                        }
                        await productObj.save();
                    }

                    if (item.inventoryItem) {
                        const invUnit = await Inventory.findById(item.inventoryItem);
                        if (invUnit) {
                            if (overallCondition === 'Damaged' || requiresRepair) {
                                invUnit.status = 'Maintenance';
                            } else if (overallCondition === 'Lost') {
                                invUnit.status = 'Lost';
                            } else {
                                invUnit.status = 'Available';
                            }
                            invUnit.movementHistory.push({
                                action: 'Returned From Rental',
                                performedBy: userId,
                                notes: `Returned. Inspection condition: ${overallCondition || 'Excellent'}. Rental order #${order.orderNumber}`
                            });
                            await invUnit.save();

                            // Generate Repair Ticket if unit is damaged
                            if (overallCondition === 'Damaged' || requiresRepair) {
                                const ticketNum = `TKT-${Date.now().toString().slice(-7)}`;
                                await RepairTicket.create({
                                    ticketNumber: ticketNum,
                                    inventoryItem: invUnit._id,
                                    rentalOrder: order._id,
                                    reportedBy: userId,
                                    description: 'Returned damaged during inspection checks.',
                                    costEstimate: repairCost || 0,
                                    status: 'Inspection',
                                    severity: (repairCost || 0) > 5000 ? 'Critical' : (repairCost || 0) > 1000 ? 'High' : 'Medium'
                                });
                            }
                        }
                    }
                }

                // Manage deposit refund settlement
                // Because late return penalty must have already been paid before confirming return,
                // the deposit refund should be the full securityDepositTotal, minus only the repair cost (if any)
                let repairCostTotal = requiresRepair ? (repairCost || 0) : 0;
                const refundAmount = Math.max(0, order.securityDepositTotal - repairCostTotal);

                if (repairCostTotal > 0) {
                    order.depositStatus = refundAmount > 0 ? 'Partially Refunded' : 'Deducted/Settled';
                } else {
                    order.depositStatus = 'Refunded';
                }

                order.timeline.push({
                    status: 'Completed',
                    description: `Return processed. Security Deposit of $${order.securityDepositTotal} refunded: $${refundAmount.toFixed(2)} (Deductions: $${repairCostTotal.toFixed(2)}).`,
                    updatedBy: userId
                });
                await order.save();

                // Update Deposit document
                const depositObj = await Deposit.findOne({ rentalOrder: order._id });
                if (depositObj) {
                    depositObj.status = refundAmount > 0 ? 'Partially Refunded' : 'Refunded';
                    depositObj.amountRefunded = refundAmount;
                    depositObj.refundDate = new Date();
                    await depositObj.save();
                }

                // Generate Penalty Invoice if penalty fees exist
                const penaltyTotal = (lateFeeCalculated || 0) + (repairCost || 0);
                if (penaltyTotal > 0) {
                    const hex = Math.floor(1000 + Date.now() % 9000);
                    await Invoice.create({
                        invoiceNumber: `INV-PEN-${hex}`,
                        rentalOrder: order._id,
                        customer: order.customer._id,
                        invoiceType: 'Overdue Penalty',
                        subTotal: penaltyTotal,
                        taxAmount: 0,
                        lateFees: lateFeeCalculated || 0,
                        repairFees: repairCost || 0,
                        totalAmount: penaltyTotal,
                        paymentStatus: 'Paid'
                    });
                }

                // Notify Customer
                await sendNotification(
                    order.customer._id,
                    'Return Processed & Refund Handled',
                    `Return inspection completed for Order #${order.orderNumber}. Late Fees: $${(lateFeeCalculated || 0).toFixed(2)}, Repair charges: $${(repairCost || 0).toFixed(2)}. Refunded to account: $${refundAmount.toFixed(2)}.`,
                    'Deposit',
                    order._id
                );

                if (io) {
                    io.emit('order_refreshed', { orderId: order._id, status: 'Completed' });
                }
                break;
            }

            case 'OrderCancelled': {
                order.status = 'Cancelled';
                order.paymentStatus = 'Refunded';
                order.depositStatus = 'Refunded';

                order.timeline.push({
                    status: 'Cancelled',
                    description: 'Order has been cancelled. Funds released/refunded.',
                    updatedBy: userId
                });
                await order.save();

                // Release Reserved items back to Available
                for (const item of order.items) {
                    const productObj = await Product.findById(item.product);
                    if (productObj) {
                        productObj.stock.reserved = Math.max(0, productObj.stock.reserved - 1);
                        productObj.stock.available += 1;
                        await productObj.save();
                    }

                    if (item.inventoryItem) {
                        const invUnit = await Inventory.findById(item.inventoryItem);
                        if (invUnit) {
                            invUnit.status = 'Available';
                            invUnit.movementHistory.push({
                                action: 'Reservation Cancelled',
                                performedBy: userId,
                                notes: `Reservation cancelled for order #${order.orderNumber}`
                            });
                            await invUnit.save();
                        }
                    }
                }

                // Update Contract (Expired/Cancelled)
                const contract = await Contract.findOne({ rentalOrderId: order._id });
                if (contract) {
                    contract.status = 'Expired';
                    await contract.save();
                }

                // Notify
                await sendNotification(
                    order.customer._id,
                    'Order Cancelled',
                    `Your rental order #${order.orderNumber} was cancelled and refunds initiated.`,
                    'Rental',
                    order._id
                );

                if (io) {
                    io.emit('order_refreshed', { orderId: order._id, status: 'Cancelled' });
                }
                break;
            }

            default:
                console.warn(`[EVENT SYSTEM] Unhandled event name: ${eventName}`);
                break;
        }
    } catch (err) {
        console.error(`[EVENT SYSTEM ERROR] Failed processing event: ${eventName}`, err);
    }
};
