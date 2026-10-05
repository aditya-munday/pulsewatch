// ==============================================================================
// Landing Page (frontend/app/page.js) - Client Component
// ==============================================================================
// Welcoming hero page that introduces PulseWatch and provides quick links
// to Login and Register. If a token is already stored, it redirects to /dashboard.
// ==============================================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '../lib/api';

export default function HomePage() {
  const router = useRouter();

  // If already logged in, automatically go to the dashboard!
  useEffect(() => {
    if (getToken()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div>
      {/* Top Header */}
      <header className="navbar">
        <div className="nav-brand">
          <span>📡</span>
          <span>PulseWatch</span>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-secondary">
            Login
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container" style={{ textAlign: 'center', marginTop: '60px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px' }}>
          Know When Your Websites Go Down <br />
          <span style={{ color: 'var(--primary)' }}>Before Your Users Do</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '650px', margin: '0 auto 32px auto' }}>
          PulseWatch pings your websites and APIs around the clock. Track uptime, response latency, and health history on a simple, beautiful dashboard.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '60px' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
            🚀 Create Free Account
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '16px' }}>
            Sign In
          </Link>
        </div>

        {/* Feature Highlights (Using Simple Flexbox) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          <div className="stat-box" style={{ textAlign: 'left', flex: '1 1 280px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚡</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Real-Time Health Checks</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Background workers ping your URLs every minute and record HTTP status codes and response times.
            </p>
          </div>

          <div className="stat-box" style={{ textAlign: 'left', flex: '1 1 280px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🚀</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Redis In-Memory Caching</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Supercharged dashboard response times using in-memory Redis caching with automatic invalidation.
            </p>
          </div>

          <div className="stat-box" style={{ textAlign: 'left', flex: '1 1 280px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Latency Logs & History</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Inspect detailed historical heartbeat checks and measure millisecond latency for each endpoint.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
