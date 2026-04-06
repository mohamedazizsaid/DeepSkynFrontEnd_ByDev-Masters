import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { digitalTwinService, predictiveRoutineService } from '../lib/services';
import type { SkinJourneyResponse } from '../lib/services/digital-twin.service';
import { toast } from 'sonner';

export const SKIN_JOURNEY_QUERY_KEY = ['skin-journey'];

export const useSkinJourney = () => {
  const queryClient = useQueryClient();

  const {
    data: journey,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: SKIN_JOURNEY_QUERY_KEY,
    queryFn: () => digitalTwinService.getSkinJourney(),
    refetchInterval: 30000, // Refresh every 30s
    staleTime: 20000, // Data considered fresh for 20s
    retry: 2,
  });

  // Mutation pour accepter une routine prédictive
  const acceptRoutineMutation = useMutation({
    mutationFn: async (routineId: string) => {
      return predictiveRoutineService.validateAndActivateRoutine(routineId);
    },
    onSuccess: (data) => {
      toast.success('Routine activée avec succès !');
      refetch(); // Refresh journey data
    },
    onError: (error) => {
      console.error('Failed to accept routine:', error);
      toast.error('Erreur lors de l\'activation de la routine');
    },
  });

  // Mutation pour rejeter/reporter une routine prédictive
  const dismissRoutineMutation = useMutation({
    mutationFn: async (routineId: string) => {
      // Note: Vous devrez ajouter ce endpoint au backend si nécessaire
      throw new Error('Dismiss routine not implemented yet');
    },
    onSuccess: () => {
      toast.info('Routine reportée');
      refetch();
    },
    onError: (error) => {
      console.error('Failed to dismiss routine:', error);
      toast.error('Erreur lors du report de la routine');
    },
  });

  // Mutation pour créer une prédiction
  const createPredictionMutation = useMutation({
    mutationFn: digitalTwinService.createPrediction,
    onSuccess: () => {
      toast.success('Prédiction générée !');
      refetch();
    },
    onError: (error) => {
      console.error('Failed to create prediction:', error);
      toast.error('Erreur lors de la création de la prédiction');
    },
  });

  // Mutation pour simuler un produit
  const simulateProductMutation = useMutation({
    mutationFn: digitalTwinService.simulateProduct,
    onSuccess: () => {
      toast.success('Simulation produit terminée !');
      // Optionally refresh or handle the simulation result
    },
    onError: (error) => {
      console.error('Failed to simulate product:', error);
      toast.error('Erreur lors de la simulation');
    },
  });

  // Helper functions pour déterminer l'état UI
  const canPredict = journey?.digitalTwin.predictionsUnlocked || false;
  const isNewUser = journey?.systemState === 'NEW_USER';
  const isBuildingTwin = journey?.systemState === 'BUILDING_TWIN';
  const hasActiveTwin = journey?.digitalTwin.enabled || false;
  const hasPendingRoutine = journey?.predictiveRoutine?.status === 'PENDING';

  // Messages contextuels pour l'UI
  const getContextualMessage = (): string => {
    if (!journey) return '';

    switch (journey.systemState) {
      case 'NEW_USER':
        return 'Prenez votre première photo pour débloquer vos insights personnalisés';
      case 'BUILDING_TWIN':
        return `${journey.digitalTwin.snapshotCount}/3 analyses • Plus que ${3 - journey.digitalTwin.snapshotCount} pour débloquer les prédictions`;
      case 'TWIN_READY':
        return 'Digital Twin créé ! Prédictions en cours de déverrouillage...';
      case 'PREDICTIONS_UNLOCKED':
        return 'Prédictions débloquées ! Découvrez votre peau du futur';
      case 'HIGH_CONFIDENCE':
        return `Confiance élevée (${Math.round(journey.digitalTwin.confidence * 100)}%) • Prédictions très précises`;
      default:
        return '';
    }
  };

  // Actions recommandées selon l'état
  const getRecommendedActions = (): string[] => {
    if (!journey) return [];

    const actions: string[] = [];

    if (journey.systemState === 'NEW_USER') {
      actions.push('Prendre votre première photo');
    } else if (journey.systemState === 'BUILDING_TWIN') {
      actions.push('Continuer les analyses pour améliorer la précision');
    } else if (journey.digitalTwin.predictionsUnlocked) {
      actions.push('Créer une prédiction future');
      actions.push('Simuler un produit');
    }

    if (journey.predictiveRoutine?.status === 'PENDING') {
      actions.push('Valider votre routine personnalisée');
    }

    return actions;
  };

  return {
    // Data
    journey,
    isLoading,
    error,
    
    // State helpers
    canPredict,
    isNewUser,
    isBuildingTwin,
    hasActiveTwin,
    hasPendingRoutine,
    
    // UI helpers
    contextualMessage: getContextualMessage(),
    recommendedActions: getRecommendedActions(),
    
    // Actions
    refetch,
    acceptRoutine: acceptRoutineMutation.mutate,
    dismissRoutine: dismissRoutineMutation.mutate,
    createPrediction: createPredictionMutation.mutateAsync,
    simulateProduct: simulateProductMutation.mutateAsync,
    
    // Loading states
    isAcceptingRoutine: acceptRoutineMutation.isPending,
    isDismissingRoutine: dismissRoutineMutation.isPending,
    isCreatingPrediction: createPredictionMutation.isPending,
    isSimulatingProduct: simulateProductMutation.isPending,
    
    // Last results
    lastPrediction: createPredictionMutation.data,
    lastSimulation: simulateProductMutation.data,
  };
};

// Hook pour obtenir seulement le Digital Twin (plus léger)
export const useDigitalTwin = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['digital-twin'],
    queryFn: () => digitalTwinService.getOrCreateTwin(),
    staleTime: 30000,
  });

  return { twin: data, isLoading, error };
};

// Hook pour les prédictions
export const usePredictions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['digital-twin-predictions'],
    queryFn: () => digitalTwinService.getPredictions(),
    staleTime: 60000, // 1 minute
  });

  return { predictions: data, isLoading, error };
};

// Hook pour les simulations
export const useSimulations = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['digital-twin-simulations'],
    queryFn: () => digitalTwinService.getSimulations(),
    staleTime: 300000, // 5 minutes
  });

  return { simulations: data, isLoading, error };
};