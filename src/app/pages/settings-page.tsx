import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Bell, User, Palette, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { TwoFactorSettings } from './two-factor-settings';
import toast from 'react-hot-toast';

interface SettingsPageProps {
  onBack?: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'main' | '2fa'>('main');

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  if (currentView === '2fa') {
    return <TwoFactorSettings onBack={() => setCurrentView('main')} />;
  }

  const settingsSections = [
    {
      title: 'Compte',
      items: [
        {
          icon: <User className="w-5 h-5" />,
          label: 'Informations personnelles',
          description: 'Nom, email, avatar',
          color: 'from-[#0EA5E9] to-[#06B6D4]',
          onClick: () => {},
        },
        {
          icon: <Shield className="w-5 h-5" />,
          label: 'Authentification 2FA',
          description: 'Sécurisez votre compte',
          color: 'from-[#8B5CF6] to-[#6366F1]',
          onClick: () => setCurrentView('2fa'),
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: <Bell className="w-5 h-5" />,
          label: 'Notifications',
          description: 'Gérer les alertes',
          color: 'from-[#F59E0B] to-[#EF4444]',
          onClick: () => {},
        },
        {
          icon: <Palette className="w-5 h-5" />,
          label: 'Apparence',
          description: 'Thème et affichage',
          color: 'from-[#10B981] to-[#06B6D4]',
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Retour</span>
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B7280] to-[#4B5563] flex items-center justify-center">
          <Settings className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>

      {/* User Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm mb-8 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-xl font-bold">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-[#111827]">{user.name}</h3>
            <p className="text-sm text-[#6B7280]">{user.email}</p>
          </div>
        </motion.div>
      )}

      {/* Settings Sections */}
      {settingsSections.map((section, si) => (
        <div key={si} className="mb-8">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3">{section.title}</h2>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            {section.items.map((item, ii) => (
              <motion.button
                key={ii}
                onClick={item.onClick}
                className={`w-full flex items-center gap-4 p-4 hover:bg-[#F9FAFB] transition-colors text-left ${
                  ii < section.items.length - 1 ? 'border-b border-[#E5E7EB]' : ''
                }`}
                whileTap={{ scale: 0.99 }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#111827]">{item.label}</h3>
                  <p className="text-sm text-[#6B7280]">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <motion.button
        onClick={handleLogout}
        className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:bg-[#FEF2F2] transition-colors"
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white">
          <LogOut className="w-5 h-5" />
        </div>
        <span className="font-medium text-[#EF4444]">Se déconnecter</span>
      </motion.button>
    </div>
  );
}
