import React, { useEffect, useState } from 'react';

/**
 * Toast — lightweight slide-up notification
 *
 * Usage:
 *   const [toast, setToast] = useState(null);
 *   showToast(setToast, 'Payment recorded!', 'success');
 *
 *   <Toast toast={toast} onDismiss={() => setToast(null)} />
 */

export function showToast(setToast, message, type = 'success') {
  setToast({ message, type, id: Date.now() });
}

const ICONS = {
  success: 'check_circle',
  error:   'error',
  info:    'info',
};

const COLORS = {
  success: { bg: 'var(--accent-emerald-dim)', border: 'rgba(16,185,129,0.25)', text: 'var(--accent-emerald)' },
  error:   { bg: 'var(--accent-rose-dim)',    border: 'rgba(244,63,94,0.25)',   text: 'var(--accent-rose)'    },
  info:    { bg: 'var(--accent-blue-dim)',    border: 'rgba(59,130,246,0.25)',  text: 'var(--accent-blue)'    },
};

export default function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    // Trigger enter animation
    const show = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 2.8s
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for exit animation
    }, 2800);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [toast?.id]); // re-run when toast id changes

  if (!toast) return null;

  const c = COLORS[toast.type] || COLORS.success;

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 12px)',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        zIndex: 200,
        maxWidth: 360,
        width: 'calc(100% - 32px)',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <span
        className="material-symbols-rounded"
        style={{ fontSize: 20, color: c.text, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
      >
        {ICONS[toast.type] || 'check_circle'}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: c.text, flex: 1 }}>
        {toast.message}
      </span>
      <span
        className="material-symbols-rounded"
        style={{ fontSize: 16, color: c.text, opacity: 0.6, flexShrink: 0 }}
      >
        close
      </span>
    </div>
  );
}
