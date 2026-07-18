import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    invoiceType: { type: String, enum: ['Rental', 'Overdue Penalty'], default: 'Rental' },
    subTotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    lateFees: { type: Number, default: 0 },
    repairFees: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    pdfUrl: String,
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Cancelled'], default: 'Unpaid' },
    issuedDate: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Invoice = mongoose.model('Invoice', InvoiceSchema);
export default Invoice;
