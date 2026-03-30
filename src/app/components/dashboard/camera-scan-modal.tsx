import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Loader2, RotateCcw, Save, Sparkles, AlertCircle, Lock, Crown } from 'lucide-react';
import { analysisService } from '../../../lib/services/analysis.service';
import { extractDetailedScores } from '../../../lib/analysis-helpers';
import type { GeminiAnalysisResult } from '../../../lib/types';
import toast from 'react-hot-toast';

// Add global styles for hidden scrollbar
const scrollbarHideStyle = `
  .hidden-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hidden-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('scrollbar-hide-style')) {
  const style = document.createElement('style');
  style.id = 'scrollbar-hide-style';
  style.textContent = scrollbarHideStyle;
  document.head.appendChild(style);
}

interface CameraScanModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a scan is saved as a full analysis */
  onAnalysisSaved?: () => void;
  canSaveAnalysis?: boolean;
  analysisBlockedMessage?: string;
  onUpgrade?: () => void;
}

type ScanPhase = 'camera' | 'scanning' | 'results';

export function CameraScanModal({
  open,
  onClose,
  onAnalysisSaved,
  canSaveAnalysis = true,
  analysisBlockedMessage,
  onUpgrade,
}: CameraScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<ScanPhase>('camera');
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // ─── Camera lifecycle ───
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Unable to access camera. Please allow camera permission and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (open) {
      setPhase('camera');
      setResult(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // ─── Capture + Scan ───
  const captureAndScan = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Draw current frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Convert to base64 (strip the data:image/jpeg;base64, prefix)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1];

    stopCamera();
    setPhase('scanning');

    try {
      const scanResult = await analysisService.scan({
        image: base64,
        mimeType: 'image/jpeg',
        saveAnalysis: false,
      });
      setResult(scanResult);
      setPhase('results');
    } catch {
      toast.error('Scan failed. Please try again.');
      setPhase('camera');
      startCamera();
    }
  };

  // ─── Save scan as full analysis ───
  const saveAnalysis = async () => {
    if (!canvasRef.current) return;
    if (!canSaveAnalysis) {
      toast.error(analysisBlockedMessage || 'Analysis limit reached for your plan.');
      return;
    }
    setSaving(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      const base64 = dataUrl.split(',')[1];
      await analysisService.scan({
        image: base64,
        mimeType: 'image/jpeg',
        saveImage: true,
        saveAnalysis: true,
      });
      toast.success('Analysis saved successfully!');
      onAnalysisSaved?.();
      onClose();
    } catch {
      toast.error('Failed to save analysis.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Retake ───
  const retake = () => {
    setResult(null);
    setPhase('camera');
    startCamera();
  };

  if (!open) return null;

  const detailedScores = extractDetailedScores(result);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Light Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 200,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl mx-auto max-h-[95vh] overflow-y-auto hidden-scrollbar"
            style={{ zIndex: 201 }}
          >
            <div
              className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white"
            >
              {/* Top gradient accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]" />

              {/* Decorative glow circles */}
              <div
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #8B5CF6, transparent)',
                  filter: 'blur(60px)',
                }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-5 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #0EA5E9, transparent)',
                  filter: 'blur(50px)',
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

          <div className="p-8">
            {/* Header */}
            {(phase === 'camera' || phase === 'scanning') && (
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="p-2.5 rounded-2xl flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(139,92,246,0.1))',
                    border: '1px solid rgba(14,165,233,0.2)',
                  }}
                >
                  <Camera className="w-6 h-6 text-[#0EA5E9]" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-xl leading-tight">
                    Live Skin Scan
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {phase === 'camera' && 'Position your face in the frame'}
                    {phase === 'scanning' && 'AI is analyzing your skin...'}
                  </p>
                </div>
              </div>
            )}
            {/* Camera View */}
            {phase === 'camera' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {cameraError ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <AlertCircle className="w-12 h-12 text-[#EF4444]" />
                    </motion.div>
                    <p className="text-gray-600">{cameraError}</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startCamera}
                      className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] text-white shadow-lg shadow-[#0EA5E9]/20"
                    >
                      Retry
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg"
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      {/* Guide overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-full" />
                        <div className="absolute text-center text-white text-sm font-medium opacity-70 bottom-4">
                          Position your face in the circle
                        </div>
                      </div>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={captureAndScan}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] text-white shadow-lg shadow-[#0EA5E9]/20 transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      Capture & Analyze
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {/* Scanning */}
            {phase === 'scanning' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <motion.div
                  className="relative w-20 h-20 mx-auto mb-5"
                >
                  {/* Spinning outer ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: '3px solid transparent',
                      borderTopColor: '#0EA5E9',
                      borderRightColor: '#8B5CF6',
                    }}
                  />
                  {/* Inner icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-8 h-8 text-[#0EA5E9]" />
                    </motion.div>
                  </div>
                </motion.div>
                <p className="text-gray-900 font-semibold text-lg mb-1">
                  Analyzing your skin...
                </p>
                <p className="text-gray-500 text-sm">
                  Our AI is examining hydration, texture, pores, and more
                </p>
                <div className="flex justify-center gap-1.5 mt-5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#0EA5E9' }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results */}
            {phase === 'results' && result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Results Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="p-2.5 rounded-2xl flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(14,165,233,0.1))',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-xl leading-tight">
                      Scan Complete!
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Here's your skin analysis
                    </p>
                  </div>
                </div>

                {/* Horizontal Layout */}
                <div className="flex flex-col md:flex-row gap-5 mb-5">
                  {/* Left Column: Score & Detailed Scores */}
                  <div className="flex-1 md:w-[55%] space-y-3">
                    {/* Score banner */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-center py-5 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(139,92,246,0.05))',
                        border: '1px solid rgba(14,165,233,0.1)',
                      }}
                    >
                      <p className="text-xs text-gray-500 mb-1">Overall Health Score</p>
                      <div className="text-4xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] bg-clip-text text-transparent">
                        {result.healthScore}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="font-bold text-gray-700 capitalize">{result.skinType}</span>
                        {' · '}
                        <span className="font-bold text-gray-700">{result.skinAge}</span>
                      </p>
                    </motion.div>

                    {/* Detailed scores */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="rounded-2xl p-3"
                      style={{
                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <h4 className="font-bold text-gray-900 mb-2 text-xs">Detailed Scores</h4>
                      <div className="space-y-1.5">
                        {detailedScores.map((item, i) => (
                          <motion.div
                            key={item.key}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + i * 0.03 }}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[11px] font-medium text-gray-700">{item.category}</span>
                              <span className="text-[11px] font-bold" style={{ color: item.color }}>
                                {item.score}%
                              </span>
                            </div>
                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: item.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

                  {/* Right Column: Conditions & Summary */}
                  <div className="flex-1 md:w-[45%] space-y-3">
                    {/* Conditions */}
                    {result.conditions.length > 0 && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="rounded-2xl p-3"
                        style={{
                          background: 'rgba(245,158,11,0.05)',
                          border: '1px solid rgba(245,158,11,0.15)',
                        }}
                      >
                        <h4 className="font-bold text-gray-900 mb-2 text-xs">Detected Conditions</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {result.conditions.map((c, i) => (
                            <motion.span
                              key={i}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 + i * 0.05 }}
                              className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[10px] rounded-full font-medium"
                            >
                              {c}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Summary */}
                    {result.summary && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl p-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(139,92,246,0.05))',
                          border: '1px solid rgba(14,165,233,0.1)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
                          <h4 className="font-bold text-gray-900 text-xs">AI Summary</h4>
                        </div>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{result.summary}</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex flex-col gap-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveAnalysis}
                    disabled={saving || !canSaveAnalysis}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
                      canSaveAnalysis
                        ? 'bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] shadow-[#0EA5E9]/20 hover:shadow-xl'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : canSaveAnalysis ? (
                      <>
                        <Save className="w-4 h-4" />
                        Save Analysis
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Limit reached
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={retake}
                    className="w-full py-3 rounded-xl font-bold text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-2" />
                    Retake Scan
                  </motion.button>
                </motion.div>

                {!canSaveAnalysis && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-xs text-[#B91C1C] flex items-center justify-between gap-2"
                  >
                    <span>{analysisBlockedMessage || 'Analysis limit reached for your plan.'}</span>
                    {onUpgrade && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onUpgrade}
                        className="inline-flex items-center gap-1 rounded-lg border border-current px-2 py-1 text-[10px] font-semibold hover:bg-white/40 transition-colors flex-shrink-0"
                      >
                        <Crown className="w-3 h-3" />
                        Upgrade
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
