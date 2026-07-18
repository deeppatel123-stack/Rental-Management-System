import React, { useState } from 'react';
import { QrCode, Scan, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScannerSimulator = ({ isOpen, onClose, onScanSuccess, placeholder = "Select code to scan..." }) => {
    const [manualCode, setManualCode] = useState('');

    const demoCodes = [
        { label: 'Sony FX3 Cinema Camera Unit 1', code: 'SONY-FX3-SN-410982' },
        { label: 'DJI Ronin Gimbal Unit 1', code: 'DJI-R4D-SN-827361' },
        { label: 'MacBook Pro Unit 1', code: 'APL-MBP3M-SN-192837' },
        { label: 'Sennheiser Soundbar Unit 1', code: 'SENN-AMB-MAX-SN-510482' }
    ];

    const handleScanClick = (code) => {
        onScanSuccess(code);
        onClose();
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            onScanSuccess(manualCode.trim());
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-md overflow-hidden glass-panel rounded-2xl glow-primary"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span className="flex items-center gap-2 text-md font-semibold text-slate-800 dark:text-slate-100">
                                <Scan className="w-5 h-5 text-brand-500 animate-pulse" /> Barcode & QR Scanner Simulator
                            </span>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            
                            <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-700/50 flex items-center justify-center overflow-hidden">
                                
                                <div className="absolute inset-8 border-2 border-brand-500 border-dashed rounded-lg opacity-40"></div>
                                
                                <motion.div
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                    className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444]"
                                ></motion.div>
                                <div className="text-center z-10 flex flex-col items-center justify-center text-slate-405 gap-2 text-xs">
                                    <QrCode className="w-10 h-10 text-slate-500 mb-2 animate-bounce" />
                                    <p className="text-slate-400">Position barcode / QR in frame...</p>
                                    <p className="text-[#8b5cf6]/80 text-[10px]">Simulated live feed active</p>
                                </div>
                            </div>

                            
                            <div>
                                <p className="text-xs font-semibold text-slate-400 mb-2">Simulate scanning a seeded asset:</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {demoCodes.map(item => (
                                        <button
                                            key={item.code}
                                            onClick={() => handleScanClick(item.code)}
                                            className="text-left w-full text-xs p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 hover:bg-brand-500/10 hover:border-brand-500/30 transition-all font-mono"
                                        >
                                            {item.label} <span className="block text-[10px] text-slate-400">{item.code}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            
                            <form onSubmit={handleManualSubmit} className="space-y-2 border-t border-slate-200/20 pt-4">
                                <label className="text-xs font-semibold text-slate-400">Or enter serial code manually:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="e.g. SONY-FX3-SN-81203"
                                        className="flex-1 glass-input text-xs"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                                    >
                                        Resolve
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
