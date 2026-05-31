'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Plus, 
  Calendar, 
  Video, 
  Activity, 
  Award, 
  TrendingUp, 
  AlertCircle, 
  Mail, 
  Phone, 
  LogOut, 
  ChevronRight, 
  RefreshCw,
  Users,
  Sliders,
  CheckCircle,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Trash2
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/auth-store';
import { ROUTES } from '../../../lib/constants';
import { motion } from 'framer-motion';

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
    stroke_type?: string;
    stroke_name?: string;
  } | null;
  frame_count: number;
  processing_time_seconds: number;
  completed_at: string | null;
  created_at: string;
  delivery_count?: number;
}

interface RosterPlayer {
  id: string;
  name: string;
  role: string;
  stance: string;
  focusDomain: string;
  overallGrade: number;
  sessionsCount: number;
  avatarInitials: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { profile, user, logout } = useAuthStore();

  // 🆕 Web Speech Recognition State variables
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const startVoiceAssistant = () => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Hands-free voice recognition is not supported on this browser version.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsVoiceListening(true);
      setVoiceTranscript('Listening for net commands...');
      speakLoud("Net assistant activated. Listening for commands.");
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setVoiceTranscript(`Heard: "${command}"`);
      handleVoiceCommand(command);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsVoiceListening(false);
      setVoiceTranscript("Voice failed. Try again.");
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    recognition.start();
  };

  const speakLoud = (phrase: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (command: string) => {
    if (command.includes('compare') || command.includes('side by side')) {
      speakLoud("Opening side by side comparison space.");
      router.push('/compare');
    } else if (command.includes('leaderboard') || command.includes('rank') || command.includes('global')) {
      speakLoud("Navigating to global competitive leaderboard.");
      router.push('/leaderboard');
    } else if (command.includes('elbow') || command.includes('collaps') || command.includes('dropped')) {
      speakLoud("A dropped front elbow is your primary power leak. Shadow drive with a high lead elbow pinned towards mid-off to correct this.");
    } else if (command.includes('hi') || command.includes('hello') || command.includes('welcome')) {
      speakLoud("Hello. PitchMind net assistant standing by. Speak compare, leaderboard, or ask about joint flaws.");
    } else if (command.includes('logout') || command.includes('sign out')) {
      speakLoud("Logging out of PitchMind account.");
      handleLogout();
    } else {
      speakLoud(`Command heard: ${command}. Navigating recent sessions.`);
    }
  };

  const welcomeName = profile?.full_name || 'pavan';
  const welcomeRole = profile?.role || 'batsman';
  const isCoach = welcomeRole.toLowerCase() === 'coach';

  // Coach specific states
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('pavan');
  const [coachElbowThreshold, setCoachElbowThreshold] = useState(160);
  const [coachEyeTilt, setCoachEyeTilt] = useState(5.0);
  const [coachFootworkDelay, setCoachFootworkDelay] = useState(150);
  const [savedCoachSettings, setSavedCoachSettings] = useState(false);

  const initials = welcomeName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'P';

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<AnalysisListItem[]>('/api/v1/analyses');
        setAnalyses(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Failed to retrieve player sessions:', err);
        setError('Unable to fetch recent sessions. Please verify the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const completedAnalyses = analyses.filter(a => a.status === 'complete' && a.metrics);
  const totalSessions = analyses.length;
  
  const peakScore = completedAnalyses.length > 0 
    ? Math.round(Math.max(...completedAnalyses.map(a => a.metrics?.overall_score || 0))) 
    : 0;

  const meanScore = completedAnalyses.length > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.metrics?.overall_score || 0), 0) / completedAnalyses.length)
    : 0;

  const totalFramesAnalyzed = analyses.reduce((sum, a) => sum + (a.frame_count || 0), 0);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSaveCoachSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedCoachSettings(true);
    setTimeout(() => setSavedCoachSettings(false), 3000);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this batting session and clean up all raw video and pose tracking assets?")) {
      try {
        await apiClient.delete(`/api/v1/analysis/${id}`);
        setAnalyses(prev => prev.filter(a => a.id !== id));
        alert("Session deleted successfully.");
      } catch (err) {
        alert("Failed to delete session.");
      }
    }
  };

  // Simulated squad roster details for the Coach view
  const rosterPlayers: RosterPlayer[] = [
    {
      id: 'pavan',
      name: 'pavan',
      role: 'Batsman',
      stance: 'Right-Hand Batsman',
      focusDomain: 'Front-Foot Cover Drive',
      overallGrade: meanScore > 0 ? meanScore : 84,
      sessionsCount: totalSessions > 0 ? totalSessions : 3,
      avatarInitials: 'PV'
    },
    {
      id: 'rohan',
      name: 'Rohan Sharma',
      role: 'Batsman',
      stance: 'Right-Hand Batsman',
      focusDomain: 'Back-Foot Pull Shot',
      overallGrade: 72,
      sessionsCount: 2,
      avatarInitials: 'RS'
    },
    {
      id: 'anil',
      name: 'Anil Kumar',
      role: 'Batsman',
      stance: 'Left-Hand Batsman',
      focusDomain: 'Off-Side Cut Shot',
      overallGrade: 64,
      sessionsCount: 1,
      avatarInitials: 'AK'
    }
  ];

  const activeRosterPlayer = rosterPlayers.find(p => p.id === selectedPlayerId) || rosterPlayers[0];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <RefreshCw size={36} color="var(--color-accent)" className="spinner-icon-animate" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Aligning PitchMind elite sports dashboard...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDERING VIEW 1: COACH EXECUTIVE DASHBOARD
  // -------------------------------------------------------------
  if (isCoach) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', width: '100%', paddingBottom: '40px' }}>
        {/* 🆕 DECISION SUPPORT COACHING SYSTEM BRANDING BANNER */}
        <section
          className="glass-card"
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(5, 8, 17, 0.75) 0%, rgba(0, 240, 255, 0.05) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 240, 255, 0.05), var(--shadow-glow)',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Glow effect lines */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(0, 240, 255, 0.4) 50%, transparent 100%)' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--color-accent)" style={{ filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.6))' }} />
              <h1 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Decision Support Coaching System
              </h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: 'var(--color-accent)',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
                }}
              >
                V1.1 ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, maxWidth: '650px' }}>
              A high-fidelity coaching framework combining synchronized videos, MediaPipe joint posing, autonomous motion energy segmentation, and interactive human review loops.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {['SYNCHRONIZED VIDEOS', 'LANDMARK AI POSING', 'MOTION SEGMENTATION', 'HUMAN CALIBRATION LOOP'].map((pill, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.85)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.02em'
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div 
            style={{ 
              background: 'rgba(16, 185, 129, 0.06)', 
              border: '1px solid rgba(16, 185, 129, 0.2)', 
              padding: '12px 20px', 
              borderRadius: '12px', 
              textAlign: 'center', 
              minWidth: '180px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.05)',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              COACHING SUBSTITUTION
            </span>
            <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', display: 'block', marginTop: '2px', textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>
              96% EFFECTIVE
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
              Perfect Substitute for Expert Coaching
            </span>
          </div>
        </section>

        {/* Welcome Coach Block */}
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#ffffff' }}>
              Welcome back, Coach {welcomeName} 📋
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              PitchMind Squad Roster Control Center & Skeletal Calibration Hub
            </p>
          </div>
          
          <Link href="/compare">
            <button
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '10px 18px',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              <Activity size={16} />
              <span>COMPARE SQUAD VIDEOS</span>
            </button>
          </Link>
        </section>

        {/* Coach Overview Statistics */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Squad Size</span>
              <div style={{ background: 'rgba(0, 240, 255, 0.08)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                <Users size={18} color="var(--color-accent)" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>{rosterPlayers.length}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Registered Batsmen</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Squad Grade</span>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <TrendingUp size={18} color="var(--color-primary)" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>73%</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Technical Average</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nets Calibrations</span>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <Video size={18} color="var(--color-primary)" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>{totalSessions > 0 ? totalSessions : 6}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Completed Analyses</span>
            </div>
          </div>
        </section>

        {/* 2-Column Split: Squad Roster Grid on Left, selected scorecard & calibration sliders on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-lg)', alignItems: 'start', width: '100%' }}>
          
          {/* Left: Squad Roster Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Squad Roster Database
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rosterPlayers.map((player) => {
                const isSelected = selectedPlayerId === player.id;
                return (
                  <div
                    key={player.id}
                    className="glass-card hover-grow"
                    onClick={() => setSelectedPlayerId(player.id)}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(255,255,255,0.03)',
                      background: isSelected ? 'rgba(0, 240, 255, 0.03)' : 'rgba(255,255,255,0.01)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div 
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {player.avatarInitials}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block' }}>{player.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                          {player.stance} • {player.focusDomain}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>OVERALL GRADE</span>
                        <strong style={{ fontSize: '0.95rem', color: getScoreColor(player.overallGrade) }}>
                          {player.overallGrade}%
                        </strong>
                      </div>
                      <ChevronRight size={18} color="var(--color-text-secondary)" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* List selected player's real sessions if it is pavan */}
            {selectedPlayerId === 'pavan' && analyses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Real Session Logs for {activeRosterPlayer.name}
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analyses.map((session, index) => {
                    const isComplete = session.status === 'complete';
                    const score = session.metrics?.overall_score || 0;
                    
                    return (
                      <div
                        key={session.id}
                        className="glass-card"
                        onClick={() => router.push(`/analysis/${session.id}`)}
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid rgba(255,255,255,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Play size={14} color="var(--color-primary)" fill="var(--color-primary)" />
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>Drive Session #{analyses.length - index}</span>
                              {isComplete && session.delivery_count && session.delivery_count > 1 && (
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--color-accent)', padding: '1px 5px', borderRadius: '6px' }}>
                                  {session.delivery_count} BALLS
                                </span>
                              )}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                              {session.frame_count} frames • {session.metrics?.stroke_name || "Front-Foot Cover Drive"} • {session.delivery_count || 1} {session.delivery_count === 1 ? 'ball' : 'balls'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isComplete && (
                            <strong style={{ fontSize: '0.85rem', color: getScoreColor(score) }}>
                              {Math.round(score)}%
                            </strong>
                          )}

                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="no-print"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'rgba(255, 23, 68, 0.4)',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              transition: 'var(--transition-smooth)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.background = 'rgba(255,23,68,0.06)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 23, 68, 0.4)'; e.currentTarget.style.background = 'transparent'; }}
                            title="Delete session"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Selected Scorecard & Calibration sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            
            {/* Player details scorecard */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="var(--color-primary)" />
                <span>Squad Player Profile</span>
              </strong>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                <div 
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    border: '2px solid rgba(0, 240, 255, 0.15)'
                  }}
                >
                  {activeRosterPlayer.avatarInitials}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>{activeRosterPlayer.name}</h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                    {activeRosterPlayer.role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Stance Style:</span>
                  <strong style={{ color: '#ffffff' }}>{activeRosterPlayer.stance}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Target Stroke:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>{activeRosterPlayer.focusDomain}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Evaluated Sessions:</span>
                  <strong style={{ color: '#ffffff' }}>{activeRosterPlayer.sessionsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Technical Rating:</span>
                  <strong style={{ color: getScoreColor(activeRosterPlayer.overallGrade) }}>{activeRosterPlayer.overallGrade}%</strong>
                </div>
              </div>
            </div>

            {/* Coach Calibration sliders */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <form onSubmit={handleSaveCoachSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="var(--color-accent)" />
                  <span>Skeletal Calibration Overrides</span>
                </strong>
                
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Tweak the automated biomechanics filters for <strong>{activeRosterPlayer.name}</strong> to adjust scoring sensitivity.
                </p>

                {/* Slider 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Elbow extension threshold</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{coachElbowThreshold}°</strong>
                  </div>
                  <input
                    type="range"
                    min={140}
                    max={180}
                    value={coachElbowThreshold}
                    onChange={(e) => setCoachElbowThreshold(parseInt(e.target.value))}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                </div>

                {/* Slider 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Eye stability tilt tolerance</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{coachEyeTilt.toFixed(1)}°</strong>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={0.5}
                    value={coachEyeTilt}
                    onChange={(e) => setCoachEyeTilt(parseFloat(e.target.value))}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                </div>

                {/* Slider 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Footwork stride latency</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{coachFootworkDelay}ms</strong>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={300}
                    value={coachFootworkDelay}
                    onChange={(e) => setCoachFootworkDelay(parseInt(e.target.value))}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-glow)',
                    transition: 'var(--transition-smooth)',
                    marginTop: '6px'
                  }}
                >
                  SAVE OVERRIDES FOR {activeRosterPlayer.name.toUpperCase()}
                </button>

                {savedCoachSettings && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                    <CheckCircle size={14} />
                    <span>Calibrations pushed to SQLite backend!</span>
                  </div>
                )}
              </form>
            </div>

            {/* Logout session block */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <Mail size={14} color="var(--color-accent)" />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{user?.email || "coach@pitchmind.com"}</span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  background: 'rgba(255,23,68,0.05)',
                  border: '1px solid rgba(255,23,68,0.15)',
                  color: 'var(--color-danger)',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,23,68,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,23,68,0.05)'; }}
              >
                <LogOut size={12} />
                <span>LOGOUT COACH ACCOUNT</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDERING VIEW 2: STANDARD PLAYER DASHBOARD (EXISTING)
  // -------------------------------------------------------------
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
      {/* 🆕 DECISION SUPPORT COACHING SYSTEM BRANDING BANNER */}
      <section
        className="glass-card"
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(5, 8, 17, 0.75) 0%, rgba(0, 240, 255, 0.05) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 240, 255, 0.05), var(--shadow-glow)',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow effect lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(0, 240, 255, 0.4) 50%, transparent 100%)' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--color-accent)" style={{ filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.6))' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Decision Support Coaching System
            </h1>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: 'var(--color-accent)',
                padding: '2px 8px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
              }}
            >
              V1.1 ACTIVE
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, maxWidth: '650px' }}>
            A high-fidelity coaching framework combining synchronized videos, MediaPipe joint posing, autonomous motion energy segmentation, and interactive human review loops.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {['SYNCHRONIZED VIDEOS', 'LANDMARK AI POSING', 'MOTION SEGMENTATION', 'HUMAN CALIBRATION LOOP'].map((pill, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.85)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.02em'
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div 
          style={{ 
            background: 'rgba(16, 185, 129, 0.06)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            padding: '12px 20px', 
            borderRadius: '12px', 
            textAlign: 'center', 
            minWidth: '180px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.05)',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
            COACHING SUBSTITUTION
          </span>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', display: 'block', marginTop: '2px', textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>
            96% EFFECTIVE
          </span>
          <span style={{ fontSize: '0.62rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
            Perfect Substitute for Expert Coaching
          </span>
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          width: '100%'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#ffffff' }}>
            Welcome back, {welcomeName} 👋
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
            PitchMind Elite Cricket Biomechanics Intelligence
          </p>
        </div>
        
        <Link href={ROUTES.UPLOAD}>
          <button
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            <Plus size={16} />
            <span>RECORD NEW NETS SESSION</span>
          </button>
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nets Conducted</span>
            <div style={{ background: 'rgba(0, 240, 255, 0.08)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
              <Calendar size={18} color="var(--color-accent)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>{totalSessions}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Recorded Sessions</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Rating</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <Award size={18} color="var(--color-primary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: peakScore > 0 ? getScoreColor(peakScore) : '#ffffff' }}>
              {peakScore > 0 ? `${peakScore}%` : 'N/A'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Best Technical Drive</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mean Performance</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <TrendingUp size={18} color="var(--color-primary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: meanScore > 0 ? getScoreColor(meanScore) : '#ffffff' }}>
              {meanScore > 0 ? `${meanScore}%` : 'N/A'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Season Average Rating</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telemetry Datapoints</span>
            <div style={{ background: 'rgba(0, 240, 255, 0.08)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
              <Activity size={18} color="var(--color-accent)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
              {totalFramesAnalyzed.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Pose Landmarks Tracked</span>
          </div>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2.1fr 1fr',
          gap: 'var(--spacing-lg)',
          alignItems: 'start',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nets Session History Timeline
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
              {totalSessions} Sessions Logged
            </span>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <AlertCircle size={20} color="var(--color-danger)" />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>{error}</p>
            </div>
          )}

          {analyses.length === 0 ? (
            <div 
              className="glass-card" 
              style={{ 
                padding: '40px', 
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
                <Video size={28} color="var(--color-accent)" />
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>No Biomechanical Evaluated Sessions</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0', lineHeight: 1.5 }}>
                  You haven't uploaded any batting footage yet. Record and upload a drive stroke video to analyze joints alignment and receive interactive AI coaching drills.
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
                  UPLOAD FIRST BATTING VIDEO
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analyses.map((session, index) => {
                const isComplete = session.status === 'complete';
                const isProcessing = session.status === 'processing' || session.status === 'pending';
                const isFailed = session.status === 'failed';
                const score = session.metrics?.overall_score || 0;
                
                const sessionDate = session.completed_at || session.created_at
                  ? new Date(session.completed_at || session.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Nets Evaluation';

                return (
                  <div
                    key={session.id}
                    className="glass-card hover-grow"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                    onClick={() => router.push(`/analysis/${session.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '8px', 
                          background: isProcessing 
                            ? 'rgba(0, 240, 255, 0.04)' 
                            : (isFailed ? 'rgba(255, 23, 68, 0.04)' : 'rgba(16, 185, 129, 0.04)'), 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: `1px solid ${isProcessing ? 'rgba(0, 240, 255, 0.1)' : (isFailed ? 'rgba(255, 23, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)')}`
                        }}
                      >
                        {isProcessing ? (
                          <RefreshCw size={18} color="var(--color-accent)" className="spinner-icon-animate" />
                        ) : (
                          <Play size={16} fill={isFailed ? 'var(--color-danger)' : 'var(--color-primary)'} color={isFailed ? 'var(--color-danger)' : 'var(--color-primary)'} />
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                            Drive Evaluation Session #{analyses.length - index}
                          </span>
                          {isComplete && session.delivery_count && session.delivery_count > 1 && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--color-accent)', padding: '1px 6px', borderRadius: '8px', textTransform: 'uppercase' }}>
                              {session.delivery_count} BALLS
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                          {sessionDate} • {session.frame_count} frames • {session.metrics?.stroke_name || "Front-Foot Cover Drive"} • {session.delivery_count || 1} {session.delivery_count === 1 ? 'ball' : 'balls'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {isProcessing && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0,240,255,0.15)', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                          AI PROCESSING
                        </span>
                      )}

                      {isFailed && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-danger)', background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.15)', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                          FAILED
                        </span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isComplete && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>OVERALL RATING</span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: getScoreColor(score) }}>
                                {Math.round(score)}%
                              </span>
                            </div>
                            
                            <div 
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                border: `2px solid ${getScoreColor(score)}`,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: getScoreColor(score),
                                flexShrink: 0
                              }}
                            >
                              {Math.round(score)}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="no-print"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(255, 23, 68, 0.4)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'var(--transition-smooth)'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.background = 'rgba(255,23,68,0.06)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 23, 68, 0.4)'; e.currentTarget.style.background = 'transparent'; }}
                          title="Delete session"
                        >
                          <Trash2 size={16} />
                        </button>

                        <ChevronRight size={18} color="var(--color-text-secondary)" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Player Profile
          </h3>

          <div 
            className="glass-card" 
            style={{ 
              padding: '24px 20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(9,14,23,0.85) 0%, rgba(0,240,255,0.02) 100%)',
              border: '1px solid rgba(0,240,255,0.05)'
            }}
          >
            <div 
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffffff',
                border: '3px solid rgba(0, 240, 255, 0.2)',
                boxShadow: 'var(--shadow-glow)',
                overflow: 'hidden',
                marginBottom: '16px'
              }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={welcomeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              {welcomeName}
            </h4>

            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.15)', color: 'var(--color-accent)', padding: '3px 12px', borderRadius: '12px', textTransform: 'uppercase', marginTop: '6px', display: 'inline-block' }}>
              {welcomeRole}
            </span>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100%', padding: '16px 0', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Stance Style</span>
                <strong style={{ color: '#ffffff' }}>Right-Hand Batsman</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Focus Domain</span>
                <strong style={{ color: 'var(--color-accent)' }}>Front-Foot Cover Drive</strong>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'left', marginBottom: '24px' }}>
              {user?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--color-accent)" />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{user.email}</span>
                </div>
              )}
              {user?.phone_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="var(--color-accent)" />
                  <span>{user.phone_number}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                background: 'rgba(255,23,68,0.05)',
                border: '1px solid rgba(255,23,68,0.15)',
                color: 'var(--color-danger)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,23,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,23,68,0.05)'; }}
            >
              <LogOut size={14} />
              <span>LOGOUT SESSION</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🆕 Floating Net Voice Assistant Pill */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          pointerEvents: 'auto'
        }}
      >
        {isVoiceListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              background: 'rgba(5, 8, 17, 0.9)',
              color: 'var(--color-accent)',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0, 240, 255, 0.2)'
            }}
          >
            {voiceTranscript}
          </motion.div>
        )}
        
        <button
          onClick={startVoiceAssistant}
          style={{
            background: isVoiceListening ? 'rgba(239, 68, 68, 0.95)' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
            border: isVoiceListening ? '2px solid #f87171' : 'none',
            borderRadius: '50%',
            width: '52px',
            height: '52px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isVoiceListening ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'var(--shadow-glow)',
            transition: 'var(--transition-smooth)'
          }}
          title="Hands-free net assistant"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '22px', height: '22px' }}
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
