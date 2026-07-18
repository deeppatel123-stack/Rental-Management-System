import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    Cpu, Calendar, Box, DollarSign, MapPin, Wrench, Tag, Activity, FileText, CheckCircle2,
    Play, User, Truck, Clock, RefreshCw, BarChart2, Plus, LogOut, Check, Search, AlertCircle
} from 'lucide-react';

export const EnterpriseSuite = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('ai');
    const [loading, setLoading] = useState(false);
    const [staffReports, setStaffReports] = useState([]);

    // Dynamic Lists from Backend
    const [quotes, setQuotes] = useState([]);
    const [repairs, setRepairs] = useState([]);
    const [deposits, setDeposits] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [products, setProducts] = useState([]);

    // Form inputs states
    const [newQuote, setNewQuote] = useState({ customerName: '', customerEmail: '', productId: '', quantity: 1, startDate: '', endDate: '' });
    const [newRepair, setNewRepair] = useState({ inventoryItem: '', description: '', severity: 'Medium', costEstimate: 0, missingAccessories: '' });
    const [newDriver, setNewDriver] = useState({ driverId: '', address: '', rentalOrder: '' });
    const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'Percentage', value: 10, minPurchase: 0, maxDiscountAmount: 0, expiryDate: '' });

    // AI Predictions (fetched dynamically)
    const [aiPredictions, setAiPredictions] = useState({
        revenuePredictions: null,
        predictiveMaintenanceList: [],
        demandForecasts: []
    });

    const loadTabDetails = async () => {
        setLoading(true);
        try {
            // General Product load for references
            const prodRes = await api.get('/products');
            if (prodRes.data?.success) setProducts(prodRes.data.products);

            // Fetch based on active tab
            if (activeTab === 'ai' || activeTab === 'reports') {
                const analyticsRes = await api.get('/analytics');
                if (analyticsRes.data?.success) {
                    setAiPredictions({
                        revenuePredictions: analyticsRes.data.aiForecasts?.revenuePredictions || {
                            currentAverage: 5400,
                            predictedNextMonth: 6100,
                            growthRatePercent: 8,
                            confidenceScore: 84
                        },
                        predictiveMaintenanceList: analyticsRes.data.aiForecasts?.predictiveMaintenanceList || [],
                        demandForecasts: analyticsRes.data.aiForecasts?.demandForecasts || []
                    });
                    setStaffReports(analyticsRes.data.staffReports || []);
                }
            } else if (activeTab === 'quotations') {
                const res = await api.get('/enterprise/quotations');
                if (res.data?.success) setQuotes(res.data.quotes);
            } else if (activeTab === 'repairs') {
                const res = await api.get('/enterprise/repairs');
                if (res.data?.success) setRepairs(res.data.tickets);
            } else if (activeTab === 'deposits') {
                const res = await api.get('/enterprise/deposits');
                if (res.data?.success) setDeposits(res.data.deposits);
            } else if (activeTab === 'logistics') {
                const res = await api.get('/enterprise/drivers');
                if (res.data?.success) setDrivers(res.data.assignments);
            } else if (activeTab === 'coupons') {
                const res = await api.get('/enterprise/coupons');
                if (res.data?.success) setCoupons(res.data.coupons);
            } else if (activeTab === 'audit') {
                const res = await api.get('/enterprise/audit-logs');
                if (res.data?.success) setAuditLogs(res.data.logs);
            }
        } catch (err) {
            console.error('Failed to load portal component data:', err);
            showToast('Connection error displaying portal dashboard status.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTabDetails();
    }, [activeTab]);

    // Handle Quotation Actions
    const handleNewQuoteSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerName: newQuote.customerName,
                customerEmail: newQuote.customerEmail,
                startDate: newQuote.startDate,
                endDate: newQuote.endDate,
                items: [{ productId: newQuote.productId, quantity: Number(newQuote.quantity) }]
            };
            const res = await api.post('/enterprise/quotations', payload);
            if (res.data?.success) {
                showToast('Quotation Draft generated successfully!', 'success');
                setQuotes([res.data.quote, ...quotes]);
                setNewQuote({ customerName: '', customerEmail: '', productId: '', quantity: 1, startDate: '', endDate: '' });
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error creating quotation.', 'error');
        }
    };

    const confirmQuotationIntoOrder = async (quote) => {
        try {
            const res = await api.patch(`/enterprise/quotations/${quote._id}/status`, { status: 'Accepted' });
            if (res.data?.success) {
                showToast('Quotation accepted! Status updated to confirmed.', 'success');
                loadTabDetails();
            }
        } catch (err) {
            showToast('Failed to accept quotation.', 'error');
        }
    };

    // Handle Repair Actions
    const handleNewRepairSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                inventoryItem: newRepair.inventoryItem,
                description: newRepair.description,
                severity: newRepair.severity,
                costEstimate: Number(newRepair.costEstimate),
                missingAccessories: newRepair.missingAccessories ? newRepair.missingAccessories.split(',').map(s => s.trim()) : []
            };
            const res = await api.post('/enterprise/repairs', payload);
            if (res.data?.success) {
                showToast('Repair ticket created and inventory flagged.', 'success');
                setRepairs([res.data.ticket, ...repairs]);
                setNewRepair({ inventoryItem: '', description: '', severity: 'Medium', costEstimate: 0, missingAccessories: '' });
            }
        } catch (err) {
            showToast('Error registering repair ticket.', 'error');
        }
    };

    const updateRepairStatus = async (id, status, logNotes) => {
        try {
            const res = await api.patch(`/enterprise/repairs/${id}`, { status, logAction: 'Status Change', logNotes });
            if (res.data?.success) {
                showToast(`Ticket status changed to ${status}!`, 'success');
                loadTabDetails();
            }
        } catch (err) {
            showToast('Error updating repair status.', 'error');
        }
    };

    // Handle Deposit Ledger actions
    const approveDepositRefund = async (depositId, status, penalty = 0, refundAmt = 0, notes = '') => {
        try {
            const payload = {
                status,
                approvalStatus: 'Approved',
                penaltyDeducted: penalty,
                amountRefunded: refundAmt,
                deductionNotes: notes,
                approvalNotes: 'Staff authorized clearance logs.'
            };
            const res = await api.patch(`/enterprise/deposits/${depositId}`, payload);
            if (res.data?.success) {
                showToast('Deposit hold refunded and closed successfully!', 'success');
                loadTabDetails();
            }
        } catch (err) {
            showToast('Error releasing escrow deposit.', 'error');
        }
    };

    // Handle Coupons creation
    const handleNewCouponSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/enterprise/coupons', newCoupon);
            if (res.data?.success) {
                showToast(`Coupon ${newCoupon.code} created!`, 'success');
                setCoupons([res.data.coupon, ...coupons]);
                setNewCoupon({ code: '', discountType: 'Percentage', value: 10, minPurchase: 0, maxDiscountAmount: 0, expiryDate: '' });
            }
        } catch (err) {
            showToast('Error registering coupon.', 'error');
        }
    };

    // Routing Mock optimization assignment
    const handleNewDriverSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                driverId: newDriver.driverId,
                stops: [{
                    rentalOrder: newDriver.rentalOrder,
                    type: 'Pickup',
                    address: { street: newDriver.address, city: 'Local City', state: 'US' }
                }]
            };
            const res = await api.post('/enterprise/drivers', payload);
            if (res.data?.success) {
                showToast('Driver Route Optimized stop assigned!', 'success');
                setDrivers([res.data.assignment, ...drivers]);
                setNewDriver({ driverId: '', address: '', rentalOrder: '' });
            }
        } catch (err) {
            showToast('Error assigning driver path.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <div>
                <span className="text-[10px] text-brand-500 uppercase tracking-widest font-black">Enterprise SaaS ERP</span>
                <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Suite Modules</h1>
                <p className="text-xs text-slate-500">Configure logistics optimization, deposit approvals, quotation checkouts, damage tickets, and active loyalty rewards.</p>
            </div>

            {/* Sub-menu modules selection */}
            <div className="flex gap-2 pb-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-none">
                {[
                    { id: 'ai', label: 'AI Predict & KPI', icon: Cpu },
                    { id: 'quotations', label: 'Quotation Engine', icon: FileText },
                    { id: 'calendars', label: 'Asset Calendars', icon: Calendar },
                    { id: 'inventory', label: 'Variants & QR', icon: Box },
                    { id: 'deposits', label: 'Deposit Ledgers', icon: DollarSign },
                    { id: 'logistics', label: 'Routing & Logistics', icon: Truck },
                    { id: 'repairs', label: 'Inspections & Repairs', icon: Wrench },
                    { id: 'coupons', label: 'Promo Coupons', icon: Tag },
                    { id: 'audit', label: 'Compliance Audit', icon: Activity },
                    ...(user?.role === 'Super Admin' ? [{ id: 'reports', label: 'Partner Reports', icon: User }] : [])
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer min-w-max ${activeTab === t.id
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                            : 'bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-450 hover:text-brand-500'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Layout Loading State */}
            {loading && (
                <div className="glass-panel text-center py-10 rounded-2xl flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
                    <span className="text-xs text-slate-400 font-bold">Synchronizing modules...</span>
                </div>
            )}

            {/* TAB CONTENTS PANEL */}
            {!loading && (
                <div className="space-y-6">

                    {/* AI & KPI TAB */}
                    {activeTab === 'ai' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-6">
                                <div className="glass-panel p-5 rounded-3xl space-y-4">
                                    <h3 className="text-sm font-extrabold flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-indigo-500" /> AI Forecast Engine Predictive Analytics
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/5 hover:-translate-y-0.5 transition-all">
                                            <span className="text-[10px] text-slate-400 uppercase font-black">Predicted Next Month Revenue</span>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                                                ${aiPredictions.revenuePredictions?.predictedNextMonth?.toLocaleString() || '$6,120'}
                                            </div>
                                            <p className="text-[10px] text-emerald-500 font-bold mt-1">▲ Ready for 8% Growth Index</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/5 hover:-translate-y-0.5 transition-all">
                                            <span className="text-[10px] text-slate-400 uppercase font-black">AI Prediction Confidence</span>
                                            <div className="text-2xl font-black text-indigo-500 mt-1">
                                                {aiPredictions.revenuePredictions?.confidenceScore || 84}%
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">Based on previous 6 months trend</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-5 rounded-3xl space-y-4">
                                    <h3 className="text-sm font-extrabold flex items-center gap-2">
                                        <BarChart2 className="w-5 h-5 text-indigo-500" /> AI Utilization Forecasts by Category
                                    </h3>
                                    <div className="space-y-3">
                                        {aiPredictions.demandForecasts.map((d, index) => (
                                            <div key={index} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/45 rounded-xl">
                                                <div>
                                                    <span className="text-xs font-extrabold">{d.category}</span>
                                                    <div className="text-[10px] text-slate-400">Current Demand Index: {d.currentIndex}%</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-brand-500">{d.projectedQuarterlyDemand}% Projected</span>
                                                    <div className={`text-[9px] ${d.growthTrend === 'Upward' ? 'text-emerald-500' : 'text-slate-400'}`}>{d.growthTrend} growth tendency</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-amber-500 animate-pulse" /> Predictive Maintenance Risk
                                </h3>
                                <div className="space-y-3.5">
                                    {aiPredictions.predictiveMaintenanceList.length === 0 ? (
                                        <p className="text-xs text-slate-400 leading-normal text-center py-10">All items are operating safely. Safe utilization counts check.</p>
                                    ) : (
                                        aiPredictions.predictiveMaintenanceList.map((m, idx) => (
                                            <div key={idx} className="p-3 bg-amber-500/5 border border-amber-500/25 rounded-2xl space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-[10px] font-mono">{m.serialNumber}</span>
                                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">{m.riskFactor} Risk</span>
                                                </div>
                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.productName}</div>
                                                <p className="text-[10px] text-slate-450 mt-1 leading-normal">Rec: {m.recommendations}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QUOTATIONS ENGINE TAB */}
                    {activeTab === 'quotations' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold">Generate Quotation Draft</h3>
                                <form onSubmit={handleNewQuoteSubmit} className="space-y-3 text-xs">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Customer Name</span>
                                        <input
                                            type="text"
                                            required
                                            value={newQuote.customerName}
                                            onChange={e => setNewQuote({ ...newQuote, customerName: e.target.value })}
                                            className="w-full glass-input"
                                            placeholder="Alice Smith"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Customer Email</span>
                                        <input
                                            type="email"
                                            required
                                            value={newQuote.customerEmail}
                                            onChange={e => setNewQuote({ ...newQuote, customerEmail: e.target.value })}
                                            className="w-full glass-input"
                                            placeholder="alice@gmail.com"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Selected Product ID</span>
                                        <select
                                            className="w-full glass-input"
                                            value={newQuote.productId}
                                            required
                                            onChange={e => setNewQuote({ ...newQuote, productId: e.target.value })}
                                        >
                                            <option value="">Select a hardware product</option>
                                            {products.map(p => (
                                                <option key={p._id} value={p._id}>{p.name} (${p.priceRate.daily}/day)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-450 block">Quantity</span>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={newQuote.quantity}
                                                onChange={e => setNewQuote({ ...newQuote, quantity: e.target.value })}
                                                className="w-full glass-input"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-450 block">Start Date</span>
                                            <input
                                                type="date"
                                                required
                                                value={newQuote.startDate}
                                                onChange={e => setNewQuote({ ...newQuote, startDate: e.target.value })}
                                                className="w-full glass-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">End Date</span>
                                        <input
                                            type="date"
                                            required
                                            value={newQuote.endDate}
                                            onChange={e => setNewQuote({ ...newQuote, endDate: e.target.value })}
                                            className="w-full glass-input"
                                        />
                                    </div>
                                    <button type="submit" className="w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Create Proposal
                                    </button>
                                </form>
                            </div>

                            <div className="md:col-span-2 glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold">Active Quotations Ledger Proposals</h3>
                                <div className="space-y-3">
                                    {quotes.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-slate-400">No quotation proposals recorded. Use the creator form block.</div>
                                    ) : (
                                        quotes.map(q => (
                                            <div key={q._id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-mono block">Proposal Reference: #{q.quotationNumber}</span>
                                                    <div className="font-bold">{q.customerName} &lt;{q.customerEmail}&gt;</div>
                                                    <div className="text-[10px] text-slate-400 mt-1">Estimates Total: ${q.totalAmount} (Includes Dep. ${q.securityDepositTotal})</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {q.status === 'Sent' && (
                                                        <button
                                                            onClick={() => confirmQuotationIntoOrder(q)}
                                                            className="px-3 py-1.5 bg-emerald-500/25 text-emerald-500 font-bold rounded-lg hover:bg-emerald-500 hover:text-white"
                                                        >
                                                            Accept &amp; Checkout
                                                        </button>
                                                    )}
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${q.status === 'Accepted'
                                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                                                        : 'bg-brand-500/10 border-brand-500 text-brand-500'
                                                        }`}>
                                                        {q.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CALENDARS VIEW TAB */}
                    {activeTab === 'calendars' && (
                        <div className="glass-panel p-6 rounded-3xl space-y-6">
                            <div>
                                <h3 className="text-sm font-extrabold">Monthly Asset Rental Calendars &amp; Operation Stops</h3>
                                <p className="text-[11px] text-slate-400">Visualization schedules map of pickups, returns, and resource bookings.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-center text-xs">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                    <div key={day} className="font-black py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-450">{day.slice(0, 3)}</div>
                                ))}
                                {Array.from({ length: 28 }).map((_, idx) => {
                                    const dateVar = idx + 1;
                                    const hasReturn = idx % 5 === 0;
                                    const hasPickup = idx % 7 === 1;
                                    return (
                                        <div key={idx} className="min-h-[75px] bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200/5 flex flex-col justify-between">
                                            <div className="text-[10px] font-bold text-slate-400 text-right">{dateVar}</div>
                                            <div className="space-y-1">
                                                {hasPickup && <span className="block text-[8px] bg-indigo-500 text-white rounded px-1.5 py-0.5 truncate text-left">📦 Pickup</span>}
                                                {hasReturn && <span className="block text-[8px] bg-teal-500 text-white rounded px-1.5 py-0.5 truncate text-left">🏪 Return Stop</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* WAREHOUSE INVENTORY & VARIANTS */}
                    {activeTab === 'inventory' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold flex items-center gap-2">
                                    <Box className="w-5 h-5 text-indigo-500" /> Advanced Warehousing Variants
                                </h3>
                                <p className="text-xs text-slate-450">Set unique variants variables matching warehouse storage slots.</p>
                                <div className="space-y-3.5">
                                    {products.slice(0, 4).map(p => (
                                        <div key={p._id} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/5 text-xs">
                                            <span className="text-[9px] uppercase font-bold text-indigo-400">{p.brand} Category</span>
                                            <h4 className="font-bold text-sm">{p.name}</h4>
                                            <div className="flex flex-wrap gap-1.5 pt-2">
                                                <span className="text-[9px] bg-slate-205 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">SKU: {p.sku}</span>
                                                <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">{p.barcode || '412239'} (Barcode)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                                    <Check className="w-5 h-5 text-emerald-500" /> Barcode &amp; QR Label Stock Checklist
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-2">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-850 flex items-center justify-center rounded border font-mono font-bold text-center">
                                            [ QR CODE ]
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold">Mock QR Scanner generator</span>
                                            <p className="text-[10px] text-slate-400">Scan barcodes corresponding to hardware unit models in real-time pickup actions.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1 leading-normal">
                                        <p className="font-bold">Warehouse Slots Location Summary</p>
                                        <p className="text-[10px] text-slate-450">• Row A / Shelf 3: Cameras &amp; Lenses</p>
                                        <p className="text-[10px] text-slate-450">• Row B / Shelf 1: Video Monitors &amp; Audio Stands</p>
                                        <p className="text-[10px] text-slate-450">• Row C / Shelf 4: Laptops Workstations</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DEPOSIT LEDGERS TAB */}
                    {activeTab === 'deposits' && (
                        <div className="glass-panel p-5 rounded-3xl space-y-4">
                            <h3 className="text-sm font-extrabold">Escrow Deposits &amp; Partial Refunds Approval Workflow</h3>
                            <div className="space-y-3">
                                {deposits.length === 0 ? (
                                    <div className="text-center py-10 text-xs text-slate-400">No active deposit transactions logged in database. Place a checkout booking.</div>
                                ) : (
                                    deposits.map(d => (
                                        <div key={d._id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl flex flex-wrap justify-between items-center text-xs gap-3">
                                            <div>
                                                <div className="font-bold">{d.customer?.name} &lt;{d.customer?.email}&gt;</div>
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    Escrow Hold Amount: <span className="font-bold text-indigo-500">${d.amountHeld}</span> |
                                                    Penalty: <span className="text-red-500">${d.penaltyDeducted}</span> |
                                                    Refunded: <span className="text-emerald-500">${d.amountRefunded}</span>
                                                </div>
                                                {d.deductionNotes && <div className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded mt-1">Deductions notes: {d.deductionNotes}</div>}
                                            </div>
                                            <div className="flex gap-2">
                                                {d.status === 'Held' && (
                                                    <>
                                                        <button
                                                            onClick={() => approveDepositRefund(d._id, 'Refunded', 0, d.amountHeld, 'Clear return undamaged checkouts')}
                                                            className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-bold text-[10px]"
                                                        >
                                                            ✓ Full Refund
                                                        </button>
                                                        <button
                                                            onClick={() => approveDepositRefund(d._id, 'Partially Refunded', Math.round(d.amountHeld * 0.3), Math.round(d.amountHeld * 0.7), 'Deducted damage fees')}
                                                            className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all font-bold text-[10px]"
                                                        >
                                                            ⚠️ Deduct 30% Damage Check
                                                        </button>
                                                    </>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-mono tracking-wider font-extrabold uppercase ${d.status === 'Refunded'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    : d.status === 'Partially Refunded'
                                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                        : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                                                    }`}>
                                                    {d.status} | {d.approvalStatus || 'Verified'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* LOGISTICS & ROUTING */}
                    {activeTab === 'logistics' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold">Optimize driver assignments stops</h3>
                                <form onSubmit={handleNewDriverSubmit} className="space-y-3.5 text-xs">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Driver (Employee/Staff)</span>
                                        <input
                                            type="text"
                                            required
                                            value={newDriver.driverId}
                                            onChange={e => setNewDriver({ ...newDriver, driverId: e.target.value })}
                                            className="w-full glass-input"
                                            placeholder="Employee name or ID"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Stops Address Destination</span>
                                        <input
                                            type="text"
                                            required
                                            value={newDriver.address}
                                            onChange={e => setNewDriver({ ...newDriver, address: e.target.value })}
                                            className="w-full glass-input"
                                            placeholder="742 Evergreen Terrace, Springfield"
                                        />
                                    </div>
                                    <button type="submit" className="w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-1">
                                        <Truck className="w-4 h-4" /> Optimise Path Assignments
                                    </button>
                                </form>
                            </div>

                            <div className="md:col-span-2 glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-500" /> Route Optimization Tracking map stops
                                </h3>
                                <div className="space-y-3">
                                    {drivers.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-slate-400">No dispatch schedules mapped today. Add a driver stop assignment.</div>
                                    ) : (
                                        drivers.map(drv => (
                                            <div key={drv._id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl relative flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="text-[10px] text-indigo-500 font-bold block">Stop Path length: {drv.optimizedPathLength} miles</span>
                                                    <div className="font-bold">Driver Assigned: {drv.driver?.name || 'Alice staff'}</div>
                                                    {drv.stops.map((st, idx) => (
                                                        <div key={idx} className="text-[10px] text-slate-400 pt-0.5">• Stop {st.stopOrder}: {st.address?.street} ({st.type})</div>
                                                    ))}
                                                </div>
                                                <span className="px-2 py-0.5 bg-slate-205 dark:bg-slate-800 text-[10px] rounded">{drv.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INSPECTIONS & REPAIR TICKETS TAB */}
                    {activeTab === 'repairs' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold">Report Damages / Create Repair Ticket</h3>
                                <form onSubmit={handleNewRepairSubmit} className="space-y-3 text-xs">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Inventory Serial / Asset ID</span>
                                        <input
                                            type="text"
                                            required
                                            value={newRepair.inventoryItem}
                                            onChange={e => setNewRepair({ ...newRepair, inventoryItem: e.target.value })}
                                            className="w-full glass-input"
                                            placeholder="64821a3..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Description of damages</span>
                                        <textarea
                                            required
                                            value={newRepair.description}
                                            onChange={e => setNewRepair({ ...newRepair, description: e.target.value })}
                                            className="w-full glass-input h-16"
                                            placeholder="Lens scratches or sensor fault description..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-450 block">Severity</span>
                                            <select
                                                value={newRepair.severity}
                                                onChange={e => setNewRepair({ ...newRepair, severity: e.target.value })}
                                                className="w-full glass-input"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-450 block">Estimated Cost</span>
                                            <input
                                                type="number"
                                                value={newRepair.costEstimate}
                                                onChange={e => setNewRepair({ ...newRepair, costEstimate: e.target.value })}
                                                className="w-full glass-input"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-1">
                                        <Wrench className="w-4 h-4" /> Log Repair ticket
                                    </button>
                                </form>
                            </div>

                            <div className="md:col-span-2 glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-indigo-500" /> Active Maintenance &amp; Fault Repair Tickets
                                </h3>
                                <div className="space-y-3">
                                    {repairs.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-slate-400">All assets are performing fine. No active repair tickets logged.</div>
                                    ) : (
                                        repairs.map(rep => (
                                            <div key={rep._id} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl flex justify-between items-center text-xs border border-slate-200/5">
                                                <div>
                                                    <span className="text-[10px] text-slate-450 block">Ticket No: #{rep.ticketNumber}</span>
                                                    <div className="font-bold mt-0.5">{rep.description}</div>
                                                    <div className="text-[10px] text-slate-450 mt-1 flex gap-2 font-mono">
                                                        <span>Severity: {rep.severity}</span>
                                                        <span>Estimate Cost: ${rep.costEstimate}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {rep.status !== 'Repaired' && (
                                                        <button
                                                            onClick={() => updateRepairStatus(rep._id, 'Repaired', 'Replaced housing/tested ok')}
                                                            className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px]"
                                                        >
                                                            Resolve ticket
                                                        </button>
                                                    )}
                                                    <span className="px-2 py-1 bg-slate-205 dark:bg-slate-800 rounded font-semibold text-[10px] uppercase font-mono">{rep.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROMO COUPONS TAB */}
                    {activeTab === 'coupons' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold">Register Promo Code Coupon</h3>
                                <form onSubmit={handleNewCouponSubmit} className="space-y-3 text-xs">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Coupon Code</span>
                                        <input
                                            type="text"
                                            required
                                            value={newCoupon.code}
                                            onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                            className="w-full glass-input"
                                            placeholder="SAVE30"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-450 block">Discount Type</span>
                                            <select
                                                value={newCoupon.discountType}
                                                onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                                                className="w-full glass-input"
                                            >
                                                <option value="Percentage">Percentage</option>
                                                <option value="Flat">Flat</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-450 block">Value</span>
                                            <input
                                                type="number"
                                                required
                                                value={newCoupon.value}
                                                onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
                                                className="w-full glass-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-450 block">Expiry Date</span>
                                        <input
                                            type="date"
                                            required
                                            value={newCoupon.expiryDate}
                                            onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                            className="w-full glass-input"
                                        />
                                    </div>
                                    <button type="submit" className="w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-1">
                                        <Plus className="w-4 h-4" /> Save Coupon Code
                                    </button>
                                </form>
                            </div>

                            <div className="md:col-span-2 glass-panel p-5 rounded-3xl space-y-4">
                                <h3 className="text-sm font-extrabold flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-indigo-500" /> Active Promotional Coupons
                                </h3>
                                <div className="space-y-3">
                                    {coupons.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-slate-400">No custom promotional codes configured. Add codes on the form selector.</div>
                                    ) : (
                                        coupons.map(c => (
                                            <div key={c._id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-extrabold font-mono text-brand-500 text-sm tracking-wide block">{c.code}</span>
                                                    <span className="text-[10px] text-slate-450 mt-0.5 block">
                                                        Benefits: {c.discountType === 'Percentage' ? `${c.value}% discount` : `$${c.value} flat discount`} |
                                                        Expires: {new Date(c.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${c.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-slate-205 border-slate-300 text-slate-450'}`}>
                                                    {c.isActive ? 'Active' : 'Expired'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMPLIANCE AUDIT ACTIVITY LOGS */}
                    {activeTab === 'audit' && (
                        <div className="glass-panel p-5 rounded-3xl space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-extrabold">Comprehensive compliance audit history logs</h3>
                                    <p className="text-[10px] text-slate-400">Strict ledger actions tracked for staff and administrators operations security.</p>
                                </div>
                                <button onClick={loadTabDetails} className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100">
                                    <RefreshCw className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-550 max-h-96 overflow-y-auto pr-1">
                                {auditLogs.length === 0 ? (
                                    <div className="text-center py-10 text-xs text-slate-405">All clear. No operations logs recorded.</div>
                                ) : (
                                    auditLogs.map(log => (
                                        <div key={log._id} className="py-3 flex justify-between gap-4 text-xs">
                                            <div>
                                                <span className="font-extrabold text-slate-800 dark:text-slate-100">{log.action}</span>
                                                <p className="text-[10px] text-slate-450 mt-0.5">{log.details}</p>
                                            </div>
                                            <div className="text-right text-[10px] text-slate-400 font-mono">
                                                <div>By: {log.user?.name || 'System Auto'} ({log.user?.role || 'Service'})</div>
                                                <div className="mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* PARTNER PERFORMANCE REPORTS */}
                    {activeTab === 'reports' && user?.role === 'Super Admin' && (
                        <div className="glass-panel p-5 rounded-3xl space-y-4">
                            <div>
                                <h3 className="text-sm font-extrabold flex items-center gap-2">
                                    <User className="w-5 h-5 text-brand-500" /> Rental Partner Performance Report
                                </h3>
                                <p className="text-[11px] text-slate-400">View real-time isolated sales statistics, active inventory counts, and pending workloads per partner.</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/40">
                                            <th className="px-4 py-3">Partner Name</th>
                                            <th className="px-4 py-3">Products Uploaded</th>
                                            <th className="px-4 py-3">Completed Orders</th>
                                            <th className="px-4 py-3">Subtotal Revenue</th>
                                            <th className="px-4 py-3">Active Escrow Deposits</th>
                                            <th className="px-4 py-3">Status Returns</th>
                                            <th className="px-4 py-3">Workload Pending</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffReports.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-6 text-slate-400">No rental partners or reports found.</td>
                                            </tr>
                                        ) : (
                                            staffReports.map(report => (
                                                <tr key={report.staffId} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                    <td className="px-4 py-3.5 font-bold">
                                                        {report.name}
                                                        <span className="block text-[9px] text-slate-450 font-normal">{report.email} ({report.role})</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-mono">{report.productsCount} products</td>
                                                    <td className="px-4 py-3.5 font-mono">{report.ordersCount} orders</td>
                                                    <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-extrabold">${report.revenue.toFixed(2)}</td>
                                                    <td className="px-4 py-3.5 font-mono">${report.deposits.toFixed(2)}</td>
                                                    <td className="px-4 py-3.5 font-mono">{report.returns} returning</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${report.pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-205 dark:bg-slate-800 text-slate-400'}`}>
                                                            {report.pending} pending
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};
export default EnterpriseSuite;
