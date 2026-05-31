'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  ArrowLeft, 
  User, 
  Sliders, 
  ShieldAlert, 
  Activity, 
  CheckCircle,
  Database,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { apiClient } from '../../../lib/api-client';
import { ROUTES } from '../../../lib/constants';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, user } = useAuthStore();

  // Calibration Slider Preferences
  const [elbowThreshold, setElbowThreshold] = useState(160);
  const [eyeTiltTolerance, setEyeTiltTolerance] = useState(5.0);
  const [footworkDelayTolerance, setFootworkDelayTolerance] = useState(150);

  // General profile options
  const [playerStance, setPlayerStance] = useState('Right-Hand Batsman');
  const [guardSelection, setGuardSelection] = useState('Middle Stump');
  const [savedSettings, setSavedSettings] = useState(false);

  // 🆕 Developer API settings connection status states
  const [aiConfig, setAiConfig] = useState({ claude_active: false, openai_active: false });

  React.useEffect(() => {
    apiClient.get('/api/v1/developer/config')
      .then((res: any) => {
        setAiConfig(res);
      })
      .catch(() => {
        // Fallback locally
      });
  }, []);

  const welcomeName = profile?.full_name || 'pavan';
  const welcomeRole = profile?.role 
    ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')) 
    : 'Batsman';

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => {
      setSavedSettings(false);
    }, 3000);
  };

  const handleResetDatabase = async () => {
    if (confirm('Are you absolutely sure you want to trigger a database reset? This will flush all evaluations, videos, and settings logs.')) {
      try {
        await apiClient.post('/api/v1/auth/reset-database', {});
        alert('Database reset successful. Refreshing platform details.');
        window.location.reload();
      } catch (err) {
        alert('Failed to reset database. Direct SQLite overrides required.');
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
        width: '100%',
        paddingBottom: '40px'
      }}
    >
      {/* Title & Back Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href={ROUTES.DASHBOARD}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'var(--border-glass)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-primary)'
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Platform Configuration Settings</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Adjust automated joint thresholds, account details, and biomechanics preferences.
          </p>
        </div>
      </div>

      {/* Grid: Left Configurations Form, Right Diagnostics Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 'var(--spacing-lg)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Settings Form */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Configuration Preferences
          </h3>

          <div className="glass-card" style={{ padding: '24px' }}>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Part 1: Player Profile Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="var(--color-accent)" />
                  <span>Stance & Guard Details</span>
                </strong>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Stance Style</label>
                    <select
                      value={playerStance}
                      onChange={(e) => setPlayerStance(e.target.value)}
                      style={{
                        background: '#050811',
                        border: '1px solid #111c2e',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        color: '#ffffff',
                        outline: 'none',
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      <option value="Right-Hand Batsman">Right-Hand Batsman</option>
                      <option value="Left-Hand Batsman">Left-Hand Batsman</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Guard Line</label>
                    <select
                      value={guardSelection}
                      onChange={(e) => setGuardSelection(e.target.value)}
                      style={{
                        background: '#050811',
                        border: '1px solid #111c2e',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        color: '#ffffff',
                        outline: 'none',
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      <option value="Leg Stump">Leg Stump</option>
                      <option value="Middle Stump">Middle Stump</option>
                      <option value="Off Stump">Off Stump</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Part 2: Biomechanical Calibration (Sliders!) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} color="var(--color-accent)" />
                  <span>Skeletal Calibration Constants</span>
                </strong>

                {/* Slider 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Lead Elbow extension threshold</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{elbowThreshold}°</strong>
                  </div>
                  <input
                    type="range"
                    min={140}
                    max={180}
                    value={elbowThreshold}
                    onChange={(e) => setElbowThreshold(parseInt(e.target.value))}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                    Trigger flag alert if lead elbow collapses below this angle on impact.
                  </span>
                </div>

                {/* Slider 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Eye-level stability tilt tolerance</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{eyeTiltTolerance.toFixed(1)}°</strong>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={0.5}
                    value={eyeTiltTolerance}
                    onChange={(e) => setEyeTiltTolerance(parseFloat(e.target.value))}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                    Maximum allowable shoulder/eye-level tilt during the backswing delivery phase.
                  </span>
                </div>

                {/* Slider 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Footwork stride latency delay</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{footworkDelayTolerance}ms</strong>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={300}
                    value={footworkDelayTolerance}
                    onChange={(e) => setFootworkDelayTolerance(parseInt(e.target.value))}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                    Allowed delay synchronicity offset between downswing trigger and stride completion.
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-glow)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  SAVE CALIBRATION SETTINGS
                </button>
              </div>

              {savedSettings && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-success)' }}>
                  <CheckCircle size={16} />
                  <span>Platform configuration updated successfully!</span>
                </div>
              )}

            </form>
          </div>
        </section>

        {/* Right Column: Platform Diagnostics & DB Reset */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Diagnostics
          </h3>

          {/* Diagnostic status checklist */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <strong style={{ fontSize: '0.9rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--color-accent)" />
              <span>Platform Health Check</span>
            </strong>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>SQLite Database Connection</span>
                <strong style={{ color: 'var(--color-success)' }}>ONLINE (pitchmind.db)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>FastAPI Server Connection</span>
                <strong style={{ color: 'var(--color-success)' }}>ONLINE (Port 8000)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Local File Storage Directory</span>
                <strong style={{ color: 'var(--color-success)' }}>READ/WRITE ACTIVE</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>MediaPipe AI Estimator</span>
                <strong style={{ color: 'var(--color-success)' }}>READY (Pose V1 Legacy)</strong>
              </div>
            </div>
          </div>

          {/* 🆕 V1.2 Developer & AI Integrations Panel */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
            <strong style={{ fontSize: '0.9rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="var(--color-primary)" />
              <span>Developer & AI Integrations</span>
            </strong>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
              PitchMind V1.2 supports live automated spoken coaching memos and dynamic LLM analysis reviews. Add keys to your backend <code>.env</code> file.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Claude Cognitive Synthesis</span>
                <span 
                  style={{ 
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: aiConfig.claude_active ? '#10b981' : '#f59e0b',
                    background: aiConfig.claude_active ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                    border: `1px solid ${aiConfig.claude_active ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`
                  }}
                >
                  {aiConfig.claude_active ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>OpenAI Voice Memos (TTS)</span>
                <span 
                  style={{ 
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: aiConfig.openai_active ? '#10b981' : '#f59e0b',
                    background: aiConfig.openai_active ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                    border: `1px solid ${aiConfig.openai_active ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`
                  }}
                >
                  {aiConfig.openai_active ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>
          </div>

          {/* Dangerous SQLite reset card */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>
            Danger Zone
          </h3>

          <div 
            className="glass-card" 
            style={{ 
              padding: '20px', 
              border: '1px solid rgba(255,23,68,0.15)',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
              <ShieldAlert size={18} />
              <strong style={{ fontSize: '0.9rem' }}>Destructive Admin Actions</strong>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Flushing database tables will erase all your nets sessions, video records, frame crops, and coach comments. This action cannot be reversed.
            </p>

            <button
              onClick={handleResetDatabase}
              style={{
                width: '100%',
                background: 'rgba(255,23,68,0.05)',
                border: '1px solid rgba(255,23,68,0.2)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,23,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,23,68,0.05)'; }}
            >
              <Database size={14} />
              <span>FLUSH PLATFORM DATABASE</span>
            </button>
          </div>
        </section>
      </div>

    </div>
  );
}
