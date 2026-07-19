import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PlusCircle, Upload, ArrowLeft, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const AddProductPage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Fields Form State
    const [name, setName] = useState('');
    const [sku, setSku] = useState(`RMS-${Math.floor(100000 + Math.random() * 900000)}`);
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [daily, setDaily] = useState('');
    const [weekly, setWeekly] = useState('');
    const [deposit, setDeposit] = useState('');
    const [penaltyAmount, setPenaltyAmount] = useState('');
    const [description, setDescription] = useState('');
    const [specStr, setSpecStr] = useState('Resolution: 4K, Color: Graphite, Weight: 1.2kg');
    const [totalStock, setTotalStock] = useState(1);
    const [taxRate, setTaxRate] = useState(8);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const handleBack = () => {
        const path = user?.role === 'Super Admin' ? '/admin/products' : '/partner/products';
        navigate(path);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!category) {
            showToast('Please select a valid product category.', 'warning');
            return;
        }

        const specsArray = specStr.split(',').map(pair => {
            const parts = pair.split(':');
            return {
                key: parts[0]?.trim() || 'Specification',
                value: parts[1]?.trim() || 'Details'
            };
        });

        const formData = new FormData();
        formData.append('name', name);
        formData.append('sku', sku);
        formData.append('category', category);
        formData.append('brand', brand);
        formData.append('dailyPrice', daily);
        formData.append('weeklyPrice', weekly);
        formData.append('securityDeposit', deposit);
        formData.append('depositAmount', deposit);
        formData.append('penaltyAmount', penaltyAmount || 0);
        formData.append('taxRate', taxRate);
        formData.append('description', description);
        formData.append('totalStock', totalStock);
        formData.append('specifications', JSON.stringify(specsArray));
        formData.append('accessories', JSON.stringify(['Standard Battery Unit', 'Protective Armor Carrying Case', 'Connector cord cables']));

        if (imageFiles && imageFiles.length > 0) {
            imageFiles.forEach(file => {
                formData.append('images', file);
            });
        }

        try {
            const res = await api.post('/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success) {
                showToast('Product registered successfully into rental catalog!', 'success');
                // Redirect back
                handleBack();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error occurred registering product catalog.', 'error');
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
            {/* Nav Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <span className="text-[10px] text-brand-500 uppercase tracking-widest font-black flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 fill-current" /> Inventory Management
                        </span>
                        <h1 className="text-2xl font-extrabold tracking-tight">Add Classified Equipment</h1>
                    </div>
                </div>

                <button
                    onClick={handleBack}
                    className="self-start sm:self-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-505 dark:text-slate-400 text-xs font-bold rounded-xl transition-all"
                >
                    View Catalog List
                </button>
            </div>

            {/* Split Form View Layout */}
            <form onSubmit={handleRegister} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Columns - Inputs forms details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-[2rem] space-y-6 border border-slate-205 dark:border-slate-800/10">

                        {/* Section 1: General Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-brand-500 uppercase tracking-wider">General Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 font-bold block">Product Title / Name *</span>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full glass-input"
                                        placeholder="e.g. Sony a7 IV Mirrorless Camera"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 font-bold block">SKU / Barcode *</span>
                                    <input
                                        type="text"
                                        required
                                        value={sku}
                                        onChange={e => setSku(e.target.value)}
                                        className="w-full glass-input font-mono"
                                        placeholder="e.g. SONY-A7IV"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-455 font-bold block">Category *</span>
                                    <select
                                        required
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full glass-input"
                                    >
                                        <option value="">-- Choose Category --</option>
                                        <option value="Cameras">Cameras</option>
                                        <option value="Audio">Audio / Sound</option>
                                        <option value="Laptops">Laptops / Processing</option>
                                        <option value="Gimbals">Gimbals / Stabilization</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-455 font-bold block">Brand Name *</span>
                                    <input
                                        type="text"
                                        required
                                        value={brand}
                                        onChange={e => setBrand(e.target.value)}
                                        className="w-full glass-input"
                                        placeholder="e.g. Sony / DJI / Rode"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pricing matrix breakdown */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-brand-500 uppercase tracking-wider">Prices Matrix & Stock Bracket</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 font-bold block">Daily Rate ($) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        value={daily}
                                        onChange={e => setDaily(e.target.value)}
                                        className="w-full glass-input font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 font-bold block">Weekly Rate ($) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        value={weekly}
                                        onChange={e => setWeekly(e.target.value)}
                                        className="w-full glass-input"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 font-bold block">Escrow Hold ($) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        value={deposit}
                                        onChange={e => setDeposit(e.target.value)}
                                        className="w-full glass-input text-emerald-600 font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 font-bold block">Sales Tax Rate (%) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        max="100"
                                        value={taxRate}
                                        onChange={e => setTaxRate(e.target.value)}
                                        className="w-full glass-input"
                                        placeholder="8.5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-455 font-bold block">Inventory Stock Quantity *</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={totalStock}
                                        onChange={e => setTotalStock(e.target.value)}
                                        className="w-full glass-input font-bold"
                                        placeholder="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 font-bold block text-rose-500">Late Return Penalty ($/day) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        value={penaltyAmount}
                                        onChange={e => setPenaltyAmount(e.target.value)}
                                        className="w-full glass-input font-bold text-rose-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Technical Specifications */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-brand-500 uppercase tracking-wider">Specs & Description</h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 block">Technical Specs (Comma-Separated Pairs)</span>
                                    <input
                                        type="text"
                                        value={specStr}
                                        onChange={e => setSpecStr(e.target.value)}
                                        className="w-full glass-input"
                                        placeholder="Resolution: 24MP, Weight: 800g"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-450 block">Description Details</span>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full glass-input h-24 resize-none py-2"
                                        placeholder="Describe the packages, list primary applications, target use cases..."
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Column - Media Preview & Submit deck */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-[2rem] space-y-6 border border-slate-205 dark:border-slate-800/10">
                        <h3 className="text-xs font-black text-brand-500 uppercase tracking-wider">Product Visuals</h3>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                multiple
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept="image/*"
                            />
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-brand-500 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Select Photos</span>
                            <span className="text-[10px] text-slate-400 block mt-1">PNG, JPG, HEIC up to 5MB</span>
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800">
                                        <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-[11px] text-slate-550 space-y-2.5">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span>Images are scaled automatically for lightning-fast performance across browsers and devices.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span>Default package items: <strong>Standard Power Pack</strong> & <strong>Carrying Bag</strong> will be listed automatically.</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-brand-500 hover:bg-brand-655 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/15 hover:scale-[1.02] transform transition-all text-xs"
                        >
                            <PlusCircle className="w-4 h-4" /> Publish Product Listing
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default AddProductPage;
