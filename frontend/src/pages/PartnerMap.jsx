import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Navigation, Watch, DollarSign, RefreshCw, ShoppingBag, User } from 'lucide-react';
import { GoogleDistanceMap } from '../components/GoogleDistanceMap';

export const PartnerMap = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await api.get('/rentals');
            if (res.data.success) {
                // Filter only Delivery orders that have a valid shipping address
                const deliveryOrders = (res.data.orders || []).filter(
                    o => o.deliveryType === 'Delivery' && o.shippingAddress
                );
                setOrders(deliveryOrders);
                if (deliveryOrders.length > 0 && !selectedOrderId) {
                    setSelectedOrderId(deliveryOrders[0]._id);
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch logistics delivery orders.', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedOrderId, showToast]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const selectedOrder = orders.find(o => o._id === selectedOrderId);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Logistics Delivery Map Cockpit</h2>
                    <p className="text-xs text-slate-500">Plan delivery routes, track destination distance, and dispatch items to customers.</p>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-500 hover:text-brand-500 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Loading logistics agreements and maps routing...</p>
            ) : orders.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-3xl text-sm text-slate-400 font-semibold">
                    No active delivery orders found.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Panel: Delivery Orders Index list */}
                    <div className="lg:col-span-4 space-y-3 max-h-[640px] overflow-y-auto pr-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Deliveries ({orders.length})</span>
                        <div className="space-y-2">
                            {orders.map(order => {
                                const isSelected = order._id === selectedOrderId;
                                return (
                                    <div
                                        key={order._id}
                                        onClick={() => setSelectedOrderId(order._id)}
                                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${isSelected
                                            ? 'bg-brand-500/10 border-brand-500/30'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-[9px] font-mono font-black text-brand-600 dark:text-brand-400 bg-brand-500/5 px-2 py-0.5 rounded border border-brand-500/15">
                                                #{order.orderNumber}
                                            </span>
                                            <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider
                                                ${order.status === 'Overdue' ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                    : (order.status === 'Delivered' || order.status === 'Completed') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-505'
                                                        : order.status === 'Active' ? 'bg-teal-500/10 border-teal-500/20 text-teal-600'
                                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}>
                                                {order.status === 'Returned' ? 'Delivered' : order.status}
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-1">
                                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                {order.customer?.name || 'Guest User'}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-medium truncate">
                                                📍 {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel: Selected Order Details & Live Google Map */}
                    <div className="lg:col-span-8 space-y-4">
                        {selectedOrder ? (
                            <div className="glass-panel p-5 rounded-3xl space-y-5 border border-slate-205 dark:border-slate-800/10">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                                    <div>
                                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150">
                                            Order Routing Detail: #{selectedOrder.orderNumber}
                                        </h3>
                                        <p className="text-[10.5px] text-slate-400 mt-0.5">
                                            Agreement total: <span className="font-bold text-slate-700 dark:text-slate-350">${selectedOrder.totalAmount?.toFixed(2)}</span> ({selectedOrder.agreementSigned ? 'E-Signed Signature' : 'Unsigned'})
                                        </p>
                                    </div>
                                    <div className="text-[10.5px] font-semibold text-slate-500">
                                        Ref ID: <span className="font-mono text-slate-400">{selectedOrder._id}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Recipient Details & Items */}
                                    <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-900 space-y-3">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Recipient Details</h4>
                                        <div className="text-xs space-y-1.5">
                                            <p><span className="text-slate-400">Name:</span> <span className="font-bold">{selectedOrder.customer?.name}</span></p>
                                            <p><span className="text-slate-405">Email:</span> <span className="font-medium text-slate-600 dark:text-slate-300">{selectedOrder.customer?.email}</span></p>
                                            <p><span className="text-slate-405">Address:</span> <span className="font-semibold text-slate-700 dark:text-slate-205">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</span></p>
                                        </div>

                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider pt-2">Contract Items</h4>
                                        <div className="space-y-1.5">
                                            {selectedOrder.items?.map((it, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-700 dark:text-slate-250 flex items-center gap-1.5">
                                                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                                                        {it.name}
                                                    </span>
                                                    <span className="font-black text-brand-500">x{it.quantity || 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stepper overview / status */}
                                    <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-900 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Escrow Status</h4>
                                            <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-slate-450">Payment Status:</span>
                                                <span className="font-bold text-emerald-500">{selectedOrder.paymentStatus}</span>
                                            </div>
                                            <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-slate-450">Agreement Signed:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedOrder.agreementSigned ? 'Signed' : 'Not Signed'}</span>
                                            </div>
                                            {selectedOrder.deliveryFee > 0 && (
                                                <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-slate-450">Delivery Fee Collected:</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">${selectedOrder.deliveryFee.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-4 text-[10.5px] text-slate-450 bg-brand-500/5 p-3 rounded-xl border border-brand-500/10">
                                            ℹ️ Route is rendered from partner dispatch warehouse base directly to customer delivery address.
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-extrabold text-xs text-slate-400 flex items-center gap-1">📍 Live Route Path: SG Highway &rarr; Customer Destination</h4>
                                    <GoogleDistanceMap
                                        shippingAddress={selectedOrder.shippingAddress}
                                        deliveryType="Delivery"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-slate-205 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 font-bold text-xs bg-white dark:bg-slate-950/20 text-center">
                                Select an active delivery to view route details.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerMap;
