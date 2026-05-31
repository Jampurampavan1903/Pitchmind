'use client';

import React, { useEffect, useState } from 'react';
import { useConditioningStore } from '../../../stores/conditioning-store';
import { 
  Flame, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles,
  Droplet,
  HeartPulse
} from 'lucide-react';

export default function ConditioningPage() {
  const { 
    activityMode, 
    dailyData, 
    painIndex, 
    loading, 
    error,
    fetchDailyData, 
    setActivityMode, 
    reportPain 
  } = useConditioningStore();

  const [painSliderValue, setPainSliderValue] = useState(0);

  // Initialize store fetching on load
  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  // Sync slider state with store updates
  useEffect(() => {
    if (dailyData) {
      setPainSliderValue(dailyData.reported_pain_index);
    }
  }, [dailyData]);

  const handleModeChange = (mode: 'rest' | 'training' | 'match') => {
    setActivityMode(mode);
  };

  const handlePainSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setPainSliderValue(val);
  };

  const handlePainSubmit = () => {
    reportPain(painSliderValue);
  };

  if (loading && !dailyData) {
    return (
      <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(16, 185, 129, 0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Calculating sports-science calibrations...</p>
        </div>
        <style jsx global>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const data = dailyData;
  const isLocked = data?.pain_lockout || false;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER BANNER */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '4px' }}>Version 0.5 — Elite Athletic Hub</span>
          <h1 style={{ fontSize: '1.8rem', color: '#ffffff', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Biomechanical Conditioning & Joint Nutrition</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Daily safe routines mapped directly to physical anomalies and age-gated controls.
          </p>
        </div>
        
        {/* Dynamic Mode Toggles */}
        <div style={{ display: 'flex', background: '#090f19', border: '1px solid #112035', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {(['rest', 'training', 'match'] as const).map((mode) => {
            const isActive = activityMode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                style={{
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  border: 'none',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: isActive ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                {mode === 'rest' ? 'Rest Day' : mode === 'training' ? 'Netting Day' : 'Match Day'}
              </button>
            );
          })}
        </div>
      </div>

      {/* METRIC TOP SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* DAILY CALORIE RADIAL CARD */}
        <div 
          style={{
            background: 'var(--color-sidebar)',
            border: '1px solid #112035',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG Circle Gauge */}
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#112035" strokeWidth="8" />
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="transparent" 
                stroke="url(#calorie-glow-grad)" 
                strokeWidth="8" 
                strokeDasharray="314.16"
                strokeDashoffset={314.16 * (1 - 0.7)} // Demo offset
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="calorie-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                {data?.nutrition.tdee_kcal || 2400}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>
                Kcal Goal
              </span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '8px' }}>
                <Flame size={16} color="var(--color-primary)" />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block' }}>Daily Activity Burn</span>
                <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
                  {activityMode === 'rest' ? 'Low recovery load' : activityMode === 'training' ? 'Moderate nets burn' : 'Explosive match load'}
                </span>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #112035', paddingTop: '8px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Basal metabolism calculated at <strong style={{ color: '#ffffff' }}>{data?.nutrition.bmr_kcal || 1780} Kcal</strong>.
            </div>
          </div>
        </div>

        {/* NUTRITIONAL MACRO GAUGES */}
        <div 
          style={{
            background: 'var(--color-sidebar)',
            border: '1px solid #112035',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Macronutrient Target Breakdown</span>
            <span style={{ fontSize: '0.7rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>Protein Prioritized</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* CARBS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Carbohydrates (Sky Fuel)</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{data?.nutrition.carb_g || 250}g</span>
              </div>
              <div style={{ height: '6px', background: '#112035', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', background: '#0ea5e9', borderRadius: '3px', boxShadow: '0 0 8px rgba(14, 165, 233, 0.5)' }}></div>
              </div>
            </div>

            {/* PROTEIN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Protein (Joint Reconstruction)</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{data?.nutrition.protein_g || 150}g</span>
              </div>
              <div style={{ height: '6px', background: '#112035', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'var(--color-primary)', borderRadius: '3px', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }}></div>
              </div>
            </div>

            {/* FATS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Fats (Joint Lubricant)</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{data?.nutrition.fat_g || 67}g</span>
              </div>
              <div style={{ height: '6px', background: '#112035', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', background: '#f59e0b', borderRadius: '3px', boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* DUAL MAIN GRID CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* WORKOUT DRILL AND DRILL EXERCISES CARD */}
        <div 
          style={{
            background: 'var(--color-sidebar)',
            border: '1px solid #112035',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            boxShadow: 'var(--shadow-card)',
            minHeight: '400px'
          }}
        >
          {/* Lockout Overlay */}
          {isLocked && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(9, 15, 25, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
              }}
            >
              <div style={{ textAlign: 'center', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', width: 'fit-content' }}>
                  <ShieldAlert size={36} color="#ef4444" />
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Safety Lockout Activated</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                  Your reported pain index is $\ge 3/10$. Active biomechanical load exercises have been locked to prevent repetitive stress injury. 
                </p>
                <div style={{ background: '#ef4444', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                  PAUSE WORKOUT & SEEK PT
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Biomechanics Rehabilitation Routine</span>
            <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
              {data?.age_gate.classification || 'Youth Mobility'}
            </span>
          </div>

          {/* Age-gate rules warning */}
          <div style={{ background: '#090f19', border: '1px solid #112035', padding: '12px', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            <strong style={{ color: 'var(--color-primary)' }}>Safety Level Rules:</strong> {data?.age_gate.rules}
          </div>

          {/* Exercises list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.workouts.map((ex, idx) => (
              <div 
                key={idx}
                style={{
                  background: '#090f19',
                  border: '1px solid #112035',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '6px', borderRadius: '8px', color: '#0ea5e9', fontSize: '0.7rem', fontWeight: 800, width: '70px', textAlign: 'center', flexShrink: 0 }}>
                  {ex.type}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>{ex.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{ex.reps}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>{ex.description}</p>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                    Target: {ex.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NUTRITIONAL DIET DETAILS CARD & SAFETY VALVES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ANTI-INFLAMMATORY RECOVERY FOODS */}
          <div 
            style={{
              background: 'var(--color-sidebar)',
              border: '1px solid #112035',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplet size={16} color="#0ea5e9" /> Joint-Rehab Sports Nutrition
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data?.recovery_foods.map((food, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: '#090f19',
                    border: '1px solid #112035',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{food.item}</span>
                    <span style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 600 }}>{food.dosage}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {food.benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* Hydration helper */}
            <div 
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0.02) 100%)',
                border: '1px solid rgba(14, 165, 233, 0.2)',
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <Droplet size={20} color="#0ea5e9" />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Daily Hydration Target</span>
                <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>{data?.nutrition.hydration_liters || 3.0} Liters</span>
              </div>
            </div>
          </div>

          {/* THE SAFETY VALVE SORENESS SLIDER */}
          <div 
            style={{
              background: 'var(--color-sidebar)',
              border: '1px solid #112035',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={16} color="#ef4444" /> The Safety Soreness Valve
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', margin: '0 0 16px' }}>
              Are you feeling physical joint soreness or tendon strain today? Submit your pain rating to calibrate athletic boundaries.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Pain Score Index</span>
                <span 
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: 800, 
                    color: painSliderValue >= 3 ? '#ef4444' : '#10b981',
                    background: painSliderValue >= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 10px',
                    borderRadius: '6px'
                  }}
                >
                  {painSliderValue} / 10
                </span>
              </div>

              <input 
                type="range" 
                min="0" 
                max="10" 
                value={painSliderValue}
                onChange={handlePainSliderChange}
                style={{
                  width: '100%',
                  accentColor: painSliderValue >= 3 ? '#ef4444' : 'var(--color-primary)',
                  cursor: 'pointer'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                <span>0 - Perfect</span>
                <span>3 - Lockout Limit</span>
                <span>10 - Severe Pain</span>
              </div>

              <button
                onClick={handlePainSubmit}
                style={{
                  background: painSliderValue >= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: painSliderValue >= 3 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: painSliderValue >= 3 ? '#ef4444' : 'var(--color-primary)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = painSliderValue >= 3 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = painSliderValue >= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'; }}
              >
                Submit Pain Assessment Check-in
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
