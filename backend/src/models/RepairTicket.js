import mongoose from 'mongoose';

const RepairTicketSchema = new mongoose.Schema({
    ticketNumber: { type: String, required: true, unique: true },
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    status: { type: String, enum: ['Inspection', 'In Progress', 'Pending Parts', 'Repaired', 'Scrapped'], default: 'Inspection' },
    costEstimate: { type: Number, default: 0 },
    missingAccessories: [String],
    damagePhotos: [String],
    repairLog: [{
        action: String,
        timestamp: { type: Date, default: Date.now },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: String
    }]
}, {
    timestamps: true
});

const RepairTicket = mongoose.model('RepairTicket', RepairTicketSchema);
export default RepairTicket;
