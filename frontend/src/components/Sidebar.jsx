import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home,
    ShoppingBag,
    FileText,
    LifeBuoy,
    User,
    Users,
    UserCheck,
    CalendarRange,
    Truck,
    RotateCcw,
    Settings,
    Cpu
} from 'lucide-react';

export const Sidebar = () => {
    const { user } = useAuth();

    const customerLinks = [
        { label: 'Overview', path: '/dashboard', icon: Home },
        { label: 'Browse Rentals', path: '/catalog', icon: ShoppingBag },
        { label: 'Rental Orders', path: '/orders', icon: FileText },
        { label: 'Support Desk', path: '/support', icon: LifeBuoy },
        { label: 'Setting Profile', path: '/profile', icon: User },
    ];

    const partnerLinks = [
        { label: 'Analytics Panel', path: '/partner', icon: Home },
        { label: 'Rental Contracts', path: '/partner/rentals', icon: CalendarRange },
        { label: 'Logistics Pickups', path: '/partner/pickups', icon: Truck },
        { label: 'Logistics Returns', path: '/partner/returns', icon: RotateCcw },
        { label: 'Customer Tickets', path: '/partner/tickets', icon: LifeBuoy },
        { label: 'Enterprise Suite', path: '/partner/enterprise', icon: Cpu },
    ];

    const adminLinks = [
        { label: 'Analytics Panel', path: '/admin', icon: Home },
        { label: 'Manage Products', path: '/admin/products', icon: ShoppingBag },
        { label: 'Partner Directory', path: '/admin/partners', icon: Users },
        { label: 'Customer Directory', path: '/admin/customers', icon: UserCheck },
        { label: 'Enterprise Suite', path: '/admin/enterprise', icon: Cpu },
        { label: 'Business Settings', path: '/admin/settings', icon: Settings },
    ];

    const links = user?.role === 'Customer' ? customerLinks : (user?.role === 'Rental Partner' ? partnerLinks : adminLinks);

    return (
        <aside className="w-64 h-[calc(100vh-73px)] sticky top-[73px] glass-panel border-r border-slate-205/50 dark:border-slate-800/10 hidden md:flex flex-col p-4">

            <div className="mb-6 px-3 py-2 bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/10 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">Scope Portal</span>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{user?.role} Workspace</h4>
            </div>

            <nav className="flex-1 space-y-1.5">
                {links.map(link => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.path === '/' || link.path === '/admin'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${isActive
                                    ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/15'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-brand-500 dark:hover:text-brand-400'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4 text-current" />
                            {link.label}
                        </NavLink>
                    );
                })}
            </nav>


            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 text-center">
                <p className="text-[9px] text-slate-400 font-medium">RMS App version 1.0.0</p>
            </div>
        </aside>
    );
};
export default Sidebar;
