import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return setError('Please enter your email');
        setError('');
        setMsg('');
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.data.success) {
                setMsg('Reset OTP sent to your email. Check terminal logs if running local.');
                setTimeout(() => {
                    navigate('/reset-password', { state: { email } });
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request reset OTP.');
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
                <div className="space-y-2">
                    <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
                    </Link>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white pt-2">Recover Password</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">We will email a 6-digit OTP code to modify credentials</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                {msg && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl">
                        {msg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Security Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alice@smith.com"
                            className="w-full glass-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-md text-xs tracking-wider"
                    >
                        {loading ? 'Submitting Forms...' : 'Request Reset OTP'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
export default ForgotPassword;
