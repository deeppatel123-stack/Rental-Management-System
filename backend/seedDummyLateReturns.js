import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: './.env' });

import User from './src/models/User.js';
import Product from './src/models/Product.js';
import RentalOrder from './src/models/RentalOrder.js';

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        // Find a customer
        const customer = await User.findOne({ role: 'Customer' });
        if (!customer) {
            console.error('No Customer user found in the DB. Please register one first.');
            process.exit(1);
        }
        console.log(`Found Customer: ${customer.name} (${customer._id})`);

        // Find a partner
        const partner = await User.findOne({ role: 'Rental Partner' });
        if (!partner) {
            console.error('No Rental Partner user found in the DB. Please register one first.');
            process.exit(1);
        }
        console.log(`Found Partner: ${partner.name} (${partner._id})`);

        // Find products
        const products = await Product.find({}).limit(5);
        if (products.length === 0) {
            console.error('No products found in DB. Please create a product first.');
            process.exit(1);
        }
        console.log(`Found ${products.length} products to create dummy rentals.`);

        // Clear existing overdue check mock orders if any to avoid clutter
        console.log('Cleaning up previous dummy overdue orders...');
        await RentalOrder.deleteMany({ orderNumber: { $regex: /^ORD-DUMMY-LATE-/ } });

        // Overdue status array items
        const rawOverdueMocks = [
            { daysAgoStart: 10, daysAgoEnd: 3, lateDays: 3, number: '102941' },
            { daysAgoStart: 12, daysAgoEnd: 5, lateDays: 5, number: '838271' },
            { daysAgoStart: 15, daysAgoEnd: 7, lateDays: 7, number: '019385' },
            { daysAgoStart: 8, daysAgoEnd: 2, lateDays: 2, number: '542617' },
            { daysAgoStart: 14, daysAgoEnd: 4, lateDays: 4, number: '662991' }
        ];

        for (let i = 0; i < 5; i++) {
            const mock = rawOverdueMocks[i];
            const prod = products[i % products.length];

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - mock.daysAgoStart);

            const endDate = new Date();
            endDate.setDate(endDate.getDate() - mock.daysAgoEnd);

            const dailyRate = prod.priceRate?.daily || 100;
            const deposit = prod.securityDeposit || 500;
            const qty = 1;
            const subTotal = dailyRate * (mock.daysAgoStart - mock.daysAgoEnd) * qty;

            const order = new RentalOrder({
                orderNumber: `ORD-DUMMY-LATE-${mock.number}`,
                customer: customer._id,
                ownerId: partner._id,
                ownerName: partner.name,
                branchId: prod.branchId || 'BRANCH-MAIN',
                warehouseId: prod.warehouseId || 'WH-MAIN',
                startDate,
                endDate,
                deliveryType: 'Store Pickup',
                subTotal,
                taxAmount: Math.round(subTotal * 0.1 * 100) / 100,
                securityDepositTotal: deposit * qty,
                totalAmount: Math.round(subTotal * 1.1 * 100) / 100 + (deposit * qty),
                status: 'Active', // Active but end date is in the past makes it "Late Return"
                paymentStatus: 'Paid',
                depositStatus: 'Held',
                agreementSigned: true,
                customerSignature: customer.name,
                items: [{
                    product: prod._id,
                    name: prod.name,
                    rateType: 'daily',
                    rateApplied: dailyRate,
                    quantity: qty,
                    securityDepositApplied: deposit
                }],
                timeline: [
                    { status: 'Pending', description: 'Order created initially by customer.' },
                    { status: 'Confirmed', description: 'Booking confirmed by staff.' },
                    { status: 'Active', description: 'Customer completed pickup from store desk.' }
                ]
            });

            await order.save();
            console.log(`Created dummy late order: ${order.orderNumber} (Past deadline by ${mock.lateDays} days)`);
        }

        console.log('Dummy seeding completed successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Error during dummy seeding:', err);
        process.exit(1);
    }
};

seed();
