import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
    orgName: { type: String, default: 'Rental Inc.' },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    taxRate: { type: Number, default: 8.5 }, 

    
    gracePeriodMinutes: { type: Number, default: 60 },
    lateFeeChargeType: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
    lateFeeMultiplier: { type: Number, default: 1.5 }, 
    maxLateFeeLimit: { type: Number, default: 500 }, 

    
    quotationTemplate: { type: String, default: '<h1>Quotation</h1><p>Dear {{customerName}}, thanks for choosing us...</p>' },
    invoiceTemplate: { type: String, default: '<h1>Invoice</h1><p>Invoice #{{invoiceNumber}} matches order {{orderNumber}}...</p>' },
    emailTemplate: { type: String, default: '<p>Hi {{customerName}}, your rental status is {{status}}.</p>' },

    
    rentalPolicy: { type: String, default: 'Customers are responsible for damages. Late return without notice results in penalties.' }
}, {
    timestamps: true
});

const Setting = mongoose.model('Setting', SettingSchema);
export default Setting;
