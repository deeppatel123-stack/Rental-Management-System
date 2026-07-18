import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    RotateCcw, Scan, ClipboardList, Calendar, CheckCircle2,
    AlertTriangle, ShieldCheck, DollarSign, UserCheck, X,
    Check, Info, FileText, ArrowRight, Clock, Package,
    Navigation, QrCode, RefreshCw, User, PenLine, Image as ImageIcon,
    AlertCircle, Wrench, TrendingDown
} from 'lucide-react';
import { ScannerSimulator } from '../components/Scanner';

const StatusBadge = ({ status }) => {
    const colors = {
        'Pending': 'bg-slate-500/10 border-slate-500/20 text-slate-400',
        'Assigned': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        'Scheduled': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        'On The Way': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        'OTP Verified': 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        'Inspection': 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        'Damage Review': 'bg-red-500/10 border-red-500/20 text-red-400',
        'Penalty Calculation': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        'Refund Processing': 'bg-teal-500/10 border-teal-500/20 text-teal-400',
        'Completed': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        'Cancelled': 'bg-red-500/10 border-red-500/20 text-red-400',
    };
    return <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold border ${colors[status] || 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>{status}</span>;
};

const RETURN_STEPS = [
    { label: 'Requested', step: 'Pending' },
    { label: 'Assigned', step: 'Assigned' },
    { label: 'Scheduled', step: 'Scheduled' },
    { label: 'On Way', step: 'On The Way' },
    { label: 'Verified', step: 'OTP Verified' },
    { label: 'Inspection', step: 'Inspection' },
    { label: 'Penalty', step: 'Penalty Calculation' },
    { label: 'Completed', step: 'Completed' },
];
const STEP_ORDER = ['Pending', 'Assigned', 'Scheduled', 'On The Way', 'OTP Verified', 'Inspection', 'Damage Review', 'Penalty Calculation', 'Refund Processing', 'Completed'];

const ReturnStepper = ({ currentStatus }) => {
    const curRank = STEP_ORDER.indexOf(currentStatus);
    return (
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {RETURN_STEPS.map((s, idx) => {
                const sRank = STEP_ORDER.indexOf(s.step);
                const done = sRank < curRank || currentStatus === 'Completed';
                const active = currentStatus === s.step || (s.step === 'OTP Verified' && ['OTP Verified'].includes(currentStatus));
                return (
                    <React.Fragment key={idx}>
                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-all ${done ? 'bg-emerald-500 border-emerald-500 text-white' : active ? 'bg-indigo-500 border-indigo-500 text-white animate-pulse' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span className={`text-[8px] font-extrabold text-center leading-tight ${active ? 'text-indigo-400' : done ? 'text-emerald-500' : 'text-slate-400'}`}>{s.label}</span>
                        </div>
                        {idx < RETURN_STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 min-w-[8px] mt-[-10px] ${sRank < curRank ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export const ReturnWorkflow = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = ['Super Admin', 'Rental Partner'].includes(user?.role);

    const [returns, setReturns] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [viewMode, setViewMode] = useState('list');
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [notes, setNotes] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [checklistItems, setChecklistItems] = useState([]);
    const [signatureTyped, setSignatureTyped] = useState('');

    // Inspection states
    const [overallCondition, setOverallCondition] = useState('Excellent');
    const [damageNotes, setDamageNotes] = useState('');
    const [damageCost, setDamageCost] = useState(0);
    const [accessories, setAccessories] = useState([]);

    // Late fee preview
    const [latePreview, setLatePreview] = useState({ isLate: false, hours: 0, fee: 0 });

    // Scanner
    const [showScanner, setShowScanner] = useState(false);
    const [activeScanIdx, setActiveScanIdx] = useState(null);

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/returns');
            if (res.data.success) setReturns(res.data.returns);
        } catch { showToast('Failed to fetch returns', 'error'); }
        finally { setLoading(false); }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await api.get('/auth/employees');
            if (res.data.success) {
                // Only show Delivery Executives in the assignment dropdown, not Rental Partners
                const all = res.data.data || res.data.employees || [];
                setEmployees(all.filter(emp => emp.role === 'Delivery Executive'));
            }
        } catch {
            setEmployees([]);
        }
    }, []);

    useEffect(() => {
        fetchReturns();
        if (isAdmin) fetchEmployees();
    }, [fetchReturns, isAdmin]);

    const calcLatePreview = (ret) => {
        if (!ret?.rentalOrder?.endDate) return;
        const end = new Date(ret.rentalOrder.endDate);
        const now = new Date();
        if (now > end) {
            const diffMs = now - end;
            const hours = Math.floor(diffMs / 3600000);
            const dailyRate = ret.rentalOrder.totalAmount ? ret.rentalOrder.totalAmount / 30 : 50;
            const fee = Math.round(Math.max(1, hours) * (dailyRate / 24) * 1.5 * 100) / 100;
            setLatePreview({ isLate: true, hours, fee });
        } else {
            setLatePreview({ isLate: false, hours: 0, fee: 0 });
        }
    };

    const getFiltered = (tab) => returns.filter(r => {
        if (tab === 'All') return true;
        if (tab === "Today's") return r.scheduledDate && new Date(r.scheduledDate).toDateString() === new Date().toDateString();
        if (tab === 'Upcoming') {
            const end = new Date(); end.setHours(23, 59, 59, 999);
            return r.scheduledDate && new Date(r.scheduledDate) > end && !['Completed', 'Cancelled'].includes(r.status);
        }
        if (tab === 'Late') return r.rentalOrder && new Date(r.rentalOrder.endDate) < new Date() && !['Completed', 'Cancelled'].includes(r.status);
        if (tab === 'Pending') return r.status === 'Pending';
        if (tab === 'Completed') return r.status === 'Completed';
        return true;
    });

    const selectReturnItem = (ret) => {
        setSelectedReturn(ret);
        setAssignedEmployeeId(ret.assignedEmployee?._id || '');
        if (ret.scheduledDate) {
            const d = new Date(ret.scheduledDate);
            setScheduledDate(d.toISOString().split('T')[0]);
            setScheduledTime(d.toTimeString().slice(0, 5));
        } else { setScheduledDate(''); setScheduledTime('09:00'); }
        setNotes(ret.notes || '');
        setOtpValue('');
        setSignatureTyped(ret.customerSignature || '');
        setOverallCondition(ret.overallCondition || 'Excellent');
        setDamageCost(ret.repairCostTotal || 0);
        setDamageNotes('');
        setChecklistItems(ret.checklist?.length > 0 ? ret.checklist : [
            { productName: ret.productId?.name || 'Rental Item', serialNumber: '', status: 'Returned', conditionRating: 'Excellent', damageCost: 0 }
        ]);
        setAccessories([
            { name: 'Power Cable / Adapter', present: true },
            { name: 'Carry Case / Cover', present: true },
            { name: 'Remote / Controller', present: true },
            { name: 'Manual / Documentation', present: true },
        ]);
        calcLatePreview(ret);
    };

    // Actions
    const handleAssign = async (e) => {
        e.preventDefault();
        if (!assignedEmployeeId) return showToast('Select an executive', 'warning');
        setActionLoading(true);
        try {
            const res = await api.put(`/returns/${selectedReturn._id}/assign`, { employeeId: assignedEmployeeId });
            if (res.data.success) { showToast('Executive assigned!', 'success'); selectReturnItem(res.data.returnDoc); fetchReturns(); }
        } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
        finally { setActionLoading(false); }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        if (!scheduledDate) return showToast('Select a date', 'warning');
        setActionLoading(true);
        try {
            const res = await api.put(`/returns/${selectedReturn._id}/schedule`, { scheduledDate: `${scheduledDate}T${scheduledTime || '09:00'}`, notes });
            if (res.data.success) { showToast('Return scheduled! QR & OTP generated.', 'success'); selectReturnItem(res.data.returnDoc); fetchReturns(); }
        } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
        finally { setActionLoading(false); }
    };

    const markOnTheWay = async () => {
        setActionLoading(true);
        try {
            const res = await api.patch(`/returns/${selectedReturn._id}/status`, { status: 'On The Way', notes: 'Executive is on the way to collect return.' });
            if (res.data.success) { showToast('Marked On The Way!', 'success'); selectReturnItem(res.data.returnDoc); fetchReturns(); }
        } catch { showToast('Failed', 'error'); }
        finally { setActionLoading(false); }
    };

    const verifyOtp = async () => {
        if (!otpValue) return showToast('Enter OTP', 'warning');
        setActionLoading(true);
        try {
            const res = await api.post(`/returns/${selectedReturn._id}/verify-otp`, { otp: otpValue });
            if (res.data.success) { showToast('OTP Verified!', 'success'); selectReturnItem(res.data.returnDoc); fetchReturns(); }
        } catch (err) { showToast(err.response?.data?.message || 'Invalid OTP', 'error'); }
        finally { setActionLoading(false); }
    };

    const verifyQr = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/returns/${selectedReturn._id}/verify-qr`);
            if (res.data.success) { showToast('QR Verified!', 'success'); selectReturnItem(res.data.returnDoc); fetchReturns(); }
        } catch { showToast('QR Verification failed', 'error'); }
        finally { setActionLoading(false); }
    };

    const startInspection = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/returns/${selectedReturn._id}/start-inspection`);
            if (res.data.success) { showToast('Inspection started!', 'success'); selectReturnItem(res.data.returnDoc); fetchReturns(); }
        } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
        finally { setActionLoading(false); }
    };

    const handleScanSuccess = (code) => {
        if (activeScanIdx === null) return;
        setChecklistItems(prev => { const u = [...prev]; u[activeScanIdx] = { ...u[activeScanIdx], serialNumber: code }; return u; });
        showToast(`Scanned: ${code}`, 'success');
        setActiveScanIdx(null);
    };

    const handleConditionChange = (cond) => {
        setOverallCondition(cond);
        if (cond === 'Minor Damage') setDamageCost(500);
        else if (cond === 'Major Damage') setDamageCost(2000);
        else if (cond === 'Lost') setDamageCost(10000);
        else setDamageCost(0);
    };

    const confirmReturn = async (e) => {
        e.preventDefault();
        const finalSignature = signatureTyped.trim() || 'Return E-Signed';
        setActionLoading(true);
        try {
            const updatedChecklist = checklistItems.map(item => ({
                ...item,
                status: overallCondition === 'Lost' ? 'Lost' : ['Minor Damage', 'Major Damage'].includes(overallCondition) ? 'Damaged' : 'Returned',
                conditionRating: ['Excellent', 'Good'].includes(overallCondition) ? overallCondition : 'Damaged',
                damageCost,
                damageDescription: damageNotes,
                accessoriesReturned: accessories
            }));
            const res = await api.post(`/returns/${selectedReturn._id}/confirm`, {
                checklist: updatedChecklist,
                notes: damageNotes || 'Return inspection completed.',
                overallCondition,
                customerSignature: finalSignature
            });
            if (res.data.success) {
                showToast('✅ Return completed! Rental closed.', 'success');
                setSelectedReturn(null);
                fetchReturns();
            }
        } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
        finally { setActionLoading(false); }
    };

    const cancelReturn = async () => {
        setActionLoading(true);
        try {
            await api.patch(`/returns/${selectedReturn._id}/status`, { status: 'Cancelled', notes: `Cancelled by ${user?.role}.` });
            showToast('Return cancelled.', 'info');
            setSelectedReturn(null);
            fetchReturns();
        } catch { showToast('Failed', 'error'); }
        finally { setActionLoading(false); }
    };

    const TABS = ['All', "Today's", 'Upcoming', 'Late', 'Pending', 'Completed'];
    const filtered = getFiltered(activeTab);
    const deposit = selectedReturn?.rentalOrder?.securityDepositTotal || 0;
    const totalPenalty = latePreview.fee + damageCost;
    const estimatedRefund = Math.max(0, deposit - totalPenalty);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight dark:text-white flex items-center gap-2.5">
                        <RotateCcw className="w-7 h-7 text-indigo-500" /> Logistics Returns
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Manage return assignments, OTP/QR verification, inspection, and deposit settlement.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchReturns} className="p-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all"><RefreshCw className="w-4 h-4" /></button>
                    <div className="flex items-center gap-1 px-1 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        {['list', 'calendar'].map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${viewMode === m ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>{m}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Returns', value: returns.length, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: "Today's", value: getFiltered("Today's").length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Late Returns', value: getFiltered('Late').length, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Completed', value: getFiltered('Completed').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map((m, i) => (
                    <div key={i} className="glass-card p-4 rounded-2xl flex items-center gap-3">
                        <div className={`w-9 h-9 ${m.bg} rounded-xl flex items-center justify-center`}>
                            <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{m.label}</span>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-200/50 dark:border-slate-800/60 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' : 'text-slate-400 border border-transparent'}`}>
                        {tab}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{getFiltered(tab).length}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="py-24 text-center"><RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" /><p className="text-xs text-slate-400 animate-pulse">Loading returns data...</p></div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel text-center py-20 rounded-3xl border border-slate-200/50 dark:border-slate-800/10">
                    <RotateCcw className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-400">No returns found in this category.</p>
                    <p className="text-xs text-slate-500 mt-1">Returns are created when a rental order is placed.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map(ret => {
                                const isLate = ret.rentalOrder && new Date(ret.rentalOrder.endDate) < new Date() && !['Completed', 'Cancelled'].includes(ret.status);
                                return (
                                    <div key={ret._id} onClick={() => selectReturnItem(ret)}
                                        className={`glass-card rounded-3xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedReturn?._id === ret._id ? 'ring-2 ring-indigo-500/50' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">#{ret.rentalOrder?.orderNumber || 'PENDING'}</span>
                                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">{ret.productId?.name || 'Rental Equipment'}</h4>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <StatusBadge status={ret.status} />
                                                {isLate && <span className="text-[8px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-black">LATE</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-xs text-slate-400">
                                            {ret.customer && <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /><span>{ret.customer.name}</span></div>}
                                            {ret.scheduledDate && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /><span>{new Date(ret.scheduledDate).toLocaleString()}</span></div>}
                                            {ret.rentalOrder?.endDate && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>Due: {new Date(ret.rentalOrder.endDate).toLocaleDateString()}</span></div>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {['Pending', 'Assigned', 'On The Way', 'OTP Verified', 'Inspection', 'Completed'].map((s, idx) => {
                                                const done = STEP_ORDER.indexOf(s) <= STEP_ORDER.indexOf(ret.status);
                                                return <div key={idx} className={`flex-1 h-1 rounded-full ${done ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'}`} />;
                                            })}
                                        </div>
                                        <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>Deposit: ${ret.rentalOrder?.securityDepositTotal?.toFixed(2) || '0.00'}</span>
                                            <span className="text-indigo-400 font-black flex items-center gap-0.5">Inspect <ArrowRight className="w-3.5 h-3.5" /></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {viewMode === 'calendar' && (
                        <div className="glass-panel p-6 rounded-3xl space-y-3">
                            <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> Return Schedule Calendar</h3>
                            {filtered.map(ret => (
                                <div key={ret._id} onClick={() => selectReturnItem(ret)}
                                    className="flex items-center gap-4 p-4 bg-white/20 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl cursor-pointer hover:bg-indigo-500/5 transition-all">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                        <span className="text-[9px] text-indigo-400 uppercase font-black">{ret.scheduledDate ? new Date(ret.scheduledDate).toLocaleString('default', { month: 'short' }) : 'TBD'}</span>
                                        <span className="text-sm font-extrabold text-indigo-400">{ret.scheduledDate ? new Date(ret.scheduledDate).getDate() : '-'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs truncate">{ret.productId?.name || 'Equipment'}</p>
                                        <p className="text-[10px] text-slate-400">Customer: {ret.customer?.name || 'N/A'}</p>
                                    </div>
                                    <StatusBadge status={ret.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedReturn && (
                <div className="fixed inset-0 z-40 bg-transparent flex items-start justify-center p-6 overflow-y-auto">
                    <div className="w-full max-w-5xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 rounded-3xl my-8 relative overflow-hidden shadow-2xl">
                        {/* Sticky Header */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-[#0c1222] backdrop-blur-xl p-6 border-b border-slate-200 dark:border-slate-800/60">
                            <button onClick={() => setSelectedReturn(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
                            <span className="text-[10px] uppercase font-black text-indigo-500">Return Workflow</span>
                            <div className="flex items-center gap-3 mt-1">
                                <h3 className="font-extrabold text-xl text-slate-800 dark:text-white">#{selectedReturn.rentalOrder?.orderNumber}</h3>
                                <StatusBadge status={selectedReturn.status} />
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{selectedReturn.customer?.name}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Due: {selectedReturn.rentalOrder?.endDate ? new Date(selectedReturn.rentalOrder.endDate).toLocaleDateString() : 'N/A'}</span>
                                {latePreview.isLate && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-black border border-red-500/20">⚠ LATE {latePreview.hours}hrs</span>}
                            </div>
                        </div>

                        <div className="p-6 space-y-6 bg-white dark:bg-[#0c1222]">
                            <ReturnStepper currentStatus={selectedReturn.status} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* LEFT: Actions */}
                                <div className="lg:col-span-2 space-y-5">

                                    {/* Step 1: Assign */}
                                    {isAdmin && selectedReturn.status === 'Pending' && (
                                        <form onSubmit={handleAssign} className="glass-panel p-6 rounded-2xl border border-indigo-500/15 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-indigo-500/15 rounded-xl flex items-center justify-center"><UserCheck className="w-4 h-4 text-indigo-500" /></div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-white">Step 1 · Assign Return Executive</h4>
                                                    <p className="text-[10px] text-slate-400">Assign an executive to collect the rental return.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <select value={assignedEmployeeId} onChange={e => setAssignedEmployeeId(e.target.value)} className="flex-1 glass-input text-xs" required>
                                                    <option value="">Select executive...</option>
                                                    {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>)}
                                                </select>
                                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl text-xs font-bold disabled:opacity-50">{actionLoading ? '...' : 'Assign'}</button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Step 2: Schedule */}
                                    {isAdmin && ['Assigned', 'Scheduled'].includes(selectedReturn.status) && (
                                        <form onSubmit={handleSchedule} className="glass-panel p-6 rounded-2xl border border-purple-500/15 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-purple-500/15 rounded-xl flex items-center justify-center"><Calendar className="w-4 h-4 text-purple-500" /></div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-white">Step 2 · Schedule Return Date</h4>
                                                    <p className="text-[10px] text-slate-400">Lock the slot. Return OTP & QR Code auto-generated.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">Date</label><input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full glass-input text-xs" required /></div>
                                                <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">Time</label><input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full glass-input text-xs" /></div>
                                            </div>
                                            <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">Notes</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full glass-input text-xs" placeholder="Instructions for executive..." /></div>
                                            <button type="submit" disabled={actionLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">{actionLoading ? 'Scheduling...' : '📅 Schedule & Generate OTP/QR'}</button>
                                        </form>
                                    )}

                                    {/* OTP + QR Display */}
                                    {['Scheduled', 'On The Way'].includes(selectedReturn.status) && selectedReturn.otp && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                                                <p className="text-[10px] font-black uppercase text-emerald-500 flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Return OTP</p>
                                                <div className="text-2xl font-black font-mono tracking-widest text-emerald-400 py-2">{selectedReturn.otp}</div>
                                                <p className="text-[9px] text-slate-400">Customer provides this code to executive</p>
                                            </div>
                                            {selectedReturn.qrCodeData && (
                                                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex flex-col items-center space-y-2">
                                                    <p className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> Return QR</p>
                                                    <img src={selectedReturn.qrCodeData} alt="Return QR" className="w-24 h-24 rounded-lg" />
                                                    <p className="text-[9px] text-slate-400">Scan to verify</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Step 3: On The Way */}
                                    {isAdmin && selectedReturn.status === 'Scheduled' && (
                                        <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-amber-500/15 rounded-xl flex items-center justify-center"><Navigation className="w-4 h-4 text-amber-500" /></div>
                                                <div><h4 className="text-xs font-black uppercase text-slate-700 dark:text-white">Step 3 · Depart for Collection</h4><p className="text-[10px] text-slate-400">Tap when executive has left for customer location.</p></div>
                                            </div>
                                            <button onClick={markOnTheWay} disabled={actionLoading} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
                                                <Navigation className="w-4 h-4 animate-pulse" />{actionLoading ? 'Updating...' : 'Mark On The Way'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 4: OTP/QR Verify */}
                                    {isAdmin && selectedReturn.status === 'On The Way' && (
                                        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/15 space-y-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-cyan-500/15 rounded-xl flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-cyan-500" /></div>
                                                <div><h4 className="text-xs font-black uppercase text-slate-700 dark:text-white">Step 4 · Verify Return OTP or QR</h4><p className="text-[10px] text-slate-400">Customer must verify identity before handover begins.</p></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-bold text-slate-500">Option A: Enter OTP</p>
                                                    <div className="flex gap-2">
                                                        <input type="text" value={otpValue} onChange={e => setOtpValue(e.target.value)} className="flex-1 text-center font-mono font-bold tracking-widest text-sm glass-input" placeholder="••••••" maxLength={6} />
                                                        <button onClick={verifyOtp} disabled={actionLoading} className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">{actionLoading ? '...' : 'Verify'}</button>
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 italic">Dev OTP: <span className="font-mono text-emerald-400">{selectedReturn.otp}</span></p>
                                                </div>
                                                <div className="border-l border-slate-200/50 dark:border-slate-800/10 pl-5 space-y-3">
                                                    <p className="text-[10px] font-bold text-slate-500">Option B: Scan QR Code</p>
                                                    <button onClick={verifyQr} disabled={actionLoading} className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                                                        <Scan className="w-4 h-4 animate-pulse" />{actionLoading ? 'Verifying...' : 'Simulate QR Scan'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 5: Start Inspection */}
                                    {isAdmin && selectedReturn.status === 'OTP Verified' && (
                                        <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-orange-500/15 rounded-xl flex items-center justify-center"><ClipboardList className="w-4 h-4 text-orange-500" /></div>
                                                <div><h4 className="text-xs font-black uppercase text-slate-700 dark:text-white">Step 5 · Begin Physical Inspection</h4><p className="text-[10px] text-slate-400">OTP verified. Start inspecting returned equipment now.</p></div>
                                            </div>
                                            <button onClick={startInspection} disabled={actionLoading} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
                                                <ClipboardList className="w-4 h-4" />{actionLoading ? 'Starting...' : 'Start Inspection'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 6+: Full Inspection Form */}
                                    {isAdmin && !['Completed', 'Cancelled'].includes(selectedReturn.status) && (
                                        <form onSubmit={confirmReturn} className="space-y-5">
                                            {/* Serial Number Scan */}
                                            <div className="glass-panel p-6 rounded-2xl border border-orange-500/15 space-y-4">
                                                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-white flex items-center gap-2"><Scan className="w-4 h-4 text-orange-500" /> Verify Serial Numbers</h4>
                                                {checklistItems.map((item, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-200">{item.productName}</p>
                                                            {item.serialNumber
                                                                ? <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">✓ SN: {item.serialNumber}</span>
                                                                : <span className="text-[9px] font-mono text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">⚠ Pending scan</span>}
                                                        </div>
                                                        <button type="button" onClick={() => { setActiveScanIdx(idx); setShowScanner(true); }}
                                                            className="px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-brand-500/20">
                                                            <Scan className="w-3.5 h-3.5" /> Scan
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Accessories Checklist */}
                                            <div className="glass-panel p-6 rounded-2xl border border-orange-500/15 space-y-4">
                                                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-white flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-500" /> Accessories Check-in</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {accessories.map((ac, idx) => (
                                                        <div key={idx} onClick={() => setAccessories(prev => { const u = [...prev]; u[idx].present = !u[idx].present; return u; })}
                                                            className={`p-3 rounded-xl border cursor-pointer select-none flex justify-between items-center text-xs font-bold transition-all ${ac.present ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                                                            <span>{ac.name}</span>
                                                            <span>{ac.present ? '✓' : '✗'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Condition Assessment */}
                                            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/15 space-y-4">
                                                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-500" /> Product Condition Assessment</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Excellent', 'Good', 'Minor Damage', 'Major Damage', 'Lost'].map(cond => (
                                                        <button key={cond} type="button" onClick={() => handleConditionChange(cond)}
                                                            className={`px-3.5 py-2 rounded-xl text-[10.5px] font-bold border transition-all ${overallCondition === cond
                                                                ? cond === 'Excellent' || cond === 'Good' ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                    : cond === 'Lost' ? 'bg-red-600 border-red-600 text-white'
                                                                        : 'bg-orange-500 border-orange-500 text-white'
                                                                : 'bg-white/10 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                                                            {cond}
                                                        </button>
                                                    ))}
                                                </div>
                                                {['Minor Damage', 'Major Damage', 'Lost'].includes(overallCondition) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] text-slate-400 font-bold">Repair / Loss Cost (₹)</label>
                                                            <input type="number" value={damageCost} onChange={e => setDamageCost(Number(e.target.value))} className="w-full glass-input text-xs" min={0} />
                                                        </div>
                                                        <div className="md:col-span-2 space-y-1">
                                                            <label className="text-[10px] text-slate-400 font-bold">Damage Description</label>
                                                            <input type="text" value={damageNotes} onChange={e => setDamageNotes(e.target.value)} className="w-full glass-input text-xs" placeholder="Describe damage details..." />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800/30">
                                                    <span className="text-slate-400 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Upload Damage Images</span>
                                                    <button type="button" onClick={() => showToast('Image upload — integrate cloud storage for production', 'info')}
                                                        className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-[9px] text-slate-400 hover:text-slate-200">Upload Image</button>
                                                </div>
                                            </div>

                                            {/* Financial Settlement Panel */}
                                            <div className="glass-panel p-6 rounded-2xl border border-teal-500/15 space-y-4 bg-gradient-to-r from-red-500/5 via-transparent to-emerald-500/5">
                                                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-teal-500" /> Deposit Settlement Preview</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                                                    {[
                                                        { label: 'Security Deposit', value: `₹${deposit.toFixed(2)}`, color: 'text-teal-400' },
                                                        { label: 'Late Penalty', value: `₹${latePreview.fee.toFixed(2)}`, color: 'text-amber-400' },
                                                        { label: 'Damage/Loss', value: `₹${damageCost.toFixed(2)}`, color: 'text-red-400' },
                                                        { label: 'Est. Refund', value: `₹${estimatedRefund.toFixed(2)}`, color: 'text-emerald-400' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                                                            <p className="text-[9px] text-slate-400 mb-1">{item.label}</p>
                                                            <p className={`font-extrabold text-sm ${item.color}`}>{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {latePreview.isLate && (
                                                    <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                        Grace period exceeded! {latePreview.hours}hrs late. Penalty multiplier applied (1.5×).
                                                    </div>
                                                )}
                                            </div>

                                            {/* Customer Signature */}
                                            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/15 space-y-3">
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><PenLine className="w-4 h-4 text-indigo-500" /> Customer Digital Signature</label>
                                                <div className="aspect-[4/1] bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
                                                    {signatureTyped ? <span className="font-serif italic text-xl tracking-widest text-purple-400">{signatureTyped}</span> : <span className="text-[10px] text-slate-400">Signature preview</span>}
                                                </div>
                                                <input type="text" value={signatureTyped} onChange={e => setSignatureTyped(e.target.value)} className="w-full glass-input text-xs" placeholder="Type customer's full legal name to confirm return..." required />
                                            </div>

                                            <button type="submit" disabled={actionLoading}
                                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-bold uppercase tracking-wide shadow-lg disabled:opacity-50">
                                                {actionLoading ? '⏳ Processing...' : '✅ Finalize Return & Settle Deposit'}
                                            </button>
                                        </form>
                                    )}

                                    {/* Completed */}
                                    {selectedReturn.status === 'Completed' && (
                                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-6 h-6" /><h4 className="font-extrabold text-sm">Return Completed Successfully!</h4></div>
                                            <p className="text-xs text-slate-400">Inventory updated, deposit settled, and rental closed.</p>
                                            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                                                <div className="p-3 bg-slate-950/30 rounded-xl">
                                                    <p className="text-[9px] text-white/50 mb-1 font-bold">RETURN DATE</p>
                                                    <p className="text-white font-extrabold text-xs">{selectedReturn.actualReturnDate ? new Date(selectedReturn.actualReturnDate).toLocaleString() : 'N/A'}</p>
                                                </div>
                                                <div className="p-3 bg-slate-950/30 rounded-xl">
                                                    <p className="text-[9px] text-white/50 mb-1 font-bold">LATE FEE</p>
                                                    <p className="text-white font-extrabold text-xs">₹{selectedReturn.calculatedLateFee?.toFixed(2) || '0.00'}</p>
                                                </div>
                                                <div className="p-3 bg-slate-950/30 rounded-xl">
                                                    <p className="text-[9px] text-white/50 mb-1 font-bold">DAMAGE COST</p>
                                                    <p className="text-white font-extrabold text-xs">₹{selectedReturn.repairCostTotal?.toFixed(2) || '0.00'}</p>
                                                </div>
                                                <div className="p-3 bg-slate-950/30 rounded-xl">
                                                    <p className="text-[9px] text-white/50 mb-1 font-bold">DEPOSIT REFUND</p>
                                                    <p className="text-emerald-400 font-extrabold text-xs">₹{selectedReturn.depositRefundAmount?.toFixed(2) || '0.00'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cancelled */}
                                    {selectedReturn.status === 'Cancelled' && (
                                        <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl">
                                            <div className="flex items-center gap-2 text-red-400"><AlertCircle className="w-5 h-5" /><p className="text-sm font-bold">This return has been cancelled.</p></div>
                                        </div>
                                    )}

                                    {/* Cancel button */}
                                    {isAdmin && !['Completed', 'Cancelled'].includes(selectedReturn.status) && (
                                        <button onClick={cancelReturn} disabled={actionLoading}
                                            className="w-full py-2.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                                            Cancel Return
                                        </button>
                                    )}
                                </div>

                                {/* RIGHT: Info + Timeline */}
                                <div className="space-y-5">
                                    {/* Order Info */}
                                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-500" /> Return Details</h4>
                                        <div className="space-y-1.5 text-[11px] text-slate-400">
                                            <p><span className="text-slate-500">Order:</span> #{selectedReturn.rentalOrder?.orderNumber}</p>
                                            <p><span className="text-slate-500">Customer:</span> {selectedReturn.customer?.name}</p>
                                            <p><span className="text-slate-500">Phone:</span> {selectedReturn.customer?.phone || 'N/A'}</p>
                                            <p><span className="text-slate-500">End Date:</span> {selectedReturn.rentalOrder?.endDate ? new Date(selectedReturn.rentalOrder.endDate).toLocaleDateString() : 'N/A'}</p>
                                            <p><span className="text-slate-500">Scheduled:</span> {selectedReturn.scheduledDate ? new Date(selectedReturn.scheduledDate).toLocaleString() : 'Not set'}</p>
                                            {selectedReturn.assignedEmployee && <p><span className="text-slate-500">Executive:</span> {selectedReturn.assignedEmployee.name}</p>}
                                            <p><span className="text-slate-500">Deposit:</span> ₹{selectedReturn.rentalOrder?.securityDepositTotal?.toFixed(2) || '0.00'}</p>
                                        </div>
                                    </div>

                                    {/* Audit Timeline */}
                                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><Info className="w-4 h-4 text-indigo-500" /> Audit Timeline</h4>
                                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-1 space-y-4 max-h-64 overflow-y-auto">
                                            {(selectedReturn.timeline || []).slice().reverse().map((log, idx) => (
                                                <div key={idx} className="relative text-[11px] space-y-0.5">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-950" />
                                                    <span className="font-mono text-[9px] text-slate-500 block">{new Date(log.updatedAt).toLocaleString()}</span>
                                                    <span className="font-bold text-slate-300 block">{log.status}</span>
                                                    <span className="text-slate-500 block">{log.notes}</span>
                                                </div>
                                            ))}
                                            {(!selectedReturn.timeline || selectedReturn.timeline.length === 0) && (
                                                <p className="text-[10px] text-slate-500 italic">No events yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ScannerSimulator isOpen={showScanner} onClose={() => setShowScanner(false)} onScanSuccess={handleScanSuccess} />
        </div>
    );
};

export default ReturnWorkflow;
