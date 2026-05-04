import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

interface TermsSettingsProps {
  onBack: () => void;
}

export function TermsSettings({ onBack }: TermsSettingsProps) {
  const { t } = useAccessibilityStore();

  const sections = t('settings.terms.sections') || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button (Mobile) */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-gray-100 transition-all w-fit"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{t('common.back')}</span>
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
            <h2 className="text-lg font-bold text-[#111827] dark:text-gray-100">{t('settings.terms.title')}</h2>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.terms.updateDate', { date: '25/03/2026' })}</p>
          </div>
        </div>
      </motion.div>

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-6"
      >
        {/* Intro Banner */}
        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 flex items-start sm:items-center gap-5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-emerald-100 dark:border-emerald-700/40 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] dark:text-gray-100">{t('settings.terms.transparency')}</h3>
            <p className="text-xs font-medium text-[#6B7280] dark:text-gray-400 mt-1 leading-relaxed">
              {t('settings.terms.transparencyDesc')}
            </p>
          </div>
        </div>

        {/* Text Sections */}
        <div className="space-y-8">
          {sections.map((section: any, index: number) => (
            <div key={index} className="scroll-mt-20 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-[#0EA5E9]/10 group-hover:text-[#0EA5E9] transition-all border border-gray-100 shrink-0">
                    {index + 1}
                  </div>
                  <h4 className="text-sm font-bold text-[#111827] dark:text-gray-100">{section.title}</h4>
                </div>
                <p className="text-xs font-medium leading-relaxed text-[#6B7280] dark:text-gray-400 pl-10">{section.content}</p>
            </div>
          ))}

          {/* Footer Note */}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <h4 className="text-sm font-bold text-[#111827] dark:text-gray-100 mb-1">{t('settings.terms.needHelp')}</h4>
              <p className="text-xs font-medium text-[#6B7280] dark:text-gray-400 leading-relaxed">
                {t('settings.terms.contactSupport', { email: 'support@deepskyn.com' })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
