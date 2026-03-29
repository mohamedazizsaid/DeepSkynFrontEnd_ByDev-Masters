import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Loader2, RotateCcw, Save, Sparkles, AlertCircle, Lock, Crown } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { analysisService } from '../../../lib/services/analysis.service';
import { extractDetailedScores, getStatusColorClass } from '../../../lib/analysis-helpers';
import type { GeminiAnalysisResult } from '../../../lib/types';
import toast from 'react-hot-toast';

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Live Skin Scan</h2>
                <p className="text-sm text-[#6B7280]">
                  {phase === 'camera' && 'Position your face in the frame'}
                  {phase === 'scanning' && 'AI is analyzing your skin...'}
                  {phase === 'results' && 'Scan complete!'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F3F4F6] rounded-xl transition-colors">
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Camera View */}
            {phase === 'camera' && (
              <div className="space-y-4">
                {cameraError ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-[#EF4444]" />
                    <p className="text-[#6B7280]">{cameraError}</p>
                    <Button onClick={startCamera}>Retry</Button>
                  </div>
                ) : (
                  <>
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      {/* Guide overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-full" />
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] hover:opacity-90"
                      onClick={captureAndScan}
                    >
                      <Camera className="w-5 h-5" />
                      Capture & Analyze
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Scanning */}
            {phase === 'scanning' && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-[#0EA5E9] animate-spin" />
                  <Sparkles className="w-6 h-6 text-[#F59E0B] absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">Analyzing your skin...</p>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Our AI is examining hydration, texture, pores, and more
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {phase === 'results' && result && (
              <div className="space-y-6">
                {/* Score banner */}
                <div className="text-center py-4">
                  <p className="text-sm text-[#6B7280] mb-1">Overall Health Score</p>
                  <div className="text-6xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                    {result.healthScore}
                  </div>
                  <p className="text-sm text-[#6B7280] mt-2">
                    Skin Type: <span className="font-medium text-[#374151] capitalize">{result.skinType}</span>
                    {' · '}
                    Skin Age: <span className="font-medium text-[#374151]">{result.skinAge}</span>
                  </p>
                </div>

                {/* Detailed scores */}
                <Card>
                  <h4 className="font-bold mb-4">Detailed Scores</h4>
                  <div className="space-y-3">
                    {detailedScores.map((item) => (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColorClass(item.status)}`}>
                              {item.status.replace('-', ' ')}
                            </span>
                            <span className="text-sm font-bold" style={{ color: item.color }}>
                              {item.score}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Conditions */}
                {result.conditions.length > 0 && (
                  <Card>
                    <h4 className="font-bold mb-3">Detected Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.conditions.map((c, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] text-sm rounded-full font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Summary */}
                {result.summary && (
                  <Card>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#0EA5E9]" />
                      <h4 className="font-bold">AI Summary</h4>
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed">{result.summary}</p>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={retake}>
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]"
                    onClick={saveAnalysis}
                    disabled={saving || !canSaveAnalysis}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : canSaveAnalysis ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {saving ? 'Saving...' : canSaveAnalysis ? 'Save Analysis' : 'Limit reached'}
                  </Button>
                </div>

                {!canSaveAnalysis && (
                  <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] flex items-center justify-between gap-3">
                    <span>{analysisBlockedMessage || 'Analysis limit reached for your plan.'}</span>
                    {onUpgrade && (
                      <button
                        onClick={onUpgrade}
                        className="inline-flex items-center gap-1 rounded-lg border border-current px-2.5 py-1.5 text-xs font-semibold hover:bg-white/40"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Upgrade
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
