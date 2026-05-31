'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  GraduationCap, 
  Calendar, 
  Settings, 
  Crown,
  HelpCircle,
  Activity,
  Dumbbell
} from 'lucide-react';
import { useUiStore } from '../../stores/ui-store';
import { ROUTES } from '../../lib/constants';

// Scalable premium PitchMind SVG logo reproducing the wicket, arc ball trajectory, and performance growth chart
export const PitchMindLogo: React.FC<{ expanded?: boolean }> = ({ expanded = true }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '8px' }}>
      <svg width="100%" height="80" viewBox="0 0 320 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'var(--transition-smooth)' }}>
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#0fa47f" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="ball-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Wicket Crease / Stumps Symbol (Pitch crease forming 'A') */}
        <path d="M 60 75 L 85 25 L 110 75" stroke="url(#brand-grad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="68" y1="62" x2="102" y2="62" stroke="url(#brand-grad)" strokeWidth="4" strokeLinecap="round" />
        <line x1="85" y1="25" x2="85" y2="75" stroke="url(#brand-grad)" strokeWidth="3" strokeDasharray="3 3" />
        
        {/* Ball Trajectory Arc */}
        <path d="M 85 25 Q 115 -10 145 15" stroke="url(#brand-grad)" strokeWidth="4" strokeLinecap="round" fill="none" />
        
        {/* Cricket Ball */}
        <circle cx="145" cy="15" r="5" fill="url(#ball-glow)" filter="url(#glow-filter)" />
        
        {/* Performance Bar Chart elements */}
        <rect x="120" y="55" width="5" height="20" rx="1.5" fill="url(#brand-grad)" />
        <rect x="128" y="47" width="5" height="28" rx="1.5" fill="url(#brand-grad)" />
        <rect x="136" y="39" width="5" height="36" rx="1.5" fill="url(#brand-grad)" />
        <rect x="144" y="30" width="5" height="45" rx="1.5" fill="url(#brand-grad)" />

        {/* Text Logo */}
        {expanded && (
          <>
            <text x="165" y="52" fill="#d1d5db" fontSize="30" fontWeight="700" fontFamily="'Outfit', sans-serif" letterSpacing="0.5">Pitch</text>
            <text x="233" y="52" fill="url(#brand-grad)" fontSize="30" fontWeight="700" fontFamily="'Outfit', sans-serif" letterSpacing="0.5">Mind</text>
            <text x="165" y="74" fill="#6b7280" fontSize="9" fontWeight="600" fontFamily="'Outfit', sans-serif" letterSpacing="2.5">COACH . ANALYZE . IMPROVE .</text>
          </>
        )}
      </svg>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  const navItems = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Sessions', path: '/sessions', icon: Video },
    { name: 'Compare', path: '/compare', icon: Activity },
    { name: 'Players', path: '/players', icon: Users },
    { name: 'Feedback', path: '/feedback', icon: MessageSquare },
    { name: 'AI Insights', path: '/ai-insights', icon: Sparkles },
    { name: 'Conditioning', path: '/conditioning', icon: Dumbbell },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Academy', path: '/academy', icon: GraduationCap },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`sidebar-container ${sidebarOpen ? 'expanded' : 'collapsed'}`}
      style={{
        width: sidebarOpen ? '260px' : '80px',
        background: 'var(--color-sidebar)',
        borderRight: '1px solid #111c2e',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        transition: 'var(--transition-smooth)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Brand Header */}
      <div
        className="brand-header"
        style={{
          padding: sidebarOpen ? '16px 12px 10px' : '20px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #111c2e',
          overflow: 'hidden',
          minHeight: '80px'
        }}
      >
        {sidebarOpen ? (
          <PitchMindLogo expanded={true} />
        ) : (
          <div style={{ transform: 'scale(0.85)', width: '60px', height: '60px', overflow: 'hidden' }}>
            <svg width="70" height="70" viewBox="40 0 120 100" fill="none">
              <path d="M 60 75 L 85 25 L 110 75" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="68" y1="62" x2="102" y2="62" stroke="url(#brand-grad)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="115" cy="20" r="6" fill="#ffffff" />
            </svg>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav
        className="sidebar-nav"
        style={{
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flex: 1,
          overflowY: 'auto'
        }}
      >
        {navItems.map((item) => {
          // Keep Dashboard active for first-time visual sync
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={
                item.name === 'Dashboard' 
                  ? ROUTES.DASHBOARD 
                  : item.name === 'Sessions' 
                    ? ROUTES.HISTORY 
                    : item.name === 'Compare'
                      ? '/compare'
                      : item.name === 'Players' 
                        ? '/players' 
                        : item.name === 'Reports'
                          ? '/reports'
                          : item.name === 'AI Insights'
                            ? '/ai-insights'
                            : item.name === 'Conditioning'
                              ? '/conditioning'
                            : item.name === 'Feedback'
                              ? '/feedback'
                              : item.name === 'Academy'
                                ? '/academy'
                                : item.name === 'Calendar'
                                  ? '/calendar'
                                  : item.name === 'Settings'
                                    ? '/settings'
                                    : '#'
              }
              className={`nav-link-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                background: isActive ? '#09111e' : 'transparent',
                border: isActive ? '1px solid #111c2e' : '1px solid transparent',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} style={{ 
                flexShrink: 0, 
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'
              }} />
              <span
                style={{
                  transition: 'var(--transition-smooth)',
                  opacity: sidebarOpen ? 1 : 0,
                  width: sidebarOpen ? 'auto' : 0,
                }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Premium Pro Plan Card & Footer */}
      {sidebarOpen && (
        <div style={{ padding: '0 16px 16px' }}>
          <div
            style={{
              background: '#090e17',
              border: '1px solid #111c2e',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '6px', borderRadius: '8px' }}>
                <Crown size={16} color="#f59e0b" />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6', display: 'block' }}>Pro Plan</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Renews on 12 Aug, 2024</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <span>7.8 GB / 20 GB Used</span>
              </div>
              <div style={{ height: '5px', background: '#111c2e', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '39%', height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }}></div>
              </div>
            </div>

            <button
              style={{
                background: 'transparent',
                border: '1px solid #111c2e',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#111c2e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}

      {/* Footer Support Link */}
      <div
        className="sidebar-footer"
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #111c2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          gap: '8px'
        }}
      >
        {sidebarOpen && (
          <Link
            href="/help"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={16} color="var(--color-text-secondary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Need Help?</span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          id="btn-toggle-sidebar"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid #111c2e',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
            transition: 'var(--transition-smooth)',
          }}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
    </aside>
  );
};
