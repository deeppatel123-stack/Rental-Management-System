import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, CartesianGrid
} from 'recharts';
import { DollarSign, Box, Percent, Wrench, Sparkles, BrainCircuit } from 'lucide-react';

export const AdminDashboard = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                if (res.data.success) {
                    setMetrics(res.data);
                }
            } catch (err) {
                console.error('Error fetching analytics details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center animate-pulse space-y-6">
                <div className="h-32 bg-slate-200/50 rounded-3xl"></div>
                <div className="h-64 bg-slate-200 rounded-3xl"></div>
            </div>
        );
    }

    const stats = metrics?.stats || {};
    const isAdmin = user?.role === 'Admin';

    const kpis = isAdmin ? [
        { label: 'Total Earnings', val: `$${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-indigo-500 bg-indigo-500/10' },
        { label: 'Pending Deposits Hold', val: `$${(stats.depositsHeld || 0).toLocaleString()}`, icon: Percent, color: 'text-emerald-500 bg-emerald-500/10' },
        { label: 'Active Rentals Checkout', val: stats.activeRentals || 0, icon: Box, color: 'text-blue-500 bg-blue-500/10' },
        { label: 'Overdue Rentals', val: stats.overdueRentals || 0, icon: Wrench, color: 'text-rose-500 bg-rose-500/10' }
    ] : [
        { label: 'Active Rentals', val: stats.activeRentals || 0, icon: Box, color: 'text-blue-500 bg-blue-500/10' },
        { label: 'Overdue Rentals', val: stats.overdueRentals || 0, icon: Wrench, color: 'text-rose-500 bg-rose-500/10' },
        { label: 'Pending Refunds Check', val: stats.refundPending || 0, icon: Percent, color: 'text-amber-500 bg-amber-500/10' },
        { label: 'Total Placed Agreements', val: stats.totalRentals || 0, icon: Sparkles, color: 'text-indigo-500 bg-indigo-500/10' }
    ];

    return (
        <div className="p-6 space-y-8">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Business Intelligence Operations</h2>
                <p className="text-xs text-slate-500">Real-time statistics regarding rental yields, inventory allocations, and machine diagnostics forecasts.</p>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${k.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-semibold">{k.label}</span>
                                <p className="text-lg font-black text-slate-900 dark:text-white pt-0.5">{k.val}</p>
                            </div>
                        </div>
                    );
                })}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


                {isAdmin ? (
                    <div className="lg:col-span-2 glass-panel rounded-3xl p-5 space-y-6">
                        <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">Monthly Rental Earnings</h3>

                        <div className="h-64 w-full text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics?.charts?.monthlyRevenue || []}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-2 glass-panel rounded-3xl p-5 space-y-6">
                        <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">Quick Logistics Shortcuts</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <Link to="/admin/rentals" className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/5 hover:border-brand-500/20 rounded-2xl flex flex-col justify-between h-28 group transition-all">
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Logistics workflow</span>
                                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors">Confirm Contracts &rarr;</span>
                            </Link>
                            <Link to="/admin/pickups" className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/5 hover:border-brand-500/20 rounded-2xl flex flex-col justify-between h-28 group transition-all">
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Warehouse checklist</span>
                                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors">Process Pickups &rarr;</span>
                            </Link>
                            <Link to="/admin/returns" className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/5 hover:border-brand-500/20 rounded-2xl flex flex-col justify-between h-28 group transition-all">
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Quality inspection</span>
                                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors">Process Returns &rarr;</span>
                            </Link>
                            <Link to="/admin/tickets" className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/5 hover:border-brand-500/20 rounded-2xl flex flex-col justify-between h-28 group transition-all">
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Support communication</span>
                                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors">Resolve Tickets &rarr;</span>
                            </Link>
                        </div>
                    </div>
                )}


                <div className="glass-panel rounded-3xl p-5 space-y-6">
                    <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3 flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                        <BrainCircuit className="w-5 h-5 animate-pulse" /> Predictive AI Insights
                    </h3>

                    <div className="space-y-4 text-xs">

                        <div className="p-4 bg-brand-500/10 border border-brand-505/15 rounded-2xl space-y-2">
                            <span className="font-extrabold text-[10px] text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 fill-current" /> High season demand forecast
                            </span>
                            <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                                Sony FX3 Cinema Cameras utilization rates are forecasted to spike by 38% next weekend. Recommended markup options adjustments applied.
                            </p>
                        </div>


                        <div className="border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl space-y-2">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                ⚙️ Predictive Damage Alarms
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                - DJI-R4D-SN-827361: Gimbal laser sensor failure probability critical. Schedule maintenance inspections.
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                - SONY-FX3-SN-410982: Battery charging cycles exhausted. Replace unit within 15 days.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AdminDashboard;
