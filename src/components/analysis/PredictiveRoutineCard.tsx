import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Lightbulb, AlertTriangle, CheckCircle2, Loader2, Check } from 'lucide-react';
import { Card } from '../../app/components/ui/card';
import { Button } from '../../app/components/button';
import { usePredictiveRoutine } from '../../hooks/usePredictiveRoutine';
import { predictiveRoutineService } from '../../lib/services/predictive-routine.service';
import type { AnalysisResult } from '../../lib/services/predictive-routine.service';
import toast from 'react-hot-toast';

interface PredictiveRoutineCardProps {
  analysisId: string;
  analysisResult: AnalysisResult;
  onNavigateToRoutine?: () => void;
}

export function PredictiveRoutineCard({ analysisId, analysisResult, onNavigateToRoutine }: PredictiveRoutineCardProps) {
  const { routine, routineId, loading, error } = usePredictiveRoutine(analysisId, analysisResult);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleValidateRoutine = async () => {
    console.log('🔍 Validation clicked, routineId:', routineId);
    
    if (!routineId) {
      console.error('❌ No routineId available');
      toast.error('ID de routine manquant. Veuillez réessayer.', {
        style: {
          borderRadius: '12px',
          background: '#FFFFFF',
          color: '#EF4444',
          border: '1px solid #FEE2E2',
          padding: '12px',
        },
      });
      return;
    }

    setValidating(true);
    try {
      console.log('📤 Calling API to validate routine:', routineId);
      const result = await predictiveRoutineService.validateAndActivateRoutine(routineId);
      console.log('✅ API response:', result);
      
      if (result.success) {
        setValidated(true);
        toast.success('✅ Routine activée avec succès ! Redirection en cours...', {
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#FFFFFF',
            color: '#111827',
            border: '1px solid #10B981',
            padding: '12px',
          },
        });

        // Rediriger vers la page routine après 2 secondes
        setTimeout(() => {
          console.log('🔄 Redirecting to routine page...');
          if (onNavigateToRoutine) {
            onNavigateToRoutine();
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error('❌ Error validating routine:', err);
      console.error('Error details:', err?.response?.data);
      toast.error(err?.response?.data?.message || 'Erreur lors de la validation de la routine', {
        style: {
          borderRadius: '12px',
          background: '#FFFFFF',
          color: '#EF4444',
          border: '1px solid #FEE2E2',
          padding: '12px',
        },
      });
    } finally {
      setValidating(false);
    }
  };

  // Debug log
  console.log('🔍 PredictiveRoutineCard render:', { routineId, hasRoutine: !!routine, loading, error });

  if (loading) {
    return (
      <Card className="border-[#E5E7EB] bg-gradient-to-br from-white to-[#F9FAFB] shadow-lg shadow-[#6366F1]/10">
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </motion.div>
          <h3 className="text-lg font-bold text-[#1F2937] mb-2">Génération de votre routine prédictive...</h3>
          <p className="text-[#6B7280] text-sm">Analyse en cours avec l'IA dermatologique</p>
        </div>
      </Card>
    );
  }

  if (error || !routine) {
    return null; // Silently fail, don't show error to user
  }

  return (
    <Card className="border-[#E5E7EB] bg-gradient-to-br from-white to-[#F9FAFB] shadow-lg shadow-[#6366F1]/10">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">Routine Prédictive Personnalisée</h3>
            <p className="text-xs text-[#6B7280]">7 jours • Basée sur votre analyse et la météo</p>
          </div>
        </div>

        {/* Global advice */}
        {routine.globalAdvice && (
          <div className="mb-6 p-4 rounded-2xl border border-[#DBEAFE] bg-[#FEFBFF]">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-[#6366F1] mt-0.5" />
              <p className="text-sm text-[#334155] leading-relaxed">{routine.globalAdvice}</p>
            </div>
          </div>
        )}

        {/* Days grid */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-[#1F2937] mb-4">Programme de soins 7 jours</h4>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
              {routine.days.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-64 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="p-4">
                    {/* Day header */}
                    <div className="text-center mb-4">
                      <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <h5 className="font-semibold text-[#1F2937] text-sm">{day.day}</h5>
                    </div>

                    {/* Morning routine */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sun className="w-4 h-4 text-[#F59E0B]" />
                        <span className="text-xs font-semibold text-[#6B7280] uppercase">Matin</span>
                      </div>
                      <div className="space-y-1">
                        {day.morning.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-[#10B981] mt-1 flex-shrink-0" />
                            <span className="text-xs text-[#374151] leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evening routine */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Moon className="w-4 h-4 text-[#6366F1]" />
                        <span className="text-xs font-semibold text-[#6B7280] uppercase">Soir</span>
                      </div>
                      <div className="space-y-1">
                        {day.evening.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-[#10B981] mt-1 flex-shrink-0" />
                            <span className="text-xs text-[#374151] leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tip */}
                    {day.tip && (
                      <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#BFDBFE]">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-3 h-3 text-[#0EA5E9] mt-1 flex-shrink-0" />
                          <p className="text-xs text-[#0C4A6E] leading-relaxed">{day.tip}</p>
                        </div>
                      </div>
                    )}

                    {/* Warning */}
                    {day.warning && (
                      <div className="mt-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-[#EF4444] mt-1 flex-shrink-0" />
                          <p className="text-xs text-[#991B1B] leading-relaxed">{day.warning}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Validation Button */}
        {!validated ? (
          <div className="mt-6">
            <Button
              onClick={handleValidateRoutine}
              disabled={validating || !routineId}
              className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all disabled:opacity-50"
            >
              {validating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Activation en cours...
                </>
              ) : !routineId ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Valider et activer cette routine
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Routine activée avec succès !</span>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-6 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <p className="text-xs text-[#64748B] text-center leading-relaxed">
            ✨ Routine générée par IA dermatologique • Adaptée à votre type de peau et aux conditions météo actuelles
          </p>
        </div>
      </div>
    </Card>
  );
}