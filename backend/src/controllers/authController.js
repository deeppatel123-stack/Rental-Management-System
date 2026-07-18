import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/emailService.js';


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforrentalmanagementsystem123!', {
        expiresIn: process.env.JWT_EXPIRE || '2h',
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforrentalmanagementsystem123!', {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });
};

export const register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email address' });
        }


        const count = await User.countDocuments();
        const assignedRole = count === 0 ? 'Super Admin' : (role || 'Customer');


        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        const user = await User.create({
            name,
            email,
            password,
            role: assignedRole,
            phone,
            verificationOTP: otp,
            verificationOTPExpires: otpExpires,
            isVerified: assignedRole === 'Super Admin'
        });


        await Wishlist.create({ customer: user._id, products: [] });


        if (assignedRole !== 'Super Admin') {
            await sendEmail({
                to: user.email,
                subject: 'Rental System Email Verification Code',
                html: `<h3>Verification OTP</h3><p>Your OTP code is: <strong>${otp}</strong>. It expires in 15 minutes.</p>`
            });
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Verification OTP sent to your email.',
            userId: user._id
        });
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            verificationOTP: otp,
            verificationOTPExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification OTP' });
        }

        user.isVerified = true;
        user.verificationOTP = undefined;
        user.verificationOTPExpires = undefined;
        await user.save();

        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            message: 'Email address verified successfully!',
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                profileImage: user.profileImage,
                loyaltyPoints: user.loyaltyPoints
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password, rememberMe } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.isBlacklisted) {
            return res.status(401).json({ success: false, message: 'Invalid email credentials or account is suspended' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Verify email before logging in' });
        }

        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);


        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000
        };

        res.cookie('refreshToken', refreshToken, cookieOptions);

        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                profileImage: user.profileImage,
                addresses: user.addresses,
                loyaltyPoints: user.loyaltyPoints
            }
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        if (req.file) {

            user.profileImage = `/uploads/${req.file.filename}`;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        next(error);
    }
};

export const addAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const { street, city, state, zipCode, country, isDefault } = req.body;

        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push({ street, city, state, zipCode, country, isDefault });
        await user.save();

        res.json({ success: true, message: 'Address created', addresses: user.addresses });
    } catch (error) {
        next(error);
    }
};

export const deleteAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
        await user.save();
        res.json({ success: true, message: 'Address removed successfully', addresses: user.addresses });
    } catch (error) {
        next(error);
    }
};

export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'Rental System Password Reset Request Code',
            html: `<h3>Password Reset OTP</h3><p>Your password reset code is: <strong>${otp}</strong>. It expires in 15 minutes.</p>`
        });

        res.json({ success: true, message: 'Password reset OTP sent to email' });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired password reset OTP' });
        }

        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully! Log in to continue.' });
    } catch (error) {
        next(error);
    }
};

export const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'This email is already verified' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationOTP = otp;
        user.verificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'Rental System Email Verification Code',
            html: `<h3>Verification OTP</h3><p>Your OTP code is: <strong>${otp}</strong>. It expires in 15 minutes.</p>`
        });

        res.json({
            success: true,
            message: 'A new verification OTP code has been sent successfully.'
        });
    } catch (error) {
        next(error);
    }
};

// Admin: list all components of rental partners + their product additions
export const getEmployeeList = async (req, res, next) => {
    try {
        const employees = await User.find({ role: 'Rental Partner' })
            .select('name email phone isVerified createdAt')
            .sort({ createdAt: -1 });

        const Product = (await import('../models/Product.js')).default;

        const employeesWithCounts = await Promise.all(employees.map(async (emp) => {
            const productCount = await Product.countDocuments({ addedBy: emp._id });
            const recentProducts = await Product.find({ addedBy: emp._id })
                .select('name category status createdAt')
                .sort({ createdAt: -1 })
                .limit(5);
            return {
                _id: emp._id,
                name: emp.name,
                email: emp.email,
                phone: emp.phone,
                isVerified: emp.isVerified,
                createdAt: emp.createdAt,
                productCount,
                recentProducts
            };
        }));

        res.json({ success: true, employees: employeesWithCounts, partners: employeesWithCounts });
    } catch (error) {
        next(error);
    }
};

// Admin: list all customers
export const getCustomerList = async (req, res, next) => {
    try {
        const customers = await User.find({ role: 'Customer' })
            .select('name email phone isVerified isBlacklisted createdAt')
            .sort({ createdAt: -1 });

        const RentalOrder = (await import('../models/RentalOrder.js')).default;

        const customersWithData = await Promise.all(customers.map(async (c) => {
            const orderCount = await RentalOrder.countDocuments({ customer: c._id });
            const activeOrders = await RentalOrder.countDocuments({
                customer: c._id,
                status: { $in: ['Pending', 'Confirmed', 'Active'] }
            });
            return {
                _id: c._id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                isVerified: c.isVerified,
                isBlacklisted: c.isBlacklisted,
                createdAt: c.createdAt,
                orderCount,
                activeOrders
            };
        }));

        res.json({ success: true, customers: customersWithData });
    } catch (error) {
        next(error);
    }
};

// Admin: delete a customer (only if no active orders)
export const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
        if (customer.role !== 'Customer') {
            return res.status(403).json({ success: false, message: 'Cannot delete Super Admin or Rental Partner accounts from this route.' });
        }

        const RentalOrder = (await import('../models/RentalOrder.js')).default;
        const activeOrders = await RentalOrder.countDocuments({
            customer: req.params.id,
            status: { $in: ['Pending', 'Confirmed', 'Active'] }
        });

        if (activeOrders > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer — they have ${activeOrders} active rental order(s) in progress.`
            });
        }

        await customer.deleteOne();
        res.json({ success: true, message: `Customer "${customer.name}" deleted successfully.` });
    } catch (error) {
        next(error);
    }
};
