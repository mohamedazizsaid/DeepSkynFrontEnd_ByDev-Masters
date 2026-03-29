import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mail, Lock, User, CheckCircle2, ArrowRight, ShieldCheck, RotateCcw, Check, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { AuthLayout } from '../components/auth-layout';
import { authService } from '../../lib/services/auth.service';
import toast from 'react-hot-toast';
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
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  valid?: boolean;
  invalid?: boolean;
  errorMessage?: string;
};

function ValidationMessage({ message, show }: { message?: string; show: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: -8, x: -8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -8, x: -8 }}
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
  required,
  inputMode,
  maxLength,
  valid,
  invalid,
  errorMessage,
}: FieldInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="group relative block transition-transform duration-300 ease-out group-focus-within:scale-[1.01]"
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
          required={required}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder=" "
          className={`peer w-full rounded-2xl border bg-white/80 dark:bg-[#1e3a5f]/80 py-4 pl-12 pr-12 text-[15px] text-[#1A1A2E] dark:text-white outline-none shadow-[0_14px_24px_-20px_rgba(26,26,46,0.6)] dark:shadow-[0_14px_24px_-20px_rgba(0,0,0,0.6)] transition-all duration-300 focus:border-[#3BBDF4] focus:bg-white dark:focus:bg-[#1e3a5f] focus:ring-4 focus:ring-[#3BBDF4]/20 dark:focus:ring-[#0EA5E9]/20 ${
            invalid ? 'border-[#F97316]/70 dark:border-[#EA580C]/70' : 'border-[#D6E6FA] dark:border-gray-600/50'
          } ${valid ? 'border-[#10B981]/60 dark:border-[#059669]/60' : ''}`}
        />

        <span className="pointer-events-none absolute left-11 top-4 origin-left text-[13px] font-medium text-[#64748B] dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.12em] peer-focus:text-[#3BBDF4] dark:peer-focus:text-[#0EA5E9] peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[11px] peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-[0.12em]">
          {label}
        </span>

        {valid ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#10B981] dark:text-[#4ade80]">
            <Check className="h-4 w-4" />
          </span>
        ) : null}

        {invalid && !valid ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F97316] dark:text-[#fb923c]">
            <X className="h-4 w-4" />
          </span>
        ) : null}
      </label>
      <ValidationMessage message={errorMessage} show={invalid && !valid && !!errorMessage} />
    </div>
  );
}

type PremiumButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

