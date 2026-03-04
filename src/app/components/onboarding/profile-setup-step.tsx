import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, User as UserIcon, Calendar, Camera } from 'lucide-react';
import { Button } from '../button';
import { Input } from '../input';
import { usersService } from '../../../lib/services/users.service';
import { useAuthStore } from '../../../stores/auth.store';
import toast from 'react-hot-toast';

interface ProfileSetupStepProps {
    onComplete: () => void;
}

export function ProfileSetupStep({ onComplete }: ProfileSetupStepProps) {
    const { loadUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        dateOfBirth: '',
        gender: '',
        preferredLanguage: 'fr',
        avatar: '', // Base64
    });

    useEffect(() => {
        // Pre-fill data if available
        usersService.getMe().then(user => {
            setFormData(prev => ({
                ...prev,
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                gender: user.gender || '',
                preferredLanguage: user.preferredLanguage || 'fr',
                avatar: user.avatar || '',
            }));
        }).catch(() => {
            // Ignore error, just start fresh
        });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image trop volumineuse (max 2MB)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.dateOfBirth) {
            toast.error('Date de naissance requise');
            return;
        }

        if (!formData.gender) {
            toast.error('Genre requis');
            return;
        }

        setLoading(true);
        try {
            await usersService.updateMe({
                dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
                gender: formData.gender,
                preferredLanguage: formData.preferredLanguage,
                avatar: formData.avatar || undefined,
            });

            // IMPORTANT: Reload global user state so dashboard/navbar sees the new avatar
            await loadUser();

            toast.success('Profil mis à jour !');
            onComplete();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Configurez votre profil</h2>
                <p className="text-gray-500">Dites-nous en plus sur vous pour une expérience personnalisée.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center">
                    <div className="relative group cursor-pointer w-32 h-32">
                        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl ${!formData.avatar ? 'bg-gray-100 flex items-center justify-center' : ''}`}>
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-16 h-16 text-gray-300" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#0EA5E9] rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#0284C7] transition-colors text-white">
                            <Camera className="w-5 h-5" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Cliquez pour changer (max 2MB)</p>
                </div>

                {/* Date of Birth */}
                <Input
                    type="date"
                    label="Date de naissance"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    icon={<Calendar className="w-5 h-5" />}
                    required
                />

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['female', 'male', 'other'].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: g })}
                                className={`flex items-center justify-center py-3 rounded-xl border font-medium transition-all ${formData.gender === g
                                    ? 'border-[#0EA5E9] bg-blue-50 text-[#0EA5E9] ring-2 ring-[#0EA5E9]/20'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {g === 'female' ? 'Femme' : g === 'male' ? 'Homme' : 'Autre'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Langue préférée</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { code: 'fr', label: 'Français', flag: '🇫🇷' },
                            { code: 'en', label: 'English', flag: '🇬🇧' },
                            { code: 'ar', label: 'العربية', flag: '🇸🇦' },
                            { code: 'es', label: 'Español', flag: '🇪🇸' },
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => setFormData({ ...formData, preferredLanguage: lang.code })}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${formData.preferredLanguage === lang.code
                                    ? 'border-[#0EA5E9] bg-blue-50 text-blue-900 ring-2 ring-[#0EA5E9]/20'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-xl">{lang.flag}</span>
                                <span className="font-medium">{lang.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg shadow-lg shadow-[#0EA5E9]/20" loading={loading}>
                    Continuer
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </form>
        </motion.div>
    );
}
