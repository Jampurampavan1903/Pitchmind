'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  ArrowLeft, 
  Star, 
  Send, 
  CheckCircle, 
  User, 
  Calendar,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { ROUTES } from '../../../lib/constants';

export default function FeedbackPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  // Form states
  const [coachEmail, setCoachEmail] = useState('arjun.coach@pitchmind.com');
  const [subjectTopic, setSubjectTopic] = useState('Front-Foot Cover Drive Practice');
  const [playerNotes, setPlayerNotes] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const welcomeName = profile?.full_name || 'pavan';
  const welcomeRole = profile?.role 
    ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')) 
    : 'Batsman';

  const handleComposeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerNotes.trim()) return;

    const subject = encodeURIComponent(`PitchMind Player Query - ${welcomeName} (${subjectTopic})`);
    const body = encodeURIComponent(
      `PitchMind Biomechanics Discussion Request\n` +
      `----------------------------------------\n` +
      `Player: ${welcomeName} (${welcomeRole})\n` +
      `Focus Topic: ${subjectTopic}\n\n` +
      `Message:\n` +
      `"${playerNotes}"\n\n` +
      `----------------------------------------\n` +
      `Composed via PitchMind Elite Coaching Platform`
    );

    // Open native system email client
    window.location.href = `mailto:${coachEmail}?subject=${subject}&body=${body}`;
    setFormSubmitted(true);
  };

  // Simulated premium high-fidelity historical review calibrations left by coaches
  const pastCalibrations = [
    {
      id: 'cal-1',
      coachName: 'Coach Arjun',
      sessionName: 'Drive Evaluation Session #2',
      stars: 5,
      tags: ['Spot-on', 'Accurate Elbow', 'Elite Stance'],
      comments: 'Excellent head stability and eye-tracking. Your lead elbow height is now perfectly aligned at 178° on impact, yielding much cleaner, controlled cover drives.',
      date: '27 May 2026'
    },
    {
      id: 'cal-2',
      coachName: 'Coach Arjun',
      sessionName: 'Drive Evaluation Session #1',
      stars: 3,
      tags: ['Accurate Elbow', 'Missed foot stride'],
      comments: 'Lead elbow collapsed to 142° on impact (frame 24). Footwork stride latency has a timing delay of 120ms relative to bat trigger. Prioritize the Tennis Ball armpit drill this week.',
      date: '24 May 2026'
    }
  ];

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
      {/* Title & Header */}
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Coach Feedback Hub</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Compose direct email queries to coaches and review historical biomechanics ratings.
          </p>
        </div>
      </div>

      {/* 2-Column Split Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 'var(--spacing-lg)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Direct Coach Mailer Form */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Message Your Coach
          </h3>

          <div className="glass-card" style={{ padding: '24px' }}>
            {!formSubmitted ? (
              <form onSubmit={handleComposeEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Select coach email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Select Coach
                  </label>
                  <select
                    value={coachEmail}
                    onChange={(e) => setCoachEmail(e.target.value)}
                    style={{
                      background: '#050811',
                      border: '1px solid #111c2e',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <option value="arjun.coach@pitchmind.com">Coach Arjun (Head Batsman Trainer)</option>
                    <option value="support@pitchmind.com">PitchMind technical Support</option>
                  </select>
                </div>

                {/* Subject Domain Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Discussion Topic
                  </label>
                  <select
                    value={subjectTopic}
                    onChange={(e) => setSubjectTopic(e.target.value)}
                    style={{
                      background: '#050811',
                      border: '1px solid #111c2e',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <option value="Front-Foot Cover Drive Practice">Front-Foot Cover Drive Practice</option>
                    <option value="Lead Elbow Collapse Calibration">Lead Elbow Collapse Calibration</option>
                    <option value="Stance Shoulder-width Balance">Stance Shoulder-width Balance</option>
                    <option value="Stride timing Delay Latency">Stride Timing Delay Latency</option>
                  </select>
                </div>

                {/* Message input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Your Message
                  </label>
                  <textarea
                    placeholder="Draft questions or notes for your coach..."
                    value={playerNotes}
                    onChange={(e) => setPlayerNotes(e.target.value)}
                    rows={6}
                    required
                    style={{
                      background: '#050811',
                      border: '1px solid #111c2e',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: 1.5,
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!playerNotes.trim()}
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-glow)',
                    transition: 'var(--transition-smooth)',
                    opacity: !playerNotes.trim() ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                >
                  <Send size={14} />
                  <span>COMPOSE COACH EMAIL</span>
                </button>

              </form>
            ) : (
              /* Success transition */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} color="var(--color-success)" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 230, 118, 0.4))' }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Email Template Dispatched!</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                    PitchMind successfully compiled your parameters and opened your native mail client. Confirm and hit send in your email application.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPlayerNotes('');
                    setFormSubmitted(false);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: 'var(--border-glass)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Historical Coach Calibration Reviews */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Calibration Logs History
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pastCalibrations.map((cal) => (
              <div 
                key={cal.id}
                className="glass-card"
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  borderLeft: '4px solid var(--color-accent)'
                }}
              >
                {/* Header: Coach name, session and date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#ffffff', display: 'block' }}>
                      {cal.sessionName}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                      Reviewed by {cal.coachName} • {cal.date}
                    </span>
                  </div>

                  {/* Stars Rating */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={14} 
                        fill={cal.stars >= star ? '#ffd600' : 'transparent'} 
                        color={cal.stars >= star ? '#ffd600' : 'rgba(255,255,255,0.1)'} 
                      />
                    ))}
                  </div>
                </div>

                {/* Quick-Tags submitted by Coach */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {cal.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        fontSize: '0.65rem', 
                        background: 'rgba(0, 240, 255, 0.04)', 
                        border: '1px solid rgba(0, 240, 255, 0.12)', 
                        color: 'var(--color-accent)', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        fontWeight: 600 
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Coach comments text */}
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  "{cal.comments}"
                </p>

              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
