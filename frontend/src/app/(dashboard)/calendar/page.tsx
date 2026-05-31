'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Clock, 
  User, 
  ChevronRight, 
  Plus, 
  CheckCircle,
  Video,
  Bookmark
} from 'lucide-react';
import { ROUTES } from '../../../lib/constants';

export default function CalendarPage() {
  const router = useRouter();

  // Booking states
  const [bookingDate, setBookingDate] = useState('2026-05-29');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [sessionType, setSessionType] = useState('Front-Foot Drive Calibration');
  const [bookedSuccessfully, setBookedSuccessfully] = useState(false);

  // Simulated scheduled nets sessions
  const [schedules, setSchedules] = useState([
    {
      id: 'sched-1',
      date: '27 May 2026',
      time: '07:15 PM',
      type: 'Front-Foot Drive Calibration',
      coach: 'Coach Arjun',
      status: 'complete'
    },
    {
      id: 'sched-2',
      date: '29 May 2026',
      time: '10:00 AM',
      type: 'Lead Elbow extension training',
      coach: 'Coach Arjun',
      status: 'scheduled'
    },
    {
      id: 'sched-3',
      date: '31 May 2026',
      time: '04:30 PM',
      type: 'Footwork synchronization review',
      coach: 'Coach Arjun',
      status: 'scheduled'
    }
  ]);

  const handleBookSession = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const newSession = {
      id: `sched-${Date.now()}`,
      date: formattedDate,
      time: bookingTime,
      type: sessionType,
      coach: 'Coach Arjun',
      status: 'scheduled'
    };

    setSchedules([...schedules, newSession]);
    setBookedSuccessfully(true);
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Nets Booking & Calendar</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Book nets practice slots and track scheduled biomechanical AI calibrations.
          </p>
        </div>
      </div>

      {/* Grid: Left Timeline list, Right Booking Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 'var(--spacing-lg)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Schedules Timeline */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scheduled Sessions Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {schedules.map((item) => {
              const isComplete = item.status === 'complete';
              return (
                <div 
                  key={item.id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: `4px solid ${isComplete ? 'var(--color-success)' : 'var(--color-accent)'}`,
                    background: 'rgba(255,255,255,0.01)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div 
                      style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '8px', 
                        background: 'rgba(0, 240, 255, 0.04)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '1px solid rgba(0, 240, 255, 0.1)'
                      }}
                    >
                      <Video size={18} color="var(--color-accent)" />
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block' }}>
                        {item.type}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                        📅 {item.date} at {item.time} • Trainer: {item.coach}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isComplete ? (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-success)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                        COMPLETE
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                        BOOKED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Dynamic Booking Form */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Book Practice Slot
          </h3>

          <div 
            className="glass-card" 
            style={{ 
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(9,14,23,0.85) 0%, rgba(0,240,255,0.02) 100%)',
              border: '1px solid rgba(0,240,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bookmark size={20} color="var(--color-primary)" />
              <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>Schedule New Net Session</strong>
            </div>

            {!bookedSuccessfully ? (
              <form onSubmit={handleBookSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Select session Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Session Target Focus
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
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
                    <option value="Front-Foot Drive Calibration">Front-Foot Drive Calibration</option>
                    <option value="Lead Elbow extension training">Lead Elbow Extension Training</option>
                    <option value="Footwork synchronization review">Footwork Synchronization Review</option>
                    <option value="Stance Balance Setup refinement">Stance Balance Setup Refinement</option>
                  </select>
                </div>

                {/* Date Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
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
                  />
                </div>

                {/* Time Slot Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Select Time Slot
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
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
                    <option value="09:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="04:00 PM">04:00 PM - 05:00 PM</option>
                    <option value="05:30 PM">05:30 PM - 06:30 PM</option>
                  </select>
                </div>

                {/* Book Submit button */}
                <button
                  type="submit"
                  style={{
                    width: '100%',
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
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                >
                  <Plus size={14} />
                  <span>BOOK NETS PRACTICE SLOT</span>
                </button>

              </form>
            ) : (
              /* Success booked transition */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} color="var(--color-success)" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 230, 118, 0.4))' }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Nets Practice Slot Booked!</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                    Your biomechanical evaluation nets session has been scheduled successfully. Please arrive 10 minutes early at your assigned cricket lane.
                  </p>
                </div>
                <button
                  onClick={() => setBookedSuccessfully(false)}
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
                  BOOK ANOTHER SLOT
                </button>
              </div>
            )}

          </div>
        </section>
      </div>

    </div>
  );
}
