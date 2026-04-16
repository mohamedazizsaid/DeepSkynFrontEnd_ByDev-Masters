import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Sparkles, X } from 'lucide-react';

export type PreocupentZoneKey =
  | 'front'
  | 'tempes'
  | 'nez'
  | 'joues'
  | 'autour_bouche'
  | 'machoire'
  | 'menton';

export interface PreocupentZoneOption {
  key: PreocupentZoneKey;
  label: string;
}

export const PREOCUPENT_ZONE_OPTIONS: PreocupentZoneOption[] = [
  { key: 'front', label: 'Front' },
  { key: 'tempes', label: 'Tempes' },
  { key: 'nez', label: 'Nez' },
  { key: 'joues', label: 'Joues' },
  { key: 'autour_bouche', label: 'Autour de la bouche' },
  { key: 'machoire', label: 'Machoire' },
  { key: 'menton', label: 'Menton' },
];

const hiddenScrollbarStyle = `
  .preocupent-scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .preocupent-scrollbar-hide::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
`;

interface PreocupentSelectorModalProps {
  open: boolean;
  initialSelected?: string[];
  onClose: () => void;
  onConfirm: (zones: PreocupentZoneKey[]) => void | Promise<void>;
  loading?: boolean;
  minSelection?: number;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
}

function normalizeSelected(values?: string[]): PreocupentZoneKey[] {
  if (!Array.isArray(values)) return [];
  const available = new Set(PREOCUPENT_ZONE_OPTIONS.map((item) => item.key));
  const cleaned = values
    .map((value) => value.trim())
    .filter((value): value is PreocupentZoneKey => available.has(value as PreocupentZoneKey));

  return [...new Set(cleaned)];
}

