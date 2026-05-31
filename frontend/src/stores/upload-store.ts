import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import { WS_BASE_URL } from '../lib/constants';

interface UploadResponse {
  video_id: string;
  filename: string;
  status: string;
  created_at: string;
}

interface UploadStatusResponse {
  video_id: string;
  status: string;
  progress_pct: number;
  current_step: string;
}

interface UploadState {
  file: File | null;
  videoId: string | null;
  isUploading: boolean;
  isProcessing: boolean;
  uploadProgress: number;
  processingProgress: number;
  currentStep: string;
  error: string | null;
  setFile: (file: File | null) => void;
  reset: () => void;
  uploadVideo: (file: File) => Promise<string>;
  trackProcessing: (videoId: string, onComplete: (analysisId: string) => void) => void;
}

export const useUploadStore = create<UploadState>((set, get) => {
  let ws: WebSocket | null = null;
  let pollInterval: NodeJS.Timeout | null = null;

  return {
    file: null,
    videoId: null,
    isUploading: false,
    isProcessing: false,
    uploadProgress: 0,
    processingProgress: 0,
    currentStep: '',
    error: null,

    setFile: (file) => set({ file, error: null }),
    
    reset: () => {
      if (ws) {
        ws.close();
        ws = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      set({
        file: null,
        videoId: null,
        isUploading: false,
        isProcessing: false,
        uploadProgress: 0,
        processingProgress: 0,
        currentStep: '',
        error: null,
      });
    },

    uploadVideo: async (file) => {
      set({ isUploading: true, uploadProgress: 10, error: null });
      
      try {
        const formData = new FormData();
        formData.append('file', file);

        // Upload to /api/v1/upload
        const response = await apiClient.post<UploadResponse>('/api/v1/upload', formData);
        
        set({
          isUploading: false,
          uploadProgress: 100,
          isProcessing: true,
          videoId: response.video_id,
          processingProgress: 10,
          currentStep: 'extracting_frames',
        });
        
        return response.video_id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Video upload failed';
        set({ isUploading: false, error: message });
        throw err;
      }
    },

    trackProcessing: (videoId, onComplete) => {
      const cleanup = () => {
        if (ws) {
          ws.close();
          ws = null;
        }
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };

      cleanup();

      // 1. Attempt Real-time status updates via WebSocket connection
      try {
        const wsUrl = `${WS_BASE_URL}/api/v1/ws/${videoId}`;
        console.log(`Connecting to WebSocket: ${wsUrl}`);
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket status update received:", data);
            
            const pct = data.progress_pct || 0;
            const step = data.current_step || '';
            const status = data.status || 'processing';

            set({
              processingProgress: pct,
              currentStep: step,
            });

            if (status === 'complete') {
              set({ isProcessing: false, processingProgress: 100 });
              cleanup();
              onComplete(videoId);
            } else if (status === 'failed') {
              set({ isProcessing: false, error: data.error_message || 'Video processing failed' });
              cleanup();
            }
          } catch (e) {
            console.error("Error parsing WS message:", e);
          }
        };

        ws.onerror = (e) => {
          console.warn("WebSocket experienced connection error. Falling back to HTTP polling...", e);
          startPolling();
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed.");
        };
      } catch (e) {
        console.warn("WebSocket instantiation failed. Falling back to HTTP polling...", e);
        startPolling();
      }

      // 2. HTTP Polling Fallback (runs if WebSocket fails or disconnects)
      function startPolling() {
        if (pollInterval) return;

        pollInterval = setInterval(async () => {
          try {
            const statusData = await apiClient.get<UploadStatusResponse>(`/api/v1/upload/${videoId}/status`);
            
            set({
              processingProgress: statusData.progress_pct,
              currentStep: statusData.current_step,
            });

            if (statusData.status === 'complete') {
              set({ isProcessing: false, processingProgress: 100 });
              cleanup();
              onComplete(videoId);
            } else if (statusData.status === 'failed') {
              set({ isProcessing: false, error: 'Video processing failed' });
              cleanup();
            }
          } catch (err) {
            console.error('Polling status query error:', err);
          }
        }, 2000);
      }
    },
  };
});
