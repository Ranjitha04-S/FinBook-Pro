import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api, { formatCurrency, formatDate, getInitials, getAvatarColor } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: '#3B82F6', marginBottom: 4 }}>Collected: {formatCurrency(payload[0]?.value)}</div>
      <div style={{ color: '#8B5CF6' }}>Invested: {formatCurrency(payload[1]?.value)}</div>
    </div>
  );
};

export default function Home() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const load = useCallback(async () => {
    try {
      const [statsRes, chartRes, custRes, notifRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/monthly-chart'),
        api.get('/customers'),
        api.get('/notifications'),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setCustomers(custRes.data);
      setNotifCount(notifRes.data.filter(n => !n.isChecked).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredCustomers = customers.filter(c => {
    if (activeTab === 'all') return true;
    return c.category === activeTab;
  });

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        background: 'rgba(15,23,42,0.95)',
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent-gold), #D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>SR</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>SR Finance</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{todayStr}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: notifCount > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)', fontVariationSettings: "'FILL' 1" }}>notifications</span>
              {notifCount > 0 && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent-rose)',
                  border: '2px solid var(--bg-primary)',
                }} />
              )}
            </button>
            <button className="icon-btn" onClick={logout}>
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>logout</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero stat */}
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #253347 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 20px',
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -20, top: -20,
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
          }} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Today's Collection</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--accent-gold)', lineHeight: 1.1 }}>
            {loading ? '—' : formatCurrency(stats?.todayCollection)}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>New Accounts</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                {loading ? '—' : stats?.todayNewAccounts}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Active Accounts</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent-emerald)' }}>
                {loading ? '—' : stats?.activeCustomers}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Closed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-secondary)' }}>
                {loading ? '—' : stats?.closedCustomers}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="stats-row">
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--accent-blue)', fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <span className="label">Weekly</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{loading ? '—' : formatCurrency(stats?.weekCollection)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>collected this week</div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-emerald-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--accent-emerald)', fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
              </div>
              <span className="label">Monthly</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{loading ? '—' : formatCurrency(stats?.monthCollection)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>collected this month</div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-rose-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--accent-rose)', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
              <span className="label">Invested</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>{loading ? '—' : formatCurrency(stats?.totalInvested)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>total deployed</div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--accent-violet)', fontVariationSettings: "'FILL' 1" }}>people</span>
              </div>
              <span className="label">Pending</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-violet)' }}>{loading ? '—' : notifCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>due collections</div>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ padding: '20px 16px 8px' }}>
            <div className="section-header">
              <div>
                <h3 style={{ fontSize: 14 }}>Collection vs Investment</h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Last 6 months</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Collected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Invested</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="coll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="inv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="collection" stroke="#3B82F6" strokeWidth={2} fill="url(#coll)" dot={false} />
                <Area type="monotone" dataKey="investment" stroke="#8B5CF6" strokeWidth={2} fill="url(#inv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Customer list */}
        <div>
          <div className="section-header">
            <h3>Customers</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredCustomers.length} accounts</span>
          </div>

          {/* Category tabs */}
          <div className="tabs" style={{ marginBottom: 14 }}>
            {['all', 'finance', 'vatti'].map(t => (
              <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="card">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '40%', height: 12 }} />
                  </div>
                </div>
              ))
            ) : filteredCustomers.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--text-dim)', fontVariationSettings: "'FILL' 1" }}>person_search</span>
                <div style={{ fontWeight: 600 }}>No customers yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Create a new account to get started</div>
              </div>
            ) : filteredCustomers.map(c => (
              <CustomerListItem key={c._id} customer={c} onClick={() => navigate(`/customer/${c._id}`)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerListItem({ customer: c, onClick }) {
  const pct = c.remainingAmount > 0
    ? Math.round(((c.category === 'finance' ? (c.remainingAmount - (c.remainingAmount - c.paidAmount)) : c.paidAmount) / (c.category === 'vatti' ? c.amount : c.remainingAmount + c.paidAmount)) * 100)
    : 100;
  const progress = c.category === 'finance' && c.remainingAmount > 0
    ? Math.round((c.paidAmount / (c.paidAmount + c.remainingAmount)) * 100)
    : c.category === 'vatti'
      ? Math.round(((c.amount - c.remainingAmount) / c.amount) * 100)
      : 100;

  return (
    <div className="customer-item" onClick={onClick}>
      <div className={`avatar ${c.category === 'finance' ? 'avatar-blue' : 'avatar-violet'}`}>
        {getInitials(c.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
          <span className={`badge badge-${c.status}`}>{c.status}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className={`badge badge-${c.category}`}>{c.category}</span>
          <span className={`badge badge-${c.paymentType}`}>{c.paymentType}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{(c.amount/1000).toFixed(0)}K</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-fill" style={{
              width: `${Math.min(progress, 100)}%`,
              background: c.category === 'finance' ? 'var(--accent-blue)' : 'var(--accent-violet)',
            }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{progress}%</span>
        </div>
      </div>
      <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--text-dim)' }}>chevron_right</span>
    </div>
  );
}
