import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, CheckCircle, PackageOpen, Award, Info, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);


    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [authError, setAuthError] = useState('');

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/products/${id}`);
            if (res.data.success) {
                setProduct(res.data.product);
            }

            const revRes = await api.get(`/products/${id}/reviews`);
            if (revRes.data.success) {
                setReviews(revRes.data.reviews);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const res = await api.post('/products/reviews', {
                productId: id,
                rating: newRating,
                comment: newComment
            });
            if (res.data.success) {
                setNewComment('');
                fetchDetails();
                showToast('Review uploaded successfully!', 'success');
            }
        } catch (err) {
            setAuthError('Authenticate login first to post reviews details.');
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 w-1/4 mx-auto rounded"></div>
                <div className="h-64 bg-slate-200 rounded max-w-2xl mx-auto"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-8 text-center space-y-4">
                <Info className="w-12 h-12 text-slate-400 mx-auto" />
                <h2 className="text-lg font-bold">Product not found</h2>
                <Link to="/catalog" className="text-brand-500 font-bold hover:underline">Back to Catalogue</Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">

            <div>
                <Link to="/catalog" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-brand-500 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Catalog
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="space-y-4">
                    <div className="aspect-video glass-panel rounded-3xl overflow-hidden flex items-center justify-center border border-slate-200/50">
                        <img
                            src={product.images[0] ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`) : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'; }}
                        />
                    </div>
                </div>


                <div className="space-y-6">
                    <div className="space-y-1">
                        <span className="text-xs uppercase font-extrabold text-brand-600 bg-brand-500/10 px-3 py-1 rounded-full">
                            {product.category}
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight pt-2">{product.name}</h2>
                        <div className="flex flex-wrap gap-2 pt-2 items-center text-xs font-semibold text-slate-500">
                            <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md">Partner: {product.ownerName || 'Rental Desk'}</span>
                            <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md">Branch: {product.branchId || 'Main'}</span>
                            <span className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-md">Warehouse: {product.warehouseId || 'WH-MAIN'}</span>
                        </div>
                        <div className="flex gap-4 pt-1.5 text-[11px] font-mono text-slate-400">
                            <span>SKU ID: {product.sku}</span>
                            <span>|</span>
                            <span>Available Stock: {product.stock?.available || 0} units</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-450 block">Daily rate</span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white">${product.priceRate.daily}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-450 block">Security Deposit Hold</span>
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">${product.securityDeposit}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            * The security deposit is fully refunded after the return inspection is completed clean with no damaged assets checked.
                        </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                        {product.description || 'Professional rental hardware suited for commercial operations.'}
                    </p>

                    <button
                        onClick={() => {
                            const res = addToCart(product);
                            if (res && res.success === false) {
                                showToast(res.message, 'warning');
                            } else {
                                navigate('/cart');
                            }
                        }}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 text-xs uppercase"
                    >
                        Add to Rental Cart & Setup Dates
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-205 dark:border-slate-800/10 pt-8">

                <div className="space-y-4">
                    <h3 className="font-extrabold text-md flex items-center gap-2">
                        <Award className="w-5 h-5 text-brand-500" /> Technical Specifications
                    </h3>
                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <tbody>
                                {product.specifications?.map((spec, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                        <td className="px-4 py-3 font-semibold text-slate-450 bg-slate-50 dark:bg-slate-900/20 w-1/3">{spec.key}</td>
                                        <td className="px-4 py-3 text-slate-800 dark:text-slate-300 font-medium">{spec.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                <div className="space-y-4">
                    <h3 className="font-extrabold text-md flex items-center gap-2">
                        <PackageOpen className="w-5 h-5 text-brand-500" /> Package Inclusions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.accessories?.map((acc, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/5">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-semibold text-slate-650 dark:text-slate-300">{acc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            <div className="border-t border-slate-205 dark:border-slate-800/10 pt-8 space-y-6">
                <h3 className="font-extrabold text-md">Customer Ratings & Comments</h3>


                <div className="space-y-4">
                    {reviews.length === 0 ? (
                        <p className="text-xs text-slate-400">No reviews yet for this product item.</p>
                    ) : (
                        reviews.map(rev => (
                            <div key={rev._id} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold">{rev.customer?.name || 'Verified Rentee'}</span>
                                    <div className="flex text-amber-500">
                                        {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">{rev.comment}</p>
                            </div>
                        ))
                    )}
                </div>


                <form onSubmit={handleReviewSubmit} className="space-y-4 border-t border-slate-205 dark:border-slate-800/10 pt-6">
                    <h4 className="text-xs font-bold uppercase text-slate-400">Write a Review</h4>
                    {authError && <p className="text-xs text-red-500">{authError}</p>}
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-500">Rating:</span>
                        <select
                            value={newRating}
                            onChange={(e) => setNewRating(Number(e.target.value))}
                            className="glass-input py-1 text-xs"
                        >
                            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                        </select>
                    </div>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type comment remarks regarding rentals quality..."
                        className="w-full text-xs glass-input aspect-[6] focus:outline-none"
                        required
                    />
                    <button type="submit" className="px-5 py-2 bg-brand-650 hover:bg-brand-700 text-white rounded-xl text-xs font-bold">
                        Post Review
                    </button>
                </form>
            </div>
        </div>
    );
};
export default ProductDetails;
