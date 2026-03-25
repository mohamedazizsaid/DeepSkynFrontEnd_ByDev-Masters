import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

interface TermsSettingsProps {
  onBack: () => void;
}

export function TermsSettings({ onBack }: TermsSettingsProps) {
  const { t } = useAccessibilityStore();

  const sections = [
    {
      title: "1. Acceptation des conditions",
      content: "En accédant et en utilisant DeepSkyn, vous acceptez de vous conformer à ces conditions d'utilisation. Si vous n'êtes pas d'accord avec une partie des termes, vous n'êtes pas autorisé à utiliser notre application."
    },
    {
      title: "2. Avis médical",
      content: "DeepSkyn fournit des informations générales basées sur l'intelligence artificielle. Ces informations ne constituent en aucun cas un avis médical, un diagnostic ou un traitement professionnel. Consultez toujours votre dermatologue pour des problèmes spécifiques."
    },
    {
      title: "3. Traitement des données (Confidentialité)",
      content: "La protection de votre vie privée est notre priorité. Vos clichés cutanés sont traités d'une manière sécurisée et ne sont jamais vendus à des tiers. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression."
    },
    {
      title: "4. Licence d'utilisation",
      content: "Nous vous accordons une licence personnelle, non exclusive, et non transférable pour utiliser le service. Vous ne pouvez pas copier, modifier, ou distribuer nos algorithmes IA ou le code de l'application."
    },
    {
      title: "5. Abonnement Premium",
      content: "Les abonnements Premium sont facturés selon la durée choisie (mensuelle/annuelle). Le renouvellement est automatique sauf annulation 24h avant la fin de la période en cours. Aucun remboursement n'est effectué pour une période partiellement entamée."
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button (Mobile) */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-all w-fit"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{t('common.back') || 'Retour'}</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#64748B] to-[#475569] flex items-center justify-center shadow-lg shadow-gray-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">{t('settings.terms.title')}</h2>
            <p className="text-xs text-[#6B7280]">{t('settings.terms.updateDate', { date: '25/03/2026' })}</p>
          </div>
        </div>
      </motion.div>

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
      >
        {/* Intro Banner */}
        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 flex items-start sm:items-center gap-5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Transparence & Sécurité</h3>
            <p className="text-xs font-medium text-[#6B7280] mt-1 leading-relaxed">
              DeepSkyn s'engage à protéger vos données et vous offrir une expérience sécurisée. Lisez attentivement ces termes.
            </p>
          </div>
        </div>

        {/* Text Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="scroll-mt-20 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-[#0EA5E9]/10 group-hover:text-[#0EA5E9] transition-all border border-gray-100 shrink-0">
                    {index + 1}
                  </div>
                  <h4 className="text-sm font-bold text-[#111827]">{section.title}</h4>
                </div>
                <p className="text-xs font-medium leading-relaxed text-[#6B7280] pl-10">{section.content}</p>
            </div>
          ))}

          {/* Footer Note */}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <div className="p-5 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="text-sm font-bold text-[#111827] mb-1">Besoin d'éclaircissements ?</h4>
              <p className="text-xs font-medium text-[#6B7280] leading-relaxed">
                Pour toute interrogation relative à nos conditions d'utilisation ou notre politique de vie privée, contactez notre équipe légale à <span className="text-[#0EA5E9] font-bold">support@deepskyn.com</span>.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
