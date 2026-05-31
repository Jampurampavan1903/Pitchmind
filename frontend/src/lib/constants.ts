// PitchMind system-wide constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const LIMITS = {
  MAX_VIDEO_SIZE_MB: 100,
  ALLOWED_VIDEO_FORMATS: ['.mp4', '.mov', '.avi', '.webm'],
};

export const ROUTES = {
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  ANALYSIS: (id: string) => `/analysis/${id}`,
  HISTORY: '/history',
};

export const ANALYSIS_STATUS = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
};
