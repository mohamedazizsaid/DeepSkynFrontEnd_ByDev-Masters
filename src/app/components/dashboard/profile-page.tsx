import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, Mail, Calendar, User as UserIcon, Edit2, Save, Loader2 } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.dateOfBirth ? (new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()).toString() : '',
    gender: user?.gender || '',
    avatar: user?.avatar || ''
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
      // 1. Update basic user profile (name, gender, dateOfBirth, avatar)
      const year = formData.age ? new Date().getFullYear() - parseInt(formData.age) : null;
      const dateOfBirth = year ? `${year}-01-01` : undefined;

      await authService.updateProfile({
        name: formData.name,
        avatar: formData.avatar,
        gender: formData.gender,
        dateOfBirth: dateOfBirth
      });

      // 2. Update skin profile if needed
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

  const stats = [
    { label: 'Analyses Completed', value: analysisCount.toString() || '0' },
    { label: 'Skin Type', value: skinProfile?.skinType || 'N/A' },
    { label: 'Skin Health Score', value: skinProfile?.healthScore ? `${skinProfile.healthScore}/100` : 'N/A' },
    { label: 'Skin Age', value: skinProfile?.skinAge ? `${skinProfile.skinAge} years` : 'N/A' }
  ];

  const skinProfileData = [
    { label: 'Fitzpatrick Type', value: skinProfile?.fitzpatrickType || 'N/A' },
    { label: 'Main Concerns', value: skinProfile?.concerns?.join(', ') || 'N/A' },
    { label: 'Skin Health Score', value: skinProfile?.healthScore ? `${skinProfile.healthScore}/100` : 'N/A' },
    { label: 'Skin Age', value: skinProfile?.skinAge ? `${skinProfile.skinAge} years` : 'N/A' },
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center border-4 border-white shadow-lg">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-white" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[#E5E7EB] hover:border-[#0EA5E9] transition-colors cursor-pointer">
                    <Camera className="w-5 h-5 text-[#6B7280]" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-1">{formData.name}</h2>
              <p className="text-[#6B7280] mb-4">{formData.email}</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-full text-sm font-medium">
                <span>Premium Member</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-3">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">{stat.label}</span>
                  <span className="text-sm font-bold text-[#0EA5E9]">{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-6">
            <h3 className="font-bold mb-4">Skin Profile Summary</h3>
            <div className="space-y-3">
              {skinProfileData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">{item.label}:</span>
                  <span className="font-medium text-[#374151]">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Personal Information</h3>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                icon={<UserIcon className="w-5 h-5" />}
                disabled={!isEditing}
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-5 h-5" />}
                disabled={!isEditing}
              />

              <Input
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                icon={<Calendar className="w-5 h-5" />}
                disabled={!isEditing}
              />

              <div>
                <label className="block mb-2 text-sm text-[#374151]">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl 
                    text-[#111827] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20
                    transition-all duration-200 ${!isEditing ? 'opacity-60' : ''}`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Activity History */}
          <Card>
            <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { action: 'Completed skin analysis', date: '2 hours ago', type: 'analysis' },
                { action: 'Updated morning routine', date: 'Yesterday', type: 'routine' },
                { action: 'Chatted with AI coach', date: '2 days ago', type: 'chat' },
                { action: 'Uploaded new photos', date: '3 days ago', type: 'upload' },
                { action: 'Achieved 14-day streak', date: '1 week ago', type: 'achievement' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-xl"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'analysis' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' :
                    activity.type === 'routine' ? 'bg-[#F9A8D4]/10 text-[#F9A8D4]' :
                      activity.type === 'chat' ? 'bg-[#FBBF24]/10 text-[#FBBF24]' :
                        activity.type === 'achievement' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          'bg-[#6B7280]/10 text-[#6B7280]'
                    }`}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#374151]">{activity.action}</p>
                    <p className="text-sm text-[#6B7280]">{activity.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
