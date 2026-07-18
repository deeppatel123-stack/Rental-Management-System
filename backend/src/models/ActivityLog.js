import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true }, 
    module: { type: String, required: true }, 
    details: { type: String },
    ipAddress: String,
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
export default ActivityLog;
