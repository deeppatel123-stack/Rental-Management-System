import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !otp || !newPassword) return setError('Please fill in all inputs');
        setError('');
        setMsg('');
        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { email, otp, newPassword });
            if (res.data.success) {
                setMsg('Password updated successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Password update failed. Verify your OTP code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md p-8 glass-panel rounded-3xl shadow-xl space-y-6 border border-slate-205 dark:border-slate-800/10"
            >
                <div className="space-y-1 text-center">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Recover Password</h2>
                    <p className="text-xs text-slate-400">Complete setup of credentials</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                {msg && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>{msg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Email Address</label>
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
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">6-Digit Reset OTP Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="e.g. 192831"
                            maxLength={6}
                            className="w-full glass-input text-center tracking-widest font-mono text-lg font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full glass-input"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-md text-xs tracking-wider"
                    >
                        {loading ? 'Submitting Forms...' : 'Update Password'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
export default ResetPassword;
