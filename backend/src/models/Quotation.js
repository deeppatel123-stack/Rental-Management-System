import mongoose from 'mongoose';

const QuotationItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    rateApplied: { type: Number, required: true },
    securityDepositApplied: { type: Number, required: true },
    rateType: { type: String, default: 'daily' }
});

const QuotationSchema = new mongoose.Schema({
    quotationNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    items: [QuotationItemSchema],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    subTotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    securityDepositTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Expired'], default: 'Draft' },
    validUntil: { type: Date, required: true }
}, {
    timestamps: true
});

const Quotation = mongoose.model('Quotation', QuotationSchema);
export default Quotation;
