import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { formatCurrency, formatDate, formatTime, getInitials } from '../utils/api';
import PageHeader from '../components/common/PageHeader';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setData(res.data);
    } catch { navigate('/'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
      <div>Loading...</div>
    </div>
  );

  const { customer: c, entries } = data;
  const isFin = c.category === 'finance';
  const catColor = isFin ? 'var(--accent-blue)' : 'var(--accent-violet)';
  const catDim = isFin ? 'var(--accent-blue-dim)' : 'var(--accent-violet-dim)';
  const avatarClass = isFin ? 'avatar-blue' : 'avatar-violet';

  const progress = isFin
    ? c.paidAmount / (c.paidAmount + c.remainingAmount) * 100
    : ((c.amount - c.remainingAmount) / c.amount) * 100;

  const totalExpected = isFin ? (c.paidAmount + c.remainingAmount) : c.amount;

  return (
    <div className="page animate-slide-up">
      <PageHeader
        title={c.name}
        subtitle={`${c.category.toUpperCase()} • ${c.paymentType}`}
        back
        right={
          <span className={`badge badge-${c.status}`} style={{ fontSize: 11, padding: '4px 12px' }}>{c.status}</span>
        }
      />

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile hero */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -30, top: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: `radial-gradient(circle, ${catDim} 0%, transparent 70%)`,
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div className={`avatar ${avatarClass}`} style={{ width: 56, height: 56, fontSize: 20, borderRadius: 18 }}>
              {getInitials(c.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{c.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-muted)', fontVariationSettings: "'FILL' 1" }}>call</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{c.phone}</span>
              </div>
              {c.alternatePhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-muted)', fontVariationSettings: "'FILL' 1" }}>phone_forwarded</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.alternatePhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <MiniStat label="Amount Given" value={formatCurrency(c.inhandAmount || c.amount)} color={catColor} />
            <MiniStat label="Collected" value={formatCurrency(c.paidAmount)} color="var(--accent-emerald)" />
            <MiniStat label="Remaining" value={formatCurrency(c.remainingAmount)} color={c.remainingAmount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'} />
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Repayment Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: catColor }}>{Math.round(Math.min(progress, 100))}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{
                width: `${Math.min(progress, 100)}%`,
                background: `linear-gradient(90deg, ${catColor}, ${isFin ? '#60A5FA' : '#A78BFA'})`,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Started {formatDate(c.startDate)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total: {formatCurrency(totalExpected)}</span>
            </div>
          </div>
        </div>

        {/* Finance-specific info */}
        {isFin && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Finance Terms</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow icon="payments" label={`${c.paymentType} installment`} value={formatCurrency(c.installmentAmount)} color="var(--accent-blue)" />
              <InfoRow icon="format_list_numbered" label="Total installments" value={`${c.totalInstallments} payments`} color="var(--accent-blue)" />
              <InfoRow icon="trending_up" label="Your profit" value={formatCurrency(c.financeProfit)} color="var(--accent-gold)" />
            </div>
          </div>
        )}

        {/* Vatti-specific info */}
        {!isFin && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Vatti Terms</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow icon="percent" label="Interest rate" value={`${c.interestRate}% per month`} color="var(--accent-violet)" />
              <InfoRow icon="payments" label="Monthly interest" value={formatCurrency(c.monthlyInterest)} color="var(--accent-violet)" />
              <InfoRow icon="account_balance_wallet" label="Principal amount" value={formatCurrency(c.amount)} color="var(--accent-gold)" />
              <InfoRow icon="hourglass_bottom" label="Remaining principal" value={formatCurrency(c.remainingAmount)} color={c.remainingAmount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
            </div>
          </div>
        )}

        {/* Section tabs */}
        <div className="tabs">
          <button className={`tab ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>Overview</button>
          <button className={`tab ${activeSection === 'entries' ? 'active' : ''}`} onClick={() => setActiveSection('entries')}>
            Entries {entries.length > 0 && `(${entries.length})`}
          </button>
        </div>

        {activeSection === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Account Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow icon="calendar_today" label="Account opened" value={formatDate(c.startDate)} color="var(--text-secondary)" />
                <InfoRow icon="payments" label="Payment frequency" value={c.paymentType.charAt(0).toUpperCase() + c.paymentType.slice(1)} color="var(--text-secondary)" />
                <InfoRow icon="receipt_long" label="Total entries" value={`${entries.length} payments recorded`} color="var(--text-secondary)" />
                {entries.length > 0 && (
                  <InfoRow icon="schedule" label="Last payment" value={formatDate(entries[0].date)} color="var(--text-secondary)" />
                )}
              </div>
            </div>

            {/* Recent entries preview */}
            {entries.length > 0 && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recent Payments</div>
                  <button style={{ border: 'none', background: 'none', color: catColor, fontSize: 12, cursor: 'pointer', fontWeight: 600 }} onClick={() => setActiveSection('entries')}>View all</button>
                </div>
                {entries.slice(0, 3).map(e => (
                  <EntryRow key={e._id} entry={e} catColor={catColor} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'entries' && (
          <div className="card">
            {entries.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-rounded" style={{ fontSize: 44, color: 'var(--text-dim)', fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                <div style={{ fontWeight: 600 }}>No payments yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Record the first payment below</div>
              </div>
            ) : (
              <div style={{ padding: '4px 0' }}>
                {entries.map((e, i) => (
                  <div key={e._id} style={{ padding: '14px 16px', borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: e.type === 'interest' ? 'var(--accent-violet-dim)' : 'var(--accent-emerald-dim)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span className="material-symbols-rounded" style={{
                            fontSize: 18,
                            color: e.type === 'interest' ? 'var(--accent-violet)' : 'var(--accent-emerald)',
                            fontVariationSettings: "'FILL' 1"
                          }}>
                            {e.type === 'interest' ? 'percent' : 'payments'}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {e.type === 'interest' ? 'Interest' : 'Payment'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(e.date)}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                          +{formatCurrency(e.amount)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(e.date)}</div>
                      </div>
                    </div>
                    {e.note && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginLeft: 46 }}>{e.note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pay button */}
        {c.status === 'active' && (
          <button
            className="btn btn-primary btn-full"
            onClick={() => setShowPaySheet(true)}
            style={{ height: 56, fontSize: 16, marginTop: 4 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Record Payment
          </button>
        )}

        {c.status === 'closed' && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'var(--accent-emerald-dim)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 36, color: 'var(--accent-emerald)', display: 'block', marginBottom: 8, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: 15 }}>Account Closed</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>All payments completed successfully</div>
          </div>
        )}
      </div>

      {/* Payment Sheet */}
      {showPaySheet && (
        <PaymentSheet
          customer={c}
          onClose={() => setShowPaySheet(false)}
          onSuccess={() => { setShowPaySheet(false); load(); }}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function InfoRow({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function EntryRow({ entry: e, catColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--accent-emerald)', fontVariationSettings: "'FILL' 1" }}>payments</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(e.date)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(e.date)}</div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--accent-emerald)' }}>+{formatCurrency(e.amount)}</div>
    </div>
  );
}

function PaymentSheet({ customer: c, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(c.category === 'vatti' ? 'interest' : 'payment');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isFin = c.category === 'finance';

  const suggestedAmount = isFin
    ? c.installmentAmount
    : type === 'interest'
      ? c.monthlyInterest
      : c.remainingAmount;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    try {
      await api.patch(`/customers/${c._id}/pay`, { amount: Number(amount), note, type });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false); }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '0 20px 20px' }}>
          <h2 style={{ marginBottom: 6 }}>Record Payment</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>{c.name} — {c.paymentType} {c.category}</p>

          {!isFin && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setType('interest')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)', border: `1.5px solid ${type === 'interest' ? 'var(--accent-violet)' : 'var(--border)'}`,
                  background: type === 'interest' ? 'var(--accent-violet-dim)' : 'transparent',
                  color: type === 'interest' ? 'var(--accent-violet)' : 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)',
                }}
              >
                Interest
              </button>
              <button
                onClick={() => setType('payment')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)', border: `1.5px solid ${type === 'payment' ? 'var(--accent-emerald)' : 'var(--border)'}`,
                  background: type === 'payment' ? 'var(--accent-emerald-dim)' : 'transparent',
                  color: type === 'payment' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)',
                }}
              >
                Principal
              </button>
            </div>
          )}

          {suggestedAmount > 0 && (
            <button
              onClick={() => setAmount(String(suggestedAmount))}
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-gold-dim)', border: '1px solid var(--border-accent)',
                color: 'var(--accent-gold)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>bolt</span>
              Use suggested: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(suggestedAmount)}
            </button>
          )}

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input className="form-input" placeholder="Any remark..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {error && (
            <div style={{ color: 'var(--accent-rose)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ height: 54, fontSize: 16 }}
          >
            {loading ? 'Recording...' : (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
