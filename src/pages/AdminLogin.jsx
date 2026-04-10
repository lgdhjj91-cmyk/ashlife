import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import './Admin.css';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin-dashboard');
    } else {
      setError(true);
    }
  };

  return (
    <div className="page container animate-fade-in admin-login-page">
      <div className="login-box">
        <Lock size={48} className="login-icon" />
        <h2>Admin Portal</h2>
        <p>Enter the master password to manage products.</p>
        
        <form onSubmit={handleLogin} className="login-form">
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
          {error && <p className="error-text">Incorrect password</p>}
          <button type="submit" className="btn btn-primary w-full">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
