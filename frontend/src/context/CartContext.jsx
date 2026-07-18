import React, { createContext, useContext, useState, useEffect } from 'react';

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

        cartItems.forEach(item => {
            subTotal += item.dailyRate * days * item.quantity;
            securityHold += item.securityDeposit * item.quantity;
        });


        const tax = Math.round((subTotal * 0.08) * 100) / 100;
        const grandTotal = subTotal + tax + securityHold;

        return {
            days,
            subTotal,
            securityHold,
            tax,
            grandTotal
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
