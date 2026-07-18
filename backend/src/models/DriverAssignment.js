import mongoose from 'mongoose';

const RouteStopSchema = new mongoose.Schema({
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder', required: true },
    type: { type: String, enum: ['Pickup', 'Return'], required: true },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    stopOrder: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Arrived', 'Done', 'Failed'], default: 'Pending' },
    completedAt: Date
});

const DriverAssignmentSchema = new mongoose.Schema({
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    stops: [RouteStopSchema],
    optimizedPathLength: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Assigned', 'In Transit', 'Completed'], default: 'Draft' },
    notes: String
}, {
    timestamps: true
});

const DriverAssignment = mongoose.model('DriverAssignment', DriverAssignmentSchema);
export default DriverAssignment;
