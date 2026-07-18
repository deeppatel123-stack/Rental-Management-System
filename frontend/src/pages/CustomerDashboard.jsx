import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { Box, LifeBuoy, Heart, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

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
