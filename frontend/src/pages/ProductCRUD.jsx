import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductCRUD = () => {
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);


    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [daily, setDaily] = useState('');
    const [weekly, setWeekly] = useState('');
    const [deposit, setDeposit] = useState('');
    const [description, setDescription] = useState('');
    const [specStr, setSpecStr] = useState('');
    const [totalStock, setTotalStock] = useState(1);
    const [taxRate, setTaxRate] = useState(8);
    const [imageFiles, setImageFiles] = useState([]);

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            if (res.data.success) {
                setProducts(res.data.products);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    useEffect(() => {
        if (showModal) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [showModal]);

    const openAddModal = () => {
        setEditingId(null);
        setName('');
        setSku('');
        setCategory('');
        setBrand('');
        setDaily('');
        setWeekly('');
        setDeposit('');
        setDescription('');
        setSpecStr('');
        setTotalStock(1);
        setTaxRate(8);
        setImageFiles([]);
        setShowModal(true);
    };

    const openEditModal = (prod) => {
        setEditingId(prod._id);
        setName(prod.name);
        setSku(prod.sku);
        setCategory(prod.category);
        setBrand(prod.brand);
        setDaily(prod.priceRate.daily);
        setWeekly(prod.priceRate.weekly || 250);
        setDeposit(prod.securityDeposit);
        setTaxRate(prod.taxRate !== undefined ? prod.taxRate : 8);
        setDescription(prod.description);
        setTotalStock(prod.stock?.total || 1);
        setImageFiles([]);

        const sStr = prod.specifications?.map(sp => `${sp.key}: ${sp.value}`).join(', ');
        setSpecStr(sStr || '');
        setShowModal(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();

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
        formData.append('taxRate', taxRate);
        formData.append('description', description);
        formData.append('totalStock', totalStock);
        formData.append('specifications', JSON.stringify(specsArray));
        formData.append('accessories', JSON.stringify(['Standard Battery Pack', 'Carrying Pouch case']));

        if (imageFiles && imageFiles.length > 0) {
            imageFiles.forEach(file => {
                formData.append('images', file);
            });
        }

        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('Product modified successfully!', 'success');
            } else {
                await api.post('/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('Product registered successfully!', 'success');
            }
            setShowModal(false);
            fetchCatalog();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error occurred registering product catalog.', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Confirm deletion of product catalog listing? This removes physical inventories too.')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchCatalog();
        } catch (err) {
            showToast('Error deletion catalog.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">System Product Catalog</h2>
                    <p className="text-xs text-slate-500">Add physical inventory classifications and customize pricing matrix brackets.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                    <Plus className="w-4 h-4" /> Add Classified Product
                </button>
            </div>


            {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Scanning database catalog...</p>
            ) : (
                <div className="glass-panel rounded-3xl overflow-hidden border border-slate-205 dark:border-slate-800/10">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800 text-slate-450 uppercase font-black tracking-wider">
                                <th className="px-5 py-3.5">Product Classification</th>
                                <th className="px-5 py-3.5">SKU barcode</th>
                                <th className="px-5 py-3.5">Category</th>
                                <th className="px-5 py-3.5">Pricing / Day</th>
                                <th className="px-5 py-3.5">Escrow hold</th>
                                <th className="px-5 py-3.5 text-center">Stock status</th>
                                <th className="px-5 py-3.5 text-right font-black">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                            {products.map(prod => (
                                <tr key={prod._id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10 select-none">
                                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                        <img
                                            src={prod.images?.[0] ? (prod.images[0].startsWith('http') ? prod.images[0] : `http://localhost:5000${prod.images[0]}`) : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=100'}
                                            alt={prod.name}
                                            className="w-10 h-10 object-cover rounded-xl border border-slate-200/50 dark:border-slate-800/20"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=100'; }}
                                        />
                                        <span>{prod.name}</span>
                                    </td>
                                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{prod.sku}</td>
                                    <td className="px-5 py-4 text-slate-500">{prod.category}</td>
                                    <td className="px-5 py-4 font-bold">${prod.priceRate.daily}</td>
                                    <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-bold">${prod.securityDeposit}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="text-[10px] bg-brand-500/10 text-brand-655 font-extrabold px-2 py-0.5 rounded">
                                            {prod.stock?.available ?? 0} Avail / {prod.stock?.total ?? 0} Total
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openEditModal(prod)}
                                            className="p-1 text-slate-400 hover:text-brand-500"
                                        >
                                            <Edit3 className="w-4 h-4 inline" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(prod._id)}
                                            className="p-1 text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}


            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden animate-fade-in">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-xl bg-white/90 dark:bg-slate-900/90 glass-panel p-6 rounded-[2rem] shadow-2xl relative z-50 max-h-[90vh] overflow-y-auto space-y-6 scrollbar-none border border-slate-205 dark:border-slate-800/10"
                    >
                        <div className="flex justify-between items-center border-b border-slate-205 dark:border-slate-850 pb-3">
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                                {editingId ? '✍️ Modify Product Classification' : '✨ Add Product Classification'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-6">
                            {/* Section 1: General Details */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">General Information</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Product Title *</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Panasonic Lumix GH6"
                                            className="w-full glass-input text-xs"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">SKU / Barcode *</label>
                                        <input
                                            type="text"
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            className="w-full glass-input text-xs font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Category *</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full glass-input text-xs cursor-pointer select-none"
                                            required
                                        >
                                            <option value="" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">-- Choose Category --</option>
                                            <option value="Cameras" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">Cameras</option>
                                            <option value="Audio" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">Audio</option>
                                            <option value="Laptops" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">Laptops</option>
                                            <option value="Gimbals" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">Gimbals</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Brand Option *</label>
                                        <input
                                            type="text"
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            placeholder="e.g. Sony / DJI"
                                            className="w-full glass-input text-xs"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Pricing & Stock Structure */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Prices Matrix & Stock Criteria</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex flex-col justify-between h-full space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Daily Rate ($) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={daily}
                                            onChange={(e) => setDaily(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full glass-input text-xs font-bold"
                                            required
                                            min={0}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-between h-full space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Weekly Rate ($) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={weekly}
                                            onChange={(e) => setWeekly(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full glass-input text-xs"
                                            required
                                            min={0}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-between h-full space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Escrow Hold ($) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={deposit}
                                            onChange={(e) => setDeposit(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full glass-input text-xs font-bold text-emerald-600 dark:text-emerald-405"
                                            required
                                            min={0}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col justify-between h-full space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Tax Rate (%) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(e.target.value)}
                                            placeholder="8.0"
                                            className="w-full glass-input text-xs font-bold"
                                            required
                                            min={0}
                                            max={100}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-between h-full space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Stock Level *</label>
                                        <input
                                            type="number"
                                            value={totalStock}
                                            onChange={(e) => setTotalStock(e.target.value)}
                                            placeholder="1"
                                            className="w-full glass-input text-xs font-bold"
                                            required
                                            min={1}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Extra specs */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Specs, Photos & Description</h4>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Product Images</label>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setImageFiles(Array.from(e.target.files))}
                                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Technical Specs (Comma-Separated Pairs)</label>
                                        <input
                                            type="text"
                                            value={specStr}
                                            onChange={(e) => setSpecStr(e.target.value)}
                                            placeholder="e.g. Resolution: 24MP, Weight: 800g"
                                            className="w-full glass-input text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Public Description Details</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Introduce equipment rental packages, bundle accessories..."
                                            className="w-full glass-input text-xs h-20 resize-none py-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-205 dark:border-slate-850">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200/10 text-xs font-bold rounded-xl text-slate-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/15 hover:scale-[1.02] transform transition-all"
                                >
                                    Confirm Classified
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
export default ProductCRUD;
