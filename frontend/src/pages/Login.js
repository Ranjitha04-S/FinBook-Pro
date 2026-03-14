import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch {
      setError('Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 28px',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, var(--accent-gold), #D97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 32px rgba(245,158,11,0.35)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A' }}>SR</span>
        </div>
        <h1 style={{ fontSize: 30, color: 'var(--text-primary)', marginBottom: 6 }}>SR Finance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Secure management portal</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340 }}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            type="text"
            placeholder="Enter username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div style={{
            background: 'var(--accent-rose-dim)',
            border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontSize: 13,
            color: 'var(--accent-rose)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ marginTop: 8, height: 52, fontSize: 16 }}
        >
          {loading ? (
            <span style={{ opacity: 0.7 }}>Signing in...</span>
          ) : (
            <>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>lock_open</span>
              Sign In
            </>
          )}
        </button>
      </form>

      <p style={{ position: 'absolute', bottom: 32, color: 'var(--text-muted)', fontSize: 12 }}>
        SR Finance Management System
      </p>
    </div>
  );
}
