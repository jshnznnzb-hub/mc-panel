import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/auth';
import { ToastProvider } from './components/Toast';

// Code-split all pages for faster initial load
const Login        = lazy(() => import('./pages/Login'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const ServerDetail = lazy(() => import('./pages/ServerDetail'));
const Sidebar      = lazy(() => import('./components/Sidebar'));

function PageFallback() {
  return (
    <div className="loading" style={{ minHeight: '100vh' }}>
      <span className="loading-spinner" />
      <span>Loading…</span>
    </div>
  );
}

function ProtectedLayout() {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="main-content">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/servers/:id"  element={<ServerDetail />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Suspense fallback={<PageFallback />}><Login /></Suspense>} />
            <Route path="/*"     element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
