import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Sparkles, TrendingUp, Clock, Target, Brain } from 'lucide-react';

interface RoutinePreviewProps {
  prediction: {
    current: {
      healthScore: number;
      skinAge: number;
      conditions: string[];
    };
    predicted: {
      healthScore: number;
      skinAge: number;
      improvement: number;
    };
    timeline: string;
    confidence: number;
    twinEnhanced: boolean;
    benefits: string[];
    tips: string[];
  };
  onAccept: () => void;
  onViewDetails: () => void;
  onSimulateMore?: () => void;
  loading?: boolean;
}

export const RoutineResultsPreview: React.FC<RoutinePreviewProps> = ({
  prediction,
  onAccept,
  onViewDetails,
  onSimulateMore,
  loading = false,
}) => {
  const { current, predicted, timeline, confidence, twinEnhanced, benefits, tips } = prediction;
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-emerald-600';
    if (conf >= 60) return 'text-blue-600';
    return 'text-amber-600';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Résultats Attendus
          </CardTitle>
          <div className="flex gap-2">
            {twinEnhanced && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                <Brain className="h-3 w-3 mr-1" />
                Digital Twin
              </Badge>
            )}
            <Badge variant="outline" className={getConfidenceColor(confidence)}>
              {confidence}% confiance
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Before/After Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current State */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-600 flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              État Actuel
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Health Score</span>
                <span className="font-semibold">{current.healthScore}/100</span>
              </div>
              <Progress value={current.healthScore} className="h-2" />
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Âge de peau</span>
                <span>{current.skinAge} ans</span>
              </div>
              
              {current.conditions.length > 0 && (
                <div className="text-xs text-gray-500">
                  Conditions: {current.conditions.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Predicted State */}
          <div className="space-y-3">
            <h3 className="font-medium text-emerald-600 flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              Après {timeline}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Health Score</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-emerald-600">{predicted.healthScore}/100</span>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <Progress value={predicted.healthScore} className="h-2" />
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Âge de peau</span>
                <span className="text-emerald-600">{predicted.skinAge} ans</span>
              </div>
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-lg p-2"
              >
                <div className="text-emerald-700 font-medium text-sm flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  +{predicted.improvement} points d'amélioration
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Benefits */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Bénéfices Attendus
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {tips.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="space-y-2">
              {tips.map((tip, index) => (
                <div key={index} className="text-blue-700 text-sm flex items-start gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Timeline */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Résultats estimés en {timeline}</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={onViewDetails}>
            Voir Détails
          </Button>
          
          {onSimulateMore && twinEnhanced && (
            <Button variant="outline" onClick={onSimulateMore}>
              Tester Produits
            </Button>
          )}
          
          <Button 
            onClick={onAccept} 
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
          >
            {loading ? 'Activation...' : '✨ Activer Routine'}
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          {twinEnhanced 
            ? `Prédiction basée sur votre Digital Twin avec ${confidence}% de confiance`
            : 'Prédiction basée sur l\'analyse générale • Activez votre Digital Twin pour plus de précision'
          }
        </div>
      </CardContent>
    </Card>
  );
};