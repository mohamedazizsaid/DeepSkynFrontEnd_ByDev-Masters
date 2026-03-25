import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail, MessageCircle, FileQuestion, ChevronDown, Sparkles } from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

interface HelpSettingsProps {
  onBack: () => void;
}

export function HelpSettings({ onBack }: HelpSettingsProps) {
  const { t } = useAccessibilityStore();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Comment fonctionne l'analyse de peau ?",
      answer: "L'analyse utilise l'intelligence artificielle pour examiner votre photo. Prenez un selfie sous un bon éclairage naturel, l'IA détectera ensuite les zones de sécheresse, taches, acné ou rides pour vous conseiller."
    },
    {
      question: "La fonctionnalité 'Coach IA' est-elle payante ?",
      answer: "Vous bénéficiez de 10 messages gratuits par jour. Pour des interactions illimitées et des recommandations de produits très personnalisées, l'abonnement Premium est nécessaire."
    },
    {
      question: "Comment annuler mon abonnement ?",
      answer: "Vous pouvez annuler votre abonnement dans vos paramètres de compte sur la plateforme (Google Play, Apple Store ou Stripe) via l'interface d'abonnement. L'accès Premium restera actif jusqu'à la fin de la période facturée."
    },
    {
      question: "Mes photos sont-elles enregistrées ?",
      answer: "Vos photos sont traitées de manière sécurisée pour l'analyse. Vous pouvez demander leur suppression complète depuis les paramètres de confidentialité de votre profil."
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Back Button (Mobile) */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-all w-fit font-black uppercase text-xs tracking-widest"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('common.back') || 'Retour'}
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
            <h2 className="text-lg font-bold text-[#111827]">{t('settings.help.title')}</h2>
            <p className="text-xs text-[#6B7280]">{t('settings.help.subtitle')}</p>
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
            <h3 className="text-xl font-bold text-white mb-2">Besoin d'un coup de main ?</h3>
            <p className="text-white/80 text-sm max-w-xl leading-relaxed">
              Que vous ayez une question sur l'IA ou besoin d'aide pour votre abonnement, notre équipe et nos outils sont là pour vous accompagner 24h/24.
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
          className="bg-white rounded-3xl border border-[#E5E7EB] p-8 flex flex-col items-center text-center group transition-all hover:border-[#0EA5E9]/30 hover:shadow-xl hover:shadow-blue-500/5"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#0EA5E9]/5 flex items-center justify-center mb-6 shadow-sm border border-[#0EA5E9]/10 group-hover:scale-105 transition-transform duration-300">
            <Mail className="w-10 h-10 text-[#0EA5E9]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827] mb-2">Assistance par Email</h3>
          <p className="text-sm text-[#6B7280] mb-8 leading-relaxed max-w-[200px]">Notre équipe d'experts répond généralement sous 24h ouvrées.</p>
          <a
            href="mailto:support@deepskyn.com"
            className="px-8 py-4 w-full bg-[#0EA5E9] text-white font-bold rounded-2xl hover:bg-[#0284C7] shadow-lg shadow-[#0EA5E9]/20 transition-all text-sm uppercase tracking-widest text-center"
          >
            support@deepskyn.com
          </a>
        </motion.div>

        {/* Coach IA */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-[#E5E7EB] p-8 flex flex-col items-center text-center group transition-all hover:border-[#10B981]/30 hover:shadow-xl hover:shadow-emerald-500/5"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#10B981]/5 flex items-center justify-center mb-6 shadow-sm border border-[#10B981]/10 group-hover:scale-105 transition-transform duration-300">
            <MessageCircle className="w-10 h-10 text-[#10B981]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827] mb-2">Coach IA Personnel</h3>
          <p className="text-sm text-[#6B7280] mb-8 leading-relaxed max-w-[200px]">Pour toute question sur votre routine, consultez notre IA spécialisée.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 w-full bg-white border-2 border-[#E5E7EB] text-[#4B5563] font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm uppercase tracking-widest shadow-sm"
          >
            Aller vers Accueil
          </button>
        </motion.div>
      </div>

      {/* FAQs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#111827]">Questions fréquentes</h3>
            <p className="text-xs text-[#6B7280]">Tout ce que vous devez savoir sur DeepSkyn</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className={`rounded-2xl border transition-all duration-300 ${openFaq === index ? 'bg-gray-50 border-[#0EA5E9]/20' : 'bg-white border-gray-100'}`}>
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors"
              >
                <span className="font-bold text-[#111827] text-sm leading-tight pr-6">{faq.question}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white border transition-all duration-300 ${openFaq === index ? 'rotate-180 border-[#0EA5E9] text-[#0EA5E9] shadow-sm' : 'border-gray-100 text-gray-400'}`}>
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
                    <div className="p-5 pt-0 text-sm font-medium text-[#6B7280] leading-relaxed">
                       <div className="h-px bg-gray-200/50 mb-5" />
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
