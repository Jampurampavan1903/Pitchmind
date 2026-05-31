import { create } from 'zustand';
import { apiClient } from '../lib/api-client';

export interface AgeGate {
  classification: string;
  rules: string;
  badge: string;
}

export interface NutritionBreakdown {
  bmr_kcal: number;
  tdee_kcal: number;
  activity_mode: string;
  activity_multiplier: number;
  protein_g: number;
  protein_kcal: number;
  fat_g: number;
  fat_kcal: number;
  carb_g: number;
  carb_kcal: number;
  hydration_liters: number;
}

export interface WorkoutExercise {
  name: string;
  reps: string;
  description: string;
  type: 'Warmup' | 'Conditioning' | 'Cooldown';
  target: string;
}

export interface RecoveryFood {
  item: string;
  dosage: string;
  benefit: string;
}

export interface ConditioningData {
  user_id: string;
  athlete_name: string;
  age_years: number;
  age_gate: AgeGate;
  nutrition: NutritionBreakdown;
  workouts: WorkoutExercise[];
  recovery_foods: RecoveryFood[];
  reported_pain_index: number;
  pain_lockout: boolean;
}

interface ConditioningState {
  activityMode: 'rest' | 'training' | 'match';
  dailyData: ConditioningData | null;
  painIndex: number;
  loading: boolean;
  error: string | null;
  fetchDailyData: (mode?: 'rest' | 'training' | 'match') => Promise<void>;
  setActivityMode: (mode: 'rest' | 'training' | 'match') => Promise<void>;
  reportPain: (painScore: number) => Promise<void>;
}

// Client-side Sports Science Fallback Engine for zero-latency offline performance
const getOfflineFallback = (
  mode: 'rest' | 'training' | 'match',
  painScore: number,
  profile: any = null
): ConditioningData => {
  const weight = profile?.weight_kg || 75;
  const height = profile?.height_cm || 180;
  const age = profile?.age_years || 20;
  const name = profile?.full_name || 'Grassroots Athlete';

  // Mifflin-St Jeor equation: 10*75 + 6.25*180 - 5*20 + 5 = 1780
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultipliers = { rest: 1.20, training: 1.55, match: 1.725 };
  const mult = activityMultipliers[mode];
  const tdee = Math.ceil(bmr * mult);

  const protein_g = Math.ceil(2.0 * weight);
  const protein_kcal = protein_g * 4;
  const fat_kcal = Math.ceil(0.25 * tdee);
  const fat_g = Math.ceil(fat_kcal / 9);
  const carb_kcal = Math.max(0, tdee - protein_kcal - fat_kcal);
  const carb_g = Math.ceil(carb_kcal / 4);

  // Default age-gate rules
  let ageGate: AgeGate = {
    classification: 'Adult Performance Prep',
    rules: 'Advanced progressive bands, bodyweight, and controlled weight training allowed. Emphasize eccentric control.',
    badge: 'Full Athletic Prep'
  };
  if (age < 14) {
    ageGate = {
      classification: 'Youth Mobility Level',
      rules: 'Strictly bodyweight-only exercises. Focus is coordination, stability, and speed. Zero resistance weight loading.',
      badge: 'Bodyweight Only'
    };
  } else if (age < 18) {
    ageGate = {
      classification: 'Teen Resistance Level',
      rules: 'Bodyweight and light elastic resistance band exercises allowed. Strictly no heavy barbell or spinal loading.',
      badge: 'Light Elastic Bands'
    };
  }

  // Pre-vetted workouts matching latest cover drive anomalies
  const workouts: WorkoutExercise[] = [
    {
      name: age < 14 ? "Glute Hip Bridges (Bodyweight)" : "Banded Terminal Knee Extensions (TKEs)",
      reps: "3 sets x 15 reps",
      description: age < 14 
        ? "Lie on your back, lift your hips high, squeezing glutes at the top." 
        : "Loop resistance band behind knee, step back, and extend to full brace.",
      type: "Conditioning",
      target: "Collapsed Knee Brace"
    },
    {
      name: "Half-Kneeling Thoracic Windmills",
      reps: "2 sets x 8 reps",
      description: "Improves separation mobility between chest and pelvic axis.",
      type: "Warmup",
      target: "Rotational Sequence Leak"
    },
    {
      name: age < 14 ? "Single-Leg Airplane Stance" : "Single-Leg Stance Balance (Eyes Closed)",
      reps: "2 sets x 30s holds",
      description: "Develops deep ankle proprioceptors and centers head alignment.",
      type: "Warmup",
      target: "Balance Instability"
    },
    {
      name: "Knee-to-Wall Calf Mobilizer",
      reps: "2 sets x 45s holds",
      description: "Stretches deep soleus muscle to improve ankle flex range, decreasing knee strain.",
      type: "Cooldown",
      target: "Collapsed Knee Brace"
    }
  ];

  return {
    user_id: 'mock_user_id',
    athlete_name: name,
    age_years: age,
    age_gate: ageGate,
    nutrition: {
      bmr_kcal: Math.ceil(bmr),
      tdee_kcal: tdee,
      activity_mode: mode,
      activity_multiplier: mult,
      protein_g,
      protein_kcal,
      fat_g,
      fat_kcal,
      carb_g,
      carb_kcal,
      hydration_liters: Number((0.04 * weight).toFixed(2))
    },
    workouts,
    recovery_foods: [
      { item: "Turmeric Golden Tea", dosage: "1 cup (evening)", benefit: "Curcumin reduction of joint fluid inflammation" },
      { item: "Hydration Electrolyte Blend", dosage: "500ml pre-nets", benefit: "Restores ionic cellular potential to prevent cramping" },
      { item: "Collagen Protein Boost", dosage: "20g post-workout", benefit: "Supports tendon reconstruction" }
    ],
    reported_pain_index: painScore,
    pain_lockout: painScore >= 3
  };
};

