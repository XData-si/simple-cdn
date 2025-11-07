import { useState, FormEvent } from 'react';
import { api } from '../api/client';
import './Login.css';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(username, password);
      onLogin(result.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-logo">
          <h1>CDN XData</h1>
          <a
            href="https://cognitiolabs.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="login-brand-link"
          >
            Powered by Cognition Labs EU
          </a>
        </div>
        <p className="login-subtitle">Sign in to manage your files</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error" role="alert">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
