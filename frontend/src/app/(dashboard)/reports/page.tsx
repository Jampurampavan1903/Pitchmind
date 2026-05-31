'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Award, 
  Activity, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Video,
  Printer
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { ROUTES } from '../../../lib/constants';

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
  frame_count: number;
  processing_time_seconds: number;
  completed_at: string | null;
  created_at: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const response = await apiClient.get<AnalysisListItem[]>('/api/v1/analyses');
        const list = Array.isArray(response) ? response : [];
        // Only show completed analyses with calculated metrics in reports section
        const completed = list.filter(a => a.status === 'complete' && a.metrics);
        setReports(completed);
      } catch (err) {
        console.error('Failed to retrieve performance reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <RefreshCw size={36} color="var(--color-accent)" className="spinner-icon-animate" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Compiling performance history logs...</p>
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
      {/* Title & Back link */}
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Biomechanical Evaluation Reports</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Structured biomechanical session slots chronologically tracked by date.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        /* Empty reports list state */
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
            <FileText size={28} color="var(--color-accent)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>No Biomechanical Reports Registered</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0', lineHeight: 1.5 }}>
              You don't have any completed drive evaluation slots. Upload batting videos to trigger skeletal calibrations and build your printable report list.
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
              RECORD FIRST NET SESSION
            </button>
          </Link>
        </div>
      ) : (
        /* Chronicled reports timeline slots */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reports.map((report, index) => {
            const score = report.metrics?.overall_score || 0;
            const completedDate = report.completed_at || report.created_at
              ? new Date(report.completed_at || report.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Today';
              
            const completedTime = report.completed_at || report.created_at
              ? new Date(report.completed_at || report.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
              : '';

            return (
              <div 
                key={report.id}
                className="glass-card"
                style={{ 
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  position: 'relative'
                }}
              >
                {/* Slot Date Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(0, 240, 255, 0.06)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.12)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--color-accent)" />
                      <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>{completedDate}</strong>
                    </div>
                    {completedTime && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {completedTime}
                      </span>
                    )}
                  </div>
                  
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Slot ID: PM-{report.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Body Row (Overall score, brief metrics, button layout) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                  
                  {/* Score badge & Name details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: '280px' }}>
                    <div 
                      style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%', 
                        border: `3px solid ${getScoreColor(score)}`,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: getScoreColor(score),
                        boxShadow: `0 0 10px rgba(${score >= 80 ? '0,230,118' : score >= 60 ? '255,214,0' : '255,23,68'}, 0.25)`,
                        flexShrink: 0
                      }}
                    >
                      {Math.round(score)}
                    </div>
                    
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                        Front-Foot Batting Drive Evaluation
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Drive score: <strong style={{ color: getScoreColor(score) }}>{Math.round(score)}%</strong> • {report.frame_count} frames evaluated • Completed in {(report.processing_time_seconds || 1.45).toFixed(2)}s
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Metrics Highlights */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    <div style={{ borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}>
                      <span>HEAD STABILITY</span>
                      <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.85rem', marginTop: '2px' }}>
                        {report.metrics?.head?.stability_score || 0}%
                      </strong>
                    </div>
                    <div style={{ borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}>
                      <span>ELBOW STABILITY</span>
                      <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.85rem', marginTop: '2px' }}>
                        {report.metrics?.elbow?.stability_score || 0}%
                      </strong>
                    </div>
                    <div style={{ borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}>
                      <span>STANCE BALANCE</span>
                      <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.85rem', marginTop: '2px' }}>
                        {report.metrics?.stance?.balance_score || 0}%
                      </strong>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {/* View overlay */}
                    <button
                      onClick={() => router.push(`/analysis/${report.id}`)}
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '10px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-glow)'
                      }}
                    >
                      <Activity size={14} />
                      <span>OPEN REPORT</span>
                    </button>
                    
                    {/* Direct Print */}
                    <button
                      onClick={() => {
                        // Quick redirection and print invocation helper
                        router.push(`/analysis/${report.id}`);
                        setTimeout(() => {
                          window.print();
                        }, 800);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: 'var(--border-glass)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Quick Print Report"
                    >
                      <Printer size={14} />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
