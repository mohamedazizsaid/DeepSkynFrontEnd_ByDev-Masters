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

import { useAccessibilityStore } from '../../stores/accessibility.store';

interface SettingsPageProps {
  onBack?: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, logout } = useAuthStore();
  const { t } = useAccessibilityStore();
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
      title: t('settings.account'),
      items: [
        {
          id: 'personal',
          icon: <User className="w-5 h-5" />,
          label: t('settings.personalInfo'),
          description: t('settings.personalInfoDesc'),
          color: 'from-[#0EA5E9] to-[#06B6D4]',
          iconBg: 'bg-[#0EA5E9]/10',
          iconColor: 'text-[#0EA5E9]',
        },
        {
          id: '2fa',
          icon: <Shield className="w-5 h-5" />,
          label: t('settings.twoFactor'),
          description: t('settings.twoFactorDesc'),
          color: 'from-[#8B5CF6] to-[#6366F1]',
          iconBg: 'bg-[#8B5CF6]/10',
          iconColor: 'text-[#8B5CF6]',
        },
        {
          id: 'password',
          icon: <Lock className="w-5 h-5" />,
          label: t('settings.password'),
          description: t('settings.passwordDesc'),
          color: 'from-[#EC4899] to-[#F43F5E]',
          iconBg: 'bg-[#EC4899]/10',
          iconColor: 'text-[#EC4899]',
        },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        {
          id: 'notifications',
          icon: <Bell className="w-5 h-5" />,
          label: t('settings.notifications'),
          description: t('settings.notificationsDesc'),
          color: 'from-[#F59E0B] to-[#EF4444]',
          iconBg: 'bg-[#F59E0B]/10',
          iconColor: 'text-[#F59E0B]',
        },
        {
          id: 'appearance',
          icon: <Palette className="w-5 h-5" />,
          label: t('settings.appearance'),
          description: t('settings.appearanceDesc'),
          color: 'from-[#10B981] to-[#06B6D4]',
          iconBg: 'bg-[#10B981]/10',
          iconColor: 'text-[#10B981]',
        },
        {
          id: 'language',
          icon: <Globe className="w-5 h-5" />,
          label: t('settings.langAndRegion'),
          description: user?.preferredLanguage ? (['fr', 'en', 'ar', 'es', 'de', 'it'].includes(user.preferredLanguage) ? { fr: 'Français', en: 'English', ar: 'العربية', es: 'Español', de: 'Deutsch', it: 'Italiano' }[user.preferredLanguage] : user.preferredLanguage) : 'Français',
          color: 'from-[#6366F1] to-[#8B5CF6]',
          iconBg: 'bg-[#6366F1]/10',
          iconColor: 'text-[#6366F1]',
        },
      ],
    },
    {
      title: t('settings.support'),
      items: [
        {
          id: 'help',
          icon: <HelpCircle className="w-5 h-5" />,
          label: t('settings.helpCenter'),
          description: t('settings.helpDesc'),
          color: 'from-[#14B8A6] to-[#06B6D4]',
          iconBg: 'bg-[#14B8A6]/10',
          iconColor: 'text-[#14B8A6]',
        },
        {
          id: 'terms',
          icon: <FileText className="w-5 h-5" />,
          label: t('settings.terms'),
          description: t('settings.termsDesc'),
          color: 'from-[#64748B] to-[#475569]',
          iconBg: 'bg-[#64748B]/10',
          iconColor: 'text-[#64748B]',
        },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    setCurrentView(id as any);
  };

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827]">{t('settings.title')}</h1>
              <p className="text-sm text-[#6B7280] hidden sm:block">{t('settings.managePreferences')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Layout - Grid with Sidebar on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">

        {/* Left Column — User Card + Sidebar Menu + Logout */}
        <div className="lg:col-span-1 flex flex-col gap-4 sticky top-24">
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
            >
              {/* User Banner */}
              <div className="h-24 sm:h-28 relative overflow-hidden">
                {user.coverPhoto ? (
                  <img
                    src={user.coverPhoto}
                    alt="Couverture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4]">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="px-5 pb-5 -mt-10 relative">
                <div className="relative group w-20 h-20 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-xl overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-lg text-[#111827]">{user.name}</h3>
                  <p className="text-sm text-[#6B7280]">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0EA5E9]/10 to-[#06B6D4]/10 text-[#0EA5E9]">
                      ✨ {t('settings.premiumMember')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Desktop Navigation Menu (hidden on mobile) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="hidden lg:block bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4"
          >
            {settingsSections.map((section, si) => (
              <div key={section.title} className={`${si > 0 ? 'mt-6' : ''}`}>
                <h2 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2 px-3">{section.title}</h2>
                <div className="space-y-1">
                  {section.items.map(item => {
                    const isActive = currentView === item.id || (currentView === 'main' && item.id === 'personal');
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                          isActive
                            ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]'
                            : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          isActive 
                            ? `bg-gradient-to-br ${item.color} text-white shadow-sm` 
                            : 'bg-[#F3F4F6] text-[#9CA3AF]'
                        }`}>
                          {(React.cloneElement(item.icon as any, { size: 18 }))}
                        </div>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:bg-[#FEF2F2] hover:border-red-200 transition-all duration-200 group"
            whileTap={{ scale: 0.99 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:shadow-red-500/20 transition-shadow duration-200">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-[#EF4444]">{t('nav.logout')}</span>
              <p className="text-xs text-[#9CA3AF]">{t('settings.closeSession')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#EF4444]/50 group-hover:text-[#EF4444] transition-colors duration-200" />
          </motion.button>
        </div>

        {/* Right Column — Settings Content (Responsive) */}
        <div className="lg:col-span-3">
          {/* Mobile Main Menu (hidden on Desktop) */}
          <div className={`lg:hidden ${currentView !== 'main' ? 'hidden' : 'block'}`}>
            {settingsSections.map((section, si) => (
              <motion.div
                key={si}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: si * 0.08 }}
                className="mb-6"
              >
                <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-3 ml-1">{section.title}</h2>
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                  {section.items.map((item, ii) => (
                    <button
                      key={ii}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-[#F9FAFB] transition-all duration-200 text-left group ${
                        ii < section.items.length - 1 ? 'border-b border-[#E5E7EB]' : ''
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#111827] text-sm sm:text-base">{item.label}</h3>
                        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#6B7280] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Content Views OR Mobile Detailed Views */}
          <div className={currentView === 'main' ? 'hidden lg:block' : 'block'}>
             {/* If currentView is main on Desktop, we show personal by default */}
             {(currentView === 'personal' || (currentView === 'main' && window.innerWidth >= 1024)) && (
               <PersonalInfoSettings onBack={() => setCurrentView('main')} />
             )}
             {currentView === '2fa' && <TwoFactorSettings onBack={() => setCurrentView('main')} />}
             {currentView === 'password' && <ChangePasswordSettings onBack={() => setCurrentView('main')} />}
             {currentView === 'language' && <LanguageSettings onBack={() => setCurrentView('main')} />}
             {/* Note: Other tabs like 'notifications', 'appearance', 'help' just show placeholders if clicked, or stay on current for now */}
          </div>
        </div>
      </div>
    </div>
  );
}
