import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Mail, Smartphone, ArrowLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAuthStore } from '../../stores/auth.store';
import { usersService } from '../../lib/services/users.service';
import toast from 'react-hot-toast';

interface NotificationSettingsProps {
  onBack: () => void;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const { t } = useAccessibilityStore();
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    email_routines: true,
    email_reports: true,
    email_tips: false,
    app_routines: true,
    app_ai: true,
    app_community: true,
  });

  // Initialize from user settings
  useEffect(() => {
    if (user?.settings?.notifications) {
      setLocalSettings(prev => ({
        ...prev,
        ...user.settings.notifications
      }));
    }
  }, [user]);

  const handleToggle = async (key: keyof typeof localSettings) => {
    const newValue = !localSettings[key];
    const updatedLocal = { ...localSettings, [key]: newValue };
    
    // Optimistic update
    setLocalSettings(updatedLocal);
    
    setSaving(true);
    try {
      const updatedUser = await usersService.updateMe({
        settings: {
          ...user?.settings,
          notifications: updatedLocal
        }
      });
      setUser(updatedUser );
      toast.success(t('settings.notifications.syncSuccess'), {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        duration: 2500,
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
      });
    } catch (error) {
      // Revert on error
      setLocalSettings(localSettings);
      toast.error(t('settings.notifications.syncError'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
    } finally {
      setSaving(false);
    }
  };

  const notificationSections = [
    {
      title: t('settings.notifications.emailSection'),
      icon: <Mail className="w-4 h-4 text-[#0EA5E9]" />,
      items: [
        { id: 'email_routines', label: t('settings.notifications.routines'), desc: t('settings.notifications.routinesDesc'), value: localSettings.email_routines },
        { id: 'email_reports', label: t('settings.notifications.reports'), desc: t('settings.notifications.reportsDesc'), value: localSettings.email_reports },
        { id: 'email_tips', label: t('settings.notifications.tips'), desc: t('settings.notifications.tipsDesc'), value: localSettings.email_tips },
      ]
    },
    {
      title: t('settings.notifications.appSection'),
      icon: <Smartphone className="w-4 h-4 text-[#8B5CF6]" />,
      items: [
        { id: 'app_routines', label: t('settings.notifications.routines'), desc: t('settings.notifications.routinesDesc'), value: localSettings.app_routines },
        { id: 'app_ai', label: t('settings.notifications.aiSpecialist'), desc: t('settings.notifications.aiSpecialistDesc'), value: localSettings.app_ai },
        { id: 'app_community', label: t('settings.notifications.community'), desc: t('settings.notifications.communityDesc'), value: localSettings.app_community },
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
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
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-gray-100">{t('settings.notifications.title')}</h2>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.notifications.subtitle')}</p>
          </div>
        </div>
        
        {saving && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[10px] font-bold text-[#0EA5E9] uppercase tracking-widest bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100"
           >
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('settings.notifications.syncing')}
           </motion.div>
        )}
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-6 space-y-10"
      >
        {notificationSections.map((section, idx) => (
          <div key={idx} className="space-y-6">
            <h3 className="text-sm font-bold text-[#111827] dark:text-gray-100 flex items-center gap-2">
              {section.icon}
              {section.title}
            </h3>
            <div className="space-y-4">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  disabled={saving}
                  onClick={() => handleToggle(item.id as keyof typeof localSettings)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 group text-left ${
                    item.value 
                      ? 'border-[#0EA5E9] bg-sky-50/30' 
                      : 'border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
                  } ${saving ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  <div className="flex-1 pr-6">
                    <p className={`text-sm font-bold transition-colors ${item.value ? 'text-sky-700 dark:text-sky-300' : 'text-[#111827] dark:text-gray-100'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${
                    item.value ? 'bg-[#0EA5E9]' : 'bg-gray-300'
                  }`}>
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-white shadow-sm shadow-blue-900/10"
                      animate={{ x: item.value ? '24px' : '0px' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>
              ))}
            </div>
            {idx < notificationSections.length - 1 && <div className="h-px bg-gray-100 dark:bg-slate-700" />}
          </div>
        ))}

        {/* Pro Tip */}
        <div className="p-6 bg-gradient-to-r from-[#0EA5E9]/5 to-[#8B5CF6]/5 rounded-2xl border border-[#0EA5E9]/10 flex gap-4 items-start">
           <div className="p-2.5 rounded-xl bg-white shadow-sm border border-[#0EA5E9]/10 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-sky-500" />
           </div>
           <div>
              <p className="text-sm font-bold text-sky-900 dark:text-sky-200 mb-1">{t('dashboard.personalizedAdvice')}</p>
              <p className="text-xs font-medium text-sky-800/80 dark:text-sky-300/80 leading-relaxed">
                {t('dashboard.dailySteps')}
              </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
