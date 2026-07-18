import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserX, Mail, Phone, CheckCircle, XCircle, ShoppingBag, Trash2, AlertTriangle } from 'lucide-react';

export const CustomerList = () => {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [search, setSearch] = useState('');

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/auth/customers');
            if (res.data.success) setCustomers(res.data.customers);
        } catch (err) {
            console.error('Failed to load customers', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            const res = await api.delete(`/auth/customers/${id}`);
            if (res.data.success) {
                showToast(res.data.message, 'success');
                setCustomers(prev => prev.filter(c => c._id !== id));
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed.', 'error');
        } finally {
            setDeletingId(null);
            setConfirmId(null);
        }
    };

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-8 space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-200/50 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Customer Directory</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage registered customers — view their order history and remove inactive accounts.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <UserX className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                        {customers.length} Customers
                    </span>
                </div>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full max-w-sm px-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-brand-500 transition-colors"
            />

            {filtered.length === 0 ? (
                <div className="glass-panel rounded-3xl py-20 text-center space-y-3 text-slate-400">
                    <UserX className="w-10 h-10 mx-auto opacity-30" />
                    <p className="font-semibold text-sm">No customers found.</p>
                </div>
            ) : (
                <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/10">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                                <th className="px-5 py-3.5">Customer</th>
                                <th className="px-5 py-3.5 hidden sm:table-cell">Contact</th>
                                <th className="px-5 py-3.5 text-center">Status</th>
                                <th className="px-5 py-3.5 text-center">Orders</th>
                                <th className="px-5 py-3.5 text-center">Active</th>
                                <th className="px-5 py-3.5 text-center">Joined</th>
                                <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                            {filtered.map(c => (
                                <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                                    {/* Name & avatar */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                                {c.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{c.name}</span>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-5 py-4 hidden sm:table-cell">
                                        <div className="space-y-0.5">
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Mail className="w-3 h-3" /> {c.email}
                                            </span>
                                            {c.phone && (
                                                <span className="flex items-center gap-1 text-slate-400">
                                                    <Phone className="w-3 h-3" /> {c.phone}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Verified */}
                                    <td className="px-5 py-4 text-center">
                                        {c.isVerified ? (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                <CheckCircle className="w-2.5 h-2.5" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                <XCircle className="w-2.5 h-2.5" /> Unverified
                                            </span>
                                        )}
                                    </td>

                                    {/* Total orders */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                                            <ShoppingBag className="w-3 h-3" /> {c.orderCount}
                                        </div>
                                    </td>

                                    {/* Active orders */}
                                    <td className="px-5 py-4 text-center">
                                        {c.activeOrders > 0 ? (
                                            <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                                {c.activeOrders} Active
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-semibold">—</span>
                                        )}
                                    </td>

                                    {/* Joined */}
                                    <td className="px-5 py-4 text-center text-slate-400 whitespace-nowrap">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>

                                    {/* Delete action */}
                                    <td className="px-5 py-4 text-right">
                                        {confirmId === c._id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Sure?
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(c._id)}
                                                    disabled={deletingId === c._id}
                                                    className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === c._id ? 'Deleting...' : 'Yes, Delete'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmId(null)}
                                                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmId(c._id)}
                                                disabled={c.activeOrders > 0}
                                                title={c.activeOrders > 0 ? 'Cannot delete — customer has active orders' : 'Delete customer'}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-[10px] font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
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

export default CustomerList;
