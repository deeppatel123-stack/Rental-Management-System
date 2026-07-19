import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Inventory from '../models/Inventory.js';
import { generateQRCode } from '../services/qrService.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';

export const getProducts = async (req, res, next) => {
    try {
        const { search, category, brand, sort, page = 1, limit = 12 } = req.query;

        const query = {};

        // Parse token manually to enforce Staff-specific row-level isolation
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforrentalmanagementsystem123!');
                const localUser = await User.findById(decoded.id);
                if (localUser && localUser.role === 'Rental Partner') {
                    query.ownerId = localUser._id;
                }
            } catch (err) {
                // Ignore guest or expired signatures
            }
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }


        if (category) query.category = category;
        if (brand) query.brand = brand;


        const skip = (page - 1) * limit;

        let sortOption = { createdAt: -1 };
        if (sort === 'priceAsc') sortOption = { 'priceRate.daily': 1 };
        if (sort === 'priceDesc') sortOption = { 'priceRate.daily': -1 };
        if (sort === 'rating') sortOption = { rating: -1 };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));

        res.json({
            success: true,
            count: products.length,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total,
            products
        });
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, product });
    } catch (error) {
        next(error);
    }
};

export const createProduct = async (req, res, next) => {
    try {
        const { name, sku, category, brand, manufacturer, description, hourlyPrice, dailyPrice, weeklyPrice, monthlyPrice, securityDeposit, depositAmount, penaltyAmount, depositType, depositValue, taxRate, totalStock, specifications, accessories, variants } = req.body;

        const productExists = await Product.findOne({ sku });
        if (productExists) {
            return res.status(400).json({ success: false, message: 'SKU code already exists' });
        }


        const images = [];
        if (req.files) {
            req.files.forEach(file => {
                images.push(`/uploads/${file.filename}`);
            });
        }

        const rateDaily = dailyPrice || req.body.priceRate?.daily || 0;
        const rateWeekly = weeklyPrice || req.body.priceRate?.weekly || 0;
        const rateHourly = hourlyPrice || req.body.priceRate?.hourly || 0;
        const rateMonthly = monthlyPrice || req.body.priceRate?.monthly || 0;

        const priceRate = {
            hourly: rateHourly,
            daily: rateDaily,
            weekly: rateWeekly,
            monthly: rateMonthly
        };

        const parseSafely = (val) => {
            if (!val) return [];
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    console.error("Failed to parse field:", val, e);
                    return [];
                }
            }
            return val;
        };

        const parsedSpecs = parseSafely(specifications);
        const parsedAccessories = parseSafely(accessories);
        const parsedVariants = parseSafely(variants);

        const product = await Product.create({
            name,
            sku,
            category,
            brand,
            manufacturer,
            description,
            images,
            priceRate,
            securityDeposit: Number(depositAmount || securityDeposit || 0),
            depositAmount: Number(depositAmount || securityDeposit || 0),
            penaltyAmount: Number(penaltyAmount || 0),
            depositType,
            depositValue,
            taxRate: taxRate !== undefined ? Number(taxRate) : 8,
            stock: {
                total: totalStock || 1,
                available: totalStock || 1,
                reserved: 0,
                maintenance: 0,
                damaged: 0
            },
            specifications: parsedSpecs,
            accessories: parsedAccessories,
            variants: parsedVariants,
            addedBy: req.user?.id || null,
            ownerId: req.user?.id,
            ownerName: req.user?.name || 'Partner',
            ownerCode: 'PARTNER-' + req.user?.id?.toString().slice(-4),
            branchId: req.body.branchId || 'BRANCH-MAIN',
            warehouseId: req.body.warehouseId || 'WH-MAIN'
        });


        const appQr = await generateQRCode(`RMS-PROD-${product._id}`);
        product.qrCode = appQr;
        product.barcode = product.sku;
        await product.save();


        for (let i = 0; i < product.stock.total; i++) {
            const serialNum = `${product.sku}-SN-${Math.floor(100000 + Math.random() * 900000)}`;
            await Inventory.create({
                product: product._id,
                serialNumber: serialNum,
                barcode: serialNum,
                qrCode: await generateQRCode(serialNum),
                status: 'Available',
                condition: 'New',
                movementHistory: [{ action: 'Stock Entry', notes: 'Initial setup' }]
            });
        }

        res.status(201).json({ success: true, message: 'Product created successfully', product });
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Row-level Security: Only the owner partner can update that product.
        if (req.user.role === 'Rental Partner' && product.ownerId && product.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this product' });
        }

        const { name, category, brand, description, hourlyPrice, dailyPrice, weeklyPrice, monthlyPrice, securityDeposit, depositAmount, penaltyAmount, totalStock, taxRate } = req.body;

        if (name) product.name = name;
        if (category) product.category = category;
        if (brand) product.brand = brand;
        if (description) product.description = description;
        if (depositAmount !== undefined) {
            product.depositAmount = Number(depositAmount);
            product.securityDeposit = Number(depositAmount);
        } else if (securityDeposit !== undefined) {
            product.depositAmount = Number(securityDeposit);
            product.securityDeposit = Number(securityDeposit);
        }
        if (penaltyAmount !== undefined) product.penaltyAmount = Number(penaltyAmount);
        if (taxRate !== undefined) product.taxRate = Number(taxRate);

        const rateDaily = dailyPrice || req.body.priceRate?.daily;
        const rateWeekly = weeklyPrice || req.body.priceRate?.weekly;
        const rateHourly = hourlyPrice || req.body.priceRate?.hourly;
        const rateMonthly = monthlyPrice || req.body.priceRate?.monthly;

        if (rateHourly || rateDaily || rateWeekly || rateMonthly) {
            product.priceRate = {
                hourly: rateHourly || product.priceRate.hourly || 0,
                daily: rateDaily || product.priceRate.daily || 0,
                weekly: rateWeekly || product.priceRate.weekly || 0,
                monthly: rateMonthly || product.priceRate.monthly || 0
            };
        }


        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                product.images.push(`/uploads/${file.filename}`);
            });
        }


        if (totalStock) {
            const diff = Number(totalStock) - product.stock.total;
            if (diff > 0) {
                for (let i = 0; i < diff; i++) {
                    const serialNum = `${product.sku}-SN-${Math.floor(100000 + Math.random() * 900000)}`;
                    await Inventory.create({
                        product: product._id,
                        serialNumber: serialNum,
                        barcode: serialNum,
                        qrCode: await generateQRCode(serialNum),
                        status: 'Available',
                        condition: 'Excellent',
                        movementHistory: [{ action: 'Stock Adjustment', notes: 'Increased stock limit' }]
                    });
                }
            } else if (diff < 0) {
                const countToRemove = Math.abs(diff);
                const itemsToDelete = await Inventory.find({ product: product._id, status: 'Available' })
                    .limit(countToRemove);
                for (const item of itemsToDelete) {
                    await item.deleteOne();
                }
            }

            const totalCount = await Inventory.countDocuments({ product: product._id });
            product.stock.total = totalCount;

            const availCount = await Inventory.countDocuments({ product: product._id, status: 'Available' });
            product.stock.available = availCount;

            const reservedCount = await Inventory.countDocuments({ product: product._id, status: 'Reserved' });
            product.stock.reserved = reservedCount;

            const rentedCount = await Inventory.countDocuments({ product: product._id, status: 'Rented' });
            product.stock.rented = rentedCount;

            const maintenanceCount = await Inventory.countDocuments({ product: product._id, status: 'Maintenance' });
            product.stock.maintenance = maintenanceCount;
        }

        await product.save();
        res.json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Row-level Security: Only the owner partner can delete that product.
        if (req.user.role === 'Rental Partner' && product.ownerId && product.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this product' });
        }


        await Inventory.deleteMany({ product: product._id });
        await product.deleteOne();

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const createReview = async (req, res, next) => {
    try {
        const { productId, rating, comment, orderId } = req.body;

        const review = await Review.create({
            product: productId,
            customer: req.user.id,
            rentalOrder: orderId,
            rating,
            comment
        });

        res.status(201).json({ success: true, message: 'Review uploaded successfully', review });
    } catch (error) {
        next(error);
    }
};

export const getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ product: req.params.id }).populate('customer', 'name');
        res.json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
};

export const getWishlist = async (req, res, next) => {
    try {
        let wishlist = await Wishlist.findOne({ customer: req.user.id })
            .populate({
                path: 'products',
                select: 'name priceRate securityDeposit images brand category stock description'
            });

        if (!wishlist) {
            wishlist = await Wishlist.create({ customer: req.user.id, products: [] });
        }

        res.json({ success: true, products: wishlist.products });
    } catch (error) {
        next(error);
    }
};

export const toggleWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' });
        }

        let wishlist = await Wishlist.findOne({ customer: req.user.id });
        if (!wishlist) {
            wishlist = await Wishlist.create({ customer: req.user.id, products: [] });
        }

        const index = wishlist.products.indexOf(productId);
        let added = false;
        if (index > -1) {
            wishlist.products.splice(index, 1);
        } else {
            wishlist.products.push(productId);
            added = true;
        }

        await wishlist.save();

        res.json({
            success: true,
            message: added ? 'Product added to wishlist.' : 'Product removed from wishlist.',
            added
        });
    } catch (error) {
        next(error);
    }
};
