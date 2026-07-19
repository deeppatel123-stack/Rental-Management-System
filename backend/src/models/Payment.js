import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', index: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentMethod: { type: String, enum: ['Card', 'PayPal', 'Stripe', 'UPI', 'Cash'], default: 'Card' },
    transactionId: { type: String, unique: true, index: true },
    status: { type: String, enum: ['Pending', 'Unpaid', 'Completed', 'Refunded', 'Failed'], default: 'Pending' },

    gatewayResponse: mongoose.Schema.Types.Mixed,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purpose: { type: String, enum: ['Rental Payment', 'Security Deposit', 'Late Return Penalty'], default: 'Rental Payment' },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
