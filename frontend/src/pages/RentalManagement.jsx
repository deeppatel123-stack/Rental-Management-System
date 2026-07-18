import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RefreshCw } from 'lucide-react';


export const RentalManagement = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [updatingId, setUpdatingId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await api.get('/rentals');
            if (res.data.success) {
                setOrders(res.data.orders);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        // Real-time: auto-refresh when new customer order arrives
        const handleNewOrder = () => fetchOrders(true);
        window.addEventListener('rms:new_order', handleNewOrder);

        // Fallback polling every 30s (in case socket event misses)
        const poll = setInterval(() => fetchOrders(true), 30000);

        return () => {
            window.removeEventListener('rms:new_order', handleNewOrder);
            clearInterval(poll);
        };
    }, [fetchOrders]);

    const handleConfirmOrder = async (orderId) => {
        await handleStatusChange(orderId, 'Confirmed');
    };

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            const res = await api.patch(`/rentals/${orderId}/status`, { status: newStatus });
            if (res.data.success) {
                showToast(`Status updated to "${newStatus}" — customer tracker synced!`, 'success');
                fetchOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Status update failed.', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    // 'Pending' tab catches legacy 'Quotation' orders too
    // 'Delivered' tab catches legacy 'Returned' orders too
    const filtered = filter === 'All'
        ? orders
        : filter === 'Pending'
            ? orders.filter(o => o.status === 'Pending' || o.status === 'Quotation')
            : filter === 'Delivered'
                ? orders.filter(o => o.status === 'Delivered' || o.status === 'Returned')
                : orders.filter(o => o.status === filter);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Active Rental Agreements Index</h2>
                    <p className="text-xs text-slate-500">Confirm client order requests, review signatures, and verify escrow states.</p>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-500 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="flex gap-2">
                {['All', 'Pending', 'Confirmed', 'Active', 'Delivered', 'Overdue'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === tab
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-500 hover:text-brand-500'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Consulting ledger files...</p>
            ) : filtered.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-3xl text-sm text-slate-400 font-semibold">
                    No matching contracts found.
                </div>
            ) : (
                <div className="glass-panel rounded-3xl overflow-x-auto border border-slate-205 dark:border-slate-800/10">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-455 uppercase font-black tracking-wider whitespace-nowrap">
                                <th className="px-5 py-3.5">Contract Agreement</th>
                                <th className="px-5 py-3.5">Customer details</th>
                                <th className="px-5 py-3.5">Booking Days</th>
                                <th className="px-5 py-3.5 text-center">Settlement Status</th>
                                <th className="px-5 py-3.5 text-center">Escrow Value</th>
                                <th className="px-5 py-3.5">Signature Name</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                            {filtered.map(order => (
                                <tr key={order._id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                                    <td className="px-5 py-4 min-w-[200px] max-w-[320px]">
                                        <span className="text-[10px] text-slate-400 font-mono block font-extrabold uppercase whitespace-nowrap">ID: {order.orderNumber}</span>
                                        <div className="font-bold text-slate-900 dark:text-white break-words mt-0.5">
                                            {(() => {
                                                if (!order.items || !order.items.length) return 'Rented items';
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
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className="font-bold block text-slate-850 dark:text-slate-205">{order.customer?.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{order.customer?.email}</span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-550 dark:text-slate-350 whitespace-nowrap">
                                        {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4 text-center whitespace-nowrap">
                                        <select
                                            value={order.status}
                                            disabled={updatingId === order._id}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            className={`text-[10px] px-2.5 py-1.5 rounded-lg font-black border cursor-pointer outline-none transition-all appearance-none text-center
                                                ${order.status === 'Overdue' ? 'bg-red-500/15 border-red-500 text-red-500'
                                                    : (order.status === 'Delivered' || order.status === 'Returned') ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                                                        : order.status === 'Active' ? 'bg-teal-500/15 border-teal-500 text-teal-600'
                                                            : (order.status === 'Pending' || order.status === 'Quotation') ? 'bg-amber-500/15 border-amber-500 text-amber-600'
                                                                : 'bg-brand-500/15 border-brand-500 text-brand-500'}
                                                ${updatingId === order._id ? 'opacity-50 cursor-wait' : 'hover:opacity-80'}`}
                                        >
                                            {/* Always include current status so React select shows correct value */}
                                            {[
                                                ...new Set([
                                                    order.status,
                                                    'Pending', 'Confirmed', 'Active', 'Delivered', 'Overdue'
                                                ])
                                            ].map(s => (
                                                <option key={s} value={s}>
                                                    {s === 'Returned' ? 'Delivered (old)' : s}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-5 py-4 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        ${(order.totalAmount || 0).toFixed(2)}
                                    </td>
                                    <td className="px-5 py-4 italic font-serif text-slate-500 text-xs whitespace-nowrap">
                                        {order.agreementSigned ? (order.customerSignature || 'E-Signed') : 'Unsigned'}
                                    </td>
                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                        {(order.status === 'Pending' || order.status === 'Quotation') ? (
                                            <button
                                                onClick={() => handleConfirmOrder(order._id)}
                                                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-lg text-[10px]"
                                            >
                                                Confirm Booking
                                            </button>
                                        ) : order.status === 'Confirmed' ? (
                                            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">Approved &amp; Ready</span>
                                        ) : (order.status === 'Delivered' || order.status === 'Returned') ? (
                                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">✓ Delivered</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-semibold font-mono capitalize">{order.status.toLowerCase()}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
export default RentalManagement;
