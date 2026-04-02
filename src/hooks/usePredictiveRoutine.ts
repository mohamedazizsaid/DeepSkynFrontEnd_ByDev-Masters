import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { predictiveRoutineService, type GeneratedRoutine, type AnalysisResult } from '../lib/services/predictive-routine.service';

export function usePredictiveRoutine(
  analysisId: string | null,
  analysisResult: AnalysisResult | null,
) {
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);
  const [routineId, setRoutineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId || !analysisResult) {
      return;
    }

    // Check cache first
    const cacheKey = `predictive_routine_${analysisId}`;
    const cached = localStorage.getItem(cacheKey);
    
    console.log('🔍 usePredictiveRoutine - checking cache for:', analysisId);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const expiresAt = new Date(parsed.expiresAt);
        
        console.log('📦 Cache found:', { hasId: !!parsed.id, hasRoutine: !!parsed.routine, expiresAt });
        
        // Check if cache is still valid (within 24h) AND has ID
        if (expiresAt > new Date() && parsed.id) {
          console.log('✅ Using valid cache with ID:', parsed.id);
          setRoutine(parsed.routine);
          setRoutineId(parsed.id);
          return;
        } else {
          // Cache expired or missing ID, remove it
          console.log('🗑️ Removing invalid/outdated cache (expired or missing ID)');
          localStorage.removeItem(cacheKey);
        }
      } catch {
        // Invalid cache, remove it
        console.log('🗑️ Removing corrupted cache');
        localStorage.removeItem(cacheKey);
      }
    }

    // No valid cache, generate new routine
    console.log('🔄 Generating new predictive routine...');
    generateRoutine();

    async function generateRoutine() {
      setLoading(true);
      setError(null);

      try {
        // Get user's geolocation
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });

        const { latitude, longitude } = position.coords;

        // Call API via service
        const data = await predictiveRoutineService.generateRoutine({
          analysisId,
          analysisResult,
          latitude,
          longitude,
        });

        console.log('✅ Routine generated successfully:', { id: data.id, hasRoutine: !!data.routine });

        setRoutine(data.routine);
        setRoutineId(data.id);

        // Cache for 24 hours
        const cacheData = {
          id: data.id,
          routine: data.routine,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));

        console.log('💾 Cached routine with ID:', data.id);

      } catch (err: any) {
        console.error('Error generating predictive routine:', err);
        setError(err.message || 'Failed to generate routine');
        toast.error('Impossible de générer la routine prédictive. Réessayez plus tard.');
      } finally {
        setLoading(false);
      }
    }
  }, [analysisId, analysisResult]);

  return { routine, routineId, loading, error };
}
