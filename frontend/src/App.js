import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Login from './pages/Login';
import Home from './pages/Home';
import NewCustomer from './pages/NewCustomer';
import CustomerProfile from './pages/CustomerProfile';
import Notifications from './pages/Notifications';
import Calendar from './pages/Calendar';
import NavBar from './components/layout/NavBar';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--accent-gold)' }}>SR Finance</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
    </div>
  );

  if (!user) return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-customer" element={<NewCustomer />} />
        <Route path="/customer/:id" element={<CustomerProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <NavBar />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
