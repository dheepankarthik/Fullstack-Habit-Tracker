import { useState } from 'react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth`;

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setSubmitting(false);
        return;
      }

      if (mode === 'signup') {
        // Signup succeeded — switch to login and prompt user
        setMode('login');
        setInfo('Account created! Please log in.');
        setPassword('');
        setSubmitting(false);
        return;
      }

      // Login succeeded — hand token + user back to App
      onAuth(data.token, data.user);
    } catch {
      setError('Network error. Is the server running?');
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setInfo(null);
  }

  return (
    <div className="app">
      <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
      <p>
        {mode === 'login'
          ? 'Log in to see your habits.'
          : 'Sign up to start tracking.'}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        <button type="submit" disabled={submitting}>
          {submitting
            ? 'Please wait...'
            : mode === 'login'
            ? 'Log in'
            : 'Sign up'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <p className="switch-mode">
        {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
        <button type="button" className="link-btn" onClick={switchMode}>
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </div>
  );
}

export default Auth;