'use client';

import React, { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useUiStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';
import { AuthGate } from '../ui/auth-gate';

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  const { sidebarOpen } = useUiStore();
  const { isAuthenticated, initializeSession, isLoading } = useAuthStore();

  // Initialize cached session from local storage on first mount
  useEffect(() => {
    initializeSession();
  }, []);

  // If loading session, show a cinematic blank loader screen
  if (isLoading && !isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-background)', color: 'var(--color-text-secondary)' }}>
        Restoring PitchMind session...
      </div>
    );
  }

  // Lock pages and display AuthGate if user is not authenticated
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
      }}
    >
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? '260px' : '80px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // Enforces flex container shrinking behavior on overflow
          transition: 'var(--transition-smooth)',
        }}
      >
        <Header />
        
        <main
          style={{
            flex: 1,
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-lg)',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
export default PageContainer;
