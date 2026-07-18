import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    RotateCcw, Scan, ClipboardList, Calendar, MapPin,
    CheckCircle2, AlertTriangle, ShieldCheck, DollarSign,
    UserCheck, History, X, Image as ImageIcon, Check, Info, FileText,
    ArrowRight, Clock
} from 'lucide-react';
import { ScannerSimulator } from '../components/Scanner';

export const ReturnWorkflow = () => {
    const { showToast } = useToast();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);

    // Selection & Sub-views
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // list, calendar

    // Operations states
    const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [notes, setNotes] = useState('');
    const [checklistItems, setChecklistItems] = useState([]);

    // Inspection parameters
    const [inspectedCondition, setInspectedCondition] = useState('Excellent'); // Excellent, Good, Minor Damage, Major Damage, Lost
    const [damageNotes, setDamageNotes] = useState('');
    const [damageCost, setDamageCost] = useState(0);
    const [accessoryItems, setAccessoryItems] = useState([
        { name: 'Power Cable', present: true },
        { name: 'Lens Cap / Cover case', present: true },
        { name: 'Lens bracket mount', present: true }
    ]);
    const [damageImageMock, setDamageImageMock] = useState(null);
    const [signatureTyped, setSignatureTyped] = useState('');

    // Late Return calculations preview
    const [lateReturnFee, setLateReturnFee] = useState(0);
    const [gracePeriodExceeded, setGracePeriodExceeded] = useState(false);

    // Scanner simulator
    const [showScanner, setShowScanner] = useState(false);
    const [activeChecklistIndex, setActiveChecklistIndex] = useState(null);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const res = await api.get('/returns');
            if (res.data.success) {
                setReturns(res.data.returns);
            }
        } catch (err) {
            console.error('Error fetching returns:', err);
            showToast('Failed to fetch returns schedule', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/partners');
            if (res.data.success) {
                setEmployees(res.data.data);
            } else {
                setEmployees([
                    { _id: 'emp-1', name: 'John Doe Executive', email: 'john@rental.com' },
                    { _id: 'emp-2', name: 'Michael Carrier', email: 'michael@rental.com' },
                    { _id: 'emp-3', name: 'Ravi Logistics', email: 'ravi@rental.com' },
                ]);
            }
        } catch (err) {
            setEmployees([
                { _id: 'emp-1', name: 'John Doe Executive', email: 'john@rental.com' },
                { _id: 'emp-2', name: 'Michael Carrier', email: 'michael@rental.com' },
                { _id: 'emp-3', name: 'Ravi Logistics', email: 'ravi@rental.com' },
            ]);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchEmployees();
    }, []);

    // Late calculation on UI side
    const calculateLateFeePreview = (retObj) => {
        if (!retObj || !retObj.rentalOrder) return;
        const o = retObj.rentalOrder;
        const end = new Date(o.endDate);
        const now = new Date();
        if (now > end) {
            const diffMs = now - end;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            // rough daily rate simulation
            const totalDailyRate = 50;
            const fee = Math.max(1, diffHours) * (totalDailyRate / 24) * 1.5;
            setLateReturnFee(Math.round(fee * 100) / 100);
            setGracePeriodExceeded(true);
        } else {
            setLateReturnFee(0);
            setGracePeriodExceeded(false);
        }
    };

    const selectReturnItem = (ret) => {
        setSelectedReturn(ret);
        setAssignedEmployeeId(ret.assignedEmployee?._id || ret.assignedExecutiveId?._id || '');
        if (ret.scheduledDate) {
            const d = new Date(ret.scheduledDate);
            setScheduledDate(d.toISOString().split('T')[0]);
            setScheduledTime(d.toTimeString().slice(0, 5));
        } else {
            setScheduledDate('');
            setScheduledTime('');
        }
        setNotes(ret.notes || '');
        setDamageNotes('');
        setDamageCost(0);
        setInspectedCondition('Excellent');
        setSignatureTyped('');
        setChecklistItems(ret.checklist || []);
        calculateLateFeePreview(ret);
    };

    // Filters
    const filteredReturns = returns.filter(ret => {
        if (activeTab === 'All') return true;
        if (activeTab === "Today's Returns") {
            const today = new Date().toDateString();
            return ret.scheduledDate && new Date(ret.scheduledDate).toDateString() === today;
        }
        if (activeTab === 'Upcoming Returns') {
            const todayStart = new Date();
            todayStart.setHours(23, 59, 59, 999);
            return ret.scheduledDate && new Date(ret.scheduledDate) > todayStart && ret.status !== 'Completed' && ret.status !== 'Cancelled';
        }
        if (activeTab === 'Late Returns') {
            const now = new Date();
            return ret.rentalOrder && new Date(ret.rentalOrder.endDate) < now && ret.status !== 'Completed' && ret.status !== 'Cancelled';
        }
        if (activeTab === 'Pending Returns') {
            return ret.status === 'Pending';
        }
        if (activeTab === 'Completed Returns') {
            return ret.status === 'Completed';
        }
        return ret.status === activeTab;
    });

    // Actions
    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assignedEmployeeId) return showToast('Please select an agent', 'warning');
        try {
            const res = await api.put(`/returns/${selectedReturn._id}/assign`, { employeeId: assignedEmployeeId });
            if (res.data.success) {
                showToast('Agent assigned to return successfully', 'success');
                selectReturnItem(res.data.returnDoc);
                fetchReturns();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Assignment failed', 'error');
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        if (!scheduledDate) return showToast('Please select scheduled date', 'warning');
        const dateTimeStr = `${scheduledDate}T${scheduledTime || '09:00'}`;
        try {
            const res = await api.put(`/returns/${selectedReturn._id}/schedule`, {
                scheduledDate: dateTimeStr,
                notes
            });
            if (res.data.success) {
                showToast('Return appointment scheduled successfully!', 'success');
                selectReturnItem(res.data.returnDoc);
                fetchReturns();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Scheduling failed', 'error');
        }
    };

    const startReturnInspection = async () => {
        try {
            const res = await api.patch(`/returns/${selectedReturn._id}/status`, {
                status: 'Inspection',
                notes: 'Return agent has met the customer and is inspecting equipment.'
            });
            if (res.data.success) {
                showToast('Moved to Inspection phase!', 'success');
                selectReturnItem(res.data.returnDoc);
                fetchReturns();
            }
        } catch (err) {
            showToast('Failed to start inspection', 'error');
        }
    };

    const scanSerialNumber = (idx) => {
        setActiveChecklistIndex(idx);
        setShowScanner(true);
    };

    const handleScanSuccess = (code) => {
        if (activeChecklistIndex === null) return;
        setChecklistItems(prev => {
            const updated = [...prev];
            updated[activeChecklistIndex] = {
                ...updated[activeChecklistIndex],
                serialNumber: code,
                status: 'Returned'
            };
            return updated;
        });
        showToast(`Serial number scanned: ${code}`, 'success');
        setActiveChecklistIndex(null);
    };

    const handleAccessoryCheck = (idx) => {
        setAccessoryItems(prev => {
            const updated = [...prev];
            updated[idx].present = !updated[idx].present;
            return updated;
        });
    };

    const handleImageMockUpload = () => {
        setDamageImageMock('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800');
        showToast('Damage inspection image successfully uploaded!', 'success');
    };

    const handleClassifyCondition = (c) => {
        setInspectedCondition(c);
        if (c === 'Minor Damage') {
            setDamageCost(25);
        } else if (c === 'Major Damage') {
            setDamageCost(150);
        } else if (c === 'Lost') {
            setDamageCost(500);
        } else {
            setDamageCost(0);
        }
    };

    const confirmFinalReturnDetails = async (e) => {
        e.preventDefault();
        const unverified = checklistItems.find(item => !item.serialNumber);
        if (unverified) {
            return showToast('Check-in all product serial numbers first!', 'warning');
        }
        if (!signatureTyped.trim()) {
            return showToast('Confirm using typed customer signature is required', 'warning');
        }

        // Map checklist condition rating details
        const updatedChecklist = checklistItems.map(item => ({
            ...item,
            status: inspectedCondition === 'Lost' ? 'Lost' : inspectedCondition === 'Excellent' || inspectedCondition === 'Good' ? 'Returned' : 'Damaged',
            conditionRating: inspectedCondition === 'Excellent' || inspectedCondition === 'Good' ? inspectedCondition : 'Damaged',
            damageCost: damageCost,
            damageDescription: damageNotes,
            accessoriesReturned: accessoryItems
        }));

        try {
            // Mock dynamic transition or direct confirmation API Call
            await api.patch(`/returns/${selectedReturn._id}/status`, {
                status: 'Penalty Calculation',
                notes: 'Inspection results entered. Calculating penalties.'
            });

            await api.patch(`/returns/${selectedReturn._id}/status`, {
                status: 'Refund Processing',
                notes: 'Adjusting security deposits & invoicing.'
            });

            // Call backend confirm endpoint
            const res = await api.post(`/returns/${selectedReturn._id}/confirm`, {
                checklist: updatedChecklist,
                notes: damageNotes || 'Equipment return settled.'
            });

            if (res.data.success) {
                showToast('Rental Return finalized and security deposits settled!', 'success');
                setSelectedReturn(null);
                fetchReturns();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Finalization failed', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
                        <RotateCcw className="w-7 h-7 text-brand-500 animate-spin-slow" /> Logistics Returns Workspace
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xl">
                        Verify returned hardware serial numbers, accessory checklists, condition mapping, and deposit settlements.
                    </p>
                </div>

                <div className="flex items-center gap-2 px-1 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'list' ? 'bg-brand-505 text-white' : 'text-slate-400'}`}
                    >
                        List view
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'calendar' ? 'bg-brand-505 text-white' : 'text-slate-400'}`}
                    >
                        Date list
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-200/50 dark:border-slate-800/60 scrollbar-none overflow-x-auto">
                {['All', "Today's Returns", 'Upcoming Returns', 'Late Returns', 'Pending Returns', 'Completed Returns'].map((tab) => {
                    const count = returns.filter(ret => {
                        if (tab === 'All') return true;
                        if (tab === "Today's Returns") {
                            const today = new Date().toDateString();
                            return ret.scheduledDate && new Date(ret.scheduledDate).toDateString() === today;
                        }
                        if (tab === 'Upcoming Returns') {
                            const todayStart = new Date();
                            todayStart.setHours(23, 59, 59, 999);
                            return ret.scheduledDate && new Date(ret.scheduledDate) > todayStart && ret.status !== 'Completed' && ret.status !== 'Cancelled';
                        }
                        if (tab === 'Late Returns') {
                            const now = new Date();
                            return ret.rentalOrder && new Date(ret.rentalOrder.endDate) < now && ret.status !== 'Completed' && ret.status !== 'Cancelled';
                        }
                        if (tab === 'Pending Returns') return ret.status === 'Pending';
                        if (tab === 'Completed Returns') return ret.status === 'Completed';
                        return false;
                    }).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab
                                ? 'bg-brand-500/10 text-brand-655 border border-brand-500/20'
                                : 'text-slate-400 hover:text-slate-200 border border-transparent'
                                }`}
                        >
                            {tab}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* List Return elements */}
            {loading ? (
                <div className="py-24 text-center text-xs text-slate-400 animate-pulse">Consulting cargo returns data...</div>
            ) : filteredReturns.length === 0 ? (
                <div className="glass-panel text-center py-20 rounded-3xl text-sm font-semibold text-slate-450 border border-slate-200/50 dark:border-slate-800/10">
                    No return schedule checklists matching filter configuration.
                </div>
            ) : (
                <>
                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredReturns.map(ret => {
                                const order = ret.rentalOrder || {};
                                const isLate = ret.rentalOrder && new Date(ret.rentalOrder.endDate) < new Date();
                                return (
                                    <div
                                        key={ret._id}
                                        onClick={() => selectReturnItem(ret)}
                                        className={`glass-card rounded-3xl p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700/50 transition-all duration-300 ${selectedReturn?._id === ret._id ? 'ring-2 ring-brand-500' : ''
                                            }`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">
                                                    #{order.orderNumber || 'AGREEMENT'}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {isLate && ret.status !== 'Completed' && (
                                                        <span className="text-[9px] px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-lg">LATE</span>
                                                    )}
                                                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold border ${ret.status === 'Completed'
                                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                                                        : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-455'
                                                        }`}>
                                                        {ret.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-xs text-slate-400 space-y-1">
                                                <p><span className="font-semibold text-slate-500">Customer:</span> {ret.customer?.name || 'N/A'}</p>
                                                {ret.scheduledDate && (
                                                    <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date: {new Date(ret.scheduledDate).toLocaleString()}</p>
                                                )}
                                                {ret.assignedEmployee && (
                                                    <p className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Agent: {ret.assignedEmployee.name}</p>
                                                )}
                                            </div>

                                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white pt-1">
                                                {ret.productId?.name || 'Multiple Equipment Cargo'}
                                            </h4>
                                        </div>

                                        <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>Accessories checklist: {accessoryItems.length}</span>
                                            <span className="text-brand-505 font-black flex items-center gap-0.5">Inspect <ArrowRight className="w-3.5 h-3.5" /></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {viewMode === 'calendar' && (
                        <div className="glass-panel p-6 rounded-3xl space-y-4">
                            <h3 className="font-extrabold text-sm mb-4">Returns Cargo Calendar Timeline</h3>
                            <div className="space-y-3">
                                {filteredReturns.map(ret => (
                                    <div
                                        key={ret._id}
                                        onClick={() => selectReturnItem(ret)}
                                        className="flex items-center gap-4 p-4 bg-white/20 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl cursor-pointer hover:bg-brand-505/5"
                                    >
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-[9px] text-indigo-500 uppercase font-black">
                                                {ret.scheduledDate ? new Date(ret.scheduledDate).toLocaleString('default', { month: 'short' }) : 'N/A'}
                                            </span>
                                            <span className="text-sm font-extrabold text-indigo-555">
                                                {ret.scheduledDate ? new Date(ret.scheduledDate).getDate() : '-'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-xs truncate">{ret.productId?.name || 'Multiple Hardware assets'}</h4>
                                            <p className="text-[10px] text-slate-400">Return Slot: {ret.scheduledDate ? new Date(ret.scheduledDate).toLocaleTimeString() : 'Not scheduled'}</p>
                                        </div>
                                        <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-510/20 text-indigo-555">{ret.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Return Inspection overlay Modal */}
            {selectedReturn && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-5xl glass-panel p-8 rounded-3xl space-y-8 my-8 relative">
                        <button
                            onClick={() => setSelectedReturn(null)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-205 dark:hover:bg-slate-850 text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                            <span className="text-[10px] uppercase font-black text-indigo-500">Return inspection workspace panel</span>
                            <h3 className="font-extrabold text-lg flex items-center gap-2">
                                Order Agreement: #{selectedReturn.rentalOrder?.orderNumber}
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full border bg-indigo-500/10 border-indigo-500/20 text-indigo-405">
                                    {selectedReturn.status}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Customer: {selectedReturn.customer?.name} ({selectedReturn.customer?.email})</p>
                        </div>

                        {/* Return Workflow Stepper */}
                        <div className="grid grid-cols-2 md:grid-cols-9 gap-2 pt-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                            {[
                                { label: 'Requested', step: 'Pending' },
                                { label: 'Assigned', step: 'Assigned' },
                                { label: 'Scheduled', step: 'Scheduled' },
                                { label: 'Inspection', step: 'Inspection' },
                                { label: 'Damages', step: 'Damage Review' },
                                { label: 'Late Penalty', step: 'Penalty Calculation' },
                                { label: 'Refunds', step: 'Refund Processing' },
                                { label: 'Completed', step: 'Completed' }
                            ].map((stepObj, index) => {
                                const currentRank = ['Pending', 'Assigned', 'Scheduled', 'Inspection', 'Damage Review', 'Penalty Calculation', 'Refund Processing', 'Completed'].indexOf(selectedReturn.status);
                                const itemRank = ['Pending', 'Assigned', 'Scheduled', 'Inspection', 'Damage Review', 'Penalty Calculation', 'Refund Processing', 'Completed'].indexOf(stepObj.step);
                                const isCompleted = itemRank < currentRank || selectedReturn.status === 'Completed';
                                const isActive = selectedReturn.status === stepObj.step;

                                return (
                                    <div key={index} className="flex flex-col items-center text-center gap-1.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : isActive
                                                ? 'bg-indigo-500 border-indigo-500 text-white animate-pulse'
                                                : 'border-slate-200 dark:border-slate-800 text-slate-550'
                                            }`}>
                                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                                        </div>
                                        <span className={`text-[9px] font-extrabold ${isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-500' : 'text-slate-500'}`}>
                                            {stepObj.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Details content map */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Actions area */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Step 1: Assignment */}
                                {selectedReturn.status === 'Pending' && (
                                    <form onSubmit={handleAssignSubmit} className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-4">
                                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-indigo-500" /> Assign Return Executive</h4>
                                        <div className="flex gap-2">
                                            <select
                                                value={assignedEmployeeId}
                                                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                                                className="flex-1 glass-input text-xs"
                                                required
                                            >
                                                <option value="">Select corporate agent...</option>
                                                {employees.map(emp => (
                                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                                ))}
                                            </select>
                                            <button type="submit" className="px-5 py-2 bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl text-xs font-bold text-center">Assign</button>
                                        </div>
                                    </form>
                                )}

                                {/* Step 2: Schedule Return */}
                                {(selectedReturn.status === 'Assigned' || selectedReturn.status === 'Scheduled') && (
                                    <form onSubmit={handleScheduleSubmit} className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-4">
                                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-500" /> Schedule Return slot appointment</h4>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-slate-400 font-bold">Planned Day</span>
                                                <input
                                                    type="date"
                                                    value={scheduledDate}
                                                    onChange={(e) => setScheduledDate(e.target.value)}
                                                    className="w-full glass-input text-xs"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-slate-400 font-bold">Planned Time</span>
                                                <input
                                                    type="time"
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    className="w-full glass-input text-xs"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-400 font-bold">Notes</span>
                                            <input
                                                type="text"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full glass-input text-xs"
                                                placeholder="e.g. Schedule warehouse drop verification panel"
                                            />
                                        </div>

                                        <button type="submit" className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all">
                                            Lock Return Slot
                                        </button>
                                    </form>
                                )}

                                {/* Step 3: Trigger Inspection */}
                                {selectedReturn.status === 'Scheduled' && (
                                    <div className="p-6 bg-slate-50 dark:bg-slate-905 border border-slate-205 dark:border-slate-800 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-bold text-slate-650 flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-555" /> Start Inspection Process</h4>
                                        <p className="text-[10.5px] text-slate-400">Mark that the executive has arrived and started physically checking the devices.</p>
                                        <button
                                            onClick={startReturnInspection}
                                            className="px-5 py-2.5 bg-indigo-550 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                                        >
                                            <ClipboardList className="w-4 h-4" /> Start Inspection checks
                                        </button>
                                    </div>
                                )}

                                {/* Step 4: Inspections & checklists & damages & refund invoices confirmation */}
                                {['Inspection', 'Damage Review', 'Penalty Calculation', 'Refund Processing'].includes(selectedReturn.status) && (
                                    <form onSubmit={confirmFinalReturnDetails} className="space-y-6">

                                        {/* Barcode scans */}
                                        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-4">
                                            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Scan className="w-4 h-4 text-indigo-500" /> Verify Hardware bar codes check-in</h4>

                                            <div className="space-y-3">
                                                {checklistItems.map((item, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                                                        <div>
                                                            <p className="font-bold">{item.productName}</p>
                                                            {item.serialNumber ? (
                                                                <span className="text-[9px] font-mono text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Checked: {item.serialNumber}</span>
                                                            ) : (
                                                                <span className="text-[9px] font-mono text-red-500 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">Pending barcode validation</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => scanSerialNumber(idx)}
                                                            className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-655 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-brand-500/20"
                                                        >
                                                            Scan Barcode
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Accessory checklist */}
                                        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-4">
                                            <h4 className="text-xs font-semibold text-slate-705 dark:text-slate-205 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-indigo-500" /> Verify Accessories check-in</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {accessoryItems.map((ac, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleAccessoryCheck(idx)}
                                                        className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between text-xs font-extrabold ${ac.present
                                                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                                            : 'bg-white/10 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                                            }`}
                                                    >
                                                        <span>{ac.name}</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={ac.present}
                                                            readOnly
                                                            className="accent-emerald-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Condition classification & damage reporting */}
                                        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-4">
                                            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-350">Asset condition & damage assessments</h4>

                                            <div className="flex flex-wrap gap-2">
                                                {['Excellent', 'Good', 'Minor Damage', 'Major Damage', 'Lost'].map(cond => (
                                                    <button
                                                        key={cond}
                                                        type="button"
                                                        onClick={() => handleClassifyCondition(cond)}
                                                        className={`px-3.5 py-2 rounded-xl text-[10.5px] font-bold border transition-all ${inspectedCondition === cond
                                                            ? 'bg-brand-500 border-brand-500 text-white shadow-md'
                                                            : 'bg-white/10 dark:bg-slate-950/20 border-slate-205 dark:border-slate-800 text-slate-400 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        {cond}
                                                    </button>
                                                ))}
                                            </div>

                                            {['Minor Damage', 'Major Damage', 'Lost'].includes(inspectedCondition) && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-slate-400 font-bold">Deduction Damage cost ($)</span>
                                                        <input
                                                            type="number"
                                                            value={damageCost}
                                                            onChange={(e) => setDamageCost(Number(e.target.value))}
                                                            className="w-full glass-input text-xs"
                                                            min={0}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-1">
                                                        <span className="text-[10px] text-slate-400 font-bold">Damage notes description</span>
                                                        <input
                                                            type="text"
                                                            value={damageNotes}
                                                            onChange={(e) => setDamageNotes(e.target.value)}
                                                            className="w-full glass-input text-xs"
                                                            placeholder="Describe hardware cracks or missing parts details..."
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/10 flex items-center justify-between text-xs">
                                                <span className="text-slate-440 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Upload damage validation images</span>
                                                {damageImageMock ? (
                                                    <span className="text-emerald-555 font-bold">Image loaded successfully ✓</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleImageMockUpload}
                                                        className="px-3 py-1 bg-slate-900 border border-slate-808 rounded text-[9px] text-slate-400 hover:text-slate-209"
                                                    >
                                                        Upload Image
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Penalty invoicing & Deposit Refund details */}
                                        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-4 bg-gradient-to-r from-red-500/5 via-indigo-500/5 to-emerald-500/5">
                                            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-indigo-500" /> Settle Escrow billing ledger</h4>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                                                <div className="p-3 bg-slate-900/50 border border-slate-805 rounded-xl text-center">
                                                    <p className="text-[9px] text-slate-400">Security Deposit</p>
                                                    <p className="font-extrabold text-[13px] text-teal-400">${selectedReturn.rentalOrder?.securityDeposit || 200}</p>
                                                </div>
                                                <div className="p-3 bg-slate-900/50 border border-slate-805 rounded-xl text-center">
                                                    <p className="text-[9px] text-slate-400">Late return penalty</p>
                                                    <p className="font-extrabold text-[13px] text-amber-500">${lateReturnFee.toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-slate-900/50 border border-slate-805 rounded-xl text-center">
                                                    <p className="text-[9px] text-slate-400">Damage charge</p>
                                                    <p className="font-extrabold text-[13px] text-red-500">${damageCost.toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-slate-900/50 border border-slate-805 rounded-xl text-center">
                                                    <p className="text-[9px] text-slate-400">Refund escrow return</p>
                                                    <p className="font-extrabold text-[13px] text-emerald-450">
                                                        ${Math.max(0, (selectedReturn.rentalOrder?.securityDeposit || 200) - lateReturnFee - damageCost).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            {gracePeriodExceeded && (
                                                <div className="text-[10px] text-amber-500 flex items-center gap-1.5">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Note: Grace period exceeded! Autocalculator has applied hourly/daily late multipliers.
                                                </div>
                                            )}
                                        </div>

                                        {/* Signature */}
                                        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-3">
                                            <span className="text-[10.5px] font-bold text-slate-400">Confirm Customer's Legal signature</span>
                                            <input
                                                type="text"
                                                value={signatureTyped}
                                                onChange={(e) => setSignatureTyped(e.target.value)}
                                                className="w-full glass-input text-xs"
                                                placeholder="Type customer's full name to close"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold uppercase transition-all shadow-md"
                                        >
                                            Finalize Return inspection & settle refunds
                                        </button>
                                    </form>
                                )}

                                {selectedReturn.status === 'Completed' && (
                                    <div className="p-6 bg-emerald-580/5 border border-emerald-580/20 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-555">
                                            <CheckCircle2 className="w-6 h-6" />
                                            <h4 className="font-black text-sm">Escrow Return closed successfully! Checkmarks verified.</h4>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Inspection is finished, accessories checked, late fees assessed. The security refund logs and final receipts has been generated.
                                        </p>
                                        <div className="text-xs text-slate-400 font-mono space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/10">
                                            <p>✓ Closed Timestamp: {new Date(selectedReturn.actualReturnDate).toLocaleString()}</p>
                                            <p>✓ Inspected Damage cost: ${selectedReturn.repairCostTotal}</p>
                                            <p>✓ Inspected Late return fee: ${selectedReturn.calculatedLateFee}</p>
                                            <p>✓ Settled Deposit Release status: Successful</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Timeline audit logger side */}
                            <div className="space-y-6">
                                <div className="glass-panel p-6 rounded-2xl border border-slate-205 dark:border-slate-850 space-y-4">
                                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-250 flex items-center gap-1.5"><Info className="w-4 h-4 text-indigo-500" /> Return Audit Chronology</h4>

                                    <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-2 space-y-5">
                                        {selectedReturn.timeline && selectedReturn.timeline.map((log, lIdx) => (
                                            <div key={lIdx} className="relative text-[11px] space-y-1">
                                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900"></div>
                                                <span className="font-mono text-[9px] text-slate-500 block">{new Date(log.updatedAt).toLocaleString()}</span>
                                                <span className="font-bold text-slate-350 block">{log.status}</span>
                                                <span className="text-slate-490 text-[10px] block">{log.notes || 'Status checklist logged.'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ScannerSimulator
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
};
export default ReturnWorkflow;
