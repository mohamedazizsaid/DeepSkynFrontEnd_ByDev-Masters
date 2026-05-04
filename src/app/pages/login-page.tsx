import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Mail, Lock, Shield, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../lib/services/auth.service';
import { skinProfileService } from '../../lib/services/skin-profile.service';
import { AuthLayout } from '../components/auth-layout';
import toast from 'react-hot-toast';
import { FaceIDScanner } from '../components/face-id-scanner';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import ReCAPTCHA from 'react-google-recaptcha';

type FieldInputProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  icon: React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  valid?: boolean;
  invalid?: boolean;
  required?: boolean;
  errorMessage?: string;
};

function ValidationMessage({ message, show, shouldReduceMotion }: { message?: string; show: boolean; shouldReduceMotion: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {show && message && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: -8, x: -8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, x: -8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FECACA] dark:border-[#DC2626]/30"
        >
          <X className="h-3.5 w-3.5 text-[#DC2626] dark:text-[#EF4444] flex-shrink-0" />
          <span className="text-xs font-medium text-[#DC2626] dark:text-[#FCA5A5]">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingInput({
  id,
  label,
  type,
  value,
  icon,
  onChange,
  onBlur,
  inputMode,
  maxLength,
  valid,
  invalid,
  required,
  errorMessage,
  shouldReduceMotion,
}: FieldInputProps & { shouldReduceMotion: boolean }) {
  return (
    <div>
      <label
        className="group relative block transition-transform duration-300 ease-out group-focus-within:scale-[1.01]"
        htmlFor={id}
      >
        <span className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#64748B] dark:text-gray-400 transition-colors group-focus-within:text-[#3BBDF4] dark:group-focus-within:text-[#0EA5E9]">
          {icon}
        </span>

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder=" "
          inputMode={inputMode}
          maxLength={maxLength}
          required={required}
          className={`peer w-full rounded-2xl border bg-white/80 dark:bg-[#1e3a5f]/80 py-4 pl-12 pr-12 text-[15px] text-[#1A1A2E] dark:text-white shadow-[0_12px_24px_-20px_rgba(26,26,46,0.55)] dark:shadow-[0_12px_24px_-20px_rgba(0,0,0,0.55)] outline-none transition-all duration-300 placeholder:text-transparent focus:border-[#3BBDF4] focus:bg-white dark:focus:bg-[#1e3a5f] focus:ring-4 focus:ring-[#3BBDF4]/20 dark:focus:ring-[#0EA5E9]/20 ${invalid ? 'border-[#F97316]/70 dark:border-[#EA580C]/70' : 'border-[#D6E6FA] dark:border-gray-600/50'
            } ${valid ? 'border-[#10B981]/60 dark:border-[#059669]/60' : ''}`}
        />

        <span className="pointer-events-none absolute left-11 top-4 origin-left text-[13px] font-medium text-[#64748B] dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.12em] peer-focus:text-[#3BBDF4] dark:peer-focus:text-[#0EA5E9] peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[11px] peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-[0.12em]">
          {label}
        </span>

        {valid && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#10B981] dark:text-[#4ade80]">
            <Check className="h-4 w-4" />
          </span>
        )}

        {invalid && !valid && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F97316] dark:text-[#fb923c]">
            <X className="h-4 w-4" />
          </span>
        )}
      </label>
      <ValidationMessage
        message={errorMessage}
        show={Boolean(invalid && !valid && errorMessage)}
        shouldReduceMotion={Boolean(shouldReduceMotion)}
      />
    </div>
  );
}

type PremiumButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'outline';
  className?: string;
};