export const useConditioningStore = create<ConditioningState>((set, get) => ({
  activityMode: 'rest',
  dailyData: null,
  painIndex: 0,
  loading: false,
  error: null,

  fetchDailyData: async (mode) => {
    const selectedMode = mode || get().activityMode;
    set({ loading: true, error: null });

    // Try loading cached profile details if available to power fallback BMR
    let cachedProfile: any = null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('pitchmind_token') : null;

    try {
      // Load daily conditioning sheets from backend REST API
      const queryParam = `?activity_mode=${selectedMode}`;
      const response = await apiClient.get<ConditioningData>(
        `/api/v1/conditioning/daily${queryParam}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      set({
        dailyData: response,
        painIndex: response.reported_pain_index,
        activityMode: selectedMode,
        loading: false
      });
    } catch (err) {
      console.warn('[Offline Engine] Server unreachable. Reverting to local sports-science algorithms:', err);
      
      // Calculate clinical metrics locally to support poor connection net sessions
      const localResponse = getOfflineFallback(selectedMode, get().painIndex, cachedProfile);
      set({
        dailyData: localResponse,
        activityMode: selectedMode,
        loading: false
      });
    }
  },

  setActivityMode: async (mode) => {
    set({ activityMode: mode });
    await get().fetchDailyData(mode);
  },

  reportPain: async (painScore) => {
    set({ painIndex: painScore, loading: true });
    const token = typeof window !== 'undefined' ? localStorage.getItem('pitchmind_token') : null;

    try {
      const response = await apiClient.post<{ pain_index: number; pain_lockout: boolean; message: string }>(
        '/api/v1/conditioning/report-pain',
        { pain_index: painScore },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      if (get().dailyData) {
        set({
          dailyData: {
            ...get().dailyData!,
            reported_pain_index: response.pain_index,
            pain_lockout: response.pain_lockout
          },
          loading: false
        });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.warn('[Offline Engine] Failed to record pain on backend. Locking client store locally:', err);
      
      // Enforce local offline safety lockouts
      if (get().dailyData) {
        set({
          dailyData: {
            ...get().dailyData!,
            reported_pain_index: painScore,
            pain_lockout: painScore >= 3
          },
          loading: false
        });
      } else {
        set({ loading: false });
      }
    }
  }
}));
