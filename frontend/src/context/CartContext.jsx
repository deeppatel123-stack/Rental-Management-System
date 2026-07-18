import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 3);
        return dayAfter.toISOString().split('T')[0];
    });

    useEffect(() => {
        const refreshCartPrices = async () => {
            if (!cartItems || cartItems.length === 0) return;
            try {
                let changed = false;
                const updatedItems = await Promise.all(cartItems.map(async (item) => {
                    try {
                        const res = await api.get(`/products/${item._id}`);
                        if (res.data?.success && res.data.product) {
                            const prod = res.data.product;
                            const dbTax = prod.taxRate !== undefined ? prod.taxRate : 8;
                            const dbRate = prod.priceRate.daily;
                            const dbDeposit = prod.securityDeposit;
                            if (item.taxRate !== dbTax || item.dailyRate !== dbRate || item.securityDeposit !== dbDeposit) {
                                changed = true;
                                return {
                                    ...item,
                                    dailyRate: dbRate,
                                    securityDeposit: dbDeposit,
                                    taxRate: dbTax
                                };
                            }
                        }
                    } catch (e) {
                        console.error('Failed refreshing cart item data:', item._id, e);
                    }
                    return item;
                }));

                if (changed) {
                    setCartItems(updatedItems);
                }
            } catch (err) {
                console.error('Failed to run cart items refresh operation:', err);
            }
        };

        refreshCartPrices();
    }, [cartItems.length]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        if (cartItems.length > 0) {
            const firstItemOwner = cartItems[0].ownerId;
            if (product.ownerId && firstItemOwner && product.ownerId.toString() !== firstItemOwner.toString()) {
                return {
                    success: false,
                    message: "⚠️ Provider Mismatch: This item is owned by another rental partner. Checkout your current item(s) first before booking this."
                };
            }
        }
        setCartItems(prev => {
            const idx = prev.findIndex(item => item._id === product._id);
            if (idx > -1) {
                const copy = [...prev];
                copy[idx].quantity += quantity;
                return copy;
            }
            return [...prev, {
                _id: product._id,
                name: product.name,
                dailyRate: product.priceRate.daily,
                securityDeposit: product.securityDeposit,
                taxRate: product.taxRate !== undefined ? product.taxRate : 8,
                image: product.images[0] || '',
                ownerId: product.ownerId,
                ownerName: product.ownerName || 'Rental Desk',
                quantity
            }];
        });
        return { success: true };
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item._id !== productId));
    };

    const updateQuantity = (productId, num) => {
        if (num <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prev => prev.map(item => item._id === productId ? { ...item, quantity: num } : item));
    };

    const clearCart = () => setCartItems([]);


    const getDaysCount = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end - start;
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const totals = (() => {
        const days = getDaysCount();
        let subTotal = 0;
        let securityHold = 0;

        // Find minimum tax rate among all items in user's cart
        let minTaxRate = 8;
        if (cartItems.length > 0) {
            minTaxRate = Math.min(...cartItems.map(item => item.taxRate !== undefined ? item.taxRate : 8));
        }

        cartItems.forEach(item => {
            const itemSub = item.dailyRate * days * item.quantity;
            subTotal += itemSub;
            securityHold += item.securityDeposit * item.quantity;
        });

        const preDiscountTax = (subTotal * minTaxRate) / 100;
        const tax = Math.round(preDiscountTax * 100) / 100;
        const grandTotal = subTotal + tax + securityHold;

        return {
            days,
            subTotal,
            securityHold,
            tax,
            preDiscountTax: tax,
            grandTotal,
            appliedTaxRate: minTaxRate
        };
    })();

    return (
        <CartContext.Provider value={{
            cartItems,
            startDate,
            endDate,
            setStartDate,
            setEndDate,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totals
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
