import React, { useState } from 'react';
// --- FIX: Added .jsx extension ---
import { Input, Button, ErrorDisplay, UserIcon, LockIcon, EmailIcon } from '../components/UIComponents.jsx';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added confirm password
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);

    try {
      // --- FIX: Corrected API path and added confirm_password ---
      await axios.post('http://127.0.0.1:8000/auth/register', {
        username,
        email,
        password,
        confirm_password: confirmPassword, // Send confirmation
      });
      // alert("Registered successfully!"); // --- FIX: Removed alert ---
      navigate('/login'); // Redirect to login page on success
    } catch (err) {
      if (err.response && err.response.data) {
        // Handle backend validation errors (422) or user exists (400)
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail[0].msg);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Registration failed! Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
          <p className="mt-2 text-gray-600">Get started by creating a new account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <ErrorDisplay message={error} />
          <Input
            id="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<UserIcon />}
            required
          />
          <Input
            id="email"
            placeholder="Email"
            type="email" // Use email type for validation
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<EmailIcon />}
            required
          />
          <Input
            id="password"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<LockIcon />}
            required
          />
          <Input
            id="confirm-password"
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<LockIcon />}
            required
          />
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

