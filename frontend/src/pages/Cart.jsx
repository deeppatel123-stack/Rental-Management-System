import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Trash2, Plus, Minus, ArrowRight, Truck, Store, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export const Cart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { cartItems, updateQuantity, removeFromCart, startDate, endDate, setStartDate, setEndDate, totals } = useCart();

    const [deliveryType, setDeliveryType] = useState('Store Pickup');
    const [shippingAddress, setShippingAddress] = useState({
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        country: 'USA'
    });
    const [paymentMethod, setPaymentMethod] = useState('Card');

    const handleNext = () => {
        if (!user) {
            showToast('Sign in to continue checkout.', 'error');
            navigate('/login');
            return;
        }

        navigate('/checkout', { state: { deliveryType, shippingAddress, paymentMethod } });
    };

    if (cartItems.length === 0) {
        return (
            <div className="p-16 text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
                    🛒
                </div>
                <h2 className="text-xl font-extrabold">Your Rental Cart is Empty</h2>
                <p className="text-xs text-slate-450 leading-relaxed">Browse our collection of high-tech cameras, audio setups, and developer workstations to initiate bookings.</p>
                <Link
                    to="/catalog"
                    className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                    Explore Catalogue
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Checkout Booking Statement</h2>
                <p className="text-xs text-slate-500">Configure logistics preferences and evaluate pricing quotes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-6">

                    <div className="glass-panel rounded-3xl p-5 space-y-4">
                        <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">Selected Gear</h3>

                        <div className="divide-y divide-slate-100 dark:divide-slate-850">
                            {cartItems.map(item => (
                                <div key={item._id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/5 overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=150'}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=150'; }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-semibold pt-0.5">${item.dailyRate}/day Rate • ${item.securityDeposit} Deposit</p>
                                        </div>
                                    </div>


                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-white/40 dark:bg-slate-950/20">
                                            <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <button onClick={() => removeFromCart(item._id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                    <div className="glass-panel rounded-3xl p-5 space-y-6">
                        <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">Logistics Preference</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setDeliveryType('Store Pickup')}
                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${deliveryType === 'Store Pickup'
                                    ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 text-brand-655 dark:text-brand-400 font-bold'
                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 font-medium'
                                    }`}
                            >
                                <Store className="w-5 h-5" />
                                <span className="text-xs">Self Collect at Store</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setDeliveryType('Delivery')}
                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${deliveryType === 'Delivery'
                                    ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 text-brand-655 dark:text-brand-400 font-bold'
                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 font-medium'
                                    }`}
                            >
                                <Truck className="w-5 h-5" />
                                <span className="text-xs">Express Courier Delivery</span>
                            </button>
                        </div>


                        {deliveryType === 'Delivery' && (
                            <div className="space-y-4 pt-2">
                                <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-brand-500" /> Shipping Destination Address
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-400 font-semibold">Street</span>
                                        <input
                                            type="text"
                                            value={shippingAddress.street}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                            className="w-full glass-input text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-400 font-semibold">City</span>
                                        <input
                                            type="text"
                                            value={shippingAddress.city}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                            className="w-full glass-input text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-400 font-semibold">State</span>
                                        <input
                                            type="text"
                                            value={shippingAddress.state}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                                            className="w-full glass-input text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-400 font-semibold">Zip Code</span>
                                        <input
                                            type="text"
                                            value={shippingAddress.zipCode}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                                            className="w-full glass-input text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                <div className="space-y-6">

                    <div className="glass-panel rounded-3xl p-5 space-y-4">
                        <h3 className="font-extrabold text-sm">Rental Calendar Period</h3>
                        <div className="space-y-3 text-xs">
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-400">From Date:</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="glass-input text-xs py-2 w-full font-bold focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-400">To Date:</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="glass-input text-xs py-2 w-full font-bold focus:outline-none"
                                />
                            </div>
                            <div className="pt-2 flex justify-between items-center text-xs font-semibold">
                                <span>Computed Days:</span>
                                <span className="text-brand-500 font-extrabold">{totals.days} Days Rent</span>
                            </div>
                        </div>
                    </div>


                    <div className="glass-panel rounded-3xl p-5 space-y-4">
                        <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">Billing Estimate</h3>

                        <div className="space-y-3.5 text-xs">
                            <div className="flex justify-between text-slate-500">
                                <span>Rental Subtotal:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">${totals.subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>Sales Tax (8% estimation):</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">${totals.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-3">
                                <span>Security Deposit Hold:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-450">${totals.securityHold.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-sm font-black pt-1">
                                <span>Estimated Total:</span>
                                <span className="text-slate-900 dark:text-white">${totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <span className="text-[10px] text-slate-400 block pb-3 text-center">
                                * Note: Total charges include refundable deposit.
                            </span>
                            <button
                                onClick={handleNext}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                            >
                                Go to Payment & Signature <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Cart;
