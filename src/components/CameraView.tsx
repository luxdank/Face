/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
  isAnalyzing: boolean;
  onClearResult: () => void;
}

type FrameState = "searching" | "detected" | "stabilized";

export default function CameraView({ onCapture, isAnalyzing, onClearResult }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameState, setFrameState] = useState<FrameState>("searching");
  const [progress, setProgress] = useState(0);

  // Auto-switch frame states to simulate smart camera alignment
  useEffect(() => {
    if (!isActive) {
      setFrameState("searching");
      return;
    }

    // Searching -> Detected after 1.5s
    const detectTimer = setTimeout(() => {
      setFrameState("detected");
    }, 1500);

    // Detected -> Stabilized after 3s
    const stabilizeTimer = setTimeout(() => {
      setFrameState("stabilized");
    }, 3200);

    return () => {
      clearTimeout(detectTimer);
      clearTimeout(stabilizeTimer);
    };
  }, [isActive]);

  // Handle analysis progress animation
  useEffect(() => {
    if (isAnalyzing) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isAnalyzing]);

  const startCamera = async () => {
    setError(null);
    onClearResult();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setError(
        "Não foi possível acessar a câmera. Verifique se concedeu permissão ou se outro aplicativo está usando-a."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setFrameState("searching");
  };

  const handleCapture = () => {
    if (!videoRef.current || !isActive) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror the canvas for user-facing camera feel
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        onCapture(dataUrl);
      }
    } catch (err) {
      console.error("Erro ao capturar imagem:", err);
      setError("Erro ao congelar frame do vídeo.");
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame colors based on state
  const getFrameColorClass = () => {
    if (isAnalyzing) return "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]";
    switch (frameState) {
      case "stabilized":
        return "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]";
      case "detected":
        return "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]";
      case "searching":
      default:
        return "border-slate-400 dark:border-slate-600";
    }
  };

  const getStatusBadge = () => {
    if (isAnalyzing) {
      return {
        text: "Processando Biometria...",
        color: "bg-blue-500 text-white",
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
      };
    }
    switch (frameState) {
      case "stabilized":
        return {
          text: "Rosto Estabilizado • Pronto",
          color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "detected":
        return {
          text: "Alinhando Rosto...",
          color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
          icon: <Sparkles className="w-3.5 h-3.5 animate-pulse" />,
        };
      case "searching":
      default:
        return {
          text: "Procurando Rosto...",
          color: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div id="camera-section" className="flex flex-col items-center w-full">
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 border-2 transition-all duration-500 ease-in-out flex items-center justify-center group shadow-xl max-w-2xl mx-auto border-dashed border-slate-700">
        
        {/* Video feed */}
        {isActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          />
        )}

        {/* Gray/Blue/Green Intelligent Frame Overlay */}
        {isActive && !isAnalyzing && (
          <div className={`absolute inset-6 rounded-2xl border-2 transition-all duration-500 pointer-events-none ${getFrameColorClass()}`}>
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-inherit -mt-1 -ml-1 rounded-tl"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-inherit -mt-1 -mr-1 rounded-tr"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-inherit -mb-1 -ml-1 rounded-bl"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-inherit -mb-1 -mr-1 rounded-br"></div>
          </div>
        )}

        {/* Dynamic Scan Line Animation */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-10 pointer-events-none bg-blue-500/5">
            {/* Horizontal neon bar */}
            <motion.div
              initial={{ y: "0%" }}
              animate={{ y: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3b82f6] opacity-90"
            />
            {/* Vertical grid lines style overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_center,rgba(59,130,246,0.1),transparent)]" />
          </div>
        )}

        {/* Idle / Off Screen */}
        {!isActive && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 z-10 max-w-md">
            <div className="p-5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 mb-4 shadow-inner">
              <CameraOff className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2 font-sans tracking-tight">Camera Desativada</h3>
            <p className="text-sm text-slate-400 font-sans leading-relaxed">
              Ative a webcam de alta definição para realizar análises biométricas de idade e mapeamento facial em tempo real.
            </p>
          </div>
        )}

        {/* Smart Status Badge */}
        {isActive && (
          <div className="absolute top-4 left-4 z-20">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md ${badge.color}`}>
              {badge.icon}
              {badge.text}
            </span>
          </div>
        )}

        {/* Grid lines decoration for technical feel */}
        {isActive && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-10">
            <div className="border-r border-b border-white"></div>
            <div className="border-r border-b border-white"></div>
            <div className="border-b border-white"></div>
            <div className="border-r border-b border-white"></div>
            <div className="border-r border-b border-white"></div>
            <div className="border-b border-white"></div>
            <div className="border-r border-white"></div>
            <div className="border-r border-white"></div>
            <div></div>
          </div>
        )}
      </div>

      {/* Progress bar under camera when scanning */}
      {isAnalyzing && (
        <div className="w-full max-w-2xl mt-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
            <span>VARRENDO REDE FACIAL...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-500"
            />
          </div>
        </div>
      )}

      {/* Camera controls */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {!isActive ? (
          <button
            id="btn-start-camera"
            onClick={startCamera}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-sm transition-all shadow-md active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Ativar Webcam
          </button>
        ) : (
          <>
            <button
              id="btn-capture-analyze"
              disabled={isAnalyzing}
              onClick={handleCapture}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg active:scale-95 ${
                isAnalyzing
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Analisar Idade
            </button>
            <button
              id="btn-stop-camera"
              disabled={isAnalyzing}
              onClick={stopCamera}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all"
            >
              <CameraOff className="w-4 h-4" />
              Desligar Câmera
            </button>
          </>
        )}
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 text-sm max-w-2xl mx-auto shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-sans leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
