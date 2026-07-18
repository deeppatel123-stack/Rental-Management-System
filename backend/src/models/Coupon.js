import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['Percentage', 'Flat'], default: 'Percentage' },
    value: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },
    usesCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
