// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // 🚫 No token → redirect to login
    return <Navigate to="/login" replace />;
  }
  // ✅ Token found → allow access
  return children;
};

export default PrivateRoute;
