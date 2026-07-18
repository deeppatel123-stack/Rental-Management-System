import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Setting from '../models/Setting.js';
import Wishlist from '../models/Wishlist.js';
import { generateQRCode } from '../services/qrService.js';

dotenv.config();

const usersSeed = [
    {
        name: 'Sarah Connor',
        email: 'admin@rental.com',
        password: 'password123',
        role: 'Super Admin',
        phone: '+1 555-0199',
        isVerified: true
    },
    {
        name: 'John Doe',
        email: 'employee@rental.com',
        password: 'password123',
        role: 'Rental Partner',
        phone: '+1 555-0188',
        isVerified: true
    },
    {
        name: 'Alice Smith',
        email: 'customer@rental.com',
        password: 'password123',
        role: 'Customer',
        phone: '+1 555-0177',
        isVerified: true,
        loyaltyPoints: 120,
        addresses: [
            {
                street: '742 Evergreen Terrace',
                city: 'Springfield',
                state: 'IL',
                zipCode: '62704',
                country: 'USA',
                isDefault: true
            }
        ]
    }
];

const productsSeed = [
    {
        name: 'Sony FX3 Cinema Camera',
        sku: 'SONY-FX3',
        category: 'Cameras',
        brand: 'Sony',
        manufacturer: 'Sony Electronics',
        description: 'Compact cinema line camera with outstanding Full Frame performance, high sensitivity, and standard workflow integrations.',
        priceRate: {
            hourly: 15,
            daily: 75,
            weekly: 400,
            monthly: 1200
        },
        securityDeposit: 150,
        depositType: 'Fixed',
        stock: { total: 5, available: 5, reserved: 0, maintenance: 0, damaged: 0 },
        specifications: [
            { key: 'Sensor', value: '35mm Full Frame CMOS' },
            { key: 'Resolution', value: '12.1 Megapixels' },
            { key: 'ISO Range', value: '80 - 409600' }
        ],
        accessories: ['Battery pack NP-FZ100', 'Battery charger BC-QZ1', 'XLR handle unit', 'Body cap'],
        images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600']
    },
    {
        name: 'DJI Ronin 4D 4-Axis Gimbal DSLR',
        sku: 'DJI-R4D',
        category: 'Gimbals',
        brand: 'DJI',
        manufacturer: 'DJI Innovations',
        description: 'Integrated cinema camera stabilization setup featuring active vertical axis control, lidar focusing, and wireless streaming transmission.',
        priceRate: {
            hourly: 25,
            daily: 120,
            weekly: 650,
            monthly: 2200
        },
        securityDeposit: 250,
        depositType: 'Fixed',
        stock: { total: 3, available: 3, reserved: 0, maintenance: 0, damaged: 0 },
        specifications: [
            { key: 'Axes', value: '4-Axis Active Stabilization' },
            { key: 'Payload Capacity', value: '8.8 lbs / 4 kg' },
            { key: 'Focusing', value: 'LiDAR range finder system' }
        ],
        accessories: ['Zenmuse X9 gimbal', 'LiDAR Range Finder', 'Hand Grips', 'High-Bright Remote Monitor'],
        images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600']
    },
    {
        name: 'MacBook Pro 16" M3 Max',
        sku: 'APL-MBP3M',
        category: 'Laptops',
        brand: 'Apple',
        manufacturer: 'Apple Inc.',
        description: 'Powerhouse workhorse machine for visual editing, render encoding, and extreme database development operations.',
        priceRate: {
            hourly: 10,
            daily: 60,
            weekly: 300,
            monthly: 1000
        },
        securityDeposit: 200,
        depositType: 'Fixed',
        stock: { total: 4, available: 4, reserved: 0, maintenance: 0, damaged: 0 },
        specifications: [
            { key: 'CPU', value: '16-Core Apple M3 Max' },
            { key: 'RAM', value: '48GB Unified Memory' },
            { key: 'Storage', value: '1TB Superfast SSD' }
        ],
        accessories: ['140W USB-C Charger', 'MagSafe 3 Braided Cable'],
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600']
    },
    {
        name: 'Sennheiser Ambeo Soundbar Max',
        sku: 'SENN-AMB-MAX',
        category: 'Audio',
        brand: 'Sennheiser',
        manufacturer: 'Sennheiser Electronic',
        description: 'Premium absolute high end surround sound stage bar, featuring deep bass drops and outstanding room acoustics calibration.',
        priceRate: {
            hourly: 12,
            daily: 50,
            weekly: 250,
            monthly: 800
        },
        securityDeposit: 100,
        depositType: 'Fixed',
        stock: { total: 6, available: 6, reserved: 0, maintenance: 0, damaged: 0 },
        specifications: [
            { key: 'Channels', value: '5.1.4 Speakers layout' },
            { key: 'Frequency Response', value: '30 Hz - 20 kHz' },
            { key: 'Drivers count', value: '13 high-end drivers' }
        ],
        accessories: ['Calibration microphone', 'Remote Controller', 'HDMI Cable'],
        images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600']
    }
];

