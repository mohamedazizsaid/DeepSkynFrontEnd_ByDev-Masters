import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { RoutineResultsPreview } from './RoutineResultsPreview';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Brain, 
  Clock, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Sparkles,
  TrendingUp 
} from 'lucide-react';
import type { GeneratedRoutine } from '../lib/services/predictive-routine.service';

interface PredictiveRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: GeneratedRoutine | null;
  routineId: string | null;
  prediction: any;
  onAccept: () => void;
  onSimulateMore?: () => void;
  loading?: boolean;
  twinEnhanced?: boolean;
  confidence?: number;
}

export const PredictiveRoutineModal: React.FC<PredictiveRoutineModalProps> = ({
  isOpen,
  onClose,
  routine,
  routineId,
  prediction,
  onAccept,
  onSimulateMore,
  loading = false,
  twinEnhanced = false,
  confidence = 0,
}) => {
  const [activeTab, setActiveTab] = useState('preview');

  if (!routine || !prediction) return null;

  const handleAccept = async () => {
    await onAccept();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Votre Routine 7 Jours Personnalisée
            </DialogTitle>
            
            <div className="flex gap-2">
              {twinEnhanced && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Brain className="h-3 w-3 mr-1" />
                  Digital Twin Enhanced
                </Badge>
              )}
              <Badge variant="outline">
                {Math.round(confidence * 100)}% confiance
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Résultats Attendus
            </TabsTrigger>
            <TabsTrigger value="routine" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Routine Détaillée
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Planning
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <TabsContent value="preview" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <RoutineResultsPreview
                    prediction={prediction}
                    onAccept={handleAccept}
                    onViewDetails={() => setActiveTab('routine')}
                    onSimulateMore={onSimulateMore}
                    loading={loading}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="routine" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Global Advice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Conseil Global
                    </h3>
                    <p className="text-blue-700 text-sm">{routine.globalAdvice}</p>
                  </div>

                  {/* Days */}
                  <div className="space-y-4">
                    {routine.days.map((day, index) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <h3 className="font-medium">{day.day}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Morning */}
                          <div>
                            <h4 className="font-medium text-amber-700 flex items-center gap-1 mb-2">
                              <Sun className="h-4 w-4" />
                              Matin
                            </h4>
                            <ul className="space-y-1">
                              {day.morning.map((step, stepIndex) => (
                                <li key={stepIndex} className="text-sm flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Evening */}
                          <div>
                            <h4 className="font-medium text-indigo-700 flex items-center gap-1 mb-2">
                              <Moon className="h-4 w-4" />
                              Soir
                            </h4>
                            <ul className="space-y-1">
                              {day.evening.map((step, stepIndex) => (
                                <li key={stepIndex} className="text-sm flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Tip */}
                        {day.tip && (
                          <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700">
                            💡 <strong>Astuce:</strong> {day.tip}
                          </div>
                        )}

                        {/* Warning */}
                        {day.warning && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span><strong>Attention:</strong> {day.warning}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Timeline visualization */}
                  <div className="relative">
                    <div className="absolute left-6 top-8 bottom-0 w-px bg-gradient-to-b from-blue-500 to-emerald-500"></div>
                    
                    {routine.days.map((day, index) => (
                      <div key={day.day} className="relative flex items-start gap-4 pb-6">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            J{index + 1}
                          </div>
                          {index < routine.days.length - 1 && (
                            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                              ↓
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 mb-1">{day.day}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              <span className="text-amber-600">Matin:</span> {day.morning.slice(0, 2).join(', ')}
                              {day.morning.length > 2 && '...'}
                            </div>
                            <div>
                              <span className="text-indigo-600">Soir:</span> {day.evening.slice(0, 2).join(', ')}
                              {day.evening.length > 2 && '...'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress Tracking */}
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4 mt-6">
                    <h3 className="font-medium text-emerald-800 mb-2">Suivi de Progression</h3>
                    <p className="text-sm text-emerald-700 mb-3">
                      Suivez vos progrès jour après jour et voyez votre peau s'améliorer !
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {routine.days.map((_, index) => (
                        <div key={index} className="aspect-square bg-emerald-200 rounded text-xs flex items-center justify-center text-emerald-700 font-medium">
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>

        <Separator />

        <DialogFooter className="flex justify-between">
          <div className="flex items-center text-sm text-gray-600">
            {twinEnhanced ? (
              <span className="flex items-center gap-1">
                <Brain className="h-4 w-4 text-purple-600" />
                Routine optimisée par votre Digital Twin
              </span>
            ) : (
              <span>Routine générale • Activez votre Digital Twin pour plus de précision</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Plus tard
            </Button>
            
            {onSimulateMore && twinEnhanced && (
              <Button variant="outline" onClick={onSimulateMore}>
                Tester Produits
              </Button>
            )}
            
            <Button 
              onClick={handleAccept} 
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              {loading ? 'Activation...' : '✨ Activer ma Routine'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};