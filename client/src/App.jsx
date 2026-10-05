import { useState } from 'react';
import Auth from './Auth';
import HabitTracker from './HabitTracker';

function App() {
  // Lazy initializers: read localStorage only on first render
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  function handleAuth(newToken, newUser) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  if (!user || !token) {
    return <Auth onAuth={handleAuth} />;
  }

  return <HabitTracker user={user} token={token} onLogout={handleLogout} />;
}

export default App;