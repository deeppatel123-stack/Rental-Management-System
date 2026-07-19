import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';


import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';


import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProductCatalogue from './pages/ProductCatalogue';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import Support from './pages/Support';
import Profile from './pages/Profile';


import AdminDashboard from './pages/AdminDashboard';
import ProductCRUD from './pages/ProductCRUD';
import RentalManagement from './pages/RentalManagement';
import PickupWorkflow from './pages/PickupWorkflow';
import ReturnWorkflow from './pages/ReturnWorkflow';
import PartnerMap from './pages/PartnerMap';
import AdminTickets from './pages/AdminTickets';
import GlobalSettings from './pages/GlobalSettings';
import EmployeeList from './pages/EmployeeList';
import CustomerList from './pages/CustomerList';
import EnterpriseSuite from './pages/EnterpriseSuite';
import { AddProductPage } from './pages/AddProductPage';
import { ManageExecutives } from './pages/ManageExecutives';
import LateReturns from './pages/LateReturns';
import DepositLedger from './pages/DepositLedger';


import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Checking credentials authentication...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};


const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('🔌 Connected to websockets server.');
      socket.emit('join', user.id);
    });

    // Existing: overdue penalty alerts
    socket.on('notification', (data) => {
      showToast(data.message || 'Rental notification received.', 'info');
    });

    // Partner: new order placed by customer
    socket.on('new_order', (data) => {
      showToast(`🛎️ New Order #${data.orderNumber} — ${data.customerName} | $${data.totalAmount?.toFixed(2)}`, 'info');
      // Dispatch event so RentalManagement table auto-refreshes
      window.dispatchEvent(new CustomEvent('rms:new_order', { detail: data }));
    });

    // Customer: partner updated their order status
    socket.on('order_status_updated', (data) => {
      showToast(`📋 Order #${data.orderNumber}: ${data.message}`, 'success');
      // Dispatch event so OrderHistory tracker auto-refreshes
      window.dispatchEvent(new CustomEvent('rms:order_status_updated', { detail: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user, showToast]);


  const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'].includes(location.pathname);
  const showSidebar = !['/', '/splash', '/catalog', '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {!isAuthPage && <Navbar />}

      <div className="flex flex-1">
        {showSidebar && user && <Sidebar />}

        <main className="flex-1 w-full bg-slate-50/50 dark:bg-slate-950/40 min-h-screen overflow-x-hidden">
          <Routes>

            <Route path="/" element={<Splash />} />
            <Route path="/catalog" element={<ProductCatalogue />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/splash" element={<Splash />} />


            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />


            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['Customer']}><CustomerDashboard /></ProtectedRoute>
            } />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={
              <ProtectedRoute allowedRoles={['Customer']}><Checkout /></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allowedRoles={['Customer']}><OrderHistory /></ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute allowedRoles={['Customer']}><Support /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['Customer', 'Super Admin', 'Rental Partner']}><Profile /></ProtectedRoute>
            } />


            <Route path="/partner" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/partner/rentals" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><RentalManagement /></ProtectedRoute>
            } />
            <Route path="/partner/pickups" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><PickupWorkflow /></ProtectedRoute>
            } />
            <Route path="/partner/returns" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><ReturnWorkflow /></ProtectedRoute>
            } />
            <Route path="/partner/maps" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><PartnerMap /></ProtectedRoute>
            } />
            <Route path="/partner/tickets" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><AdminTickets /></ProtectedRoute>
            } />
            <Route path="/partner/enterprise" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><EnterpriseSuite /></ProtectedRoute>
            } />
            <Route path="/partner/products" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><ProductCRUD /></ProtectedRoute>
            } />
            <Route path="/partner/add-product" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><AddProductPage /></ProtectedRoute>
            } />
            <Route path="/partner/executives" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><ManageExecutives /></ProtectedRoute>
            } />
            <Route path="/partner/late-returns" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><LateReturns /></ProtectedRoute>
            } />
            <Route path="/partner/deposit-ledger" element={
              <ProtectedRoute allowedRoles={['Rental Partner']}><DepositLedger /></ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><ProductCRUD /></ProtectedRoute>
            } />
            <Route path="/admin/add-product" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><AddProductPage /></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><GlobalSettings /></ProtectedRoute>
            } />
            <Route path="/admin/partners" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><EmployeeList /></ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><EmployeeList /></ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><CustomerList /></ProtectedRoute>
            } />
            <Route path="/admin/enterprise" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><EnterpriseSuite /></ProtectedRoute>
            } />
            <Route path="/admin/late-returns" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><LateReturns /></ProtectedRoute>
            } />
            <Route path="/admin/deposit-ledger" element={
              <ProtectedRoute allowedRoles={['Super Admin']}><DepositLedger /></ProtectedRoute>
            } />


            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};


import CustomerDashboard from './pages/CustomerDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
