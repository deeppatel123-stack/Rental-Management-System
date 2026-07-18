import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { cartItems, startDate, endDate, totals, clearCart } = useCart();


    const { deliveryType = 'Store Pickup', shippingAddress = {}, paymentMethod = 'Card' } = location.state || {};

    const [signature, setSignature] = useState('');
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
    const [cardHolder, setCardHolder] = useState('Alice Smith');
    const [expiry, setExpiry] = useState('12/28');
    const [cvc, setCvc] = useState('123');
    const [loading, setLoading] = useState(false);

    const handlePayAndConfirm = async (e) => {
        e.preventDefault();
        if (!agreePolicy) return showToast('Agree to rental policies and sign terms first.', 'error');
        if (!signature) return showToast('Enter signature authorization code.', 'error');

        setLoading(true);
        try {
            const itemsPayload = cartItems.map(item => ({
                productId: item._id,
                quantity: item.quantity
            }));

            const res = await api.post('/rentals/checkout', {
                items: itemsPayload,
                startDate,
                endDate,
                deliveryType,
                shippingAddress,
                paymentMethod
            });

            if (res.data.success) {
                clearCart();
                showToast('Order booked successfully! Awaiting Partner Approval.', 'success');
                navigate('/orders');
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Error occurred during checkout.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-500 font-semibold mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Cart
                </Link>
                <h2 className="text-2xl font-extrabold tracking-tight">Authorize Rental Order Statement</h2>
                <p className="text-xs text-slate-500">Sign digital agreement policies and authenticate payments hold.</p>
            </div>

            <form onSubmit={handlePayAndConfirm} className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="space-y-6">
                    <div className="glass-panel rounded-3xl p-5 space-y-4">
                        <h3 className="font-extrabold text-sm flex items-center gap-2">
                            🛡️ Rental Policies & Terms
                        </h3>

                        <div className="text-xs text-slate-500 dark:text-slate-400 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/5 leading-relaxed space-y-2">
                            <p className="font-bold">1. Security Deposit Hold Refund Policy</p>
                            <p>Customers matches full financial responsibilities for rented products condition. If goods are returned undamaged and on schedule, deposit holds are released completely in full.</p>
                            <p className="font-bold">2. Automatic Overdue Penalties</p>
                            <p>Failing to return rental assets on schedule results in automatic penalties. Calculated at 1.5x standard rate for late hours or days, automatically deducted from held deposit balances.</p>
                            <p className="font-bold">3. Product Damages & Loss</p>
                            <p>Inspection report checkmarks will tally accessories and test structural operations. Invoicing for repairs or replacements will consume remaining deposit holds first.</p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="flex items-start gap-2.5 cursor-pointer selection:bg-transparent">
                                <input
                                    type="checkbox"
                                    checked={agreePolicy}
                                    onChange={() => setAgreePolicy(!agreePolicy)}
                                    className="mt-0.5 accent-brand-500 rounded"
                                />
                                <span className="text-xs text-slate-550 dark:text-slate-400 leading-normal">
                                    I read and accept all general terms, damage checklist inspections policies, and late return penalty structures.
                                </span>
                            </label>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                                    Digital Authorization Signature (Type full name to sign)
                                </label>
                                <input
                                    type="text"
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    placeholder="e.g. Alice Smith"
                                    className="w-full text-xs font-semibold glass-input font-serif italic text-lg"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>


                <div className="space-y-6">
                    <div className="glass-panel rounded-3xl p-5 space-y-5">
                        <h3 className="font-extrabold text-sm flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-brand-500" /> Secure Card Settlement
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-semibold">Cardholder Full Name</span>
                                <input
                                    type="text"
                                    value={cardHolder}
                                    onChange={(e) => setCardHolder(e.target.value)}
                                    className="w-full glass-input text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-semibold">Credit/Debit Card Number</span>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    className="w-full glass-input text-xs font-mono text-center"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-semibold">Expiry Date</span>
                                    <input
                                        type="text"
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value)}
                                        placeholder="MM/YY"
                                        className="w-full glass-input text-xs text-center"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-semibold">CVC Code</span>
                                    <input
                                        type="text"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value)}
                                        placeholder="123"
                                        className="w-full glass-input text-xs text-center"
                                        required
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-4 space-y-2 text-xs">
                            <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-400">
                                <span>Total checkout hold:</span>
                                <span className="text-slate-900 dark:text-white">${totals.grandTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-normal text-center">
                                Your card will be immediately held for subtotal+taxes and the temporary security hold deposit balance.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md text-xs uppercase flex items-center justify-center gap-1.5"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            {loading ? 'Processing transaction holds...' : `Authorize Charge: $${totals.grandTotal.toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
export default Checkout;
