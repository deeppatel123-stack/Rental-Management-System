import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, Calendar, ArrowUpRight, QrCode, Trash2, PackageCheck, CheckCircle2, XCircle, Store, MapPin, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderHistory = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedQR, setSelectedQR] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rentals/my-rentals');
            if (res.data.success) {
                setOrders(res.data.orders);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Live tracker: auto-refresh when partner updates order status
        const handleStatusUpdate = () => fetchOrders();
        window.addEventListener('rms:order_status_updated', handleStatusUpdate);
        return () => window.removeEventListener('rms:order_status_updated', handleStatusUpdate);
    }, []);

    const [signatures, setSignatures] = useState({});
    const [customerOtps, setCustomerOtps] = useState({});
    const [submittingOtp, setSubmittingOtp] = useState({});

    const handleVerifyCustomerOtp = async (orderId, pickupId, otpCode) => {
        if (!otpCode || otpCode.trim().length < 4) {
            showToast('Please enter the OTP code to verify', 'warning');
            return;
        }
        setSubmittingOtp(prev => ({ ...prev, [orderId]: true }));
        try {
            const res = await api.post(`/pickups/${pickupId}/customer-verify`, { otp: otpCode });
            if (res.data.success) {
                showToast('Handoff verified successfully! Enjoy your rental items. Order is now Active.', 'success');
                fetchOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Verification failed. Please try again.', 'error');
        } finally {
            setSubmittingOtp(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleSignAndPay = async (orderId, signature) => {
        if (!signature || !signature.trim()) {
            showToast('Please type your name to sign the agreement', 'warning');
            return;
        }
        try {
            const res = await api.post(`/rentals/${orderId}/sign-agreement`, { signature });
            if (res.data.success) {
                showToast('Payment successful & Contract signed! Order is now Ready for Pickup.', 'success');
                fetchOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error occurred during payment.', 'error');
        }
    };

    const handleRequestReturn = async (orderId) => {
        try {
            const res = await api.post(`/rentals/${orderId}/request-return`);
            if (res.data.success) {
                showToast('Return schedule requested successfully! Partner will check code scan during processing.', 'success');
                fetchOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error requesting returns.', 'error');
        }
    };

    const handleConfirmDelivery = async (orderId) => {
        try {
            const res = await api.post(`/rentals/${orderId}/confirm-delivery`);
            if (res.data.success) {
                showToast('Delivery confirmed successfully! Status updated to Delivered.', 'success');
                fetchOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error confirming delivery.', 'error');
        }
    };



    const handleDeleteOrder = async () => {
        if (!confirmDelete) return;
        try {
            const res = await api.delete(`/rentals/${confirmDelete.orderId}`);
            if (res.data.success) {
                showToast('Order cancelled successfully!', 'success');
                setOrders(prev => prev.filter(o => o._id !== confirmDelete.orderId));
                setConfirmDelete(null);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error cancelling order.', 'error');
            setConfirmDelete(null);
        }
    };

    const filteredOrders = activeTab === 'All'
        ? orders
        : orders.filter(o => o.status === activeTab);

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Your Rental Agreements</h2>
                    <p className="text-xs text-slate-500">Examine invoice summaries, track inspection milestones, and print e-receipt sheets.</p>
                </div>
            </div>


            <div className="flex gap-2.5 overflow-x-auto pb-1 animate-fade-in">
                {['All', 'Pending', 'Confirmed', 'Ready for Pickup', 'Active', 'Overdue', 'Completed'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-500 hover:text-brand-500'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Running timeline queries...</p>
            ) : filteredOrders.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-3xl text-sm font-semibold text-slate-400">
                    No matching contracts found in history.
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredOrders.map(order => (
                        <div key={order._id} className="glass-card rounded-3xl p-6 md:p-8 space-y-6">

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-205 dark:border-slate-800/10 pb-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                                        Agreement ref: #{order.orderNumber}
                                    </span>
                                    <h3 className="font-extrabold text-sm">
                                        {(() => {
                                            if (!order.items || !order.items.length) return 'Rented items';
                                            const grouped = {};
                                            order.items.forEach(it => {
                                                const key = it.name;
                                                if (!grouped[key]) {
                                                    grouped[key] = { name: it.name, quantity: 0 };
                                                }
                                                grouped[key].quantity += (it.quantity || 1);
                                            });
                                            return Object.values(grouped).map(g => `${g.name} (x${g.quantity})`).join(', ');
                                        })()}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 items-center text-[10px] pt-1">
                                        <p className="text-[11px] text-slate-450 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" /> Booked: {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                                        </p>
                                        {['Confirmed', 'Ready for Pickup', 'Picked Up'].includes(order.status) && order.pickupOtp && (
                                            <span className="bg-teal-500/10 text-teal-600 dark:text-teal-450 font-extrabold px-2 py-0.5 rounded-lg border border-teal-500/20">
                                                🔑 Pickup OTP: {order.pickupOtp}
                                            </span>
                                        )}
                                        {['Active', 'Delivered', 'Return Requested', 'Overdue'].includes(order.status) && order.returnOtp && (
                                            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-405 font-extrabold px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                                🔑 Return OTP: {order.returnOtp}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">

                                    <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full border ${order.status === 'Overdue'
                                        ? 'bg-red-500/15 border-red-500 text-red-500'
                                        : order.status === 'Completed' || order.status === 'Delivered'
                                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                                            : 'bg-brand-500/15 border-brand-500 text-brand-500'
                                        }`}>
                                        {order.status}
                                    </span>


                                    <button
                                        onClick={() => setSelectedQR({ code: `RMS-ORDER-${order._id}`, ref: order.orderNumber })}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200/10 rounded-xl text-slate-600 dark:text-slate-300"
                                        title="View QR Code"
                                    >
                                        <QrCode className="w-4 h-4" />
                                    </button>

                                    {/* Delete — only for Pending orders */}
                                    {order.status === 'Pending' && (
                                        <button
                                            onClick={() => setConfirmDelete({ orderId: order._id, orderNumber: order.orderNumber })}
                                            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-xl text-red-500 transition-all"
                                            title="Cancel Order"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}


                                    {order.agreementUrl && (
                                        <a
                                            href={order.agreementUrl.startsWith('http') ? order.agreementUrl : `http://localhost:5000${order.agreementUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-3.5 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-xl whitespace-nowrap"
                                        >
                                            <FileText className="w-4 h-4" /> View Invoice <ArrowUpRight className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {order.pickupId && order.pickupStatus !== 'Completed' && order.pickupStatus !== 'Cancelled' && (
                                <div className="mt-4 p-4 border border-cyan-500/25 bg-cyan-700/5 dark:bg-cyan-500/5 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <ShieldCheck className="w-4.5 h-4.5 text-cyan-505 dark:text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-800 dark:text-slate-205 uppercase">Delivery OTP</p>
                                            <p className="text-[10px] text-slate-500">
                                                {order.pickupOtp
                                                    ? 'Your delivery executive has a code. Share the OTP below with them to confirm receipt.'
                                                    : 'Waiting for executive to arrive and generate the delivery OTP...'}
                                            </p>
                                        </div>
                                    </div>

                                    {order.pickupOtp ? (
                                        <div className="space-y-3">
                                            <p className="text-[10px] text-slate-400">Share this OTP with the delivery executive when they arrive to confirm your handoff.</p>
                                            <div className="p-4 bg-emerald-500/8 border-2 border-emerald-500/25 rounded-2xl text-center space-y-1.5">
                                                <p className="text-[9px] font-black uppercase text-emerald-500 flex items-center justify-center gap-1">
                                                    <ShieldCheck className="w-3 h-3" /> Your Delivery OTP
                                                </p>
                                                <div className="text-3xl font-black font-mono tracking-[0.45em] text-emerald-400 py-1.5">
                                                    {order.pickupOtp}
                                                </div>
                                                <p className="text-[9px] text-slate-400">Show this to your delivery executive. They will enter it to confirm delivery.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-450 italic">Waiting for delivery. The executive will generate an OTP once they are on the way.</p>
                                    )}
                                </div>
                            )}


                            {/* STORE PICKUP: simple status card, no tracker */}
                            {(!order.deliveryType || order.deliveryType === 'Store Pickup') ? (
                                <div className="pt-4 space-y-3">
                                    {/* Pickup info banner */}
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
                                        <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                                            <Store className="w-4 h-4 text-brand-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">Self Collect at Store</p>
                                            <p className="text-[10px] text-slate-400">Visit our store with your order QR code to collect your items.</p>
                                        </div>
                                    </div>

                                    {/* Confirmed & Unpaid → Pay & Sign Contract */}
                                    {order.status === 'Confirmed' && order.paymentStatus === 'Unpaid' && (
                                        <div className="p-4 border border-brand-500/25 bg-brand-500/5 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-4 h-4 text-brand-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">Sign Contract & Complete Payment</p>
                                                    <p className="text-[10px] text-slate-500">Order approved by partner! Sign agreement contract to authorize security deposit hold and complete rental fee payment.</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Type full legal name to e-sign"
                                                    className="flex-1 glass-input text-xs font-serif italic"
                                                    value={signatures[order._id] || ''}
                                                    onChange={e => setSignatures(prev => ({ ...prev, [order._id]: e.target.value }))}
                                                />
                                                <button
                                                    onClick={() => handleSignAndPay(order._id, signatures[order._id])}
                                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-xl shadow-md transition-all whitespace-nowrap"
                                                >
                                                    Pay &amp; E-Sign (${order.totalAmount.toFixed(2)})
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ready for Pickup or Confirmed & Paid */}
                                    {(order.status === 'Ready for Pickup' || (order.status === 'Confirmed' && order.paymentStatus === 'Paid')) && (
                                        <div className="flex items-center gap-3 rounded-2xl border border-teal-400/40 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 px-4 py-3">
                                            <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-teal-500" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-extrabold text-teal-700 dark:text-teal-300">🎉 Ready for Pickup!</p>
                                                <p className="text-[10px] text-slate-500">Please visit the store and show your Order Ref #{order.orderNumber} to collect your rented items.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Active (picked up) → request return */}
                                    {order.status === 'Active' && (
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-brand-400/30 bg-brand-500/5 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                                                    <PackageCheck className="w-4 h-4 text-brand-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-extrabold text-brand-700 dark:text-brand-300">Items collected — rental in progress</p>
                                                    <p className="text-[10px] text-slate-500">Done with your rental? Submit a return request to schedule logistics return check.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRequestReturn(order._id)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-extrabold rounded-xl shadow-md transition-all flex-shrink-0"
                                            >
                                                <PackageCheck className="w-3.5 h-3.5" /> Request Return
                                            </button>
                                        </div>
                                    )}

                                    {/* Delivered */}
                                    {(order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Returned') && (
                                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/5 px-4 py-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">✓ Order Completed &amp; Settled</p>
                                                <p className="text-[10px] text-slate-400">Items returned. Thank you for renting with us!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // DELIVERY: full 4-step tracker
                                (() => {
                                    const rawSteps = [
                                        { label: 'Staff Confirmed', done: order.status !== 'Pending' },
                                        { label: 'Agreement Signed', done: order.agreementSigned },
                                        { label: 'Out for Rental', done: order.status === 'Active' || order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Overdue' || order.status === 'Return Requested' },
                                        { label: 'Settled Closed', done: order.status === 'Completed' || order.status === 'Returned' }
                                    ];
                                    const steps = rawSteps.map((step, idx) => ({
                                        ...step,
                                        done: step.done || rawSteps.slice(idx + 1).some(s => s.done)
                                    }));
                                    const doneCount = steps.filter(s => s.done).length;
                                    const pct = doneCount <= 1 ? 0 : doneCount === 2 ? 33.3 : doneCount === 3 ? 66.6 : 100;

                                    return (
                                        <>
                                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                                                {/* Connecting line backer */}
                                                <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-slate-100 dark:bg-slate-800/60 hidden md:block z-0" />

                                                {/* Active progress line */}
                                                <div
                                                    className="absolute top-8 left-[12.5%] h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 hidden md:block z-0 transition-all duration-700"
                                                    style={{ width: `calc(${pct}% * 0.75)` }}
                                                />

                                                {steps.map((step, idx) => (
                                                    <div key={idx} className="flex flex-col items-center gap-2.5 z-10 w-full md:w-1/4">
                                                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-300 ${step.done
                                                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-none text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-110'
                                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                                                            }`}>
                                                            {step.done ? '✓' : idx + 1}
                                                        </div>
                                                        <span className={`text-[10.5px] font-extrabold ${step.done ? 'text-emerald-555 dark:text-emerald-450' : 'text-slate-400 dark:text-slate-500'}`}>{step.label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Out for delivery / Active → Confirm Receipt */}
                                            {order.status === 'Active' && (
                                                <div className="mt-2 rounded-2xl border border-blue-400/35 bg-blue-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0 animate-pulse">
                                                            <Store className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-extrabold text-blue-700 dark:text-blue-300">🚚 Out for Delivery &amp; Active</p>
                                                            <p className="text-[10.5px] text-slate-500">Your rental is dispatched! Let us know when you safely receive the items.</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleConfirmDelivery(order._id)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-xl shadow-md transition-all flex-shrink-0"
                                                    >
                                                        Confirm Delivery Received
                                                    </button>
                                                </div>
                                            )}

                                            {/* Received / Delivered → Request Return */}
                                            {order.status === 'Delivered' && (
                                                <div className="mt-2 rounded-2xl border border-brand-400/35 bg-brand-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                                                            <PackageCheck className="w-5 h-5 text-brand-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-extrabold text-brand-700 dark:text-brand-300">📦 Delivery Confirmed — Active Rental</p>
                                                            <p className="text-[10.5px] text-slate-500">Enjoy your items! Click below when ready to schedule return pickup collection.</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRequestReturn(order._id)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-extrabold rounded-xl shadow-md transition-all flex-shrink-0"
                                                    >
                                                        <PackageCheck className="w-3.5 h-3.5" /> Request Return
                                                    </button>
                                                </div>
                                            )}

                                            {/* Completed / Settled */}
                                            {(order.status === 'Completed' || order.status === 'Returned') && (
                                                <div className="mt-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/5 p-4 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">✓ Rental Completed &amp; Settled</p>
                                                        <p className="text-[10.5px] text-slate-400">Items received back at our warehouse. Thank you for renting with us!</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()
                            )}
                        </div>
                    ))}
                </div>
            )}


            <AnimatePresence>
                {selectedQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm glass-panel p-6 rounded-3xl text-center space-y-4 glow-primary"
                        >
                            <h3 className="font-extrabold text-sm uppercase">Order Verification QR</h3>
                            <p className="text-[11px] text-slate-450">Show this code to store supervisor during collection pickup / returns inspection check-in.</p>

                            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center border border-slate-200">

                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedQR.code}`}
                                    alt="Agreement code verification"
                                    className="w-full h-full"
                                />
                            </div>

                            <span className="text-[10px] font-mono block text-slate-400">Payload Ref: {selectedQR.code}</span>

                            <button
                                onClick={() => setSelectedQR(null)}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200/10 text-xs font-bold rounded-xl"
                            >
                                Close Portal Popup
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm glass-panel p-6 rounded-3xl space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm">Cancel Order?</h3>
                                    <p className="text-[11px] text-slate-500">#{confirmDelete.orderNumber}</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                This will permanently cancel and remove your order. Inventory will be released back. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200/10 text-xs font-bold rounded-xl transition-all"
                                >
                                    Keep Order
                                </button>
                                <button
                                    onClick={handleDeleteOrder}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                                >
                                    Yes, Cancel It
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};
export default OrderHistory;
