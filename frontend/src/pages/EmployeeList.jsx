import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Users, Package, CheckCircle, XCircle, Phone, Mail, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/auth/partners');
                if (res.data.success) setEmployees(res.data.employees);
            } catch (err) {
                console.error('Failed to load employees', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-200/50 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Rental Partner Directory</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        View all rental partners, their verification status, and product contributions.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-xl">
                    <Users className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                        {employees.length} Rental Partners
                    </span>
                </div>
            </div>

            {employees.length === 0 ? (
                <div className="glass-panel rounded-3xl py-20 text-center space-y-3 text-slate-400">
                    <Users className="w-10 h-10 mx-auto opacity-30" />
                    <p className="font-semibold text-sm">No rental partners registered yet.</p>
                    <p className="text-xs">Register partner accounts from the admin panel.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {employees.map(emp => (
                        <div key={emp._id} className="glass-card rounded-2xl overflow-hidden">
                            {/* Main employee row */}
                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                                        {emp.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{emp.name}</h4>
                                            {emp.isVerified ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                    <XCircle className="w-2.5 h-2.5" /> Unverified
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {emp.email}
                                            </span>
                                            {emp.phone && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {emp.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Product count badge */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <Package className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                                            {emp.productCount} Products Added
                                        </span>
                                    </div>
                                    {/* Joined date */}
                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                                        Joined {new Date(emp.createdAt).toLocaleDateString()}
                                    </span>
                                    {/* Expand toggle */}
                                    {emp.recentProducts?.length > 0 && (
                                        <button
                                            onClick={() => setExpanded(expanded === emp._id ? null : emp._id)}
                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/10 text-slate-500 hover:text-brand-500 transition-colors"
                                        >
                                            {expanded === emp._id
                                                ? <ChevronUp className="w-4 h-4" />
                                                : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded product list */}
                            {expanded === emp._id && emp.recentProducts?.length > 0 && (
                                <div className="border-t border-slate-200/50 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-900/20 px-5 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                            Recently Added Products
                                        </span>
                                        <Link
                                            to="/admin/products"
                                            className="text-[10px] font-bold text-brand-500 hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Manage All Products
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {emp.recentProducts.map(p => (
                                            <div
                                                key={p._id}
                                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/10"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-4 h-4 text-brand-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                                                    <p className="text-[10px] text-slate-400">{p.category}</p>
                                                </div>
                                                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-black border flex-shrink-0
                                                    ${p.status === 'Available' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                                        : 'bg-slate-200/50 border-slate-300 text-slate-400'}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {emp.productCount > 5 && (
                                        <p className="text-[10px] text-slate-400 text-center mt-3">
                                            +{emp.productCount - 5} more products added by this partner
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmployeeList;
