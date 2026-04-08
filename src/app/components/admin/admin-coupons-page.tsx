import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Card } from '../card';
import { Button } from '../button';
import {
  adminService,
  type AdminCoupon,
  type AdminCouponDiscountType,
  type AdminCouponPayload,
} from '../../../lib/services/admin.service';

type CouponFilterStatus = 'all' | 'active' | 'inactive';

type CouponFormState = {
  code: string;
  discountType: AdminCouponDiscountType;
  discountValue: string;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  maxRedemptions: string;
  maxPerUser: string;
  allowedPlans: string[];
};

const AVAILABLE_PLANS = [
  { value: 'premium', label: 'Premium' },
  { value: 'premium_yearly', label: 'Premium Yearly' },
];

const COUPON_CURRENCY = 'EUR';

const INITIAL_FORM: CouponFormState = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  isActive: true,
  startsAt: '',
  expiresAt: '',
  maxRedemptions: '',
  maxPerUser: '',
  allowedPlans: [],
};

function getPlanLabel(planCode: string): string {
  return AVAILABLE_PLANS.find((plan) => plan.value === planCode)?.label || planCode;
}

function getTodayInputDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTomorrowInputDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toInputDate(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function toDisplayDate(value: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString();
}

function formatCouponReduction(
  discountType: AdminCouponDiscountType,
  discountValue: number,
  currency: string | null = COUPON_CURRENCY,
): string {
  if (discountType === 'percentage') {
    return `${discountValue}%`;
  }

  return `${discountValue} ${currency || COUPON_CURRENCY}`;
}

function formatAllowedPlansForMessage(plans: string[]): string {
  if (!plans.length) {
    return 'Tous les plans autorises';
  }

  return plans.map((planCode) => getPlanLabel(planCode)).join(', ');
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const statusCode = (error as { response?: { status?: number } })?.response?.status;

  if (statusCode === 401) {
    return 'Session expiree ou non authentifiee. Reconnecte-toi puis reessaie.';
  }

  if (statusCode === 403) {
    return 'Acces refuse. Cette action necessite le role admin.';
  }

  const responseMessage = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    const list = responseMessage
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join(', ');
    if (list) {
      return list;
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

interface DeleteCouponConfirmModalProps {
  isOpen: boolean;
  couponCode: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteCouponConfirmModal({
  isOpen,
  couponCode,
  loading = false,
  onClose,
  onConfirm,
}: DeleteCouponConfirmModalProps) {
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
              zIndex: 220,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4"
            style={{ zIndex: 221 }}
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
                    <p className="text-gray-500 text-sm">Cette action va desactiver le coupon.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] mb-5">
                  Tu es sur le point de supprimer le coupon <span className="font-bold">{couponCode}</span>.
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

export function AdminCouponsPage() {
  const todayInputDate = getTodayInputDate();
  const tomorrowInputDate = getTomorrowInputDate();
  const plansDropdownRef = useRef<HTMLDivElement | null>(null);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<AdminCoupon | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponFilterStatus>('all');
  const [isPlansDropdownOpen, setIsPlansDropdownOpen] = useState(false);
  const [form, setForm] = useState<CouponFormState>(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminService.getCoupons();
      setCoupons(data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError, 'Impossible de charger les coupons.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!plansDropdownRef.current) {
        return;
      }

      if (!plansDropdownRef.current.contains(event.target as Node)) {
        setIsPlansDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCoupons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return coupons.filter((coupon) => {
      if (statusFilter === 'active' && !coupon.isActive) {
        return false;
      }

      if (statusFilter === 'inactive' && coupon.isActive) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [coupon.code, coupon.discountType, coupon.currency || '', coupon.allowedPlans.join(', ')].join(' ').toLowerCase().includes(normalizedSearch);
    });
  }, [coupons, search, statusFilter]);

  const selectedPlansLabel = useMemo(() => {
    if (!form.allowedPlans.length) {
      return 'Tous les plans';
    }

    return form.allowedPlans.map((planCode) => getPlanLabel(planCode)).join(', ');
  }, [form.allowedPlans]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setIsPlansDropdownOpen(false);
  };

  const startEdit = (coupon: AdminCoupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      isActive: coupon.isActive,
      startsAt: toInputDate(coupon.startsAt),
      expiresAt: toInputDate(coupon.expiresAt),
      maxRedemptions: coupon.maxRedemptions == null ? '' : String(coupon.maxRedemptions),
      maxPerUser: coupon.maxPerUser == null ? '' : String(coupon.maxPerUser),
      allowedPlans: coupon.allowedPlans,
    });

    setError('');
    setSuccess('');
    setIsPlansDropdownOpen(false);
  };

  const toggleAllowedPlan = (planValue: string) => {
    setForm((prev) => {
      const isSelected = prev.allowedPlans.includes(planValue);
      const nextPlans = isSelected
        ? prev.allowedPlans.filter((value) => value !== planValue)
        : [...prev.allowedPlans, planValue];

      return {
        ...prev,
        allowedPlans: nextPlans,
      };
    });
  };

  const buildPayload = (): AdminCouponPayload | null => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      setError('Le code coupon est obligatoire.');
      return null;
    }

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      setError('La valeur de reduction doit etre un nombre positif.');
      return null;
    }

    if (form.discountType === 'percentage' && discountValue > 100) {
      setError('Pourcentage invalide: la valeur doit etre <= 100.');
      return null;
    }

    if (form.startsAt && form.startsAt < todayInputDate) {
      setError('La date de debut ne peut pas etre dans le passe.');
      return null;
    }

    if (form.expiresAt && form.expiresAt <= todayInputDate) {
      setError('La date de fin doit etre superieure a la date du jour.');
      return null;
    }

    if (form.startsAt && form.expiresAt && form.startsAt > form.expiresAt) {
      setError('La date de debut doit etre avant la date d expiration.');
      return null;
    }

    const payload: AdminCouponPayload = {
      code,
      discountType: form.discountType,
      discountValue,
      currency: COUPON_CURRENCY,
      isActive: form.isActive,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      maxRedemptions: parseOptionalNumber(form.maxRedemptions),
      maxPerUser: parseOptionalNumber(form.maxPerUser),
      allowedPlans: form.allowedPlans,
    };

    return payload;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await adminService.updateCoupon(editingId, payload);
        setSuccess('Coupon modifie avec succes.');
      } else {
        const createdCoupon = await adminService.createCoupon(payload);

        const reductionText = formatCouponReduction(
          createdCoupon.discountType,
          createdCoupon.discountValue,
          createdCoupon.currency,
        );
        const allowedPlansText = formatAllowedPlansForMessage(createdCoupon.allowedPlans);
        const expirationText = createdCoupon.expiresAt
          ? toDisplayDate(createdCoupon.expiresAt)
          : 'Non definie';

        try {
          await adminService.broadcastNotification({
            title: 'Nouveau code coupon disponible',
            message: `Code: ${createdCoupon.code} | Reduction: ${reductionText} | Plans: ${allowedPlansText} | Date fin: ${expirationText}`,
            type: 'info',
            actionUrl: '/dashboard?page=subscription',
          });

          setSuccess('Coupon cree avec succes et notification envoyee a tous les utilisateurs.');
        } catch {
          setSuccess('Coupon cree avec succes, mais la notification globale n a pas pu etre envoyee.');
        }
      }

      resetForm();
      await loadCoupons();
    } catch (submitError) {
      setError(extractErrorMessage(submitError, 'Operation coupon echouee.'));
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (coupon: AdminCoupon) => {
    setCouponToDelete(coupon);
  };

  const confirmDelete = async () => {
    if (!couponToDelete) {
      return;
    }

    setError('');
    setSuccess('');
    setDeletingId(couponToDelete.id);

    try {
      await adminService.deleteCoupon(couponToDelete.id);
      setSuccess('Coupon supprime (desactive) avec succes.');
      await loadCoupons();
      setCouponToDelete(null);
    } catch (deleteError) {
      setError(extractErrorMessage(deleteError, 'Suppression du coupon impossible.'));
    } finally {
      setDeletingId(null);
    }
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setCouponToDelete(null);
  };

  return (
    <>
      <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-coupons-title" aria-busy={loading || saving}>
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="admin-coupons-title" className="text-3xl font-bold">Gestion des coupons</h1>
          <p className="text-[#6B7280]">Creation, modification et suppression des codes promo.</p>
        </div>
        <Button variant="outline" onClick={() => void loadCoupons()} loading={loading}>
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
        <h2 className="text-xl font-bold mb-4">{editingId ? 'Modifier un coupon' : 'Ajouter un coupon'}</h2>

        <form className="space-y-4" onSubmit={submitForm}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="coupon-code" className="block text-sm font-medium text-[#1B3A5C] mb-1">Code</label>
              <input
                id="coupon-code"
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                placeholder="WELCOME5"
                required
              />
            </div>

            <div>
              <label htmlFor="coupon-discount-type" className="block text-sm font-medium text-[#1B3A5C] mb-1">Type de reduction</label>
              <select
                id="coupon-discount-type"
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={form.discountType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    discountType: event.target.value as AdminCouponDiscountType,
                  }))
                }
              >
                <option value="percentage">percentage</option>
                <option value="fixed">fixed</option>
              </select>
            </div>

            <div>
              <label htmlFor="coupon-discount-value" className="block text-sm font-medium text-[#1B3A5C] mb-1">Valeur</label>
              <input
                id="coupon-discount-value"
                type="number"
                min={0}
                step="0.01"
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={form.discountValue}
                onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                placeholder="5"
                required
              />
            </div>

            <div>
              <label htmlFor="coupon-currency" className="block text-sm font-medium text-[#1B3A5C] mb-1">Devise</label>
              <input
                id="coupon-currency"
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full bg-[#F8FAFC] text-[#6B7280]"
                value={COUPON_CURRENCY}
                disabled
                readOnly
              />
            </div>

            <div>
              <label htmlFor="coupon-start" className="block text-sm font-medium text-[#1B3A5C] mb-1">Debut</label>
              <input
                id="coupon-start"
                type="date"
                min={todayInputDate}
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={form.startsAt}
                onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="coupon-end" className="block text-sm font-medium text-[#1B3A5C] mb-1">Expiration</label>
              <input
                id="coupon-end"
                type="date"
                min={tomorrowInputDate}
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={form.expiresAt}
                onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="coupon-max-redemptions" className="block text-sm font-medium text-[#1B3A5C] mb-1">Max redemptions</label>
              <input
                id="coupon-max-redemptions"
                type="number"
                min={1}
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={form.maxRedemptions}
                onChange={(event) => setForm((prev) => ({ ...prev, maxRedemptions: event.target.value }))}
                placeholder="100"
              />
            </div>

            <div>
              <label htmlFor="coupon-max-per-user" className="block text-sm font-medium text-[#1B3A5C] mb-1">Max par utilisateur</label>
              <input
                id="coupon-max-per-user"
                type="number"
                min={1}
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
                value={form.maxPerUser}
                onChange={(event) => setForm((prev) => ({ ...prev, maxPerUser: event.target.value }))}
                placeholder="1"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1B3A5C]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Coupon actif
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={plansDropdownRef} className="relative">
              <label htmlFor="coupon-plans" className="block text-sm font-medium text-[#1B3A5C] mb-1">Plans autorises</label>
              <button
                id="coupon-plans"
                type="button"
                className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full text-left flex items-center justify-between gap-2"
                onClick={() => setIsPlansDropdownOpen((prev) => !prev)}
                aria-expanded={isPlansDropdownOpen}
              >
                <span className="truncate">{selectedPlansLabel}</span>
                <span className="text-xs text-[#6B7280]">{isPlansDropdownOpen ? 'Fermer' : 'Choisir'}</span>
              </button>

              {isPlansDropdownOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white shadow-lg p-2 space-y-1 h-44 overflow-y-scroll">
                  {AVAILABLE_PLANS.map((plan) => {
                    const checked = form.allowedPlans.includes(plan.value);

                    return (
                      <label key={plan.value} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#F8FAFC] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAllowedPlan(plan.value)}
                        />
                        <span>{plan.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-[#6B7280] mt-1">Tu peux selectionner un ou plusieurs plans.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              {editingId ? 'Mettre a jour' : 'Ajouter le coupon'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler la modification
              </Button>
            )}
          </div>
        </form>
        </Card>

        <Card>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="coupon-search" className="block text-sm font-medium text-[#1B3A5C] mb-1">Recherche</label>
            <input
              id="coupon-search"
              className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Code, type, devise, plan..."
            />
          </div>

          <div>
            <label htmlFor="coupon-status" className="block text-sm font-medium text-[#1B3A5C] mb-1">Statut</label>
            <select
              id="coupon-status"
              className="border border-[#E5E7EB] rounded-xl px-4 py-2"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CouponFilterStatus)}
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#E5E7EB] text-[#6B7280]">
                <th scope="col" className="py-3 pr-3">Code</th>
                <th scope="col" className="py-3 pr-3">Reduction</th>
                <th scope="col" className="py-3 pr-3">Periode</th>
                <th scope="col" className="py-3 pr-3">Limites</th>
                <th scope="col" className="py-3 pr-3">Plans</th>
                <th scope="col" className="py-3 pr-3">Statut</th>
                <th scope="col" className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-[#F3F4F6] align-top">
                  <th scope="row" className="py-3 pr-3 font-semibold">{coupon.code}</th>
                  <td className="py-3 pr-3">
                    <div className="font-medium">
                      {formatCouponReduction(coupon.discountType, coupon.discountValue, coupon.currency)}
                    </div>
                    <div className="text-xs text-[#6B7280]">{coupon.discountType}</div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-[#374151]">
                    <div>Debut: {toDisplayDate(coupon.startsAt)}</div>
                    <div>Fin: {toDisplayDate(coupon.expiresAt)}</div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-[#374151]">
                    <div>Total: {coupon.maxRedemptions ?? '-'}</div>
                    <div>Par user: {coupon.maxPerUser ?? '-'}</div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-[#374151]">
                    {coupon.allowedPlans.length > 0 ? coupon.allowedPlans.join(', ') : 'Tous'}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        coupon.isActive
                          ? 'bg-[#10B981]/10 text-[#047857]'
                          : 'bg-[#EF4444]/10 text-[#B91C1C]'
                      }`}
                    >
                      {coupon.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(coupon)}>
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
                        onClick={() => requestDelete(coupon)}
                        loading={deletingId === coupon.id}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredCoupons.length && !loading && (
            <p className="text-[#6B7280] py-6 text-center" role="status">
              Aucun coupon trouve.
            </p>
          )}

          {loading && (
            <p className="text-[#6B7280] py-6 text-center" role="status">
              Chargement des coupons...
            </p>
          )}
        </div>
        </Card>
      </main>

      <DeleteCouponConfirmModal
        isOpen={Boolean(couponToDelete)}
        couponCode={couponToDelete?.code || ''}
        loading={Boolean(couponToDelete && deletingId === couponToDelete.id)}
        onClose={closeDeleteModal}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </>
  );
}
