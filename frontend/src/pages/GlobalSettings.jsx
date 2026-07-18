import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Settings, Save } from 'lucide-react';

export const GlobalSettings = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [orgName, setOrgName] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [taxRate, setTaxRate] = useState(8);
    const [gracePeriod, setGracePeriod] = useState(30);
    const [lateFeeType, setLateFeeType] = useState('daily');
    const [multiplier, setMultiplier] = useState(1.5);
    const [maxLateLimit, setMaxLateLimit] = useState(500);
    const [policy, setPolicy] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data.success) {
                    const s = res.data.settings;
                    setOrgName(s.orgName || '');
                    setCurrency(s.currency || 'USD');
                    setTaxRate(s.taxRate ?? 8);
                    setGracePeriod(s.gracePeriodMinutes ?? 30);
                    setLateFeeType(s.lateFeeChargeType || 'daily');
                    setMultiplier(s.lateFeeMultiplier ?? 1.5);
                    setMaxLateLimit(s.maxLateFeeLimit ?? 500);
                    setPolicy(s.rentalPolicy || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/settings', {
                orgName,
                currency,
                taxRate,
                gracePeriodMinutes: gracePeriod,
                lateFeeChargeType: lateFeeType,
                lateFeeMultiplier: multiplier,
                maxLateFeeLimit: maxLateLimit,
                rentalPolicy: policy
            });
            if (res.data.success) {
                showToast('Global configurations modified successfully!', 'success');
            }
        } catch (err) {
            showToast('Failed to modify global configurations.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-8 text-center text-xs text-slate-400 animate-pulse">Running settings queries...</p>;
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Business Rule Configurations</h2>
                <p className="text-xs text-slate-500">Configure logistics checkpoints, grace buffers, and dynamic automated late invoicing variables.</p>
            </div>

            <form onSubmit={handleSave} className="glass-panel rounded-3xl p-5 space-y-6">
                <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand-500" /> System settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-bold">Organization Identity</span>
                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full glass-input text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-bold">Billing Currency Symbol</span>
                        <input
                            type="text"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full glass-input text-xs font-mono"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-bold">Standard Value Added Tax Ratios (%)</span>
                        <input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(Number(e.target.value))}
                            className="w-full glass-input text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-bold">Return Grace Buffer (Minutes)</span>
                        <input
                            type="number"
                            value={gracePeriod}
                            onChange={(e) => setGracePeriod(Number(e.target.value))}
                            className="w-full glass-input text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-bold">Overdue Penalty Increments Type</span>
                        <select
                            value={lateFeeType}
                            onChange={(e) => setLateFeeType(e.target.value)}
                            className="w-full glass-input text-xs"
                        >
                            <option value="daily">Daily Flat charge multiplier</option>
                            <option value="hourly">Hourly increments multiplier</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-bold">Penalty Multiplier factor (e.g. 1.5 equals +50% rate)</span>
                        <input
                            type="number"
                            value={multiplier}
                            onChange={(e) => setMultiplier(Number(e.target.value))}
                            className="w-full glass-input text-xs"
                            step={0.1}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-bold">Max Cap on Overdue Penalties ($)</span>
                        <input
                            type="number"
                            value={maxLateLimit}
                            onChange={(e) => setMaxLateLimit(Number(e.target.value))}
                            className="w-full glass-input text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <span className="text-[10px] text-slate-460 font-bold">Digital Agreement Policy Clauses Text</span>
                        <textarea
                            value={policy}
                            onChange={(e) => setPolicy(e.target.value)}
                            className="w-full glass-input text-xs aspect-[4]"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Synchronizing configuration...' : 'Apply settings updates'}
                </button>
            </form>
        </div>
    );
};
export default GlobalSettings;
