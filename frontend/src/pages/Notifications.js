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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleCheck = async (notif) => {
    try {
      await api.patch(`/notifications/${notif._id}/check`);
      setNotifications(prev =>
        prev.map(n => n._id === notif._id ? { ...n, isChecked: true } : n)
      );
      setTimeout(() => navigate(`/customer/${notif.customer._id}`), 300);
    } catch (err) {
      console.error(err);
    }
  };

  const unchecked = notifications.filter(n => !n.isChecked);
  const checked = notifications.filter(n => n.isChecked);

  const typeColor = (type) => {
    if (type === 'daily') return 'var(--accent-teal)';
    if (type === 'weekly') return 'var(--accent-gold)';
    return 'var(--accent-rose)';
  };

  const typeIcon = (type) => {
    if (type === 'daily') return 'today';
    if (type === 'weekly') return 'view_week';
    return 'calendar_month';
  };

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle="Payment collection reminders"
        right={
          unchecked.length > 0 && (
            <div style={{
              background: 'var(--accent-rose-dim)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px',
              fontSize: 12,
              color: 'var(--accent-rose)',
              fontWeight: 700,
            }}>
              {unchecked.length} due
            </div>
          )
        }
      />

      <div style={{ padding: '16px 16px 0' }}>
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${activeFilter === 'today' ? 'active' : ''}`} onClick={() => setActiveFilter('today')}>Today's Due</button>
          <button className={`tab ${activeFilter === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveFilter('upcoming')}>Upcoming</button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '55%', height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '35%', height: 12 }} />
              </div>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div style={{
                width: 72, height: 72, borderRadius: 24,
                background: 'var(--accent-emerald-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
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
            {/* Unchecked */}
            {unchecked.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 4 }}>
                  Pending ({unchecked.length})
                </div>
                <div className="card">
                  {unchecked.map((n, i) => (
                    <div
                      key={n._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 16px',
                        borderBottom: i < unchecked.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleCheck(n)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          border: `2px solid ${typeColor(n.type)}`,
                          background: 'transparent',
                          cursor: 'pointer',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      />

                      {/* Avatar */}
                      <div
                        className={`avatar ${n.category === 'finance' ? 'avatar-blue' : 'avatar-violet'}`}
                        style={{ width: 40, height: 40, fontSize: 14 }}
                      >
                        {getInitials(n.customer?.name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                          {n.customer?.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`badge badge-${n.category}`}>{n.category}</span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: 11, color: typeColor(n.type), fontWeight: 600,
                          }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{typeIcon(n.type)}</span>
                            {n.type}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatDate(n.dueDate)}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--accent-gold)' }}>
                          {formatCurrency(n.category === 'finance' ? n.customer?.amount : n.customer?.amount)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>due</div>
                      </div>

                      {/* Arrow */}
                      <button
                        onClick={() => navigate(`/customer/${n.customer._id}`)}
                        className="icon-btn"
                        style={{ width: 36, height: 36, borderRadius: 10 }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--text-muted)' }}>open_in_new</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checked / done */}
            {checked.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 4 }}>
                  Collected ({checked.length})
                </div>
                <div className="card">
                  {checked.map((n, i) => (
                    <div
                      key={n._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 16px',
                        opacity: 0.55,
                        borderBottom: i < checked.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {/* Checked box */}
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: 'var(--accent-emerald)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#0F172A', fontVariationSettings: "'FILL' 1" }}>check</span>
                      </div>
                      <div className={`avatar ${n.category === 'finance' ? 'avatar-blue' : 'avatar-violet'}`} style={{ width: 40, height: 40, fontSize: 14 }}>
                        {getInitials(n.customer?.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600, fontSize: 15,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          textDecoration: 'line-through',
                          marginBottom: 2,
                        }}>
                          {n.customer?.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.type} • {n.category}</div>
                      </div>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--accent-emerald)', fontVariationSettings: "'FILL' 1" }}>task_alt</span>
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
