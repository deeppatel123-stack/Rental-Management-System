import mongoose from 'mongoose';

const RentalItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    name: { type: String, required: true },
    rateType: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'daily' },
    rateApplied: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    securityDepositApplied: { type: Number, required: true }
});

const TimelineEventSchema = new mongoose.Schema({
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    description: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const RentalOrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [RentalItemSchema],

    // Rental Partner ownership fields
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    ownerName: { type: String },
    branchId: { type: String },
    warehouseId: { type: String },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    actualReturnDate: { type: Date },


    deliveryType: { type: String, enum: ['Delivery', 'Store Pickup'], default: 'Store Pickup' },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },


    subTotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    securityDepositTotal: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    lateFees: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },


    status: {
        type: String,
        enum: ['Pending', 'Quotation', 'Confirmed', 'Ready for Pickup', 'Picked Up', 'Active', 'Return Requested', 'Overdue', 'Delivered', 'Completed', 'Cancelled'],
        default: 'Pending',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Paid', 'Refunded', 'Partially Refunded'],
        default: 'Unpaid'
    },
    depositStatus: {
        type: String,
        enum: ['Not Collected', 'Held', 'Refunded', 'Partially Refunded', 'Deducted/Settled'],
        default: 'Not Collected'
    },


    agreementSigned: { type: Boolean, default: false },
    agreementUrl: String,
    customerSignature: String,

    timeline: [TimelineEventSchema]
}, {
    timestamps: true
});

const RentalOrder = mongoose.model('RentalOrder', RentalOrderSchema);
export default RentalOrder;
