import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { Shield, KeyRound, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return setError('Enter credentials details');

        setError('');
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password, rememberMe });
            if (response.data.success) {
                const { user, token, refreshToken } = response.data;
                loginUser(user, token, refreshToken);


                if (user.role === 'Customer') {
                    navigate('/');
                } else {
                    navigate('/admin');
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Login credentials failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-6 relative bg-slate-50 dark:bg-slate-950">
            <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl animate-pulse-slow"></div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-panel rounded-3xl shadow-xl space-y-6 z-10 border border-slate-205 dark:border-slate-800/10"
            >
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Workspace Portal</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-400">Authenticating access protocols</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Security Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full glass-input"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                            <Link to="/forgot-password" className="text-[10px] font-semibold text-brand-500 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full glass-input"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                                className="w-4 h-4 accent-brand-500"
                            />
                            <span className="text-xs text-slate-500">Remember credentials</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-md text-xs tracking-wider"
                    >
                        {loading ? 'Validating Session...' : 'Authenticate'}
                    </button>
                </form>

                <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <span className="relative px-3 text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-[#0c204000] backdrop-blur-xl">Quick Demo Login</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setEmail('bhaumikkothiya1@gmail.com');
                            setPassword('Bhaumik@1910');
                        }}
                        className="py-2.5 px-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider"
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEmail('deepp0261@gmail.com');
                            setPassword('Deep@123');
                        }}
                        className="py-2.5 px-2 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider"
                    >
                        Partner
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEmail('deepp0203@gmail.com');
                            setPassword('Deep@123');
                        }}
                        className="py-2.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider"
                    >
                        Customer
                    </button>
                </div>

                <div className="text-center">
                    <span className="text-xs text-slate-450">Need an account? </span>
                    <Link to="/signup" className="text-xs font-bold text-brand-500 hover:underline">
                        Register Portal User
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
export default Login;
