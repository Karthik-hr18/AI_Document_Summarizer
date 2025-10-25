import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx'; // Added .jsx
import RegisterPage from './pages/RegisterPage.jsx'; // Added .jsx
import UploadPage from './pages/UploadPage.jsx'; // Added .jsx
import AuthRoute from './components/AuthRoute.jsx'; // Added .jsx

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Route for Upload */}
      <Route
        path="/upload"
        element={
          <AuthRoute>
            <UploadPage />
          </AuthRoute>
        }
      />

      {/* Default Route: Redirect to upload page (AuthRoute will handle redirect to login if not authenticated) */}
      <Route path="*" element={<Navigate to="/upload" replace />} />
    </Routes>
  );
}

export default App;

