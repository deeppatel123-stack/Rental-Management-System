import mongoose from 'mongoose';

const MembershipPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    period: { type: String, enum: ['Monthly', 'Yearly'], default: 'Monthly' },
    discountPercentage: { type: Number, default: 0 },
    freeDelivery: { type: Boolean, default: false },
    extendedGracePeriodHours: { type: Number, default: 0 },
    prioritySupport: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const MembershipPlan = mongoose.model('MembershipPlan', MembershipPlanSchema);
export default MembershipPlan;
