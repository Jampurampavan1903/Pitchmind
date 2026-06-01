'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { 
  Plus, 
  ChevronRight, 
  Smartphone, 
  Mail, 
  KeyRound, 
  User, 
  ShieldCheck,
  Zap,
  Activity,
  ArrowLeft
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { 
    step, 
    signup, 
    verifyOtp, 
    completeProfile, 
    isLoading, 
    error 
  } = useAuthStore();

  const [inputVal, setInputVal] = useState('');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  
  // OTP digits state
  const [otpDigits, setOtpDigits] = useState<string[]>([]);
  const otpRefs = useRef<HTMLInputElement[]>([]);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'batsman' | 'bowler' | 'wicket_keeper' | 'coach'>('batsman');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // 🆕 Grassroots location and physical specifications
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [dominantHand, setDominantHand] = useState<'right' | 'left'>('right');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [cityTown, setCityTown] = useState('');
  const [scoutOptIn, setScoutOptIn] = useState(false);

  // Clear inputs on step change
  useEffect(() => {
    if (step === 'otp') {
      const length = method === 'email' ? 8 : 6;
      setOtpDigits(Array(length).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step, method]);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) return;
    
    if (method === 'phone') {
      const trimmedInput = inputVal.trim();
      const fullPhoneNumber = trimmedInput.startsWith('+') ? trimmedInput : `${countryCode}${trimmedInput}`;
      await signup(undefined, fullPhoneNumber);
    } else {
      await signup(inputVal, undefined);
    }
  };


  const handleOtpChange = (value: string, index: number) => {
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    const otpLength = method === 'email' ? 8 : 6;

    // Focus next input
    if (value !== '' && index < otpLength - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit OTP once all digits are loaded
    const fullCode = newDigits.join('');
    if (fullCode.length === otpLength) {
      handleOtpSubmit(fullCode);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      // Focus previous input on backspace
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (code: string) => {
    await verifyOtp(code);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;
    await completeProfile(
      fullName,
      selectedRole,
      avatarUrl,
      heightCm,
      weightKg,
      dominantHand,
      country,
      state,
      district,
      cityTown,
      scoutOptIn
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'radial-gradient(circle at center, #090e17 0%, #030712 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflowY: 'auto'
      }}
    >
      <div
        className="premium-card"
        style={{
          width: '100%',
          maxWidth: step === 'profile' ? '680px' : '440px',
          padding: '36px var(--spacing-lg)',
          background: 'rgba(9, 14, 23, 0.85)',
          border: '1px solid #111c2e',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-card), 0 0 50px rgba(15, 164, 127, 0.05)',
          transition: 'var(--transition-smooth)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Branding Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          {/* Logo illustration */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Activity size={28} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>
            PITCH<span style={{ color: 'var(--color-primary)' }}>MIND</span>
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Coach . Analyze . Improve
          </span>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: 'var(--color-danger)',
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            {error}
          </div>
        )}

        {/* STEP 1: Phone / Email Signup */}
        {step === 'signup' && (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6' }}>Create Your Account</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Enter your details to receive a 6-digit verification code.
              </p>
            </div>

            {/* Selector Method */}
            <div style={{ display: 'flex', background: '#030712', border: '1px solid #111c2e', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => { setMethod('phone'); setInputVal(''); }}
                style={{
                  flex: 1,
                  background: method === 'phone' ? 'var(--color-primary)' : 'transparent',
                  color: method === 'phone' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Smartphone size={14} />
                <span>Phone Number</span>
              </button>
              <button
                type="button"
                onClick={() => { setMethod('email'); setInputVal(''); }}
                style={{
                  flex: 1,
                  background: method === 'email' ? 'var(--color-primary)' : 'transparent',
                  color: method === 'email' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Mail size={14} />
                <span>Gmail Account</span>
              </button>
            </div>

            {/* Form Input Capsule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {method === 'phone' ? 'Mobile Phone Number' : 'Gmail / Email Address'}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#030712',
                  border: '1px solid #111c2e',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {method === 'phone' ? (
                  <>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        paddingRight: '4px',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <option value="+91" style={{ background: '#090e17', color: '#fff' }}>IN (+91)</option>
                      <option value="+61" style={{ background: '#090e17', color: '#fff' }}>AU (+61)</option>
                      <option value="+44" style={{ background: '#090e17', color: '#fff' }}>UK (+44)</option>
                      <option value="+92" style={{ background: '#090e17', color: '#fff' }}>PK (+92)</option>
                      <option value="+27" style={{ background: '#090e17', color: '#fff' }}>ZA (+27)</option>
                      <option value="+64" style={{ background: '#090e17', color: '#fff' }}>NZ (+64)</option>
                      <option value="+94" style={{ background: '#090e17', color: '#fff' }}>LK (+94)</option>
                      <option value="+880" style={{ background: '#090e17', color: '#fff' }}>BD (+880)</option>
                      <option value="+1" style={{ background: '#090e17', color: '#fff' }}>US/CA (+1)</option>
                      <option value="+971" style={{ background: '#090e17', color: '#fff' }}>AE (+971)</option>
                      <option value="+353" style={{ background: '#090e17', color: '#fff' }}>IE (+353)</option>
                      <option value="+263" style={{ background: '#090e17', color: '#fff' }}>ZW (+263)</option>
                    </select>
                    <div style={{ width: '1px', height: '14px', background: '#111c2e', margin: '0 4px' }} />
                    <input
                      type="tel"
                      placeholder="Enter mobile number"

                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'var(--font-sans)'
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Mail size={16} color="var(--color-text-secondary)" />
                    <input
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'var(--font-sans)'
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputVal}
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                opacity: isLoading || !inputVal ? 0.6 : 1,
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
              <ChevronRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Code */}
        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6' }}>Verification Required</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Please enter the {method === 'email' ? '8-character' : '6-digit'} OTP code sent to your account.
              </p>
            </div>

            {/* OTP Digits Grid */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%' }}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => { otpRefs.current[idx] = el as HTMLInputElement; }}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  style={{
                    width: method === 'email' ? '32px' : '44px',
                    height: '48px',
                    background: '#030712',
                    border: '1px solid #111c2e',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    outline: 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#111c2e'; }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <span>
                  Didn't receive code?{' '}
                  <strong 
                    onClick={async () => {
                      if (!inputVal) return;
                      if (method === 'phone') {
                        const trimmedInput = inputVal.trim();
                        const fullPhoneNumber = trimmedInput.startsWith('+') ? trimmedInput : `${countryCode}${trimmedInput}`;
                        await signup(undefined, fullPhoneNumber);
                      } else {
                        await signup(inputVal, undefined);
                      }
                    }}
                    style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                  >
                    Resend Code
                  </strong>
                </span>
              </div>
            </div>

          </div>
        )}

        {/* STEP 3: Complete Sports Profile */}
        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6' }}>Complete Your Athletic Profile</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Set your name and select your athletic focus role in PitchMind.
              </p>
            </div>

            {/* Profile Picture Uploader */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div 
                onClick={() => document.getElementById('avatar-file-input')?.click()}
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.02)',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                    <Plus size={20} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Upload</span>
                  </div>
                )}
              </div>
              <input 
                id="avatar-file-input"
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatarUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Add a profile picture (Genuine & happy touch!)
              </span>
            </div>

            {/* Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Full Name</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#030712',
                  border: '1px solid #111c2e',
                  borderRadius: '8px',
                  padding: '10px 14px'
                }}
              >
                <User size={16} color="var(--color-text-secondary)" />
                <input
                  type="text"
                  placeholder="Enter full display name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>
            </div>

            {/* Physical Specifications */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Height (cm)</label>
                <input
                  type="number"
                  placeholder="Height"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  style={{
                    background: '#030712',
                    border: '1px solid #111c2e',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Weight (kg)</label>
                <input
                  type="number"
                  placeholder="Weight"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  style={{
                    background: '#030712',
                    border: '1px solid #111c2e',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Batting Stance</label>
                <select
                  value={dominantHand}
                  onChange={(e) => setDominantHand(e.target.value as any)}
                  style={{
                    background: '#030712',
                    border: '1px solid #111c2e',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    width: '100%',
                    appearance: 'auto'
                  }}
                >
                  <option value="right" style={{ background: '#090e17' }}>Right-Hand</option>
                  <option value="left" style={{ background: '#090e17' }}>Left-Hand</option>
                </select>
              </div>
            </div>

            {/* Location & Region Telemetry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Grassroots Location Telemetry</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Country</span>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      background: '#030712',
                      border: '1px solid #111c2e',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)',
                      appearance: 'auto'
                    }}
                  >
                    <option value="India" style={{ background: '#090e17' }}>India 🇮🇳</option>
                    <option value="Australia" style={{ background: '#090e17' }}>Australia 🇦🇺</option>
                    <option value="United Kingdom" style={{ background: '#090e17' }}>United Kingdom 🇬🇧</option>
                    <option value="South Africa" style={{ background: '#090e17' }}>South Africa 🇿🇦</option>
                    <option value="New Zealand" style={{ background: '#090e17' }}>New Zealand 🇳🇿</option>
                    <option value="Pakistan" style={{ background: '#090e17' }}>Pakistan 🇵🇰</option>
                    <option value="Sri Lanka" style={{ background: '#090e17' }}>Sri Lanka 🇱🇰</option>
                    <option value="Bangladesh" style={{ background: '#090e17' }}>Bangladesh 🇧🇩</option>
                    <option value="Zimbabwe" style={{ background: '#090e17' }}>Zimbabwe 🇿🇼</option>
                    <option value="United Arab Emirates" style={{ background: '#090e17' }}>UAE 🇦🇪</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>State / Province</span>
                  <input
                    type="text"
                    placeholder="e.g. Bihar, Uttar Pradesh, NSW"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    style={{
                      background: '#030712',
                      border: '1px solid #111c2e',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>District / Region</span>
                  <input
                    type="text"
                    placeholder="e.g. Mithila, Purvanchal, Midlands"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{
                      background: '#030712',
                      border: '1px solid #111c2e',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>City / Village Town</span>
                  <input
                    type="text"
                    placeholder="e.g. Ranchi, Alwar, Bunbury"
                    value={cityTown}
                    onChange={(e) => setCityTown(e.target.value)}
                    required
                    style={{
                      background: '#030712',
                      border: '1px solid #111c2e',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Grassroots Scouting Discovery Opt-In */}
            <div 
              style={{
                background: 'rgba(16, 185, 129, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
              onClick={() => setScoutOptIn(!scoutOptIn)}
            >
              <input
                type="checkbox"
                checked={scoutOptIn}
                onChange={() => {}} // handled by parent click
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--color-primary)',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                  Opt-In to Grassroots Talent Discovery Index 🌐
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                  Share my biomechanical metrics anonymously with professional cricket scouts, academies, and national selectors.
                </span>
              </div>
            </div>

            {/* Focus Role Selector Grid (4 Cards: Batsman, Bowler, Wicket Keeper, Coach) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select Your Focus Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  {
                    id: 'batsman',
                    name: 'Batsman',
                    desc: 'Stroke tracking, timing, and dynamic elbow angle analytics.',
                    icon: '🏏'
                  },
                  {
                    id: 'bowler',
                    name: 'Bowler',
                    desc: 'Release points, arm speeds, and trajectory curvatures.',
                    icon: '🥎'
                  },
                  {
                    id: 'wicket_keeper',
                    name: 'Wicket Keeper',
                    desc: 'Reflex responses, reach span setups, and diving vectors.',
                    icon: '🧤'
                  },
                  {
                    id: 'coach',
                    name: 'Coach',
                    desc: 'Manage squad logs, inspect nets stats, and write feedback.',
                    icon: '📋'
                  }
                ].map((roleObj) => {
                  const isRoleSelected = selectedRole === roleObj.id;
                  return (
                    <div
                      key={roleObj.id}
                      onClick={() => setSelectedRole(roleObj.id as any)}
                      style={{
                        background: '#030712',
                        border: isRoleSelected ? '2px solid var(--color-primary)' : '1px solid #111c2e',
                        boxShadow: isRoleSelected ? 'var(--shadow-glow)' : 'none',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'var(--transition-smooth)',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{roleObj.icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{roleObj.name}</span>
                        {isRoleSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', marginLeft: 'auto' }} />}
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.25 }}>
                        {roleObj.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !fullName}
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                opacity: isLoading || !fullName ? 0.6 : 1,
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              {isLoading ? 'Creating Profile...' : 'Complete Profile Setup'}
              <ShieldCheck size={18} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
