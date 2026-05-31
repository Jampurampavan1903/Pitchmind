'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowLeft, 
  Calendar, 
  Award, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Target, 
  Play, 
  RefreshCw,
  TrendingUp,
  Brain
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { ROUTES } from '../../../lib/constants';

interface CoachingInsight {
  category: string;
  severity: string;
  title: string;
  message: string;
  recommendation: string;
}

interface AnalysisListItem {
  id: string;
  video_id: string;
  status: string;
  metrics: {
    overall_score: number;
    elbow?: { stability_score: number; min_impact_angle: number };
    head?: { stability_score: number; eye_level_tilt_degrees: number };
    stance?: { balance_score: number; width_to_shoulder_ratio: number };
    footwork?: { stride_length_px: number; timing_delay_ms: number };
  } | null;
  coaching: CoachingInsight[] | null;
  frame_count: number;
  completed_at: string | null;
  created_at: string;
}

interface FlattenedInsight extends CoachingInsight {
  sessionId: string;
  sessionDate: string;
  overallScore: number;
}

export default function AiInsightsPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAiInsights() {
      try {
        setLoading(true);
        const response = await apiClient.get<AnalysisListItem[]>('/api/v1/analyses');
        setAnalyses(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Failed to retrieve player evaluations for AI logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAiInsights();
  }, []);

  const completedAnalyses = analyses.filter(a => a.status === 'complete' && a.metrics);
  
  // Flatten coaching insights across all sessions for chronological feed
  const allInsights: FlattenedInsight[] = [];
  completedAnalyses.forEach(session => {
    const sessionDate = session.completed_at || session.created_at
      ? new Date(session.completed_at || session.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : 'Recent nets';

    if (session.coaching && Array.isArray(session.coaching)) {
      session.coaching.forEach(insight => {
        allInsights.push({
          ...insight,
          sessionId: session.id,
          sessionDate,
          overallScore: session.metrics?.overall_score || 0
        });
      });
    }
  });

  // Dynamic Trajectory summary values
  const totalCompleted = completedAnalyses.length;
  
  const avgOverall = totalCompleted > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.metrics?.overall_score || 0), 0) / totalCompleted)
    : 0;

  const avgElbow = totalCompleted > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.metrics?.elbow?.stability_score || 0), 0) / totalCompleted)
    : 0;

  const avgHead = totalCompleted > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.metrics?.head?.stability_score || 0), 0) / totalCompleted)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getSeverityColor = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('danger') || s.includes('high')) return 'var(--color-danger)';
    if (s.includes('warning') || s.includes('medium')) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const getSeverityBg = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('danger') || s.includes('high')) return 'rgba(255,23,68,0.06)';
    if (s.includes('warning') || s.includes('medium')) return 'rgba(255,214,0,0.06)';
    return 'rgba(16,185,129,0.06)';
  };

  const getSeverityBorder = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('danger') || s.includes('high')) return 'rgba(255,23,68,0.12)';
    if (s.includes('warning') || s.includes('medium')) return 'rgba(255,214,0,0.12)';
    return 'rgba(16,185,129,0.12)';
  };

  const getSeverityIcon = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('danger') || s.includes('high')) return <ShieldAlert size={16} color="var(--color-danger)" />;
    if (s.includes('warning') || s.includes('medium')) return <AlertTriangle size={16} color="var(--color-warning)" />;
    return <CheckCircle2 size={16} color="var(--color-success)" />;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <RefreshCw size={36} color="var(--color-accent)" className="spinner-icon-animate" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Aligning intelligence models...</p>
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
      {/* Title & Navigation */}
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>AI Biomechanical Insights Feed</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Generative coaching diagnostics compiled from skeletal nets tracking data.
          </p>
        </div>
      </div>

      {allInsights.length === 0 ? (
        /* Empty insights state */
        <div 
          className="glass-card" 
          style={{ 
            padding: '48px', 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '20px',
            border: '1px dashed rgba(255,255,255,0.08)'
          }}
        >
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(0,240,255,0.04)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid rgba(0,240,255,0.1)' 
            }}
          >
            <Sparkles size={28} color="var(--color-accent)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Awaiting Net Sessions Calibrations</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0', lineHeight: 1.5 }}>
              AI insights are automatically generated following batting video uploads. Run OpenCV skeletal breakdowns to form generative drills and tactical reviews.
            </p>
          </div>
          <Link href={ROUTES.UPLOAD}>
            <button
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '10px 20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              UPLOAD BATTING VIDEO
            </button>
          </Link>
        </div>
      ) : (
        /* 2-Column Split: Unified summary trajectory on the left, individual feed on the right */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.6fr',
            gap: 'var(--spacing-lg)',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Aggregated AI Trajectory Report */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cumulative AI Summary Report
            </h3>

            <div 
              className="glass-card" 
              style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, rgba(9,14,23,0.9) 0%, rgba(16,185,129,0.02) 100%)',
                border: '1px solid rgba(16,185,129,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Brain size={24} color="var(--color-primary)" />
                <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>Coaching Intelligence Report</strong>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, textAlign: 'justify' }}>
                Based on {totalCompleted} completed evaluations, pavan maintains stable stance coordinates and level eye tracking ({avgHead}% average stability rating). However, overall drive scores (averaging {avgOverall}%) remain bottlenecked by lead elbow collapses ({avgElbow}% average elbow extension). Restoring cover drive control requires integrating active armpit constraint drills in subsequent net runs.
              </p>

              {/* Dynamic trajectory scores */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>CUMULATIVE METRICS PERFORMANCE</span>
                
                {/* Score 1 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span>Average Head stability</span>
                    <strong style={{ color: getScoreColor(avgHead) }}>{avgHead}%</strong>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.02)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${avgHead}%`, height: '100%', background: getScoreColor(avgHead) }} />
                  </div>
                </div>

                {/* Score 2 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span>Average Elbow Extension</span>
                    <strong style={{ color: getScoreColor(avgElbow) }}>{avgElbow}%</strong>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.02)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${avgElbow}%`, height: '100%', background: getScoreColor(avgElbow) }} />
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(0, 240, 255, 0.03)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.05)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                🎯 **Tactical Recommendation:** Prioritize maintaining high elbow positions in nets next session to break past the B grade ratings ceiling.
              </div>

            </div>
          </div>

          {/* Right Column: AI Coaching Insights Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Chronological Diagnostics Feed
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                {allInsights.length} Insights Compiled
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {allInsights.map((insight, idx) => {
                const badgeColor = getSeverityColor(insight.severity);
                const badgeBg = getSeverityBg(insight.severity);
                const badgeBorder = getSeverityBorder(insight.severity);

                return (
                  <div 
                    key={idx}
                    className="glass-card"
                    style={{ 
                      padding: '20px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px',
                      borderLeft: `4px solid ${badgeColor}`,
                      background: 'rgba(255,255,255,0.01)'
                    }}
                  >
                    {/* Header: Title & Severity badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block' }}>
                          {insight.title}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                          Generated on {insight.sessionDate} • Overall rating: {insight.overallScore}%
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: badgeBg, border: `1px solid ${badgeBorder}`, padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: badgeColor }}>
                        {getSeverityIcon(insight.severity)}
                        <span>{insight.severity}</span>
                      </div>
                    </div>

                    {/* Explanatory Message */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      {insight.message}
                    </p>

                    {/* Prescribed coaching drill */}
                    {insight.recommendation && (
                      <div style={{ background: 'rgba(0, 240, 255, 0.03)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.05)', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Target size={16} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: 'var(--color-accent)', display: 'block', marginBottom: '2px' }}>Actionable Coaching Drill</strong>
                          <span style={{ color: 'var(--color-text-primary)' }}>{insight.recommendation}</span>
                        </div>
                      </div>
                    )}

                    {/* Link to Session reports details */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                      <button
                        onClick={() => router.push(`/analysis/${insight.sessionId}`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>INSPECT SKELETAL CANVAS</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
