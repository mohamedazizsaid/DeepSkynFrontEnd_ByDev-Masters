import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Progress } from '../app/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Camera, 
  Sparkles, 
  Target,
  BarChart3,
  Zap,
  Lock
} from 'lucide-react';
import type { SkinJourneyResponse } from '../lib/services/digital-twin.service';

interface DigitalTwinDashboardProps {
  journey: SkinJourneyResponse;
  onScanMore: () => void;
  onViewTimeline: () => void;
  onCreatePrediction: () => void;
  onSimulateProduct: () => void;
}

export const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({
  journey,
  onScanMore,
  onViewTimeline,
  onCreatePrediction,
  onSimulateProduct,
}) => {
  const { digitalTwin, systemState, latestAnalysis } = journey;
  
  const getStateConfig = () => {
    switch (systemState) {
      case 'NEW_USER':
        return {
          title: 'Créez votre Digital Twin',
          subtitle: 'Prenez votre première photo pour commencer',
          gradient: 'from-blue-500 to-purple-600',
          icon: Camera,
          action: 'Commencer',
        };
      case 'BUILDING_TWIN':
        return {
          title: 'Construction en cours...',
          subtitle: `${digitalTwin.snapshotCount}/3 analyses • Plus que ${3 - digitalTwin.snapshotCount} pour débloquer`,
          gradient: 'from-purple-500 to-pink-600',
          icon: Brain,
          action: 'Continuer',
        };
      case 'TWIN_READY':
        return {
          title: 'Digital Twin Activé !',
          subtitle: 'Prédictions en cours de déverrouillage...',
          gradient: 'from-emerald-500 to-blue-600',
          icon: Sparkles,
          action: 'Découvrir',
        };
      case 'PREDICTIONS_UNLOCKED':
        return {
          title: 'Prédictions Débloquées ✨',
          subtitle: 'Votre jumeau numérique peut maintenant prédire l\'avenir',
          gradient: 'from-blue-500 to-cyan-600',
          icon: Target,
          action: 'Explorer',
        };
      case 'HIGH_CONFIDENCE':
        return {
          title: 'Twin Haute Précision',
          subtitle: `${Math.round(digitalTwin.confidence * 100)}% de confiance • Prédictions très précises`,
          gradient: 'from-emerald-600 to-teal-600',
          icon: Zap,
          action: 'Optimiser',
        };
      default:
        return {
          title: 'Digital Twin',
          subtitle: 'État inconnu',
          gradient: 'from-gray-500 to-gray-600',
          icon: Brain,
          action: 'Voir',
        };
    }
  };

  const stateConfig = getStateConfig();
  const IconComponent = stateConfig.icon;
  
  const confidenceColor = digitalTwin.confidence >= 0.8 ? 'emerald' : 
                         digitalTwin.confidence >= 0.3 ? 'blue' : 'amber';

  return (
    <div className="space-y-6">
      {/* Main Twin Status Card */}
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-r ${stateConfig.gradient} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{stateConfig.title}</h2>
                <p className="text-white/90 text-sm">{stateConfig.subtitle}</p>
              </div>
            </div>
            
            {digitalTwin.enabled && (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {Math.round(digitalTwin.confidence * 100)}%
                </div>
                <div className="text-xs text-white/80">Confiance</div>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Progress for building twin */}
          {systemState === 'BUILDING_TWIN' && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{digitalTwin.snapshotCount}/3 analyses</span>
              </div>
              <Progress value={(digitalTwin.snapshotCount / 3) * 100} className="h-2" />
            </div>
          )}

          {/* Stats Grid */}
          {digitalTwin.enabled && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {digitalTwin.snapshotCount}
                </div>
                <div className="text-xs text-gray-600">Analyses</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {latestAnalysis?.healthScore || 0}
                </div>
                <div className="text-xs text-gray-600">Score Santé</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold text-${confidenceColor}-600`}>
                  {Math.round(digitalTwin.confidence * 100)}%
                </div>
                <div className="text-xs text-gray-600">Précision</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {digitalTwin.improvementRate != null 
                    ? `${digitalTwin.improvementRate > 0 ? '+' : ''}${Math.round(digitalTwin.improvementRate)}%`
                    : '—'}
                </div>
                <div className="text-xs text-gray-600">Amélioration</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!digitalTwin.enabled ? (
              <>
                <Button onClick={onScanMore} className="col-span-full">
                  <Camera className="h-4 w-4 mr-2" />
                  {stateConfig.action}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onViewTimeline}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Timeline
                </Button>
                
                <Button 
                  onClick={onCreatePrediction}
                  disabled={!digitalTwin.predictionsUnlocked}
                  variant={digitalTwin.predictionsUnlocked ? "default" : "outline"}
                >
                  {!digitalTwin.predictionsUnlocked && <Lock className="h-4 w-4 mr-2" />}
                  <Target className="h-4 w-4 mr-2" />
                  Prédire
                </Button>
                
                <Button 
                  onClick={onSimulateProduct}
                  disabled={!digitalTwin.predictionsUnlocked}
                  variant="outline"
                >
                  {!digitalTwin.predictionsUnlocked && <Lock className="h-4 w-4 mr-2" />}
                  <Sparkles className="h-4 w-4 mr-2" />
                  Simuler
                </Button>
                
                <Button onClick={onScanMore} variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Améliorer
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Cards */}
      {digitalTwin.insights && digitalTwin.insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Insights Personnalisés</h3>
          <div className="space-y-2">
            {digitalTwin.insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
              >
                💡 {insight}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Badges for twin status */}
      <div className="flex flex-wrap gap-2">
        {digitalTwin.enabled && (
          <Badge variant="outline" className="text-green-700 border-green-300">
            ✓ Twin Actif
          </Badge>
        )}
        
        {digitalTwin.predictionsUnlocked && (
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            🔮 Prédictions Débloquées
          </Badge>
        )}
        
        {digitalTwin.confidence >= 0.8 && (
          <Badge variant="outline" className="text-purple-700 border-purple-300">
            ⭐ Haute Précision
          </Badge>
        )}
      </div>
    </div>
  );
};