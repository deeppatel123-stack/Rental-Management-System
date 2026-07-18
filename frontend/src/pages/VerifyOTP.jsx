import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyOTP = () => {
    const { loginUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !otp) return setError('Please load email & verification code details');

        setError('');
        setLoading(true);
        try {
            const response = await api.post('/auth/verify-email', { email, otp });
            if (response.data.success) {
                const { user, token, refreshToken } = response.data;
                loginUser(user, token, refreshToken);
                if (user.role === 'Customer') {
                    navigate('/');
                } else if (user.role === 'Rental Partner') {
                    navigate('/partner');
                } else {
                    navigate('/admin');
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'OTP verification failed. Double check code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-6 relative bg-slate-50 dark:bg-slate-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md p-8 glass-panel rounded-3xl shadow-xl space-y-6 z-10 border border-slate-205 dark:border-slate-800/10"
            >
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <Eye className="w-6 h-6 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Verify Your Account</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">Verify your email to establish login protocols</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
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
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">6-Digit OTP Verification Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="e.g. 129481"
                            maxLength={6}
                            className="w-full text-center tracking-widest text-lg font-bold font-mono glass-input"
                            required
                        />
                        <p className="text-[10px] text-slate-400 mt-1">If using mock configurations, watch backend terminal console for code logs.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-md text-xs tracking-wider"
                    >
                        {loading ? 'Verifying Verification Code...' : 'Activate Account'}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await api.post('/auth/resend-verification', { email });
                                showToast('OTP code re-sent! Check your email or terminal code logs.', 'success');
                            } catch (err) {
                                showToast(err.response?.data?.message || 'Error occurred.', 'error');
                            }
                        }}
                        className="text-xs font-bold text-brand-500 hover:underline"
                    >
                        Resend Verification Code
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
export default VerifyOTP;
