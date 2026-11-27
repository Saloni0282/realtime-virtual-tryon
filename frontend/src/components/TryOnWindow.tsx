import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Minimize2,
  Maximize2,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Garment, TryOnEngine, TryOnStatus, PoseState } from '../types';
import { SilhouetteGuide } from './SilhouetteGuide';
import { AlignmentTracker } from '../lib/mediaPipe';
import { TryOnSimulator } from '../lib/simulator';
import { DecartTryOnService } from '../lib/decartClient';

interface TryOnWindowProps {
  activeGarment: Garment | null;
  onClose: () => void;
  decartConfigured: boolean;
}

export const TryOnWindow: React.FC<TryOnWindowProps> = ({
  activeGarment,
  onClose,
  decartConfigured,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);

  const [status, setStatus] = useState<TryOnStatus>('idle');
  const [engine, setEngine] = useState<TryOnEngine>(
    decartConfigured ? 'decart-live' : 'local-simulator'
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [poseState, setPoseState] = useState<PoseState>({
    isPersonDetected: true,
    isAligned: true,
    guidanceText: 'Aligned',
  });
  const [showSilhouette, setShowSilhouette] = useState(false);
  const [userDisabledSilhouette, setUserDisabledSilhouette] = useState(false);

  // Instances
  const decartServiceRef = useRef<DecartTryOnService | null>(null);
  const simulatorRef = useRef<TryOnSimulator | null>(null);
  const trackerRef = useRef<AlignmentTracker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start webcam and initialize try-on session
  const startTryOn = useCallback(async () => {
    try {
      setStatus('requesting-camera');
      setErrorMessage(null);

      // Flash calibration guide for 2 seconds on initial camera connect
      if (!userDisabledSilhouette) {
        setShowSilhouette(true);
        setTimeout(() => setShowSilhouette(false), 2200);
      }

      // Access camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(() => {});
      }

      // Background pose alignment check
      if (localVideoRef.current) {
        trackerRef.current = new AlignmentTracker((pose) => {
          setPoseState(pose);
        });
        trackerRef.current.startTracking(localVideoRef.current);
      }

      setStatus('connecting');

      // Initialize selected engine
      if (engine === 'decart-live' && decartConfigured) {
        try {
          decartServiceRef.current = new DecartTryOnService();
          await decartServiceRef.current.initSession(stream, {
            garmentPrompt: activeGarment
              ? activeGarment.prompt
              : 'Substitute current top with a stylish blue sweater',
            onRemoteStream: (remoteStream) => {
              if (outputVideoRef.current) {
                outputVideoRef.current.srcObject = remoteStream;
              }
              setStatus('streaming');
            },
            onError: (err) => {
              console.warn('Decart session error, switching to local simulator:', err);
              fallbackToSimulator(stream);
            },
          });
        } catch (e: any) {
          console.warn('Decart initialization failed, falling back:', e);
          fallbackToSimulator(stream);
        }
      } else {
        // Run Local Simulator
        fallbackToSimulator(stream);
      }
    } catch (err: any) {
      console.error('Failed to start try-on:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Unable to access camera. Please allow camera permissions.');
    }
  }, [engine, decartConfigured, activeGarment, userDisabledSilhouette]);

  const fallbackToSimulator = (stream: MediaStream) => {
    setEngine('local-simulator');
    simulatorRef.current = new TryOnSimulator();
    if (activeGarment) {
      simulatorRef.current.setGarment(activeGarment);
    }
    if (localVideoRef.current) {
      const simStream = simulatorRef.current.startSimulation(localVideoRef.current);
      if (outputVideoRef.current) {
        outputVideoRef.current.srcObject = simStream;
      }
    }
    setStatus('streaming');
  };

  // Start immediately on mount
  useEffect(() => {
    startTryOn();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
      if (simulatorRef.current) {
        simulatorRef.current.stop();
      }
      if (decartServiceRef.current) {
        decartServiceRef.current.disconnect();
      }
    };
  }, []);

  // Handle garment updates
  useEffect(() => {
    if (!activeGarment) return;

    // 1. Immediately update simulator or Decart session
    if (engine === 'decart-live' && decartServiceRef.current) {
      decartServiceRef.current.updateGarmentPrompt(activeGarment.prompt);
    } else if (simulatorRef.current) {
      simulatorRef.current.setGarment(activeGarment);
    }

    // 2. Quick calibration flash on switch (1s matching video)
    let timer: any = null;
    if (!userDisabledSilhouette) {
      setShowSilhouette(true);
      timer = setTimeout(() => {
        setShowSilhouette(false);
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeGarment, engine, userDisabledSilhouette]);

  // Capture snapshot
  const takeSnapshot = () => {
    const video = outputVideoRef.current || localVideoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame (mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(16, canvas.height - 48, 230, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Anywear | ${activeGarment?.name || 'Look'}`, 26, canvas.height - 27);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `anywear-${activeGarment?.id || 'tryon'}.png`;
    a.click();
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        isMinimized
          ? 'bottom-6 right-6 w-72 h-16 rounded-2xl shadow-2xl overflow-hidden bg-zinc-900 border border-zinc-800'
          : 'bottom-6 left-6 md:left-8 w-[94vw] sm:w-[480px] md:w-[520px] rounded-3xl shadow-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 ring-1 ring-white/10'
      }`}
    >
      {/* Window Header */}
      <div className="px-4 py-3 bg-zinc-900/90 backdrop-blur-md flex items-center justify-between border-b border-zinc-800/60 select-none">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">
            Try-On / Anywear
          </span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300 border border-zinc-700">
            {engine === 'decart-live' ? 'Decart Lucy VTON' : 'Local Vision Engine'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            title={isMinimized ? 'Expand window' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            title="Close try-on"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="relative">
          {/* Main Video Viewport */}
          <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden flex items-center justify-center">
            {/* Hidden Raw Webcam */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />

            {/* Transformed Video Feed */}
            <video
              ref={outputVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {/* Silhouette "Step back" Guide (dismissible) */}
            <SilhouetteGuide
              isVisible={showSilhouette}
              guidanceText="Step back"
              onDismiss={() => {
                setShowSilhouette(false);
                setUserDisabledSilhouette(true);
              }}
            />

            {/* Connection overlay */}
            {status === 'connecting' && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs font-semibold text-zinc-300">
                  Calibrating live try-on video stream...
                </p>
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
              <div className="absolute inset-0 bg-zinc-950/90 p-6 flex flex-col items-center justify-center text-center gap-3 text-white">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-xs font-semibold text-rose-200">{errorMessage}</p>
                <button
                  onClick={startTryOn}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Current Active Garment Overlay Banner */}
            {activeGarment && status === 'streaming' && (
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: activeGarment.color }}
                  />
                  <span className="text-[11px] font-bold text-white max-w-[200px] truncate">
                    {activeGarment.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ({activeGarment.currency}{activeGarment.price})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar & Controls */}
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
            {/* Snapshot */}
            <button
              onClick={takeSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-all active:scale-95 border border-zinc-700"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Snapshot</span>
            </button>

            {/* Toggle Guide & Switcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nextState = !showSilhouette;
                  setShowSilhouette(nextState);
                  if (!nextState) setUserDisabledSilhouette(true);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                  showSilhouette
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                }`}
                title="Toggle Step Back Guide"
              >
                {showSilhouette ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Guide {showSilhouette ? 'On' : 'Off'}</span>
              </button>

              <button
                onClick={() => {
                  if (engine === 'decart-live') {
                    if (streamRef.current) fallbackToSimulator(streamRef.current);
                  } else if (decartConfigured) {
                    setEngine('decart-live');
                    startTryOn();
                  } else {
                    alert('Add your DECART_API_KEY in backend/.env to connect to live Decart cloud model.');
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold border border-zinc-700 transition-colors"
                title="Switch between Decart WebRTC and Local Simulator"
              >
                {engine === 'decart-live' ? '☁️ Decart Cloud' : '💻 Local Vision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
