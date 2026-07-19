import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    Truck, Scan, ClipboardList, Calendar, MapPin,
    CheckCircle2, Clock, Check, UserCheck, Navigation,
    ArrowRight, ShieldCheck, PenLine, X, Info, QrCode,
    Package, AlertCircle, RefreshCw, FileText, User,
    ChevronRight, Zap, Eye, Image as ImageIcon
} from 'lucide-react';
import { ScannerSimulator } from '../components/Scanner';

//  STATUS BADGE 
const StatusBadge = ({ status }) => {
    const colors = {
        'Pending': 'bg-slate-500/10 border-slate-500/20 text-slate-400',
        'Assigned': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        'Scheduled': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        'On The Way': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        'OTP Verified': 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        'QR Verified': 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        'Picked Up': 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        'Completed': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        'Cancelled': 'bg-red-500/10 border-red-500/20 text-red-400',
    };
    return (
        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold border ${colors[status] || 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
            {status}
        </span>
    );
};

//  WORKFLOW STEPPER 
const PICKUP_STEPS = [
    { label: 'Pending', step: 'Pending', icon: Package },
    { label: 'Assigned', step: 'Assigned', icon: UserCheck },
    { label: 'Completed', step: 'Completed', icon: CheckCircle2 },
];
const STEP_ORDER = ['Pending', 'Assigned', 'Scheduled', 'On The Way', 'OTP Verified', 'QR Verified', 'Picked Up', 'Completed'];


const WorkflowStepper = ({ currentStatus }) => {
    const currentRank = STEP_ORDER.indexOf(currentStatus);
    return (
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {PICKUP_STEPS.map((stepObj, idx) => {
                const stepRank = STEP_ORDER.indexOf(stepObj.step);
                const isCompleted = stepRank < currentRank || currentStatus === 'Completed';
                const isActive = currentStatus === stepObj.step ||
                    (stepObj.step === 'OTP Verified' && ['OTP Verified', 'QR Verified', 'Picked Up'].includes(currentStatus));
                const Icon = stepObj.icon;
                return (
                    <React.Fragment key={idx}>
                        <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : isActive ? 'bg-brand-500 border-brand-500 text-white animate-pulse shadow-lg shadow-brand-500/25'
                                    : currentStatus === 'Cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className={`text-[9px] font-extrabold text-center leading-tight ${isActive ? 'text-brand-500' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                                }`}>{stepObj.label}</span>
                        </div>
                        {idx < PICKUP_STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 min-w-[16px] mt-[-10px] transition-all ${stepRank < currentRank ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

//  MAIN COMPONENT 
export const PickupWorkflow = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = ['Super Admin', 'Rental Partner'].includes(user?.role);

    const [pickups, setPickups] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [viewMode, setViewMode] = useState('list');
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [vehicleDetails, setVehicleDetails] = useState('');
    const [notes, setNotes] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [checklistItems, setChecklistItems] = useState([]);
    const [signatureTyped, setSignatureTyped] = useState('');

    // Scanner
    const [showScanner, setShowScanner] = useState(false);
    const [activeChecklistIndex, setActiveChecklistIndex] = useState(null);

    //  DATA FETCHING ─
    const fetchPickups = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/pickups');
            if (res.data.success) setPickups(res.data.pickups);
        } catch (err) {
            showToast('Failed to fetch pickups', 'error');
        } finally {
            setLoading(false);
        }
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
        fetchPickups();
        if (isAdmin) fetchEmployees();
    }, [fetchPickups, isAdmin]);

    //  FILTER LOGIC 
    const getFilteredPickups = (tab) => {
        return pickups.filter(p => {
            if (tab === 'All') return true;
            if (tab === "Today's") {
                const today = new Date().toDateString();
                return p.scheduledDate && new Date(p.scheduledDate).toDateString() === today;
            }
            if (tab === 'Upcoming') {
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                return p.scheduledDate && new Date(p.scheduledDate) > todayEnd && !['Completed', 'Cancelled'].includes(p.status);
            }
            if (tab === 'Delayed') {
                const now = new Date();
                return p.scheduledDate && new Date(p.scheduledDate) < now && !['Completed', 'Cancelled'].includes(p.status);
            }
            if (tab === 'Assigned') return p.status === 'Assigned';
            if (tab === 'Completed') return p.status === 'Completed';
            if (tab === 'Cancelled') return p.status === 'Cancelled';
            return true;
        });
    };

    const filteredPickups = getFilteredPickups(activeTab);

    //  SELECT PICKUP ─
    const selectPickupItem = (pickup) => {
        setSelectedPickup(pickup);
        setAssignedEmployeeId(pickup.assignedEmployee?._id || '');
        if (pickup.scheduledDate) {
            const d = new Date(pickup.scheduledDate);
            setScheduledDate(d.toISOString().split('T')[0]);
            setScheduledTime(d.toTimeString().slice(0, 5));
        } else {
            setScheduledDate('');
            setScheduledTime('09:00');
        }
        setVehicleDetails(pickup.vehicleDetails || '');
        setNotes(pickup.notes || '');
        setOtpValue('');
        setSignatureTyped(pickup.customerSignature || '');
        setChecklistItems(pickup.checklist?.length > 0 ? pickup.checklist : [
            { productName: pickup.productId?.name || 'Rental Item', serialNumber: '', isVerified: false, originalCondition: 'Excellent' }
        ]);
    };

    //  ACTION HANDLERS ─
    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assignedEmployeeId) return showToast('Please select a pickup executive', 'warning');
        setActionLoading(true);
        try {
            const res = await api.put(`/pickups/${selectedPickup._id}/assign`, { employeeId: assignedEmployeeId });
            if (res.data.success) {
                showToast('Executive assigned successfully!', 'success');
                selectPickupItem(res.data.pickup);
                fetchPickups();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Assignment failed', 'error');
        } finally { setActionLoading(false); }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        if (!scheduledDate) return showToast('Please select a scheduled date', 'warning');
        if (!vehicleDetails.trim()) return showToast('Please provide vehicle details', 'warning');
        const dateTimeStr = `${scheduledDate}T${scheduledTime || '09:00'}`;
        setActionLoading(true);
        try {
            const res = await api.put(`/pickups/${selectedPickup._id}/schedule`, {
                scheduledDate: dateTimeStr,
                vehicleDetails,
                notes
            });
            if (res.data.success) {
                showToast('Pickup scheduled! OTP & QR Code generated.', 'success');
                selectPickupItem(res.data.pickup);
                fetchPickups();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Scheduling failed', 'error');
        } finally { setActionLoading(false); }
    };

    const markOnTheWay = async () => {
        setActionLoading(true);
        try {
            const res = await api.patch(`/pickups/${selectedPickup._id}/status`, {
                status: 'On The Way',
                notes: 'Executive has departed and is on the way to customer.'
            });
            if (res.data.success) {
                showToast('Marked as On The Way! Customer notified.', 'success');
                selectPickupItem(res.data.pickup);
                fetchPickups();
            }
        } catch (err) {
            showToast('Failed to update status', 'error');
        } finally { setActionLoading(false); }
    };

    const generateHandoffOtp = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/pickups/${selectedPickup._id}/generate-otp`);
            if (res.data.success) {
                showToast('Handoff OTP code generated successfully!', 'success');
                selectPickupItem(res.data.pickup);
                fetchPickups();
            }
        } catch (err) {
            showToast('Failed to generate handoff OTP', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const verifyOtpCode = async () => {
        if (!otpValue || otpValue.length < 4) return showToast('Enter the 6-digit OTP code', 'warning');
        setActionLoading(true);
        try {
            const res = await api.post(`/pickups/${selectedPickup._id}/verify`, { otp: otpValue });
            if (res.data.success) {
                showToast('OTP verified successfully!', 'success');
                selectPickupItem(res.data.pickup);
                fetchPickups();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid OTP. Try again.', 'error');
        } finally { setActionLoading(false); }
    };

    const verifyQrCode = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/pickups/${selectedPickup._id}/verify`, { qrScanned: true });
            if (res.data.success) {
                showToast('QR Code verified successfully!', 'success');
                selectPickupItem(res.data.pickup);
                fetchPickups();
            }
        } catch (err) {
            showToast('QR verification failed', 'error');
        } finally { setActionLoading(false); }
    };

    const scanSerialNumber = (idx) => {
        setActiveChecklistIndex(idx);
        setShowScanner(true);
    };

    const handleScanSuccess = (code) => {
        if (activeChecklistIndex === null) return;
        setChecklistItems(prev => {
            const updated = [...prev];
            updated[activeChecklistIndex] = { ...updated[activeChecklistIndex], serialNumber: code, isVerified: true };
            return updated;
        });
        showToast(`Serial number scanned: ${code}`, 'success');
        setActiveChecklistIndex(null);
    };

    const submitConfirmPickup = async (e) => {
        e.preventDefault();
        const unverified = checklistItems.find(item => !item.isVerified || !item.serialNumber);
        if (unverified) return showToast('Please scan all serial numbers before completing pickup', 'error');
        if (!signatureTyped.trim()) return showToast('Customer digital signature is required', 'warning');
        setActionLoading(true);
        try {
            const res = await api.post(`/pickups/${selectedPickup._id}/confirm`, {
                checklist: checklistItems,
                signature: signatureTyped
            });
            if (res.data.success) {
                showToast('✅ Pickup completed! Rental is now Active.', 'success');
                setSelectedPickup(null);
                fetchPickups();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to complete pickup', 'error');
        } finally { setActionLoading(false); }
    };

    const cancelPickup = async () => {
        setActionLoading(true);
        try {
            const res = await api.patch(`/pickups/${selectedPickup._id}/status`, {
                status: 'Cancelled',
                notes: `Cancelled by ${user?.role}.`
            });
            if (res.data.success) {
                showToast('Pickup cancelled.', 'info');
                setSelectedPickup(null);
                fetchPickups();
            }
        } catch (err) {
            showToast('Failed to cancel', 'error');
        } finally { setActionLoading(false); }
    };

    const handleSimpleConfirmPickup = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/pickups/${selectedPickup._id}/confirm`, {
                signature: 'Handover E-Signed',
                checklist: selectedPickup.checklist || []
            });
            if (res.data.success) {
                showToast('Pickup completed! Order is now Active.', 'success');
                setSelectedPickup(res.data.pickup);
                fetchPickups();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error completing pickup.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    //  TABS 
    const TABS = ["All", "Today's", "Upcoming", "Delayed", "Assigned", "Completed", "Cancelled"];

    //  RENDER 
    return (
        <div className="p-6 space-y-6">

            {/*  HEADER  */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight dark:text-white flex items-center gap-2.5">
                        <Truck className="w-7 h-7 text-brand-500" />
                        Logistics Pickups
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                        Manage product pickup assignments, scheduling, OTP/QR verification, and inventory handover.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => fetchPickups()} className="p-2 rounded-xl text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1 px-1 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        {['list', 'calendar', 'map'].map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${viewMode === mode ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/*  METRICS BAR  */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Pickups', value: pickups.length, color: 'text-brand-500', bg: 'bg-brand-500/10' },
                    { label: "Today's", value: getFilteredPickups("Today's").length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Completed', value: getFilteredPickups('Completed').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Delayed', value: getFilteredPickups('Delayed').length, color: 'text-red-500', bg: 'bg-red-500/10' },
                ].map((m, i) => (
                    <div key={i} className={`glass-card p-4 rounded-2xl flex items-center gap-3`}>
                        <div className={`w-9 h-9 ${m.bg} rounded-xl flex items-center justify-center`}>
                            <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{m.label}</span>
                    </div>
                ))}
            </div>

            {/*  TABS  */}
            <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-200/50 dark:border-slate-800/60 overflow-x-auto">
                {TABS.map(tab => {
                    const count = getFilteredPickups(tab).length;
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab
                                ? 'bg-brand-500/10 text-brand-500 border border-brand-500/25'
                                : 'text-slate-400 hover:text-slate-200 border border-transparent'
                                }`}>
                            {tab}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/*  CONTENT  */}
            {loading ? (
                <div className="py-24 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
                        <p className="text-xs text-slate-400 animate-pulse">Loading logistics data...</p>
                    </div>
                </div>
            ) : filteredPickups.length === 0 ? (
                <div className="glass-panel text-center py-20 rounded-3xl border border-slate-200/50 dark:border-slate-800/10">
                    <Truck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-400">No pickups found in this category.</p>
                    <p className="text-xs text-slate-500 mt-1">Pickups are created automatically when an order is confirmed.</p>
                </div>
            ) : (
                <>
                    {/*  LIST VIEW  */}
                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredPickups.map(pickup => {
                                const order = pickup.rentalOrder || {};
                                const isDelayed = pickup.scheduledDate && new Date(pickup.scheduledDate) < new Date() && !['Completed', 'Cancelled'].includes(pickup.status);
                                return (
                                    <div key={pickup._id} onClick={() => selectPickupItem(pickup)}
                                        className={`glass-card rounded-3xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedPickup?._id === pickup._id ? 'ring-2 ring-brand-500/50' : ''
                                            } ${isDelayed ? 'border-red-500/20' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">#{order.orderNumber || 'PENDING'}</span>
                                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                                                    {pickup.productId?.name || 'Rental Equipment'}
                                                </h4>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <StatusBadge status={pickup.status} />
                                                {isDelayed && <span className="text-[8px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-black">DELAYED</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-slate-400">
                                            {pickup.customer && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span>{pickup.customer.name}</span>
                                                </div>
                                            )}
                                            {pickup.scheduledDate && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span>{new Date(pickup.scheduledDate).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {pickup.assignedEmployee && (
                                                <div className="flex items-center gap-1.5">
                                                    <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span>{pickup.assignedEmployee.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mini progress bar */}
                                        <div className="flex items-center gap-1">
                                            {['Pending', 'Assigned', 'Completed'].map((s, idx) => {
                                                const sRank = STEP_ORDER.indexOf(s);
                                                const curRank = STEP_ORDER.indexOf(pickup.status);
                                                const done = sRank <= curRank;
                                                return <div key={idx} className={`flex-1 h-1 rounded-full transition-all ${done ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800'}`} />;
                                            })}
                                        </div>

                                        <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>{pickup.checklist?.length || 0} item(s)</span>
                                            <span className="text-brand-500 font-black flex items-center gap-0.5">Manage <ArrowRight className="w-3.5 h-3.5" /></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/*  CALENDAR VIEW  */}
                    {viewMode === 'calendar' && (
                        <div className="glass-panel p-6 rounded-3xl space-y-3">
                            <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-brand-500" /> Pickup Schedule Timeline
                            </h3>
                            <div className="space-y-2">
                                {filteredPickups.map(p => (
                                    <div key={p._id} onClick={() => selectPickupItem(p)}
                                        className="flex items-center gap-4 p-4 bg-white/20 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl cursor-pointer hover:bg-brand-500/5 transition-all">
                                        <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-[9px] text-brand-500 uppercase font-black">
                                                {p.scheduledDate ? new Date(p.scheduledDate).toLocaleString('default', { month: 'short' }) : 'TBD'}
                                            </span>
                                            <span className="text-sm font-extrabold text-brand-500">
                                                {p.scheduledDate ? new Date(p.scheduledDate).getDate() : '-'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs truncate text-slate-800 dark:text-white">{p.productId?.name || 'Rental Equipment'}</p>
                                            <p className="text-[10px] text-slate-400">Customer: {p.customer?.name || 'N/A'}</p>
                                            <p className="text-[10px] text-slate-400">Time: {p.scheduledDate ? new Date(p.scheduledDate).toLocaleTimeString() : 'Not scheduled'}</p>
                                        </div>
                                        <StatusBadge status={p.status} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/*  MAP VIEW  */}
                    {viewMode === 'map' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between relative overflow-hidden min-h-[320px]">
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]" />
                                <div className="z-10 flex justify-between items-start">
                                    <div>
                                        <span className="text-[9px] uppercase font-black bg-brand-500 text-white px-2 py-0.5 rounded">Live Route Map</span>
                                        <h4 className="text-xs font-bold mt-1 text-slate-300">Active logistics routes simulation</h4>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-300">
                                        <Navigation className="w-3.5 h-3.5 text-brand-500 animate-spin" /> GPS Active
                                    </div>
                                </div>
                                {/* Animated route dots */}
                                <div className="z-10 relative flex items-center justify-center flex-1">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-4 h-4 rounded-full bg-brand-500 animate-ping" />
                                            <span className="text-[9px] text-slate-400">Warehouse</span>
                                        </div>
                                        <div className="w-24 border-t-2 border-dashed border-slate-600 relative">
                                            <div className="w-3 h-3 bg-amber-400 rounded-full absolute top-[-6px] left-1/2 animate-bounce" />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-4 h-4 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] text-slate-400">
                                                {selectedPickup ? selectedPickup.customer?.name : 'Customer'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="z-10 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                                    <span><MapPin className="w-3 h-3 inline mr-1 text-brand-500" />Warehouse WH-MAIN</span>
                                    <span className="text-slate-600">→</span>
                                    <span><MapPin className="w-3 h-3 inline mr-1 text-emerald-500" />{selectedPickup?.customer?.name || 'Select a pickup'}</span>
                                </div>
                            </div>
                            <div className="glass-panel p-5 rounded-3xl space-y-3">
                                <h3 className="font-extrabold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                    <Truck className="w-4 h-4 text-brand-500" /> Route Dispatch
                                </h3>
                                {filteredPickups.map(p => (
                                    <div key={p._id} onClick={() => selectPickupItem(p)}
                                        className="p-3 bg-white/20 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800/50 rounded-xl cursor-pointer hover:bg-brand-500/5 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-white">#{p.rentalOrder?.orderNumber || 'N/A'}</p>
                                            <p className="text-[9px] text-slate-400">{p.vehicleDetails || 'Vehicle not assigned'}</p>
                                        </div>
                                        <StatusBadge status={p.status} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/*  PICKUP DETAIL PANEL  */}
            {selectedPickup && (
                <div className="fixed inset-0 z-40 bg-transparent flex items-start justify-center p-6 overflow-y-auto">
                    <div className="w-full max-w-4xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 rounded-3xl my-8 relative overflow-hidden shadow-2xl">

                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-[#0c1222] backdrop-blur-xl p-6 border-b border-slate-200 dark:border-slate-800/60">
                            <button onClick={() => setSelectedPickup(null)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                            <span className="text-[10px] uppercase font-black text-brand-500">Pickup Workflow</span>
                            <div className="flex items-center gap-3 mt-1">
                                <h3 className="font-extrabold text-xl text-slate-800 dark:text-white">
                                    #{selectedPickup.rentalOrder?.orderNumber}
                                </h3>
                                <StatusBadge status={selectedPickup.status} />
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{selectedPickup.customer?.name}</span>
                                <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{selectedPickup.productId?.name || 'Equipment'}</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 bg-white dark:bg-[#0c1222]">
                            {/* Workflow Stepper */}
                            <WorkflowStepper currentStatus={selectedPickup.status} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* LEFT: Actions */}
                                <div className="lg:col-span-2 space-y-5">

                                    {/*  STEP 1: ASSIGN EXECUTIVE (status = Pending) */}
                                    {isAdmin && selectedPickup.status === 'Pending' && (
                                        <form onSubmit={handleAssignSubmit} className="glass-panel p-6 rounded-2xl border border-brand-500/15 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-brand-500/15 rounded-xl flex items-center justify-center">
                                                    <UserCheck className="w-4 h-4 text-brand-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase">Step 1 · Assign Delivery Executive</h4>
                                                    <p className="text-[10px] text-slate-400">Select a delivery executive from your registered fleet.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <select value={assignedEmployeeId} onChange={e => setAssignedEmployeeId(e.target.value)}
                                                    className="flex-1 glass-input text-xs" required>
                                                    <option value="">Select executive...</option>
                                                    {employees.map(emp => (
                                                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                                                    ))}
                                                </select>
                                                <button type="submit" disabled={actionLoading}
                                                    className="px-5 py-2.5 bg-brand-500 text-white hover:bg-brand-600 rounded-xl text-xs font-bold disabled:opacity-50">
                                                    {actionLoading ? '...' : 'Assign'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/*  STEP 2: CONFIRM DELIVERY — customer shares OTP with executive */}
                                    {isAdmin && ['Assigned', 'Scheduled', 'On The Way', 'OTP Verified'].includes(selectedPickup.status) && (
                                        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-cyan-500/15 rounded-xl flex items-center justify-center">
                                                    <ShieldCheck className="w-4 h-4 text-cyan-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase">Step 2 · Confirm Customer Handoff</h4>
                                                    <p className="text-[10px] text-slate-400">Customer sees the OTP in their Order History. Ask them to share it, then enter below.</p>
                                                </div>
                                            </div>

                                            {/* Show the active OTP for reference */}
                                            {selectedPickup.otp && (
                                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center justify-between">
                                                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3" /> Customer's OTP (for reference)
                                                    </span>
                                                    <span className="font-mono font-black text-emerald-400 text-sm tracking-widest">{selectedPickup.otp}</span>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <input type="text" value={otpValue} onChange={e => setOtpValue(e.target.value)}
                                                    className="flex-1 text-center font-mono font-bold tracking-widest text-sm glass-input"
                                                    placeholder="Enter OTP shared by customer" maxLength={6} />
                                                <button onClick={verifyOtpCode} disabled={actionLoading}
                                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 whitespace-nowrap">
                                                    {actionLoading ? '...' : '✅ Confirm Delivery'}
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-500 italic">On success → Pickup <strong>Completed</strong> + Order becomes <strong>Active</strong>.</p>
                                        </div>
                                    )}

                                    {/*  COMPLETED STATE  */}
                                    {selectedPickup.status === 'Completed' && (
                                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <CheckCircle2 className="w-6 h-6" />
                                                <h4 className="font-extrabold text-sm">Pickup Successfully Completed!</h4>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                The product has been delivered and the rental order is now <strong>Active</strong>. Inventory updated automatically.
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                                                <div className="p-3 bg-slate-950/30 rounded-xl">
                                                    <p className="text-[9px] text-white/50 mb-1 font-bold">HANDOVER TIME</p>
                                                    <p className="text-white font-extrabold text-xs">{selectedPickup.actualPickupDate ? new Date(selectedPickup.actualPickupDate).toLocaleString() : 'N/A'}</p>
                                                </div>
                                                <div className="p-3 bg-slate-950/30 rounded-xl">
                                                    <p className="text-[9px] text-white/50 mb-1 font-bold">SIGNED BY</p>
                                                    <p className="text-white font-extrabold text-xs">{selectedPickup.customerSignature || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/*  CANCELLED STATE  */}
                                    {selectedPickup.status === 'Cancelled' && (
                                        <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl">
                                            <div className="flex items-center gap-2 text-red-400">
                                                <AlertCircle className="w-5 h-5" />
                                                <p className="text-sm font-bold">This pickup has been cancelled.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cancel button */}
                                    {isAdmin && !['Completed', 'Cancelled'].includes(selectedPickup.status) && (
                                        <button onClick={cancelPickup} disabled={actionLoading}
                                            className="w-full py-2.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                                            Cancel Pickup
                                        </button>
                                    )}
                                </div>

                                {/* RIGHT: Timeline + Info */}
                                <div className="space-y-5">
                                    {/* Order Info Card */}
                                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                                            <FileText className="w-4 h-4 text-brand-500" /> Order Details
                                        </h4>
                                        <div className="space-y-1.5 text-[11px] text-slate-400">
                                            <p><span className="text-slate-500">Order:</span> #{selectedPickup.rentalOrder?.orderNumber}</p>
                                            <p><span className="text-slate-500">Customer:</span> {selectedPickup.customer?.name}</p>
                                            <p><span className="text-slate-500">Phone:</span> {selectedPickup.customer?.phone || 'N/A'}</p>
                                            <p><span className="text-slate-500">Scheduled:</span> {selectedPickup.scheduledDate ? new Date(selectedPickup.scheduledDate).toLocaleString() : 'Not set'}</p>
                                            <p><span className="text-slate-500">Vehicle:</span> {selectedPickup.vehicleDetails || 'Not assigned'}</p>
                                            {selectedPickup.assignedEmployee && (
                                                <p><span className="text-slate-500">Executive:</span> {selectedPickup.assignedEmployee.name}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                                            <Info className="w-4 h-4 text-brand-500" /> Audit Timeline
                                        </h4>
                                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-1 space-y-4">
                                            {(selectedPickup.timeline || []).slice().reverse().map((log, idx) => (
                                                <div key={idx} className="relative text-[11px] space-y-0.5">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white dark:border-slate-950" />
                                                    <span className="font-mono text-[9px] text-slate-500 block">
                                                        {new Date(log.updatedAt).toLocaleString()}
                                                    </span>
                                                    <span className="font-bold text-slate-300 block">{log.status}</span>
                                                    <span className="text-slate-500 block">{log.notes}</span>
                                                </div>
                                            ))}
                                            {(!selectedPickup.timeline || selectedPickup.timeline.length === 0) && (
                                                <p className="text-[10px] text-slate-500 italic">No timeline events yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            <ScannerSimulator
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
};

export default PickupWorkflow;
