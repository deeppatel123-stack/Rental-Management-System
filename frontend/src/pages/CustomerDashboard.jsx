import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Box, LifeBuoy, Heart, FileText, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const [activeRentals, setActiveRentals] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const rentalsRes = await api.get('/rentals/my-rentals');
                if (rentalsRes.data.success) {
                    const actives = rentalsRes.data.orders.filter(
                        o => o.status === 'Confirmed' || o.status === 'Active' || o.status === 'Overdue'
                    );
                    setActiveRentals(actives);
                }


                const wishlistRes = await api.get('/products/wishlist');
                if (wishlistRes.data.success) {
                    setWishlist(wishlistRes.data.products || []);
                }
            } catch (err) {
                console.warn('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleRemoveFromWishlist = async (productId) => {
        try {
            const res = await api.post('/products/wishlist/toggle', { productId });
            if (res.data.success) {
                setWishlist(prev => prev.filter(p => p._id !== productId));
                showToast('Removed from wishlist.', 'success');
            }
        } catch (err) {
            console.error('Failed to remove wishlist item:', err);
            showToast('Failed to remove item.', 'error');
        }
    };

    const stats = [
        { label: 'Active Rentals', count: activeRentals.length, icon: Box, color: 'text-brand-500 bg-brand-500/10' },
        { label: 'Saved Wishlist', count: wishlist.length, icon: Heart, color: 'text-rose-500 bg-rose-500/10' },
        { label: 'Support Tickets', count: 1, icon: LifeBuoy, color: 'text-amber-500 bg-amber-500/10' }
    ];

    return (
        <div className="p-6 space-y-8">

            <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-brand-500/5 rounded-full blur-2xl"></div>

                <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                        Welcome back, <span className="text-brand-600 dark:text-brand-400">{user?.name}</span> 👋
                    </h2>
                    <p className="text-xs text-slate-500">Track shipment schedules, test equipment checklists, and submit returns request approvals.</p>
                </div>

                <Link
                    to="/catalog"
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-650 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                    Book New Reservs <ArrowRight className="w-4 h-4" />
                </Link>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-400">{s.label}</span>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{s.count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 glass-panel rounded-3xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-205 dark:border-slate-800/10 pb-3">
                        <h3 className="font-extrabold text-sm flex items-center gap-2">
                            <FileText className="w-5 h-5 text-brand-500" /> Active Rental Orders
                        </h3>
                        <Link to="/orders" className="text-xs font-semibold text-brand-500 hover:underline">
                            View History
                        </Link>
                    </div>

                    {loading ? (
                        <p className="text-xs text-slate-400 animate-pulse">Checking records data...</p>
                    ) : activeRentals.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                            <p>You have no active or overdue equipment rentals.</p>
                            <Link to="/catalog" className="text-brand-500 hover:underline font-bold">Rent item now</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeRentals.map(order => (
                                <div key={order._id} className="p-4 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                                            Order ID: {order.orderNumber}
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                            {(() => {
                                                if (!order.items || !order.items.length) return 'Rented Gear';
                                                const grouped = {};
                                                order.items.forEach(it => {
                                                    const key = it.name;
                                                    if (!grouped[key]) {
                                                        grouped[key] = { name: it.name, quantity: 0 };
                                                    }
                                                    grouped[key].quantity += (it.quantity || 1);
                                                });
                                                return Object.values(grouped).map(g => `${g.name} (x${g.quantity})`).join(', ');
                                            })()}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 block pt-0.5">
                                            Period: {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 justify-between">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block text-right">Status</span>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold border ${order.status === 'Overdue'
                                                ? 'bg-red-500/15 border-red-500 text-red-500'
                                                : order.status === 'Active'
                                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                                                    : 'bg-brand-500/15 border-brand-500 text-brand-500'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => navigate('/orders')}
                                            className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-xl"
                                        >
                                            Track
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Saved Wishlist Items */}
                    <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-5 mt-5 space-y-4">
                        <h3 className="font-extrabold text-sm flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Saved Wishlist ({wishlist.length})
                        </h3>
                        {wishlist.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No products saved in your wishlist yet. Explore the catalogue to save items.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {wishlist.map(prod => (
                                    <div key={prod._id} className="p-3 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/10 rounded-2xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/60 flex-shrink-0">
                                                <img
                                                    src={prod.images?.[0] ? (prod.images[0].startsWith('http') ? prod.images[0] : `http://localhost:5000${prod.images[0]}`) : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400'}
                                                    alt={prod.name}
                                                    className="object-cover w-full h-full"
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400'; }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white hover:text-brand-500 truncate">
                                                    <Link to={`/products/${prod._id}`}>{prod.name}</Link>
                                                </h4>
                                                <span className="text-[10px] text-slate-400 block">${prod.priceRate?.daily || prod.priceRate?.daily === 0 ? prod.priceRate.daily : (prod.price || 0)} / day</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => {
                                                    const res = addToCart(prod);
                                                    if (res && res.success === false) {
                                                        showToast(res.message, 'warning');
                                                    } else {
                                                        showToast('Added to cart!', 'success');
                                                    }
                                                }}
                                                className="px-2.5 py-1.5 bg-brand-500 hover:bg-brand-650 text-white text-[10px] font-bold rounded-xl shadow-sm transition-all"
                                            >
                                                Rent
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFromWishlist(prod._id)}
                                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-500 rounded-lg transition-all"
                                                title="Remove"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>


                <div className="glass-panel rounded-3xl p-5 space-y-4">
                    <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">🚨 Logistics Notice</h3>

                    <div className="space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        <p>
                            When picking up items at store or receiving package deliveries, you will be requested to provide a 6-digit OTP code to verify matching conditions and signatures.
                        </p>
                        <p>
                            Late returns are detected automatically by system chronometer services. Returns request delays invoke automatic daily multipliers penalty invoicing deductions from escrow securities details.
                        </p>
                        <Link
                            to="/support"
                            className="inline-block text-xs font-bold text-brand-500 hover:underline"
                        >
                            Contact Support desk
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default CustomerDashboard;
