'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Video, X, AlertTriangle, RefreshCw, Cpu, Loader2 } from 'lucide-react';
import { useUploadStore } from '../../../stores/upload-store';
import { ROUTES } from '../../../lib/constants';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    file,
    isUploading,
    isProcessing,
    uploadProgress,
    processingProgress,
    currentStep,
    error,
    setFile,
    reset,
    uploadVideo,
    trackProcessing,
  } = useUploadStore();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      alert('Invalid file format. Please upload a valid video file (MP4, MOV).');
      return;
    }
    
    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > 100) {
      alert('File size exceeds the 100MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleStartAnalysis = async () => {
    if (!file) return;

    try {
      // 1. Upload video to get analysis video ID
      const videoId = await uploadVideo(file);
      
      // 2. Track real-time progress via WebSocket
      trackProcessing(videoId, (analysisId) => {
        router.push(ROUTES.ANALYSIS(analysisId));
      });
    } catch (err) {
      console.error('Analysis trigger failed:', err);
    }
  };

  const getStepDescription = (step: string) => {
    const steps: Record<string, string> = {
      'extracting_frames': 'Decompressing video timeline and sampling frames...',
      'pose_estimation': 'Mapping 33 physical joints using MediaPipe inference...',
      'calculating_metrics': 'Computing lead elbow extensions, strides, and head tilt vectors...',
      'generating_insights': 'Compiling rule anomalies and coaching diagnostics...',
      'saving_visuals': 'Compressing keyframe overlays and writing assets to disk...',
      'saving_results': 'Serializing biomechanical coordinates database payloads...'
    };
    return steps[step] || 'Processing video biomechanics pipeline...';
  };

  const getStepProgressTitle = (step: string) => {
    const steps: Record<string, string> = {
      'extracting_frames': 'Extracting Video Frames',
      'pose_estimation': 'Tracking Joint Landmarks',
      'calculating_metrics': 'Calculating Biomechanics',
      'generating_insights': 'Synthesizing Coaching Advice',
      'saving_visuals': 'Saving Overlays',
      'saving_results': 'Writing Database Records'
    };
    return steps[step] || 'Analyzing Swing';
  };

  return (
    <div
      style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Upload Batting Performance</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '8px' }}>
          PitchMind extracts skeletal pose overlay insights to diagnose technique flaws.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 'var(--spacing-xl)', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* State 1: Select/Drag File */}
        {!isUploading && !isProcessing && !error && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={!file ? triggerFileInput : undefined}
            id="drop-zone-area"
            style={{
              border: dragActive ? '2px dashed var(--color-accent)' : '2px dashed rgba(255,255,255,0.1)',
              background: dragActive ? 'rgba(0, 240, 255, 0.03)' : 'rgba(12, 18, 32, 0.4)',
              borderRadius: 'var(--border-radius-md)',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: !file ? 'pointer' : 'default',
              transition: 'var(--transition-smooth)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              style={{ display: 'none' }}
              id="file-input-trigger"
            />

            {!file ? (
              <>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '50%' }}>
                  <Upload size={36} color="var(--color-accent)" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Drag & Drop video file here</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                    or click to browse local files (MP4 or MOV, max 100MB)
                  </p>
                </div>
              </>
            ) : (
              <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--border-radius-sm)',
                    border: 'var(--border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <Video size={24} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  onClick={handleStartAnalysis}
                  id="btn-trigger-ai-analysis"
                  className="glow-border"
                  style={{
                    background: 'var(--color-accent)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-sm)',
                    color: '#050811',
                    padding: '14px 28px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Cpu size={18} />
                  <span>INITIALIZE AI TECHNIQUE SCAN</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* State 2: Uploading state */}
        {isUploading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
            <Loader2 size={48} color="var(--color-accent)" className="spinner-icon-animate" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Uploading Performance Video</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                Streaming binary payload directly to local storage cluster...
              </p>
            </div>
            
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-accent)', boxShadow: 'var(--shadow-glow)', transition: 'var(--transition-smooth)' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Processing state */}
        {isProcessing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
            <Loader2 size={48} color="var(--color-accent)" className="spinner-icon-animate" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {getStepProgressTitle(currentStep)}
              </h3>
              <p style={{ color: 'var(--color-accent)', fontSize: '0.85rem', marginTop: '6px', minHeight: '36px', maxWidth: '500px' }}>
                {getStepDescription(currentStep)}
              </p>
            </div>
            
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                <span>Processing Progress</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${processingProgress}%`, height: '100%', background: 'var(--color-accent)', boxShadow: 'var(--shadow-glow)', transition: 'var(--transition-smooth)' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* State 4: Error State */}
        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 23, 68, 0.1)', padding: '16px', borderRadius: '50%', border: '1px solid rgba(255, 23, 68, 0.2)' }}>
              <AlertTriangle size={36} color="var(--color-danger)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-danger)' }}>Analysis Interrupted</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '6px', maxWidth: '500px' }}>
                {error}
              </p>
            </div>
            
            <button
              onClick={reset}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'var(--border-glass)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--color-text-primary)',
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <RefreshCw size={16} />
              <span>Retry Upload</span>
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner-icon-animate {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
