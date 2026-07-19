import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RotateCcw, Clock, AlertTriangle, Calendar, CheckCircle2, ShieldAlert, Laptop, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const RentedAssets = () => {
    const { showToast } = useToast();
    const [activeRentals, setActiveRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState(null);

    const fetchRentals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rentals/my-rentals');
            if (res.data.success) {
                // Filter orders currently with the customer
                const rented = res.data.orders.filter(order =>
                    ['Active', 'Delivered', 'Return Requested', 'Overdue'].includes(order.status)
                );
                setActiveRentals(rented);
            }
        } catch (err) {
            showToast('Failed to fetch rented assets list.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    const handleReturnRequest = async (orderId) => {
        setRequestingId(orderId);
        try {
            const res = await api.post(`/rentals/${orderId}/request-return`);
            if (res.data.success) {
                showToast(res.data.message || 'Return scheduled! Please hand over items at pickup points.', 'success');
                fetchRentals();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to request return.', 'error');
        } finally {
            setRequestingId(null);
        }
    };

    return (
        <div className="p-6 space-y-6 w-full max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                        <RotateCcw className="w-6 h-6 text-brand-500" />
                        Your Rented Assets
                    </h2>
                    <p className="text-xs text-slate-500">Manage assets currently in your possession, monitor status, and request return drop-off.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-xs text-slate-400 animate-pulse">Loading active rentals list...</div>
            ) : activeRentals.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-205 dark:border-slate-800 rounded-3xl text-slate-450 bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
                    <Laptop className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
                    <p className="text-xs font-semibold">No rented assets in your possession right now.</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Browse the catalogue to rent high-quality cameras, gear, or laptops today.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeRentals.map(order => {
                        const isOverdue = new Date() > new Date(order.endDate);
                        const isRequested = order.status === 'Return Requested';

                        return (
                            <motion.div
                                key={order._id}
                                layout
                                className={`glass-card rounded-3xl p-6 flex flex-col justify-between border ${isOverdue
                                        ? 'border-rose-500/20 bg-rose-500/5'
                                        : isRequested
                                            ? 'border-indigo-500/20 bg-indigo-500/5'
                                            : 'border-slate-200/50 dark:border-slate-800/10 bg-white dark:bg-slate-950'
                                    } shadow-sm space-y-4`}
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Ref: #{order.orderNumber}</span>
                                        <span className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${isOverdue
                                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                                                : isRequested
                                                    ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/15'
                                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                                            }`}>
                                            {isOverdue ? 'Overdue' : isRequested ? 'Return Pending' : 'Active'}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                                            {order.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                                        </h3>
                                        <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                                            <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-450" /> {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}</p>
                                            {isOverdue && (
                                                <p className="text-rose-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Overdue return deadline exceeded! Settle penalty fees.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-905 pt-4 flex items-center justify-between gap-3">
                                    <div className="text-left">
                                        <span className="text-[10px] text-slate-450 block uppercase tracking-wider font-extrabold">Deposit status</span>
                                        <span className="text-[11px] font-bold text-slate-650 dark:text-slate-350">{order.depositStatus}</span>
                                    </div>

                                    {isRequested ? (
                                        <div className="bg-indigo-550/10 px-3 py-1.5 rounded-xl border border-indigo-500/10 text-[10px] text-indigo-650 dark:text-indigo-400 font-extrabold flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Return Scheduled &amp; Waiting Inspection
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleReturnRequest(order._id)}
                                            disabled={requestingId === order._id}
                                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {requestingId === order._id ? '⏳ Requesting...' : 'Request Return Action'}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RentedAssets;
