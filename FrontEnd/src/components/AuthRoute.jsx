import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // If token exists, render the child component (e.g., UploadPage)
  // Otherwise, redirect the user to the /login page
  return token ? children : <Navigate to="/login" replace />;
};

export default AuthRoute;

