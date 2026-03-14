import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency, formatDate, formatTime, getInitials } from '../utils/api';
import PageHeader from '../components/common/PageHeader';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadReport = useCallback(async (date) => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await api.get(`/dashboard/date-report?date=${dateStr}`);
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReport(selectedDate); }, [selectedDate, loadReport]);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const calYear = selectedDate.getFullYear();
  const calMonth = selectedDate.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    setSelectedDate(d);
  };

  const nextMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    setSelectedDate(d);
  };

  const selectDay = (day) => {
    const d = new Date(calYear, calMonth, day);
    setSelectedDate(d);
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day &&
      selectedDate.getMonth() === calMonth &&
      selectedDate.getFullYear() === calYear;
  };

  const isToday = (day) => {
    return today.getDate() === day &&
      today.getMonth() === calMonth &&
      today.getFullYear() === calYear;
  };

  const totalCollected = report?.totalCollected || 0;
  const totalInvested = report?.totalInvested || 0;
  const entries = report?.entries || [];
  const newAccounts = report?.newAccounts || [];

  return (
    <div className="page animate-fade-in">
      <PageHeader title="Calendar Report" subtitle="Daily financial summary" />

      <div style={{ padding: '16px 16px 0' }}>

        {/* Calendar */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="icon-btn" onClick={prevMonth}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>chevron_left</span>
            </button>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>
              {months[calMonth]} {calYear}
            </div>
            <button className="icon-btn" onClick={nextMonth}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>chevron_right</span>
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
            {weekdays.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const sel = isSelected(day);
              const tod = isToday(day);
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 10,
                    border: 'none',
                    background: sel ? 'var(--accent-gold)' : tod ? 'var(--accent-gold-dim)' : 'transparent',
                    color: sel ? '#0F172A' : tod ? 'var(--accent-gold)' : 'var(--text-primary)',
                    fontFamily: sel || tod ? 'var(--font-display)' : 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: sel || tod ? 700 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report for selected date */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
            {formatDate(selectedDate)}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2].map(i => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>

            {/* Summary cards */}
            <div className="stats-row">
              <div className="stat-card" style={{ borderColor: totalCollected > 0 ? 'rgba(16,185,129,0.2)' : 'var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-emerald-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--accent-emerald)', fontVariationSettings: "'FILL' 1" }}>payments</span>
                  </div>
                  <span className="label" style={{ fontSize: 10 }}>Collected</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {formatCurrency(totalCollected)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{entries.length} payments</div>
              </div>

              <div className="stat-card" style={{ borderColor: totalInvested > 0 ? 'rgba(244,63,94,0.2)' : 'var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-rose-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--accent-rose)', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  </div>
                  <span className="label" style={{ fontSize: 10 }}>Invested</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent-rose)' }}>
                  {formatCurrency(totalInvested)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{newAccounts.length} new accounts</div>
              </div>
            </div>

            {/* Payments list */}
            {entries.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 2 }}>
                  Collections ({entries.length})
                </div>
                <div className="card">
                  {entries.map((e, i) => (
                    <div
                      key={e._id}
                      onClick={() => navigate(`/customer/${e.customer._id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px',
                        borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onTouchStart={ev => ev.currentTarget.style.background = 'var(--bg-elevated)'}
                      onTouchEnd={ev => ev.currentTarget.style.background = 'transparent'}
                    >
                      <div className={`avatar ${e.customer.category === 'finance' ? 'avatar-blue' : 'avatar-violet'}`} style={{ width: 40, height: 40, fontSize: 14 }}>
                        {getInitials(e.customer.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                          {e.customer.name}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className={`badge badge-${e.customer.category}`}>{e.customer.category}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(e.date)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                          +{formatCurrency(e.amount)}
                        </div>
                        {e.note && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New accounts */}
            {newAccounts.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 2 }}>
                  New Accounts ({newAccounts.length})
                </div>
                <div className="card">
                  {newAccounts.map((c, i) => (
                    <div
                      key={c._id}
                      onClick={() => navigate(`/customer/${c._id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px',
                        borderBottom: i < newAccounts.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div className={`avatar ${c.category === 'finance' ? 'avatar-blue' : 'avatar-violet'}`} style={{ width: 40, height: 40, fontSize: 14 }}>
                        {getInitials(c.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                          {c.name}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className={`badge badge-${c.category}`}>{c.category}</span>
                          <span className={`badge badge-${c.paymentType}`}>{c.paymentType}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--accent-rose)' }}>
                          -{formatCurrency(c.inhandAmount || c.amount)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>invested</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entries.length === 0 && newAccounts.length === 0 && (
              <div className="card">
                <div className="empty-state">
                  <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--text-dim)', fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                  <div style={{ fontWeight: 600 }}>No activity</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No payments or accounts on this date</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
