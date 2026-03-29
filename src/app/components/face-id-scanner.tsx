import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, ShieldCheck, ShieldAlert, Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface FaceIDScannerProps {
    userEmail: string;
    userAvatarUrl: string;
    onSuccess: () => void;
    onClose: () => void;
}

const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';

export function FaceIDScanner({ userEmail, userAvatarUrl, onSuccess, onClose }: FaceIDScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'scanning' | 'success' | 'error'>('loading');
    const [matchScore, setMatchScore] = useState<number>(0);
    const [scanProgress, setScanProgress] = useState<number>(0);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [referenceDescriptor, setReferenceDescriptor] = useState<Float32Array | null>(null);
    const [isReferenceLoading, setIsReferenceLoading] = useState(false);

    // Effect to attach stream to video element
    useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream, scanStatus]);

    // Effect to load reference descriptor once
    useEffect(() => {
        const loadReference = async () => {
            if (!isModelsLoaded || !userAvatarUrl || referenceDescriptor) return;

            setIsReferenceLoading(true);
            try {
                // Optimize Google/Facebook URLs for higher resolution if possible
                let optimizedUrl = userAvatarUrl;
                if (userAvatarUrl.includes('googleusercontent.com')) {
                    optimizedUrl = userAvatarUrl.replace('=s96-c', '=s400-c').replace('/s96-c/', '/s400-c/');
                } else if (userAvatarUrl.includes('facebook.com')) {
                    optimizedUrl = userAvatarUrl + (userAvatarUrl.includes('?') ? '&' : '?') + 'width=400&height=400';
                }

                // Use backend proxy to avoid 429 and CORS issues with Google/Facebook, 
                // but use data URLs directly as they don't have CORS issues
                const proxyUrl = userAvatarUrl.startsWith('data:')
                    ? userAvatarUrl
                    : `http://localhost:3000/auth/proxy-avatar?url=${encodeURIComponent(optimizedUrl)}`;

                // Manually load image to have better control over CORS and errors
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = proxyUrl;

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error("Failed to load reference image"));
                });

                // SSD Mobilenet V1 is much more accurate for static reference images
                // Try with default minConfidence (0.5) first
                let detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                // If it fails, try a very low threshold (0.2) as a last resort
                if (!detection) {
                    detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                }

                if (detection) {
                    setReferenceDescriptor(detection.descriptor);
                } else {
                    toast.error("Avatar non disponible. Veuillez réessayer.");
                }
            } catch (error) {
                console.error("Error loading reference image:", error);
                toast.error("Échec du chargement de l'avatar. Veuillez vérifier votre connexion.");
            } finally {
                setIsReferenceLoading(false);
            }
        };

        loadReference();
    }, [isModelsLoaded, userAvatarUrl]);

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                ]);
                setIsModelsLoaded(true);
                setScanStatus('idle');
            } catch (error) {
                console.error('Error loading face-api models:', error);
                toast.error('Erreur lors du chargement des modèles FaceID');
            }
        };
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: { width: 640, height: 480 } })
            .then((stream) => {
                setVideoStream(stream);
                setScanStatus('scanning');
            })
            .catch((err) => {
                console.error('Error accessing camera:', err);
                toast.error('Impossible d\'accéder à la caméra');
            });
    };

    const stopVideo = () => {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
    };

    const handleScan = async () => {
        if (!videoRef.current || !isModelsLoaded) {
            return;
        }

        if (!referenceDescriptor && !isReferenceLoading) {
            toast('Avatar non disponible. Analyse en mode camera.', { icon: '⚠️' });
        }

        setIsScanning(true);
        setScanProgress(0);
        setMatchScore(0);

        try {
            const faceMatcher = referenceDescriptor
                ? new faceapi.FaceMatcher(referenceDescriptor, 0.6)
                : null;

            // 2. Continuous detection from video
            let matchFound = false;
            let currentProgress = 0;
            const scanInterval = setInterval(async () => {
                if (!videoRef.current) {
                    clearInterval(scanInterval);
                    return;
                }

                const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

                if (detections) {
                    const score = faceMatcher
                        ? 1 - faceMatcher.findBestMatch(detections.descriptor).distance
                        : detections.detection.score;
                    setMatchScore(score);

                    const isValidMatch = faceMatcher ? score > 0.55 : score > 0.45;
                    if (isValidMatch) {
                        currentProgress += Math.random() * 15 + 10; // Increment progress
                        if (currentProgress >= 100) {
                            currentProgress = 100;
                            matchFound = true;
                            setScanStatus('success');
                            clearInterval(scanInterval);
                            setIsScanning(false);
                            stopVideo();
                            setTimeout(() => {
                                onSuccess();
                            }, 1500);
                        }
                        setScanProgress(currentProgress);
                    } else {
                        // Slowly decay progress if no match
                        currentProgress = Math.max(0, currentProgress - 5);
                        setScanProgress(currentProgress);
                    }
                }
            }, 500);

            // Timeout after 15 seconds
            setTimeout(() => {
                if (!matchFound) {
                    clearInterval(scanInterval);
                    setIsScanning(false);
                    setScanStatus('error');
                    toast.error("Échec de la reconnaissance faciale. Réessayez.");
                }
            }, 15000);

        } catch (error) {
            console.error('Scan error:', error);
            toast.error('Erreur pendant le scan');
            setIsScanning(false);
        }
    };

    useEffect(() => {
        return () => stopVideo();
    }, []);

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <AnimatePresence>
          {/* Full-page blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={() => { stopVideo(); onClose(); }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 199,
              willChange: 'backdrop-filter, opacity',
            } as React.CSSProperties}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-lg rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white">
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
                onClick={() => { stopVideo(); onClose(); }}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
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
                    <h3 className="text-gray-900 font-bold text-xl leading-tight">FaceID Login</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{userEmail}</p>
                  </div>
                </div>

                {/* Scan Area */}
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative aspect-square mx-auto mb-6 overflow-hidden rounded-2xl bg-slate-900 border border-gray-200 shadow-lg"
                >
                    {scanStatus === 'loading' ? (
                        <motion.div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="relative w-16 h-16"
                          >
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                border: '3px solid transparent',
                                borderTopColor: '#0EA5E9',
                                borderRightColor: '#8B5CF6',
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Camera className="w-7 h-7 text-[#0EA5E9]" />
                              </motion.div>
                            </div>
                          </motion.div>
                          <p className="text-sm font-medium text-white text-center">Chargement de l'IA...</p>
                        </motion.div>
                    ) : scanStatus === 'idle' ? (
                        <motion.div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                        >
                          <div className="w-20 h-20 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
                            <ShieldCheck className="w-10 h-10 text-[#0EA5E9]" />
                          </div>
                          <p className="text-center px-6 text-gray-400 text-sm">Prêt pour le scan facial</p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startVideo}
                            className="px-6 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] text-white shadow-lg shadow-[#0EA5E9]/20"
                          >
                            Démarrer la caméra
                          </motion.button>
                        </motion.div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Overlay with Scan Ball Animation */}
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Hole in the middle */}
                                <div className="absolute inset-0 bg-black/40" style={{
                                    clipPath: 'path("M0 0h1000v1000H0z M500 500m-180 0a180 180 0 1 0 360 0a180 180 0 1 0 -360 0")',
                                    fillRule: 'evenodd'
                                }} />

                                {/* Circular Border */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] border-2 border-white/30 rounded-full" />

                                {/* The Scanning Ball (La Boule de Scan) */}
                                {scanStatus === 'scanning' && (
                                    <>
                                        {/* Rotating orbiting ball */}
                                        <motion.div
                                            animate={{
                                                rotate: 360,
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px]"
                                        >
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] border border-white/50" />
                                        </motion.div>

                                        {/* Scanning Beam (Line) */}
                                        <motion.div
                                            animate={{
                                                top: ['25%', '75%', '25%'],
                                                opacity: [0.4, 0.8, 0.4]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="absolute left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                        />

                                        {/* Central Pulsating Core */}
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.05, 1],
                                                opacity: [0.1, 0.2, 0.1]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-cyan-500 rounded-full"
                                        />
                                    </>
                                )}

                                {/* Progress Circle based on scanProgress */}
                                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] -rotate-90">
                                    <circle
                                        cx="190"
                                        cy="190"
                                        r="185"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="text-white/10"
                                    />
                                    <motion.circle
                                        cx="190"
                                        cy="190"
                                        r="185"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeDasharray={2 * Math.PI * 185}
                                        animate={{ strokeDashoffset: (2 * Math.PI * 185) * (1 - scanProgress / 100) }}
                                        className="text-blue-500"
                                        transition={{ type: 'spring', damping: 20 }}
                                    />
                                </svg>

                                {/* Percentage Text Overlay */}
                                {scanStatus === 'scanning' && isScanning && (
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1 rounded-full border border-white/20">
                                        <p className="text-white text-xs font-bold font-mono">
                                            SCAN: {Math.round(scanProgress)}%
                                        </p>
                                    </div>
                                )}

                                {/* Scan Status Indicators */}
                                <AnimatePresence>
                                    {scanStatus === 'success' && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm"
                                        >
                                            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40">
                                                <ShieldCheck className="w-12 h-12 text-white" />
                                            </div>
                                        </motion.div>
                                    )}
                                    {scanStatus === 'error' && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm"
                                        >
                                            <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                                                <ShieldAlert className="w-12 h-12 text-white" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                    {scanStatus === 'scanning' && (
                        <div className="space-y-3">
                            <p className="text-gray-600 text-sm">
                                Positionnez votre visage au centre du cercle
                            </p>
                                                        {!isScanning ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleScan}
                                                                    disabled={isReferenceLoading}
                                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
                                                                        isReferenceLoading
                                      ? 'bg-gray-400 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] shadow-[#0EA5E9]/20 hover:shadow-xl'
                                  }`}
                                >
                                  {isReferenceLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Chargement...
                                    </>
                                  ) : "Commencer l'analyse"}
                                </motion.button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-[#0EA5E9] font-medium py-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyse en cours...
                                </div>
                            )}
                        </div>
                    )}
                    {scanStatus === 'success' && (
                        <motion.p
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="text-green-500 font-bold text-lg"
                        >
                          Visage reconnu !
                        </motion.p>
                    )}
                    {scanStatus === 'error' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setScanStatus('idle'); setScanProgress(0); setMatchScore(0); }}
                          className="w-full py-3 rounded-xl font-bold text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          Réessayer
                        </motion.button>
                    )}
                </motion.div>
              </div>
            </div>
          </motion.div>
                </AnimatePresence>,
                document.body
    );
}
