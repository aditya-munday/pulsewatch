// ==============================================================================
// Login Page (frontend/app/login/page.js)
// ==============================================================================
// Simple login form that collects email and password, sends them to our Express
// backend (POST /api/auth/login), saves the returned JWT token, and redirects to dashboard.
// ==============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiLogin, setToken, setUser } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(email, password);

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Save token and user info into localStorage
      setToken(data.token);
      setUser(data.user);

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Could not connect to backend server. Make sure it is running on port 5000.');
      setLoading(false);
    }
  }

  return (
    <div className="container">
      {/* Back to Home Link */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          &larr; Back to Home
        </Link>
      </div>

      <div className="form-card">
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Sign in to your PulseWatch monitor dashboard.
        </p>

        {/* Display Error Message if any */}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
