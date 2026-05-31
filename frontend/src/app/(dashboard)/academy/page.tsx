'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  ArrowLeft, 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  CheckSquare, 
  ChevronRight,
  Sparkles,
  Target
} from 'lucide-react';
import { ROUTES } from '../../../lib/constants';

export default function AcademyPage() {
  const router = useRouter();
  
  // Interactive courses list
  const courses = [
    {
      id: 'course-1',
      title: 'Mastering the Front-Foot Cover Drive',
      description: 'An exhaustive biomechanical breakdown of the cricket cover drive. Learn optimal joint posture, weight transfer, and bat swing trajectories.',
      duration: '45 mins',
      level: 'Intermediate',
      modules: 5,
      checklists: [
        'Initial stance balance Shoulder-width setup',
        'Head tracking balance at ball release',
        'Lead elbow extension retention (minimum 160°)',
        'Footwork stride length and timing synchronicity',
        'Follow-through vertical face control'
      ],
      tag: 'Elbow & Stance Focus'
    },
    {
      id: 'course-2',
      title: 'Lead Elbow Extension Mechanics',
      description: 'Stop the lead arm from collapsing. This course provides clinical muscle-memory drills to lock a high lead elbow line during impact.',
      duration: '30 mins',
      level: 'Beginner',
      modules: 3,
      checklists: [
        'The Tennis Ball Trap armpit compression drill',
        'Static tee-ball drives with high elbow focus',
        'Shadow batting mirror alignment training'
      ],
      tag: 'Elbow Stability'
    },
    {
      id: 'course-3',
      title: 'Footwork Synchronization & Stride Latency',
      description: 'Optimize your foot movement delay. Eliminate early stride trigger and develop a powerful step-through drive technique.',
      duration: '40 mins',
      level: 'Advanced',
      modules: 4,
      checklists: [
        'Step-Through drive drill on bowling machines',
        'Late stride trigger response training',
        'Front-foot weight distribution alignment'
      ],
      tag: 'Footwork Sync'
    },
    {
      id: 'course-4',
      title: 'Back-Foot Pull Shot & Wrist Roll-over',
      description: 'Master the mechanics of backfoot pull strokes. Learn proper ankle-hip weight shifts, level head pivot lines, and rapid wrist roll transitions.',
      duration: '40 mins',
      level: 'Advanced',
      modules: 4,
      checklists: [
        'High-to-low wrist roll dynamic swing paths',
        'Stance weight pivot shifts onto the backfoot',
        'Head level gaze stability (eye tilt under 10°)',
        'Wrist plane closure at ball impact'
      ],
      tag: 'Wrist Roll Focus'
    },
    {
      id: 'course-5',
      title: 'Late Cut & Lateral Arm Extensions',
      description: 'Expand your lateral reach. Learn forearm extension metrics, late contact point control, and how to maintain level eyes on wide deliveries.',
      duration: '35 mins',
      level: 'Intermediate',
      modules: 3,
      checklists: [
        'Width-stretching tee placement arm extensions',
        'Locking eye alignment and posture on contact',
        'Late-cut bat drop timing sequences'
      ],
      tag: 'Lateral Reach Focus'
    }
  ];

  const [activeCourseId, setActiveCourseId] = useState(courses[0].id);
  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0];

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
      {/* Header Block */}
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Elite Batting Academy</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Interactive video tutorials and biomechanical drills designed by professional coaches.
          </p>
        </div>
      </div>

      {/* Main Grid splits: Left list of courses, Right detailed checklist */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 'var(--spacing-lg)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Courses list */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Batting Training Modules
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {courses.map((course) => {
              const isActive = course.id === activeCourseId;
              return (
                <div 
                  key={course.id}
                  className="glass-card hover-grow"
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    borderLeft: isActive ? '4px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.03)',
                    background: isActive ? 'rgba(0, 240, 255, 0.01)' : 'rgba(255,255,255,0.01)'
                  }}
                  onClick={() => setActiveCourseId(course.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(0,240,255,0.05)', color: 'var(--color-accent)', border: '1px solid rgba(0,240,255,0.12)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {course.tag}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {course.duration}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={12} />
                        {course.level}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginTop: '10px' }}>
                    {course.title}
                  </h4>
                  
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.45 }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
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
                      <span>VIEW LESSON PLAN</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Detailed checklist and action checklist */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interactive Lesson Plan
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
              <BookOpen size={20} color="var(--color-primary)" />
              <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>{activeCourse.title}</strong>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Professional biomechanical checkpoints. Complete the following drills under your coach's supervision to build consistent muscle-memory and upgrade your rating.
            </p>

            {/* Checklist elements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Lesson Checkpoints
              </span>

              {activeCourse.checklists.map((check, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    id={`check-${idx}`}
                    style={{
                      marginTop: '3px',
                      accentColor: 'var(--color-accent)',
                      cursor: 'pointer'
                    }}
                  />
                  <label 
                    htmlFor={`check-${idx}`}
                    style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.4, cursor: 'pointer' }}
                  >
                    {check}
                  </label>
                </div>
              ))}
            </div>

            {/* Play drill block */}
            <button
              onClick={() => alert('Launching video tutorial player...')}
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
                transition: 'var(--transition-smooth)',
                marginTop: '10px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              <Play size={14} fill="#ffffff" />
              <span>WATCH VIDEO TUTORIAL ({activeCourse.duration})</span>
            </button>

          </div>
        </section>
      </div>

    </div>
  );
}
