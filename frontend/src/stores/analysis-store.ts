import { create } from 'zustand';
import { apiClient } from '../lib/api-client';

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface FrameLandmarks {
  frame_index: number;
  timestamp_ms: number;
  landmarks: Record<string, Landmark>;
  confidence: number;
}

export interface ElbowMetrics {
  max_backswing_angle: number;
  min_impact_angle: number;
  follow_through_angle: number;
  stability_score: number;
  is_dropped_elbow: boolean;
}

export interface HeadMetrics {
  movement_std_dev_px: number;
  eye_level_tilt_degrees: number;
  stability_score: number;
}

export interface StanceMetrics {
  width_to_shoulder_ratio: number;
  balance_score: number;
}

export interface FootworkMetrics {
  stride_length_px: number;
  timing_delay_ms: number;
  stride_ratio?: number;
  alignment_angle?: number;
  weight_transfer_pct?: number;
  is_step_across?: boolean;
}

export interface HipShoulderMetrics {
  peak_separation_degrees: number;
  separation_at_impact: number;
  power_score: number;
}

export interface KneeMetrics {
  angle_at_impact: number;
  min_angle: number;
  is_collapsed: boolean;
  brace_score: number;
}

export interface WristMetrics {
  roll_direction: string;
  max_roll_delta: number;
  roll_timing_pct: number;
  control_score: number;
}

export interface CentreOfMassMetrics {
  max_lateral_sway: number;
  avg_lateral_sway: number;
  sway_corridor_px: number;
  balance_score: number;
}

export interface BackliftMetrics {
  peak_height_ratio: number;
  loop_deviation: number;
  is_loopy: boolean;
  backlift_score: number;
}

export interface TimingMetrics {
  timing_delta_ms: number;
  rating: string;
  score: number;
}

export interface ContactMetrics {
  contact_zone: string;
  lateral_deviation_cm: number;
  height_deviation_cm: number;
  accuracy_score: number;
}

export interface TacticalAlternative {
  shot_name: string;
  risk_rating: number;
  tactical_purpose: string;
}

export interface LengthJudging {
  ball_length_category: string;
  judging_rating: string;
  judging_score: number;
  pitching_distance_meters?: number;
  flaw_detected: string | null;
}

export interface KineticSegmentTiming {
  segment_name: string;
  peak_velocity: number;
  peak_timestamp_ms: number;
  sequence_rank: number;
}

export interface KineticChainMetrics {
  sequence_score: number;
  is_out_of_order: boolean;
  power_leaks: string[];
  segments: KineticSegmentTiming[];
}

export interface BattingMetrics {
  elbow: ElbowMetrics;
  head: HeadMetrics;
  stance: StanceMetrics;
  footwork: FootworkMetrics;
  hip_shoulder: HipShoulderMetrics;
  knee: KneeMetrics;
  wrist: WristMetrics;
  centre_of_mass: CentreOfMassMetrics;
  backlift: BackliftMetrics;
  
  // V1.2 Advanced Fields
  timing?: TimingMetrics;
  contact?: ContactMetrics;
  tactical_alternatives?: TacticalAlternative[];
  length_judging?: LengthJudging;
  kinetic_chain?: KineticChainMetrics; // 🆕 V0.4 Kinematic Sequence
  
  overall_score: number;
  stroke_type?: string;
  stroke_name?: string;
}

export interface CoachingInsight {
  category: string;
  severity: string;
  title: string;
  message: string;
  recommendation: string;
}

export interface DeliveryResult {
  delivery_index: number;
  frame_range: [number, number];
  metrics: BattingMetrics;
  coaching: CoachingInsight[];
  landmarks?: FrameLandmarks[];
}

export interface AnalysisResponse {
  id: string;
  video_id: string;
  status: string;
  metrics: BattingMetrics;
  landmarks: FrameLandmarks[];
  coaching: CoachingInsight[];
  deliveries?: DeliveryResult[];
  delivery_count?: number;
  frame_count: number;
  processing_time_seconds: number;
  completed_at: string;
  video_url: string;
  frames: { index: number; url: string }[];
}

