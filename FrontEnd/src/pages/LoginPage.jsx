import React, { useState } from 'react';
// --- FIX: Added .jsx extension ---
import { Input, Button, ErrorDisplay, UserIcon, LockIcon } from '../components/UIComponents.jsx';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState(''); // Changed from email based on backend schema
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // --- FIX: Corrected API path ---
      const res = await axios.post('http://127.0.0.1:8000/auth/login', {
        username, // Send username
        password,
      });

      localStorage.setItem('token', res.data.access_token);
      navigate('/upload'); // Navigate to upload page on success
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail); // Display backend error (e.g., "Invalid credentials")
      } else {
        setError('Login failed! Please check your connection and try again.');
      }
      // --- FIX: Removed alert ---
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="mt-2 text-gray-600">Sign in to access your summarizer</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <ErrorDisplay message={error} />
          <Input
            id="username"
            placeholder="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<UserIcon />} // Add icon
            required
          />
          <Input
            id="password"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<LockIcon />} // Add icon
            required
          />
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

