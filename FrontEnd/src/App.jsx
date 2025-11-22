import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 1. Import your new RootPage
import RootPage from './pages/RootPage.jsx'; 
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import AuthRoute from './components/AuthRoute.jsx';

function App() {
  return (
    <Routes>
      {/* 2. Add this line for your new root page */}
      <Route path="/" element={<RootPage />} />

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Route */}
      <Route
        path="/upload"
        element={
          <AuthRoute>
            <UploadPage />
          </AuthRoute>
        }
      />

      {/* 3. Change this redirect to point to your new root page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;