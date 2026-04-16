import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, RefreshCw, Download, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';

interface VisualFilters {
  smoothness: number;      // 0-100 - blur for smoothness
  brightness: number;      // -50 to +50
  redness: number;         // -100 to 0 (reduction)
  saturation: number;      // -30 to +30
  acneReduction: number;   // 0-100
  hydration: number;       // 0-100 - slight glow effect
  evenness: number;        // 0-100 - reduce contrast in skin tones
}

interface SkinSimulationCanvasProps {
  imageUrl: string;
  filters: VisualFilters;
  productName: string;
  simulationPeriod: number;
  onClose?: () => void;
}

export const SkinSimulationCanvas: React.FC<SkinSimulationCanvasProps> = ({
  imageUrl,
  filters,
  productName,
  simulationPeriod,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAndProcessImage = async () => {
      setIsProcessing(true);
      setError(null);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = canvasRef.current;
        const originalCanvas = originalCanvasRef.current;
        
        if (!canvas || !originalCanvas) return;
        
        // Use willReadFrequently for better performance
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx || !originalCtx) return;
        
        // Set canvas size
        const maxWidth = 500;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        originalCanvas.width = canvas.width;
        originalCanvas.height = canvas.height;
        
        // Draw original
        originalCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Draw and process
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Apply filters
        try {
          applyFilters(ctx, canvas.width, canvas.height, filters);
          setIsProcessing(false);
        } catch (e) {
          console.error('Error applying filters:', e);
          setError('Erreur lors du traitement de l\'image');
          setIsProcessing(false);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image from:', imageUrl);
        setError('Impossible de charger l\'image. Vérifiez votre connexion.');
        setIsProcessing(false);
      };
      
      // Handle both base64 and URLs
      if (imageUrl.startsWith('data:')) {
        img.src = imageUrl;
      } else {
        // For external URLs, try to load directly (CORS might block)
        img.src = imageUrl;
      }
    };
    
    loadAndProcessImage();
  }, [imageUrl, filters]);

  // Advanced skin detection using multiple color space analysis
  const isSkinPixel = (r: number, g: number, b: number): number => {
    // RGB rule-based detection
    const rgbSkin = r > 95 && g > 40 && b > 20 &&
                    r > g && r > b &&
                    Math.abs(r - g) > 15 &&
                    r - Math.min(g, b) > 15;
    
    // YCbCr color space (more robust for different skin tones)
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    
    const ycbcrSkin = cr > 133 && cr < 173 && cb > 77 && cb < 127;
    
    // HSV analysis for skin tone
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : delta / max;
    const v = max / 255;
    
    // Skin typically in hue range 0-50 with moderate saturation
    const hsvSkin = h >= 0 && h <= 50 && s >= 0.15 && s <= 0.7 && v >= 0.2;
    
    // Return confidence score (0-1)
    let score = 0;
    if (rgbSkin) score += 0.4;
    if (ycbcrSkin) score += 0.35;
    if (hsvSkin) score += 0.25;
    
    return score;
  };

  const applyFilters = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    f: VisualFilters
  ) => {
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Amplify filter values for more visible effects
    // Keep effects subtle to avoid over-processed/"dirty" skin rendering.
    const safe = {
      smoothness: Math.min(38, Math.max(0, f.smoothness)),
      brightness: Math.min(14, Math.max(-8, f.brightness)),
      redness: Math.min(0, Math.max(-20, f.redness)),
      saturation: Math.min(10, Math.max(-10, f.saturation)),
      acneReduction: Math.min(34, Math.max(0, f.acneReduction)),
      hydration: Math.min(36, Math.max(0, f.hydration)),
      evenness: Math.min(32, Math.max(0, f.evenness)),
    };
    
    // First pass: collect skin pixel statistics for better processing
    let skinPixelCount = 0;
    let avgSkinR = 0, avgSkinG = 0, avgSkinB = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const skinConfidence = isSkinPixel(r, g, b);
      
      if (skinConfidence > 0.5) {
        skinPixelCount++;
        avgSkinR += r;
        avgSkinG += g;
        avgSkinB += b;
      }
    }
    
    if (skinPixelCount > 0) {
      avgSkinR /= skinPixelCount;
      avgSkinG /= skinPixelCount;
      avgSkinB /= skinPixelCount;
    }
    
    // Target ideal skin tone (slightly warmer and more even)
    const targetR = Math.min(255, avgSkinR * 1.05);
    const targetG = Math.min(255, avgSkinG * 1.02);
    const targetB = Math.min(255, avgSkinB * 0.98);
    
    // Second pass: apply transformations
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      const skinConfidence = isSkinPixel(r, g, b);
      
      if (skinConfidence > 0.3) {
        const intensity = skinConfidence;
        
        // 1. REDNESS REDUCTION - Very visible effect
        if (safe.redness < 0) {
          const rednessStrength = Math.abs(safe.redness) / 100;
          const excessRed = r - Math.max(g, b);
          
          if (excessRed > 10) {
            // Reduce red excess significantly
            const reduction = excessRed * rednessStrength * intensity * 0.8;
            r = Math.max(0, r - reduction);
            // Slightly boost green to balance
            g = Math.min(255, g + reduction * 0.2);
          }
        }
        
        // 2. EVENNESS - Blend towards average skin tone
        if (safe.evenness > 0) {
          const evennessStrength = safe.evenness / 100 * intensity * 0.38;
          r = r + (targetR - r) * evennessStrength;
          g = g + (targetG - g) * evennessStrength;
          b = b + (targetB - b) * evennessStrength;
        }
        
        // 3. HYDRATION - Add warm, healthy glow
        if (safe.hydration > 0) {
          const hydrationStrength = safe.hydration / 100 * intensity;
          // Add warmth and slight luminosity
          r = Math.min(255, r + hydrationStrength * 15);
          g = Math.min(255, g + hydrationStrength * 8);
          b = Math.min(255, b + hydrationStrength * 3);
        }
        
        // 4. ACNE REDUCTION - Reduce dark spots and blemishes
        if (safe.acneReduction > 0) {
          const acneStrength = safe.acneReduction / 100 * intensity;
          // Detect potential blemishes (darker than average skin)
          const brightness = (r + g + b) / 3;
          const avgBrightness = (avgSkinR + avgSkinG + avgSkinB) / 3;
          
          if (brightness < avgBrightness * 0.85) {
            // This might be a dark spot - lighten it
            const correction = (avgBrightness - brightness) * acneStrength * 0.6;
            r = Math.min(255, r + correction);
            g = Math.min(255, g + correction * 0.9);
            b = Math.min(255, b + correction * 0.8);
          }
          
          // Also reduce very red spots (potential acne)
          if (r > g * 1.3 && r > b * 1.3) {
            const rCorrection = (r - (g + b) / 2) * acneStrength * 0.4;
            r = Math.max(g, r - rCorrection);
          }
        }
      }
      
      // 5. BRIGHTNESS - Apply to all pixels
      if (safe.brightness !== 0) {
        const brightAmount = safe.brightness * 1.0;
        r = Math.max(0, Math.min(255, r + brightAmount));
        g = Math.max(0, Math.min(255, g + brightAmount));
        b = Math.max(0, Math.min(255, b + brightAmount));
      }
      
      // 6. SATURATION - Enhance or reduce color intensity
      if (safe.saturation !== 0) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const satAmount = 1 + (safe.saturation / 100);
        r = Math.max(0, Math.min(255, gray + satAmount * (r - gray)));
        g = Math.max(0, Math.min(255, gray + satAmount * (g - gray)));
        b = Math.max(0, Math.min(255, gray + satAmount * (b - gray)));
      }
      
      data[i] = Math.round(r);
      data[i + 1] = Math.round(g);
      data[i + 2] = Math.round(b);
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // 7. SMOOTHNESS - Apply blur for skin smoothing effect
    if (safe.smoothness > 0) {
      // Create a blurred version and blend it
      const blurAmount = Math.min(1.6, safe.smoothness / 100 * 1.4);
      const blendAlpha = Math.min(0.26, safe.smoothness / 100 * 0.22);
      
      // Save current state
      const currentData = ctx.getImageData(0, 0, width, height);
      
      // Apply blur
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.filter = 'none';
      
      // Blend with original for selective smoothing
      const blurredData = ctx.getImageData(0, 0, width, height);
      
      for (let i = 0; i < currentData.data.length; i += 4) {
        const origR = currentData.data[i];
        const origG = currentData.data[i + 1];
        const origB = currentData.data[i + 2];
        
        const skinConf = isSkinPixel(origR, origG, origB);
        const localBlend = skinConf > 0.3 ? blendAlpha * skinConf : 0;
        
        currentData.data[i] = origR * (1 - localBlend) + blurredData.data[i] * localBlend;
        currentData.data[i + 1] = origG * (1 - localBlend) + blurredData.data[i + 1] * localBlend;
        currentData.data[i + 2] = origB * (1 - localBlend) + blurredData.data[i + 2] * localBlend;
      }
      
      ctx.putImageData(currentData, 0, 0);
    }
    
    // 8. Final glow effect for hydration
    if (safe.hydration > 22) {
      ctx.globalCompositeOperation = 'soft-light';
      const glowIntensity = safe.hydration / 100 * 0.08;
      ctx.fillStyle = `rgba(255, 248, 235, ${glowIntensity})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `simulation-${productName.replace(/\s+/g, '-')}-${simulationPeriod}j.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Simulation Visuelle</h3>
          <p className="text-sm text-gray-500">
            Après {simulationPeriod} jours avec {productName}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            title="Comparer avant/après"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.min(z + 0.25, 2))}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            title="Zoom +"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            title="Zoom -"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={downloadImage}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
            title="Télécharger"
            disabled={!!error}
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div className="relative overflow-hidden rounded-xl bg-gray-100" style={{ minHeight: 300 }}>
        {isProcessing && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Application des effets...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="flex flex-col items-center gap-3 p-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-sm text-gray-600">{error}</p>
              <p className="text-xs text-gray-400">
                L'image de votre analyse ne peut pas être traitée. Essayez avec une nouvelle analyse.
              </p>
            </div>
          </div>
        )}
        
        <div 
          className="relative flex justify-center"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}
        >
          {showComparison ? (
            // Before/After Comparison Slider
            <div className="relative" style={{ width: 'fit-content' }}>
              <canvas 
                ref={originalCanvasRef} 
                className="rounded-lg"
                style={{ display: 'block' }}
              />
              <div 
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: `${sliderPosition}%`, height: '100%' }}
              >
                <canvas 
                  ref={canvasRef}
                  className="rounded-lg"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              </div>
              
              {/* Slider Control */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-gray-400" />
                    <div className="w-0.5 h-3 bg-gray-400" />
                  </div>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
              
              {/* Labels */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                Après
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                Avant
              </div>
            </div>
          ) : (
            // Single processed image
            <canvas 
              ref={canvasRef}
              className="rounded-lg shadow-lg"
              style={{ display: isProcessing ? 'none' : 'block' }}
            />
          )}
        </div>
      </div>
      
      {/* Filter Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-600 mb-2">Effets appliqués :</p>
        <div className="flex flex-wrap gap-2">
          {filters.smoothness > 15 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              Lissage +{Math.round(filters.smoothness)}%
            </span>
          )}
          {filters.brightness > 5 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
              Éclat +{Math.round(filters.brightness)}%
            </span>
          )}
          {filters.redness < -10 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
              Rougeurs {Math.round(filters.redness)}%
            </span>
          )}
          {filters.hydration > 20 && (
            <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">
              Hydratation +{Math.round(filters.hydration)}%
            </span>
          )}
          {filters.evenness > 15 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              Uniformité +{Math.round(filters.evenness)}%
            </span>
          )}
          {filters.acneReduction > 15 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Acné -{Math.round(filters.acneReduction)}%
            </span>
          )}
        </div>
      </div>
      
      {/* Hidden original canvas for comparison */}
      {!showComparison && (
        <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
      )}
    </div>
  );
};

export default SkinSimulationCanvas;
