'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  RefreshCw, 
  Activity, 
  Sliders, 
  Video, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { ROUTES, API_BASE_URL } from '../../../lib/constants';

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface FrameLandmarks {
  frame_index: number;
  timestamp_ms: number;
  landmarks: { [key: string]: Landmark };
  confidence: number;
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
    stroke_type?: string;
    stroke_name?: string;
  } | null;
  frame_count: number;
  processing_time_seconds: number;
  completed_at: string | null;
  created_at: string;
}

interface SessionData {
  id: string;
  video_id: string;
  metrics: any;
  frameCount: number;
  landmarks: FrameLandmarks[];
  strokeName: string;
}

export default function ComparePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Left & Right Selected Session IDs
  const [leftSessionId, setLeftSessionId] = useState<string>('');
  const [rightSessionId, setRightSessionId] = useState<string>('');

  // Loaded detailed session data
  const [leftData, setLeftData] = useState<SessionData | null>(null);
  const [rightData, setRightData] = useState<SessionData | null>(null);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);

  // Synchronized Frame timeline state
  const [scrubberIndex, setScrubberIndex] = useState(0);

  // Video and Canvas Refs
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftVideoRef = useRef<HTMLVideoElement | null>(null);
  const rightVideoRef = useRef<HTMLVideoElement | null>(null);

  // Synchronize playback timeline currentTime
  useEffect(() => {
    const fps = 30.0;
    if (leftVideoRef.current) {
      leftVideoRef.current.currentTime = scrubberIndex / fps;
    }
    if (rightVideoRef.current) {
      rightVideoRef.current.currentTime = scrubberIndex / fps;
    }
  }, [scrubberIndex]);

  // Fetch session history listing on mount
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const response = await apiClient.get<AnalysisListItem[]>('/api/v1/analyses');
        const completed = Array.isArray(response) 
          ? response.filter(s => s.status === 'complete' && s.metrics) 
          : [];
        setSessions(completed);

        if (completed.length > 0) {
          setLeftSessionId(completed[0].id);
          if (completed.length > 1) {
            setRightSessionId(completed[1].id);
          } else {
            setRightSessionId(completed[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load compare list:', err);
        setError('Failed to fetch session list.');
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // Fetch detailed Left Session details
  useEffect(() => {
    if (!leftSessionId) return;
    async function loadLeft() {
      try {
        setLoadingLeft(true);
        const res = await apiClient.get<any>(`/api/v1/analysis/${leftSessionId}`);
        setLeftData({
          id: leftSessionId,
          video_id: res.video_id,
          metrics: res.metrics,
          frameCount: res.frame_count,
          landmarks: res.landmarks || [],
          strokeName: res.metrics.stroke_name || 'Cover Drive'
        });
      } catch (err) {
        console.error('Error loading left compare session:', err);
      } finally {
        setLoadingLeft(false);
      }
    }
    loadLeft();
  }, [leftSessionId]);

  // Fetch detailed Right Session details
  useEffect(() => {
    if (!rightSessionId) return;
    async function loadRight() {
      try {
        setLoadingRight(true);
        const res = await apiClient.get<any>(`/api/v1/analysis/${rightSessionId}`);
        setRightData({
          id: rightSessionId,
          video_id: res.video_id,
          metrics: res.metrics,
          frameCount: res.frame_count,
          landmarks: res.landmarks || [],
          strokeName: res.metrics.stroke_name || 'Cover Drive'
        });
      } catch (err) {
        console.error('Error loading right compare session:', err);
      } finally {
        setLoadingRight(false);
      }
    }
    loadRight();
  }, [rightSessionId]);

  // Calculate synchronized maximum frames boundary
  const maxFrames = Math.max(
    leftData?.frameCount || 0,
    rightData?.frameCount || 0
  );

  // Redraw Skeletal Canvas on frame scrubber sync changes
  useEffect(() => {
    if (leftData) {
      drawPose(leftCanvasRef.current, leftData, scrubberIndex);
    }
  }, [leftData, scrubberIndex]);

  useEffect(() => {
    if (rightData) {
      drawPose(rightCanvasRef.current, rightData, scrubberIndex);
    }
  }, [rightData, scrubberIndex]);

  // Canvas skeletal rendering calculations
  const drawPose = (canvas: HTMLCanvasElement | null, data: SessionData, frameIdx: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Flush and reset canvas view (keep transparent to overlay nicely on top of HTML5 video)
    ctx.clearRect(0, 0, width, height);
    
    // Draw guide creases
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height * 0.75); ctx.lineTo(width, height * 0.75);
    ctx.stroke();

    // Map frameIndex bound constraints
    const safeIdx = Math.min(frameIdx, data.landmarks.length - 1);
    if (safeIdx < 0) return;

    const landmarksContainer = data.landmarks[safeIdx];
    if (!landmarksContainer || !landmarksContainer.landmarks) return;

    const landmarks = landmarksContainer.landmarks;

    const getPt = (name: string) => {
      const lm = landmarks[name];
      if (!lm || lm.visibility < 0.4) return null;
      return { x: lm.x * width, y: lm.y * height };
    };

    const connections = [
      ['LEFT_SHOULDER', 'RIGHT_SHOULDER'],
      ['LEFT_SHOULDER', 'LEFT_ELBOW'],
      ['LEFT_ELBOW', 'LEFT_WRIST'],
      ['RIGHT_SHOULDER', 'RIGHT_ELBOW'],
      ['RIGHT_ELBOW', 'RIGHT_WRIST'],
      ['LEFT_SHOULDER', 'LEFT_HIP'],
      ['RIGHT_SHOULDER', 'RIGHT_HIP'],
      ['LEFT_HIP', 'RIGHT_HIP'],
      ['LEFT_HIP', 'LEFT_KNEE'],
      ['LEFT_KNEE', 'LEFT_ANKLE'],
      ['LEFT_ANKLE', 'LEFT_FOOT_INDEX'],
      ['RIGHT_HIP', 'RIGHT_KNEE'],
      ['RIGHT_KNEE', 'RIGHT_ANKLE'],
      ['RIGHT_ANKLE', 'RIGHT_FOOT_INDEX'],
      ['LEFT_WRIST', 'LEFT_INDEX'],
      ['RIGHT_WRIST', 'RIGHT_INDEX'],
    ];


    // Draw coordinate lines
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';

    connections.forEach(([p1, p2]) => {
      const pt1 = getPt(p1);
      const pt2 = getPt(p2);
      
      if (pt1 && pt2) {
        ctx.strokeStyle = 'var(--color-accent)';
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;

    // Draw joints keypoints
    Object.entries(landmarks).forEach(([name, lm]) => {
      if (lm.visibility < 0.4) return;
      const x = lm.x * width;
      const y = lm.y * height;
      const isElbow = name === 'LEFT_ELBOW' || name === 'RIGHT_ELBOW';

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = isElbow ? 'var(--color-success)' : 'var(--color-accent)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    // Draw Lead Elbow Angle text dynamically
    const s = getPt('LEFT_SHOULDER');
    const e = getPt('LEFT_ELBOW');
    const w = getPt('LEFT_WRIST');

    if (s && e && w) {
      ctx.fillStyle = 'var(--color-success)';
      ctx.font = 'bold 13px Inter';
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 3;
      
      const v1 = { x: s.x - e.x, y: s.y - e.y };
      const v2 = { x: w.x - e.x, y: w.y - e.y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const m1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
      const m2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
      const angle = Math.round(Math.acos(dot / (m1 * m2)) * (180 / Math.PI));

      ctx.strokeText(`Elbow: ${angle}°`, e.x + 12, e.y);
      ctx.fillText(`Elbow: ${angle}°`, e.x + 12, e.y);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <RefreshCw size={36} color="var(--color-accent)" className="spinner-icon-animate" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Aligning comparison timeline streams...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', width: '100%', paddingBottom: '40px' }}>
      
      {/* Title block */}
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
            color: 'var(--color-text-primary)',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Side-by-Side Video Comparison</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Benchmark two separate netting calibrations side-by-side with fully synchronized frame timeline scrubbing.
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--color-text-secondary)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700 }}>Insufficient Completed Session Logs</h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>
            You need at least 1 completed biomechanical evaluation session in SQLite to load the side-by-side comparison screen.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          
          {/* selectors row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left selector */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Primary Evaluation (Left)
              </label>
              <select
                value={leftSessionId}
                onChange={(e) => setLeftSessionId(e.target.value)}
                style={{
                  background: '#050811',
                  border: '1px solid #111c2e',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {sessions.map((s, index) => (
                  <option key={s.id} value={s.id}>
                    Session #{sessions.length - index} ({s.metrics?.stroke_name || 'Cover Drive'}) - Grade: {s.metrics?.overall_score || 0}%
                  </option>
                ))}
              </select>
            </div>

            {/* Right selector */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Compare Baseline (Right)
              </label>
              <select
                value={rightSessionId}
                onChange={(e) => setRightSessionId(e.target.value)}
                style={{
                  background: '#050811',
                  border: '1px solid #111c2e',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {sessions.map((s, index) => (
                  <option key={s.id} value={s.id}>
                    Session #{sessions.length - index} ({s.metrics?.stroke_name || 'Cover Drive'}) - Grade: {s.metrics?.overall_score || 0}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Player skeletal pose overlays side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            
            {/* Left canvas overlaying video */}
            <div className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#050811', border: '1px solid #111c2e', borderRadius: '12px' }}>
              <div style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                  {leftData ? leftData.strokeName : 'Primary Session'}
                </strong>
              </div>
              <div style={{ position: 'relative', width: '100%', maxWidth: '480px', height: '360px', background: '#050811' }}>
                <video
                  ref={leftVideoRef}
                  src={leftData ? `${API_BASE_URL || 'http://localhost:8000'}/api/v1/assets/videos/${leftData.video_id}.mp4` : undefined}
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <canvas
                  ref={leftCanvasRef}
                  width={480}
                  height={360}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Right canvas overlaying video */}
            <div className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#050811', border: '1px solid #111c2e', borderRadius: '12px' }}>
              <div style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                  {rightData ? rightData.strokeName : 'Baseline Session'}
                </strong>
              </div>
              <div style={{ position: 'relative', width: '100%', maxWidth: '480px', height: '360px', background: '#050811' }}>
                <video
                  ref={rightVideoRef}
                  src={rightData ? `${API_BASE_URL || 'http://localhost:8000'}/api/v1/assets/videos/${rightData.video_id}.mp4` : undefined}
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <canvas
                  ref={rightCanvasRef}
                  width={480}
                  height={360}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>

          </div>

          {/* Unified frame timeline scrubber slider */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              <span>Synchronized Frame Timeline</span>
              <span style={{ color: 'var(--color-accent)' }}>Frame {scrubberIndex + 1} of {maxFrames}</span>
            </div>
            
            <input
              type="range"
              min={0}
              max={maxFrames - 1}
              value={scrubberIndex}
              onChange={(e) => setScrubberIndex(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--color-accent)',
                cursor: 'pointer',
                height: '6px',
                borderRadius: '3px',
                background: '#111c2e'
              }}
            />
            
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '4px' }}>
              Scrub this timeline to synchronize frames, joint overlays, and extension coordinates simultaneously.
            </span>
          </div>

          {/* Biomechanical metrics comparison values side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Left Metrics summaries */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>Left Metrics Profile</strong>
                {leftData && (
                  <strong style={{ color: getScoreColor(leftData.metrics.overall_score) }}>
                    Overall: {Math.round(leftData.metrics.overall_score)}%
                  </strong>
                )}
              </div>

              {leftData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Elbow extension score:</span>
                    <strong style={{ color: getScoreColor(leftData.metrics.elbow.stability_score) }}>{Math.round(leftData.metrics.elbow.stability_score)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Head stability score:</span>
                    <strong style={{ color: getScoreColor(leftData.metrics.head.stability_score) }}>{Math.round(leftData.metrics.head.stability_score)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Stance balance score:</span>
                    <strong style={{ color: getScoreColor(leftData.metrics.stance.balance_score) }}>{Math.round(leftData.metrics.stance.balance_score)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Footwork delay offset:</span>
                    <strong style={{ color: '#ffffff' }}>{Math.round(leftData.metrics.footwork.timing_delay_ms)}ms</strong>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading telemetry data...</p>
              )}
            </div>

            {/* Right Metrics summaries */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>Right Metrics Profile</strong>
                {rightData && (
                  <strong style={{ color: getScoreColor(rightData.metrics.overall_score) }}>
                    Overall: {Math.round(rightData.metrics.overall_score)}%
                  </strong>
                )}
              </div>

              {rightData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Elbow extension score:</span>
                    <strong style={{ color: getScoreColor(rightData.metrics.elbow.stability_score) }}>{Math.round(rightData.metrics.elbow.stability_score)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Head stability score:</span>
                    <strong style={{ color: getScoreColor(rightData.metrics.head.stability_score) }}>{Math.round(rightData.metrics.head.stability_score)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Stance balance score:</span>
                    <strong style={{ color: getScoreColor(rightData.metrics.stance.balance_score) }}>{Math.round(rightData.metrics.stance.balance_score)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Footwork delay offset:</span>
                    <strong style={{ color: '#ffffff' }}>{Math.round(rightData.metrics.footwork.timing_delay_ms)}ms</strong>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading telemetry data...</p>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
