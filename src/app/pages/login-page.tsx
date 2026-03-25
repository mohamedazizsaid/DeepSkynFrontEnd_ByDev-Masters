import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Shield, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../lib/services/auth.service';
import { skinProfileService } from '../../lib/services/skin-profile.service';
import { AuthLayout } from '../components/auth-layout';
import toast from 'react-hot-toast';
import ReCAPTCHA from "react-google-recaptcha";
import { FaceIDScanner } from '../components/face-id-scanner';
import { Scan } from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

export function LoginPage() {
  const { t } = useAccessibilityStore();
  const navigate = useNavigate();
  const { login, isLoading, requiresTwoFactor, tempCredentials, clearTwoFactor } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { faceLogin } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!captchaValue) {
      toast.error(t('auth.captchaError'));
      return;
    }

    try {
      const result = await login(email, password, undefined, captchaValue || undefined);
      if (result.requiresTwoFactor) {
        setShow2FA(true);
        toast(t('auth.twoFactorReq'), { icon: '🔐' });
      } else if (result.success) {
        toast.success(t('auth.loginSuccess'));
        // Check if onboarding is completed
        const status = await skinProfileService.checkOnboardingStatus();
        if (!status.onboardingComplete) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('auth.invalidCredentials'));
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCredentials) return;
    try {
      const result = await login(tempCredentials.username, tempCredentials.password, twoFactorCode, captchaValue || undefined);
      if (result.success) {
        toast.success(t('auth.loginSuccess'));
        const status = await skinProfileService.checkOnboardingStatus();
        if (!status.onboardingComplete) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('auth.invalid2FA'));
      setTwoFactorCode('');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  const handleFacebookLogin = () => {
    window.location.href = authService.getFacebookAuthUrl();
  };

  const handleFaceIDClick = async () => {
    if (!email) {
      toast.error(t('auth.faceIdNoEmail'));
      return;
    }
    try {
      const res = await authService.getUserAvatar(email);
      if (res.avatar) {
        setAvatarUrl(res.avatar);
        setShowFaceScan(true);
      } else {
        toast.error(t('auth.faceIdNoAvatar'));
      }
    } catch (error) {
      toast.error(t('auth.userNotFound'));
    }
  };

  const handleFaceSuccess = async () => {
    try {
      const result = await faceLogin(email);
      if (result.success) {
        toast.success(t('auth.loginSuccess'));
        const status = await skinProfileService.checkOnboardingStatus();
        if (!status.onboardingComplete) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(t('auth.faceIdError'));
    } finally {
      setShowFaceScan(false);
    }
  };

  // ─── 2FA Verification Screen (Keep centered/focused) ───
  if (show2FA || requiresTwoFactor) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden" style={{ zIndex: 1 }}>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <button
            onClick={() => { setShow2FA(false); clearTwoFactor(); setTwoFactorCode(''); }}
            className="mb-8 flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>{t('auth.back')}</span>
          </button>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{t('auth.twoFactorTitle')}</h1>
              <p className="text-[#6B7280] text-sm">{t('auth.twoFactorSubtitle')}</p>
            </div>

            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-4xl tracking-[0.5em] px-4 py-5 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-2xl text-[#111827] focus:outline-none focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 transition-all font-mono"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg shadow-lg shadow-[#0EA5E9]/20" loading={isLoading} disabled={twoFactorCode.length !== 6}>
                {t('auth.verify')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Login Form ───
  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      imageSrc="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2670&auto=format&fit=crop"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          label={t('auth.email')}
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-5 h-5" />}
          required
        />

        <div className="space-y-1">
          <Input
            type="password"
            label={t('auth.password')}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <ReCAPTCHA
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // TODO: Replace with your site key
            onChange={(val) => setCaptchaValue(val)}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-[#0EA5E9]/20" loading={isLoading} disabled={!captchaValue}>
          {t('auth.signIn')}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white text-[#6B7280]">{t('auth.or')}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base border-blue-200 hover:bg-blue-50 text-blue-600 font-semibold shadow-sm"
          onClick={handleFaceIDClick}
        >
          <Scan className="w-5 h-5 mr-2" />
          {t('auth.faceId')}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E7EB]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-[#6B7280]">{t('auth.orContinue')}</span>
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

      <p className="text-center text-sm text-[#6B7280] mt-8">
        {t('auth.noAccount')}{' '}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="text-[#0EA5E9] font-bold hover:underline"
        >
          {t('auth.signUpFree')}
        </button>
      </p>

      {
        showFaceScan && avatarUrl && (
          <FaceIDScanner
            userEmail={email}
            userAvatarUrl={avatarUrl!}
            onSuccess={handleFaceSuccess}
            onClose={() => setShowFaceScan(false)}
          />
        )
      }
    </AuthLayout >
  );
}
