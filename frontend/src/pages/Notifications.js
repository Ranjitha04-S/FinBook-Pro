import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency, formatDate, getInitials } from '../utils/api';
import PageHeader from '../components/common/PageHeader';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('today');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const endpoint = activeFilter === 'upcoming' ? '/notifications/upcoming' : '/notifications';
      const res = await api.get(endpoint);
      setNotifications(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activeFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Tap arrow → visit customer page (no strikethrough yet)
  const handleVisit = async (notif) => {
    try { await api.patch(`/notifications/${notif._id}/visit`); } catch {}
    navigate(`/customer/${notif.customer._id}`);
  };

  const resolved = notifications.filter(n => n.isResolved);
  const pending = notifications.filter(n => !n.isResolved);

  const typeColor = (t) => t === 'daily' ? 'var(--accent-teal)' : t === 'weekly' ? 'var(--accent-gold)' : 'var(--accent-rose)';
  const typeIcon = (t) => t === 'daily' ? 'today' : t === 'weekly' ? 'view_week' : 'calendar_month';
  const getDueAmount = (n) => n.category === 'finance' ? (n.customer?.installmentAmount || 0) : (n.customer?.monthlyInterest || 0);

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle="Payment collection reminders"
        right={pending.length > 0 && (
          <div style={{ background: 'var(--accent-rose-dim)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: 12, color: 'var(--accent-rose)', fontWeight: 700 }}>
            {pending.length} due
          </div>
        )}
      />

      <div style={{ padding: '16px 16px 0' }}>
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${activeFilter === 'today' ? 'active' : ''}`} onClick={() => setActiveFilter('today')}>Today's Due</button>
          <button className={`tab ${activeFilter === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveFilter('upcoming')}>Upcoming</button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--accent-blue-dim)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--accent-blue)', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>info</span>
          <span style={{ fontSize: 12, color: 'var(--accent-blue)', lineHeight: 1.5 }}>
            Tap the arrow to open customer and record payment. Strikethrough appears only after payment is recorded.
          </span>
        </div>

        {loading ? [1,2,3].map(i => (
          <div key={i} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '55%', height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '35%', height: 12 }} />
            </div>
          </div>
        )) : notifications.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div style={{ width: 72, height: 72, borderRadius: 24, background: 'var(--accent-emerald-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 36, color: 'var(--accent-emerald)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>All clear!</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                {activeFilter === 'today' ? 'No collections due today.' : 'No upcoming collections.'}
              </div>
            </div>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 4 }}>Pending ({pending.length})</div>
                <div className="card">
                  {pending.map((n, i) => (
                    <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${typeColor(n.type)}`, flexShrink: 0 }} />
                      <div className={`avatar ${n.category === 'finance' ? 'avatar-blue' : 'avatar-violet'}`} style={{ width: 40, height: 40, fontSize: 14 }}>
                        {getInitials(n.customer?.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{n.customer?.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`badge badge-${n.category}`}>{n.category}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: typeColor(n.type), fontWeight: 600 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{typeIcon(n.type)}</span>
                            {n.type}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(n.dueDate)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 4 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--accent-gold)' }}>{formatCurrency(getDueAmount(n))}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>due</div>
                      </div>
                      <button onClick={() => handleVisit(n)} style={{ width: 40, height: 40, borderRadius: 12, background: n.category === 'finance' ? 'var(--accent-blue-dim)' : 'var(--accent-violet-dim)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 20, color: n.category === 'finance' ? 'var(--accent-blue)' : 'var(--accent-violet)', fontVariationSettings: "'FILL' 1" }}>arrow_circle_right</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resolved.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 4 }}>Collected ({resolved.length})</div>
                <div className="card">
                  {resolved.map((n, i) => (
                    <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', opacity: 0.5, borderBottom: i < resolved.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#0F172A', fontVariationSettings: "'FILL' 1" }}>check</span>
                      </div>
                      <div className={`avatar ${n.category === 'finance' ? 'avatar-blue' : 'avatar-violet'}`} style={{ width: 40, height: 40, fontSize: 14 }}>{getInitials(n.customer?.name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'line-through', marginBottom: 2 }}>{n.customer?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.type} • {n.category} • Paid</div>
                      </div>
                      <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--accent-emerald)', fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
