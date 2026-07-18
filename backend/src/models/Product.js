import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
    color: String,
    size: String,
    weight: String,
    sku: { type: String },
    additionalPrice: { type: Number, default: 0 }
});

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String },
    qrCode: { type: String },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true },
    manufacturer: { type: String },
    description: { type: String },
    images: [{ type: String }],

    // Rental Partner ownership fields
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: { type: String, default: 'Default Partner' },
    ownerCode: { type: String, default: 'PARTNER-01' },
    branchId: { type: String, default: 'BRANCH-MAIN' },
    warehouseId: { type: String, default: 'WH-MAIN' },


    priceRate: {
        hourly: { type: Number, default: 0 },
        daily: { type: Number, required: true },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 }
    },
    securityDeposit: { type: Number, required: true, default: 0 },
    depositType: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
    depositValue: { type: Number, default: 0 },
    taxRate: { type: Number, default: 8 },


    stock: {
        total: { type: Number, default: 1 },
        available: { type: Number, default: 1 },
        reserved: { type: Number, default: 0 },
        maintenance: { type: Number, default: 0 },
        damaged: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['Available', 'Un-Available', 'Discontinued'], default: 'Available' },


    specifications: [{ key: String, value: String }],
    accessories: [{ type: String }],
    variants: [VariantSchema],


    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],


    seo: {
        title: { type: String },
        description: { type: String },
        keywords: [{ type: String }]
    },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;