const seedAll = async () => {
    try {
        let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rental_system';
        if (typeof uri === 'string' && uri.startsWith("'") && uri.endsWith("'")) {
            uri = uri.slice(1, -1);
        }
        if (typeof uri === 'string' && uri.startsWith('"') && uri.endsWith('"')) {
            uri = uri.slice(1, -1);
        }
        await mongoose.connect(uri);
        console.log('📡 Connected to MongoDB for seeding...');


        // Clean database collections without dropping database (bypasses Atlas cluster privileges limits)
        await User.deleteMany({});
        await Product.deleteMany({});
        await Inventory.deleteMany({});
        await Setting.deleteMany({});
        await Wishlist.deleteMany({});

        console.log('🧹 Cleaned database collections.');


        await Setting.create({
            orgName: 'Rental Inc.',
            currency: 'USD',
            timezone: 'UTC',
            taxRate: 8,
            gracePeriodMinutes: 30,
            lateFeeChargeType: 'daily',
            lateFeeMultiplier: 1.5,
            maxLateFeeLimit: 600,
            rentalPolicy: 'Renters must verify items condition upon receipt. Return checklist must match pickup condition report to avoid security hold claims.'
        });
        console.log('⚙️ Seeded system default settings config.');


        const createdUsers = [];
        for (const u of usersSeed) {
            const newUser = await User.create(u);
            createdUsers.push(newUser);

            if (newUser.role === 'Customer') {
                await Wishlist.create({ customer: newUser._id, products: [] });
            }
        }
        console.log('👤 Seeded users tables successfully (sarah Connor, John Doe, alice Smith). Password: password123');


        const partnerUser = createdUsers.find(u => u.role === 'Rental Partner');

        for (const p of productsSeed) {
            p.ownerId = partnerUser._id;
            p.ownerName = partnerUser.name;
            p.ownerCode = 'PARTNER-' + partnerUser._id.toString().slice(-4);
            p.addedBy = partnerUser._id;

            const newProduct = await Product.create(p);

            const appQr = await generateQRCode(`RMS-PROD-${newProduct._id}`);
            newProduct.qrCode = appQr;
            newProduct.barcode = newProduct.sku;
            await newProduct.save();


            for (let i = 0; i < newProduct.stock.total; i++) {
                const serialNum = `${newProduct.sku}-SN-${Math.floor(100000 + Math.random() * 900000)}`;
                await Inventory.create({
                    product: newProduct._id,
                    serialNumber: serialNum,
                    barcode: serialNum,
                    qrCode: await generateQRCode(serialNum),
                    status: 'Available',
                    condition: 'New',
                    movementHistory: [{ action: 'Stock Entry', date: new Date(), notes: 'Initial factory seeding' }]
                });
            }
        }
        console.log('📦 Seeded product catalogues and unique serial units inventory.');

        console.log('🔥 Seeding operations resolved successfully!');
        mongoose.connection.close();
    } catch (error) {
        console.error('🚨 Error Seeding Database:', error.message);
        process.exit(1);
    }
};

seedAll();
