import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as faceapi from 'face-api.js';
import { Camera, X, Loader2, RotateCcw, Save, Sparkles, AlertCircle, Lock, Crown, ShieldCheck, ShieldX, UserCheck, Droplets, Sun, Wind, Scan, Activity, Eye, Zap, CircleDot, Frown, TrendingDown, Flame } from 'lucide-react';
import { analysisService } from '../../../lib/services/analysis.service';
import { extractDetailedScores } from '../../../lib/analysis-helpers';
import { useFaceVerification } from '../../../lib/hooks/useFaceVerification';
import type { GeminiAnalysisResult, AnalysisEvolutionRemark } from '../../../lib/types';
import {
  PreocupentSelectorModal,
  type PreocupentZoneKey,
} from './preocupent-selector-modal';
import toast from 'react-hot-toast';

// Types for real-time analysis annotations (scores)
interface AnalysisAnnotation {
  id: string;
  label: string;
  value: string;
  position: { x: number; y: number };
  icon: React.ReactNode;
  color: string;
}

// Types for skin issue markers (problems detected)
interface SkinIssueMarker {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  position: { x: number; y: number };
  description: string;
  recommendation?: string;
  icon: React.ReactNode;
  category: 'acne' | 'wrinkles' | 'pigmentation' | 'redness' | 'pores' | 'texture';
}

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
  /** Called when user needs to go to settings for face registration */
  onNavigateToSettings?: () => void;
}

type ScanPhase = 'camera' | 'verifying' | 'verification_failed' | 'analyzing' | 'results';
type PendingPreocupentAction = { mode: 'scan' | 'save'; base64: string };
type ScanAngle = 'front' | 'left' | 'right';
type PoseLabel = 'front' | 'left' | 'right' | 'unknown';

