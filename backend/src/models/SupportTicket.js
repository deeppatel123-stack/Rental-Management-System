import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const SupportTicketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder' },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open', index: true },
    messages: [MessageSchema]
}, {
    timestamps: true
});

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);
export default SupportTicket;
