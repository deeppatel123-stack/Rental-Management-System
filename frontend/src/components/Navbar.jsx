import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingCart, LogOut, Sun, Moon, User, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
    const { user, logoutUser } = useAuth();
    const { cartItems } = useCart();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                    <img src="/favicon.svg" alt="logo" className="w-8 h-8 object-contain" />
                    PRIME RENTALS
                </Link>
            </div>

            <div className="flex items-center gap-4">
                
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/20 text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                
                {user?.role === 'Customer' && (
                    <Link
                        to="/cart"
                        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/20 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-all"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {cartItems.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                                {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
                            </span>
                        )}
                    </Link>
                )}

                
                {user && (
                    <Link
                        to={user.role === 'Customer' ? '/dashboard' : '/admin'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-500/20 transition-all"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                )}

                
                {user ? (
                    <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                        <Link to="/profile" className="flex items-center gap-2 group">
                            {user.profileImage ? (
                                <img
                                    src={`http://localhost:5000${user.profileImage}`}
                                    alt="avatar"
                                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'; }}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold font-mono font-black">
                                    {(user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors">
                                {user.name || user.email || 'User'}
                            </span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};
export default Navbar;