export function CameraScanModal({
  open,
  onClose,
  onAnalysisSaved,
  canSaveAnalysis = true,
  analysisBlockedMessage,
  onUpgrade,
  onNavigateToSettings,
}: CameraScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<ScanPhase>('camera');
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [evolutionRemark, setEvolutionRemark] = useState<AnalysisEvolutionRemark | null>(null);
  const [saving, setSaving] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [localVerificationResult, setLocalVerificationResult] = useState<{ needsProfilePhoto: boolean } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImagesByAngle, setCapturedImagesByAngle] = useState<Partial<Record<ScanAngle, string>>>({});
  const [captureSequence, setCaptureSequence] = useState<ScanAngle[]>([]);
  const [loadingCapturedImages, setLoadingCapturedImages] = useState<Partial<Record<ScanAngle, string>>>({});
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [autoCaptureHint, setAutoCaptureHint] = useState<string>('');
  const [visibleAnnotations, setVisibleAnnotations] = useState<AnalysisAnnotation[]>([]);
  const [visibleIssues, setVisibleIssues] = useState<SkinIssueMarker[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisText, setCurrentAnalysisText] = useState<string>('');
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [selectedPreocupent, setSelectedPreocupent] = useState<PreocupentZoneKey[]>([]);
  const [preocupentModalOpen, setPreocupentModalOpen] = useState(false);
  const [pendingPreocupentAction, setPendingPreocupentAction] = useState<PendingPreocupentAction | null>(null);
  const [preocupentConfirming, setPreocupentConfirming] = useState(false);

  // Face verification hook
  const {
    isLoading: isVerifying,
    isModelLoaded,
    verificationResult,
    loadModels,
    verifyFromVideo,
    reset: resetVerification,
  } = useFaceVerification();

  // Load face-api models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

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
      setEvolutionRemark(null);
      setVerificationMessage('');
      setLocalVerificationResult(null);
      setSelectedPreocupent([]);
      setPendingPreocupentAction(null);
      setPreocupentModalOpen(false);
      setPreocupentConfirming(false);
      setCapturedImagesByAngle({});
      setCaptureSequence([]);
      setLoadingCapturedImages({});
      setIsAutoCapturing(false);
      setAutoCaptureHint('');
      resetVerification();
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera, resetVerification]);

  // Generate annotations based on analysis result
  const generateAnnotations = useCallback((result: GeminiAnalysisResult): AnalysisAnnotation[] => {
    const annotations: AnalysisAnnotation[] = [];
    const da = result.detailedAnalysis;
    
    // Hydration - cheeks area
    if (da?.hydration?.score !== undefined) {
      annotations.push({
        id: 'hydration',
        label: 'Hydratation',
        value: `${da.hydration.score}%`,
        position: { x: 15, y: 45 },
        icon: <Droplets className="w-3 h-3" />,
        color: da.hydration.score >= 70 ? '#10B981' : da.hydration.score >= 50 ? '#F59E0B' : '#EF4444',
      });
    }

    // Elasticity - forehead
    if (da?.elasticity?.score !== undefined) {
      annotations.push({
        id: 'elasticity',
        label: 'Élasticité',
        value: `${da.elasticity.score}%`,
        position: { x: 50, y: 12 },
        icon: <Zap className="w-3 h-3" />,
        color: da.elasticity.score >= 70 ? '#10B981' : da.elasticity.score >= 50 ? '#F59E0B' : '#EF4444',
      });
    }

    // Texture - side of face
    if (da?.texture?.score !== undefined) {
      annotations.push({
        id: 'texture',
        label: 'Texture',
        value: `${da.texture.score}%`,
        position: { x: 85, y: 35 },
        icon: <Scan className="w-3 h-3" />,
        color: da.texture.score >= 70 ? '#10B981' : da.texture.score >= 50 ? '#F59E0B' : '#EF4444',
      });
    }

    // Pores - nose area
    if (da?.pores?.score !== undefined) {
      annotations.push({
        id: 'pores',
        label: 'Pores',
        value: `${da.pores.score}%`,
        position: { x: 50, y: 48 },
        icon: <Eye className="w-3 h-3" />,
        color: da.pores.score >= 70 ? '#10B981' : da.pores.score >= 50 ? '#F59E0B' : '#EF4444',
      });
    }

    // Pigmentation - other cheek
    if (da?.pigmentation?.score !== undefined) {
      annotations.push({
        id: 'pigmentation',
        label: 'Pigmentation',
        value: `${da.pigmentation.score}%`,
        position: { x: 82, y: 55 },
        icon: <Sun className="w-3 h-3" />,
        color: da.pigmentation.score >= 70 ? '#10B981' : da.pigmentation.score >= 50 ? '#F59E0B' : '#EF4444',
      });
    }

    // Redness - lower cheeks
    if (da?.redness?.score !== undefined) {
      annotations.push({
        id: 'redness',
        label: 'Rougeurs',
        value: `${da.redness.score}%`,
        position: { x: 18, y: 60 },
        icon: <Wind className="w-3 h-3" />,
        color: da.redness.score >= 70 ? '#10B981' : da.redness.score >= 50 ? '#F59E0B' : '#EF4444',
      });
    }

    // Health Score - center bottom
    annotations.push({
      id: 'healthScore',
      label: 'Score Santé',
      value: `${result.healthScore}/100`,
      position: { x: 50, y: 88 },
      icon: <Activity className="w-3 h-3" />,
      color: result.healthScore >= 70 ? '#10B981' : result.healthScore >= 50 ? '#F59E0B' : '#EF4444',
    });

    return annotations;
  }, []);

  // Generate skin issue markers based on analysis result
  const generateIssueMarkers = useCallback((result: GeminiAnalysisResult): SkinIssueMarker[] => {
    const issues: SkinIssueMarker[] = [];
    const da = result.detailedAnalysis;

    // Acne detection - multiple spots if severe
    if (da?.acne && da.acne.score < 70) {
      const severity = da.acne.score < 40 ? 'high' : da.acne.score < 60 ? 'medium' : 'low';
      const recommendations = {
        high: 'Consultez un dermatologue. Utilisez des soins anti-acnéiques quotidiens.',
        medium: 'Nettoyage doux matin/soir. Évitez les produits comédogènes.',
        low: 'Maintenez une routine douce. Hydratation légère non-comédogène.'
      };
      
      issues.push({
        id: 'acne-left',
        label: 'Acné',
        severity,
        category: 'acne',
        position: { x: 25, y: 52 },
        description: da.acne.description || 'Lésions inflammatoires localisées',
        recommendation: recommendations[severity],
        icon: <CircleDot className="w-3 h-3" />,
      });
      
      if (da.acne.score < 50) {
        issues.push({
          id: 'acne-right',
          label: 'Acné',
          severity,
          category: 'acne',
          position: { x: 75, y: 48 },
          description: 'Extension bilatérale des lésions',
          recommendation: 'Zone nécessitant une attention particulière',
          icon: <CircleDot className="w-3 h-3" />,
        });
      }
    }

    // Wrinkles detection - forehead and eye area
    if (da?.wrinkles && da.wrinkles.score < 70) {
      const severity = da.wrinkles.score < 40 ? 'high' : da.wrinkles.score < 60 ? 'medium' : 'low';
      const recommendations = {
        high: 'Soins anti-âge intensifs. Rétinol et peptides recommandés.',
        medium: 'Crème anti-rides quotidienne. Protection solaire essentielle.',
        low: 'Prévention avec hydratation et protection UV.'
      };

      issues.push({
        id: 'wrinkles-forehead',
        label: 'Rides d\'expression',
        severity,
        category: 'wrinkles',
        position: { x: 50, y: 20 },
        description: da.wrinkles.description || 'Sillons marqués du front',
        recommendation: recommendations[severity],
        icon: <TrendingDown className="w-3 h-3" />,
      });
      
      if (da.wrinkles.score < 50) {
        issues.push({
          id: 'wrinkles-eyes',
          label: 'Ridules péri-oculaires',
          severity,
          category: 'wrinkles',
          position: { x: 78, y: 42 },
          description: 'Pattes d\'oie marquées',
          recommendation: 'Contour des yeux spécialisé recommandé',
          icon: <TrendingDown className="w-3 h-3" />,
        });
      }
    }

    // Redness/Rosacea detection
    if (da?.redness && da.redness.score < 60) {
      const severity = da.redness.score < 30 ? 'high' : da.redness.score < 50 ? 'medium' : 'low';
      const recommendations = {
        high: 'Consultez pour exclure rosacée. Soins apaisants stricts.',
        medium: 'Produits hypoallergéniques. Évitez les irritants.',
        low: 'Nettoyage doux. Eau thermale apaisante.'
      };

      issues.push({
        id: 'redness-cheeks',
        label: 'Érythème facial',
        severity,
        category: 'redness',
        position: { x: 30, y: 58 },
        description: da.redness.description || 'Rougeurs diffuses des joues',
        recommendation: recommendations[severity],
        icon: <Flame className="w-3 h-3" />,
      });
    }

    // Pores - nose and cheeks
    if (da?.pores && da.pores.score < 50) {
      const severity = da.pores.score < 30 ? 'high' : da.pores.score < 45 ? 'medium' : 'low';
      const recommendations = {
        high: 'Nettoyage profond hebdomadaire. Acide salicylique.',
        medium: 'Exfoliation douce 2x/semaine. Niacinamide.',
        low: 'Nettoyage quotidien adapté. Hydratation équilibrée.'
      };

      issues.push({
        id: 'pores-nose',
        label: 'Pores dilatés',
        severity,
        category: 'pores',
        position: { x: 52, y: 55 },
        description: da.pores.description || 'Pores visibles zone médiane',
        recommendation: recommendations[severity],
        icon: <Eye className="w-3 h-3" />,
      });
    }

    // Pigmentation issues
    if (da?.pigmentation && da.pigmentation.score < 60) {
      const severity = da.pigmentation.score < 35 ? 'high' : da.pigmentation.score < 50 ? 'medium' : 'low';
      const recommendations = {
        high: 'Soins dépigmentants. Protection solaire maximale SPF 50+.',
        medium: 'Vitamine C + protection UV quotidienne.',
        low: 'Prévention UV. Antioxydants recommandés.'
      };

      issues.push({
        id: 'pigmentation-cheek',
        label: 'Hyperpigmentation',
        severity,
        category: 'pigmentation',
        position: { x: 70, y: 55 },
        description: da.pigmentation.description || 'Taches pigmentaires localisées',
        recommendation: recommendations[severity],
        icon: <Sun className="w-3 h-3" />,
      });
    }

    // Texture irregularities
    if (da?.texture && da.texture.score < 50) {
      const severity = da.texture.score < 30 ? 'high' : da.texture.score < 45 ? 'medium' : 'low';
      const recommendations = {
        high: 'Peeling professionnel. Soins restructurants.',
        medium: 'Exfoliation chimique douce. Sérums lissants.',
        low: 'Hydratation optimale. Soins texturisants.'
      };

      issues.push({
        id: 'texture-skin',
        label: 'Irrégularités texture',
        severity,
        category: 'texture',
        position: { x: 85, y: 45 },
        description: 'Surface cutanée irrégulière',
        recommendation: recommendations[severity],
        icon: <Scan className="w-3 h-3" />,
      });
    }

    return issues;
  }, []);

  // Analysis text messages that appear during analysis
  const analysisMessages = [
    "Analyse de l'hydratation en cours...",
    'Detection de la texture de peau...',
    'Evaluation des pores...',
    "Analyse de l'elasticite...",
    "Mesure de l'eclat cutane...",
    'Verification des dommages UV...',
    'Calcul du score de sante global...',
    "Finalisation de l'analyse...",
  ];

  const runScanAnalysis = async (
    base64: string,
    preocupent: PreocupentZoneKey[],
    forcedCaptureSequence?: ScanAngle[],
  ) => {
    stopCamera();
    setPhase('analyzing');
    setVisibleAnnotations([]);
    setVisibleIssues([]);
    setShowFinalScore(false);
    setAnalysisProgress(0);
    setCurrentAnalysisText(analysisMessages[0]);
    const sequence = (forcedCaptureSequence && forcedCaptureSequence.length === 3)
      ? forcedCaptureSequence
      : (captureSequence.length === 3 ? captureSequence : ['front', 'left', 'right']);
    const imageByAngle = {
      [sequence[0]]: capturedImagesByAngle[sequence[0] as ScanAngle] || capturedImage || '',
      [sequence[1]]: capturedImagesByAngle[sequence[1] as ScanAngle] || capturedImage || '',
      [sequence[2]]: capturedImagesByAngle[sequence[2] as ScanAngle] || capturedImage || '',
    } as Record<ScanAngle, string>;
    setLoadingCapturedImages({
      front: imageByAngle.front,
      left: imageByAngle.left,
      right: imageByAngle.right,
    });

    try {
      let messageIndex = 0;
      const textInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % analysisMessages.length;
        setCurrentAnalysisText(analysisMessages[messageIndex]);
        setAnalysisProgress(prev => Math.min(prev + 12, 95));
      }, 800);

      const scanResult = await analysisService.scan({
        frontImage: imageByAngle.front.split(',')[1] || base64,
        leftImage: imageByAngle.left.split(',')[1] || base64,
        rightImage: imageByAngle.right.split(',')[1] || base64,
        mimeType: 'image/jpeg',
        saveAnalysis: false,
        preocupent,
      });

      clearInterval(textInterval);
      setResult(scanResult.analysis);
      setEvolutionRemark(scanResult.evolution ?? null);
      setLoadingCapturedImages({
        front: scanResult.capturedImages?.front?.imageUrl || imageByAngle.front,
        left: scanResult.capturedImages?.left?.imageUrl || imageByAngle.left,
        right: scanResult.capturedImages?.right?.imageUrl || imageByAngle.right,
      });

      const annotations = generateAnnotations(scanResult.analysis);
      setAnalysisProgress(100);
      setCurrentAnalysisText('Detection des metriques...');

      const scoreAnnotations = annotations.filter(a => a.id !== 'healthScore');
      for (let i = 0; i < scoreAnnotations.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 350));
        setVisibleAnnotations(prev => [...prev, scoreAnnotations[i]]);
      }

      await new Promise(resolve => setTimeout(resolve, 600));
      setCurrentAnalysisText('Detection des problemes cutanes...');

      const issues = generateIssueMarkers(scanResult.analysis);
      for (let i = 0; i < issues.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 450));
        setVisibleIssues(prev => [...prev, issues[i]]);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentAnalysisText('Calcul du score final...');

      const healthScoreAnnotation = annotations.find(a => a.id === 'healthScore');
      if (healthScoreAnnotation) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setVisibleAnnotations(prev => [...prev, healthScoreAnnotation]);
        setShowFinalScore(true);
      }

      setCurrentAnalysisText('Analyse terminee !');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPhase('results');
    } catch {
      toast.error('Scan failed. Please try again.');
      setPhase('camera');
      setCapturedImage(null);
      startCamera();
    }
  };

  const saveAnalysisWithPreocupent = async (
    base64: string,
    preocupent: PreocupentZoneKey[],
    forcedCaptureSequence?: ScanAngle[],
  ) => {
    if (!canSaveAnalysis) {
      toast.error(analysisBlockedMessage || 'Analysis limit reached for your plan.');
      return;
    }

    setSaving(true);
    try {
      if (!result) {
        toast.error('No scan result available to save. Please run a scan first.');
        return;
      }

      const sequence = (forcedCaptureSequence && forcedCaptureSequence.length === 3)
        ? forcedCaptureSequence
        : (captureSequence.length === 3 ? captureSequence : ['front', 'left', 'right']);
      const imageByAngle = {
        [sequence[0]]: capturedImagesByAngle[sequence[0] as ScanAngle] || capturedImage || '',
        [sequence[1]]: capturedImagesByAngle[sequence[1] as ScanAngle] || capturedImage || '',
        [sequence[2]]: capturedImagesByAngle[sequence[2] as ScanAngle] || capturedImage || '',
      } as Record<ScanAngle, string>;

      await analysisService.scan({
        frontImage: imageByAngle.front.split(',')[1] || base64,
        leftImage: imageByAngle.left.split(',')[1] || base64,
        rightImage: imageByAngle.right.split(',')[1] || base64,
        mimeType: 'image/jpeg',
        saveImage: true,
        saveAnalysis: true,
        preocupent,
        cachedAnalysis: result,
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

  const handlePreocupentConfirm = async (zones: PreocupentZoneKey[]) => {
    const pendingAction = pendingPreocupentAction;
    setSelectedPreocupent(zones);
    setPreocupentConfirming(true);
    setPreocupentModalOpen(false);
    setPendingPreocupentAction(null);

    try {
      if (!pendingAction) return;

      if (pendingAction.mode === 'scan') {
        await runScanAnalysis(pendingAction.base64, zones, ['front', 'left', 'right']);
      } else {
        await saveAnalysisWithPreocupent(pendingAction.base64, zones, ['front', 'left', 'right']);
      }
    } finally {
      setPreocupentConfirming(false);
    }
  };

  const closePreocupentModal = () => {
    if (preocupentConfirming || saving) return;
    setPreocupentModalOpen(false);
    setPendingPreocupentAction(null);
  };

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const captureFrameFromVideo = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const waitForVideoReady = async (timeoutMs = 4000): Promise<boolean> => {
    const video = videoRef.current;
    if (!video) return false;

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        return true;
      }
      await wait(120);
    }

    return false;
  };

  const detectPoseFromVideo = async (): Promise<{ pose: PoseLabel; yaw: number } | null> => {
    const video = videoRef.current;
    if (!video) return null;

    const detection = await faceapi.detectSingleFace(video).withFaceLandmarks();
    if (!detection) return null;

    const leftEye = detection.landmarks.getLeftEye();
    const rightEye = detection.landmarks.getRightEye();
    const nose = detection.landmarks.getNose();
    if (!leftEye.length || !rightEye.length || !nose.length) return null;

    const avgX = (points: faceapi.Point[]) => points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const leftEyeX = avgX(leftEye);
    const rightEyeX = avgX(rightEye);
    const eyeDistance = Math.max(1, Math.abs(rightEyeX - leftEyeX));
    const noseTipX = nose[Math.min(3, nose.length - 1)].x;
    const yaw = (noseTipX - (leftEyeX + rightEyeX) / 2) / eyeDistance;

    if (Math.abs(yaw) <= 0.09) return { pose: 'front', yaw };
    return { pose: yaw > 0 ? 'right' : 'left', yaw };
  };

  const waitForExpectedPose = async (
    expected: ScanAngle,
    previousSideSign?: number,
    timeoutMs = 9000,
  ): Promise<{ matched: boolean; sideSign?: number }> => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const pose = await detectPoseFromVideo();
      if (!pose) {
        await wait(220);
        continue;
      }

      if (expected === 'front') {
        if (pose.pose === 'front') return { matched: true };
      } else {
        const sideSign = Math.sign(pose.yaw);
        if (Math.abs(pose.yaw) >= 0.12) {
          if (expected === 'left') return { matched: true, sideSign };
          if (expected === 'right' && previousSideSign && sideSign === -previousSideSign) {
            return { matched: true, sideSign };
          }
        }
      }

      await wait(220);
    }

    return { matched: false };
  };

  // Face Verification + Capture + Scan (3 captures: front, left, right)
  const captureAndScan = async () => {
    const video = videoRef.current;
    if (!video || isAutoCapturing) return;
    setIsAutoCapturing(true);
    setAutoCaptureHint('Démarrage de la capture automatique...');
    setCapturedImagesByAngle({});
    setCaptureSequence([]);
    setCapturedImage(null);

    if (isModelLoaded) {
      setPhase('verifying');

      const verification = await verifyFromVideo(video);

        if (!verification) {
          setVerificationMessage('Erreur lors de la verification faciale. Veuillez reessayer.');
          setLocalVerificationResult({ needsProfilePhoto: false });
          setPhase('verification_failed');
          setIsAutoCapturing(false);
          setAutoCaptureHint('');
          return;
        }

        if (!verification.verified) {
          setVerificationMessage(verification.message);
          setLocalVerificationResult({ needsProfilePhoto: verification.needsProfilePhoto });
          setPhase('verification_failed');
          stopCamera();
          setIsAutoCapturing(false);
          setAutoCaptureHint('');
          return;
        }

      setVerificationMessage(verification.message);
      toast.success(verification.message, { duration: 2000 });
    }
    try {
      setPhase('camera');
      await wait(120);
      if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      const readyAfterVerify = await waitForVideoReady(6000);
      if (!readyAfterVerify) {
        await startCamera();
        await wait(400);
      }
      const angleOrder: ScanAngle[] = ['front', 'left', 'right'];
      const instructions: Record<ScanAngle, string> = {
        front: 'Étape 1/3: restez bien face caméra.',
        left: 'Étape 2/3: tournez vers un profil latéral.',
        right: 'Étape 3/3: tournez vers l’autre profil.',
      };

      let nextCapturedByAngle: Partial<Record<ScanAngle, string>> = {};
      let nextSequence: ScanAngle[] = [];
      let firstSideSign: number | undefined;

      for (const angle of angleOrder) {
        setAutoCaptureHint(instructions[angle]);
        await wait(350);

        const poseCheck = await waitForExpectedPose(angle, firstSideSign);
        if (!poseCheck.matched) {
          throw new Error(
            angle === 'front'
              ? 'Face frontale non détectée. Regardez la caméra.'
              : angle === 'left'
                ? 'Profil latéral non détecté. Tournez davantage votre tête.'
                : 'Profil opposé non détecté. Tournez la tête de l’autre côté.',
          );
        }
        if (angle === 'left' && poseCheck.sideSign) {
          firstSideSign = poseCheck.sideSign;
        }

        const identityStepCheck = await verifyFromVideo(videoRef.current as HTMLVideoElement);
        if (!identityStepCheck?.verified) {
          throw new Error(
            identityStepCheck?.message || 'Vérification faciale échouée pendant la capture.',
          );
        }
        await wait(450);

        const videoReady = await waitForVideoReady(4000);
        if (!videoReady) {
          // silently continue with fallback capture path
        }

        // Tolérant: on retente quelques fois même si readyState tarde.
        let dataUrl: string | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          dataUrl = captureFrameFromVideo();
          if (dataUrl) break;
          await wait(220);
        }
        if (!dataUrl) {
          throw new Error('Impossible de capturer la vidéo en direct.');
        }

        nextCapturedByAngle = { ...nextCapturedByAngle, [angle]: dataUrl };
        nextSequence = [...nextSequence, angle];
        setCapturedImagesByAngle(nextCapturedByAngle);
        setCaptureSequence(nextSequence);
        setCapturedImage(dataUrl);

        if (angle !== 'right') {
          toast.success(
            angle === 'front'
              ? 'Face frontale capturée. Préparez le profil gauche.'
              : 'Profil gauche capturé. Préparez le profil droit.',
            { duration: 1200 },
          );
        }
      }

      const finalBase64 = (nextCapturedByAngle.right || '').split(',')[1];

      if (!finalBase64) {
        throw new Error('Capture finale indisponible.');
      }

      if (!selectedPreocupent.length) {
        setPendingPreocupentAction({ mode: 'scan', base64: finalBase64 });
        setPreocupentModalOpen(true);
        return;
      }

      await runScanAnalysis(finalBase64, selectedPreocupent, nextSequence);
    } catch (error) {
      console.error(error);
      toast.error('Auto-capture échouée. Veuillez réessayer.');
      setPhase('camera');
    } finally {
      setIsAutoCapturing(false);
      setAutoCaptureHint('');
    }
  };

  // Save scan as full analysis
  const saveAnalysis = async () => {
    if (!canvasRef.current) return;
    if (!canSaveAnalysis) {
      toast.error(analysisBlockedMessage || 'Analysis limit reached for your plan.');
      return;
    }

    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1];

    if (captureSequence.length < 3) {
      toast.error('Capturez d’abord les 3 angles (front, gauche, droite).');
      return;
    }

    if (!selectedPreocupent.length) {
      setPendingPreocupentAction({ mode: 'save', base64 });
      setPreocupentModalOpen(true);
      return;
    }

    await saveAnalysisWithPreocupent(base64, selectedPreocupent, captureSequence);
  };

  // ─── Retake ───
  const retake = () => {
    setResult(null);
    setEvolutionRemark(null);
    setCapturedImage(null);
    setVisibleAnnotations([]);
    setAnalysisProgress(0);
    setCurrentAnalysisText('');
    setCapturedImagesByAngle({});
    setCaptureSequence([]);
    setLoadingCapturedImages({});
    setIsAutoCapturing(false);
    setAutoCaptureHint('');
    setPhase('camera');
    startCamera();
  };

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const captureProgress = Math.round((captureSequence.length / 3) * 100);
  const angleDisplayNames: Record<ScanAngle, string> = {
    front: 'Front',
    left: 'Gauche',
    right: 'Droite',
  };
  const nextCaptureLabel =
    captureSequence.length === 0
      ? 'Face frontale'
      : captureSequence.length === 1
        ? 'Profil gauche'
        : 'Profil droit';

  const detailedScores = extractDetailedScores(result);

  return createPortal(
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
              zIndex: 1300,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl mx-auto max-h-[95vh] overflow-y-auto hidden-scrollbar"
            style={{ zIndex: 1301 }}
          >
            <div
              className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white"
            >
              {/* Top gradient accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0EA5E9] via-indigo-400 to-cyan-500" />

              {/* Decorative glow circles */}
              <div
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #0EA5E9, transparent)',
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
            {(phase === 'camera' || phase === 'verifying') && (
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="p-2.5 rounded-2xl flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.1))',
                    border: '1px solid rgba(14,165,233,0.1)',
                  }}
                >
                  <Camera className="w-6 h-6 text-[#0EA5E9]" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-xl leading-tight">
                    Live Skin Scan
                  </h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {phase === 'camera' &&
                        `Capture ${Math.min(captureSequence.length + 1, 3)}/3 · ${captureSequence.length === 0 ? 'Front' : captureSequence.length === 1 ? 'Gauche' : 'Droite'}`}
                      {phase === 'verifying' && 'Vérification de votre identité...'}
                    </p>
                    {phase === 'camera' && isAutoCapturing && (
                      <p className="text-[11px] text-[#0EA5E9] mt-1 font-medium">{autoCaptureHint}</p>
                    )}
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
                      className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20"
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
                        <div className="relative w-56 h-56">
                          <div className="absolute inset-0 rounded-full border border-white/25" />
                          <motion.div
                            className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#22D3EE] border-r-cyan-400"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          />
                          <motion.div
                            className="absolute inset-[18px] rounded-full border border-dashed border-white/35"
                            animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <p className="text-sm font-medium opacity-90">
                              Capture {Math.min(captureSequence.length + 1, 3)}/3
                            </p>
                            <p className="text-xs opacity-75">{nextCaptureLabel}</p>
                            <p className="text-lg font-bold mt-1">{captureProgress}%</p>
                          </div>
                        </div>
                        <div className="absolute text-center text-white text-sm font-medium opacity-80 bottom-4">
                          Alignez votre visage puis capturez
                        </div>
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-center gap-4 mb-1">
                      {(['front', 'left', 'right'] as ScanAngle[]).map((angle, index) => {
                        const done = !!capturedImagesByAngle[angle];
                        const current = captureSequence.length === index;

                        return (
                          <div key={angle} className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold ${
                                done
                                  ? 'bg-emerald-500 border-emerald-400 text-white'
                                  : current
                                    ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-[#0EA5E9]'
                                    : 'bg-gray-100 border-gray-300 text-gray-400'
                              }`}
                            >
                              {done ? '✓' : index + 1}
                            </div>
                            <span className={`text-xs ${current ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                              {angleDisplayNames[angle]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(capturedImagesByAngle).length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {(['front', 'left', 'right'] as ScanAngle[]).map((angle) => {
                          const shot = capturedImagesByAngle[angle];
                          return (
                            <div
                              key={`capture-preview-${angle}`}
                              className="rounded-xl border border-white/20 bg-gradient-to-br from-slate-50 to-white p-1 shadow-sm"
                            >
                              <div className="mb-1 flex items-center justify-between px-1">
                                <span className="text-[10px] font-semibold text-slate-700">
                                  {angleDisplayNames[angle]}
                                </span>
                                <span className={`text-[9px] font-medium ${shot ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {shot ? 'capturée' : 'en attente'}
                                </span>
                              </div>
                              <div className="relative h-14 overflow-hidden rounded-lg bg-slate-100">
                                {shot ? (
                                  <img src={shot} alt={angle} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={captureAndScan}
                      disabled={isAutoCapturing}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
                        isAutoCapturing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] shadow-[#0EA5E9]/20'
                      }`}
                    >
                      {isAutoCapturing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                      {isAutoCapturing ? 'Capture automatique en cours...' : 'Scan automatique (1 clic)'}
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {/* Real-time Analysis with Annotations on Face */}
            {phase === 'analyzing' && capturedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Header for analyzing phase */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2.5 rounded-2xl flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.1))',
                      border: '1px solid rgba(14,165,233,0.1)',
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-[#0EA5E9]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-bold text-xl leading-tight">
                      Analyse en cours
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {currentAnalysisText}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] via-[#06B6D4] to-[#14B8A6]"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Orbital photo layout + annotated face */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ minHeight: 480 }}>
                  {/* Orbital photo arrangement */}
                  <div className="relative flex items-center justify-center" style={{ height: 480 }}>
                    {/* Subtle radial glow behind the center */}
                    <div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: 260,
                        height: 260,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                      }}
                    />

                    {/* Central large circle - main captured image */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
                      className="relative z-10"
                      style={{ width: 200, height: 200 }}
                    >
                      <div
                        className="w-full h-full rounded-full overflow-hidden shadow-2xl"
                        style={{
                          border: '3px solid rgba(14,165,233,0.4)',
                          boxShadow: '0 0 40px rgba(14,165,233,0.15), 0 8px 32px rgba(0,0,0,0.4)',
                        }}
                      >
                        <img
                          src={capturedImage}
                          alt="Captured face"
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      </div>
                      {/* Scanning ring around center */}
                      <motion.div
                        className="absolute inset-[-6px] rounded-full border-2 border-transparent"
                        style={{
                          borderTopColor: 'rgba(14,165,233,0.6)',
                          borderRightColor: 'rgba(6,182,212,0.4)',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>

                    {/* ── Smooth orbital system ── */}
                    {/* Invisible pivot that rotates — children orbit with it */}
                    <motion.div
                      className="absolute pointer-events-none"
                      style={{
                        width: 0,
                        height: 0,
                        top: '50%',
                        left: '50%',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                    >
                      {(['front', 'left', 'right'] as ScanAngle[]).map((angle, idx) => {
                        const orbitRadius = 152;
                        // Start at top (-90°), evenly spread 120° apart
                        const angleDeg = idx * 120 - 90;
                        const rad = (angleDeg * Math.PI) / 180;
                        const x = Math.cos(rad) * orbitRadius;
                        const y = Math.sin(rad) * orbitRadius;
                        const hasImage = !!loadingCapturedImages[angle];

                        return (
                          <motion.div
                            key={angle}
                            className="absolute pointer-events-auto"
                            style={{
                              width: 90,
                              height: 90,
                              left: x - 45,
                              top: y - 45,
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 + idx * 0.15 }}
                          >
                            {/* Counter-rotate so card stays upright */}
                            <motion.div
                              className="w-full h-full relative"
                              animate={{ rotate: -360 }}
                              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                            >
                              {/* Thumbnail */}
                              <div
                                className="w-full h-full overflow-hidden shadow-2xl"
                                style={{
                                  borderRadius: 18,
                                  border: hasImage
                                    ? '2px solid rgba(16,185,129,0.55)'
                                    : '2px solid rgba(255,255,255,0.12)',
                                  boxShadow: hasImage
                                    ? '0 4px 24px rgba(16,185,129,0.18), 0 8px 28px rgba(0,0,0,0.35)'
                                    : '0 8px 28px rgba(0,0,0,0.35)',
                                }}
                              >
                                {hasImage ? (
                                  <img
                                    src={loadingCapturedImages[angle]}
                                    alt={angle}
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                  />
                                ) : (
                                  <div className="w-full h-full animate-pulse bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700" />
                                )}
                              </div>

                              {/* Green checkmark badge */}
                              {hasImage && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center"
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10B981, #059669)',
                                    boxShadow: '0 2px 10px rgba(16,185,129,0.45)',
                                    border: '2px solid rgba(255,255,255,0.95)',
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </motion.div>
                              )}

                              {/* Label */}
                              <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-white/60">
                                {angleDisplayNames[angle]}
                              </p>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </motion.div>

                    {/* Dashed orbital guide ring */}
                    <motion.div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: 344,
                        height: 344,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        border: '1px dashed rgba(14,165,233,0.15)',
                      }}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>

                  {/* Annotations overlay on central image area */}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
                  
                  {/* Scanning effect overlay */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      background: 'linear-gradient(180deg, transparent 0%, rgba(14,165,233,0.1) 50%, transparent 100%)',
                    }}
                  />
                  
                  {/* Scanning line effect */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #0EA5E9, #38BDF8, transparent)',
                      boxShadow: '0 0 20px rgba(14,165,233,0.5)',
                    }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />

                  {/* Annotations */}
                  <AnimatePresence>
                    {visibleAnnotations.map((annotation) => (
                      <motion.div
                        key={annotation.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute z-10"
                        style={{
                          left: `${annotation.position.x}%`,
                          top: `${annotation.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {/* Connector line */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: 30 }}
                          className="absolute top-1/2 -translate-y-1/2 h-px"
                          style={{
                            right: '100%',
                            background: `linear-gradient(90deg, transparent, ${annotation.color})`,
                          }}
                        />
                        
                        {/* Annotation badge */}
                        <motion.div
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-lg whitespace-nowrap"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)',
                            border: `1px solid ${annotation.color}30`,
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <div
                            className="p-1 rounded"
                            style={{ backgroundColor: `${annotation.color}20` }}
                          >
                            <span style={{ color: annotation.color }}>{annotation.icon}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-[9px] text-gray-500 leading-tight">{annotation.label}</p>
                            <p className="text-xs font-bold" style={{ color: annotation.color }}>
                              {annotation.value}
                            </p>
                          </div>
                        </motion.div>

                        {/* Pulsing dot at annotation point */}
                        <motion.div
                          className="absolute w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: annotation.color,
                            left: -35,
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [1, 0.5, 1],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Skin Issue Markers (Acne, Wrinkles, etc.) */}
                  <AnimatePresence>
                    {visibleIssues.map((issue) => {
                      const severityColors = {
                        low: { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706', dot: '#F59E0B' },
                        medium: { bg: '#FED7AA', border: '#EA580C', text: '#C2410C', dot: '#EA580C' },
                        high: { bg: '#FECACA', border: '#DC2626', text: '#B91C1C', dot: '#DC2626' },
                      };
                      const colors = severityColors[issue.severity];
                      
                      return (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, scale: 0, rotate: -10 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="absolute z-20"
                          style={{
                            left: `${issue.position.x}%`,
                            top: `${issue.position.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          {/* Pulsing ring effect for issues */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              backgroundColor: `${colors.dot}20`,
                              width: 40,
                              height: 40,
                              left: -20,
                              top: -20,
                            }}
                            animate={{
                              scale: [1, 1.8, 1],
                              opacity: [0.6, 0, 0.6],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          
                          {/* Issue marker dot */}
                          <motion.div
                            className="relative flex items-center justify-center"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: colors.bg,
                              border: `2px solid ${colors.border}`,
                              boxShadow: `0 0 12px ${colors.dot}60`,
                            }}
                            whileHover={{ scale: 1.2 }}
                          >
                            <span style={{ color: colors.text }}>{issue.icon}</span>
                          </motion.div>
                          
                          {/* Issue label tooltip */}
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap"
                          >
                            <div
                              className="px-2 py-1 rounded-md text-[10px] font-semibold shadow-lg"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.85)',
                                color: 'white',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              {issue.label}
                              <span 
                                className="ml-1 px-1 rounded text-[8px]"
                                style={{ 
                                  backgroundColor: colors.dot,
                                  color: 'white',
                                }}
                              >
                                {issue.severity === 'high' ? '!!!' : issue.severity === 'medium' ? '!!' : '!'}
                              </span>
                            </div>
                            {/* Tooltip arrow */}
                            <div
                              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                            />
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Final Score Highlight Effect */}
                  {showFinalScore && result && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
                    >
                      <motion.div
                        className="px-6 py-3 rounded-2xl shadow-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
                          backdropFilter: 'blur(12px)',
                          border: result.healthScore >= 70 
                            ? '2px solid rgba(16,185,129,0.5)' 
                            : result.healthScore >= 50 
                              ? '2px solid rgba(245,158,11,0.5)' 
                              : '2px solid rgba(239,68,68,0.5)',
                        }}
                        animate={{
                          boxShadow: [
                            '0 10px 40px rgba(14,165,233,0.3)',
                            '0 10px 60px rgba(6,182,212,0.4)',
                            '0 10px 40px rgba(14,165,233,0.3)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                          >
                            <Activity 
                              className="w-6 h-6" 
                              style={{ 
                                color: result.healthScore >= 70 ? '#10B981' : result.healthScore >= 50 ? '#F59E0B' : '#EF4444' 
                              }} 
                            />
                          </motion.div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 font-medium">Score de Santé</p>
                            <motion.p
                              className="text-2xl font-black"
                              style={{
                                color: result.healthScore >= 70 ? '#10B981' : result.healthScore >= 50 ? '#F59E0B' : '#EF4444',
                              }}
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.2, 1] }}
                              transition={{ delay: 0.2, duration: 0.5 }}
                            >
                              {result.healthScore}/100
                            </motion.p>
                          </div>
                          <Sparkles 
                            className="w-5 h-5 text-cyan-500" 
                            style={{ opacity: result.healthScore >= 70 ? 1 : 0.3 }} 
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                  </div>
                </div>

                {/* Analysis status text */}
                <div className="text-center">
                  <div className="flex justify-center gap-1.5 mt-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#0EA5E9' }}
                        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {visibleAnnotations.length > 0 
                      ? `${visibleAnnotations.length} zones analysées`
                      : 'Initialisation de l\'analyse...'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Face Verification in Progress */}
            {phase === 'verifying' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <motion.div
                  className="relative w-20 h-20 mx-auto mb-5"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: '3px solid transparent',
                      borderTopColor: '#0EA5E9',
                      borderRightColor: '#22D3EE',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <UserCheck className="w-8 h-8 text-[#0EA5E9]" />
                    </motion.div>
                  </div>
                </motion.div>
                <p className="text-gray-900 font-semibold text-lg mb-1">
                  Vérification d'identité...
                </p>
                <p className="text-gray-500 text-sm">
                  Nous vérifions que vous êtes le propriétaire du compte
                </p>
                <div className="flex justify-center gap-1.5 mt-5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#0EA5E9' }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Face Verification Failed */}
            {phase === 'verification_failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: localVerificationResult?.needsProfilePhoto 
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(14,165,233,0.1))'
                      : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(14,165,233,0.1))',
                    border: localVerificationResult?.needsProfilePhoto 
                      ? '2px solid rgba(245,158,11,0.3)'
                      : '2px solid rgba(239,68,68,0.3)',
                  }}
                >
                  {localVerificationResult?.needsProfilePhoto ? (
                    <Camera className="w-12 h-12 text-amber-500" />
                  ) : (
                    <ShieldX className="w-12 h-12 text-red-500" />
                  )}
                </motion.div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {localVerificationResult?.needsProfilePhoto 
                    ? 'Configuration requise'
                    : 'Vérification échouée'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  {verificationMessage}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {localVerificationResult?.needsProfilePhoto ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        if (onNavigateToSettings) {
                          onNavigateToSettings();
                        }
                      }}
                      className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                    >
                      <Camera className="w-4 h-4 inline mr-2" />
                      Configurer ma photo de profil
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setPhase('camera');
                        setVerificationMessage('');
                        setLocalVerificationResult(null);
                        resetVerification();
                        startCamera();
                      }}
                      className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20"
                    >
                      <RotateCcw className="w-4 h-4 inline mr-2" />
                      Réessayer
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </motion.button>
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
                      <div className="text-4xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] bg-clip-text text-transparent">
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

                    {/* Evolution Remark */}
                    {evolutionRemark && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.34 }}
                        className="rounded-2xl p-3"
                        style={{
                          background:
                            evolutionRemark.trend === 'improved'
                              ? 'rgba(16,185,129,0.08)'
                              : evolutionRemark.trend === 'declined'
                                ? 'rgba(239,68,68,0.08)'
                                : 'rgba(14,165,233,0.06)',
                          border:
                            evolutionRemark.trend === 'improved'
                              ? '1px solid rgba(16,185,129,0.2)'
                              : evolutionRemark.trend === 'declined'
                                ? '1px solid rgba(239,68,68,0.2)'
                                : '1px solid rgba(14,165,233,0.14)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-gray-900 text-xs">Évolution vs ancienne analyse</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              evolutionRemark.trend === 'improved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : evolutionRemark.trend === 'declined'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {evolutionRemark.hasHistory
                              ? evolutionRemark.trend === 'improved'
                                ? 'En amélioration'
                                : evolutionRemark.trend === 'declined'
                                  ? 'À surveiller'
                                  : 'Stable'
                              : 'Première base'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-700 leading-relaxed mb-2">{evolutionRemark.remark}</p>
                        {evolutionRemark.hasHistory && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/70 text-gray-700 border border-gray-200">
                              Score: {evolutionRemark.healthScoreChange > 0 ? '+' : ''}
                              {evolutionRemark.healthScoreChange}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/70 text-gray-700 border border-gray-200">
                              Âge peau: {evolutionRemark.skinAgeChange > 0 ? '+' : ''}
                              {evolutionRemark.skinAgeChange}
                            </span>
                          </div>
                        )}
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
                        ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] shadow-[#0EA5E9]/20 hover:shadow-xl'
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
          <PreocupentSelectorModal
            open={preocupentModalOpen}
            initialSelected={selectedPreocupent}
            onClose={closePreocupentModal}
            onConfirm={handlePreocupentConfirm}
            loading={preocupentConfirming || saving}
            confirmLabel="Valider et continuer"
            title="Zones de preoccupation"
            subtitle="Selectionnez les zones avant le lancement de l analyse."
          />
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
