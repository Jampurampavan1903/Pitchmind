'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HelpCircle, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle, 
  Mail, 
  ShieldQuestion, 
  LifeBuoy,
  FileText,
  Search,
  BookOpen,
  Cpu,
  Video,
  Sliders,
  Award,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { ROUTES } from '../../../lib/constants';

interface FaqItem {
  question: string;
  answer: string;
  category: 'biomechanics' | 'video' | 'reports' | 'academy';
}

interface MetricDetail {
  name: string;
  icon: React.ReactNode;
  idealRange: string;
  importance: string;
  description: string;
  tip: string;
}

export default function HelpPage() {
  const router = useRouter();
  const { profile, user } = useAuthStore();

  const welcomeName = profile?.full_name || 'pavan';
  const welcomeRole = profile?.role 
    ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')) 
    : 'Batsman';

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'faq' | 'metrics' | 'support'>('faq');
  const [activeFaqCategory, setActiveFaqCategory] = useState<'all' | 'biomechanics' | 'video' | 'reports' | 'academy'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  
  // Support Form states
  const [supportCategory, setSupportCategory] = useState('Video processing error');
  const [supportMessage, setSupportMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Selected biomechanical metric in details tab
  const [selectedMetricIndex, setSelectedMetricIndex] = useState(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleComposeSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    const subject = encodeURIComponent(`PitchMind Support Ticket - ${welcomeName} [${supportCategory}]`);
    const body = encodeURIComponent(
      `PitchMind AI Biomechanics Support Ticket\n` +
      `----------------------------------------\n` +
      `Player Name: ${welcomeName} (${welcomeRole})\n` +
      `Account Email: ${user?.email || 'N/A'}\n` +
      `Problem Category: ${supportCategory}\n\n` +
      `Description:\n` +
      `"${supportMessage}"\n\n` +
      `----------------------------------------\n` +
      `Composed via PitchMind Elite Help Center`
    );

    // Open native system email client pre-filled
    window.location.href = `mailto:support@pitchmind.com?subject=${subject}&body=${body}`;
    setTicketSubmitted(true);
  };

  const faqs: FaqItem[] = [
    {
      category: 'biomechanics',
      question: "How does the MediaPipe pose estimation canvas draw joints coordinates?",
      answer: "PitchMind utilizes Google's pre-trained MediaPipe Pose model to map 33 key physical skeletal coordinates (shoulder, elbow, wrist, hip, knee, ankle joints) at a high-fidelity 10fps downsampling rate. The canvas reads this coordinate mapping dynamically and overlays glowing cyan lines, calculating relative joint extension values (such as lead elbow angles) in real-time."
    },
    {
      category: 'biomechanics',
      question: "What are the exact biomechanical standards for a perfect cover drive?",
      answer: "A gold-standard front-foot drive requires: 1) A fully extended lead elbow (between 160° and 180° at impact) to ensure high-velocity swing plane arcs. 2) Excellent head stability, keeping eye-level tilt variance under 5.0° to maintain depth perception. 3) Stance width base between 1.1x and 1.3x of shoulder width at setup. 4) Minimal footwork stride latency delay (<150ms offset between stride plant and swing downswing)."
    },
    {
      category: 'video',
      question: "Why does my batting video display a black screen or fail to extract frames?",
      answer: "Stalls and blank screens are usually caused by non-H.264 video encoding or poor canvas framing. PitchMind requires high-contrast environments so MediaPipe can detect landmarks. Trimming videos to 3-7 seconds long, removing extra players from the background, and uploading in MP4 format resolves 98% of extraction issues."
    },
    {
      category: 'video',
      question: "Can I analyze back-foot defense or bowling in PitchMind V1?",
      answer: "PitchMind V1 is mathematically calibrated specifically for front-foot drive strokes (Cover Drive, Straight Drive, On-Drive). You can upload back-foot strokes, but the scores will evaluate based on standard drive pose alignments. A specialized bowling release pipeline (covering knee flex, shoulder rotation, and release trajectory) is scheduled for the V2 release!"
    },
    {
      category: 'reports',
      question: "How do I export high-quality, multi-page printable PDF reports?",
      answer: "Click the 'Export PDF Report' button on any session details page. PitchMind uses custom CSS @media print rules that override absolute heights and scroll locks. The sidebar and interactive sliders hide automatically, and visual evidence canvases stack vertically with clean borders onto standard portrait A4 sheets. For best results, enable 'Background graphics' and set 'Margins' to Default in your browser print prompt."
    },
    {
      category: 'reports',
      question: "How do I share evaluations with my Academy head coach?",
      answer: "Every evaluated session generates a unique ID saved in our SQL database. Copy the URL of your session details page (e.g. /analysis/2) and send it directly to your coach. The coach can view the full coordinate canvas scrubbing timeline and submit feedback, which triggers a pre-formatted calibration email back to the system."
    },
    {
      category: 'academy',
      question: "What is the training curriculum in the PitchMind Academy?",
      answer: "The PitchMind Academy acts as your personal technical roadmap. It houses specialized training modules structured around the core biomechanical faults (e.g. Elbow Collapse correction, Stance Balance stabilization). You can check off modules as you complete nets drills to dynamically update your development record."
    },
    {
      category: 'academy',
      question: "How does the Net Calendar booking schedule work?",
      answer: "The Calendar tab lets you schedule netting sessions. You can reserve time slots (30m or 60m blocks), select specific batting nets, and log the session. Once netting is complete, upload the recorded drive video to sync your real performance directly with that booking date!"
    }
  ];

  const metricsInfo: MetricDetail[] = [
    {
      name: "Lead Elbow Extension",
      icon: <Sliders size={20} color="var(--color-primary)" />,
      idealRange: "160° - 180° at impact",
      importance: "Determines swing leverage and ball-strike control. A collapsed elbow reduces power and leads to lofted catches.",
      description: "Measured as the relative 3D coordinate angle between the lead shoulder, lead elbow, and lead wrist. The AI tracks this continuously, flagging any collapse during the critical transition from backswing to impact.",
      tip: "Keep your lead shoulder pointing towards the target and lead elbow high through the swing arc. Think of lifting the elbow high to face the bowler upon completion."
    },
    {
      name: "Head stability & Balance",
      icon: <Award size={20} color="var(--color-primary)" />,
      idealRange: "Tilt < 5.0° | SD drift < 10px",
      importance: "Ensures precise ball tracking and center-of-gravity balance. If the head 'falls over', the body weight shifts, causing off-center hits.",
      description: "PitchMind tracks the absolute spatial standard deviation of your ears and nose landmarks during the delivery stride. It checks for horizontal eye-level consistency to ensure your head remains directly over the line of the ball.",
      tip: "Lead with your head first. Keep your eyes parallel to the horizon. Do not force the head forward before the foot has planted firmly."
    },
    {
      name: "Stance Width Base",
      icon: <BookOpen size={20} color="var(--color-primary)" />,
      idealRange: "1.1x - 1.3x of shoulder width",
      importance: "Provides the athletic base necessary for transfer of weight. Too narrow prevents stride length; too wide locks the hips.",
      description: "Calculated by measuring the distance between left and right ankle landmarks at setup, normalized by the width of the player's collarbone (left-to-right shoulder joint distance).",
      tip: "Position your feet slightly wider than your shoulders. Flex your knees marginally to lower your center of gravity, preparing to spring forward or back."
    },
    {
      name: "Stride Latency Sync",
      icon: <Clock size={20} color="var(--color-primary)" />,
      idealRange: "Stride plants < 150ms before swing",
      importance: "Ensures timing coordination. Striding too early ruins momentum; striding too late forces a rushed, unbalanced swipe.",
      description: "Measures the absolute time delay (in milliseconds) between the moment your lead foot completes its horizontal translation and the moment the wrist joint reaches its maximum downswing velocity.",
      tip: "Wait for the ball release. Let your front foot plant firmly towards the pitch of the ball, then let the hands flow naturally into the swing plane."
    }
  ];

  // Filtering Logic
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFaqCategory === 'all' || faq.category === activeFaqCategory;
    return matchesSearch && matchesCategory;
  });

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
            color: 'var(--color-text-primary)',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>Help & Support Center</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Explore deep biomechanical telemetry metrics, browse FAQs, and dispatch engineering support tickets.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #111c2e',
          gap: '8px',
          paddingBottom: '2px'
        }}
      >
        <button
          onClick={() => { setActiveTab('faq'); }}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'faq' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'faq' ? '#ffffff' : 'var(--color-text-secondary)',
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          FAQs & Troubleshooting
        </button>
        <button
          onClick={() => { setActiveTab('metrics'); }}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'metrics' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'metrics' ? '#ffffff' : 'var(--color-text-secondary)',
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          Biomechanical Metric Guide
        </button>
        <button
          onClick={() => { setActiveTab('support'); }}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'support' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'support' ? '#ffffff' : 'var(--color-text-secondary)',
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          Submit Support Ticket
        </button>
      </div>

      {/* Main Tab Content */}
      <div style={{ minHeight: '50vh' }}>
        
        {/* TAB 1: FAQ ACCORDION WITH FILTER SEARCH */}
        {activeTab === 'faq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            
            {/* Search and Category filters */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '16px',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: 'var(--border-glass)',
                padding: '16px',
                borderRadius: '12px'
              }}
            >
              {/* Live Search input */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search FAQ questions, answers, and errors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#050811',
                    border: '1px solid #111c2e',
                    borderRadius: '8px',
                    padding: '10px 12px 10px 38px',
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'var(--transition-smooth)'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#111c2e'; }}
                />
              </div>

              {/* Category Quick Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['all', 'biomechanics', 'video', 'reports', 'academy'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFaqCategory(cat)}
                    style={{
                      background: activeFaqCategory === cat ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: activeFaqCategory === cat ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(255,255,255,0.05)',
                      color: activeFaqCategory === cat ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div 
                      key={index}
                      className="glass-card"
                      style={{ 
                        padding: '18px 24px', 
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        border: isOpen ? '1px solid rgba(0, 240, 255, 0.15)' : '1px solid rgba(255,255,255,0.03)',
                        background: 'rgba(255,255,255,0.01)'
                      }}
                      onClick={() => toggleFaq(index)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span 
                            style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              color: 'var(--color-accent)', 
                              background: 'rgba(0, 240, 255, 0.05)', 
                              border: '1px solid rgba(0, 240, 255, 0.12)', 
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              flexShrink: 0
                            }}
                          >
                            {faq.category}
                          </span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isOpen ? 'var(--color-accent)' : '#ffffff' }}>
                            {faq.question}
                          </span>
                        </div>
                        {isOpen ? <ChevronUp size={18} color="var(--color-accent)" /> : <ChevronDown size={18} color="var(--color-text-secondary)" />}
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                  <ShieldQuestion size={36} color="var(--color-text-secondary)" style={{ marginBottom: '12px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>No matching FAQ articles found</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                    Try refining your search terms or selecting 'ALL' categories to see related answers.
                  </p>
                </div>
              )}
            </div>

            {/* Quick troubleshooting alerts */}
            <div 
              className="premium-card"
              style={{
                background: 'rgba(255, 23, 68, 0.02)',
                border: '1px solid rgba(255, 23, 68, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                marginTop: '10px'
              }}
            >
              <div style={{ background: 'rgba(255,23,68,0.08)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,23,68,0.15)' }}>
                <Cpu size={20} color="var(--color-danger)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block' }}>Encountered a Biomechanics Pipeline Fault?</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                  If the video analysis displays constant errors, please verify the backend environment is active. You can completely clean all session data, reset SQLite connections, and restore calibrations via the <Link href="/settings" style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'underline' }}>Settings Diagnostics</Link> tab.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: BIOMECHANICAL METRIC KNOWLEDGE GUIDE */}
        {activeTab === 'metrics' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.6fr',
              gap: 'var(--spacing-lg)',
              alignItems: 'start'
            }}
          >
            {/* Left selector menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>
                Select Biomechanical Metric
              </span>
              {metricsInfo.map((metric, idx) => {
                const isSelected = selectedMetricIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedMetricIndex(idx)}
                    className="glass-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 240, 255, 0.03)' : 'rgba(255,255,255,0.01)',
                      border: isSelected ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div 
                      style={{ 
                        background: isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)', 
                        padding: '8px', 
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {metric.icon}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: isSelected ? 'var(--color-accent)' : '#ffffff', display: 'block' }}>
                        {metric.name}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                        Ideal: {metric.idealRange.split('|')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right detailed information display */}
            <div 
              className="premium-card"
              style={{
                padding: '28px',
                background: 'linear-gradient(135deg, rgba(9,14,23,0.9) 0%, rgba(0,240,255,0.01) 100%)',
                border: '1px solid rgba(0,240,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(0, 240, 255, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                    {metricsInfo[selectedMetricIndex].icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                      {metricsInfo[selectedMetricIndex].name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                      PITCHMIND TELEMETRY METRIC
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>Target Threshold</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                    {metricsInfo[selectedMetricIndex].idealRange}
                  </strong>
                </div>
              </div>

              {/* Importance Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Why It Matters</strong>
                <p style={{ fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5 }}>
                  {metricsInfo[selectedMetricIndex].importance}
                </p>
              </div>

              {/* Mathematical / Technical description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} />
                  <span>AI Computation Logic</span>
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '4px' }}>
                  {metricsInfo[selectedMetricIndex].description}
                </p>
              </div>

              {/* Coaching Tip */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '16px' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} />
                  <span>Elite Coaching Tip</span>
                </strong>
                <p style={{ fontSize: '0.85rem', color: '#ffffff', fontStyle: 'italic', lineHeight: 1.5, marginTop: '4px' }}>
                  "{metricsInfo[selectedMetricIndex].tip}"
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SUPPORT TICKET COMPOST FORM */}
        {activeTab === 'support' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 'var(--spacing-lg)',
              alignItems: 'start'
            }}
          >
            {/* Left side Form */}
            <div 
              className="premium-card" 
              style={{ 
                padding: '28px',
                background: 'linear-gradient(135deg, rgba(9,14,23,0.85) 0%, rgba(0,240,255,0.02) 100%)',
                border: '1px solid rgba(0,240,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LifeBuoy size={22} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Submit Support Inquiry</h3>
              </div>

              {!ticketSubmitted ? (
                <form onSubmit={handleComposeSupportTicket} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {/* Select ticket category */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Inquiry Category
                    </label>
                    <select
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value)}
                      style={{
                        background: '#050811',
                        border: '1px solid #111c2e',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        fontSize: '0.85rem',
                        color: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      <option value="Video processing error">Video Processing / Estimation Error</option>
                      <option value="Calibration coordinates issue">Skeletal Calibration Coordinates Offset</option>
                      <option value="PDF print display cutting">PDF Print & Export Page Break Clipping</option>
                      <option value="Account registration setup">Account Profile / Registration Setup</option>
                      <option value="General feedback query">General Telemetry & Feature Inquiries</option>
                    </select>
                  </div>

                  {/* Message input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Detailed Inquiry Description
                    </label>
                    <textarea
                      placeholder="Describe your issue or question in detail. PitchMind Engineers will respond via email..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={6}
                      required
                      style={{
                        background: '#050811',
                        border: '1px solid #111c2e',
                        borderRadius: '6px',
                        padding: '14px',
                        fontSize: '0.88rem',
                        color: '#ffffff',
                        outline: 'none',
                        resize: 'none',
                        lineHeight: 1.6,
                        fontFamily: 'var(--font-sans)',
                        transition: 'var(--transition-smooth)'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#111c2e'; }}
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={!supportMessage.trim()}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '14px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-glow)',
                      transition: 'var(--transition-smooth)',
                      opacity: !supportMessage.trim() ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                  >
                    <Send size={16} />
                    <span>DISPATCH SUPPORT EMAIL</span>
                  </button>

                </form>
              ) : (
                /* Success booked transition */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle size={52} color="var(--color-success)" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 230, 118, 0.4))' }} />
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Support Ticket Drafted!</h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.6, maxWidth: '420px' }}>
                      Your biomechanics support inquiry has been compiled. PitchMind has launched your native system email composer prefilled with your ticket details.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSupportMessage('');
                      setTicketSubmitted(false);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: 'var(--border-glass)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      padding: '10px 20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    SUBMIT ANOTHER TICKET
                  </button>
                </div>
              )}
            </div>

            {/* Right side contact information / instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="var(--color-accent)" />
                  <span>Direct Team Support</span>
                </strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Alternatively, you can contact the PitchMind Biomechanics Engineering team directly via email:
                </p>
                <a 
                  href="mailto:support@pitchmind.com" 
                  style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: 'var(--color-accent)', 
                    background: 'rgba(0, 240, 255, 0.04)', 
                    border: '1px solid rgba(0, 240, 255, 0.15)', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  support@pitchmind.com
                </a>
              </div>

              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--color-primary)" />
                  <span>Active Account Details</span>
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Player Name:</span>
                    <strong style={{ color: '#ffffff' }}>{welcomeName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Account Stance:</span>
                    <strong style={{ color: '#ffffff' }}>Right-Hand Batsman</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Registered Email:</span>
                    <strong style={{ color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                      {user?.email || 'pavan@pitchmind.com'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