function PremiumButton({ children, loading, disabled, type = 'button', onClick }: PremiumButtonProps) {
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
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3BBDF4] to-[#0EA5E9] text-sm font-semibold text-white shadow-[0_20px_35px_-22px_rgba(59,189,244,0.95)] dark:shadow-[0_20px_35px_-22px_rgba(14,165,233,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 dark:hover:brightness-125 hover:shadow-[0_22px_40px_-18px_rgba(14,165,233,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
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
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<'details' | 'verify'>('details');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeExpiresIn, setCodeExpiresIn] = useState<number>(0);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [expandPasswordChecks, setExpandPasswordChecks] = useState(false);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(Math.max(codeExpiresIn, 0) / 60);
    const seconds = Math.max(codeExpiresIn, 0) % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [codeExpiresIn]);

  const passwordChecks = useMemo(() => {
    const hasMinLength = formData.password.length >= 8;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    return [
      { label: t('auth.minChars'), ok: hasMinLength },
      { label: t('auth.uppercaseReq'), ok: hasUppercase },
      { label: 'Au moins un chiffre', ok: hasNumber },
    ];
  }, [formData.password, t]);

  const passwordScore = passwordChecks.filter((item) => item.ok).length;
  const strengthRatio = passwordScore / passwordChecks.length;
  const strengthColor =
    passwordScore <= 1 ? '#F43F5E' : passwordScore === 2 ? '#FB923C' : '#10B981';

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isNameValid = formData.name.trim().length >= 2;
  const confirmPasswordValid = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  // Validation messages
  const getNameError = () => {
    if (!touched.name) return undefined;
    if (formData.name.trim().length === 0) return t('auth.fieldRequired');
    if (formData.name.trim().length < 2) return t('auth.nameTooShort');
    return undefined;
  };

  const getEmailError = () => {
    if (!touched.email) return undefined;
    if (formData.email.length === 0) return t('auth.fieldRequired');
    if (!isEmailValid) return 'Adresse email invalide';
    return undefined;
  };

  const getPasswordError = () => {
    if (!touched.password) return undefined;
    if (formData.password.length === 0) return t('auth.fieldRequired');
    if (formData.password.length < 8) return 'Au minimum 8 caractères';
    if (passwordScore < 2) return 'Force du mot de passe insuffisante';
    return undefined;
  };

  const getConfirmPasswordError = () => {
    if (!touched.confirmPassword) return undefined;
    if (formData.confirmPassword.length === 0) return t('auth.fieldRequired');
    if (formData.password !== formData.confirmPassword) return 'Les mots de passe ne correspondent pas';
    return undefined;
  };

  const handleFieldBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

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
      imageSrc="https://i.pinimg.com/736x/9f/64/59/9f6459b8fbe1ebb7c2b9bb948e91fa69.jpg"
    >
      <form onSubmit={signupStep === 'details' ? handleRequestCode : handleVerifyCode} className="space-y-5" noValidate>
        <div className="rounded-2xl border border-[#D6E6FA] bg-gradient-to-br from-white via-[#F8FBFF] to-[#ECF5FF] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#64748B] font-semibold">{t('auth.signupSecurityStep')}</p>
              <p className="text-sm text-[#1A1A2E] font-semibold mt-1">
                {signupStep === 'details' ? t('auth.signupStepDetails') : t('auth.signupStepVerify')}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#3BBDF4]">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold">{signupStep === 'details' ? '1/2' : '2/2'}</span>
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-[#D8E7FA] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#3BBDF4] via-[#60A5FA] to-[#0EA5E9]"
              animate={{ width: signupStep === 'details' ? '50%' : '100%' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {signupStep === 'details' ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="space-y-3"
            >
              <FloatingInput
                id="name"
                type="text"
                label={t('auth.fullName')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => handleFieldBlur('name')}
                icon={<User className="w-5 h-5" />}
                valid={formData.name.length > 0 && isNameValid}
                invalid={touched.name && !isNameValid}
                errorMessage={getNameError()}
                required
              />

              <FloatingInput
                id="email"
                type="email"
                label={t('auth.email')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => handleFieldBlur('email')}
                icon={<Mail className="w-5 h-5" />}
                valid={formData.email.length > 0 && isEmailValid}
                invalid={touched.email && !isEmailValid}
                errorMessage={getEmailError()}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-start">
                <div>
                  <FloatingInput
                    id="password"
                    type="password"
                    label={t('auth.password')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onBlur={() => handleFieldBlur('password')}
                    icon={<Lock className="w-5 h-5" />}
                    valid={formData.password.length > 0 && passwordScore >= 2}
                    invalid={touched.password && passwordScore < 2}
                    errorMessage={getPasswordError()}
                    required
                  />
                  
                  {formData.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 space-y-1.5"
                    >
                      <div className="flex items-center justify-between px-3">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-[#64748B] font-medium">Force</span>
                        <span className="text-[11px] font-bold" style={{ color: strengthColor }}>
                          {passwordScore <= 1 ? 'Faible' : passwordScore === 2 ? 'Moyen' : 'Fort'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#E6EFFB] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: strengthColor }}
                          animate={{ width: `${Math.max(strengthRatio, 0.04) * 100}%` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandPasswordChecks(!expandPasswordChecks)}
                        className="text-[10px] text-[#3BBDF4] hover:text-[#0EA5E9] transition-colors font-medium flex items-center gap-1 px-3"
                      >
                        <span>{expandPasswordChecks ? 'Masquer' : 'Voir'} détails</span>
                        <motion.div
                          animate={{ rotate: expandPasswordChecks ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {expandPasswordChecks && (
                          <motion.div
                            className="space-y-1 px-3 pt-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {passwordChecks.map((item, index) => (
                              <motion.div
                                key={item.label}
                                className="flex items-center gap-1.5 text-[10px]"
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                {item.ok ? (
                                  <CheckCircle2 className="h-3 w-3 text-[#10B981] flex-shrink-0" />
                                ) : (
                                  <X className="h-3 w-3 text-[#F97316] flex-shrink-0" />
                                )}
                                <span className={item.ok ? 'text-[#0F766E]' : 'text-[#64748B]'}>{item.label}</span>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                <FloatingInput
                  id="confirmPassword"
                  type="password"
                  label={t('auth.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  valid={confirmPasswordValid}
                  invalid={touched.confirmPassword && !confirmPasswordValid}
                  errorMessage={getConfirmPasswordError()}
                  required
                />
              </div>

              <div className="rounded-2xl border border-[#D6E6FA] bg-white/80 p-2">
                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setCaptchaValue(token)}
                    onExpired={() => setCaptchaValue(null)}
                    onErrored={() => setCaptchaValue(null)}
                  />
                </div>
              </div>

              <PremiumButton type="submit" loading={isRequestingCode} disabled={!captchaValue || isRequestingCode}>
                {t('auth.signupSendCode')}
                <ArrowRight className="w-5 h-5" />
              </PremiumButton>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="space-y-3"
            >
              <div className="rounded-2xl border border-[#BFDBFE] bg-[#F0F9FF] p-3 text-sm text-[#0C4A6E]">
                <p className="font-semibold">{t('auth.signupCodeHint')}</p>
                <p className="mt-1 text-xs">
                  {t('auth.signupCodeHintEmail')} <span className="font-semibold">{formData.email}</span>
                </p>
              </div>

              <FloatingInput
                id="verificationCode"
                type="text"
                label={t('auth.signupCodeLabel')}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                icon={<ShieldCheck className="w-5 h-5" />}
                inputMode="numeric"
                maxLength={6}
                valid={verificationCode.length === 6}
                invalid={verificationCode.length > 0 && verificationCode.length < 6}
                required
              />

              <div className="rounded-xl border border-[#D6E6FA] bg-white p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B]">{t('auth.signupCodeExpires')}</p>
                  <p className="text-sm font-semibold text-[#1A1A2E]">{formattedCountdown}</p>
                </div>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResendingCode || resendCountdown > 0}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#3B82F6] disabled:text-[#94A3B8] disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`w-4 h-4 ${isResendingCode ? 'animate-spin' : ''}`} />
                  {resendCountdown > 0
                    ? `${t('auth.signupCodeResendIn')} ${resendCountdown}s`
                    : t('auth.signupCodeResend')}
                </button>
              </div>

              <PremiumButton type="submit" loading={isVerifyingCode} disabled={isVerifyingCode}>
                {t('auth.signupVerifyCode')}
                <ArrowRight className="w-5 h-5" />
              </PremiumButton>

              <button
                type="button"
                onClick={() => setSignupStep('details')}
                className="w-full text-sm text-[#64748B] hover:text-[#1A1A2E] transition-colors"
              >
                {t('auth.back')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D6E6FA]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white/95 text-[#64748B]">{t('auth.orContinue')}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={signupStep === 'verify'}
            aria-label="Continuer avec Google"
            className="group flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#E2E8F0] bg-white text-[#1A1A2E] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_10px_22px_-16px_rgba(26,26,46,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-6 w-6 transition-transform group-hover:scale-110" alt="Google" />
          </button>

          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={signupStep === 'verify'}
            aria-label="Continuer avec Facebook"
            className="group flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#E2E8F0] bg-white text-[#1A1A2E] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_10px_22px_-16px_rgba(26,26,46,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="h-6 w-6 transition-transform group-hover:scale-110" alt="Facebook" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            disabled={signupStep === 'verify'}
            aria-label="Se connecter avec FaceID"
            className="group flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#E2E8F0] bg-white text-[#1A1A2E] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_10px_22px_-16px_rgba(26,26,46,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaceIdIcon />
          </button>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-4">
          {t('auth.haveAccount')}{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#0EA5E9] font-medium hover:text-[#0EA5E9] transition-colors"
          >
            {t('auth.signIn')}
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
