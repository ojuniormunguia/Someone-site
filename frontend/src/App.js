import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import QueuePage from './pages/QueuePage';
import CommissionDetailPage from './pages/CommissionDetailPage';
import ProfilePage from './pages/ProfilePage';
import RequestPage from './pages/RequestPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="commission/:id" element={<CommissionDetailPage />} />
        <Route path="request" element={<RequestPage />} />
        
        {/* Protected routes */}
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App; 