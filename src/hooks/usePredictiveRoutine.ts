import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { predictiveRoutineService, type GeneratedRoutine, type AnalysisResult } from '../lib/services/predictive-routine.service';
import { useSkinJourney } from './useSkinJourney';

export function usePredictiveRoutine(
  analysisId: string | null,
  analysisResult: AnalysisResult | null,
) {
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);
  const [routineId, setRoutineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { journey } = useSkinJourney();

  // Fonction pour prédire les résultats de la routine AVANT validation
  const predictRoutineResults = () => {
    if (!routine || !journey?.digitalTwin) return null;

    const twin = journey.digitalTwin;
    const currentHealthScore = journey.latestAnalysis?.healthScore || 75;
    
    // Si le twin est activé, on peut faire une prédiction plus précise
    if (twin.enabled && twin.confidence >= 0.3) {
      const improvement = Math.round(twin.confidence * 8 + 2); // 2-10 points
      const expectedScore = Math.min(100, currentHealthScore + improvement);
      
      return {
        current: {
          healthScore: currentHealthScore,
          skinAge: journey.latestAnalysis?.skinAge || 25,
          conditions: journey.latestAnalysis?.conditions || [],
        },
        predicted: {
          healthScore: expectedScore,
          skinAge: Math.max(18, (journey.latestAnalysis?.skinAge || 25) - 1),
          improvement: improvement,
        },
        timeline: '7 jours',
        confidence: Math.round(twin.confidence * 100),
        twinEnhanced: true,
        benefits: [
          'Réduction des imperfections visibles',
          'Amélioration de la texture de peau', 
          'Hydratation optimisée',
          'Éclat naturel restauré',
          'Équilibrage du pH cutané'
        ].slice(0, Math.ceil(twin.confidence * 5)),
        tips: [
          `Basé sur ${twin.snapshotCount} analyses personnelles`,
          `Routine adaptée à votre profil unique`,
          'Prédiction enrichie par votre Digital Twin'
        ]
      };
    } else {
      // Prédiction basique sans twin
      return {
        current: {
          healthScore: currentHealthScore,
          skinAge: journey.latestAnalysis?.skinAge || 25,
          conditions: journey.latestAnalysis?.conditions || [],
        },
        predicted: {
          healthScore: currentHealthScore + 3,
          skinAge: (journey.latestAnalysis?.skinAge || 25),
          improvement: 3,
        },
        timeline: '7 jours',
        confidence: 60,
        twinEnhanced: false,
        benefits: [
          'Nettoyage en profondeur',
          'Hydratation basique',
          'Protection solaire'
        ],
        tips: [
          'Prenez plus d\'analyses pour des prédictions personnalisées',
          'Activez votre Digital Twin pour des résultats précis'
        ]
      };
    }
  };

  // Fonction pour valider et activer la routine
  const validateAndActivate = async () => {
    if (!routineId) {
      toast.error('Aucune routine à valider');
      return;
    }

    try {
      setLoading(true);
      const result = await predictiveRoutineService.validateAndActivateRoutine(routineId);
      
      if (result.success) {
        toast.success('🎉 Routine activée avec succès !');
        
        // Clear cache pour forcer refresh
        if (analysisId) {
          const cacheKey = `predictive_routine_${analysisId}`;
          localStorage.removeItem(cacheKey);
        }
        
        return result;
      } else {
        throw new Error(result.message || 'Échec de validation');
      }
    } catch (err: any) {
      console.error('Error validating routine:', err);
      toast.error('Erreur lors de l\'activation de la routine');
      throw err;
    } finally {
      setLoading(false);
    }
  };

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

  return { 
    routine, 
    routineId, 
    loading, 
    error,
    // Nouvelles fonctions 
    predictResults: predictRoutineResults,
    validateAndActivate,
    // État du twin
    isTwinEnhanced: journey?.digitalTwin?.enabled || false,
    twinConfidence: journey?.digitalTwin?.confidence || 0,
  };
}
