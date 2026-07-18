import mongoose from 'mongoose';

const PickupChecklistItemSchema = new mongoose.Schema({
    productName: String,
    serialNumber: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    originalCondition: { type: String, default: 'Excellent' }
});

const PickupSchema = new mongoose.Schema({
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedExecutiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledDate: { type: Date },
    actualPickupDate: { type: Date },
    vehicleDetails: { type: String, default: '' },
    notes: { type: String, default: '' },

    checklist: [PickupChecklistItemSchema],

    // OTP & QR Verification
    otp: { type: String, required: true },
    isOtpVerified: { type: Boolean, default: false },
    qrCodeData: { type: String, default: '' }, // base64 QR image
    qrScanned: { type: Boolean, default: false },

    // Customer digital signature
    customerSignature: { type: String, default: '' },

    // Images uploaded by executive
    images: [{ type: String }],

    // Reschedule history
    rescheduleHistory: [{
        previousDate: Date,
        newDate: Date,
        reason: String,
        rescheduledAt: { type: Date, default: Date.now }
    }],

    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'Scheduled', 'On The Way', 'OTP Verified', 'QR Verified', 'Picked Up', 'Completed', 'Cancelled'],
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

const Pickup = mongoose.model('Pickup', PickupSchema);
export default Pickup;
