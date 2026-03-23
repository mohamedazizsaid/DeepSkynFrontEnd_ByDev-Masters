import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Mail, User, Calendar, Share2, ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../lib/services/auth.service';
import { addressService, AddressData } from '../../lib/services/address.service';
import { AddressMapPicker } from '../../components/location/address-map-picker';
import { Button } from '../components/button';
import { Input } from '../components/input';
import toast from 'react-hot-toast';

interface PersonalInfoSettingsProps {
  onBack: () => void;
}

export function PersonalInfoSettings({ onBack }: PersonalInfoSettingsProps) {
  const { user, loadUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
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

  // Load address on component mount
  useEffect(() => {
    loadUserAddress();
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const dateOfBirth = formData.dateOfBirth ? `${formData.dateOfBirth}T00:00:00Z` : undefined;
      await authService.updateProfile({
        name: formData.name,
        gender: formData.gender,
        dateOfBirth,
      });
      await loadUser();
      setIsEditing(false);
      toast.success('Informations mises à jour');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la sauvegarde');
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
      toast.success('Adresse mise à jour avec succès');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour de l\'adresse');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre adresse ?')) {
      try {
        await addressService.deleteUserAddress();
        setSelectedAddress(null);
        toast.success('Adresse supprimée');
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Retour</span>
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
            <h2 className="text-lg font-bold text-[#111827]">Informations personnelles</h2>
            <p className="text-xs text-[#6B7280]">Gérez vos données</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              Modifier
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                Annuler
              </Button>
              <Button onClick={handleSaveProfile} loading={isSaving} size="sm">
                Enregistrer
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
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-[#0EA5E9]" />
          Détails personnels
        </h3>

        <div className="grid sm:grid-cols-2 gap-5">
          <Input
            label="Nom complet"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            icon={<User className="w-5 h-5" />}
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            disabled
            icon={<Mail className="w-5 h-5" />}
          />

          <Input
            label="Date de naissance"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            disabled={!isEditing}
            icon={<Calendar className="w-5 h-5" />}
          />

          <div className="w-full" ref={genderRef}>
            <label className="block mb-2 text-sm text-[#374151]">Genre</label>
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
                <span className={formData.gender ? 'text-[#111827]' : 'text-[#9CA3AF]'}>
                  {formData.gender
                    ? { Male: 'Homme', Female: 'Femme', 'Non-binary': 'Non-binaire', 'Prefer not to say': 'Préfère ne pas dire' }[formData.gender] || formData.gender
                    : 'Sélectionner'}
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
                    className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#E5E7EB] shadow-xl overflow-hidden"
                  >
                    {[
                      { value: 'Male', label: 'Homme' },
                      { value: 'Female', label: 'Femme' },
                      { value: 'Non-binary', label: 'Non-binaire' },
                      { value: 'Prefer not to say', label: 'Préfère ne pas dire' },
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
                            : 'hover:bg-[#F3F4F6] text-[#111827]'
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
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Votre localisation</h3>
                <p className="text-xs text-[#6B7280]">Adresse enregistrée</p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditingAddress(true)}
              size="sm"
              variant="outline"
            >
              Modifier
            </Button>
          </div>

          {selectedAddress ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <div className="sm:col-span-2 p-4 rounded-xl bg-[#F0FDF4] border border-[#10B981]/20">
                <p className="text-xs text-[#047857] uppercase tracking-wider font-semibold">Adresse</p>
                <p className="text-sm font-medium text-[#111827] mt-1 line-clamp-2">
                  {selectedAddress.address}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Ville</p>
                <p className="text-sm font-medium text-[#111827] mt-1">{selectedAddress.city}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Code postal</p>
                <p className="text-sm font-medium text-[#111827] mt-1">{selectedAddress.zipCode}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Pays</p>
                <p className="text-sm font-medium text-[#111827] mt-1">{selectedAddress.country}</p>
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
                  Supprimer l'adresse
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 p-4 rounded-xl bg-[#FEF3C7] border border-[#FCD34D]">
              <p className="text-sm text-[#92400E]">
                💡 Vous n'avez pas encore d'adresse enregistrée. Cliquez sur "Modifier" pour en ajouter une.
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
              Annuler
            </Button>
            {selectedAddress && !isSavingAddress && (
              <Button
                onClick={() => setIsEditingAddress(false)}
                className="flex-1"
              >
                ✓ Confirmé
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
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#0EA5E9]" />
          Confidentialité
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F9FAFB] cursor-pointer transition-colors">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-sm text-[#374151]">Afficher mon profil publiquement</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F9FAFB] cursor-pointer transition-colors">
            <input type="checkbox" className="w-4 h-4 rounded" />
            <span className="text-sm text-[#374151]">Recevoir les recommandations personnalisées</span>
          </label>
        </div>
      </motion.div>
    </div>
  );
}
