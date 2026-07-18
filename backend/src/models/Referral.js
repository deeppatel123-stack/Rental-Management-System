import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Invalid'], default: 'Pending' },
    rewardPoints: { type: Number, default: 50 },
    rewardClaimed: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Referral = mongoose.model('Referral', ReferralSchema);
export default Referral;
