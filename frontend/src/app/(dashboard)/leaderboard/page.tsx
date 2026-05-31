'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Search, 
  MapPin, 
  Award, 
  Sparkles, 
  User, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { ROUTES } from '../../../lib/constants';
import ScoutCard from '../../../components/scout-card';

interface LeaderboardEntry {
  rank: number;
  player_name: string;
  avatar_url: string | null;
  role: string;
  country: string;
  state: string;
  district: string;
  city_town: string;
  stroke_type: string;
  stroke_name: string;
  pci_score: number;
  overall_score: number;
  analysis_id: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [strokeType, setStrokeType] = useState<string>('cover_drive');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('all');

  const strokeOptions = [
    { value: 'cover_drive', label: "Virat Kohli's Cover Drive", icon: 'VK' },
    { value: 'pull_shot', label: "Rohit Sharma's Pull Shot", icon: 'RS' },
    { value: 'cut_shot', label: "Kane Williamson's Late Cut", icon: 'KW' },
    { value: 'sweep_shot', label: "Joe Root's Sweep Shot", icon: 'JR' },
  ];

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      const url = `/api/v1/leaderboards?stroke_type=${strokeType}${selectedState !== 'all' ? `&state=${encodeURIComponent(selectedState)}` : ''}`;
      const data = await apiClient.get<LeaderboardEntry[]>(url);
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [strokeType, selectedState]);

  const filteredEntries = entries.filter(entry => 
    entry.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.city_town.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Header Banner */}
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy color="var(--color-accent)" size={28} />
            <span>Global Biomechanical Leaderboard</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Compare your Postural Congruency Index (PCI) against the world's best grassroots talent and elite pros.
          </p>
        </div>
      </div>

      {/* Grid Layout: Top Selector Bars, Left Leaderboard, Right Pro Model Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
        
        {/* Left Column: Rankings & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Stroke Selector Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {strokeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStrokeType(opt.value)}
                style={{
                  background: strokeType === opt.value 
                    ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)' 
                    : 'rgba(5, 8, 17, 0.5)',
                  border: strokeType === opt.value 
                    ? '1px solid var(--color-accent)' 
                    : '1px solid #111c2e',
                  borderRadius: '10px',
                  padding: '14px 10px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: strokeType === opt.value ? 'var(--shadow-glow)' : 'none',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: strokeType === opt.value ? 'var(--color-accent)' : 'rgba(255,255,255,0.03)',
                  color: strokeType === opt.value ? '#050811' : 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 800
                }}>
                  {opt.icon}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Search & Location Filter Bar */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-secondary)' }} size={16} />
              <input
                type="text"
                placeholder="Search by player name, city, or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#050811',
                  border: '1px solid #111c2e',
                  borderRadius: '6px',
                  padding: '8px 12px 8px 36px',
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
              />
            </div>
            
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                background: '#050811',
                border: '1px solid #111c2e',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                color: '#ffffff',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer'
              }}
            >
              <option value="all">All States</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
            </select>
          </div>

          {/* Leaderboard Table Glass Card */}
          <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
                <Activity className="animate-spin" color="var(--color-accent)" size={24} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Loading biomechanical scoreboard...</span>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '8px' }}>
                <Award size={36} color="var(--color-text-secondary)" />
                <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>No entries matching filter</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Record a session to set the first score!</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #111c2e', background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', width: '80px' }}>Rank</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Batsman</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Grassroots Demographics</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>PCI Match</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr 
                      key={entry.analysis_id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Rank Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: entry.rank === 1 ? 'linear-gradient(135deg, #ffd700 0%, #cca100 100%)' :
                                      entry.rank === 2 ? 'linear-gradient(135deg, #c0c0c0 0%, #8a8a8a 100%)' :
                                      entry.rank === 3 ? 'linear-gradient(135deg, #cd7f32 0%, #9c5c21 100%)' :
                                      'rgba(255,255,255,0.03)',
                          color: entry.rank <= 3 ? '#050811' : 'var(--color-text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 800
                        }}>
                          #{entry.rank}
                        </div>
                      </td>
                      
                      {/* Athlete Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0, 240, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            <User size={16} color="var(--color-text-secondary)" />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>{entry.player_name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textTransform: 'capitalize' }}>{entry.role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          <MapPin size={13} color="var(--color-accent)" />
                          <span>{entry.city_town}, {entry.district} ({entry.state})</span>
                        </div>
                      </td>

                      {/* PCI score Badge Column */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '4px',
                            color: entry.pci_score >= 90.0 ? '#10b981' : entry.pci_score >= 75.0 ? '#f59e0b' : '#ef4444',
                            background: entry.pci_score >= 90.0 ? 'rgba(16,185,129,0.08)' : entry.pci_score >= 75.0 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${entry.pci_score >= 90.0 ? 'rgba(16,185,129,0.2)' : entry.pci_score >= 75.0 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`
                          }}>
                            {entry.pci_score.toFixed(1)}% Match
                          </span>
                          
                          <Link 
                            href={`/analysis/${entry.analysis_id}`}
                            style={{
                              color: 'var(--color-text-secondary)',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* Right Column: Active Pro Benchmark Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Benchmark Model
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredEntries.length > 0 ? (
              <ScoutCard 
                data={{
                  analysis_id: filteredEntries[0].analysis_id,
                  player_name: filteredEntries[0].player_name,
                  role: filteredEntries[0].role.toUpperCase(),
                  avatar_url: filteredEntries[0].avatar_url,
                  grassroots_location: `${filteredEntries[0].city_town}, ${filteredEntries[0].district}, ${filteredEntries[0].state}`,
                  stance: 'Right-Hand Batsman',
                  scouting_index_opt_in: true,
                  overall_grade: filteredEntries[0].overall_score,
                  radar_axes: [
                    { subject: "Congruency (PCI)", value: filteredEntries[0].pci_score, fullMark: 100 },
                    { subject: "Kinetic Sequence", value: 88, fullMark: 100 },
                    { subject: "Balance Quotient", value: 85, fullMark: 100 },
                    { subject: "Injury Safety", value: 95, fullMark: 100 },
                    { subject: "Length Judgment", value: 82, fullMark: 100 }
                  ]
                }}
              />
            ) : (
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>No active ranked grassroots scout card to display.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
