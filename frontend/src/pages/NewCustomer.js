import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency } from '../utils/api';
import PageHeader from '../components/common/PageHeader';

const CATEGORY_CHOICES = [
  {
    key: 'finance',
    label: 'Finance',
    desc: 'Fixed installment plan',
    icon: 'account_balance',
    color: 'var(--accent-blue)',
    dim: 'var(--accent-blue-dim)',
  },
  {
    key: 'vatti',
    label: 'Vatti',
    desc: 'Interest-based lending',
    icon: 'currency_rupee',
    color: 'var(--accent-violet)',
    dim: 'var(--accent-violet-dim)',
  },
];

function calcFinancePreview(amount, paymentType, totalInstallments) {
  const a = Number(amount);
  if (!a || a <= 0) return null;
  if (paymentType === 'daily' || paymentType === 'weekly') {
    const profit = Math.round(a * 0.15);
    const installment = Math.round(a * 0.10);
    return {
      inhand: a - profit,
      installment,
      installments: 10,
      totalRepay: installment * 10,
      profit,
    };
  } else {
    // Profit = ₹300 per month per ₹10,000
    const months = Number(totalInstallments) || 10;
    const profitPerMonth = Math.round((a / 10000) * 300);
    const totalProfit = profitPerMonth * months;
    const totalRepay = a + totalProfit;
    const installment = Math.round(totalRepay / months);
    return {
      inhand: a,
      installment,
      installments: months,
      totalRepay,
      profit: totalProfit,
    };
  }
}

function calcVattiPreview(amount, interestRate) {
  const a = Number(amount);
  const r = Number(interestRate);
  if (!a || !r) return null;
  return {
    inhand: a,
    monthlyInterest: Math.round(a * r / 100),
    rate: r,
  };
}