function PremiumButton({ children, loading, disabled, onClick, type = 'button', variant = 'primary', className = '' }: PremiumButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== id));
    }, 550);

    onClick?.(event);
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${variant === 'primary'
          ? 'bg-gradient-to-r from-[#3BBDF4] to-[#0EA5E9] text-white shadow-[0_20px_35px_-22px_rgba(59,189,244,0.9)] dark:shadow-[0_20px_35px_-22px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 hover:brightness-105 dark:hover:brightness-125 hover:shadow-[0_22px_40px_-18px_rgba(14,165,233,0.65)]'
          : 'border border-[#BFD7F7] dark:border-gray-600 bg-white/85 dark:bg-[#1e3a5f]/85 text-[#1A1A2E] dark:text-white hover:-translate-y-0.5 hover:border-[#3BBDF4]/60 dark:hover:border-[#0EA5E9]/60 hover:bg-white dark:hover:bg-[#1e3a5f]'
        } ${className}`}
    >
      <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)]" />
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-white/35 animate-ping"
          style={{ left: ripple.x, top: ripple.y, width: 180, height: 180 }}
        />
      ))}
      {loading ? (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-30" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function FaceIdIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 3.5H5.8C4.81 3.5 4 4.31 4 5.3V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 3.5H18.2C19.19 3.5 20 4.31 20 5.3V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 20.5H5.8C4.81 20.5 4 19.69 4 18.7V17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 20.5H18.2C19.19 20.5 20 19.69 20 18.7V17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.4 9.2H9.45" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M14.55 9.2H14.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8.8 14.2C9.8 15.7 11.6 16.4 12 16.4C12.4 16.4 14.2 15.7 15.2 14.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9.7V12.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function LoginPage() {
  const { t, reduceMotion } = useAccessibilityStore();
  const browserReducedMotion = useReducedMotion();
  const shouldReduceMotion = !!(reduceMotion || browserReducedMotion);
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
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;

  // Validation messages
  const getEmailError = () => {
    if (!touched.email) return undefined;
    if (email.length === 0) return t('auth.fieldRequired');
    if (!isEmailValid) return 'Adresse email invalide';
    return undefined;
  };

  const getPasswordError = () => {
    if (!touched.password) return undefined;
    if (password.length === 0) return t('auth.fieldRequired');
    if (password.length < 8) return 'Au minimum 8 caractères';
    return undefined;
  };

  const handleFieldBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

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
    if (!tempCredentials) {
      return;
    }

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

    setShowFaceScan(true);
  };

  const handleFaceSuccess = async (descriptor?: number[]) => {
    try {
      const result = await faceLogin(email, descriptor);
      if (result.success) {
        toast.success(t('auth.loginSuccess'));
        const status = await skinProfileService.checkOnboardingStatus();
        if (!status.onboardingComplete) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
        setShowFaceScan(false);
        return true;
      }
      return false;
    } catch (_error) {
      toast.error(t('auth.faceIdError'));
      return false;
    }
  };

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  const decorDots = [
    { className: 'left-[6%] top-[20%] h-24 w-24 bg-[#3BBDF4]/12' },
    { className: 'left-[38%] top-[12%] h-40 w-40 bg-[#F472B6]/12' },
    { className: 'right-[14%] top-[28%] h-28 w-28 bg-[#3BBDF4]/15' },
    { className: 'right-[8%] bottom-[14%] h-44 w-44 bg-[#FADADD]/35' },
  ];

  if (show2FA || requiresTwoFactor) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#F0F6FF]" style={{ zIndex: 1 }}>
        <div className="pointer-events-none absolute inset-0">
          {decorDots.map((dot, index) => (
            <motion.div
              key={dot.className}
              className={`absolute rounded-full blur-2xl ${dot.className}`}
              animate={{ y: [0, -14, 0], x: [0, index % 2 === 0 ? 7 : -7, 0] }}
              transition={{ duration: 8 + index, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <button
            onClick={() => {
              setShow2FA(false);
              clearTwoFactor();
              setTwoFactorCode('');
            }}
            className="mb-8 flex items-center gap-2 text-[#64748B] hover:text-[#3BBDF4] transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>{t('auth.back')}</span>
          </button>

          <div className="rounded-3xl border border-white/75 bg-white/90 p-8 shadow-[0_35px_75px_-40px_rgba(26,26,46,0.55)] backdrop-blur-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#3BBDF4] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#3BBDF4]/25">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-[#1A1A2E]">{t('auth.twoFactorTitle')}</h1>
              <p className="text-[#64748B] text-sm">{t('auth.twoFactorSubtitle')}</p>
            </div>

            <form onSubmit={handle2FASubmit} className="space-y-6" noValidate>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-4xl tracking-[0.5em] px-4 py-5 bg-[#F8FBFF] border border-[#CFE3FB] rounded-2xl text-[#1A1A2E] focus:outline-none focus:border-[#3BBDF4] focus:ring-4 focus:ring-[#3BBDF4]/15 transition-all font-mono"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              <PremiumButton type="submit" loading={isLoading} disabled={twoFactorCode.length !== 6}>
                {t('auth.verify')}
                <ArrowRight className="w-5 h-5" />
              </PremiumButton>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      imageSrc="https://i.pinimg.com/736x/72/f7/e6/72f7e661c65a96eb7edb17092357295b.jpg"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <FloatingInput
            id="email"
            type="email"
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            icon={<Mail className="h-5 w-5" />}
            valid={email.length > 0 && isEmailValid}
            invalid={touched.email && !isEmailValid}
            errorMessage={getEmailError()}
            required
            shouldReduceMotion={shouldReduceMotion}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }} className="space-y-2">
          <FloatingInput
            id="password"
            type="password"
            label={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            icon={<Lock className="h-5 w-5" />}
            valid={password.length > 0 && isPasswordValid}
            invalid={touched.password && !isPasswordValid}
            errorMessage={getPasswordError()}
            required
            shouldReduceMotion={shouldReduceMotion}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm font-medium text-[#3BBDF4] hover:text-[#0EA5E9] transition-colors"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="rounded-2xl border border-[#D6E6FA] bg-white/80 p-3"
        >
          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={recaptchaSiteKey}
              onChange={(token) => setCaptchaValue(token)}
              onExpired={() => setCaptchaValue(null)}
              onErrored={() => setCaptchaValue(null)}
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24 }}>
          <PremiumButton type="submit" loading={isLoading} disabled={!captchaValue}>
            {t('auth.signIn')}
            <ArrowRight className="h-4 w-4" />
          </PremiumButton>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }} className="relative my-4">


        </motion.div>

      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#D6E6FA]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white/95 text-[#64748B]">{t('auth.orContinue')}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          aria-label="Continuer avec Google"
          className="group flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#E2E8F0] bg-white text-[#1A1A2E] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_10px_22px_-16px_rgba(26,26,46,0.45)]"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-6 w-6 transition-transform group-hover:scale-110" alt="Google" />
        </button>

        <button
          type="button"
          onClick={handleFacebookLogin}
          aria-label="Continuer avec Facebook"
          className="group flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#E2E8F0] bg-white text-[#1A1A2E] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_10px_22px_-16px_rgba(26,26,46,0.45)]"
        >
          <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="h-6 w-6 transition-transform group-hover:scale-110" alt="Facebook" />
        </button>

        <button
          type="button"
          onClick={handleFaceIDClick}
          aria-label="Se connecter avec FaceID"
          className="group flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#E2E8F0] bg-white text-[#1A1A2E] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_10px_22px_-16px_rgba(26,26,46,0.45)]"
        >
          <FaceIdIcon />
        </button>
      </div>

      <p className="text-center text-sm text-[#64748B] mt-8">
        {t('auth.noAccount')}{' '}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="text-[#3BBDF4] font-bold hover:text-[#0EA5E9] transition-colors"
        >
          {t('auth.signUpFree')}
        </button>
      </p>

      {showFaceScan ? (
        <FaceIDScanner
          userEmail={email}
          userAvatarUrl={avatarUrl || ''}
          onSuccess={handleFaceSuccess}
          onClose={() => setShowFaceScan(false)}
        />
      ) : null}
    </AuthLayout>
  );
}
