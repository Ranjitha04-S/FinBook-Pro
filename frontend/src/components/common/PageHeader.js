import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, back, right }) {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 20px 12px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'rgba(15,23,42,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      {back && (
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ marginLeft: -4 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back_ios_new</span>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
