import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Guards
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';

// Client Pages
import HomePage from './pages/client/HomePage';
import GameDetailPage from './pages/client/GameDetailPage';
import CheckoutPage from './pages/client/CheckoutPage';
import MyOrdersPage from './pages/client/MyOrdersPage';
import OrderDetailPage from './pages/client/OrderDetailPage';
import LoginPage from './pages/client/LoginPage';
import RegisterPage from './pages/client/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageGames from './pages/admin/ManageGames';
import ManageRankTiers from './pages/admin/ManageRankTiers';
import ManageServices from './pages/admin/ManageServices';
import ManageOrders from './pages/admin/ManageOrders';

export const App: React.FC = () => {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token]);

  return (
    <Routes>
      {/* ========================================== */}
      {/* CLIENT ROUTES (Wrapped by MainLayout)       */}
      {/* ========================================== */}
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/games/:slug" element={<GameDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Client Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>

      {/* ========================================== */}
      {/* ADMIN ROUTES (Wrapped by AdminRoute & Layout) */}
      {/* ========================================== */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="games" element={<ManageGames />} />
          <Route path="rank-tiers" element={<ManageRankTiers />} />
          <Route path="services" element={<ManageServices />} />
          <Route path="orders" element={<ManageOrders />} />
        </Route>
      </Route>

      {/* Fallback 404 -> Redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
