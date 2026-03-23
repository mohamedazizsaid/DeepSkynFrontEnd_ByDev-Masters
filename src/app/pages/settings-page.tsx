import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Bell, User, Palette, LogOut, ChevronRight, ArrowLeft, Lock, Globe, HelpCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { TwoFactorSettings } from './two-factor-settings';
import { PersonalInfoSettings } from './personal-info-settings';
import { ChangePasswordSettings } from './change-password-settings';
import { LanguageSettings } from './language-settings';
import toast from 'react-hot-toast';

interface SettingsPageProps {
  onBack?: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'main' | '2fa' | 'personal' | 'password' | 'language'>('main');

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const settingsSections = [
    {
      title: 'Compte',
      items: [
        {
          icon: <User className="w-5 h-5" />,
          label: 'Informations personnelles',
          description: 'Nom, email, photo de profil',
          color: 'from-[#0EA5E9] to-[#06B6D4]',
          iconBg: 'bg-[#0EA5E9]/10',
          iconColor: 'text-[#0EA5E9]',
          onClick: () => setCurrentView('personal'),
        },
        {
          icon: <Shield className="w-5 h-5" />,
          label: 'Authentification 2FA',
          description: 'Renforcez la sécurité de votre compte',
          color: 'from-[#8B5CF6] to-[#6366F1]',
          iconBg: 'bg-[#8B5CF6]/10',
          iconColor: 'text-[#8B5CF6]',
          onClick: () => setCurrentView('2fa'),
        },
        {
          icon: <Lock className="w-5 h-5" />,
          label: 'Mot de passe',
          description: 'Modifier votre mot de passe',
          color: 'from-[#EC4899] to-[#F43F5E]',
          iconBg: 'bg-[#EC4899]/10',
          iconColor: 'text-[#EC4899]',
          onClick: () => setCurrentView('password'),
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: <Bell className="w-5 h-5" />,
          label: 'Notifications',
          description: 'Gérer les alertes et rappels',
          color: 'from-[#F59E0B] to-[#EF4444]',
          iconBg: 'bg-[#F59E0B]/10',
          iconColor: 'text-[#F59E0B]',
          onClick: () => {},
        },
        {
          icon: <Palette className="w-5 h-5" />,
          label: 'Apparence',
          description: 'Thème, couleurs et affichage',
          color: 'from-[#10B981] to-[#06B6D4]',
          iconBg: 'bg-[#10B981]/10',
          iconColor: 'text-[#10B981]',
          onClick: () => {},
        },
        {
          icon: <Globe className="w-5 h-5" />,
          label: 'Langue & région',
          description: user?.preferredLanguage ? (['fr', 'en', 'ar', 'es', 'de', 'it'].includes(user.preferredLanguage) ? { fr: 'Français', en: 'English', ar: 'العربية', es: 'Español', de: 'Deutsch', it: 'Italiano' }[user.preferredLanguage] : user.preferredLanguage) : 'Français',
          color: 'from-[#6366F1] to-[#8B5CF6]',
          iconBg: 'bg-[#6366F1]/10',
          iconColor: 'text-[#6366F1]',
          onClick: () => setCurrentView('language'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle className="w-5 h-5" />,
          label: 'Centre d\'aide',
          description: 'FAQ et assistance',
          color: 'from-[#14B8A6] to-[#06B6D4]',
          iconBg: 'bg-[#14B8A6]/10',
          iconColor: 'text-[#14B8A6]',
          onClick: () => {},
        },
        {
          icon: <FileText className="w-5 h-5" />,
          label: 'Conditions d\'utilisation',
          description: 'Politique de confidentialité',
          color: 'from-[#64748B] to-[#475569]',
          iconBg: 'bg-[#64748B]/10',
          iconColor: 'text-[#64748B]',
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 lg:mb-10"
      >
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#0EA5E9]/30 hover:bg-[#0EA5E9]/5 text-[#6B7280] hover:text-[#0EA5E9] transition-all duration-200 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-[#6B7280] to-[#4B5563] flex items-center justify-center shadow-lg shadow-gray-500/20">
              <Settings className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827]">Paramètres</h1>
              <p className="text-sm text-[#6B7280] hidden sm:block">Gérez vos préférences et votre compte</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Layout - Keep left sidebar always visible */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

        {/* Left Column — User Card + Logout (ALWAYS VISIBLE) */}
        <div className="lg:col-span-1">
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden sticky top-24"
            >
              {/* User Banner */}
              <div className="h-20 sm:h-24 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50" />
              </div>

              {/* User Info */}
              <div className="px-5 pb-5 -mt-8 relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-lg">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-lg text-[#111827]">{user.name}</h3>
                  <p className="text-sm text-[#6B7280]">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0EA5E9]/10 to-[#06B6D4]/10 text-[#0EA5E9]">
                      ✨ Membre Premium
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Logout — visible under user card on desktop */}
          <motion.button
            onClick={handleLogout}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="w-full mt-4 flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:bg-[#FEF2F2] hover:border-red-200 transition-all duration-200 group sticky top-80"
            whileTap={{ scale: 0.99 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:shadow-red-500/20 transition-shadow duration-200">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-[#EF4444]">Se déconnecter</span>
              <p className="text-xs text-[#9CA3AF]">Fermer votre session</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#EF4444]/50 group-hover:text-[#EF4444] transition-colors duration-200" />
          </motion.button>
        </div>

        {/* Right Column — Settings Content (CHANGES) */}
        <div className="lg:col-span-3">
          {currentView === 'main' && (
            <>
              {settingsSections.map((section, si) => (
                <motion.div
                  key={si}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: si * 0.08 }}
                >
                  <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-3 ml-1">{section.title}</h2>
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    {section.items.map((item, ii) => (
                      <motion.button
                        key={ii}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-[#F9FAFB] transition-all duration-200 text-left group ${
                          ii < section.items.length - 1 ? 'border-b border-[#E5E7EB]' : ''
                        }`}
                        whileTap={{ scale: 0.995 }}
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#111827] text-sm sm:text-base">{item.label}</h3>
                          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">{item.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#6B7280] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {currentView !== 'main' && currentView === 'personal' && <PersonalInfoSettings onBack={() => setCurrentView('main')} />}
          {currentView !== 'main' && currentView === '2fa' && <TwoFactorSettings onBack={() => setCurrentView('main')} />}
          {currentView !== 'main' && currentView === 'password' && <ChangePasswordSettings onBack={() => setCurrentView('main')} />}
          {currentView !== 'main' && currentView === 'language' && <LanguageSettings onBack={() => setCurrentView('main')} />}
        </div>
      </div>
    </div>
  );
}
