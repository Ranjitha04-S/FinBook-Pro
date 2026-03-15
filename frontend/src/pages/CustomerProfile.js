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
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading...</div>
  );

  const { customer: c, entries } = data;
  const isFin = c.category === 'finance';
  const catColor = isFin ? 'var(--accent-blue)' : 'var(--accent-violet)';
  const catDim = isFin ? 'var(--accent-blue-dim)' : 'var(--accent-violet-dim)';

  const progress = isFin
    ? (c.paidAmount / (c.paidAmount + c.remainingAmount)) * 100
    : ((c.amount - c.remainingAmount) / c.amount) * 100;

  const totalExpected = isFin ? (c.paidAmount + c.remainingAmount) : c.amount;

  return (
    <div className="page animate-slide-up">
      <PageHeader
        title={c.name}
        subtitle={`${c.category.toUpperCase()} • ${c.paymentType}`}
        back
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={() => setShowEditSheet(true)} title="Edit">
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--accent-gold)' }}>edit</span>
            </button>
            {c.status === 'closed' && (
              <button className="icon-btn" onClick={() => setShowDeleteSheet(true)} title="Delete">
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--accent-rose)' }}>delete</span>
              </button>
            )}
          </div>
        }
      />

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile hero */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${catDim} 0%, transparent 70%)` }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div className={`avatar ${isFin ? 'avatar-blue' : 'avatar-violet'}`} style={{ width: 56, height: 56, fontSize: 20, borderRadius: 18 }}>
              {getInitials(c.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{c.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-muted)', fontVariationSettings: "'FILL' 1" }}>call</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{c.phone}</span>
              </div>
              {c.alternatePhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-muted)', fontVariationSettings: "'FILL' 1" }}>phone_forwarded</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.alternatePhone}</span>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <span className={`badge badge-${c.status}`}>{c.status}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <MiniStat label="Given" value={formatCurrency(c.inhandAmount || c.amount)} color={catColor} />
            <MiniStat label="Collected" value={formatCurrency(c.paidAmount)} color="var(--accent-emerald)" />
            <MiniStat label="Remaining" value={formatCurrency(c.remainingAmount)} color={c.remainingAmount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Repayment Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: catColor }}>{Math.round(Math.min(progress, 100))}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${catColor}, ${isFin ? '#60A5FA' : '#A78BFA'})` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Started {formatDate(c.startDate)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total: {formatCurrency(totalExpected)}</span>
            </div>
          </div>
        </div>

        {/* Terms card */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
            {isFin ? 'Finance Terms' : 'Vatti Terms'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isFin ? (
              <>
                <InfoRow icon="payments" label={`${c.paymentType} installment`} value={formatCurrency(c.installmentAmount)} color="var(--accent-blue)" />
                <InfoRow icon="format_list_numbered" label="Total installments" value={`${c.totalInstallments} payments`} color="var(--accent-blue)" />
                <InfoRow icon="trending_up" label="Your profit" value={formatCurrency(c.financeProfit)} color="var(--accent-gold)" />
              </>
            ) : (
              <>
                <InfoRow icon="percent" label="Interest rate" value={`${c.interestRate}% per month`} color="var(--accent-violet)" />
                <InfoRow icon="payments" label="Monthly interest" value={formatCurrency(c.monthlyInterest)} color="var(--accent-violet)" />
                <InfoRow icon="account_balance_wallet" label="Principal amount" value={formatCurrency(c.amount)} color="var(--accent-gold)" />
                <InfoRow icon="hourglass_bottom" label="Remaining principal" value={formatCurrency(c.remainingAmount)} color={c.remainingAmount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
              </>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <div className="tabs">
          <button className={`tab ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>Overview</button>
          <button className={`tab ${activeSection === 'entries' ? 'active' : ''}`} onClick={() => setActiveSection('entries')}>
            Entries {entries.length > 0 && `(${entries.length})`}
          </button>
        </div>

        {activeSection === 'overview' && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Account Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow icon="calendar_today" label="Account opened" value={formatDate(c.startDate)} color="var(--text-secondary)" />
              <InfoRow icon="payments" label="Payment frequency" value={c.paymentType.charAt(0).toUpperCase() + c.paymentType.slice(1)} color="var(--text-secondary)" />
              <InfoRow icon="receipt_long" label="Total entries" value={`${entries.length} payments`} color="var(--text-secondary)" />
              {entries.length > 0 && <InfoRow icon="schedule" label="Last payment" value={formatDate(entries[0].date)} color="var(--text-secondary)" />}
            </div>
          </div>
        )}

        {activeSection === 'entries' && (
          <div className="card">
            {entries.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-rounded" style={{ fontSize: 44, color: 'var(--text-dim)', fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                <div style={{ fontWeight: 600 }}>No payments yet</div>
              </div>
            ) : entries.map((e, i) => (
              <div key={e._id} style={{ padding: '14px 16px', borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: e.note ? 4 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: e.type === 'interest' ? 'var(--accent-violet-dim)' : 'var(--accent-emerald-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: e.type === 'interest' ? 'var(--accent-violet)' : 'var(--accent-emerald)', fontVariationSettings: "'FILL' 1" }}>
                        {e.type === 'interest' ? 'percent' : 'payments'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{e.type === 'interest' ? 'Interest' : 'Payment'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(e.date)} • {formatTime(e.date)}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--accent-emerald)' }}>+{formatCurrency(e.amount)}</div>
                </div>
                {e.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 46 }}>{e.note}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {c.status === 'active' && (
          <button className="btn btn-primary btn-full" onClick={() => setShowPaySheet(true)} style={{ height: 56, fontSize: 16, marginTop: 4 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Record Payment
          </button>
        )}

        {c.status === 'closed' && (
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--accent-emerald-dim)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 36, color: 'var(--accent-emerald)', display: 'block', marginBottom: 8, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: 15 }}>Account Closed</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>All payments completed</div>
          </div>
        )}
      </div>

      {showPaySheet && <PaymentSheet customer={c} onClose={() => setShowPaySheet(false)} onSuccess={() => { setShowPaySheet(false); load(); }} />}
      {showEditSheet && <EditSheet customer={c} onClose={() => setShowEditSheet(false)} onSuccess={() => { setShowEditSheet(false); load(); }} />}
      {showDeleteSheet && <DeleteSheet customer={c} onClose={() => setShowDeleteSheet(false)} onSuccess={() => navigate('/')} />}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color }}>{value}</div>
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

// ── Payment Sheet ──────────────────────────────────────────────
function PaymentSheet({ customer: c, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(c.category === 'vatti' ? 'interest' : 'payment');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const suggested = c.category === 'finance'
    ? c.installmentAmount
    : type === 'interest' ? c.monthlyInterest : c.remainingAmount;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    try {
      await api.patch(`/customers/${c._id}/pay`, { amount: Number(amount), note, type });
      onSuccess();
    } catch (err) { setError(err.response?.data?.message || 'Payment failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '0 20px 20px' }}>
          <h2 style={{ marginBottom: 6 }}>Record Payment</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{c.name}</p>

          {c.category === 'vatti' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['interest', 'payment'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${type === t ? (t === 'interest' ? 'var(--accent-violet)' : 'var(--accent-emerald)') : 'var(--border)'}`,
                  background: type === t ? (t === 'interest' ? 'var(--accent-violet-dim)' : 'var(--accent-emerald-dim)') : 'transparent',
                  color: type === t ? (t === 'interest' ? 'var(--accent-violet)' : 'var(--accent-emerald)') : 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)',
                }}>
                  {t === 'interest' ? 'Interest' : 'Principal'}
                </button>
              ))}
            </div>
          )}

          {suggested > 0 && (
            <button onClick={() => setAmount(String(suggested))} style={{
              width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gold-dim)', border: '1px solid var(--border-accent)',
              color: 'var(--accent-gold)', cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>bolt</span>
              Use suggested: {formatCurrency(suggested)}
            </button>
          )}

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" placeholder="Enter amount" value={amount}
              onChange={e => setAmount(e.target.value)} style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700 }} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input className="form-input" placeholder="Any remark..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span>{error}</div>}
          <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading} style={{ height: 54, fontSize: 16 }}>
            {loading ? 'Recording...' : <><span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>check_circle</span>Confirm Payment</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Sheet ──────────────────────────────────────────────
function EditSheet({ customer: c, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: c.name,
    phone: c.phone,
    alternatePhone: c.alternatePhone || '',
    startDate: new Date(c.startDate).toISOString().split('T')[0],
    amount: c.amount,
    paymentType: c.paymentType,
    interestRate: c.interestRate || 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
    setLoading(true);
    try {
      await api.put(`/customers/${c._id}`, form);
      onSuccess();
    } catch (err) { setError(err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '0 20px 20px' }}>
          <h2 style={{ marginBottom: 6 }}>Edit Customer</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Update details for {c.name}</p>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Alternate Phone</label>
            <input className="form-input" type="tel" value={form.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Type</label>
            <select className="form-select" value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {c.category === 'vatti' && (
            <div className="form-group">
              <label className="form-label">Interest Rate (%)</label>
              <select className="form-select" value={form.interestRate} onChange={e => set('interestRate', e.target.value)}>
                {Array.from({ length: 15 }, (_, i) => i + 1).map(r => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>
          )}

          {error && <div style={{ color: 'var(--accent-rose)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 50 }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ flex: 2, height: 50 }}>
              {loading ? 'Saving...' : <><span className="material-symbols-rounded" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>save</span>Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Sheet ──────────────────────────────────────────────
function DeleteSheet({ customer: c, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!pin) { setError('Enter the deletion PIN'); return; }
    setLoading(true);
    try {
      await api.delete(`/customers/${c._id}`, { data: { pin } });
      onSuccess();
    } catch (err) { setError(err.response?.data?.message || 'Deletion failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--accent-rose-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 28, color: 'var(--accent-rose)', fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
          </div>
          <h2 style={{ marginBottom: 6 }}>Delete Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            You are about to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>'s account and all related entries.
          </p>
          <div style={{ background: 'var(--accent-rose-dim)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, color: 'var(--accent-rose)', marginBottom: 20 }}>
            This action cannot be undone. Only closed accounts can be deleted.
          </div>

          <div className="form-group">
            <label className="form-label">Enter Deletion PIN to confirm</label>
            <input className="form-input" type="password" placeholder="Enter PIN" value={pin}
              onChange={e => setPin(e.target.value)} style={{ letterSpacing: '0.2em', fontSize: 18 }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Contact admin for the deletion PIN.</div>
          </div>

          {error && <div style={{ color: 'var(--accent-rose)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 50 }}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={loading} style={{ flex: 2, height: 50 }}>
              {loading ? 'Deleting...' : <><span className="material-symbols-rounded" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>Delete Permanently</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
