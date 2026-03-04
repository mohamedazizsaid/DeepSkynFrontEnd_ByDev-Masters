import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, ShieldCheck, ShieldAlert, Loader2, X } from 'lucide-react';
import { Button } from './button';
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
                    toast.error("Format d'image non supporté ou visage trop petit.");
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
        if (!videoRef.current || !isModelsLoaded || !referenceDescriptor) {
            if (!referenceDescriptor && !isReferenceLoading) {
                toast.error("Le visage de référence n'est pas encore chargé");
            }
            return;
        }

        setIsScanning(true);
        setScanProgress(0);
        setMatchScore(0);

        try {
            const faceMatcher = new faceapi.FaceMatcher(referenceDescriptor, 0.6);

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
                    const match = faceMatcher.findBestMatch(detections.descriptor);
                    const score = 1 - match.distance;
                    setMatchScore(score);

                    if (score > 0.55) { // Threshold for "looking like the user"
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full relative border border-white/20"
            >
                <button
                    onClick={() => { stopVideo(); onClose(); }}
                    className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">FaceID Login</h2>
                            <p className="text-sm text-slate-500">{userEmail}</p>
                        </div>
                    </div>
                </div>

                <div className="relative aspect-square mx-8 mb-8 overflow-hidden rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700">
                    {scanStatus === 'loading' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Chargement de l'IA...</p>
                        </div>
                    ) : scanStatus === 'idle' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <ShieldCheck className="w-12 h-12 text-blue-500" />
                            </div>
                            <p className="text-center px-8 text-slate-500">Prêt pour le scan facial</p>
                            <Button onClick={startVideo}>Démarrer la caméra</Button>
                        </div>
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
                </div>

                <div className="px-8 pb-8 text-center">
                    {scanStatus === 'scanning' && (
                        <div className="space-y-4">
                            <p className="text-slate-500 text-sm">
                                Positionnez votre visage au centre du cercle
                            </p>
                            {!isScanning ? (
                                <Button
                                    className="w-full h-12"
                                    onClick={handleScan}
                                    disabled={!referenceDescriptor || isReferenceLoading}
                                >
                                    {isReferenceLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Chargement...
                                        </div>
                                    ) : "Commencer l'analyse"}
                                </Button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-blue-500 font-medium py-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyse en cours...
                                </div>
                            )}
                        </div>
                    )}
                    {scanStatus === 'success' && (
                        <p className="text-green-500 font-bold text-lg">Visage reconnu !</p>
                    )}
                    {scanStatus === 'error' && (
                        <Button className="w-full" variant="outline" onClick={() => { setScanStatus('idle'); setScanProgress(0); setMatchScore(0); }}>
                            Réessayer
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
