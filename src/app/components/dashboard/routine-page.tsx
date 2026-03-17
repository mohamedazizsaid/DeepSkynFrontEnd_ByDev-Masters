import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  Info,
  RotateCcw,
  Box,
  List,
} from 'lucide-react';
import { RoutineStepCard } from '../routines/RoutineStepCard';
import { AddStepForm } from '../routines/AddStepForm';
import { AIAdviceModal } from '../routines/AIAdviceModal';
import { routineService } from '../../../lib/services/routine.service';
import type { Routine, RoutineStep, AIAdviceResponse } from '../../../lib/types';

// Lazy load 3D viewer for performance
const Face3DViewer = lazy(() =>
  import('../routines/Face3DViewer').then((m) => ({ default: m.Face3DViewer }))
);

interface RoutinePageProps {
  onBack: () => void;
}

interface StepItem {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  completed: boolean;
  order: number;
}

function mapRoutineSteps(steps: RoutineStep[]): StepItem[] {
  return steps.map((s, i) => ({
    id: s.id || `step-${i}-${Date.now()}`,
    name: s.productName || s.name || `Étape ${i + 1}`,
    category: s.category || 'treatment',
    description: s.description || s.notes || '',
    duration: typeof s.duration === 'string' ? parseInt(s.duration) || 30 : s.duration || 30,
    completed: s.completed || s.isCompleted || false,
    order: s.order ?? i + 1,
  }));
}