interface AnalysisState {
  currentAnalysis: AnalysisResponse | null;
  activeFrameIndex: number;
  activeDeliveryIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  playbackSpeed: number;
  
  fetchAnalysis: (id: string) => Promise<void>;
  setActiveFrameIndex: (index: number) => void;
  setActiveDeliveryIndex: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  deleteAnalysis: (id: string) => Promise<void>;
  togglePlay: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => {
  let playInterval: NodeJS.Timeout | null = null;

  return {
    currentAnalysis: null,
    activeFrameIndex: 0,
    activeDeliveryIndex: 0,
    isPlaying: false,
    isLoading: false,
    error: null,
    playbackSpeed: 1.0,

    fetchAnalysis: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.get<AnalysisResponse>(`/api/v1/analysis/${id}`);
        const startFrame = response.deliveries?.[0]?.frame_range[0] ?? 0;
        set({ 
          currentAnalysis: response, 
          isLoading: false, 
          activeFrameIndex: startFrame,
          activeDeliveryIndex: 0
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch analysis details';
        set({ error: message, isLoading: false });
      }
    },

    setActiveFrameIndex: (index) => {
      const { currentAnalysis, activeDeliveryIndex } = get();
      if (!currentAnalysis) return;
      
      const delivery = currentAnalysis.deliveries?.[activeDeliveryIndex];
      const startFrame = delivery ? delivery.frame_range[0] : 0;
      const endFrame = delivery ? delivery.frame_range[1] : (currentAnalysis.frame_count - 1);
      
      if (index >= startFrame && index <= endFrame) {
        set({ activeFrameIndex: index });
      }
    },

    setActiveDeliveryIndex: (index) => {
      const { currentAnalysis } = get();
      if (!currentAnalysis || !currentAnalysis.deliveries) return;
      const delivery = currentAnalysis.deliveries[index];
      if (delivery) {
        set({ 
          activeDeliveryIndex: index,
          activeFrameIndex: delivery.frame_range[0]
        });
        
        // Restart playback in the new delivery context if playing
        const { isPlaying, setPlaying } = get();
        if (isPlaying) {
          setPlaying(true);
        }
      }
    },

    setPlaying: (playing) => {
      const { currentAnalysis, activeFrameIndex, activeDeliveryIndex, playbackSpeed } = get();
      if (!currentAnalysis) return;

      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }

      if (playing) {
        const delivery = currentAnalysis.deliveries?.[activeDeliveryIndex];
        const startFrame = delivery ? delivery.frame_range[0] : 0;
        const endFrame = delivery ? delivery.frame_range[1] : (currentAnalysis.frame_count - 1);
        const totalFrames = endFrame - startFrame + 1;
        let nextIndex = activeFrameIndex;
        
        const baseDelay = 150;
        const delay = Math.round(baseDelay / playbackSpeed);
        
        playInterval = setInterval(() => {
          nextIndex = startFrame + ((nextIndex - startFrame - startFrame + 1 + startFrame * 2) % totalFrames);
          // Simplified bounds safe loop:
          const relativeOffset = (nextIndex - startFrame + 1) % totalFrames;
          nextIndex = startFrame + relativeOffset;
          
          set({ activeFrameIndex: nextIndex });
        }, delay);
        
        set({ isPlaying: true });
      } else {
        set({ isPlaying: false });
      }
    },

    setPlaybackSpeed: (speed) => {
      set({ playbackSpeed: speed });
      const { isPlaying, setPlaying } = get();
      if (isPlaying) {
        setPlaying(true);
      }
    },

    deleteAnalysis: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await apiClient.delete(`/api/v1/analysis/${id}`);
        set({ currentAnalysis: null, isLoading: false, activeFrameIndex: 0, activeDeliveryIndex: 0 });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete session';
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    togglePlay: () => {
      const { isPlaying, setPlaying } = get();
      setPlaying(!isPlaying);
    },

    reset: () => {
      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }
      set({
        currentAnalysis: null,
        activeFrameIndex: 0,
        activeDeliveryIndex: 0,
        isPlaying: false,
        isLoading: false,
        error: null,
        playbackSpeed: 1.0,
      });
    },
  };
});
export type float = number; // Alias for backward compatibility
