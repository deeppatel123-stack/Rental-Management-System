import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Truck, Scan, ClipboardList } from 'lucide-react';
import { ScannerSimulator } from '../components/Scanner';

export const PickupWorkflow = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);


    const [selectedOrder, setSelectedOrder] = useState(null);
    const [otp, setOtp] = useState('');
    const [scannedSerials, setScannedSerials] = useState({});
    const [showScanner, setShowScanner] = useState(false);
    const [activeScanItem, setActiveScanItem] = useState(null);

    const fetchConfirmedOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rentals');
            if (res.data.success) {

                setOrders(res.data.orders.filter(o => o.status === 'Confirmed'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfirmedOrders();
    }, []);

    const openPickupDialog = (order) => {
        setSelectedOrder(order);
        setOtp('');


        const scansMap = {};
        order.products.forEach(p => {
            scansMap[p.product._id] = {
                name: p.product.name,
                targetQty: p.quantity,
                serials: []
            };
        });
        setScannedSerials(scansMap);
    };

    const handleScanSuccess = (serial) => {
        if (!activeScanItem || !selectedOrder) return;

        setScannedSerials(prev => {
            const copy = { ...prev };
            const item = copy[activeScanItem];
            if (item.serials.includes(serial)) {
                showToast('Serial item barcode already scanned!', 'error');
                return prev;
            }
            if (item.serials.length >= item.targetQty) {
                showToast('Required units count already scanned!', 'error');
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

    const handleConfirmPickupSubmit = async (e) => {
        e.preventDefault();
        if (!otp) return showToast('Enter customer verification code OTP details.', 'error');

        let allScanned = true;
        const serialsList = [];

        Object.values(scannedSerials).forEach(item => {
            if (item.serials.length < item.targetQty) {
                allScanned = false;
            }
            serialsList.push(...item.serials);
        });

        if (!allScanned) return showToast('Scan serial bar code items for all devices first.', 'error');

        try {
            const res = await api.post('/pickups/confirm', {
                orderId: selectedOrder._id,
                otp,
                scannedItems: serialsList
            });

            if (res.data.success) {
                showToast('Logistics pickup confirmed! Order is now Active.', 'success');
                setSelectedOrder(null);
                fetchConfirmedOrders();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Verification failure. Verify OTP details.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Logistics Pickups Workspace</h2>
                <p className="text-xs text-slate-500">Scan product barcodes, retrieve signatures, and verify dispatch OTP validations.</p>
            </div>

            {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Consulting warehouses schedules...</p>
            ) : orders.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-3xl text-sm text-slate-400 font-semibold">
                    No orders currently scheduled checkouts for dispatch.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <div key={order._id} className="glass-card rounded-3xl p-5 flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-brand-655 uppercase tracking-wider block font-mono">
                                    Contract Agreement: #{order.orderId}
                                </span>
                                <span className="text-xs text-slate-400">Customer: {order.customer?.name}</span>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                                    {order.products?.map(p => `${p.product?.name} (x${p.quantity})`).join(', ')}
                                </h4>
                            </div>

                            <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-3 flex justify-between items-center text-xs">
                                <span>Agreement signed:</span>
                                <span className="text-emerald-500 font-bold">Yes</span>
                            </div>

                            <button
                                onClick={() => openPickupDialog(order)}
                                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
                            >
                                <Truck className="w-4 h-4" /> Start Dispatch Verification
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
                                <span className="text-[9px] uppercase font-bold text-slate-400">Logistics dispatch validation</span>
                                <h3 className="font-extrabold text-sm">Agreement ID: {selectedOrder.orderId}</h3>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-xs text-slate-400 hover:underline">Close</button>
                        </div>

                        <form onSubmit={handleConfirmPickupSubmit} className="space-y-6">

                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/5 rounded-2xl space-y-2">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                                    Verify Dispatch Security OTP (Provide by customer)
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="6-Digit OTP e.g. 192837"
                                    className="w-full text-center tracking-widest font-mono text-md font-bold glass-input py-2"
                                    maxLength={6}
                                    required
                                />
                                <p className="text-[10px] text-slate-400">
                                    💡 Sandbox bypass: Lookup active Verification Code inside user database console profile if doing testing logs.
                                </p>
                            </div>


                            <div className="space-y-4">
                                <h4 className="text-xs font-extrabold flex items-center gap-1">
                                    <ClipboardList className="w-4.5 h-4.5 text-brand-500" /> Inventory Serial checklist verification
                                </h4>

                                <div className="space-y-3">
                                    {Object.entries(scannedSerials).map(([prodId, val]) => (
                                        <div key={prodId} className="p-4 bg-white/20 dark:bg-slate-950/20 border border-slate-205/50 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1 col-span-2">
                                                <h5 className="text-xs font-extrabold">{val.name}</h5>
                                                <p className="text-[10px] text-slate-450">Required Quantities: {val.targetQty} units</p>

                                                {val.serials.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1.5">
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
                                                    className="p-2.5 text-slate-400 hover:text-red-500 text-[10px]"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold uppercase transition-all shadow-md"
                            >
                                Approve Dispatch Checkmarks
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
export default PickupWorkflow;
