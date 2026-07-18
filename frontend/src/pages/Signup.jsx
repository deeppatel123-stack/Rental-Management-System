import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const Signup = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('Customer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) return setError('Fill in required fields details');

        setError('');
        setLoading(true);
        try {
            const response = await api.post('/auth/register', { name, email, password, phone, role });
            if (response.data.success) {
                if (role === 'Super Admin') {
                    showToast('Super Admin account registered! Please log in directly.', 'success');
                    navigate('/login');
                } else {
                    showToast('Registration successful! Verification code sent.', 'success');
                    navigate('/verify-email', { state: { email } });
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registrations failed. Email might exist.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-6 relative bg-slate-50 dark:bg-slate-950">
            <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl animate-pulse-slow"></div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-panel rounded-3xl shadow-xl space-y-6 z-10 border border-slate-205 dark:border-slate-800/10"
            >
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create Portal Account</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">Join our client operations dashboard</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Alice Smith"
                            className="w-full glass-input"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Security Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alice@smith.com"
                            className="w-full glass-input"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91"
                            className="w-full glass-input"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Portal Access Role *</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full glass-input cursor-pointer"
                            required
                        >
                            <option value="Customer" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">Customer (Client)</option>
                            <option value="Rental Partner" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">Rental Partner</option>
                            <option value="Super Admin" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">Super Admin</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Security Password *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full glass-input pr-10"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-md text-xs tracking-wider"
                    >
                        {loading ? 'Submitting Forms...' : 'Register Account'}
                    </button>
                </form>

                <div className="text-center">
                    <span className="text-xs text-slate-400">Already registered? </span>
                    <Link to="/login" className="text-xs font-bold text-brand-500 hover:underline">
                        Log In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
export default Signup;
