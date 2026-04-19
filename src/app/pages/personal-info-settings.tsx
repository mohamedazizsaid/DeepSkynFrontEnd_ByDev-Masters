import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Mail, User, Calendar, Share2, ArrowLeft, ChevronDown, Camera, Image as ImageIcon, ShieldCheck, ShieldX, RefreshCw, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../lib/services/auth.service';
import { addressService, AddressData } from '../../lib/services/address.service';
import { faceVerificationService, type FaceReferenceStatus } from '../../lib/services/face-verification.service';
import { useFaceVerification } from '../../lib/hooks/useFaceVerification';
import { AddressMapPicker } from '../../components/location/address-map-picker';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Checkbox } from '../components/ui/checkbox';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import toast from 'react-hot-toast';

interface PersonalInfoSettingsProps {
  onBack: () => void;
}

export function PersonalInfoSettings({ onBack }: PersonalInfoSettingsProps) {
  const { user, loadUser } = useAuthStore();
  const { t } = useAccessibilityStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);
  const profileImageRef = useRef<HTMLImageElement>(null);
  
  // Face verification state
  const [faceReferenceStatus, setFaceReferenceStatus] = useState<FaceReferenceStatus | null>(null);
  const [isLoadingFaceStatus, setIsLoadingFaceStatus] = useState(false);
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);
  
  // Face verification hook
  const { isModelLoaded, loadModels, extractDescriptorFromImage, registerFromProfilePhoto } = useFaceVerification();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    avatar: user?.avatar || '',
    coverPhoto: user?.coverPhoto || '',
    isPublic: user?.isPublic ?? false,
    receiveRecommendations: user?.receiveRecommendations ?? true,
  });
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);

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

  // Load address and face reference status on component mount
  useEffect(() => {
    loadUserAddress();
    loadFaceReferenceStatus();
    loadModels();
  }, []);

  const loadUserAddress = async () => {
    setIsLoadingAddress(true);
    try {
      const addressData = await addressService.getUserAddress();
      if (addressData.address && addressData.latitude && addressData.longitude) {
        setSelectedAddress({
          address: addressData.address || '',
          city: addressData.city || '',
          zipCode: addressData.zipCode || '',
          country: addressData.country || '',
          latitude: addressData.latitude || 0,
          longitude: addressData.longitude || 0,
        });
      }
    } catch (error) {
      console.error('Error loading address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Load face reference status
  const loadFaceReferenceStatus = async () => {
    setIsLoadingFaceStatus(true);
    try {
      const status = await faceVerificationService.getStatus();
      setFaceReferenceStatus(status);
    } catch (error) {
      console.error('Error loading face reference status:', error);
    } finally {
      setIsLoadingFaceStatus(false);
    }
  };

  // Register face from current profile photo
  const handleRegisterFace = async () => {
    if (!formData.avatar) {
      toast.error(t('settings.personal.faceNoProfilePhoto'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
      return;
    }

    setIsRegisteringFace(true);
    try {
      // Create an image element from the avatar URL
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Impossible de charger l\'image'));
        img.src = formData.avatar;
      });

      // Extract face descriptor
      const descriptor = await extractDescriptorFromImage(img);
      
      if (!descriptor) {
        toast.error(t('settings.personal.faceNotDetected'), {
          style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
        });
        return;
      }

      // Register the face reference
      await faceVerificationService.registerFromProfile({ descriptor });
      
      toast.success(t('settings.personal.faceRegisterSuccess'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
      });

      // Reload status
      await loadFaceReferenceStatus();
    } catch (error: any) {
      console.error('Error registering face:', error);
      toast.error(error?.response?.data?.message || t('settings.personal.faceRegisterError'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
    } finally {
      setIsRegisteringFace(false);
    }
  };

  // Reset face reference
  const handleResetFaceReference = async () => {
    try {
      await faceVerificationService.reset();
      toast.success(t('settings.personal.faceResetSuccess'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
      });
      await loadFaceReferenceStatus();
    } catch (error) {
      toast.error(t('settings.personal.faceResetError'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const dateOfBirth = formData.dateOfBirth ? `${formData.dateOfBirth}T00:00:00Z` : undefined;
      await authService.updateProfile({
        name: formData.name,
        gender: formData.gender,
        dateOfBirth,
        avatar: formData.avatar,
        coverPhoto: formData.coverPhoto,
        isPublic: formData.isPublic,
        receiveRecommendations: formData.receiveRecommendations,
      });
      await loadUser();
      setIsEditing(false);
      toast.success(t('settings.personal.updateSuccess'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('settings.personal.updateError'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressSelected = async (address: AddressData) => {
    setIsSavingAddress(true);
    try {
      await addressService.updateUserAddress(address);
      setSelectedAddress(address);
      setIsEditingAddress(false);
      await loadUser();
      toast.success(t('settings.personal.addressSyncSuccess'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('settings.personal.addressSyncError'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (window.confirm(t('common.delete') + '?')) {
      try {
        await addressService.deleteUserAddress();
        setSelectedAddress(null);
        toast.success(t('common.success'), {
          style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
        });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || t('settings.personal.updateError'), {
          style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
        });
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [type]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePrivacy = async (field: 'isPublic' | 'receiveRecommendations', value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    try {
      await authService.updateProfile({ [field]: value });
      await loadUser();
      toast.success(t('common.success'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
      });
    } catch (error: any) {
      setFormData(prev => ({ ...prev, [field]: !value }));
      toast.error(t('common.error'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-gray-100 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">{t('common.back')}</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-gray-100">{t('settings.personal.title')}</h2>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.personal.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              {t('common.edit')}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveProfile} loading={isSaving} size="sm">
                {t('common.save')}
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-[#0EA5E9]" />
          {t('settings.personal.details')}
        </h3>

        {/* Profile + Cover Editor */}
        <div className="mb-10 px-2 sm:px-4">
          <div className="relative">
            <div className="relative h-40 sm:h-52 bg-gray-100 rounded-3xl overflow-hidden group shadow-inner">
              {formData.coverPhoto ? (
                <img src={formData.coverPhoto} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#0EA5E9]/10 to-[#6366F1]/10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <ImageIcon className="w-10 h-10 text-[#0EA5E9]" />
                    <span className="text-xs font-medium uppercase tracking-widest text-[#0EA5E9]">DeepSkyn Background</span>
                  </div>
                </div>
              )}
              
              {isEditing && (
                <label className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold tracking-wide drop-shadow-md">{t('common.edit')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'coverPhoto')} />
                </label>
              )}
            </div>

            <div className="absolute left-6 sm:left-10 -bottom-10 z-20">
               <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white p-1.5 shadow-2xl overflow-hidden group/avatar ring-1 ring-black/5">
                 <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center text-white text-4xl sm:text-5xl font-bold overflow-hidden shadow-inner">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      formData.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                 </div>
                 {isEditing && (
                    <label className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-white">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 truncate">
                        <Camera className="w-5 h-5" />
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
                    </label>
                 )}
               </div>
            </div>
          </div>
          <div className="h-10" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Input
            label={t('settings.personal.fullName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            icon={<User className="w-5 h-5" />}
          />

          <Input
            label={t('settings.personal.email')}
            type="email"
            value={formData.email}
            disabled
            icon={<Mail className="w-5 h-5" />}
          />

          <Input
            label={t('settings.personal.dob')}
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            disabled={!isEditing}
            icon={<Calendar className="w-5 h-5" />}
          />

          <div className="w-full" ref={genderRef}>
            <label className="block mb-2 text-sm text-[#374151]">{t('settings.personal.gender')}</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => isEditing && setIsGenderOpen(!isGenderOpen)}
                disabled={!isEditing}
                className={`w-full flex items-center pl-10 pr-10 py-3 bg-[#F9FAFB] border-2 rounded-xl text-left transition-all duration-200 ${
                  isGenderOpen ? 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/20' : 'border-[#E5E7EB]'
                } ${
                  !isEditing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className={formData.gender ? 'text-[#111827] dark:text-gray-100' : 'text-[#9CA3AF] dark:text-gray-500'}>
                  {formData.gender
                    ? { Male: t('settings.personal.genderOptions.male'), Female: t('settings.personal.genderOptions.female'), 'Non-binary': t('settings.personal.genderOptions.nonBinary'), 'Prefer not to say': t('settings.personal.genderOptions.private') }[formData.gender] || formData.gender
                    : t('common.notSpecified')}
                </span>
              </button>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
                <User className="w-5 h-5" />
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]">
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGenderOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isGenderOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-700 shadow-xl overflow-hidden"
                  >
                    {[
                      { value: 'Male', label: t('settings.personal.genderOptions.male') },
                      { value: 'Female', label: t('settings.personal.genderOptions.female') },
                      { value: 'Non-binary', label: t('settings.personal.genderOptions.nonBinary') },
                      { value: 'Prefer not to say', label: t('settings.personal.genderOptions.private') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, gender: option.value });
                          setIsGenderOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                          formData.gender === option.value
                            ? 'bg-[#0EA5E9] text-white font-medium'
                            : 'hover:bg-[#F3F4F6] dark:hover:bg-slate-800 text-[#111827] dark:text-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Address Section */}
      {!isEditingAddress ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
            <MapPin className="w-5 h-5 text-white" />
          </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100">{t('settings.personal.location')}</h3>
                <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.personal.locationDesc')}</p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditingAddress(true)}
              size="sm"
              variant="outline"
            >
              {t('common.edit')}
            </Button>
          </div>

          {selectedAddress ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <div className="sm:col-span-2 p-4 rounded-xl bg-sky-50/50 border border-[#0EA5E9]/20">
                <p className="text-xs text-[#0EA5E9] uppercase tracking-wider font-semibold">{t('settings.personal.address')}</p>
                <p className="text-sm font-medium text-[#111827] dark:text-gray-100 mt-1 line-clamp-2">
                  {selectedAddress.address}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700">
                <p className="text-xs text-[#6B7280] dark:text-gray-400 uppercase tracking-wider font-semibold">{t('settings.personal.city')}</p>
                <p className="text-sm font-medium text-[#111827] dark:text-gray-100 mt-1">{selectedAddress.city}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700">
                <p className="text-xs text-[#6B7280] dark:text-gray-400 uppercase tracking-wider font-semibold">{t('settings.personal.zipCode')}</p>
                <p className="text-sm font-medium text-[#111827] dark:text-gray-100 mt-1">{selectedAddress.zipCode}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700">
                <p className="text-xs text-[#6B7280] dark:text-gray-400 uppercase tracking-wider font-semibold">{t('settings.personal.country')}</p>
                <p className="text-sm font-medium text-[#111827] dark:text-gray-100 mt-1">{selectedAddress.country}</p>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-[#F0F9FF] border border-[#0EA5E9]/20 text-center">
                <p className="text-xs text-[#0369A1] font-medium">
                  📍 {selectedAddress.latitude.toFixed(4)}, {selectedAddress.longitude.toFixed(4)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <button
                  onClick={handleDeleteAddress}
                  className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 p-4 rounded-xl bg-[#FEF3C7] border border-[#FCD34D]">
              <p className="text-sm text-[#92400E]">
                💡 {t('settings.personal.locationDesc')}
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <AddressMapPicker
            initialAddress={selectedAddress || undefined}
            onAddressSelect={handleAddressSelected}
            isLoading={isSavingAddress}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditingAddress(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            {selectedAddress && !isSavingAddress && (
              <Button
                onClick={() => setIsEditingAddress(false)}
                className="flex-1"
              >
                {t('common.success')}
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Privacy & Sharing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100 mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#0EA5E9]" />
          {t('settings.personal.privacy')}
        </h3>
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-[#0EA5E9]/30 transition-all group">
            <Checkbox 
              id="isPublic" 
              checked={formData.isPublic}
              onCheckedChange={(checked) => handleTogglePrivacy('isPublic', !!checked)}
              className="border-gray-300 data-[state=checked]:border-[#0EA5E9]"
            />
            <label htmlFor="isPublic" className="text-sm font-semibold text-gray-700 cursor-pointer flex-1 select-none">
              {t('settings.personal.isPublic')}
              <p className="text-[10px] text-gray-500 font-normal mt-0.5">{t('settings.personal.isPublicDesc')}</p>
            </label>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${formData.isPublic ? 'bg-sky-100 text-[#0EA5E9]' : 'bg-gray-200 text-gray-600'}`}>
              {formData.isPublic ? t('settings.security.enabled') : t('settings.security.disabled')}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-[#0EA5E9]/30 transition-all group">
            <Checkbox 
              id="receiveRecommendations" 
              checked={formData.receiveRecommendations}
              onCheckedChange={(checked) => handleTogglePrivacy('receiveRecommendations', !!checked)}
              className="border-gray-300 data-[state=checked]:border-[#0EA5E9]"
            />
            <label htmlFor="receiveRecommendations" className="text-sm font-semibold text-gray-700 cursor-pointer flex-1 select-none">
              {t('settings.personal.recommendations')}
              <p className="text-[10px] text-gray-500 font-normal mt-0.5">{t('settings.personal.recommendationsDesc')}</p>
            </label>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${formData.receiveRecommendations ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
              {formData.receiveRecommendations ? t('settings.security.enabled') : t('settings.security.disabled')}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Face Verification / Sécurité Biométrique */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0EA5E9]" />
          {t('settings.personal.faceVerificationTitle')}
        </h3>
        <p className="text-xs text-[#6B7280] dark:text-gray-400 mb-4">
          {t('settings.personal.faceVerificationSubtitle')}
        </p>

        {isLoadingFaceStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#0EA5E9] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status display */}
            <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.personal.faceVerificationStatus')}</span>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  faceReferenceStatus?.hasFaceReference 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {faceReferenceStatus?.hasFaceReference ? (
                    <>
                      <ShieldCheck className="w-3 h-3" />
                      {t('settings.personal.faceVerificationActive')}
                    </>
                  ) : (
                    <>
                      <ShieldX className="w-3 h-3" />
                      {t('settings.personal.faceVerificationInactive')}
                    </>
                  )}
                </div>
              </div>
              
              {faceReferenceStatus?.hasFaceReference ? (
                <div className="text-xs text-gray-500">
                  <p>{t('settings.personal.faceVerificationConfigured')}</p>
                  {faceReferenceStatus.faceReference?.updatedAt && (
                    <p className="mt-1 text-[10px] text-gray-400">
                      {t('settings.personal.faceVerificationUpdatedAt')}: {new Date(faceReferenceStatus.faceReference.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  {!formData.avatar ? (
                    <p>{t('settings.personal.faceVerificationNeedPhoto')}</p>
                  ) : (
                    <p>{t('settings.personal.faceVerificationPrompt')}</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {!faceReferenceStatus?.hasFaceReference && formData.avatar && (
                <Button
                  onClick={handleRegisterFace}
                  disabled={isRegisteringFace || !isModelLoaded}
                  size="sm"
                  className="bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6]"
                >
                  {isRegisteringFace ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('settings.personal.faceVerificationRegistering')}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {t('settings.personal.faceVerificationRegister')}
                    </>
                  )}
                </Button>
              )}
              
              {faceReferenceStatus?.hasFaceReference && (
                <>
                  <Button
                    onClick={handleRegisterFace}
                    disabled={isRegisteringFace || !isModelLoaded || !formData.avatar}
                    size="sm"
                    variant="outline"
                  >
                    {isRegisteringFace ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('settings.personal.faceVerificationUpdating')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('common.update')}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleResetFaceReference}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <ShieldX className="w-4 h-4 mr-2" />
                    {t('common.reset')}
                  </Button>
                </>
              )}
            </div>

            {/* Info box */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[11px] text-blue-700">
                <strong>{t('settings.personal.faceVerificationHowItWorksTitle')}:</strong> {t('settings.personal.faceVerificationHowItWorks')}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
