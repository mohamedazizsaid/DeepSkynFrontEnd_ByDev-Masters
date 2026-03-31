import React, { useState } from 'react';
import { Smile, Meh, Frown, Send, Check } from 'lucide-react';
import { useContextualAnalysis } from '../../hooks/useContextualAnalysis';
import type { CreateSkinLogDto } from '../../lib/services';

interface SkinLogFormProps {
  className?: string;
  onLogCreated?: () => void;
}

const SKIN_CONCERNS = [
  { id: 'acne', label: 'Acné', emoji: '😣' },
  { id: 'dryness', label: 'Sécheresse', emoji: '🏜️' },
  { id: 'oiliness', label: 'Excès de sébum', emoji: '💧' },
  { id: 'redness', label: 'Rougeurs', emoji: '🔴' },
  { id: 'sensitivity', label: 'Sensibilité', emoji: '⚡' },
  { id: 'pigmentation', label: 'Taches', emoji: '🎯' },
  { id: 'wrinkles', label: 'Rides', emoji: '〰️' },
  { id: 'pores', label: 'Pores dilatés', emoji: '⚫' },
];

export const SkinLogForm: React.FC<SkinLogFormProps> = ({
  className = '',
  onLogCreated,
}) => {
  const { createSkinLog } = useContextualAnalysis();

  const [score, setScore] = useState<number>(5);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConcernToggle = (concernId: string) => {
    setConcerns((prev) =>
      prev.includes(concernId)
        ? prev.filter((c) => c !== concernId)
        : [...prev, concernId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dto: CreateSkinLogDto = {
      conditionScore: score,
      concerns: concerns.length > 0 ? concerns : undefined,
      notes: notes.trim() || undefined,
    };

    const result = await createSkinLog(dto);

    setIsSubmitting(false);

    if (result) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onLogCreated?.();
      }, 2000);
    }
  };

  const getScoreEmoji = (s: number) => {
    if (s >= 8) return '😍';
    if (s >= 6) return '😊';
    if (s >= 4) return '😐';
    if (s >= 2) return '😕';
    return '😫';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 8) return 'Excellent';
    if (s >= 6) return 'Bien';
    if (s >= 4) return 'Moyen';
    if (s >= 2) return 'Pas top';
    return 'Difficile';
  };

  const getScoreColor = (s: number) => {
    if (s >= 8) return 'from-green-400 to-emerald-500';
    if (s >= 6) return 'from-lime-400 to-green-500';
    if (s >= 4) return 'from-yellow-400 to-orange-500';
    if (s >= 2) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-rose-500';
  };

  if (isSuccess) {
    return (
      <div className={`rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Log enregistré ! 🎉
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Continue à logger quotidiennement pour des prédictions plus précises.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
        <h3 className="font-semibold flex items-center space-x-2">
          <span>📝</span>
          <span>Journal de peau du jour</span>
        </h3>
        <p className="text-sm opacity-90 mt-1">
          Comment va ta peau aujourd'hui ?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        {/* Score slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              État général
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getScoreEmoji(score)}</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getScoreLabel(score)}
              </span>
            </div>
          </div>

          {/* Custom slider */}
          <div className="relative pt-1">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <Frown className="w-4 h-4" />
              <Meh className="w-4 h-4" />
              <Smile className="w-4 h-4" />
            </div>
            <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`absolute left-0 h-full rounded-full bg-gradient-to-r ${getScoreColor(score)} transition-all`}
                style={{ width: `${score * 10}%` }}
              />
              <input
                type="range"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Concerns */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Problèmes observés (optionnel)
          </label>
          <div className="flex flex-wrap gap-2">
            {SKIN_CONCERNS.map((concern) => (
              <button
                key={concern.id}
                type="button"
                onClick={() => handleConcernToggle(concern.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  concerns.includes(concern.id)
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="mr-1">{concern.emoji}</span>
                {concern.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Peau sèche après une nuit courte..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Enregistrer</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
