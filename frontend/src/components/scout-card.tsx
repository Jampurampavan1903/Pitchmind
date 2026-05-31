'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  MapPin, 
  UserCheck, 
  Share2, 
  CheckCircle,
  HelpCircle,
  Activity
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

interface RadarAxisItem {
  subject: string;
  value: number;
  fullMark: number;
}

interface ScoutCardData {
  analysis_id: string;
  player_name: string;
  role: string;
  avatar_url: string | null;
  grassroots_location: string;
  stance: string;
  scouting_index_opt_in: boolean;
  overall_grade: number;
  radar_axes: RadarAxisItem[];
}

interface ScoutCardProps {
  data: ScoutCardData;
}

export default function ScoutCard({ data }: ScoutCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/analysis/${data.analysis_id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const initials = data.player_name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'P';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-card hover-glow"
      style={{
        width: '100%',
        maxWidth: '380px',
        background: 'linear-gradient(135deg, rgba(5, 8, 17, 0.85) 0%, rgba(16, 185, 129, 0.04) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.05)',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
        color: '#ffffff'
      }}
    >
      {/* Dynamic Holographic Overlay Lines */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.5) 50%, transparent 100%)',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)'
        }}
      />

      {/* Card Header Credentials */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{ 
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px', 
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Award size={18} color="var(--color-primary)" />
          </div>
          <div>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              PRO SCOUT PROFILE
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', marginTop: '1px' }}>
              PITCHMIND TELEMETRY
            </h4>
          </div>
        </div>

        {/* Dynamic FIFA style Grade Badge */}
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            border: '1.5px solid #34d399'
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
            {Math.round(data.overall_grade)}
          </span>
          <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
            OVR
          </span>
        </div>
      </div>

      {/* Player Avatar and Bio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #00f0ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#ffffff',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
          }}
        >
          {initials}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
          <h3 
            style={{ 
              fontSize: '1.15rem', 
              fontWeight: 800, 
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {data.player_name}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
            <MapPin size={11} color="var(--color-primary)" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.grassroots_location}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 800, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
              {data.stance}
            </span>
            {data.scouting_index_opt_in && (
              <span style={{ fontSize: '0.58rem', fontWeight: 800, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <UserCheck size={9} />
                <span>INDEXED</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Radar Chart Display Block */}
      <div 
        style={{ 
          width: '100%', 
          height: '190px', 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radar_axes}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 9, fontWeight: 700 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 7 }} 
              axisLine={false} 
            />
            <Radar
              name="Athlete Metrics"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.18}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Share Actions Grid */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          onClick={handleShare}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 240, 255, 0.04) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid #10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.25)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 240, 255, 0.04) 100%)'; }}
        >
          {copied ? <CheckCircle size={14} color="var(--color-primary)" /> : <Share2 size={14} />}
          <span>{copied ? 'COPIED LINK!' : 'SHARE ATHLETE CARD'}</span>
        </button>
      </div>
    </motion.div>
  );
}
