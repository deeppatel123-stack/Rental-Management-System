import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rentalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalOrder' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
}, {
    timestamps: true
});

const Review = mongoose.model('Review', ReviewSchema);
export default Review;