export function RoutinePage({ onBack }: RoutinePageProps) {
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [routineId, setRoutineId] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState<AIAdviceResponse | null>(null);
  const [highlightedStep, setHighlightedStep] = useState<string | null>(null);
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  const [show3D, setShow3D] = useState(true);

  const [amSteps, setAmSteps] = useState<StepItem[]>([]);
  const [pmSteps, setPmSteps] = useState<StepItem[]>([]);

  const currentSteps = activeTab === 'am' ? amSteps : pmSteps;
  const setCurrentSteps = activeTab === 'am' ? setAmSteps : setPmSteps;

  // ─── Load routines on mount ───
  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const data = await routineService.getAll();
      const list = Array.isArray(data) ? data : [];

      if (list.length > 0) {
        const am = list.find(
          (r) => r.type === 'AM' || r.type === 'MORNING' || r.type === 'morning'
        );
        const pm = list.find(
          (r) => r.type === 'PM' || r.type === 'EVENING' || r.type === 'evening'
        );

        if (am) {
          setAmSteps(mapRoutineSteps(am.steps || []));
          setRoutineId(am.id);
        }
        if (pm) {
          setPmSteps(mapRoutineSteps(pm.steps || []));
          if (!am) setRoutineId(pm.id);
        }

        // Auto-generate if no routines exist
        if (!am && !pm) {
          await generateAIRoutine();
        }
      } else {
        // First load — auto-generate
        await generateAIRoutine();
      }
    } catch {
      // If fetching fails, generate fallback
      await generateAIRoutine();
    } finally {
      setLoading(false);
    }
  };

  // ─── Generate AI routine ───
  const generateAIRoutine = async () => {
    setGenerating(true);
    try {
      const type = activeTab === 'am' ? 'AM' : 'PM';
      const routine = await routineService.generateAI({ type });

      if (routine?.steps) {
        const steps = mapRoutineSteps(routine.steps);
        if (type === 'AM') setAmSteps(steps);
        else setPmSteps(steps);
        setRoutineId(routine.id);
      }
    } catch {
      // Use default steps if AI fails
      const defaultSteps: StepItem[] =
        activeTab === 'am'
          ? [
              { id: 'def-1', name: 'Nettoyant doux', category: 'cleanser', description: 'Nettoyer en douceur', duration: 60, completed: false, order: 1 },
              { id: 'def-2', name: 'Tonique hydratant', category: 'toner', description: 'Équilibrer le pH', duration: 30, completed: false, order: 2 },
              { id: 'def-3', name: 'Sérum Vitamine C', category: 'serum', description: 'Protection antioxydante', duration: 30, completed: false, order: 3 },
              { id: 'def-4', name: 'Crème contour yeux', category: 'eye_cream', description: 'Hydrater la zone délicate', duration: 20, completed: false, order: 4 },
              { id: 'def-5', name: 'Hydratant léger', category: 'moisturizer', description: 'Sceller l\'hydratation', duration: 30, completed: false, order: 5 },
              { id: 'def-6', name: 'SPF 50+', category: 'sunscreen', description: 'Protection solaire indispensable', duration: 30, completed: false, order: 6 },
            ]
          : [
              { id: 'def-7', name: 'Huile démaquillante', category: 'makeup_remover', description: 'Premier nettoyage', duration: 60, completed: false, order: 1 },
              { id: 'def-8', name: 'Nettoyant doux', category: 'cleanser', description: 'Second nettoyage', duration: 60, completed: false, order: 2 },
              { id: 'def-9', name: 'Exfoliant doux', category: 'exfoliant', description: '2-3x par semaine', duration: 30, completed: false, order: 3 },
              { id: 'def-10', name: 'Sérum rétinol', category: 'serum', description: 'Renouvellement cellulaire', duration: 30, completed: false, order: 4 },
              { id: 'def-11', name: 'Crème contour yeux', category: 'eye_cream', description: 'Soin nourrissant', duration: 20, completed: false, order: 5 },
              { id: 'def-12', name: 'Crème de nuit', category: 'night_cream', description: 'Réparation nocturne', duration: 30, completed: false, order: 6 },
            ];

      setCurrentSteps(defaultSteps);
    } finally {
      setGenerating(false);
    }
  };

  // ─── Request AI advice ───
  const requestAdvice = useCallback(
    async (changeType: 'reorder' | 'add_step' | 'remove_step', changeDesc?: string, addedName?: string) => {
      if (!routineId) return;

      setAdviceLoading(true);
      setShowAdvice(true);
      setCurrentAdvice(null);

      try {
        const advice = await routineService.adviseOnChange(routineId, {
          changeType,
          currentSteps: currentSteps.map((s) => s.name),
          changeDescription: changeDesc,
          addedStepName: addedName,
        });
        setCurrentAdvice(advice);
      } catch {
        setCurrentAdvice({
          advice: 'Modification enregistrée. Continuez à prendre soin de votre peau ! ✨',
          rating: 'neutral',
          emoji: '✨',
        });
      } finally {
        setAdviceLoading(false);
      }
    },
    [routineId, currentSteps]
  );

  // ─── Handle reorder ───
  const handleReorder = (newSteps: StepItem[]) => {
    setCurrentSteps(newSteps);
    // Debounce advice request
    setTimeout(() => {
      requestAdvice('reorder', 'Réorganisation des étapes de la routine');
    }, 800);
  };

  // ─── Handle add step ───
  const handleAddStep = (stepData: { name: string; category: string; description: string; duration: number }) => {
    const newStep: StepItem = {
      id: `custom-${Date.now()}`,
      name: stepData.name,
      category: stepData.category,
      description: stepData.description,
      duration: stepData.duration,
      completed: false,
      order: currentSteps.length + 1,
    };

    setCurrentSteps((prev) => [...prev, newStep]);
    requestAdvice('add_step', `Ajout de "${stepData.name}" à la routine`, stepData.name);
  };

  // ─── Handle remove step ───
  const handleRemoveStep = (stepId: string) => {
    const removed = currentSteps.find((s) => s.id === stepId);
    setCurrentSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (removed) {
      requestAdvice('remove_step', `Suppression de "${removed.name}" de la routine`);
    }
  };

  // ─── Handle 3D zone click ───
  const handleZoneClick = (zoneId: string, categories: string[]) => {
    setHighlightedZone(zoneId);
    // Find matching step
    const match = currentSteps.find((s) => categories.includes(s.category));
    if (match) {
      setHighlightedStep(match.id);
      setTimeout(() => {
        setHighlightedStep(null);
        setHighlightedZone(null);
      }, 3000);
    }
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto" />
          </motion.div>
          <p className="text-[#6B7280] mt-4">Chargement de vos routines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#111128] to-[#0a0a1a] -m-4 sm:-m-6 lg:-m-8 -mt-24 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ═══ Header ═══ */}
        <div className="mb-8 pt-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/40 hover:text-[#D4AF37] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Retour au Dashboard</span>
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
                Ma Routine{' '}
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] bg-clip-text text-transparent">
                  Soins
                </span>
              </h1>
              <p className="text-white/40 text-sm">
                Personnalisée par l'IA pour votre peau
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateAIRoutine}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all disabled:opacity-40"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating ? 'Génération...' : 'Régénérer IA'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShow3D(!show3D)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  show3D
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                {show3D ? <Box className="w-4 h-4" /> : <List className="w-4 h-4" />}
                {show3D ? '3D' : 'Liste'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══ AM / PM Tabs ═══ */}
        <div className="flex gap-3 mb-8">
          <motion.button
            onClick={() => setActiveTab('am')}
            className={`flex-1 px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'am'
                ? 'bg-gradient-to-r from-[#D4AF37]/90 to-[#F5D76E]/80 text-black shadow-lg shadow-[#D4AF37]/20'
                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Sun className="w-5 h-5" />
              <span>Routine Matin</span>
            </div>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('pm')}
            className={`flex-1 px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'pm'
                ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/20'
                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Moon className="w-5 h-5" />
              <span>Routine Soir</span>
            </div>
          </motion.button>
        </div>

        {/* ═══ Main Content Grid ═══ */}
        <div className={`grid gap-6 ${show3D ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
          {/* ─── Steps List ─── */}
          <div className={show3D ? '' : 'lg:col-span-2'}>
            <div
              className="rounded-2xl border border-white/10 p-5 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-white text-base">
                    {activeTab === 'am' ? '☀️ Étapes Matin' : '🌙 Étapes Soir'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 border border-white/10">
                    {currentSteps.length} étapes
                  </span>
                </div>
              </div>

              {/* Info tip */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/3 border border-white/5 mb-4">
                <Info className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/30">
                  Glissez-déposez pour réorganiser. Chaque modification déclenche un avis IA expert.
                </p>
              </div>

              {/* Reorderable step list */}
              {currentSteps.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={currentSteps}
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                  <AnimatePresence>
                    {currentSteps.map((step, index) => (
                      <RoutineStepCard
                        key={step.id}
                        step={step}
                        index={index}
                        isHighlighted={highlightedStep === step.id}
                        onRemove={() => handleRemoveStep(step.id)}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Aucune étape. Générez une routine IA !</p>
                </div>
              )}

              {/* Add step form */}
              <div className="mt-4">
                <AddStepForm onAdd={handleAddStep} />
              </div>
            </div>

            {/* ─── Info Cards (below steps when 3D is visible) ─── */}
            {!show3D && (
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <InfoCard
                  title="Ordre d'application"
                  items={[
                    'Nettoyant',
                    'Tonique',
                    'Sérum',
                    'Contour yeux',
                    'Hydratant',
                    'SPF (matin)',
                  ]}
                />
                <TipsCard />
              </div>
            )}
          </div>

          {/* ─── 3D Face Viewer OR Info Panel ─── */}
          <div className="space-y-6">
            {show3D ? (
              <Suspense
                fallback={
                  <div className="w-full h-[400px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto mb-2" />
                      <p className="text-white/30 text-xs">Chargement du modèle 3D...</p>
                    </div>
                  </div>
                }
              >
                <Face3DViewer
                  steps={currentSteps}
                  highlightedZone={highlightedZone}
                  onZoneClick={handleZoneClick}
                />
              </Suspense>
            ) : null}

            {/* Info Cards */}
            <div className={show3D ? 'grid sm:grid-cols-2 gap-4' : ''}>
              <InfoCard
                title="Ordre d'application"
                items={[
                  'Nettoyant',
                  'Tonique',
                  'Sérum',
                  'Contour yeux',
                  'Hydratant',
                  'SPF (matin)',
                ]}
              />
              <TipsCard />
            </div>
          </div>
        </div>

        {/* ═══ AI Advice Modal ═══ */}
        <AIAdviceModal
          isOpen={showAdvice}
          onClose={() => setShowAdvice(false)}
          advice={currentAdvice}
          isLoading={adviceLoading}
        />
      </div>
    </div>
  );
}

// ─── Sub Components ───

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      className="rounded-2xl border border-white/10 p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        backdropFilter: 'blur(20px)',
      }}
    >
      <h3 className="font-bold text-white text-sm mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/20">
              {i + 1}
            </div>
            <span className="text-xs text-white/50">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsCard() {
  const tips = [
    'Attendez 30-60s entre chaque étape',
    'Appliquez sur peau humide pour mieux absorber',
    'Ne mélangez pas Vitamine C et Rétinol',
    'SPF toujours en dernière étape le matin',
  ];

  return (
    <div
      className="rounded-2xl border border-white/10 p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        backdropFilter: 'blur(20px)',
      }}
    >
      <h3 className="font-bold text-white text-sm mb-3">💡 Conseils Pro</h3>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[#10B981] text-xs mt-0.5">✓</span>
            <span className="text-xs text-white/40 leading-relaxed">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
