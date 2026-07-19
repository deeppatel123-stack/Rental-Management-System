import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Calendar, AlertCircle, Bookmark, ArrowRight, Laptop } from 'lucide-react';


export const RentalCalendar = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rentals/my-rentals');
            if (res.data.success) {
                setOrders(res.data.orders);
                generateNotifications(res.data.orders);
            }
        } catch (err) {
            console.error('Failed to load calendar events:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateNotifications = (rentalOrders) => {
        const alerts = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        rentalOrders.forEach(o => {
            if (['Active', 'Delivered', 'Overdue'].includes(o.status)) {
                const returnDate = new Date(o.endDate);
                returnDate.setHours(0, 0, 0, 0);

                const diffTime = returnDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const itemsStr = o.items.map(it => it.name).join(', ');

                if (diffDays === 0) {
                    alerts.push({
                        type: 'danger',
                        message: `⚠️ RETURN DUE TODAY: Your rental for "${itemsStr}" (Order #${o.orderNumber}) is due today! Return it back to avoid overdue daily penalties.`
                    });
                } else if (diffDays === 1) {
                    alerts.push({
                        type: 'warning',
                        message: `⚠️ RETURN DUE TOMORROW: Remember to return "${itemsStr}" (Order #${o.orderNumber}) tomorrow.`
                    });
                } else if (diffDays < 0) {
                    alerts.push({
                        type: 'overdue',
                        message: `🚨 OVERDUE NOTICE: Rental "${itemsStr}" (Order #${o.orderNumber}) is overdue by ${Math.abs(diffDays)} day(s)! Settle penalty fees now.`
                    });
                }
            }
        });
        setNotifications(alerts);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Get calendar days for CURRENT month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    return (
        <div className="p-6 space-y-6 w-full max-w-5xl mx-auto animate-fade-in">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-brand-500" />
                    Your Rental Calendar
                </h2>
                <p className="text-xs text-slate-500">Track key operation pickup and return deadlines, schedules mapping, and return alert reminders.</p>
            </div>



            {loading ? (
                <div className="text-center py-20 text-xs text-slate-405 animate-pulse">Running calendar grids compilation...</div>
            ) : (
                <div className="glass-panel p-6 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center bg-slate-900/5 dark:bg-slate-900/60 px-4 py-3 rounded-2xl border border-slate-200/5">
                        <span className="text-xs font-extrabold uppercase text-slate-400">Monthly View</span>
                        <span className="text-xs font-black uppercase text-brand-500">
                            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="grid grid-cols-7 gap-3 text-center text-xs">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="font-extrabold py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-450">{day}</div>
                        ))}
                        {(() => {
                            const cells = [];
                            // Add pad days
                            for (let i = 0; i < firstDayOfWeek; i++) {
                                cells.push(<div key={`pad-${i}`} className="min-h-[85px] bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl opacity-20 border border-dashed border-slate-250 dark:border-slate-800" />);
                            }

                            // Add actual day cells
                            for (let day = 1; day <= daysInMonth; day++) {
                                const isToday = now.getDate() === day;

                                // Find any orders with start Date or end Date matching this day
                                const startsToday = orders.filter(o => {
                                    const d = new Date(o.startDate);
                                    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                                });

                                const endsToday = orders.filter(o => {
                                    const d = new Date(o.endDate);
                                    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                                });

                                cells.push(
                                    <div key={`day-${day}`} className={`min-h-[85px] p-2 rounded-2xl border flex flex-col justify-between transition-colors ${isToday
                                        ? 'bg-brand-500/10 border-brand-500/40 ring-1 ring-brand-500/20'
                                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-205/5 hover:border-slate-350 dark:hover:border-slate-700'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            {isToday && <span className="text-[7.5px] uppercase font-black px-1.5 py-0.25 bg-brand-500 text-white rounded">Today</span>}
                                            <span className={`text-[10px] font-black ml-auto ${isToday ? 'text-brand-550 font-bold scale-110' : 'text-slate-400'}`}>{day}</span>
                                        </div>

                                        <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[50px] scrollbar-none">
                                            {startsToday.map(o => (
                                                <span key={`s-${o._id}`} className="block text-[8px] bg-emerald-500 text-white font-extrabold rounded px-1.5 py-0.5 truncate text-left" title={`Rental starts: ${o.items.map(it => it.name).join(', ')}`}>
                                                    📦 {o.items[0]?.name || 'Gear Rented'}
                                                </span>
                                            ))}
                                            {endsToday.map(o => (
                                                <span key={`e-${o._id}`} className="block text-[8px] bg-rose-500 text-white font-extrabold rounded px-1.5 py-0.5 truncate text-left" title={`Return deadline: ${o.items.map(it => it.name).join(', ')}`}>
                                                    🏪 Return: {o.items[0]?.name || 'Return'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return cells;
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RentalCalendar;
