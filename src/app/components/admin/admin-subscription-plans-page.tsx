import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Card } from '../card';
import { Button } from '../button';
import {
  adminService,
  type AdminSubscriptionPlan,
} from '../../../lib/services/admin.service';

function formatDurationLabel(duration: number | null): string {
  if (duration == null) {
    return '-';
  }

  if (duration === -1) {
    return 'Illimite';
  }

  return `${duration} jours`;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const statusCode = (error as { response?: { status?: number } })?.response?.status;

  if (statusCode === 401) {
    return 'Session expiree ou non authentifiee. Reconnecte-toi puis reessaie.';
  }

  if (statusCode === 403) {
    return 'Acces refuse. Cette action necessite le role admin.';
  }

  const responseMessage =
    (error as { response?: { data?: { message?: unknown } } })?.response?.data
      ?.message;

  if (Array.isArray(responseMessage)) {
    const merged = responseMessage
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join(', ');

    if (merged) {
      return merged;
    }
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

interface DeletePlanConfirmModalProps {
  isOpen: boolean;
  planLabel: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeletePlanConfirmModal({
  isOpen,
  planLabel,
  loading = false,
  onClose,
  onConfirm,
}: DeletePlanConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 230,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4"
            style={{ zIndex: 231 }}
          >
            <div className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#F59E0B] via-[#EF4444] to-[#EC4899]" />

              <button
                onClick={onClose}
                disabled={loading}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                    <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
                    <p className="text-gray-500 text-sm">Cette action va supprimer le plan d abonnement.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] mb-5">
                  Tu es sur le point de supprimer le plan <span className="font-bold">{planLabel}</span>.
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={onConfirm}
                    loading={loading}
                    className="bg-[#EF4444] hover:bg-[#DC2626] focus:ring-[#EF4444]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<AdminSubscriptionPlan | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminService.getSubscriptionPlans();
        setPlans(data);
      } catch (loadError) {
        setError(extractErrorMessage(loadError, 'Impossible de charger les plans d abonnement.'));
      } finally {
        setLoading(false);
      }
    };
    void loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const sorted = [...plans].sort((a, b) => a.plan.localeCompare(b.plan));
    if (!needle) {
      return sorted;
    }

    return sorted.filter((plan) => {
      return [
        plan.plan,
        plan.name,
        plan.currency,
        String(plan.price),
        plan.features.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [plans, search]);

  const requestDelete = (plan: AdminSubscriptionPlan) => {
    setPlanToDelete(plan);
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setPlanToDelete(null);
  };

  const confirmDelete = async () => {
    if (!planToDelete) {
      return;
    }

    setError('');
    setSuccess('');
    setDeletingId(planToDelete.id);

    try {
      await adminService.deleteSubscriptionPlan(planToDelete.id || planToDelete.plan);
      setSuccess('Plan supprime avec succes.');
      setPlanToDelete(null);
      await loadPlans();
    } catch (deleteError) {
      setError(extractErrorMessage(deleteError, 'Suppression du plan impossible.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <main
        className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl"
        aria-labelledby="admin-plans-title"
        aria-busy={loading || Boolean(deletingId)}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="admin-plans-title" className="text-3xl font-bold">Plans d abonnement</h1>
            <p className="text-[#6B7280]">Afficher et supprimer les plans disponibles.</p>
          </div>
          <Button variant="outline" onClick={() => void loadPlans()} loading={loading}>
            Actualiser
          </Button>
        </div>

        {error && (
          <Card className="border border-[#FECACA] bg-[#FEF2F2] p-4">
            <p className="text-[#B91C1C] font-medium" role="alert">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="border border-[#BBF7D0] bg-[#F0FDF4] p-4">
            <p className="text-[#166534] font-medium" role="status">{success}</p>
          </Card>
        )}

        <Card>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="min-w-[260px] flex-1">
              <label htmlFor="plan-search" className="block text-sm font-medium text-[#1B3A5C] mb-1">Recherche</label>
              <input
                id="plan-search"
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, nom, feature..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#E5E7EB] text-[#6B7280]">
                  <th scope="col" className="py-3 pr-3">Plan</th>
                  <th scope="col" className="py-3 pr-3">Nom</th>
                  <th scope="col" className="py-3 pr-3">Prix</th>
                  <th scope="col" className="py-3 pr-3">Duree</th>
                  <th scope="col" className="py-3 pr-3">Features</th>
                  <th scope="col" className="py-3 pr-3">Statut</th>
                  <th scope="col" className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="border-b border-[#F3F4F6] align-top">
                    <th scope="row" className="py-3 pr-3 font-semibold">{plan.plan}</th>
                    <td className="py-3 pr-3">{plan.name || '-'}</td>
                    <td className="py-3 pr-3">{plan.price} {plan.currency}</td>
                    <td className="py-3 pr-3">{formatDurationLabel(plan.duration)}</td>
                    <td className="py-3 pr-3 text-xs text-[#374151] max-w-[320px]">
                      {plan.features.length ? plan.features.join(', ') : '-'}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          plan.isActive
                            ? 'bg-[#10B981]/10 text-[#047857]'
                            : 'bg-[#EF4444]/10 text-[#B91C1C]'
                        }`}
                      >
                        {plan.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
                        onClick={() => requestDelete(plan)}
                        loading={deletingId === plan.id}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredPlans.length && !loading && (
              <p className="text-[#6B7280] py-6 text-center" role="status">
                Aucun plan trouve.
              </p>
            )}

            {loading && (
              <p className="text-[#6B7280] py-6 text-center" role="status">
                Chargement des plans...
              </p>
            )}
          </div>
        </Card>
      </main>

      <DeletePlanConfirmModal
        isOpen={Boolean(planToDelete)}
        planLabel={planToDelete?.name || planToDelete?.plan || ''}
        loading={Boolean(planToDelete && deletingId === planToDelete.id)}
        onClose={closeDeleteModal}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </>
  );
}
