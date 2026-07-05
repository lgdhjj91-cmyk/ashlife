import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader, User } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import './Admin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { adminUser, loadingAdmin, signInAdmin } = useAdminAuth();
  const navigate = useNavigate();

  if (loadingAdmin) {
    return (
      <div className="page container animate-fade-in admin-login-page">
        <div className="login-box">
          <Loader className="spin" size={32} />
          <p>Checking admin session...</p>
        </div>
      </div>
    );
  }

  if (adminUser) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signInAdmin(email.trim(), password);
      navigate('/admin-dashboard');
    } catch (loginError) {
      console.error('Admin login failed:', loginError);
      setError('Invalid admin email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page container animate-fade-in admin-login-page">
      <div className="login-box">
        <User size={48} className="login-icon" />
        <h2>Sign In</h2>
        <p>Welcome back! Please enter your details.</p>
        
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="email" 
            placeholder="Admin email" 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className={error ? 'input-error' : ''}
            autoComplete="username"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className={error ? 'input-error' : ''}
            autoComplete="current-password"
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
