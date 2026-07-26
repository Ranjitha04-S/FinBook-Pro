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
    <>
      {/* ── Mobile Navigation Bar (max-width: 768px) ── */}
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#0F172A]/95 backdrop-blur-[20px] border-t border-border flex z-50 pb-[var(--safe-bottom)] h-[calc(var(--nav-height)+var(--safe-bottom))]">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          const isNew = tab.path === '/new-customer';
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent cursor-pointer py-2.5 relative"
            >
              {isNew ? (
                <div className="w-12 h-12 rounded-full bg-accent-gold flex items-center justify-center mb-0.5 shadow-[0_4px_16px_rgba(245,158,11,0.4)]">
                  <span className="material-symbols-rounded text-[24px] text-[#0F172A] !fill-1">
                    add
                  </span>
                </div>
              ) : (
                <>
                  <div className={`w-10 h-7 flex items-center justify-center rounded-[14px] transition-colors duration-200 ${active ? 'bg-accent-gold-dim' : 'bg-transparent'}`}>
                    <span
                      className={`material-symbols-rounded text-[22px] transition-colors duration-200 ${active ? 'text-accent-gold !fill-1' : 'text-text-muted !fill-0'}`}
                    >
                      {tab.icon}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase transition-colors duration-200 ${active ? 'text-accent-gold' : 'text-text-muted'}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Desktop Sidebar Navigation (min-width: 769px) ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F172A]/95 border-r border-border h-full p-6 shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-accent-gold to-amber-600 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
            <span className="font-display text-[14px] font-extrabold text-[#0F172A]">FB</span>
          </div>
          <div>
            <div className="font-display text-[16px] font-extrabold text-text-primary leading-tight">FinBook Pro</div>
            <div className="text-[11px] text-text-muted font-medium uppercase tracking-wider">Management Portal</div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 flex flex-col gap-1.5">
          {tabs.map(tab => {
            const active = location.pathname === tab.path;
            const isNew = tab.path === '/new-customer';

            // Treat standard link items
            if (!isNew) {
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-md border-none cursor-pointer text-left transition-colors duration-150 ${active ? 'bg-accent-gold-dim text-accent-gold font-bold' : 'bg-transparent text-text-secondary hover:bg-bg-elevated/40 hover:text-text-primary'}`}
                >
                  <span className={`material-symbols-rounded text-[20px] ${active ? '!fill-1' : '!fill-0'}`}>
                    {tab.icon}
                  </span>
                  <span className="text-[13px] font-medium tracking-wide uppercase">{tab.label}</span>
                </button>
              );
            }
            return null; // Handle Action Button separately below
          })}
        </div>

        {/* Create Account Action (Desktop placement bottom or sidebar action) */}
        <div className="mt-auto">
          <button
            onClick={() => navigate('/new-customer')}
            className="btn btn-primary btn-full flex items-center justify-center gap-2 h-12 shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
          >
            <span className="material-symbols-rounded text-[20px] !fill-1">add</span>
            Create Account
          </button>
        </div>
      </aside>
    </>
  );
}
