// ==============================================================================
// Register Page (frontend/app/register/page.js)
// ==============================================================================
// User registration form that collects name, email, and password, sends them
// to our Express backend (POST /api/auth/register), saves the token, and goes to dashboard.
// ==============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRegister, setToken, setUser } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
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
      const data = await apiRegister(name, email, password);

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
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Create an Account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Start monitoring your website uptime in seconds.
        </p>

        {/* Display Error Message if any */}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
            <label>Password (min 6 characters)</label>
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
