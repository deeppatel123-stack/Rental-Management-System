import React, { useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, MapPin, Gift, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Profile = () => {
    const { user, updateLocalUser } = useAuth();
    const { showToast } = useToast();

    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [addresses, setAddresses] = useState(user?.addresses || []);
    const [loading, setLoading] = useState(false);


    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', { name, phone });
            if (res.data.success) {
                updateLocalUser(res.data.user);
                showToast('Primary profile details saved successfully!', 'success');
            }
        } catch (err) {
            showToast('Error updating profile.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        if (!street || !city) return showToast('Street & city fields are required.', 'error');

        const newAddressObj = { street, city, state, zipCode: zip, country: 'USA', isDefault: addresses.length === 0 };
        const updatedAddresses = [...addresses, newAddressObj];

        try {
            const res = await api.put('/auth/profile', { addresses: updatedAddresses });
            if (res.data.success) {
                setAddresses(res.data.user.addresses);
                updateLocalUser(res.data.user);
                setStreet('');
                setCity('');
                setState('');
                setZip('');
                showToast('Address registered successfully!', 'success');
            }
        } catch (err) {
            showToast('Failed to register shipping address.', 'error');
        }
    };

    const handleDeleteAddress = async (indexToDelete) => {
        const updatedAddresses = addresses.filter((_, idx) => idx !== indexToDelete);
        try {
            const res = await api.put('/auth/profile', { addresses: updatedAddresses });
            if (res.data.success) {
                setAddresses(res.data.user.addresses);
                updateLocalUser(res.data.user);
                showToast('Address removed!', 'success');
            }
        } catch (err) {
            showToast('Error deletion address.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Your Account Profile</h2>
                <p className="text-xs text-slate-500">Edit address cards, review loyalty counts, and manage primary contact variables.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="md:col-span-2 space-y-6">

                    <form onSubmit={handleUpdateProfile} className="glass-panel rounded-3xl p-5 space-y-4">
                        <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-brand-500" /> Account Metrics
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-semibold">User Email Address</span>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    className="w-full glass-input text-xs bg-slate-100/50 dark:bg-slate-900/50 cursor-not-allowed"
                                    disabled
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-semibold">Full Name</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full glass-input text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-semibold">Contact Phone number</span>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full glass-input text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-450 font-semibold">System Privilege Level</span>
                                <input
                                    type="text"
                                    value={user?.role || ''}
                                    className="w-full glass-input text-xs bg-slate-100/50 dark:bg-slate-900/50 uppercase cursor-not-allowed"
                                    disabled
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                        >
                            {loading ? 'Saving details...' : 'Save Primary Profiles'}
                        </button>
                    </form>


                    <div className="glass-panel rounded-3xl p-5 space-y-6">
                        <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-brand-500" /> Address Directory
                        </h3>


                        {addresses.length === 0 ? (
                            <p className="text-xs text-slate-400">No addresses registered yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {addresses.map((addr, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/5 rounded-2xl relative space-y-1">
                                        <button
                                            onClick={() => handleDeleteAddress(idx)}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {addr.isDefault && (
                                            <span className="text-[9px] uppercase font-extrabold bg-emerald-500/15 border border-emerald-500/10 text-emerald-500 rounded px-1.5 py-0.5 select-none">
                                                Default
                                            </span>
                                        )}
                                        <h4 className="text-xs font-bold pt-1.5">{addr.street}</h4>
                                        <p className="text-[10px] text-slate-500">{addr.city}, {addr.state} - {addr.zipCode}</p>
                                        <p className="text-[9px] text-slate-400 font-semibold">{addr.country}</p>
                                    </div>
                                ))}
                            </div>
                        )}


                        <form onSubmit={handleAddAddress} className="space-y-4 border-t border-slate-205 dark:border-slate-800/10 pt-4">
                            <h4 className="text-xs font-bold uppercase text-slate-450">Append New Shipping Address</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Street (e.g. 5th Main St)"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    className="glass-input text-xs"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="City (e.g. SF)"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="glass-input text-xs"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="State (e.g. California)"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="glass-input text-xs"
                                />
                                <input
                                    type="text"
                                    placeholder="Zip Code"
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    className="glass-input text-xs"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                            >
                                Register Address Card
                            </button>
                        </form>
                    </div>
                </div>


                <div className="space-y-6">
                    <div className="glass-panel rounded-3xl p-5 space-y-4 text-center">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                            <Gift className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm">Loyalty Reward Tier</h3>
                        <div>
                            <p className="text-xs text-slate-450">Current Loyalty Points balance</p>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white pt-1">{user?.loyaltyPoints || 0} pts</h4>
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-850 pt-3 text-xs text-slate-500 dark:text-slate-400 space-y-2 text-left leading-relaxed">
                            <p>📍 Earn 1 point for every $10 spent on active rental contracts.</p>
                            <p>📍 Redeem points at checkout for loyalty discount multipliers.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Profile;
