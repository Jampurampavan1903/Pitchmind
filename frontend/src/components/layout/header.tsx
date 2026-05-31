'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useUiStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';
import { ROUTES } from '../../lib/constants';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useUiStore();
  const { profile, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fullName = profile?.full_name || 'Coach Arjun';
  const roleName = profile?.role 
    ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')) 
    : 'Head Coach';

  // Generate initials
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CA';

  return (
    <header
      style={{
        height: '80px',
        borderBottom: '1px solid #111c2e',
        padding: '0 var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-header)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left side: Hamburger toggle + Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, maxWidth: '500px' }}>
        <button
          onClick={toggleSidebar}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={20} />
        </button>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#090e17',
            border: '1px solid #111c2e',
            borderRadius: '20px',
            padding: '8px 16px',
            width: '100%',
            maxWidth: '320px',
          }}
        >
          <Search size={16} color="var(--color-text-secondary)" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/history?search=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery('');
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
              width: '100%',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>
      </div>

      {/* Right side: Global Actions, Bell Notifications & Profile card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Search helper icon */}
        <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex' }}>
          <Search size={20} />
        </button>

        {/* Notification Bell with red badge */}
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Bell size={20} color="var(--color-text-secondary)" />
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: 'var(--color-danger)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-background)'
            }}
          >
            3
          </div>
        </div>

        {/* Profile Card */}
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'var(--transition-smooth)',
            position: 'relative'
          }}
        >
          {/* User Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={fullName} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              initials
            )}
          </div>
          
          {/* User Meta */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6', lineHeight: '1.2' }}>{fullName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: '1' }}>{roleName}</span>
          </div>

          <ChevronDown size={14} color="var(--color-text-secondary)" style={{ marginLeft: '2px' }} />

          {/* Floating Dropdown Menu */}
          {dropdownOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '160px',
                background: '#090e17',
                border: '1px solid #111c2e',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 100
              }}
            >
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-danger)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 23, 68, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
