import React, { useState, useEffect, useRef } from 'react';
import { Frame, SignTranslationMetadata } from '../types/sign-translation';

interface SignLanguageVideoProps {
  postId: string;
  autoPlay?: boolean;
  className?: string;
}

interface SignTranslationData {
  frames: Frame[];
  metadata: SignTranslationMetadata;
  status: string;
}

const SignLanguageVideo: React.FC<SignLanguageVideoProps> = ({
  postId,
  autoPlay = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [translationData, setTranslationData] = useState<SignTranslationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Fetch translation data au mount
  useEffect(() => {
    const fetchTranslation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/sign-translation/videopost/${postId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch translation: ${response.statusText}`);
        }

        const data: SignTranslationData = await response.json();

        if (data.status !== 'completed') {
          throw new Error(`Translation status: ${data.status}`);
        }

        setTranslationData(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load sign language translation'
        );
        setTranslationData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslation();
  }, [postId]);

  // Animation loop pour renderer les frames
  useEffect(() => {
    if (!isPlaying || !translationData || !canvasRef.current) {
      return;
    }

    const fps = translationData.metadata.fps || 24;
    const frameDuration = 1000 / fps; // ms par frame

    const animate = (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const nextFrameIndex = Math.floor(elapsed / frameDuration);

      if (nextFrameIndex < translationData.frames.length) {
        setCurrentFrameIndex(nextFrameIndex);
        renderFrame(translationData.frames[nextFrameIndex], canvasRef.current!);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation terminée
        setIsPlaying(false);
        startTimeRef.current = 0;
      }
    };

    startTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, translationData]);

  // Renderer une frame spécifique avec les keypoints
  const renderFrame = (frame: Frame, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configurer les styles pour les keypoints
    const colors = {
      hand: '#FF6B6B',
      pose: '#4ECDC4',
      connections: '#95E1D3',
    };

    // Scale factor pour adapter les coordonnées aux dimensions du canvas
    const scale = Math.min(canvas.width / 512, canvas.height / 512);

    // Draw hands
    drawKeypointsAndConnections(
      ctx,
      frame.hand_right_keypoints,
      colors.hand,
      colors.connections,
      scale,
      canvas.width / 2
    );

    drawKeypointsAndConnections(
      ctx,
      frame.hand_left_keypoints,
      colors.hand,
      colors.connections,
      scale,
      canvas.width / 2
    );

    // Draw pose
    drawKeypointsAndConnections(
      ctx,
      frame.pose_keypoints,
      colors.pose,
      colors.connections,
      scale,
      canvas.width / 2
    );

    // Draw gloss (texte)
    const gloss = translationData?.metadata.gloss || '';
    if (gloss) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gloss, canvas.width / 2, canvas.height - 10);
    }
  };

  // Dessiner les keypoints et les connexions
  const drawKeypointsAndConnections = (
    ctx: CanvasRenderingContext2D,
    keypoints: Array<{ id: string; x: number; y: number; z: number }>,
    color: string,
    connectionColor: string,
    scale: number,
    offsetX: number
  ) => {
    // Draw connections between keypoints
    ctx.strokeStyle = connectionColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;

    // Simple skeleton connections
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ];

    for (const [start, end] of connections) {
      if (start < keypoints.length && end < keypoints.length) {
        const startKp = keypoints[start];
        const endKp = keypoints[end];

        // Normaliser et scaler les coordonnées
        const x1 = startKp.x * scale + offsetX;
        const y1 = startKp.y * scale + 50;
        const x2 = endKp.x * scale + offsetX;
        const y2 = endKp.y * scale + 50;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Draw keypoints
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;

    for (const kp of keypoints) {
      const x = kp.x * scale + offsetX;
      const y = kp.y * scale + 50;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Controls handlers
  const handlePlayPause = () => {
    if (!translationData) return;
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentFrameIndex(0);
    setIsPlaying(autoPlay);
    startTimeRef.current = 0;
  };

  const handleFrameChange = (newIndex: number) => {
    setCurrentFrameIndex(newIndex);
    setIsPlaying(false);
    if (translationData) {
      renderFrame(translationData.frames[newIndex], canvasRef.current!);
    }
  };

  return (
    <div className={`w-full bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Canvas pour display */}
      {!(isLoading || error) && translationData && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className="w-full h-auto"
          />

          {/* Metadata overlay */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white p-2 rounded text-sm">
            <div>Frames: {translationData.frames.length}</div>
            <div>FPS: {translationData.metadata.fps}</div>
            <div>Current: {currentFrameIndex + 1}</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="w-full h-96 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading sign language translation...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="w-full h-96 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <p className="text-red-400 mb-2">⚠️ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {!(isLoading || error) && translationData && (
        <div className="bg-gray-900 p-4 border-t border-gray-700">
          {/* Play/Pause buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handlePlayPause}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              ↻ Restart
            </button>
          </div>

          {/* Frame slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={translationData.frames.length - 1}
              value={currentFrameIndex}
              onChange={(e) => handleFrameChange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-300">
              Frame {currentFrameIndex + 1} of {translationData.frames.length}
            </div>
          </div>

          {/* Gloss display */}
          {translationData.metadata.gloss && (
            <div className="mt-4 p-3 bg-gray-800 rounded text-white text-center">
              <div className="text-xs text-gray-400 mb-1">Gloss</div>
              <div className="font-semibold">{translationData.metadata.gloss}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SignLanguageVideo;
