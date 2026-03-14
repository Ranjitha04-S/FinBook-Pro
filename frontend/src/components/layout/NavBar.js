import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/notifications', icon: 'notifications', label: 'Alerts' },
  { path: '/new-customer', icon: 'person_add', label: 'New' },
  { path: '/calendar', icon: 'calendar_month', label: 'Calendar' },
];

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: 'rgba(15,23,42,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 50,
      paddingBottom: 'var(--safe-bottom)',
      height: 'calc(var(--nav-height) + var(--safe-bottom))',
    }}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        const isNew = tab.path === '/new-customer';
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '10px 0',
              position: 'relative',
            }}
          >
            {isNew ? (
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 2,
                boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#0F172A', fontVariationSettings: "'FILL' 1" }}>
                  add
                </span>
              </div>
            ) : (
              <>
                <div style={{
                  width: 40,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  background: active ? 'var(--accent-gold-dim)' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  <span
                    className="material-symbols-rounded"
                    style={{
                      fontSize: 22,
                      color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      transition: 'color 0.2s',
                    }}
                  >
                    {tab.icon}
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s',
                }}>
                  {tab.label}
                </span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
