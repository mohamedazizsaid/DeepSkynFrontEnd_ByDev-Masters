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
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { useAuthStore } from '../../../stores/auth.store';
import { authService } from '../../../lib/services/auth.service';
import { skinProfileService } from '../../../lib/services/skin-profile.service';
import { analysisService } from '../../../lib/services/analysis.service';
import type { SkinProfile } from '../../../lib/types';
import toast from 'react-hot-toast';
import { chatService } from '../../../lib/services/chat.service';

interface ProfilePageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function ProfilePage({ onBack, onNavigate }: ProfilePageProps) {
  const { user, loadUser } = useAuthStore();
  const { t } = useAccessibilityStore();
  const [isEditing, setIsEditing] = useState(false);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);
  const [editProfileData, setEditProfileData] = useState({
    skinType: '' as any,
    fitzpatrickType: 0,
    concerns: [] as string[],
    sensitivities: [] as string[],
  });

  const [aiCoachMsg, setAiCoachMsg] = useState('');
  const [dailyTipMsg, setDailyTipMsg] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

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
            age: profile.value?.skinAge ? String(profile.value.skinAge) : prev.age,
          }));
          setEditProfileData({
            skinType: profile.value?.skinType || '',
            fitzpatrickType: profile.value?.fitzpatrickType || 0,
            concerns: profile.value?.concerns || [],
            sensitivities: profile.value?.sensitivities || [],
          });
        }
        if (stats.status === 'fulfilled') {
          setAnalysisCount(stats.value.totalAnalyses  );
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    const fetchAi = async () => {
      if (!skinProfile) return;
      setIsGeneratingAi(true);
      try {
        const [tipRes, coachRes] = await Promise.all([
          chatService.sendMessage({ message: `Génère un conseil très court (1 seule phrase) pour prendre soin d'une peau de type ${skinProfile.skinType || 'mixte'}.` }),
          chatService.sendMessage({ message: `Un court message d'encouragement affectueux (1 phrase courte) d'un coach IA pour maintenir une belle peau.` })
        ]);
        if (tipRes.assistantResponse) setDailyTipMsg(tipRes.assistantResponse);
        if (coachRes.assistantResponse) setAiCoachMsg(coachRes.assistantResponse);
      } catch (e) {
        console.error('Error fetching AI tips:', e);
      } finally {
        setIsGeneratingAi(false);
      }
    };
    if (skinProfile && !aiCoachMsg) {
      fetchAi();
    }
  }, [skinProfile]);

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
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(14, 165, 233);
      pdf.text(t('profile.reportTitle'), pdfWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(t('profile.reportGeneratedAt', { 
        date: new Date().toLocaleDateString(t('common.loading') === '...جاري التحميل' ? 'ar-SA' : 'fr-FR'), 
        user: user?.name || t('nav.profile') 
      }), pdfWidth / 2, 22, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, 30, finalWidth, finalHeight);
      
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

  const toggleConcern = (concern: string) => {
    setEditProfileData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern]
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-12 h-12 text-[#0EA5E9] animate-spin" />
      </div>
    );
  }

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
            className="w-full sm:w-auto rounded-2xl px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] text-white shadow-xl shadow-[#0EA5E9]/20 hover:shadow-2xl hover:shadow-[#0EA5E9]/30 hover:-translate-y-1 active:scale-95 transition-all duration-500 gap-3 font-bold border-none"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-6 h-6 text-white" />}
            <span className="whitespace-nowrap drop-shadow-md text-white">{t('profile.downloadReport')}</span>
          </Button>
        </div>
      </motion.div>

      <div className="space-y-6 lg:gap-8">
        {/* UPPER DASHBOARD: PROFILE, INFO, STATS, ACTIVITY */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch"
        >
          {/* ROW 1: LEFT - PROFILE */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-none shadow-2xl bg-white/70 backdrop-blur-xl ring-1 ring-black/5 h-full flex flex-col">
              <div className="h-40 sm:h-48 relative overflow-hidden group shrink-0">
                {user?.coverPhoto ? (
                  <img src={user.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6]" />
                )}
              </div>
              
              <div className="relative pt-20 pb-8 px-6 text-center flex-grow flex flex-col items-center justify-center">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden z-30 ring-1 ring-black/5 bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] flex items-center justify-center">
                   {user?.avatar ? (
                     <img 
                        src={user.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                     />
                   ) : (
                     <span className="text-4xl font-bold text-white uppercase leading-none">{user?.name?.charAt(0) || 'U'}</span>
                   )}
                </div>
                
                <h2 className="text-2xl font-bold text-[#111827] mb-2">{user?.name}</h2>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                  <span className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100/80 rounded-full border border-gray-100 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    {t('profile.memberSince', { date: memberSince })}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* ROW 1: RIGHT - PERSONAL INFO */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl p-8 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center shadow-inner">
                  <UserIcon className="w-6 h-6 text-[#0EA5E9]" />
                </div>
                <h3 className="text-xl font-bold text-[#111827]">{t('settings.personalInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest opacity-80">
                    <UserIcon className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    {t('common.name') || 'Nom'}
                  </label>
                  <p className="p-4 bg-white/60 rounded-2xl border border-gray-100/50 text-gray-800 font-bold shadow-sm text-sm truncate">{user?.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest opacity-80">
                    <Mail className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    Email
                  </label>
                  <p className="p-4 bg-white/60 rounded-2xl border border-gray-100/50 text-gray-800 font-bold shadow-sm text-sm truncate">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest opacity-80">
                    <Calendar className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    {t('profile.age') || 'Âge'}
                  </label>
                  <p className="p-4 bg-white/60 rounded-2xl border border-gray-100/50 text-gray-800 font-bold shadow-sm text-sm">{formData.age || 'N/A'} {t('common.years')}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest opacity-80">
                    <Activity className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    {t('onboarding.gender') || 'Genre'}
                  </label>
                  <p className="p-4 bg-white/60 rounded-2xl border border-gray-100/50 text-gray-800 font-bold shadow-sm text-sm">{formData.gender || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* ROW 2: LEFT - STATS GRID */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-4 h-full">
              {[
                { label: t('dashboard.analyses'), value: String(analysisCount || 0), icon: Scan, textColor: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10' },
                { label: t('onboarding.skinTitle'), value: (t('onboarding.skinTypesLabels') as any)[skinProfile?.skinType || ''] || 'N/A', icon: Droplets, textColor: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
                { label: t('dashboard.skinHealth'), value: (skinProfile?.healthScore || 85) + '/100', icon: Heart, textColor: 'text-[#EC4899]', bg: 'bg-[#EC4899]/10' },
                { label: t('dashboard.skinAge'), value: skinProfile?.skinAge ? `${skinProfile.skinAge} ${t('common.years')}` : 'N/A', icon: Activity, textColor: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-xl p-5 rounded-[2rem] border border-white/40 shadow-xl text-center flex flex-col items-center justify-center hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/20`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mb-1.5 leading-tight uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.textColor} drop-shadow-sm`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 2: RIGHT - RECENT ACTIVITY */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl p-8 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 flex items-center justify-center shadow-inner">
                  <Activity className="w-6 h-6 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold text-[#111827]">Activité récente</h3>
              </div>
              
              <div className="space-y-3.5 flex-grow">
                {[
                  { action: 'Analyse effectuée', date: 'Il y a 2h', icon: Scan, color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10' },
                  { action: 'Routine matinale', date: 'Hier', icon: Calendar, color: 'text-[#F9A8D4]', bg: 'bg-[#F9A8D4]/10' },
                  { action: 'Coach IA', date: 'Il y a 2 jours', icon: MessageCircle, color: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/10' },
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-gray-100/30 hover:bg-white transition-all group shadow-sm hover:shadow-md cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className={`w-11 h-11 rounded-xl ${act.bg} flex items-center justify-center shadow-inner`}>
                        <act.icon className={`w-5 h-5 ${act.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 leading-tight">{act.action}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{act.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 group-hover:text-gray-600 transition-all" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* AI & TIPS ALIGNED ROW */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
        >
          <div className="h-full">
            <Card className="bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] border-none shadow-2xl p-10 text-white text-left relative overflow-hidden group h-full flex flex-col min-h-[300px]">
               <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10 h-full flex flex-col">
                 <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20">
                     <MessageCircle className="w-7 h-7" />
                   </div>
                   {t('dashboard.aiCoach') || 'Coach IA'}
                 </h3>
                 <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 mb-10 leading-relaxed border border-white/10 flex-grow shadow-inner">
                    <p className="text-lg font-medium italic drop-shadow-sm opacity-95">
                      {isGeneratingAi ? <span className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin"/> {t('common.loading') || 'Génération...'}</span> : `"${aiCoachMsg || "Votre peau semble bien hydratée aujourd'hui. Maintenez votre routine actuelle pour préserver cet éclat !"}"`}
                    </p>
                 </div>
                 <Button onClick={() => onNavigate && onNavigate('chat')} className="w-full !bg-white !text-[#0EA5E9] font-black rounded-2xl h-16 border-none shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-wide uppercase">
                   {t('chat.startConversation') || 'Discuter avec le coach'}
                 </Button>
               </div>
            </Card>
          </div>

          <div className="h-full">
            <Card className="bg-gradient-to-br from-[#8B5CF6] to-[#D8B4FE] border-none shadow-2xl p-10 text-white relative overflow-hidden group h-full flex flex-col min-h-[300px]">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Conseil du Jour</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 mb-10 border border-white/10 flex-grow shadow-inner">
                  <p className="text-lg font-medium opacity-95 leading-relaxed italic drop-shadow-sm">
                    {isGeneratingAi ? <span className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin"/> {t('common.loading') || 'Génération...'}</span> : `"${dailyTipMsg || "L'application de votre sérum sur une peau légèrement humide peut augmenter l'absorption des actifs jusqu'à 30%."}"`}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-5 py-2 rounded-full backdrop-blur-xl border border-white/10 shadow-sm w-fit">Astuce Pro</span>
                     <span className="text-[11px] font-bold text-white/70 ml-2">{t('dashboard.personalizedAdvice')}</span>
                   </div>
                   <button onClick={() => onNavigate && onNavigate('routine')} className="w-16 h-16 rounded-[1.5rem] border-2 border-white/30 flex items-center justify-center hover:bg-white hover:text-[#8B5CF6] transition-all duration-300 cursor-pointer shadow-2xl active:scale-90 bg-white/5 backdrop-blur-md">
                     <ChevronRight className="w-8 h-8" />
                   </button>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* FULL WIDTH SKIN PROFILE */}
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="lg:col-span-3 pb-10"
        >
          <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl overflow-hidden min-h-[400px]">
            <div className="flex items-center justify-between p-8 border-b border-white/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] flex items-center justify-center shadow-lg">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#111827]">{t('onboarding.sumTitle')}</h3>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-tighter">{t('profile.skinIdentity')}</p>
                  </div>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="ghost" className="text-[#0EA5E9] font-black hover:bg-[#0EA5E9]/5 px-6 rounded-2xl h-12 shadow-sm border border-transparent hover:border-[#0EA5E9]/20 transition-all">
                    <Edit2 className="w-4 h-4 mr-2" /> {t('common.edit')}
                  </Button>
                )}
            </div>

            <div className="p-8">
              {!isEditing ? (
                <div className="flex flex-col gap-8">
                  {/* Top Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: t('onboarding.skinTitle'), value: (t('onboarding.skinTypesLabels') as any)[skinProfile?.skinType || ''] || t('onboarding.notProvided'), color: 'text-[#111827]' },
                      { label: t('onboarding.fitzTitle'), value: `Type ${skinProfile?.fitzpatrickType || 'N/A'}`, color: 'text-[#111827]' },
                      { label: t('dashboard.skinHealth'), value: `${skinProfile?.healthScore || 85}/100`, color: 'text-[#10B981]' },
                      { label: t('profile.memberSince', { date: '' }).split(' ')[0], value: memberSince, color: 'text-[#8B5CF6]' }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-gradient-to-br from-white/80 to-gray-50/50 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
                        <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest opacity-80 group-hover:text-[#0EA5E9] transition-colors">{item.label}</p>
                        <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                    {/* Hero Skin Visual */}
                    <div className="lg:col-span-1 p-10 rounded-[3.5rem] bg-gradient-to-b from-[#0EA5E9] to-[#8B5CF6] text-white flex flex-col items-center justify-center gap-8 text-center shadow-2xl relative overflow-hidden group h-full min-h-[350px]">
                       <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay" />
                       <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000" />
                       
                       <div className="relative z-10 flex flex-col items-center">
                         {(() => {
                            const skinType = skinProfile?.skinType || 'normal';
                            const label = (t('onboarding.skinTypesLabels') as any)[skinType] || skinType;
                            return (
                              <>
                                <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] backdrop-blur-2xl flex items-center justify-center mb-8 shadow-2xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-700 mx-auto border border-white/30 rotate-3">
                                  <Sparkles className="w-14 h-14 text-white" />
                                </div>
                                <h4 className="text-4xl font-black tracking-tighter mb-5 drop-shadow-xl">{label}</h4>
                                <div className="px-8 py-3 bg-white/20 backdrop-blur-md rounded-full inline-flex items-center gap-3 border border-white/20 shadow-lg group-hover:bg-white/30 transition-colors">
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,1)]" />
                                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{t('profile.skinIdentity')}</span>
                                </div>
                              </>
                            );
                         })()}
                       </div>
                    </div>

                    {/* Detailed Analysis Columns */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 h-full">
                      {/* Concerns Column */}
                      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3.5rem] border border-gray-100 shadow-xl flex flex-col h-full hover:shadow-2xl transition-all group">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-14 h-14 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center border border-[#0EA5E9]/20 shadow-inner group-hover:scale-110 transition-transform">
                            <Layers className="w-7 h-7 text-[#0EA5E9]" />
                          </div>
                          <h4 className="text-xl font-black text-[#111827]">{t('onboarding.concernTitle')}</h4>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 flex-grow content-start">
                          {skinProfile?.concerns?.length ? skinProfile.concerns.map(c => {
                            const label = (t('onboarding.concernsLabels') as any)[c] || c;
                            return (
                              <span key={c} className="inline-flex items-center px-5 py-3 rounded-2xl bg-[#0EA5E9]/5 border border-[#0EA5E9]/10 text-xs font-bold text-[#0EA5E9] shadow-sm hover:bg-[#0EA5E9] hover:text-white hover:border-transparent transition-all cursor-default">
                                {label}
                              </span>
                            );
                          }) : (
                            <div className="w-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30 gap-4">
                              <Sparkles className="w-8 h-8 text-gray-200" />
                              <p className="text-sm text-gray-400 font-bold italic">{t('onboarding.none')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sensitivities Column */}
                      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3.5rem] border border-gray-100 shadow-xl flex flex-col h-full hover:shadow-2xl transition-all group">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center border border-[#EF4444]/20 shadow-inner group-hover:scale-110 transition-transform">
                            <Shield className="w-7 h-7 text-[#EF4444]" />
                          </div>
                          <h4 className="text-xl font-black text-[#111827]">{t('onboarding.sensTitle')}</h4>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 flex-grow content-start">
                           {skinProfile?.sensitivities?.length ? skinProfile.sensitivities.map(s => {
                            const label = (t('onboarding.sensitivitiesLabels') as any)[s] || s;
                            return (
                              <span key={s} className="inline-flex items-center px-5 py-3 rounded-2xl bg-[#EF4444]/5 border border-[#EF4444]/10 text-xs font-bold text-[#EF4444] shadow-sm hover:bg-[#EF4444] hover:text-white hover:border-transparent transition-all cursor-default">
                                {label}
                              </span>
                            );
                          }) : (
                            <div className="w-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30 gap-4">
                              <Shield className="w-8 h-8 text-gray-200" />
                              <p className="text-sm text-gray-400 font-bold italic">{t('onboarding.none')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 max-w-4xl mx-auto py-6">
                  {/* Fitzpatrick Selector */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-8">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('onboarding.fitzTitle')}</label>
                       <span className="text-sm font-black text-[#0EA5E9] bg-[#0EA5E9]/10 px-4 py-2 rounded-full">Type {editProfileData.fitzpatrickType}</span>
                    </div>
                    <div className="grid grid-cols-6 gap-4">
                       {[1, 2, 3, 4, 5, 6].map((num) => {
                         const colors = ['#FDF2F0', '#F9E5D9', '#F2D7B4', '#D8B48F', '#A67C52', '#4B3621'];
                         const isSelected = editProfileData.fitzpatrickType === num;
                         return (
                           <button
                             key={num}
                             onClick={() => setEditProfileData(p => ({ ...p, fitzpatrickType: num }))}
                             className={`h-24 rounded-[2rem] border-4 transition-all duration-500 relative group overflow-hidden ${isSelected ? 'border-[#0EA5E9] scale-105 shadow-2xl' : 'border-transparent hover:scale-105 hover:border-gray-200'}`}
                             style={{ backgroundColor: colors[num-1] }}
                           >
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0EA5E9] shadow-lg">
                                    <Check className="w-6 h-6" />
                                  </div>
                                </div>
                              )}
                           </button>
                         );
                       })}
                    </div>
                  </motion.div>

                  {/* Skin Type Selector */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10 block">{t('onboarding.skinTitle')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
                       {Object.entries(t('onboarding.skinTypesLabels') as any).map(([id, label]: any) => {
                         const isSelected = editProfileData.skinType === id;
                         return (
                           <button
                             key={id}
                             onClick={() => setEditProfileData(p => ({ ...p, skinType: id }))}
                             className={`p-6 rounded-[2rem] font-black text-xs transition-all border-2 flex flex-col items-center gap-3 ${isSelected ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white shadow-2xl scale-105' : 'bg-white/50 border-gray-100 text-gray-500 hover:border-[#0EA5E9]/50 hover:bg-white'}`}
                           >
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <Droplets className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                             </div>
                             {label}
                           </button>
                         );
                       })}
                    </div>
                  </motion.div>

                  {/* Concerns Selector */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10 block">{t('onboarding.concernTitle')}</label>
                    <div className="flex flex-wrap gap-4">
                       {Object.entries(t('onboarding.concernsLabels') as any).map(([id, label]: any) => {
                         const isSelected = editProfileData.concerns.includes(id);
                         return (
                           <button
                             key={id}
                             onClick={() => toggleConcern(id)}
                             className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all border-2 ${isSelected ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white shadow-xl scale-105' : 'bg-white/50 border-gray-100 text-gray-600 hover:border-[#0EA5E9]/30 hover:bg-white'}`}
                           >
                             {label}
                           </button>
                         );
                       })}
                    </div>
                  </motion.div>

                  {/* Sensitivities Selector */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10 block">{t('onboarding.sensTitle')}</label>
                    <div className="flex flex-wrap gap-4">
                       {Object.entries(t('onboarding.sensitivitiesLabels') as any).map(([id, label]: any) => {
                         const isSelected = editProfileData.sensitivities.includes(id);
                         return (
                           <button
                             key={id}
                             onClick={() => toggleSensitivity(id)}
                             className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all border-2 ${isSelected ? 'bg-[#EF4444] border-[#EF4444] text-white shadow-xl scale-105' : 'bg-white/50 border-gray-100 text-gray-600 hover:border-[#EF4444]/30 hover:bg-white'}`}
                           >
                             {label}
                           </button>
                         );
                       })}
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <div className="flex gap-6 pt-12 border-t border-gray-100">
                    <Button onClick={() => setIsEditing(false)} variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-black text-gray-500 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="flex-[2] h-16 rounded-[1.5rem] bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white font-black shadow-2xl shadow-[#0EA5E9]/30 hover:shadow-3xl hover:-translate-y-1 transition-all active:scale-95 text-lg">
                      {isSaving ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Save className="w-6 h-6 mr-4" />}
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

      {/* ═══════════════════════════════════════════════════════
          HIDDEN REPORT TEMPLATE (FOR PDF CAPTURE)
          Uses standard CSS only for html2canvas compatibility
          ═══════════════════════════════════════════════════════ */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={reportRef} style={{ width: '800px', padding: '40px', backgroundColor: '#ffffff', color: '#111827', fontFamily: 'sans-serif' }}>
          {/* PDF Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0EA5E9', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0, color: '#0EA5E9', fontWeight: 'bold' }}>DeepSkyn</h1>
              <p style={{ fontSize: '14px', margin: '5px 0 0', color: '#6B7280' }}>{t('profile.reportSubtitle') || 'Rapport de Santé Cutanée Intelligent'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', margin: 0, color: '#9CA3AF' }}>{t('profile.reportConfidential') || 'DOCUMENT CONFIDENTIEL'}</p>
              <p style={{ fontSize: '12px', margin: 0, fontWeight: 'bold' }}>{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* User Info Section */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '20px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
              {user?.avatar && <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div>
              <h2 style={{ fontSize: '22px', margin: '0 0 10px', fontWeight: 'bold' }}>{user?.name || 'Utilisateur'}</h2>
              <p style={{ fontSize: '14px', margin: '2px 0', color: '#4B5563' }}><strong>Email:</strong> {user?.email}</p>
              <p style={{ fontSize: '14px', margin: '2px 0', color: '#4B5563' }}><strong>Âge:</strong> {formData.age} {t('common.years')}</p>
              <p style={{ fontSize: '14px', margin: '2px 0', color: '#4B5563' }}><strong>Genre:</strong> {formData.gender}</p>
            </div>
          </div>

          {/* Skin Profile Summary */}
          <div style={{ backgroundColor: '#F9FAFB', borderRadius: '20px', padding: '25px', marginBottom: '30px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '18px', margin: '0 0 20px', color: '#0EA5E9', fontWeight: 'bold' }}>{t('onboarding.sumTitle') || 'Synthèse du Profil de Peau'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>{t('onboarding.fitzTitle') || 'Type Fitzpatrick'}</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{(t('onboarding.fitzTypesLabels') as any)[String(skinProfile?.fitzpatrickType || '')] || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>{t('onboarding.skinTitle') || 'Type de Peau'}</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{(t('onboarding.skinTypesLabels') as any)[skinProfile?.skinType || ''] || 'N/A'}</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>{t('onboarding.concTitle') || 'Préoccupations'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                  {skinProfile?.concerns?.map(id => (
                    <span key={id} style={{ fontSize: '12px', backgroundColor: '#ffffff', border: '1px solid #E5E7EB', padding: '4px 10px', borderRadius: '10px' }}>
                      {(t('onboarding.concernsLabels') as any)[id] || id}
                    </span>
                  )) || 'N/A'}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>{t('onboarding.sensTitle') || 'Sensibilités'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                  {skinProfile?.sensitivities?.map(id => (
                    <span key={id} style={{ fontSize: '12px', backgroundColor: '#ffffff', border: '1px solid #E5E7EB', padding: '4px 10px', borderRadius: '10px', color: '#EF4444' }}>
                      {(t('onboarding.sensitivitiesLabels') as any)[id] || id}
                    </span>
                  )) || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
             <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 10px' }}>{t('dashboard.globalScore') || 'Score de Santé Global'}</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0EA5E9', margin: 0 }}>85 <span style={{ fontSize: '14px', color: '#9CA3AF' }}>/ 100</span></p>
             </div>
             <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 10px' }}>{t('dashboard.analyses') || 'Nombre d\'Analyses'}</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#8B5CF6', margin: 0 }}>{analysisCount}</p>
             </div>
          </div>

          {/* Footer Branding */}
          <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: '10px', color: '#9CA3AF' }}>DeepSkyn AI Platform - {t('dashboard.aiCoach')}</p>
            <p style={{ fontSize: '10px', color: '#D1D5DB' }}>© 2026 DeepSkyn. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
