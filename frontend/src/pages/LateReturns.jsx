import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, Clock, ShieldAlert, BadgeInfo, CheckCircle, Search, Mail, Phone, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export const LateReturns = () => {
    const { showToast } = useToast();
    const [lateOrders, setLateOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [payingId, setPayingId] = useState(null);

    const fetchLateOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rentals/late-returns/list');
            if (res.data.success) {
                setLateOrders(res.data.lateReturns || []);
            }
        } catch (err) {
            showToast('Failed to fetch overdue rentals catalog.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLateOrders();
    }, []);

    const handleRecordPayment = async (orderId) => {
        setPayingId(orderId);
        try {
            const res = await api.post(`/rentals/${orderId}/pay-penalty`);
            if (res.data.success) {
                showToast(res.data.message || 'Penalty recorded as paid successfully!', 'success');
                fetchLateOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error processing penalty payment.', 'error');
        } finally {
            setPayingId(null);
        }
    };

    const filteredOrders = lateOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(search.toLowerCase())
    );

    const totalCalculatedPenalty = lateOrders.reduce((sum, order) => sum + (order.accumulatedPenalty || 0), 0);

    return (
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                        <AlertTriangle className="w-7 h-7 text-rose-500" />
                        Late Returns & Overdue Rentals
                    </h2>
                    <p className="text-xs text-slate-500">Track items that have passed their return deadline and verify dynamic overdue penalties.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs">
                    <span className="text-slate-400">Total Outstanding Penalties:</span>
                    <span className="font-extrabold text-rose-500 dark:text-rose-400 font-mono">${totalCalculatedPenalty.toFixed(2)}</span>
                </div>
            </div>

            {/* Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/10 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Overdue Orders</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{lateOrders.length}</h3>
                    </div>
                    <Clock className="w-10 h-10 text-rose-500/40" />
                </div>

                <div className="glass-panel p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-605/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-emerald-450 tracking-wider">Avg. Daily Penalty</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                            ${(lateOrders.length ? (lateOrders.reduce((sum, o) => sum + (o.dailyPenaltyRate || 0), 0) / lateOrders.length) : 0).toFixed(2)}
                        </h3>
                    </div>
                    <DollarSign className="w-10 h-10 text-emerald-500/40" />
                </div>

                <div className="glass-panel p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-605/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Max Delinquency</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                            {lateOrders.length ? Math.max(...lateOrders.map(o => o.daysLate || 0)) : 0} Days
                        </h3>
                    </div>
                    <ShieldAlert className="w-10 h-10 text-indigo-500/40" />
                </div>
            </div>

            {/* Filter and Table Card */}
            <div className="border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <h3 className="font-extrabold text-xs text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                        <BadgeInfo className="w-4 h-4 text-brand-500" />
                        Delinquent Rental Agreements
                    </h3>

                    {/* Search bar */}
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by customer name or order number..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-205 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-xs text-slate-400 animate-pulse">Running overdue sync job...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-450 bg-slate-50/50 dark:bg-slate-900/10">
                        No late rentals found. Excellent! All inventory returning on-schedule.
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-205 dark:border-slate-850 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-500 font-bold">
                                    <th className="p-4">Order Details</th>
                                    <th className="p-4">Customer Info</th>
                                    <th className="p-4">Overdue Information</th>
                                    <th className="p-4">Deposit / Security</th>
                                    <th className="p-4">Accumulated Penalty</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order._id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                                        <td className="p-4 space-y-1">
                                            <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">#{order.orderNumber}</div>
                                            <div className="text-[10px] text-slate-405 font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Due {new Date(order.endDate).toLocaleDateString()}
                                            </div>
                                        </td>

                                        <td className="p-4 space-y-1">
                                            <div className="font-semibold text-slate-700 dark:text-slate-300">{order.customerName}</div>
                                            <div className="text-[10px] text-slate-405 flex flex-col">
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {order.customerPhone || 'N/A'}</span>
                                            </div>
                                        </td>

                                        <td className="p-4 space-y-1">
                                            <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-500 border border-rose-500/10">
                                                {order.daysLate} Days Late
                                            </span>
                                            <div className="text-[10px] text-rose-500 dark:text-rose-400 mt-1.5 font-medium">
                                                Penalty rate: ${order.dailyPenaltyRate.toFixed(2)}/day
                                            </div>
                                        </td>

                                        <td className="p-4 space-y-1">
                                            <div className="font-semibold">${order.depositAmount.toFixed(2)}</div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${order.depositStatus === 'Held'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'
                                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                                                }`}>
                                                Deposit: {order.depositStatus}
                                            </span>
                                        </td>

                                        <td className="p-4 space-y-1">
                                            <div className="font-black text-rose-500 text-sm font-mono">${order.accumulatedPenalty.toFixed(2)}</div>
                                            <div className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Unpaid Penalty</div>
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRecordPayment(order._id)}
                                                    disabled={payingId === order._id}
                                                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold tracking-wide shadow-sm flex items-center gap-1 transition-all"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {payingId === order._id ? '⏳ Record...' : 'Verify Return Payment'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LateReturns;
