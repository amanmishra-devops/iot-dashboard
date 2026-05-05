import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function parseJwtExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // convert to ms
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleLogout = (expired = false) => {
    localStorage.removeItem('token');
    setToken(null);
    if (expired) setSessionExpired(true);
  };

  const handleLoginSuccess = (newToken) => {
    setSessionExpired(false);
    setToken(newToken);
  };

  // Auto-logout when JWT expires
  useEffect(() => {
    if (!token) return;
    const expiry = parseJwtExpiry(token);
    if (!expiry) return;
    const msLeft = expiry - Date.now();
    if (msLeft <= 0) { handleLogout(true); return; }
    const timer = setTimeout(() => handleLogout(true), msLeft);
    return () => clearTimeout(timer);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global axios 401 interceptor
  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) handleLogout(true);
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="App">
      {!token ? (
        <Login onLoginSuccess={handleLoginSuccess} sessionExpired={sessionExpired} />
      ) : (
        <Dashboard token={token} onLogout={() => handleLogout(false)} />
      )}
    </div>
  );
}

export default App;
