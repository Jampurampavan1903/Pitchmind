import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ProfileResponse {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_hand: string;
  country: string | null;
  state: string | null;
  district: string | null;
  city_town: string | null;
  scout_opt_in: boolean;
}

interface UserResponse {
  id: string;
  email: string | null;
  phone_number: string | null;
  is_verified: boolean;
  profile: ProfileResponse | null;
}

interface SignupResponse {
  verification_id: string;
  method: string;
  message: string;
}

interface VerifyOtpResponse {
  access_token: string;
  is_verified: boolean;
  user_id: string;
  has_profile: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserResponse | null;
  profile: ProfileResponse | null;
  verificationId: string | null;
  step: 'signup' | 'otp' | 'profile';
  isLoading: boolean;
  error: string | null;
  signup: (email?: string, phoneNumber?: string) => Promise<void>;
  verifyOtp: (otpCode: string) => Promise<boolean>;
  completeProfile: (
    fullName: string,
    role: string,
    avatarUrl?: string,
    heightCm?: number,
    weightKg?: number,
    dominantHand?: string,
    country?: string,
    state?: string,
    district?: string,
    cityTown?: string,
    scoutOptIn?: boolean
  ) => Promise<void>;
  logout: () => void;
  initializeSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  token: null,
  user: null,
  profile: null,
  verificationId: null,
  step: 'signup',
  isLoading: false,
  error: null,

  signup: async (email, phoneNumber) => {
    set({ isLoading: true, error: null });
    
    // 1. Supabase Hybrid Auth Pipeline
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email || undefined,
          phone: phoneNumber || undefined
        });
        if (error) throw error;
        
        set({ 
          verificationId: email || phoneNumber || 'supabase-session', 
          step: 'otp',
          isLoading: false 
        });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Supabase OTP dispatch failed';
        set({ error: msg, isLoading: false });
        throw err;
      }
    }

    // 2. Standard Local REST API Fallback
    try {
      const response = await apiClient.post<SignupResponse>('/api/v1/auth/signup', {
        email: email || null,
        phone_number: phoneNumber || null
      });
      set({ 
        verificationId: response.verification_id, 
        step: 'otp',
        isLoading: false 
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP code';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  verifyOtp: async (otpCode) => {
    const { verificationId } = get();
    if (!verificationId) {
      set({ error: 'No active session found' });
      return false;
    }

    set({ isLoading: true, error: null });

    // 1. Supabase Hybrid Auth Pipeline
    if (isSupabaseConfigured && supabase) {
      try {
        const isEmail = verificationId.includes('@');
        const { data, error } = await supabase.auth.verifyOtp({
          email: isEmail ? verificationId : undefined,
          phone: !isEmail ? verificationId : undefined,
          token: otpCode,
          type: isEmail ? 'signup' : 'sms'
        });
        if (error) throw error;

        const sessionToken = data.session?.access_token || null;
        if (!sessionToken) {
          throw new Error('Supabase did not return a valid session token');
        }

        // Cache token in local storage
        if (typeof window !== 'undefined') {
          localStorage.setItem('pitchmind_token', sessionToken);
        }

        set({
          token: sessionToken,
          isLoading: false
        });

        // Query backend database profile to check completed onboarding
        let hasProfile = false;
        try {
          const profileCheck = await apiClient.get<UserResponse>('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${sessionToken}` }
          });
          hasProfile = Boolean(profileCheck && profileCheck.profile);
        } catch {
          hasProfile = false;
        }

        if (hasProfile) {
          await get().initializeSession();
          return true;
        } else {
          set({ step: 'profile' });
          return false;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Supabase OTP verification failed';
        set({ error: msg, isLoading: false });
        return false;
      }
    }

    // 2. Standard Local REST API Fallback
    try {
      const response = await apiClient.post<VerifyOtpResponse>('/api/v1/auth/verify-otp', {
        verification_id: verificationId,
        otp_code: otpCode
      });

      // Cache token in local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pitchmind_token', response.access_token);
      }

      set({
        token: response.access_token,
        isLoading: false
      });

      if (response.has_profile) {
        // If they already completed profile, log in immediately
        await get().initializeSession();
        return true;
      } else {
        // If profile is missing, advance to role profile completion step
        set({ step: 'profile' });
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP code';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  completeProfile: async (
    fullName,
    role,
    avatarUrl,
    heightCm,
    weightKg,
    dominantHand = 'right',
    country,
    state,
    district,
    cityTown,
    scoutOptIn = false
  ) => {
    const { token } = get();
    if (!token) {
      set({ error: 'Unauthorized profile edit attempt' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<ProfileResponse>(
        '/api/v1/auth/complete-profile',
        {
          full_name: fullName,
          role,
          avatar_url: avatarUrl || null,
          height_cm: heightCm || null,
          weight_kg: weightKg || null,
          dominant_hand: dominantHand,
          country: country || null,
          state: state || null,
          district: district || null,
          city_town: cityTown || null,
          scout_opt_in: scoutOptIn
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      set({
        profile: response,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to complete profile registration';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pitchmind_token');
    }
    set({
      isAuthenticated: false,
      token: null,
      user: null,
      profile: null,
      verificationId: null,
      step: 'signup',
      error: null
    });
  },

  initializeSession: async () => {
    if (typeof window === 'undefined') return;
    const cachedToken = localStorage.getItem('pitchmind_token');
    if (!cachedToken) return;

    set({ isLoading: true, token: cachedToken });
    try {
      const response = await apiClient.get<UserResponse>('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${cachedToken}` }
      });

      if (response.profile) {
        set({
          user: response,
          profile: response.profile,
          isAuthenticated: true,
          step: 'signup', // Reset step for future logs
          isLoading: false
        });
      } else {
        // If token exists but profile wasn't completed, prompt profile setup
        set({
          user: response,
          step: 'profile',
          isLoading: false
        });
      }
    } catch (err) {
      console.warn('Cached session expired or invalid. Cleared session.', err);
      localStorage.removeItem('pitchmind_token');
      set({
        isAuthenticated: false,
        token: null,
        user: null,
        profile: null,
        step: 'signup',
        isLoading: false
      });
    }
  }
}));
