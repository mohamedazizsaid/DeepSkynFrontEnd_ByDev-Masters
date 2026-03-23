import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Mail, User, Calendar, Share2, Check, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../lib/services/auth.service';
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
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    phone: '',
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user?.email || '');
    setCopied(true);
    toast.success('Email copié');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
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
              <Button onClick={handleSave} loading={isSaving} size="sm">
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

          <Input
            label="Genre"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            disabled={!isEditing}
            icon={<User className="w-5 h-5" />}
          />
        </div>
      </motion.div>

      {/* Location Map Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
      >
        <div className="h-64 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center">
          <div className="text-center text-[#6B7280]">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Localisation</p>
            <p className="text-sm opacity-75">Intégration Google Maps en cours</p>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0EA5E9]" />
            Votre localisation
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Adresse" disabled value="À compléter" />
            <Input label="Ville" disabled value="À compléter" />
          </div>
        </div>
      </motion.div>

      {/* Privacy & Sharing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
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
