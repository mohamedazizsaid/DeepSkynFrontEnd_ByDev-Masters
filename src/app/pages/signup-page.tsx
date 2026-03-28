import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Lock, User, CheckCircle, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { useAuthStore } from '../../stores/auth.store';
import { AuthLayout } from '../components/auth-layout';
import { authService } from '../../lib/services/auth.service';
import toast from 'react-hot-toast';
import ReCAPTCHA from "react-google-recaptcha";
import { useAccessibilityStore } from '../../stores/accessibility.store';

export function SignUpPage() {
  const { t } = useAccessibilityStore();
  const navigate = useNavigate();
  const { requestSignupCode, verifySignupCode } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<'details' | 'verify'>('details');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeExpiresIn, setCodeExpiresIn] = useState<number>(0);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(Math.max(codeExpiresIn, 0) / 60);
    const seconds = Math.max(codeExpiresIn, 0) % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [codeExpiresIn]);

  useEffect(() => {
    if (codeExpiresIn <= 0 && resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCodeExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [codeExpiresIn, resendCountdown]);

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  const handleFacebookLogin = () => {
    window.location.href = authService.getFacebookAuthUrl();
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaValue) {
      toast.error(t('auth.captchaError'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passMismatch'));
      return;
    }

    try {
      setIsRequestingCode(true);
      const response = await requestSignupCode({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        captchaToken: captchaValue || undefined,
      });

      setCodeExpiresIn(response.expiresInSeconds || 600);
      setResendCountdown(60);
      setSignupStep('verify');
      toast.success(t('auth.signupCodeSent'));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('auth.registerError'));
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.trim().length !== 6) {
      toast.error(t('auth.signupCodeInvalid'));
      return;
    }

    try {
      setIsVerifyingCode(true);
      await verifySignupCode(formData.email, verificationCode.trim());
      toast.success(t('auth.signupSuccess'));
      navigate('/onboarding');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('auth.signupCodeVerifyError'));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) {
      return;
    }

    try {
      setIsResendingCode(true);
      const response = await requestSignupCode({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        captchaToken: captchaValue || undefined,
      });

      setVerificationCode('');
      setCodeExpiresIn(response.expiresInSeconds || 600);
      setResendCountdown(60);
      toast.success(t('auth.signupCodeResent'));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('auth.signupCodeResendError'));
    } finally {
      setIsResendingCode(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSubtitle')}
      imageSrc="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2670&auto=format&fit=crop"
    >
      <form onSubmit={signupStep === 'details' ? handleRequestCode : handleVerifyCode} className="space-y-5">
        <div className="rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-white via-[#F8FAFC] to-[#EEF6FF] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#64748B] font-semibold">{t('auth.signupSecurityStep')}</p>
              <p className="text-sm text-[#0F172A] font-semibold mt-1">
                {signupStep === 'details' ? t('auth.signupStepDetails') : t('auth.signupStepVerify')}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#0EA5E9]">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold">{signupStep === 'details' ? '1/2' : '2/2'}</span>
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] transition-all duration-300"
              style={{ width: signupStep === 'details' ? '50%' : '100%' }}
            />
          </div>
        </div>

        {signupStep === 'details' ? (
          <>
        <Input
          type="text"
          label={t('auth.fullName')}
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          icon={<User className="w-5 h-5" />}
          required
        />

        <Input
          type="email"
          label={t('auth.email')}
          placeholder="vous@exemple.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          icon={<Mail className="w-5 h-5" />}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="password"
            label={t('auth.password')}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            icon={<Lock className="w-5 h-5" />}
            required
          />
          <Input
            type="password"
            label={t('auth.confirmPassword')}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            icon={<CheckCircle className="w-5 h-5" />}
            required
          />
        </div>

        <div className="text-xs text-[#6B7280] flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
          <span>{t('auth.minChars')}</span>
          <span className="w-1 h-1 bg-[#D1D5DB] rounded-full" />
          <span>{t('auth.uppercaseReq')}</span>
        </div>

        <div className="flex justify-center mb-4">
          <ReCAPTCHA
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // TODO: Replace with your site key
            onChange={(val) => setCaptchaValue(val)}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-[#0EA5E9]/20" loading={isRequestingCode} disabled={!captchaValue || isRequestingCode}>
          {t('auth.signupSendCode')}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-4 text-sm text-[#075985]">
              <p className="font-semibold">{t('auth.signupCodeHint')}</p>
              <p className="mt-1 text-xs text-[#0C4A6E]">
                {t('auth.signupCodeHintEmail')} <span className="font-semibold">{formData.email}</span>
              </p>
            </div>

            <Input
              type="text"
              label={t('auth.signupCodeLabel')}
              placeholder="123456"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              icon={<ShieldCheck className="w-5 h-5" />}
              required
            />

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B]">{t('auth.signupCodeExpires')}</p>
                <p className="text-sm font-semibold text-[#0F172A]">{formattedCountdown}</p>
              </div>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResendingCode || resendCountdown > 0}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0EA5E9] disabled:text-[#94A3B8] disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                {resendCountdown > 0
                  ? `${t('auth.signupCodeResendIn')} ${resendCountdown}s`
                  : t('auth.signupCodeResend')}
              </button>
            </div>

            <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-[#0EA5E9]/20" loading={isVerifyingCode} disabled={isVerifyingCode}>
              {t('auth.signupVerifyCode')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <button
              type="button"
              onClick={() => setSignupStep('details')}
              className="w-full text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              {t('auth.back')}
            </button>
          </>
        )}

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
            disabled={signupStep === 'verify'}
            className="flex items-center justify-center gap-3 px-6 py-3 border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all bg-white text-[#374151] font-medium group"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={signupStep === 'verify'}
            className="flex items-center justify-center gap-3 px-6 py-3 border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all bg-white text-[#374151] font-medium group"
          >
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Facebook" />
            <span>Facebook</span>
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t('auth.haveAccount')}{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#0EA5E9] font-medium hover:underline"
          >
            {t('auth.signIn')}
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
