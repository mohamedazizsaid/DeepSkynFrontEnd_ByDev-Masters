import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  Mail,
  Calendar,
  User as UserIcon,
  Edit2,
  Save,
  Loader2,
  Sparkles,
  Shield,
  Activity,
  Droplets,
  Sun,
  Clock,
  Award,
  X,
  ChevronRight,
  ChevronDown,
  Check,
  Scan,
  Heart,
} from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { Input } from '../input';
import { useAuthStore } from '../../../stores/auth.store';
import { authService } from '../../../lib/services/auth.service';
import { skinProfileService } from '../../../lib/services/skin-profile.service';
import { analysisService } from '../../../lib/services/analysis.service';
import type { SkinProfile } from '../../../lib/types';
import toast from 'react-hot-toast';

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, loadUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);

  // Close gender dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genderRef.current && !genderRef.current.contains(event.target as Node)) {
        setIsGenderOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    age: user?.dateOfBirth ? (new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()).toString() : '',
    gender: user?.gender || '',
    avatar: user?.avatar || '',
    coverPhoto: user?.coverPhoto || '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, stats] = await Promise.allSettled([
          skinProfileService.getMyProfile(),
          analysisService.getStats(),
        ]);
        if (profile.status === 'fulfilled') {
          setSkinProfile(profile.value);
          setFormData(prev => ({
            ...prev,
            age: profile.value?.skinAge?.toString() || prev.age,
          }));
        }
        if (stats.status === 'fulfilled') {
          setAnalysisCount((stats.value as any)?.totalAnalyses ?? 0);
        }
      } catch { /* use defaults */ } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const year = formData.age ? new Date().getFullYear() - parseInt(formData.age) : null;
      const dateOfBirth = year ? `${year}-01-01T00:00:00Z` : undefined;

      await authService.updateProfile({
        name: formData.name,
        avatar: formData.avatar,
        gender: formData.gender,
        dateOfBirth: dateOfBirth
      });

      if (skinProfile) {
        await skinProfileService.update({
          skinAge: formData.age ? parseInt(formData.age) : undefined,
        });
      }

      await loadUser();
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 lg:mb-10"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
              <UserIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827]">Mon Profil</h1>
              <p className="text-sm text-[#6B7280] hidden sm:block">Gérez vos informations personnelles</p>
            </div>
          </div>
        </div>

      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* ═══════════════════════════════════════════════════════
            LEFT COLUMN — Profile Card + Stats + Skin Summary
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Profile Avatar Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-none shadow-xl">
              {/* Premium Banner */}
              <div className="-mx-6 -mt-6 h-32 sm:h-40 relative overflow-hidden group">
                {user?.coverPhoto ? (
                  <img src={user.coverPhoto} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0EA5E9] via-[#06B6D4] to-[#8B5CF6]">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
                  </div>
                )}
              </div>

              {/* High-End Avatar */}
              <div className="flex flex-col items-center -mt-16 sm:-mt-20 relative z-10 px-4 pb-6">
                <div className="relative group/avatar">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white p-1.5 shadow-2xl ring-1 ring-black/5">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-4xl sm:text-6xl font-bold overflow-hidden shadow-inner">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        formData.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-5">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">{formData.name || 'Utilisateur'}</h2>
                  <p className="text-sm font-medium text-[#6B7280] flex items-center justify-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    {formData.email}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#0EA5E9]/10 to-[#6366F1]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    Membre Premium
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-[#6B7280] border border-gray-100">
                    <Clock className="w-3.5 h-3.5" />
                    Depuis {memberSince}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Analyses',
                  value: analysisCount.toString() || '0',
                  icon: Scan,
                  color: 'from-[#0EA5E9] to-[#06B6D4]',
                  bg: 'bg-[#0EA5E9]/10',
                  textColor: 'text-[#0EA5E9]',
                },
                {
                  label: 'Type de peau',
                  value: skinProfile?.skinType || 'N/A',
                  icon: Droplets,
                  color: 'from-[#8B5CF6] to-[#6366F1]',
                  bg: 'bg-[#8B5CF6]/10',
                  textColor: 'text-[#8B5CF6]',
                },
                {
                  label: 'Score santé',
                  value: skinProfile?.healthScore ? `${skinProfile.healthScore}/100` : 'N/A',
                  icon: Heart,
                  color: 'from-[#EC4899] to-[#F43F5E]',
                  bg: 'bg-[#EC4899]/10',
                  textColor: 'text-[#EC4899]',
                },
                {
                  label: 'Âge cutané',
                  value: skinProfile?.skinAge ? `${skinProfile.skinAge} ans` : 'N/A',
                  icon: Activity,
                  color: 'from-[#10B981] to-[#06B6D4]',
                  bg: 'bg-[#10B981]/10',
                  textColor: 'text-[#10B981]',
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-2.5`}>
                    <stat.icon className={`w-4.5 h-4.5 ${stat.textColor}`} />
                  </div>
                  <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Skin Profile Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.16 }}
          >
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] flex items-center justify-center">
                  <Sun className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-[#111827]">Résumé cutané</h3>
              </div>

              <div className="space-y-3.5">
                {[
                  { label: 'Phototype Fitzpatrick', value: skinProfile?.fitzpatrickType || 'N/A' },
                  { label: 'Préoccupations', value: skinProfile?.concerns?.join(', ') || 'N/A' },
                  { label: 'Score de santé', value: skinProfile?.healthScore ? `${skinProfile.healthScore}/100` : 'N/A' },
                  { label: 'Âge cutané', value: skinProfile?.skinAge ? `${skinProfile.skinAge} ans` : 'N/A' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start justify-between gap-3">
                    <span className="text-sm text-[#6B7280] shrink-0">{item.label}</span>
                    <span className="text-sm font-semibold text-[#374151] text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT COLUMN — Personal Info + Activity
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-sm">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#111827]">Informations personnelles</h3>
                    <p className="text-xs text-[#6B7280] hidden sm:block">Vos données de base</p>
                  </div>
                </div>
                {/* Desktop action already in header */}
              </div>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { label: "Nom complet", value: formData.name || 'Utilisateur', icon: UserIcon },
                  { label: "Adresse email", value: formData.email, icon: Mail },
                  { label: "Âge", value: formData.age ? `${formData.age} ans` : 'N/A', icon: Calendar },
                  { 
                    label: "Genre", 
                    value: formData.gender 
                      ? { Male: 'Homme', Female: 'Femme', 'Non-binary': 'Non-binaire', 'Prefer not to say': 'Préfère ne pas dire' }[formData.gender] || formData.gender 
                      : 'N/A', 
                    icon: UserIcon 
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#0EA5E9]">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-[#374151]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
          >
            <Card>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#111827]">Sécurité du compte</h3>
                  <p className="text-xs text-[#6B7280] hidden sm:block">Protégez votre compte</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] hover:border-[#8B5CF6]/30 transition-colors duration-200 group">
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827]">Authentification 2FA</p>
                    <p className="text-xs text-[#6B7280]">Protection supplémentaire</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#8B5CF6] transition-colors" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] hover:border-[#0EA5E9]/30 transition-colors duration-200 group">
                  <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827]">Email vérifié</p>
                    <p className="text-xs text-[#10B981] font-medium">✓ Confirmé</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#0EA5E9] transition-colors" />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.24 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#06B6D4] flex items-center justify-center shadow-sm">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#111827]">Activité récente</h3>
                    <p className="text-xs text-[#6B7280] hidden sm:block">Votre historique d'activité</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { action: 'Analyse de peau effectuée', date: 'Il y a 2 heures', type: 'analysis', color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10' },
                  { action: 'Routine matinale mise à jour', date: 'Hier', type: 'routine', color: '#F9A8D4', bg: 'bg-[#F9A8D4]/10' },
                  { action: 'Discussion avec le coach IA', date: 'Il y a 2 jours', type: 'chat', color: '#FBBF24', bg: 'bg-[#FBBF24]/10' },
                  { action: 'Nouvelles photos téléversées', date: 'Il y a 3 jours', type: 'upload', color: '#6B7280', bg: 'bg-[#6B7280]/10' },
                  { action: 'Série de 14 jours atteinte', date: 'Il y a 1 semaine', type: 'achievement', color: '#10B981', bg: 'bg-[#10B981]/10' }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                    className="flex items-center gap-4 p-3.5 bg-[#F9FAFB] rounded-xl border border-transparent hover:border-[#E5E7EB] hover:shadow-sm transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-xl ${activity.bg} flex items-center justify-center shrink-0`}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activity.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#374151] truncate">{activity.action}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{activity.date}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D1D5DB] shrink-0" />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
