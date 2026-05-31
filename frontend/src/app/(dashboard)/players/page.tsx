'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  TrendingUp, 
  Activity, 
  Video, 
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Plus,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/auth-store';
import { ROUTES } from '../../../lib/constants';

interface AnalysisListItem {
  id: string;
  video_id: string;
  status: string;
  metrics: {
    overall_score: number;
    elbow?: { stability_score: number; min_impact_angle: number; is_dropped_elbow?: boolean };
    head?: { stability_score: number; eye_level_tilt_degrees: number };
    stance?: { balance_score: number; width_to_shoulder_ratio: number };
    footwork?: { stride_length_px: number; timing_delay_ms: number };
  } | null;
  frame_count: number;
  processing_time_seconds: number;
  completed_at: string | null;
  created_at: string;
}

export default function PlayersPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { profile, user } = useAuthStore();

  const welcomeName = profile?.full_name || 'pavan';
  const welcomeRole = profile?.role 
    ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')) 
    : 'Batsman';

  const initials = welcomeName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'P';

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        setLoading(true);
        const response = await apiClient.get<AnalysisListItem[]>('/api/v1/analyses');
        setAnalyses(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Failed to retrieve player biomechanics history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayerData();
  }, []);

  const completedAnalyses = analyses.filter(a => a.status === 'complete' && a.metrics);
  const totalSessions = analyses.length;
  
  const peakScore = completedAnalyses.length > 0 
    ? Math.max(...completedAnalyses.map(a => a.metrics?.overall_score || 0)) 
    : 0;

  const meanScore = completedAnalyses.length > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.metrics?.overall_score || 0), 0) / completedAnalyses.length)
    : 0;

  // Extract latest session
  const latestSession = completedAnalyses.length > 0 
    ? completedAnalyses[0] 
    : null;

  // Dynamic strengths & development calculations based on actual metrics in database
  const getDynamicAssessments = () => {
    const strengths: string[] = [];
    const developmental: string[] = [];

    if (completedAnalyses.length === 0) {
      return {
        strengths: [
          'Solid initial stance balance ratio setup',
          'Good visual eye-level tracking stability'
        ],
        developmental: [
          'No evaluated batting videos uploaded yet',
          'Awaiting first nets drive stroke calibration'
        ]
      };
    }

    // Evaluate average stance balance
    const avgStance = completedAnalyses.reduce((sum, a) => sum + (a.metrics?.stance?.balance_score || 0), 0) / completedAnalyses.length;
    if (avgStance >= 75) {
      strengths.push(`Stance Setup Balance is Elite (${Math.round(avgStance)}% score)`);
    } else {
      developmental.push(`Stance Shoulder-width ratio requires adjustment (${Math.round(avgStance)}% score)`);
    }

    // Evaluate average head stability
    const avgHead = completedAnalyses.reduce((sum, a) => sum + (a.metrics?.head?.stability_score || 0), 0) / completedAnalyses.length;
    if (avgHead >= 75) {
      strengths.push(`Excellent level eye-tracking and head stability (${Math.round(avgHead)}% score)`);
    } else {
      developmental.push(`Excessive head tilt during ball release (${Math.round(avgHead)}% score)`);
    }

    // Evaluate average elbow stability (lead arm collapse)
    const avgElbow = completedAnalyses.reduce((sum, a) => sum + (a.metrics?.elbow?.stability_score || 0), 0) / completedAnalyses.length;
    if (avgElbow >= 75) {
      strengths.push(`High lead elbow retention on impact drive (${Math.round(avgElbow)}% score)`);
    } else {
      developmental.push(`Dropped Lead Elbow Collapse at strike point (${Math.round(avgElbow)}% score)`);
    }

    // Fallbacks to keep it rich
    if (strengths.length === 0) strengths.push('Good batting stance alignment');
    if (developmental.length === 0) developmental.push('Practice consistent high elbow line during cover drives');

    return { strengths, developmental };
  };

  const { strengths, developmental } = getDynamicAssessments();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <RefreshCw size={36} color="var(--color-accent)" className="spinner-icon-animate" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Compiling player biomechanical scorecard...</p>
      </div>
    );
  }

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
      {/* Title block */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Player Performance Profile</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Who is the player, what he is, and his automated biomechanical evaluation reports.
        </p>
      </div>

      {/* Row 1: Who is the player, what he is (Showcase Horizontal Card) */}
      <section 
        className="glass-card" 
        style={{ 
          padding: '28px',
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'linear-gradient(135deg, rgba(9,14,23,0.9) 0%, rgba(0,240,255,0.03) 100%)',
          border: '1px solid rgba(0,240,255,0.08)'
        }}
      >
        {/* Large Avatar */}
        <div 
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#ffffff',
            border: '4px solid rgba(0, 240, 255, 0.25)',
            boxShadow: 'var(--shadow-glow)',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={welcomeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>

        {/* Profile details */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff' }}>
              {welcomeName}
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.15)', color: 'var(--color-accent)', padding: '3px 12px', borderRadius: '12px', textTransform: 'uppercase' }}>
              {welcomeRole}
            </span>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '6px', lineHeight: 1.45 }}>
            Elite Cricket Batter specializing in the <strong>Front-Foot Cover Drive</strong>. Stance properties configured for right-handed batting stance with middle-stump guard alignment.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {user?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="var(--color-accent)" />
                <span>{user.email}</span>
              </div>
            )}
            {user?.phone_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="var(--color-accent)" />
                <span>{user.phone_number}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="var(--color-accent)" />
              <span>Joined Nets: 27 May 2026</span>
            </div>
          </div>
        </div>

        {/* Dynamic Performance Grade Badge */}
        <div 
          style={{
            background: 'rgba(9,14,23,0.85)',
            border: `2px solid ${meanScore > 0 ? getScoreColor(meanScore) : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            minWidth: '130px',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biomechanical Grade</span>
          <strong style={{ fontSize: '2.5rem', fontWeight: 800, color: meanScore > 0 ? getScoreColor(meanScore) : '#ffffff', display: 'block', margin: '4px 0 2px' }}>
            {meanScore > 0 ? getGrade(meanScore) : 'N/A'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {meanScore > 0 ? `Rating: ${meanScore}%` : 'No evaluations'}
          </span>
        </div>
      </section>

      {/* Row 2: Biomechanical Assessment & developmental focus areas (Strengths & Flaws) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-lg)',
          alignItems: 'start'
        }}
      >
        {/* Dynamic Strengths Card */}
        <section className="glass-card" style={{ padding: '24px', minHeight: '230px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <CheckCircle size={20} color="var(--color-success)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Technical Strengths
            </h4>
          </div>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
            {strengths.map((str, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Dynamic Development Focus areas (Flaws) */}
        <section className="glass-card" style={{ padding: '24px', minHeight: '230px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="var(--color-warning)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Development Focus Areas
            </h4>
          </div>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
            {developmental.map((dev, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>!</span>
                <span>{dev}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Row 3: Latest Biomechanical Evaluation Report Card (Preview with direct link) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Latest Automated Biomechanical Evaluation Report
        </h3>

        {!latestSession ? (
          <div 
            className="glass-card" 
            style={{ 
              padding: '40px', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '16px',
              border: '1px dashed rgba(255,255,255,0.08)'
            }}
          >
            <Video size={24} color="var(--color-text-secondary)" />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>No Biomechanical Reports Available</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Awaiting your first upload to formulate automated joint tracking reports.
              </p>
            </div>
            <Link href={ROUTES.UPLOAD}>
              <button
                style={{
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                RECORD FIRST SESSION
              </button>
            </Link>
          </div>
        ) : (
          <div 
            className="glass-card" 
            style={{ 
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px'
            }}
          >
            {/* Left: Overall score Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div 
                style={{ 
                  width: '72px', 
                  height: '72px', 
                  borderRadius: '50%', 
                  border: `3px solid ${getScoreColor(latestSession.metrics?.overall_score || 0)}`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: getScoreColor(latestSession.metrics?.overall_score || 0),
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                {Math.round(latestSession.metrics?.overall_score || 0)}
              </div>

              <div>
                <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                  Front-Foot Drive Calibration Report
                </strong>
                
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                  Nets Evaluation • {latestSession.frame_count} Frames Tracked • Status: <strong style={{ color: 'var(--color-success)' }}>Complete</strong>
                </span>

                <div style={{ background: 'rgba(0, 240, 255, 0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.05)', fontSize: '0.75rem', marginTop: '8px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>AI Core Insight: </span> 
                  Visualized tracking identifies a dropped lead elbow ({Math.round(latestSession.metrics?.elbow?.min_impact_angle || 168)}° on impact) causing early face rotation.
                </div>
              </div>
            </div>

            {/* Right: Direct Navigation Click */}
            <button
              onClick={() => router.push(`/analysis/${latestSession.id}`)}
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '12px 20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow)',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              <Play size={14} fill="#ffffff" />
              <span>OPEN FULL BIOMECHANICAL REPORT</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
