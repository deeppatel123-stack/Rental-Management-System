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


    const { deliveryType = 'Store Pickup', shippingAddress = {}, paymentMethod = 'Card', deliveryFee = 0 } = location.state || {};

    const [signature, setSignature] = useState('');
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
    const [cardHolder, setCardHolder] = useState('Alice Smith');
    const [expiry, setExpiry] = useState('12/28');
    const [cvc, setCvc] = useState('123');
    const [loading, setLoading] = useState(false);

    // Coupon campaign state setup
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponError('');
        try {
            const res = await api.post('/enterprise/coupons/validate', {
                code: couponCode,
                cartAmount: totals.subTotal
            });
            if (res.data?.success) {
                setAppliedCoupon({
                    code: couponCode.toUpperCase(),
                    discount: res.data.discount
                });
                showToast(res.data.message || 'Coupon applied!', 'success');
            }
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon.');
            setAppliedCoupon(null);
            showToast(err.response?.data?.message || 'Invalid coupon.', 'error');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
    const finalSubtotal = Math.max(0, totals.subTotal - discountAmount);
    const finalTax = totals.subTotal > 0
        ? Math.round(((finalSubtotal / totals.subTotal) * (totals.preDiscountTax || totals.tax)) * 100) / 100
        : 0;
    const finalGrandTotal = finalSubtotal + finalTax + totals.securityHold + (deliveryFee || 0);

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
                paymentMethod,
                deliveryFee,
                signature,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined
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


                        {/* Coupon Code Section */}
                        <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-4 space-y-3">
                            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Promotional Discount Coupon</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Enter Coupon Code (e.g. WELCOME10)"
                                    disabled={appliedCoupon}
                                    className="flex-1 glass-input text-xs uppercase"
                                />
                                {appliedCoupon ? (
                                    <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        className="px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-semibold rounded-xl"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className="px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 text-xs font-semibold rounded-xl"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            {couponError && (
                                <p className="text-[10px] text-rose-500 font-semibold">{couponError}</p>
                            )}
                            {appliedCoupon && (
                                <p className="text-[10px] text-emerald-500 font-semibold">✓ Coupon {appliedCoupon.code} applied! Saved ${appliedCoupon.discount.toFixed(2)}</p>
                            )}
                        </div>

                        <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-4 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Subtotal:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">${totals.subTotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-500 font-semibold">
                                    <span>Discount Applied:</span>
                                    <span>-${discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Sales Tax ({totals.appliedTaxRate || 8}%):</span>
                                <span className="font-semibold text-slate-900 dark:text-white">${finalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Security Deposit (Refundable):</span>
                                <span className="font-semibold text-slate-900 dark:text-white">${totals.securityHold.toFixed(2)}</span>
                            </div>
                            {deliveryType === 'Delivery' && (
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>Courier {deliveryType} Fee:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">+${deliveryFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-250/20">
                                <span>Total checkout hold:</span>
                                <span className="text-emerald-600 dark:text-emerald-400">${finalGrandTotal.toFixed(2)}</span>
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
                            {loading ? 'Processing transaction holds...' : `Authorize Charge: $${finalGrandTotal.toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
export default Checkout;
