import mongoose from 'mongoose';

const ReturnChecklistItemSchema = new mongoose.Schema({
    productName: String,
    serialNumber: { type: String, default: '' },
    status: { type: String, enum: ['Returned', 'Damaged', 'Missing Accessories', 'Lost'], default: 'Returned' },
    accessoriesReturned: [{ name: String, present: { type: Boolean, default: true } }],
    conditionRating: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Damaged'], default: 'Excellent' },
    damageCost: { type: Number, default: 0 },
    damageDescription: { type: String, default: '' },
    damageImages: [{ type: String }]
});

const ReturnSchema = new mongoose.Schema({
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedExecutiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledDate: { type: Date },
    actualReturnDate: { type: Date },
    notes: { type: String, default: '' },

    checklist: [ReturnChecklistItemSchema],

    // OTP & QR Verification
    otp: { type: String, required: true },
    isOtpVerified: { type: Boolean, default: false },
    qrCodeData: { type: String, default: '' }, // base64 QR image
    qrScanned: { type: Boolean, default: false },

    // Customer digital signature
    customerSignature: { type: String, default: '' },

    // Inspection images
    inspectionImages: [{ type: String }],

    // Late return engine
    isLateReturn: { type: Boolean, default: false },
    lateDurationHours: { type: Number, default: 0 },
    calculatedLateFee: { type: Number, default: 0 },

    // Damage assessment
    requiresRepair: { type: Boolean, default: false },
    repairCostTotal: { type: Number, default: 0 },
    overallCondition: {
        type: String,
        enum: ['Excellent', 'Good', 'Minor Damage', 'Major Damage', 'Lost'],
        default: 'Excellent'
    },

    // Deposit settlement
    depositRefundAmount: { type: Number, default: 0 },
    depositDeductionAmount: { type: Number, default: 0 },

    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'Scheduled', 'On The Way', 'OTP Verified', 'Inspection', 'Damage Review', 'Penalty Calculation', 'Refund Processing', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    timeline: [{
        status: String,
        updatedAt: { type: Date, default: Date.now },
        notes: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

const Return = mongoose.model('Return', ReturnSchema);
export default Return;
