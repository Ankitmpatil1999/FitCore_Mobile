import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import MemberActivationView from './components/MemberActivationView.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activationToken, setActivationToken] = useState(null);

  useEffect(() => {
    // Check for ?activate=TOKEN in URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('activate');
    if (tokenParam) {
      setActivationToken(tokenParam);
      return;
    }

    const token = localStorage.getItem('fitcore_token');
    const savedUser = localStorage.getItem('fitcore_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('fitcore_token');
        localStorage.removeItem('fitcore_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleActivationSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setActivationToken(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleLogout = () => {
    localStorage.removeItem('fitcore_token');
    localStorage.removeItem('fitcore_user');
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="fitcore-app">
      {activationToken ? (
        <MemberActivationView
          token={activationToken}
          onActivationSuccess={handleActivationSuccess}
          onCancel={() => {
            setActivationToken(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      ) : isLoggedIn ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
