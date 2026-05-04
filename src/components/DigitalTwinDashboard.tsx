import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import { Card, CardContent } from '../app/components/ui/card';
import { Progress } from '../app/components/ui/progress';
import { 
  Brain,
  Camera, 
  Sparkles,
  Target,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import type { SkinJourneyResponse } from '../lib/services/digital-twin.service';

interface DigitalTwinDashboardProps {
  journey: SkinJourneyResponse;
  onScanMore: () => void;
  onViewTimeline: () => void;
  onCreatePrediction: () => void;
}

export const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({
  journey,
  onScanMore,
  onViewTimeline,
  onCreatePrediction,
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
          title: 'Projection Routine Débloquée ',
          subtitle: 'Visualisez votre jumeau amélioré après votre routine',
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

  const heroInsight = digitalTwin.insights?.[0] || 'Activez votre routine pour révéler votre meilleur potentiel de peau.';
  const inspirationalImageUrl =
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80';
  const featureList = [
    'Prédiction peau après routine IA',
    'Suivi progrès et confiance du twin',
    'Conseils personnalisés quotidiens',
  ];

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-[#cbd5e1] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#eef2ff] shadow-[0_18px_36px_rgba(15,23,42,0.10)] dark:border-[#334155] dark:from-[#111827] dark:via-[#0f172a] dark:to-[#1e293b]">
      <CardContent className="relative z-10 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr] items-center">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#0ea5e9]/15 p-3 ring-1 ring-[#7dd3fc] dark:bg-white/10 dark:ring-white/20">
                  <IconComponent className="h-6 w-6 text-[#0284c7] dark:text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#64748b] dark:text-slate-300/85">Digital Twin IA</p>
                  <h2 className="text-4xl font-bold leading-tight text-[#0f172a] dark:text-white">{stateConfig.title}</h2>
                  <p className="text-lg text-[#475569] mt-1 dark:text-slate-200/90">{stateConfig.subtitle}</p>
                </div>
              </div>
              
            </div>

            <p className="text-base text-[#475569] dark:text-slate-300">{heroInsight}</p>

            {systemState === 'BUILDING_TWIN' && (
              <div className="rounded-2xl border border-[#cbd5e1] bg-white/80 p-3 dark:border-white/20 dark:bg-white/10">
                <div className="mb-2 flex justify-between text-xs text-[#64748b] dark:text-slate-200">
                  <span>Progression</span>
                  <span className="font-semibold">{digitalTwin.snapshotCount}/3 analyses</span>
                </div>
                <Progress value={(digitalTwin.snapshotCount / 3) * 100} className="h-2 bg-slate-200 dark:bg-white/20" />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#cbd5e1] bg-white/80 p-3 dark:border-white/20 dark:bg-white/10">
                <p className="text-[11px] text-[#64748b] dark:text-slate-200/85">Analyses</p>
                <p className="text-xl font-bold text-[#0f172a] dark:text-white">{digitalTwin.snapshotCount}</p>
              </div>
              <div className="rounded-xl border border-[#cbd5e1] bg-white/80 p-3 dark:border-white/20 dark:bg-white/10">
                <p className="text-[11px] text-[#64748b] dark:text-slate-200/85">Score santé</p>
                <p className="text-xl font-bold text-[#0f172a] dark:text-white">{latestAnalysis?.healthScore || 0}</p>
              </div>
              <div className="rounded-xl border border-[#cbd5e1] bg-white/80 p-3 dark:border-white/20 dark:bg-white/10">
                <p className="text-[11px] text-[#64748b] dark:text-slate-200/85">Amélioration</p>
                <p className="text-xl font-bold text-[#0f172a] dark:text-white">
                  {digitalTwin.improvementRate != null
                    ? `${digitalTwin.improvementRate > 0 ? '+' : ''}${Math.round(digitalTwin.improvementRate)}%`
                    : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {featureList.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[#334155] dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-[#0ea5e9]" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {!digitalTwin.enabled ? (
                <Button onClick={onScanMore} className="bg-[#0ea5e9] text-white hover:bg-[#0284c7] border-0 shadow-md">
                  <Camera className="h-4 w-4 mr-2" />
                  {stateConfig.action}
                </Button>
              ) : (
                <Button
                  onClick={onCreatePrediction}
                  disabled={!digitalTwin.predictionsUnlocked}
                  className={digitalTwin.predictionsUnlocked
                    ? 'bg-[#0ea5e9] text-white hover:bg-[#0284c7] border-0 shadow-md'
                    : 'bg-slate-200 text-slate-500 border border-slate-300 dark:bg-white/10 dark:text-slate-300 dark:border-white/20'}
                >
                  {!digitalTwin.predictionsUnlocked && <Lock className="h-4 w-4 mr-2" />}
                  <Target className="h-4 w-4 mr-2" />
                  Voir mon jumeau amélioré
                </Button>
              )}

              <Button onClick={onViewTimeline} variant="outline" className="border-[#93c5fd] text-[#0369a1] hover:bg-[#e0f2fe] dark:border-white/20 dark:text-slate-100 dark:hover:bg-white/10">
                Chronologie
              </Button>
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden rounded-3xl border border-[#bfdbfe] bg-[#dbeafe] shadow-[0_14px_30px_rgba(14,165,233,0.18)] dark:border-white/20 dark:bg-[#0b1220]">
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative overflow-hidden">
                <img
                  src={latestAnalysis?.images?.[0] || inspirationalImageUrl}
                  alt="Avant routine"
                  className="h-full w-full object-cover brightness-85 saturate-[0.75] contrast-105"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-70 mix-blend-multiply"
                  style={{
                    backgroundImage: [
                      'radial-gradient(circle at 18% 28%, rgba(174, 35, 35, 0.42) 0 7px, transparent 8px)',
                      'radial-gradient(circle at 34% 44%, rgba(152, 30, 30, 0.36) 0 5px, transparent 6px)',
                      'radial-gradient(circle at 57% 36%, rgba(165, 38, 38, 0.40) 0 6px, transparent 7px)',
                      'radial-gradient(circle at 71% 58%, rgba(138, 24, 24, 0.34) 0 5px, transparent 6px)',
                      'radial-gradient(circle at 42% 70%, rgba(182, 41, 41, 0.35) 0 6px, transparent 7px)',
                      'radial-gradient(circle at 78% 30%, rgba(150, 28, 28, 0.32) 0 4px, transparent 5px)',
                    ].join(','),
                  }}
                />
              </div>
              <div className="relative overflow-hidden">
                <img
                  src={latestAnalysis?.images?.[0] || inspirationalImageUrl}
                  alt="Après routine"
                  className="h-full w-full object-cover brightness-105 saturate-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent" />
              </div>
            </div>
            <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-white/75 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
