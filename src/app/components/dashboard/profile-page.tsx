import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  Mail,
  Calendar,
  User as UserIcon,
  User,
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
  MessageCircle,
  FileText,
  Layers,
  Snowflake,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '../button';
import { Card } from '../card';
import { Input } from '../input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
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
  const { t } = useAccessibilityStore();
  const [isEditing, setIsEditing] = useState(false);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);

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
    name: user?.name || '',
    email: user?.email || '',
    age: user?.dateOfBirth ? (new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()).toString() : '',
    gender: user?.gender || '',
    avatar: user?.avatar || '',
    coverPhoto: user?.coverPhoto || '',
  });

  const [editProfileData, setEditProfileData] = useState({
    skinType: '' as any,
    fitzpatrickType: 0,
    concerns: [] as string[],
    sensitivities: [] as string[],
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
          if (profile.value) {
            setEditProfileData({
              skinType: profile.value.skinType || '',
              fitzpatrickType: profile.value.fitzpatrickType || 0,
              concerns: profile.value.concerns || [],
              sensitivities: profile.value.sensitivities || [],
            });
          }
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
        gender: user.gender || prev.gender,
      }));
    }
  }, [user]);

  const toggleConcern = (id: string) => {
    setEditProfileData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(id)
        ? prev.concerns.filter(c => c !== id)
        : [...prev.concerns, id]
    }));
  };

  const toggleSensitivity = (id: string) => {
    setEditProfileData(prev => ({
      ...prev,
      sensitivities: prev.sensitivities.includes(id)
        ? prev.sensitivities.filter(s => s !== id)
        : [...prev.sensitivities, id]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const year = formData.age ? new Date().getFullYear() - parseInt(formData.age) : null;
      const dateOfBirth = year ? `${year}-01-01T00:00:00Z` : undefined;

      // 1. Update User Basic Profile
      await authService.updateProfile({
        name: formData.name,
        avatar: formData.avatar,
        gender: formData.gender,
        dateOfBirth: dateOfBirth
      });

      // 2. Update Skin Profile (Onboarding classes)
      await skinProfileService.upsert({
        skinType: editProfileData.skinType,
        fitzpatrickType: editProfileData.fitzpatrickType,
        concerns: editProfileData.concerns,
        sensitivities: editProfileData.sensitivities,
        skinAge: formData.age ? parseInt(formData.age) : undefined,
      });

      const updatedProfile = await skinProfileService.getMyProfile();
      setSkinProfile(updatedProfile);

      await loadUser();
      setIsEditing(false);
      toast.success(t('common.success') || 'Profil mis à jour');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current) {
        toast.error(t('profile.reportError') || 'Contenu introuvable pour le rapport.');
        return;
    }
    
    setIsSaving(true);
    const toastId = toast.loading(t('profile.generatingReport'));
    
    try {
      const element = reportRef.current;
      
      // We use a simplified hidden div for the PDF to avoid oklch errors
      // and Backdrop-Blur glitches in html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions in px at 96 DPI are approximately 794x1123
      // But we use the canvas size and scale it to fit A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // Add a clean header to the PDF manually for "Premium" feel
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(14, 165, 233); // #0EA5E9
      pdf.text(t('profile.reportTitle'), pdfWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(t('profile.reportGeneratedAt', { 
        date: new Date().toLocaleDateString(t('common.loading') === '...جاري التحميل' ? 'ar-SA' : 'fr-FR'), 
        user: user?.name || t('nav.profile') 
      }), pdfWidth / 2, 22, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, 30, finalWidth, finalHeight);
      
      // Add footer
      pdf.setFontSize(8);
      pdf.text(t('profile.reportConfidential'), pdfWidth / 2, pdfHeight - 10, { align: 'center' });
      
      pdf.save(`Rapport_De_Peau_${user?.name?.replace(/\s+/g, '_') || 'DeepSkyn'}.pdf`);
      
      toast.success(t('profile.reportReady'), { id: toastId });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error(t('profile.reportError'), { id: toastId });
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
    ? new Date(user.createdAt).toLocaleDateString(t('common.loading') === '...جاري التحميل' ? 'ar-SA' : 'fr-FR', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 lg:mb-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
            <UserIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827]">{t('nav.profile')}</h1>
            <p className="text-sm text-[#6B7280] hidden sm:block tracking-wide">{t('settings.personalInfoDesc')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={handleDownloadReport}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-xl px-7 py-3 bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 hover:-translate-y-1 active:scale-95 transition-all duration-300 gap-2.5 font-extrabold"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-white" />}
            <span className="whitespace-nowrap text-white font-black drop-shadow-sm">{t('profile.downloadReport')}</span>
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 p-1"
      >

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
            <Card className="overflow-hidden border-none shadow-2xl bg-white/70 backdrop-blur-xl ring-1 ring-black/5">
              {/* Premium Banner */}
              <div className="-mx-6 -mt-6 h-40 sm:h-48 relative overflow-hidden group">
                {user?.coverPhoto ? (
                  <img src={user.coverPhoto} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0EA5E9] via-[#06B6D4] to-[#8B5CF6]">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30 animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* High-End Avatar */}
              <div className="flex flex-col items-center -mt-20 sm:-mt-24 relative z-10 px-4 pb-8">
                <div className="relative group/avatar">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-white transition-transform duration-500 group-hover/avatar:scale-105">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-4xl sm:text-6xl font-bold overflow-hidden shadow-inner">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        formData.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">{formData.name || t('nav.profile')}</h2>
                  <p className="text-sm font-semibold text-[#6B7280] flex items-center justify-center gap-1.5 mt-1.5 opacity-80">
                    <Mail className="w-4 h-4 text-[#0EA5E9]" />
                    {formData.email}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 shadow-sm transition-colors hover:bg-[#0EA5E9]/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('profile.memberPremium')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white/50 backdrop-blur-md text-gray-500 border border-gray-100 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    {t('profile.memberSince', { date: memberSince })}
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
                  label: t('dashboard.analyses'),
                  value: analysisCount.toString() || '0',
                  icon: Scan,
                  color: 'from-[#0EA5E9] to-[#06B6D4]',
                  bg: 'bg-[#0EA5E9]/10',
                  textColor: 'text-[#0EA5E9]',
                },
                {
                  label: t('onboarding.skinTitle'),
                  value: (t('onboarding.skinTypesLabels') as any)[skinProfile?.skinType || ''] || 'N/A',
                  icon: Droplets,
                  color: 'from-[#8B5CF6] to-[#6366F1]',
                  bg: 'bg-[#8B5CF6]/10',
                  textColor: 'text-[#8B5CF6]',
                },
                {
                  label: t('dashboard.skinHealth'),
                  value: skinProfile?.healthScore ? `${skinProfile.healthScore}/100` : 'N/A',
                  icon: Heart,
                  color: 'from-[#EC4899] to-[#F43F5E]',
                  bg: 'bg-[#EC4899]/10',
                  textColor: 'text-[#EC4899]',
                },
                {
                  label: t('dashboard.skinAge'),
                  value: skinProfile?.skinAge ? `${skinProfile.skinAge} ${t('common.years')}` : 'N/A',
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
                  className="group bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center mb-4 transition-transform duration-500 group-hover:rotate-12`}>
                    <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">{stat.label}</h4>
                    <p className={`text-xl font-extrabold ${stat.textColor}`}>{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Coach IA Insights / AI Message Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.16 }}
            className="mt-2"
          >
            <Card className="bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] border-none shadow-2xl overflow-hidden relative group cursor-pointer p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12" />
              
              <div className="relative z-10 text-left">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-widest leading-none">Analyse du Coach IA</h3>
                    <p className="text-white/60 text-[10px] font-bold mt-1.5 uppercase tracking-wider">Insight du jour</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-6 group-hover:bg-white/15 transition-all">
                  <p className="text-white text-sm font-bold leading-relaxed italic">
                    "Votre profil indique une légère déshydratation en zone T. Pensez à augmenter votre apport en eau aujourd'hui !"
                  </p>
                </div>
                
                <Button 
                  className="w-full !bg-white !text-black hover:!bg-white/95 font-black rounded-xl h-11 shadow-2xl active:scale-95 transition-all border-none relative z-20"
                >
                  Discuter avec le coach
                </Button>
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
            <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#0EA5E9]/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#111827] tracking-tight">{t('settings.personalInfo')}</h3>
                    <p className="text-xs text-[#6B7280] font-medium opacity-70 hidden sm:block">{t('settings.personalInfoDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 relative z-10">
                {[
                  { label: t('auth.fullName'), value: formData.name || t('nav.profile'), icon: UserIcon, color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/5' },
                  { label: t('auth.email'), value: formData.email, icon: Mail, color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/5' },
                  { label: t('profile.age'), value: formData.age ? `${formData.age} ${t('common.years')}` : 'N/A', icon: Calendar, color: 'text-[#EC4899]', bg: 'bg-[#EC4899]/5' },
                  { 
                    label: t('onboarding.gender'), 
                    value: formData.gender 
                      ? (formData.gender === 'Male' ? t('onboarding.genderM') : formData.gender === 'Female' ? t('onboarding.genderF') : t('onboarding.genderO'))
                      : 'N/A', 
                    icon: UserIcon,
                    color: 'text-[#10B981]',
                    bg: 'bg-[#10B981]/5'
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-5 bg-white/50 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 group/field">
                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shadow-sm transition-transform duration-300 group-hover/field:scale-110`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{item.value}</p>
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
            <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#111827] tracking-tight">{t('profile.securityTitle')}</h3>
                  <p className="text-xs text-[#6B7280] font-medium opacity-70 hidden sm:block">{t('profile.securityDesc')}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="flex items-center gap-4 p-5 bg-white/50 rounded-2xl border border-white/60 hover:border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/5 transition-all duration-300 group cursor-pointer shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Shield className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111827]">{t('settings.twoFactor')}</p>
                    <p className="text-xs text-[#6B7280] font-medium">{t('settings.twoFactorDesc')}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex items-center gap-4 p-5 bg-white/50 rounded-2xl border border-white/60 hover:border-[#10B981]/30 hover:bg-[#10B981]/5 transition-all duration-300 group cursor-pointer shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Check className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111827]">Email vérifié</p>
                    <p className="text-xs text-[#10B981] font-bold">✓ Confirmé</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
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
            <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#10B981]/5 to-transparent rounded-full -ml-24 -mb-24 blur-3xl" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#111827] tracking-tight">Activité récente</h3>
                    <p className="text-xs text-[#6B7280] font-medium opacity-70 hidden sm:block">Votre journal d'expérience DeepSkyn</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#10B981] hover:bg-[#10B981]/10 font-bold rounded-xl px-4">Tout voir</Button>
              </div>

              <div className="space-y-4 relative z-10">
                {[
                  { action: 'Analyse de peau effectuée', date: 'Il y a 2 heures', type: 'analysis', color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10', icon: Scan },
                  { action: 'Routine matinale mise à jour', date: 'Hier', type: 'routine', color: '#F9A8D4', bg: 'bg-[#F9A8D4]/10', icon: Calendar },
                  { action: 'Discussion avec le coach IA', date: 'Il y a 2 jours', type: 'chat', color: '#FBBF24', bg: 'bg-[#FBBF24]/10', icon: MessageCircle },
                  { action: 'Nouvelles photos téléversées', date: 'Il y a 3 jours', type: 'upload', color: '#6B7280', bg: 'bg-[#6B7280]/10', icon: Camera },
                  { action: 'Série de 14 jours atteinte', date: 'Il y a 1 semaine', type: 'achievement', color: '#10B981', bg: 'bg-[#10B981]/10', icon: Award }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                    className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/60 hover:border-white hover:bg-white hover:shadow-md transition-all duration-300 group cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-xl ${activity.bg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                      <activity.icon className="w-6 h-6" style={{ color: activity.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#374151] truncate group-hover:text-[#111827] transition-colors">{activity.action}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{activity.date}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Skin Profile Summary (Moved here, below Activity) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.32 }}
          >
            <Card className="relative overflow-hidden bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl group/skin">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0EA5E9]/5 rounded-bl-full -mr-16 -mt-16 transition-transform duration-700 group-hover/skin:scale-110" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] flex items-center justify-center shadow-lg shadow-pink-200/50 group-hover/skin:rotate-12 transition-transform duration-500">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#111827] tracking-tight">{t('onboarding.sumTitle')}</h3>
                    <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">{t('profile.skinIdentity')}</p>
                  </div>
                </div>

                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="text-[#0EA5E9] hover:bg-[#0EA5E9]/10 font-bold rounded-2xl px-4 h-10 transition-all border border-transparent hover:border-[#0EA5E9]/20"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-8 relative z-10">
                  {/* Premium Skin Type Hero Card */}
                  {(() => {
                    const skinTypeInfo: Record<string, { icon: any, gradient: string, bg: string, desc: string, detail: string }> = {
                      normal: { 
                        icon: Sparkles, 
                        gradient: 'from-[#10B981] to-[#34D399]', 
                        bg: 'bg-[#10B981]/10',
                        desc: 'Peau équilibrée et saine',
                        detail: 'Texture uniforme, pores peu visibles, teint naturellement lumineux.'
                      },
                      oily: { 
                        icon: Droplets, 
                        gradient: 'from-[#F59E0B] to-[#FBBF24]', 
                        bg: 'bg-[#F59E0B]/10',
                        desc: 'Tendance aux brillances',
                        detail: 'Pores dilatés, brillance excessive en zone T, tendance aux imperfections.'
                      },
                      dry: { 
                        icon: Sun, 
                        gradient: 'from-[#EF4444] to-[#F87171]', 
                        bg: 'bg-[#EF4444]/10',
                        desc: 'Besoin d\'hydratation intense',
                        detail: 'Sensations de tiraillement, desquamation légère, teint parfois terne.'
                      },
                      combination: { 
                        icon: Layers, 
                        gradient: 'from-[#8B5CF6] to-[#A78BFA]', 
                        bg: 'bg-[#8B5CF6]/10',
                        desc: 'Zone T grasse et joues sèches',
                        detail: 'Équilibre complexe entre excès de sébum central et sécheresse latérale.'
                      },
                      sensitive: { 
                        icon: Snowflake, 
                        gradient: 'from-[#EC4899] to-[#F472B6]', 
                        bg: 'bg-[#EC4899]/10',
                        desc: 'Réactivité et rougeurs',
                        detail: 'Peau fragile réagissant aux agressions extérieures et aux produits forts.'
                      },
                    };
                    const type = skinProfile?.skinType || 'normal';
                    const info = skinTypeInfo[type] || skinTypeInfo.normal;

                    return (
                      <div className="relative group/hero overflow-hidden rounded-[2.5rem] bg-white/40 border border-white/60 p-8 shadow-xl transition-all duration-500 hover:shadow-2xl hover:bg-white/60 hover:-translate-y-1">
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${info.gradient} opacity-5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover/hero:scale-150`} />
                        
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                          <div className={`w-24 h-24 rounded-[2rem] bg-gradient-to-br ${info.gradient} flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 group-hover/hero:rotate-12 transition-transform duration-700`}>
                             <info.icon className="w-12 h-12" />
                          </div>
                          
                          <div className="flex-1 text-center md:text-left">
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-500 mb-2 block">{t('onboarding.skinTitle')}</span>
                            <h2 className="text-3xl font-black text-[#111827] mb-2 tracking-tight">{(t('onboarding.skinTypesLabels') as any)[type] || type}</h2>
                            <p className="text-sm font-bold text-gray-500 mb-4">{info.desc}</p>
                            <div className="p-4 rounded-2xl bg-white/60 border border-white/80 inline-block">
                               <p className="text-xs font-semibold text-gray-400 italic leading-relaxed">"{info.detail}"</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-2 p-6 rounded-[2rem] bg-white/80 border border-white shadow-inner">
                             <Sun className="w-5 h-5 text-amber-500" />
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{t('onboarding.fitzTitle')}</span>
                             <span className="text-2xl font-black text-gray-800 tracking-tighter">Type {skinProfile?.fitzpatrickType || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Secondary Details: Concerns & Sensitivities */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Concerns Section */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0EA5E9]/5 border border-[#0EA5E9]/10 relative overflow-hidden group/concerns">
                       <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#0EA5E9]/10 rounded-full blur-2xl group-hover/concerns:scale-150 transition-transform duration-700" />
                       <div className="flex items-center gap-3 mb-6 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
                             <Activity className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{t('onboarding.concernTitle')}</h3>
                       </div>
                       
                       <div className="flex flex-wrap gap-2.5 relative z-10">
                          {skinProfile?.concerns?.map(id => (
                            <span key={id} className="px-5 py-2.5 rounded-2xl bg-white text-[11px] font-black text-[#0EA5E9] border border-[#0EA5E9]/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                               {(t('onboarding.concernsLabels') as any)[id] || id}
                            </span>
                          )) || <span className="text-xs text-gray-400 font-bold italic">Aucune préoccupation renseignée</span>}
                       </div>
                    </div>

                    {/* Sensitivities Section */}
                    <div className="p-8 rounded-[2.5rem] bg-[#EF4444]/5 border border-[#EF4444]/10 relative overflow-hidden group/sens">
                       <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#EF4444]/10 rounded-full blur-2xl group-hover/sens:scale-150 transition-transform duration-700" />
                       <div className="flex items-center gap-3 mb-6 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-[#EF4444] flex items-center justify-center shadow-lg shadow-[#EF4444]/20">
                             <Shield className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{t('onboarding.sensTitle')}</h3>
                       </div>
                       
                       <div className="flex flex-wrap gap-2.5 relative z-10">
                          {skinProfile?.sensitivities?.map(id => (
                            <span key={id} className="px-5 py-2.5 rounded-2xl bg-white text-[11px] font-black text-[#EF4444] border border-[#EF4444]/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                               {(t('onboarding.sensitivitiesLabels') as any)[id] || id}
                            </span>
                          )) || <span className="text-xs text-gray-400 font-bold italic">Aucune sensibilité renseignée</span>}
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 relative z-10 pb-4">
                  {/* Fitzpatrick Type Edit */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">{t('onboarding.fitzTitle')}</label>
                    <div className="grid grid-cols-6 gap-3">
                      {[1, 2, 3, 4, 5, 6].map((num) => {
                        const colors = [
                          'bg-[#FDF2F0]', 'bg-[#F9E5D9]', 'bg-[#F2D7B4]', 
                          'bg-[#D8B48F]', 'bg-[#A67C52]', 'bg-[#4B3621]'
                        ];
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setEditProfileData(prev => ({ ...prev, fitzpatrickType: num }))}
                            className={`group relative h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              editProfileData.fitzpatrickType === num
                                ? 'ring-2 ring-[#0EA5E9] ring-offset-4 scale-110 z-10'
                                : 'hover:scale-105 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <div className={`w-full h-full rounded-xl ${colors[num-1]} shadow-sm`} />
                            {editProfileData.fitzpatrickType === num && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0EA5E9] rounded-full flex items-center justify-center shadow-lg decoration-none">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${num > 4 ? 'text-white' : 'text-gray-800'} mix-blend-overlay`}>
                              {num}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Skin Type Edit */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">{t('onboarding.skinTitle')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(t('onboarding.skinTypesLabels') as any).map(([key, label]: any) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEditProfileData(prev => ({ ...prev, skinType: key }))}
                          className={`p-3 rounded-2xl border-2 text-left transition-all duration-300 ${
                            editProfileData.skinType === key
                              ? 'border-[#0EA5E9] bg-[#0EA5E9]/5 shadow-lg shadow-[#0EA5E9]/10'
                              : 'border-white bg-white/50 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-black ${editProfileData.skinType === key ? 'text-[#0EA5E9]' : 'text-gray-700'}`}>
                              {label}
                            </span>
                            {editProfileData.skinType === key && <Check className="w-4 h-4 text-[#0EA5E9]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Concerns Picker */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">
                      {t('onboarding.concernTitle')} <span className="text-[#0EA5E9]">({editProfileData.concerns.length})</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                      {['acne', 'wrinkles', 'dark-spots', 'dryness', 'sensitivity', 'redness', 'large-pores', 'dark-circles', 'uneven-texture', 'dullness', 'hyperpigmentation', 'oiliness'].map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleConcern(id)}
                          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${
                            editProfileData.concerns.includes(id)
                              ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20 scale-105'
                              : 'bg-white/50 border-white text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {(t('onboarding.concernsLabels') as any)[id] || id}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* Sensitivities */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">
                      {t('onboarding.sensTitle')} <span className="text-[#EF4444]">({editProfileData.sensitivities.length})</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                       {['fragrance', 'alcohol', 'retinol', 'aha-bha', 'sulfates', 'parabens'].map(id => (
                         <button
                           key={id}
                           type="button"
                           onClick={() => toggleSensitivity(id)}
                           className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${
                             editProfileData.sensitivities.includes(id)
                               ? 'bg-[#EF4444] border-[#EF4444] text-white shadow-lg shadow-[#EF4444]/20 scale-105'
                               : 'bg-white/50 border-white text-gray-500 hover:border-gray-200'
                           }`}
                         >
                           {(t('onboarding.sensitivitiesLabels') as any)[id] || id}
                         </button>
                       ))}
                    </div>
                  </motion.div>


                  {/* Action Buttons at bottom when editing */}
                  <div className="flex items-center gap-3 pt-4 sticky bottom-0 bg-white/10 backdrop-blur-md -mx-6 px-6 py-4 border-t border-white/40">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="ghost"
                      className="flex-1 rounded-2xl h-12 font-bold text-gray-500 hover:bg-gray-100 transition-all"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-[1.5] rounded-2xl h-12 bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 hover:-translate-y-1 active:scale-95 transition-all font-black"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </motion.div>
      {/* ═══════════════════════════════════════════════════════
          HIDDEN REPORT TEMPLATE (FOR PDF CAPTURE)
          Uses standard CSS only to avoid oklch/html2canvas errors
          ═══════════════════════════════════════════════════════ */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={reportRef} style={{ width: '800px', padding: '40px', backgroundColor: '#white', color: '#111827', fontFamily: 'sans-serif' }}>
          {/* PDF Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0EA5E9', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0, color: '#0EA5E9', fontWeight: 'bold' }}>DeepSkyn</h1>
              <p style={{ fontSize: '14px', margin: '5px 0 0', color: '#6B7280' }}>Rapport de Santé Cutanée Intelligent</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', margin: 0, color: '#9CA3AF' }}>DOCUMENT CONFIDENTIEL</p>
              <p style={{ fontSize: '12px', margin: 0, fontWeight: 'bold' }}>{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* User Info Section */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '20px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
              {user?.avatar && <img src={user.avatar} style={{ width: '100%', height: '100%', objectCover: 'cover' }} />}
            </div>
            <div>
              <h2 style={{ fontSize: '22px', margin: '0 0 10px', fontWeight: 'bold' }}>{user?.name || 'Utilisateur'}</h2>
              <p style={{ fontSize: '14px', margin: '2px 0', color: '#4B5563' }}><strong>Email:</strong> {user?.email}</p>
              <p style={{ fontSize: '14px', margin: '2px 0', color: '#4B5563' }}><strong>Âge:</strong> {formData.age} ans</p>
              <p style={{ fontSize: '14px', margin: '2px 0', color: '#4B5563' }}><strong>Genre:</strong> {formData.gender}</p>
            </div>
          </div>

          {/* Skin Profile Summary */}
          <div style={{ backgroundColor: '#F9FAFB', borderRadius: '20px', padding: '25px', marginBottom: '30px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '18px', margin: '0 0 20px', color: '#0EA5E9', fontWeight: 'bold' }}>Synthèse du Profil de Peau</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>Type Fitzpatrick</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{(t('onboarding.fitzTypesLabels') as any)[skinProfile?.fitzpatrickType?.toString() || ''] || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>Type de Peau</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{(t('onboarding.skinTypesLabels') as any)[skinProfile?.skinType || ''] || 'N/A'}</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>Préoccupations Majoritaires</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                  {skinProfile?.concerns?.map(c => (
                    <span key={c} style={{ fontSize: '12px', backgroundColor: '#white', border: '1px solid #E5E7EB', padding: '4px 10px', borderRadius: '10px' }}>{c}</span>
                  )) || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
             <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 10px' }}>Score de Santé Global</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0EA5E9', margin: 0 }}>8.5 <span style={{ fontSize: '14px', color: '#9CA3AF' }}>/ 10</span></p>
             </div>
             <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 10px' }}>Nombre d'Analyses</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#8B5CF6', margin: 0 }}>{analysisCount}</p>
             </div>
          </div>

          {/* Footer Branding */}
          <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: '10px', color: '#9CA3AF' }}>DeepSkyn AI Platform - Votre coach de peau personnel par intelligence artificielle.</p>
            <p style={{ fontSize: '10px', color: '#D1D5DB' }}>© 2026 DeepSkyn. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
