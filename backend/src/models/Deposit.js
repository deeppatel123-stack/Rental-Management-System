import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema({
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    amountHeld: { type: Number, required: true },
    penaltyDeducted: { type: Number, default: 0 },
    amountRefunded: { type: Number, default: 0 },

    status: {
        type: String,
        enum: ['Not Collected', 'Held', 'Processing', 'Refunded', 'Partially Refunded', 'Deducted/Settled'],
        default: 'Not Collected',
        index: true
    },

    approvalStatus: {
        type: String,
        enum: ['Auto-Approved', 'Pending Approval', 'Approved', 'Rejected'],
        default: 'Auto-Approved'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalNotes: String,
    deductionNotes: String,
    depositTransactionId: { type: String },
    refundTransactionId: { type: String },
    refundedAt: { type: Date }
}, {
    timestamps: true
});

const Deposit = mongoose.model('Deposit', DepositSchema);
export default Deposit;
