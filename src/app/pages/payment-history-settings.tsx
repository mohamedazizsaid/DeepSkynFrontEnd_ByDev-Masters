import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download, FileText, Loader2, ReceiptText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { subscriptionService } from '../../lib/services/subscription.service';
import type { SubscriptionPaymentHistoryItem } from '../../lib/types';

interface PaymentHistorySettingsProps {
  onBack: () => void;
}

export function PaymentHistorySettings({ onBack }: PaymentHistorySettingsProps) {
  const { t, language } = useAccessibilityStore();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<SubscriptionPaymentHistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const list = await subscriptionService.getPaymentHistory();
        setPayments(list);
      } catch {
        toast.error(t('settings.paymentHistory.loadError'));
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [t]);

  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [payments],
  );

  const locale = useMemo(() => {
    if (language === 'ar') return 'ar-TN';
    if (language === 'en') return 'en-US';
    if (language === 'es') return 'es-ES';
    return 'fr-FR';
  }, [language]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    const code = (currency || 'EUR').toUpperCase();
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${code}`;
    }
  };

  const statusLabel = (status?: string | null) => {
    const s = String(status || '').toLowerCase();
    if (s === 'paid') return t('settings.paymentHistory.statusValues.paid');
    if (s === 'open') return t('settings.paymentHistory.statusValues.open');
    if (s === 'draft') return t('settings.paymentHistory.statusValues.draft');
    if (s === 'void') return t('settings.paymentHistory.statusValues.void');
    if (s === 'uncollectible') return t('settings.paymentHistory.statusValues.uncollectible');
    return status || '-';
  };

  const isPaidStatus = (status?: string | null) => String(status || '').toLowerCase() === 'paid';

  const handleDownloadInvoice = async (payment: SubscriptionPaymentHistoryItem) => {
    const existingUrl = payment.invoicePdfUrl || payment.hostedInvoiceUrl;
    if (existingUrl) {
      window.open(existingUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const invoice = await subscriptionService.getInvoice(payment.invoiceId);
      const url = invoice.invoicePdfUrl || invoice.hostedInvoiceUrl;
      if (!url) {
        toast.error(t('settings.paymentHistory.noInvoice'));
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error(t('settings.paymentHistory.invoiceLoadError'));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
          <ReceiptText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-gray-100">{t('settings.paymentHistory.title')}</h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.paymentHistory.subtitle')}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-4 sm:p-6"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-[#6B7280] dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('settings.paymentHistory.loading')}</span>
          </div>
        ) : sortedPayments.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F3F4F6] dark:bg-slate-800 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-[#9CA3AF] dark:text-gray-500" />
            </div>
            <h3 className="text-base font-semibold text-[#111827] dark:text-gray-100">{t('settings.paymentHistory.emptyTitle')}</h3>
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">{t('settings.paymentHistory.emptyDescription')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPayments.map((payment) => (
              (() => {
                const hideAmountDue = isPaidStatus(payment.status);
                return (
              <div
                key={payment.invoiceId}
                className="rounded-2xl border border-[#E5E7EB] dark:border-slate-700 p-4 sm:p-5 flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#111827] dark:text-gray-100">
                      {t('settings.paymentHistory.invoice')} #{payment.invoiceNumber || payment.invoiceId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">
                      {t('settings.paymentHistory.date')}: {formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]">
                    {statusLabel(payment.status)}
                  </span>
                </div>

                <div className={`grid grid-cols-1 ${hideAmountDue ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
                  <div className="rounded-xl bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-[#6B7280] dark:text-gray-400">{t('settings.paymentHistory.amountPaid')}</p>
                    <p className="text-sm font-semibold text-[#111827] dark:text-gray-100 mt-1">
                      {formatAmount(payment.amountPaid, payment.currency)}
                    </p>
                  </div>
                  {!hideAmountDue && (
                    <div className="rounded-xl bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-[#6B7280] dark:text-gray-400">{t('settings.paymentHistory.amountDue')}</p>
                      <p className="text-sm font-semibold text-[#111827] dark:text-gray-100 mt-1">
                        {formatAmount(payment.amountDue, payment.currency)}
                      </p>
                    </div>
                  )}
                  <div className="rounded-xl bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-[#6B7280] dark:text-gray-400">{t('settings.paymentHistory.currency')}</p>
                    <p className="text-sm font-semibold text-[#111827] dark:text-gray-100 mt-1">{payment.currency || 'EUR'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => handleDownloadInvoice(payment)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0EA5E9] text-white text-sm font-medium hover:bg-[#0284C7]"
                  >
                    <Download className="w-4 h-4" />
                    {t('settings.paymentHistory.downloadInvoice')}
                  </button>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