export function PreocupentSelectorModal({
  open,
  initialSelected,
  onClose,
  onConfirm,
  loading = false,
  minSelection = 1,
  title = 'Quelles zones vous preoccupent le plus ?',
  subtitle = 'Selectionnez les zones puis validez pour lancer votre analyse.',
  confirmLabel = 'Continuer',
}: PreocupentSelectorModalProps) {
  const [selectedZones, setSelectedZones] = useState<PreocupentZoneKey[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedZones(normalizeSelected(initialSelected));
    setError(null);
  }, [open, initialSelected]);

  const selectedSet = useMemo(() => new Set(selectedZones), [selectedZones]);

  const toggleZone = (zone: PreocupentZoneKey) => {
    setError(null);
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((item) => item !== zone) : [...prev, zone],
    );
  };

  const handleConfirm = () => {
    if (selectedZones.length < minSelection) {
      setError(`Selectionnez au moins ${minSelection} zone.`);
      return;
    }
    onConfirm(selectedZones);
  };

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <style>{hiddenScrollbarStyle}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="preocupent-scrollbar-hide fixed inset-0 z-[1400] overflow-y-auto p-4 md:p-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto flex min-h-full w-full items-start justify-center py-4 md:items-center md:py-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="preocupent-scrollbar-hide w-full max-w-5xl max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-[#f8fdff] to-[#f1fbff] shadow-2xl shadow-cyan-500/10"
          >
          <div className="h-1.5 w-full rounded-t-3xl bg-gradient-to-r from-[#0EA5E9] via-[#38BDF8] to-[#60A5FA]" />
          <div className="relative p-5 md:p-8">
            <button
              onClick={onClose}
              type="button"
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Zones ciblees
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
              <div className="mx-auto w-full max-w-[320px]">
                <div className="rounded-[2rem] border border-slate-100 bg-white/90 p-5 shadow-inner shadow-slate-100">
                  <svg viewBox="0 0 260 360" className="mx-auto h-[330px] w-full max-w-[260px]">
                    <defs>
                      <filter id="zoneGlow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="7" />
                      </filter>
                    </defs>

                    {selectedSet.has('front') && (
                      <>
                        <ellipse cx="130" cy="92" rx="44" ry="22" fill="#38BDF8" opacity="0.4" />
                        <ellipse cx="130" cy="92" rx="40" ry="18" fill="#38BDF8" opacity="0.6" filter="url(#zoneGlow)" />
                      </>
                    )}
                    {selectedSet.has('tempes') && (
                      <>
                        <ellipse cx="76" cy="125" rx="16" ry="28" fill="#38BDF8" opacity="0.45" />
                        <ellipse cx="184" cy="125" rx="16" ry="28" fill="#38BDF8" opacity="0.45" />
                      </>
                    )}
                    {selectedSet.has('nez') && (
                      <>
                        <path d="M130 112 C125 128 125 149 118 172 C123 178 137 178 142 171 C136 148 137 128 130 112 Z" fill="#38BDF8" opacity="0.55" />
                        <path d="M130 112 C125 128 125 149 118 172 C123 178 137 178 142 171 C136 148 137 128 130 112 Z" fill="#38BDF8" opacity="0.65" filter="url(#zoneGlow)" />
                      </>
                    )}
                    {selectedSet.has('joues') && (
                      <>
                        <ellipse cx="88" cy="170" rx="24" ry="30" fill="#38BDF8" opacity="0.45" />
                        <ellipse cx="172" cy="170" rx="24" ry="30" fill="#38BDF8" opacity="0.45" />
                      </>
                    )}
                    {selectedSet.has('autour_bouche') && (
                      <>
                        <ellipse cx="130" cy="223" rx="32" ry="16" fill="#38BDF8" opacity="0.5" />
                        <ellipse cx="130" cy="223" rx="26" ry="12" fill="#38BDF8" opacity="0.55" filter="url(#zoneGlow)" />
                      </>
                    )}
                    {selectedSet.has('machoire') && (
                      <>
                        <ellipse cx="96" cy="248" rx="22" ry="18" fill="#38BDF8" opacity="0.4" />
                        <ellipse cx="164" cy="248" rx="22" ry="18" fill="#38BDF8" opacity="0.4" />
                      </>
                    )}
                    {selectedSet.has('menton') && (
                      <>
                        <ellipse cx="130" cy="272" rx="22" ry="15" fill="#38BDF8" opacity="0.5" />
                        <ellipse cx="130" cy="272" rx="18" ry="11" fill="#38BDF8" opacity="0.6" filter="url(#zoneGlow)" />
                      </>
                    )}

                    <path
                      d="M130 35 C95 35 72 59 70 94 L68 158 C67 229 95 278 130 286 C165 278 193 229 192 158 L190 94 C188 59 165 35 130 35 Z"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M79 263 C78 302 72 332 56 350" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    <path d="M181 263 C182 302 188 332 204 350" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    <path d="M95 123 C104 118 115 118 123 122" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    <path d="M137 122 C145 118 156 118 165 123" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    <path d="M130 112 C126 132 126 152 120 171" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    <path d="M111 212 C121 208 139 208 149 212" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    <path d="M107 222 C118 228 142 228 153 222" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Selection rapide</p>
                <div className="space-y-2.5">
                  {PREOCUPENT_ZONE_OPTIONS.map((zone) => {
                    const active = selectedSet.has(zone.key);
                    return (
                      <button
                        key={zone.key}
                        type="button"
                        onClick={() => toggleZone(zone.key)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                          active
                            ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0369A1] shadow-sm shadow-[#0EA5E9]/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3 text-[15px] font-medium">
                          {zone.label}
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                              active
                                ? 'border-[#0EA5E9] bg-[#0EA5E9] text-white'
                                : 'border-slate-300 bg-white text-transparent'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
                  {selectedZones.length > 0
                    ? `${selectedZones.length} zone(s) selectionnee(s).`
                    : 'Aucune zone selectionnee.'}
                </div>

                {error && (
                  <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-white via-white to-white/70 pt-4">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Validation...' : confirmLabel}
                </button>
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