export default function NewCustomer() {
  const navigate = useNavigate();
  const [step, setStep] = useState('category'); // 'category' | 'form'
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    amount: '',
    paymentType: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    interestRate: '10',
    totalInstallments: '10',
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    // Clear the error for this field as user types
    if (fieldErrors[k]) setFieldErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const finPreview = category === 'finance' ? calcFinancePreview(form.amount, form.paymentType, form.totalInstallments) : null;
  const vattiPreview = category === 'vatti' ? calcVattiPreview(form.amount, form.interestRate) : null;

  // ── Client-side validation ─────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Name must be at least 2 characters';
    if (!/^\d{10}$/.test(form.phone.trim()))
      errs.phone = 'Phone must be exactly 10 digits';
    if (form.alternatePhone && !/^\d{10}$/.test(form.alternatePhone.trim()))
      errs.alternatePhone = 'Alternate phone must be exactly 10 digits';
    if (!form.amount || Number(form.amount) < 1)
      errs.amount = 'Enter a valid positive amount';
    if (category === 'vatti') {
      const r = Number(form.interestRate);
      if (!r || r < 0.1 || r > 15)
        errs.interestRate = 'Interest rate must be between 0.1% and 15%';
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError('');
      return;
    }
    setFieldErrors({});
    setError('');
    setLoading(true);
    try {
      await api.post('/customers', { ...form, category });
      navigate('/');
    } catch (err) {
      // If backend returns structured field errors, show them per-field
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Failed to create customer.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'category') {
    return (
      <div className="page animate-fade-in">
        <PageHeader title="New Customer" subtitle="Choose account type" />
        <div style={{ padding: '32px 20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
            Select Account Type
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Choose the type of financial agreement with your customer.
          </p>

          <div className="flex flex-col md:flex-row gap-5 w-full mt-4">
            {CATEGORY_CHOICES.map(c => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setStep('form'); }}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border)`,
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  flex: 1,
                }}
                onTouchStart={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onTouchEnd={e => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: c.dim,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 32, color: c.color, fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.desc}</div>
                  {c.key === 'finance' && (
                    <div style={{ fontSize: 12, color: c.color, marginTop: 6, fontWeight: 500 }}>
                      Fixed installments • 10K → 8.5K inhand
                    </div>
                  )}
                  {c.key === 'vatti' && (
                    <div style={{ fontSize: 12, color: c.color, marginTop: 6, fontWeight: 500 }}>
                      Interest-based • Custom rate 1–15%
                    </div>
                  )}
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: c.color }}>arrow_forward_ios</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const catInfo = CATEGORY_CHOICES.find(c => c.key === category);

  return (
    <div className="page animate-slide-up">
      <PageHeader
        title="New Customer"
        subtitle={`${catInfo.label} Account`}
        back
        right={
          <div style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: catInfo.dim,
            fontSize: 12, fontWeight: 600,
            color: catInfo.color,
          }}>{catInfo.label}</div>
        }
      />

      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full items-start">
        
        {/* Left Side: Form inputs */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {/* Customer Info */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Customer Details</div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Rajesh Kumar"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                style={{ borderColor: fieldErrors.name ? 'var(--accent-rose)' : '' }}
              />
              {fieldErrors.name && <FieldError msg={fieldErrors.name} />}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                className="form-input"
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                maxLength={10}
                style={{ borderColor: fieldErrors.phone ? 'var(--accent-rose)' : '' }}
              />
              {fieldErrors.phone && <FieldError msg={fieldErrors.phone} />}
            </div>

            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <input
                className="form-input"
                type="tel"
                placeholder="Optional"
                value={form.alternatePhone}
                onChange={e => set('alternatePhone', e.target.value)}
                maxLength={10}
                style={{ borderColor: fieldErrors.alternatePhone ? 'var(--accent-rose)' : '' }}
              />
              {fieldErrors.alternatePhone && <FieldError msg={fieldErrors.alternatePhone} />}
            </div>

            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
          </div>

          {/* Loan Details */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Loan Details</div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 10000, 20000, 30000"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, borderColor: fieldErrors.amount ? 'var(--accent-rose)' : '' }}
              />
              {fieldErrors.amount && <FieldError msg={fieldErrors.amount} />}
              {!fieldErrors.amount && form.amount && Number(form.amount) < 1000 && (
                <div style={{ fontSize: 11, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>info</span>
                  Minimum recommended amount is ₹1,000
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Type *</label>
              <select className="form-select" value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Monthly duration selector — finance only */}
            {category === 'finance' && form.paymentType === 'monthly' && (
              <div className="form-group">
                <label className="form-label">Number of Months *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[5, 10, 15, 20, 25, 30, 36, 48].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set('totalInstallments', String(m))}
                      style={{
                        padding: '12px 0',
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${form.totalInstallments === String(m) ? 'var(--accent-blue)' : 'var(--border)'}`,
                        background: form.totalInstallments === String(m) ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
                        color: form.totalInstallments === String(m) ? 'var(--accent-blue)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {/* Custom months input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Custom:</span>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Enter months"
                    value={![5,10,15,20,25,30,36,48].includes(Number(form.totalInstallments)) ? form.totalInstallments : ''}
                    onChange={e => set('totalInstallments', e.target.value)}
                    style={{ flex: 1 }}
                    min="1"
                    max="120"
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>info</span>
                  Selected: <strong style={{ color: 'var(--accent-blue)', marginLeft: 4 }}>{form.totalInstallments} months</strong>
                </div>
              </div>
            )}

            {category === 'vatti' && (
              <div className="form-group">
                <label className="form-label">Interest Rate (%) *</label>
                <select
                  className="form-select"
                  value={form.interestRate}
                  onChange={e => set('interestRate', e.target.value)}
                  style={{ borderColor: fieldErrors.interestRate ? 'var(--accent-rose)' : '' }}
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(r => (
                    <option key={r} value={r}>{r}% per month</option>
                  ))}
                </select>
                {fieldErrors.interestRate && <FieldError msg={fieldErrors.interestRate} />}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Preview Card & Onboarding Submission action */}
        <div className="w-full md:w-96 shrink-0 flex flex-col gap-4">
          {/* Preview Card */}
          {(finPreview || vattiPreview) && (
            <div style={{
              background: catInfo.dim,
              border: `1px solid ${catInfo.color}30`,
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: catInfo.color, fontVariationSettings: "'FILL' 1" }}>calculate</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: catInfo.color }}>Calculation Preview</span>
              </div>

              {finPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <PreviewRow label="Customer Gets" value={formatCurrency(finPreview.inhand)} color="var(--accent-emerald)" icon="payments" />
                  <PreviewRow label={`Per ${form.paymentType} payment`} value={formatCurrency(finPreview.installment)} color={catInfo.color} icon="repeat" />
                  <PreviewRow label="Total Installments" value={`${finPreview.installments} payments`} color="var(--text-secondary)" icon="format_list_numbered" />
                  <PreviewRow label="Total Repayment" value={formatCurrency(finPreview.totalRepay)} color="var(--text-primary)" icon="account_balance_wallet" />
                  <div style={{ height: 1, background: `${catInfo.color}20` }} />
                  <PreviewRow label="Your Profit" value={formatCurrency(finPreview.profit)} color="var(--accent-gold)" icon="trending_up" bold />
                </div>
              )}

              {vattiPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <PreviewRow label="Customer Gets" value={formatCurrency(vattiPreview.inhand)} color="var(--accent-emerald)" icon="payments" />
                  <PreviewRow label={`Monthly Interest (${vattiPreview.rate}%)`} value={formatCurrency(vattiPreview.monthlyInterest)} color={catInfo.color} icon="percent" bold />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 4 }}>
                    Customer pays ₹{vattiPreview.monthlyInterest.toLocaleString('en-IN')}/month interest until they repay the full ₹{Number(form.amount).toLocaleString('en-IN')} principal.
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{
              background: 'var(--accent-rose-dim)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--accent-rose)',
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ height: 56, fontSize: 16 }}
          >
            {loading ? (
              'Creating Account...'
            ) : (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>person_add</span>
                Create {catInfo.label} Account
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

function PreviewRow({ label, value, color, icon, bold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <span style={{ fontFamily: bold ? 'var(--font-display)' : 'inherit', fontWeight: bold ? 700 : 500, fontSize: bold ? 16 : 14, color }}>{value}</span>
    </div>
  );
}

function FieldError({ msg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: 'var(--accent-rose)' }}>
      <span className="material-symbols-rounded" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>error</span>
      {msg}
    </div>
  );
}