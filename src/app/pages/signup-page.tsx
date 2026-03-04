import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { useAuthStore } from '../../stores/auth.store';
import { AuthLayout } from '../components/auth-layout';
import { authService } from '../../lib/services/auth.service';
import toast from 'react-hot-toast';
import ReCAPTCHA from "react-google-recaptcha";

export function SignUpPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  const handleFacebookLogin = () => {
    window.location.href = authService.getFacebookAuthUrl();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaValue) {
      toast.error('Veuillez valider le captcha');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        captchaToken: captchaValue || undefined,
      });
      toast.success('Compte créé avec succès !');
      // Redirect to onboarding flow (which now starts with Profile Setup)
      navigate('/onboarding');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <AuthLayout
      title="Commencez l'aventure"
      subtitle="Créez un compte pour une analyse de peau personnalisée."
      imageSrc="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2670&auto=format&fit=crop"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="text"
          label="Nom complet"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          icon={<User className="w-5 h-5" />}
          required
        />

        <Input
          type="email"
          label="Email"
          placeholder="vous@exemple.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          icon={<Mail className="w-5 h-5" />}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            icon={<Lock className="w-5 h-5" />}
            required
          />
          <Input
            type="password"
            label="Confirmer"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            icon={<CheckCircle className="w-5 h-5" />}
            required
          />
        </div>

        <div className="text-xs text-[#6B7280] flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Au moins 8 caractères</span>
          <span className="w-1 h-1 bg-[#D1D5DB] rounded-full" />
          <span>1 majuscule</span>
        </div>

        <div className="flex justify-center mb-4">
          <ReCAPTCHA
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // TODO: Replace with your site key
            onChange={(val) => setCaptchaValue(val)}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-[#0EA5E9]/20" loading={isLoading} disabled={!captchaValue}>
          Créer mon compte
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-[#6B7280]">Ou continuer avec</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 px-6 py-3 border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all bg-white text-[#374151] font-medium group"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={handleFacebookLogin}
            className="flex items-center justify-center gap-3 px-6 py-3 border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all bg-white text-[#374151] font-medium group"
          >
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Facebook" />
            <span>Facebook</span>
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Vous avez déjà un compte ?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#0EA5E9] font-medium hover:underline"
          >
            Se connecter
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
