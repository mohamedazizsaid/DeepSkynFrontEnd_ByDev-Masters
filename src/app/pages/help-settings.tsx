import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  FileQuestion,
  ChevronDown,
  Sparkles,
  MessageSquareWarning,
  Send,
  X,
} from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  reclamationService,
  type CreateReclamationPayload,
} from '../../lib/services/reclamation.service';
import toast from 'react-hot-toast';

interface HelpSettingsProps {
  onBack: () => void;
}

export function HelpSettings({ onBack }: HelpSettingsProps) {
  const { t, language } = useAccessibilityStore();
  const { user } = useAuthStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isReclamationModalOpen, setIsReclamationModalOpen] = useState(false);
  const [isSubmittingReclamation, setIsSubmittingReclamation] = useState(false);

  const [reclamationForm, setReclamationForm] = useState<CreateReclamationPayload>({
    nom: user?.name || '',
    email: user?.email || '',
    type_reclamation: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateReclamationPayload, string>>>({});

  useEffect(() => {
    if (!isReclamationModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmittingReclamation) {
        setIsReclamationModalOpen(false);
      }
    };

    window.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isReclamationModalOpen, isSubmittingReclamation]);

  useEffect(() => {
    setReclamationForm((prev) => ({
      ...prev,
      nom: prev.nom || user?.name || '',
      email: prev.email || user?.email || '',
    }));
  }, [user?.email, user?.name]);

  const reclamationTypeOptions = {
    fr: ['Problème abonnement', 'Problème paiement', 'Bug technique', 'Compte et connexion', 'Qualité de service', 'Autre'],
    en: ['Subscription issue', 'Payment issue', 'Technical bug', 'Account and login', 'Service quality', 'Other'],
    ar: ['مشكلة اشتراك', 'مشكلة دفع', 'خلل تقني', 'الحساب وتسجيل الدخول', 'جودة الخدمة', 'أخرى'],
    es: ['Problema de suscripción', 'Problema de pago', 'Error técnico', 'Cuenta e inicio de sesión', 'Calidad del servicio', 'Otro'],
  }[language] || ['Problème abonnement', 'Problème paiement', 'Bug technique', 'Compte et connexion', 'Qualité de service', 'Autre'];

  const descriptionLength = useMemo(
    () => reclamationForm.description.trim().length,
    [reclamationForm.description],
  );

  const validateReclamationForm = (): boolean => {
    const errors: Partial<Record<keyof CreateReclamationPayload, string>> = {};

    if (!reclamationForm.nom.trim()) {
      errors.nom = 'Le nom est requis.';
    }

    if (!reclamationForm.email.trim()) {
      errors.email = 'L\'email est requis.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reclamationForm.email.trim())) {
      errors.email = 'Adresse email invalide.';
    }

    if (!reclamationForm.type_reclamation.trim()) {
      errors.type_reclamation = t('settings.help.reclamationValidationType');
    }

    if (descriptionLength < 10) {
      errors.description = t('settings.help.reclamationValidationDescription');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReclamationFieldChange = (
    field: keyof CreateReclamationPayload,
    value: string,
  ) => {
    setReclamationForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetReclamationForm = () => {
    setReclamationForm({
      nom: user?.name || '',
      email: user?.email || '',
      type_reclamation: '',
      description: '',
    });
    setFormErrors({});
  };

  const closeReclamationModal = () => {
    if (isSubmittingReclamation) {
      return;
    }
    setIsReclamationModalOpen(false);
  };

  const handleReclamationSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateReclamationForm()) {
      return;
    }

    setIsSubmittingReclamation(true);

    try {
      const response = await reclamationService.create({
        nom: reclamationForm.nom.trim(),
        email: reclamationForm.email.trim(),
        type_reclamation: reclamationForm.type_reclamation,
        description: reclamationForm.description.trim(),
      });

      toast.success(
        response.id_reclamation
          ? t('settings.help.reclamationSuccessWithId', { id: response.id_reclamation })
          : t('settings.help.reclamationSuccessFallback'),
      );

      setIsReclamationModalOpen(false);
      resetReclamationForm();
    } catch {
      toast.error(
        t('settings.help.reclamationError'),
      );
    } finally {
      setIsSubmittingReclamation(false);
    }
  };

  const faqs = (t('settings.help.faqs') as Array<{ question: string; answer: string }>) || [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Back Button (Mobile) */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] dark:text-gray-400 hover:text-[#0EA5E9] dark:hover:text-sky-300 transition-all w-fit font-black uppercase text-xs tracking-widest"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('common.back')}
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-gray-100">{t('settings.help.title')}</h2>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.help.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Intro Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] rounded-3xl p-8 overflow-hidden shadow-xl shadow-blue-500/20"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
             <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">{t('settings.help.introTitle')}</h3>
            <p className="text-white/80 text-sm max-w-xl leading-relaxed">
              {t('settings.help.introDesc')}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Support */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5E7EB] dark:border-slate-700 p-8 flex flex-col items-center text-center group transition-all hover:border-[#0EA5E9]/30 hover:shadow-xl hover:shadow-blue-500/5"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#0EA5E9]/5 flex items-center justify-center mb-6 shadow-sm border border-[#0EA5E9]/10 group-hover:scale-105 transition-transform duration-300">
            <Mail className="w-10 h-10 text-[#0EA5E9]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100 mb-2">{t('settings.help.emailTitle')}</h3>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-8 leading-relaxed max-w-[200px]">{t('settings.help.emailDesc')}</p>
          <a
            href="mailto:support@deepskyn.com"
            className="px-8 py-4 w-full bg-[#0EA5E9] text-white font-bold rounded-2xl hover:bg-[#0284C7] shadow-lg shadow-[#0EA5E9]/20 transition-all text-sm uppercase tracking-widest text-center"
          >
            support@deepskyn.com
          </a>
        </motion.div>

        {/* Reclamation */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5E7EB] dark:border-slate-700 p-8 flex flex-col items-center text-center group transition-all hover:border-[#F97316]/30 hover:shadow-xl hover:shadow-orange-500/5"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#F97316]/5 flex items-center justify-center mb-6 shadow-sm border border-[#F97316]/10 group-hover:scale-105 transition-transform duration-300">
            <MessageSquareWarning className="w-10 h-10 text-[#F97316]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100 mb-2">{t('settings.help.reclamationTitle')}</h3>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-8 leading-relaxed max-w-[240px]">{t('settings.help.reclamationDesc')}</p>
          <button
            onClick={() => setIsReclamationModalOpen(true)}
            className="px-8 py-4 w-full bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-bold rounded-2xl hover:brightness-95 shadow-lg shadow-orange-500/25 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {t('settings.help.reclamationOpen')}
          </button>
        </motion.div>
      </div>

      {/* Reclamation Modal */}
      <AnimatePresence>
        {isReclamationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <button
              type="button"
              aria-label="Fermer le formulaire"
              onClick={closeReclamationModal}
              className="absolute inset-0 bg-[#0B1220]/55 backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="relative z-10 w-full max-w-2xl rounded-3xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#F97316] to-[#FB7185] px-6 sm:px-8 py-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">{t('settings.help.reclamationModalTitle')}</h3>
                    <p className="text-sm text-white/85 mt-1">{t('settings.help.reclamationModalSubtitle')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeReclamationModal}
                    className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleReclamationSubmit} className="p-6 sm:p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reclamation-nom" className="block text-sm font-semibold text-[#111827] dark:text-gray-100 mb-1.5">
                      {t('settings.help.reclamationName')}
                    </label>
                    <input
                      id="reclamation-nom"
                      type="text"
                      value={reclamationForm.nom}
                      onChange={(event) =>
                        handleReclamationFieldChange('nom', event.target.value)
                      }
                      placeholder={t('settings.help.reclamationNamePlaceholder')}
                      className="w-full h-11 rounded-xl border border-[#D1D5DB] dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3.5 text-sm outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 transition-all"
                    />
                    {formErrors.nom && (
                      <p className="mt-1.5 text-xs text-[#DC2626]">{formErrors.nom}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reclamation-email" className="block text-sm font-semibold text-[#111827] dark:text-gray-100 mb-1.5">
                      {t('settings.help.reclamationEmail')}
                    </label>
                    <input
                      id="reclamation-email"
                      type="email"
                      value={reclamationForm.email}
                      onChange={(event) =>
                        handleReclamationFieldChange('email', event.target.value)
                      }
                      placeholder={t('settings.help.reclamationEmailPlaceholder')}
                      className="w-full h-11 rounded-xl border border-[#D1D5DB] dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3.5 text-sm outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 transition-all"
                    />
                    {formErrors.email && (
                      <p className="mt-1.5 text-xs text-[#DC2626]">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="reclamation-type" className="block text-sm font-semibold text-[#111827] dark:text-gray-100 mb-1.5">
                    {t('settings.help.reclamationType')}
                  </label>
                  <select
                    id="reclamation-type"
                    value={reclamationForm.type_reclamation}
                    onChange={(event) =>
                      handleReclamationFieldChange(
                        'type_reclamation',
                        event.target.value,
                      )
                    }
                    className="w-full h-11 rounded-xl border border-[#D1D5DB] dark:border-slate-600 px-3.5 text-sm outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">{t('settings.help.reclamationTypePlaceholder')}</option>
                    {reclamationTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {formErrors.type_reclamation && (
                    <p className="mt-1.5 text-xs text-[#DC2626]">{formErrors.type_reclamation}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="reclamation-description" className="block text-sm font-semibold text-[#111827] dark:text-gray-100">
                      {t('settings.help.reclamationDescription')}
                    </label>
                    <span className={`text-xs font-medium ${descriptionLength < 10 ? 'text-[#D97706]' : 'text-[#6B7280] dark:text-gray-400'}`}>
                      {descriptionLength}/2000
                    </span>
                  </div>
                  <textarea
                    id="reclamation-description"
                    value={reclamationForm.description}
                    onChange={(event) =>
                      handleReclamationFieldChange(
                        'description',
                        event.target.value.slice(0, 2000),
                      )
                    }
                    rows={6}
                    placeholder={t('settings.help.reclamationDescriptionPlaceholder')}
                    className="w-full rounded-xl border border-[#D1D5DB] dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3.5 py-3 text-sm outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 transition-all resize-y min-h-[140px]"
                  />
                  {formErrors.description && (
                    <p className="mt-1.5 text-xs text-[#DC2626]">{formErrors.description}</p>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeReclamationModal}
                    className="h-11 px-5 rounded-xl border border-[#D1D5DB] dark:border-slate-600 text-[#4B5563] dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 font-semibold transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReclamation}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-semibold shadow-lg shadow-orange-500/25 hover:brightness-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingReclamation ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {t('settings.help.reclamationSending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('settings.help.reclamationSubmit')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#111827] dark:text-gray-100">{t('settings.help.faqTitle')}</h3>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.help.faqSubtitle')}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className={`rounded-2xl border transition-all duration-300 ${openFaq === index ? 'bg-gray-50 dark:bg-slate-800 border-[#0EA5E9]/20' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-700'}`}>
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors"
              >
                <span className="font-bold text-[#111827] dark:text-gray-100 text-sm leading-tight pr-6">{faq.question}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-slate-700 border transition-all duration-300 ${openFaq === index ? 'rotate-180 border-[#0EA5E9] text-[#0EA5E9] shadow-sm' : 'border-gray-100 dark:border-slate-600 text-gray-400 dark:text-gray-300'}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                      <div className="p-5 pt-0 text-sm font-medium text-[#6B7280] dark:text-gray-400 leading-relaxed">
                        <div className="h-px bg-gray-200/50 dark:bg-slate-700 mb-5" />
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
