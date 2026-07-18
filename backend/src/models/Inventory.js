import mongoose from 'mongoose';

const InventoryMovementSchema = new mongoose.Schema({
    action: { type: String, required: true }, 
    date: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
});

const InventorySchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    serialNumber: { type: String, required: true, unique: true },
    barcode: { type: String, unique: true, index: true },
    qrCode: { type: String, unique: true },
    status: {
        type: String,
        enum: ['Available', 'Reserved', 'Rented', 'Maintenance', 'Damaged', 'Lost'],
        default: 'Available',
        index: true
    },
    condition: { type: String, enum: ['New', 'Excellent', 'Good', 'Fair', 'Damaged'], default: 'Excellent' },
    warehouseLocation: { type: String, default: 'Main Warehouse' },
    movementHistory: [InventoryMovementSchema]
}, {
    timestamps: true
});

const Inventory = mongoose.model('Inventory', InventorySchema);
export default Inventory;
