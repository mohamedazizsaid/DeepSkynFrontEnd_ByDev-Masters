import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSkinJourney } from '../hooks/useSkinJourney';
import { usePredictiveRoutine } from '../hooks/usePredictiveRoutine';
import { DigitalTwinDashboard } from '../components/DigitalTwinDashboard';
import { PredictiveRoutineModal } from '../components/PredictiveRoutineModal';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { motion } from 'motion/react';
import { 
  Camera, 
  TrendingUp, 
  Activity, 
  Calendar,
  Brain,
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';
import { toast } from 'sonner';

export const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    journey, 
    isLoading, 
    contextualMessage, 
    recommendedActions,
    acceptRoutine,
    isAcceptingRoutine 
  } = useSkinJourney();
  
  const [showRoutineModal, setShowRoutineModal] = useState(false);

  // Hook pour la routine prédictive avec prévision
  const { 
    predictResults,
    validateAndActivate,
    isTwinEnhanced 
  } = usePredictiveRoutine(
    journey?.latestAnalysis?.id || null,
    journey?.latestAnalysis ? {
      condition: 'mixed',
      detectedIssues: journey.latestAnalysis.conditions,
      skinType: 'normal'
    } : null
  );

  const handleScanMore = () => {
    navigate('/analysis');
  };

  const handleViewTimeline = () => {
    navigate('/digital-twin/timeline');
  };

  const handleCreatePrediction = () => {
    navigate('/digital-twin/predict');
  };

  const handleSimulateProduct = () => {
    navigate('/digital-twin/simulate');
  };

  const handleAcceptRoutine = async () => {
    if (!journey?.predictiveRoutine?.id) return;
    
    try {
      await validateAndActivate();
      setShowRoutineModal(false);
      toast.success('Routine activée ! Bon voyage dans votre parcours beauté 🌟');
    } catch (error) {
      console.error('Failed to accept routine:', error);
    }
  };

  const handleViewRoutinePreview = () => {
    if (journey?.predictiveRoutine) {
      setShowRoutineModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre parcours...</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Impossible de charger vos données</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  const prediction = predictResults();

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header avec message contextuel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Votre Parcours Beauté Personnalisé
        </h1>
        {contextualMessage && (
          <p className="text-gray-600 text-lg">{contextualMessage}</p>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{journey.digitalTwin.snapshotCount}</div>
            <div className="text-sm text-gray-600">Analyses</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
            <div className="text-2xl font-bold">{journey.latestAnalysis?.healthScore || 0}</div>
            <div className="text-sm text-gray-600">Health Score</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              {Math.round(journey.digitalTwin.confidence * 100)}%
            </div>
            <div className="text-sm text-gray-600">Confiance IA</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">+{journey.digitalTwin.improvementRate || 0}</div>
            <div className="text-sm text-gray-600">Amélioration</div>
          </CardContent>
        </Card>
      </div>

      {/* Digital Twin Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DigitalTwinDashboard
          journey={journey}
          onScanMore={handleScanMore}
          onViewTimeline={handleViewTimeline}
          onCreatePrediction={handleCreatePrediction}
          onSimulateProduct={handleSimulateProduct}
        />
      </motion.div>

      {/* Routine Prédictive en attente */}
      {journey.predictiveRoutine?.status === 'PENDING' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Nouvelle Routine Personnalisée !
                </div>
                <div className="flex gap-2">
                  {isTwinEnhanced && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <Brain className="h-3 w-3 mr-1" />
                      Enhanced by Digital Twin
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {prediction?.confidence || 70}% confiance
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-700">
                {isTwinEnhanced 
                  ? `Votre routine 7 jours a été générée spécialement pour vous basée sur ${journey.digitalTwin.snapshotCount} analyses personnelles.`
                  : 'Une nouvelle routine prédictive est prête pour vous.'
                }
              </p>

              {/* Quick preview of expected results */}
              {prediction && (
                <div className="bg-white/80 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-600">Score actuel: </span>
                      <span className="font-semibold">{prediction.current.healthScore}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-gray-600">Attendu: </span>
                      <span className="font-semibold text-emerald-600">
                        {prediction.predicted.healthScore} (+{prediction.predicted.improvement})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleViewRoutinePreview}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Voir les Résultats Prévus
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleAcceptRoutine}
                  disabled={isAcceptingRoutine}
                >
                  {isAcceptingRoutine ? 'Activation...' : 'Activer Maintenant'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Routine */}
      {journey.activeRoutine && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Routine Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{journey.activeRoutine.name}</h3>
                  <p className="text-sm text-gray-600">
                    Jour {journey.activeRoutine.currentDay} sur 7
                  </p>
                </div>
                <Button onClick={() => navigate('/routines/active')}>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommended Actions */}
      {recommendedActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Actions Recommandées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendedActions.map((action, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Routine Modal */}
      {journey.predictiveRoutine && prediction && (
        <PredictiveRoutineModal
          isOpen={showRoutineModal}
          onClose={() => setShowRoutineModal(false)}
          routine={journey.predictiveRoutine.routine}
          routineId={journey.predictiveRoutine.id}
          prediction={prediction}
          onAccept={handleAcceptRoutine}
          onSimulateMore={handleSimulateProduct}
          loading={isAcceptingRoutine}
          twinEnhanced={isTwinEnhanced}
          confidence={journey.digitalTwin.confidence}
        />
      )}
    </div>
  );
};