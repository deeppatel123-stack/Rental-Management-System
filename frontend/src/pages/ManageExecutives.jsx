import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, UserCheck, ShieldCheck, Mail, Phone, Lock, Calendar, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

export const ManageExecutives = () => {
    const { showToast } = useToast();
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form inputs
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    const fetchExecutives = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/employees');
            if (res.data.success) {
                const list = (res.data.employees || []).filter(emp => emp.role === 'Delivery Executive');
                setExecutives(list);
            }
        } catch (err) {
            showToast('Failed to fetch delivery executives list.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExecutives();
    }, []);

    const handleCreateExecutive = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) {
            showToast('Please fill out all required fields', 'warning');
            return;
        }

        setActionLoading(true);
        try {
            const res = await api.post('/auth/employees', {
                name,
                email,
                password,
                phone
            });
            if (res.data.success) {
                showToast(res.data.message || 'Executive added successfully!', 'success');
                // Reset form
                setName('');
                setEmail('');
                setPassword('');
                setPhone('');
                // Refresh list
                fetchExecutives();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add delivery executive.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Logistic Executive Management</h2>
                <p className="text-xs text-slate-500">Register new delivery executives and verify active dispatch personnel.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 glass-card p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 h-fit shadow-xl">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <UserPlus className="w-5 h-5 text-brand-500" />
                        <h3 className="font-extrabold text-sm text-slate-200">Add Delivery Executive</h3>
                    </div>

                    <form onSubmit={handleCreateExecutive} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5 text-brand-500" />
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter full name"
                                className="w-full px-4 py-2.5 text-xs glass-input"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-brand-500" />
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="email@company.com"
                                className="w-full px-4 py-2.5 text-xs glass-input"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-brand-500" />
                                Password *
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter access password"
                                className="w-full px-4 py-2.5 text-xs glass-input"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-brand-500" />
                                Contact Number
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+91 XXXXX XXXXX"
                                className="w-full px-4 py-2.5 text-xs glass-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                            {actionLoading ? '⏳ Adding Personnel...' : '🔋 Register Executive'}
                        </button>
                    </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-xs text-slate-450 uppercase tracking-widest">Active Dispatch Executives ({executives.length})</h3>
                    </div>

                    {loading ? (
                        <p className="text-xs text-slate-400 animate-pulse">Querying fleet registers...</p>
                    ) : executives.length === 0 ? (
                        <div className="glass-panel text-center py-20 rounded-3xl text-sm text-slate-450 border border-slate-805 bg-slate-900/10">
                            No delivery executives found. Register one on the left to start assigning logistics jobs!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {executives.map(exec => (
                                <motion.div
                                    key={exec._id}
                                    whileHover={{ y: -2 }}
                                    className="p-5 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-start justify-between gap-4 shadow-sm"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm capitalize">{exec.name.replace(' (Executive)', '')}</h4>
                                        </div>

                                        <div className="space-y-1 text-[10.5px] text-slate-450">
                                            <p className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5 text-slate-500" /> {exec.email}
                                            </p>
                                            {exec.phone && (
                                                <p className="flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {exec.phone}
                                                </p>
                                            )}
                                            <p className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Joined {new Date(exec.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/10">Active</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageExecutives;
