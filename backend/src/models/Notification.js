import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['Rental', 'LateFee', 'Deposit', 'Support', 'Info'], default: 'Info' },
    isRead: { type: Boolean, default: false },
    referenceId: mongoose.Schema.Types.ObjectId, 
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
