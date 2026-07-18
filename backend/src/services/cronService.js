import cron from 'node-cron';
import RentalOrder from '../models/RentalOrder.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import Invoice from '../models/Invoice.js';
import Deposit from '../models/Deposit.js';


let ioInstance = null;

export const setSocketIoInstance = (io) => {
    ioInstance = io;
};

export const getIo = () => ioInstance;


export const initCronJob = () => {
    console.log('⏰ Initializing Automatic Late Return Detection Cron Job...');


    cron.schedule('*/2 * * * *', async () => {
        console.log('🔍 [Cron] Scanning for overdue rental returns...');
        try {
            const now = new Date();


            let settings = await Setting.findOne();
            if (!settings) {
                settings = await Setting.create({});
            }


            const overdueOrders = await RentalOrder.find({
                status: { $in: ['Active', 'Picked Up', 'Delivered'] },
                endDate: { $lt: now }
            }).populate('customer');

            for (const order of overdueOrders) {

                const diffMs = now - order.endDate;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));


                const graceMinutes = settings.gracePeriodMinutes || 60;
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                if (diffMinutes <= graceMinutes) continue;


                let lateFee = 0;


                const hourlyRateTotal = order.items.reduce((acc, it) => acc + (it.rateApplied / 24), 0);
                const dailyRateTotal = order.items.reduce((acc, it) => acc + it.rateApplied, 0);

                if (settings.lateFeeChargeType === 'hourly') {
                    lateFee = Math.max(1, diffHours) * hourlyRateTotal * (settings.lateFeeMultiplier || 1.5);
                } else {
                    const diffDays = Math.max(1, Math.ceil(diffHours / 24));
                    lateFee = diffDays * dailyRateTotal * (settings.lateFeeMultiplier || 1.5);
                }


                if (lateFee > settings.maxLateFeeLimit) {
                    lateFee = settings.maxLateFeeLimit;
                }


                lateFee = Math.round(lateFee * 100) / 100;


                if (order.lateFees !== lateFee) {
                    order.lateFees = lateFee;
                    order.totalAmount = order.subTotal + order.taxAmount + order.securityDepositTotal - order.discountAmount + lateFee;

                    await order.save();


                    let penaltyInvoice = await Invoice.findOne({
                        rentalOrder: order._id,
                        invoiceType: 'Overdue Penalty'
                    });

                    if (!penaltyInvoice) {
                        const hex = Math.floor(100000 + Math.random() * 900000);
                        penaltyInvoice = await Invoice.create({
                            invoiceNumber: `INV-PEN-${hex}`,
                            rentalOrder: order._id,
                            customer: order.customer._id,
                            invoiceType: 'Overdue Penalty',
                            subTotal: lateFee,
                            taxAmount: 0,
                            lateFees: lateFee,
                            totalAmount: lateFee,
                            paymentStatus: 'Unpaid'
                        });
                    } else {
                        penaltyInvoice.subTotal = lateFee;
                        penaltyInvoice.lateFees = lateFee;
                        penaltyInvoice.totalAmount = lateFee;
                        await penaltyInvoice.save();
                    }


                    await Notification.create({
                        user: order.customer._id,
                        title: '⚠️ Overdue Rental Alert',
                        message: `Your rental order #${order.orderNumber} is overdue by ${diffHours} hour(s). A late fee penalty of $${lateFee.toFixed(2)} has been charged. Please return it to avoid further fees.`,
                        type: 'LateFee',
                        referenceId: order._id
                    });


                    if (ioInstance) {
                        ioInstance.to(order.customer._id.toString()).emit('notification', {
                            title: '⚠️ Overdue Rental Alert',
                            message: `Your rental order #${order.orderNumber} is overdue. Penalty fee details updated.`
                        });
                    }

                    console.log(`⚡ [Cron] Updated overdue Order #${order.orderNumber}: Added $${lateFee} late fee.`);
                }
            }
        } catch (err) {
            console.error('🚨 Error in Automatic Return Detection Cron:', err.message);
        }
    });
};
