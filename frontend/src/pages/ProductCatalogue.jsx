import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Search, SlidersHorizontal, Calendar, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductCatalogue = () => {
    const { addToCart, startDate, endDate, setStartDate, setEndDate, totals } = useCart();
    const { showToast } = useToast();

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [sort, setSort] = useState('');
    const [loading, setLoading] = useState(false);


    const categoriesList = ['Cameras', 'Laptops', 'Audio', 'Gimbals'];
    const brandsList = ['Sony', 'DJI', 'Apple', 'Sennheiser'];

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products', {
                params: { search, category, brand, sort }
            });
            if (res.data.success) {
                setProducts(res.data.products);
            }
        } catch (err) {
            console.error('Error fetching catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [category, brand, sort]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    return (
        <div className="w-full space-y-6 p-6">

            <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold tracking-tight">Prime Equipment Rental Catalogue</h2>
                    <p className="text-xs text-slate-500">Pick rental days schedule before checkout to verify total quotes dynamically.</p>
                </div>


                <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Calendar className="w-4 h-4 text-brand-500" /> Start Date
                    </div>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-xs font-bold focus:outline-none dark:text-white"
                    />
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        End Date
                    </div>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-xs font-bold focus:outline-none dark:text-white"
                    />
                    <span className="text-xs font-extrabold bg-brand-500/15 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-full">
                        {totals.days} day(s) duration
                    </span>
                </div>
            </div>


            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

                <form onSubmit={handleSearchSubmit} className="flex w-full lg:max-w-md gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search cameras, audio gear, spec SKUs..."
                            className="w-full pl-10 pr-4 py-2.5 glass-input text-xs"
                        />
                    </div>
                    <button type="submit" className="px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md">
                        Query
                    </button>
                </form>


                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1.5">
                        <SlidersHorizontal className="w-4 h-4" /> Filters:
                    </div>

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="glass-input py-1.5 text-xs font-medium cursor-pointer"
                    >
                        <option value="">Categories (All)</option>
                        {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="glass-input py-1.5 text-xs font-medium cursor-pointer"
                    >
                        <option value="">Brands (All)</option>
                        {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="glass-input py-1.5 text-xs font-medium cursor-pointer"
                    >
                        <option value="">Sort default</option>
                        <option value="priceAsc">Price: Low to High</option>
                        <option value="priceDesc">Price: High to Low</option>
                    </select>
                </div>
            </div>


            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card rounded-3xl p-5 space-y-4 animate-pulse">
                            <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                            <div className="h-4 bg-slate-205 dark:bg-slate-850 rounded w-2/3"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                            <div className="h-8 bg-slate-210 dark:bg-slate-900 rounded-xl w-full"></div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-3xl space-y-3">
                    <Info className="w-12 h-12 text-slate-400 mx-auto" />
                    <h3 className="text-md font-bold">No rental products available</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing search phrases or catalog categories tag selections.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(prod => (
                        <motion.div
                            layout
                            key={prod._id}
                            className="glass-card rounded-3xl p-5 flex flex-col justify-between space-y-4"
                        >

                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center">
                                <img
                                    src={prod.images[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400'}
                                    alt={prod.name}
                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400'; }}
                                />
                                <span className="absolute top-3 left-3 text-[10px] uppercase font-extrabold bg-brand-500 text-white px-2 py-1 rounded-lg">
                                    {prod.category}
                                </span>

                                {prod.stock.available <= 0 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold uppercase tracking-wider bg-red-650 px-3 py-1.5 rounded-xl border border-red-500">
                                            Rented out
                                        </span>
                                    </div>
                                )}
                            </div>


                            <div className="space-y-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-sm tracking-tight hover:text-brand-500 transition-colors">
                                        <Link to={`/products/${prod._id}`}>{prod.name}</Link>
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 mb-1">
                                    ★ 4.8 <span className="text-slate-400">| Partner: {prod.ownerName || 'Rental Desk'}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 justify-between text-[9px] text-slate-400 font-semibold">
                                    <span>Branch: {prod.branchId || 'Main'}</span>
                                    <span className="text-brand-500">Available: {prod.stock?.available || 0} qty</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-200/50 dark:border-slate-800/10 pt-3 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-slate-450">Rate</span>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">${prod.priceRate.daily} <span className="text-[10px] font-normal">/ day</span></p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-450">Deposit Hold</span>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${prod.securityDeposit}</p>
                                </div>
                            </div>


                            {prod.stock.available > 0 ? (
                                <button
                                    onClick={() => {
                                        const res = addToCart(prod);
                                        if (res && res.success === false) {
                                            showToast(res.message, 'warning');
                                        } else {
                                            showToast(`Added ${prod.name} to checkout cart!`, 'success');
                                        }
                                    }}
                                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                                >
                                    Rent For Period
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-2.5 bg-slate-200 dark:bg-slate-900/60 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
                                >
                                    Reserve Unavailable
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default ProductCatalogue;
