import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, Search, Filter, Mail, Calendar, CreditCard, DollarSign, TrendingUp } from 'lucide-react';

export const DepositLedger = () => {
    const { showToast } = useToast();
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All'); // All, Security Deposit, Late Return Penalty

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rentals/late-returns/ledger');
            if (res.data.success) {
                setLedger(res.data.ledger || []);
            }
        } catch (err) {
            showToast('Failed to fetch financial deposit ledger.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    const filteredLedger = ledger.filter(item => {
        const matchesSearch =
            (item.rentalOrder?.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.transactionId || '').toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filterType === 'All' || item.purpose === filterType;

        return matchesSearch && matchesFilter;
    });

    const totalDepositHeld = ledger
        .filter(item => item.purpose === 'Security Deposit')
        .reduce((sum, item) => sum + (item.amount || 0), 0);

    const totalPenaltyCollected = ledger
        .filter(item => item.purpose === 'Late Return Penalty')
        .reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                        <FileText className="w-7 h-7 text-indigo-500" />
                        Security Deposit & Penalty Ledger
                    </h2>
                    <p className="text-xs text-slate-500">Official log of held client safety escrows and collected late returns penalty logs.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-550/15 rounded-xl px-4 py-2 text-xs">
                        <span className="text-emerald-600 dark:text-emerald-450 font-bold">Total Deposit Escrows:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-450 font-mono">${totalDepositHeld.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-550/15 rounded-xl px-4 py-2 text-xs">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">Total Penalties Paid:</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">${totalPenaltyCollected.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Filters panel */}
            <div className="border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Security Deposit', 'Late Return Penalty'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${filterType === type
                                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {type === 'All' ? '📓 All Records' : type === 'Security Deposit' ? '🛡️ Deposit Holds' : '⚠️ Penalty Ledger'}
                            </button>
                        ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by Order #, Customer, Transaction ID..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-205 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-xs text-slate-400 animate-pulse">Retrieving bank journal logs...</div>
                ) : filteredLedger.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-450 bg-slate-50/50 dark:bg-slate-900/10">
                        No financial ledger logs found matching criteria.
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-205 dark:border-slate-850 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-500 font-bold">
                                    <th className="p-4">Transaction ID</th>
                                    <th className="p-4">Order Details</th>
                                    <th className="p-4">Customer Info</th>
                                    <th className="p-4">Purpose / Category</th>
                                    <th className="p-4">Payment Method</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Applied Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLedger.map(item => (
                                    <tr key={item._id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                                        <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {item.transactionId || 'N/A'}
                                        </td>

                                        <td className="p-4 space-y-1">
                                            <div className="font-extrabold text-slate-800 dark:text-slate-100">
                                                {item.rentalOrder ? `#${item.rentalOrder.orderNumber}` : 'Direct Transaction'}
                                            </div>
                                            <div className="text-[10px] text-slate-405 font-medium">
                                                Order status: {item.rentalOrder?.status || 'N/A'}
                                            </div>
                                        </td>

                                        <td className="p-4 space-y-1">
                                            <div className="font-semibold text-slate-705 dark:text-slate-350">{item.customer?.name || 'Guest User'}</div>
                                            <div className="text-[10px] text-slate-405">{item.customer?.email}</div>
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${item.purpose === 'Security Deposit'
                                                    ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/10'
                                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/10'
                                                }`}>
                                                {item.purpose === 'Security Deposit' ? '🛡️ Security Deposit' : '⚠️ Late Penalty'}
                                            </span>
                                        </td>

                                        <td className="p-4 flex items-center gap-1.5 mt-2 text-slate-650 dark:text-slate-300">
                                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                            {item.paymentMethod || 'Card'}
                                        </td>

                                        <td className="p-4 font-black font-mono text-slate-800 dark:text-slate-100 text-sm">
                                            ${(item.amount || 0).toFixed(2)}
                                        </td>

                                        <td className="p-4">
                                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-450 border border-emerald-500/10">
                                                {item.status || 'Completed'}
                                            </span>
                                        </td>

                                        <td className="p-4 font-medium text-slate-405 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {new Date(item.createdAt).toLocaleString()}
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

export default DepositLedger;
