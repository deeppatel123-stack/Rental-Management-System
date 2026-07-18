import mongoose from 'mongoose';

const ContractSchema = new mongoose.Schema({
    contractNumber: { type: String, required: true, unique: true, index: true },
    rentalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', required: true, index: true },
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rentalPeriod: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    securityDeposit: { type: Number, default: 0 },
    lateFeeRules: { type: String, default: 'Late return fees applied hourly/daily as specified by partner policy.' },
    returnRules: { type: String, default: 'Equipments must be returned in the original working condition.' },

    digitalSignature: { type: String },
    qrCodeUrl: { type: String },

    status: {
        type: String,
        enum: ['Draft', 'Generated', 'Signed', 'Expired', 'Completed'],
        default: 'Draft',
        index: true
    }
}, {
    timestamps: true
});

// Backward compatibility helper
ContractSchema.pre('save', function (next) {
    if (!this.rentalOrder) this.rentalOrder = this.rentalOrderId;
    if (!this.customer) this.customer = this.customerId;
    next();
});

const Contract = mongoose.model('Contract', ContractSchema);
export default Contract;
