import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import './Admin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === import.meta.env.VITE_ADMIN_USER && password === import.meta.env.VITE_ADMIN_PASS) {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin-dashboard');
    } else {
      setError(true);
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
            type="text" 
            placeholder="Email or Username" 
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(false);
            }}
            className={error ? 'input-error' : ''}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className={error ? 'input-error' : ''}
          />
          {error && <p className="error-text">Invalid credentials</p>}
          <button type="submit" className="btn btn-primary w-full">Sign In</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
