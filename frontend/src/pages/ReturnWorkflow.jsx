import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RotateCcw, Scan } from 'lucide-react';
import { ScannerSimulator } from '../components/Scanner';

export const ReturnWorkflow = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);


    const [selectedOrder, setSelectedOrder] = useState(null);
    const [scannedSerials, setScannedSerials] = useState({});
    const [showScanner, setShowScanner] = useState(false);
    const [activeScanItem, setActiveScanItem] = useState(null);


    const [damagesExist, setDamagesExist] = useState(false);
    const [damagesCost, setDamagesCost] = useState(0);
    const [damagesNotes, setDamagesNotes] = useState('');

    const fetchActiveOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rentals');
            if (res.data.success) {
                setOrders(res.data.orders.filter(
                    o => o.status === 'Active' || o.status === 'Overdue' || o.status === 'Return Requested'
                ));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveOrders();
    }, []);

    const openReturnDialog = (order) => {
        setSelectedOrder(order);
        setDamagesExist(false);
        setDamagesCost(0);
        setDamagesNotes('');

        const scans = {};
        order.products.forEach(p => {
            scans[p.product._id] = {
                name: p.product.name,
                targetQty: p.quantity,
                serials: []
            };
        });
        setScannedSerials(scans);
    };

    const handleScanSuccess = (serial) => {
        if (!activeScanItem) return;
        setScannedSerials(prev => {
            const copy = { ...prev };
            const item = copy[activeScanItem];
            if (item.serials.includes(serial)) {
                showToast('Serial item barcode already checked!', 'error');
                return prev;
            }
            if (item.serials.length >= item.targetQty) {
                showToast('Required units count already checked!', 'error');
                return prev;
            }
            item.serials.push(serial);
            return copy;
        });
        setActiveScanItem(null);
    };

    const clearScanArray = (prodId) => {
        setScannedSerials(prev => {
            const copy = { ...prev };
            copy[prodId].serials = [];
            return copy;
        });
    };

    const handleConfirmReturnSubmit = async (e) => {
        e.preventDefault();


        let allScanned = true;
        Object.values(scannedSerials).forEach(item => {
            if (item.serials.length < item.targetQty) {
                allScanned = false;
            }
        });

        if (!allScanned) return showToast('Confirm arrival checkmarks by scanning all item serial code barcodes.', 'error');

        try {
            const res = await api.post('/returns/confirm', {
                orderId: selectedOrder._id,
                damages: damagesExist,
                damageAssessmentCost: damagesExist ? damagesCost : 0,
                notes: damagesNotes || 'Standard return checkmarks OK.'
            });

            if (res.data.success) {
                showToast('Return operations resolved successfully! Escrow deposit settled and receipt PDF sheet generated.', 'success');
                setSelectedOrder(null);
                fetchActiveOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error executing returns.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Logistics Returns Inspection</h2>
                <p className="text-xs text-slate-500">Scan returned units, review physical damages checks, and settle deposit billing transactions.</p>
            </div>

            {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Scanning ledger schedules...</p>
            ) : orders.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-3xl text-sm text-slate-400 font-semibold">
                    No active bookings out for rental.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <div key={order._id} className="glass-card rounded-3xl p-5 flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                                        ID: #{order.orderId}
                                    </span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black border ${order.status === 'Return Requested'
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                        : order.status === 'Overdue'
                                            ? 'bg-red-500/10 border-red-500/20 text-red-500 font-black'
                                            : 'bg-brand-500/10 border-brand-500/20 text-brand-655'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 block pt-1">User: {order.customer?.name}</span>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                                    {order.products?.map(p => `${p.product?.name} (x${p.quantity})`).join(', ')}
                                </h4>
                            </div>

                            <button
                                onClick={() => openReturnDialog(order)}
                                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                <RotateCcw className="w-4 h-4" /> Start Inspection Checks
                            </button>
                        </div>
                    ))}
                </div>
            )}


            {selectedOrder && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl glass-panel p-6 rounded-3xl space-y-6 my-8">
                        <div className="flex justify-between items-start border-b border-slate-205 dark:border-slate-800/10 pb-3">
                            <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400">Return inspection verification</span>
                                <h3 className="font-extrabold text-sm">Agreement ID: {selectedOrder.orderId}</h3>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-xs text-slate-400 hover:underline">Close</button>
                        </div>

                        <form onSubmit={handleConfirmReturnSubmit} className="space-y-6">

                            <div className="space-y-4">
                                <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                                    Check-In Serial scanning
                                </h4>

                                <div className="space-y-3">
                                    {Object.entries(scannedSerials).map(([prodId, val]) => (
                                        <div key={prodId} className="p-4 bg-white/20 dark:bg-slate-950/20 border border-slate-205 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <h5 className="text-xs font-extrabold">{val.name}</h5>
                                                <p className="text-[10px] text-slate-450">Required check count: {val.targetQty} units</p>

                                                {val.serials.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {val.serials.map(sn => (
                                                            <span key={sn} className="text-[9px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-650 px-2 py-0.5 rounded">
                                                                {sn}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveScanItem(prodId);
                                                        setShowScanner(true);
                                                    }}
                                                    disabled={val.serials.length >= val.targetQty}
                                                    className="px-3.5 py-2.5 bg-brand-500/15 border border-brand-500/25 hover:bg-brand-500/30 text-brand-655 text-[10px] font-bold rounded-xl flex items-center gap-1"
                                                >
                                                    <Scan className="w-3.5 h-3.5" /> Scan SN Barcode
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => clearScanArray(prodId)}
                                                    className="p-2 py-1 text-slate-400 hover:text-red-500 text-[10px]"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>


                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-205/50 dark:border-slate-800 rounded-2xl space-y-4">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={damagesExist}
                                        onChange={() => setDamagesExist(!damagesExist)}
                                        className="accent-brand-500"
                                    />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                                        Report damages or missing gear accessories
                                    </span>
                                </label>

                                {damagesExist && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-450 font-bold">Assessed Damage Costs ($)</span>
                                            <input
                                                type="number"
                                                value={damagesCost}
                                                onChange={(e) => setDamagesCost(Number(e.target.value))}
                                                className="w-full glass-input text-xs"
                                                min={0}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <span className="text-[10px] text-slate-460 font-bold">Inspection Fault Notes</span>
                                            <input
                                                type="text"
                                                value={damagesNotes}
                                                onChange={(e) => setDamagesNotes(e.target.value)}
                                                placeholder="e.g. Lens cap scratched badly, baseplate bracket loose"
                                                className="w-full glass-input text-xs"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold uppercase transition-all shadow-md"
                            >
                                Complete Settle & Close Agreement
                            </button>
                        </form>
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
