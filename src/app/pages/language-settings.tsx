import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Check, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../lib/services/auth.service';
import toast from 'react-hot-toast';

interface LanguageSettingsProps {
  onBack: () => void;
}

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'France' },
  { code: 'en', name: 'English', flag: '🇬🇧', region: 'United Kingdom' },
  { code: 'ar', name: 'العربية', flag: '🇹🇳', region: 'تونس' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'España' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', region: 'Deutschland' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', region: 'Italia' },
];

export function LanguageSettings({ onBack }: LanguageSettingsProps) {
  const { user, loadUser } = useAuthStore();
  const [selectedLanguage, setSelectedLanguage] = useState(user?.preferredLanguage || 'fr');
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setSaving(true);
    try {
      await authService.updateProfile({
        preferredLanguage: languageCode,
      });
      await loadUser();
      toast.success('Langue mise à jour');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
      setSelectedLanguage(user?.preferredLanguage || 'fr');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Retour</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Langue & région</h2>
          <p className="text-xs text-[#6B7280]">Choisissez votre langue préférée</p>
        </div>
      </motion.div>

      {/* Language Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {LANGUAGES.map((lang, index) => (
          <motion.button
            key={lang.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={saving}
            className={`
              relative p-5 rounded-2xl border-2 transition-all duration-200 text-left group
              ${selectedLanguage === lang.code
                ? 'bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/10 border-[#6366F1] shadow-lg shadow-[#6366F1]/20'
                : 'bg-white border-[#E5E7EB] hover:border-[#6366F1]/30 hover:shadow-md'
              }
              ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Flag */}
            <div className="text-4xl mb-3">{lang.flag}</div>

            {/* Language Info */}
            <div className="flex-1">
              <h3 className={`font-bold text-lg transition-colors ${selectedLanguage === lang.code ? 'text-[#6366F1]' : 'text-[#111827]'}`}>
                {lang.name}
              </h3>
              <p className={`text-sm transition-colors ${selectedLanguage === lang.code ? 'text-[#6366F1]/70' : 'text-[#6B7280]'}`}>
                {lang.region}
              </p>
            </div>

            {/* Check Mark */}
            {selectedLanguage === lang.code && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Language Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-0 p-5 bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-2xl"
      >
        <h3 className="font-semibold text-[#111827] mb-3">Langue sélectionnée</h3>
        <p className="text-sm text-[#6B7280]">
          L'interface de DeepSkyn s'affichera en{' '}
          <span className="font-semibold text-[#6366F1]">
            {LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'Français'}
          </span>
          . Cette préférence sera appliquée sur tous vos appareils.
        </p>
      </motion.div>

      {/* Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mt-0 p-5 bg-amber-50 border border-amber-200 rounded-2xl"
      >
        <p className="text-sm font-medium text-amber-900 mb-2">🌍 Bientôt disponible</p>
        <p className="text-xs text-amber-800">
          Plus de langues seront ajoutées dans les prochaines mises à jour. Vous pouvez aussi nous suggérer votre langue dans le centre d'aide.
        </p>
      </motion.div>
    </div>
  );
}
