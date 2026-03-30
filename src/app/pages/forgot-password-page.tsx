import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth-layout';
import { authService } from '../../lib/services/auth.service';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import toast from 'react-hot-toast';

type PremiumButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
};

function PremiumButton({ children, loading, disabled, type = 'button', onClick, ariaLabel }: PremiumButtonProps) {
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
      aria-label={ariaLabel}
      aria-busy={loading}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3BBDF4] to-[#0EA5E9] text-sm font-semibold text-white shadow-[0_20px_35px_-22px_rgba(59,189,244,0.95)] dark:shadow-[0_20px_35px_-22px_rgba(14,165,233,0.5)] transition-all duration-300 motion-safe:transition-all motion-safe:hover:-translate-y-0.5 hover:brightness-105 dark:hover:brightness-125 hover:shadow-[0_22px_40px_-18px_rgba(14,165,233,0.65)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0EA5E9] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="absolute inset-0 opacity-0 transition-opacity motion-safe:transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)]" />
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-white/35 animate-ping motion-reduce:animate-none"
          style={{ left: ripple.x, top: ripple.y, width: 180, height: 180 }}
        />
      ))}
      {loading ? (
        <svg className="h-5 w-5 animate-spin motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-30" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

type FloatingInputProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  icon: React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  valid?: boolean;
  invalid?: boolean;
  errorMessage?: string;
};

function FloatingInput({
  id,
  label,
  type,
  value,
  icon,
  onChange,
  required,
  inputMode,
  maxLength,
  valid,
  invalid,
  errorMessage,
}: FloatingInputProps) {
  const errorId = `${id}-error`;
  const descriptionIds = [errorMessage ? errorId : ''].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="group relative block transition-transform duration-300 ease-out group-focus-within:scale-[1.01] motion-safe:transition-transform"
      >
        <span className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#64748B] dark:text-gray-400 transition-colors motion-safe:transition-colors group-focus-within:text-[#3BBDF4] dark:group-focus-within:text-[#0EA5E9]" aria-hidden="true">
          {icon}
        </span>

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder=" "
          aria-invalid={invalid}
          aria-describedby={descriptionIds || undefined}
          className={`peer w-full rounded-2xl border bg-white/80 dark:bg-[#1e3a5f]/80 py-4 pl-12 pr-12 text-[15px] text-[#1A1A2E] dark:text-white outline-none shadow-[0_14px_24px_-20px_rgba(26,26,46,0.6)] dark:shadow-[0_14px_24px_-20px_rgba(0,0,0,0.6)] transition-all duration-300 focus:border-[#3BBDF4] focus:bg-white dark:focus:bg-[#1e3a5f] focus:ring-4 focus:ring-offset-1 focus:ring-[#3BBDF4]/30 dark:focus:ring-[#0EA5E9]/30 motion-safe:transition-all ${
            invalid ? 'border-[#F97316]/70 dark:border-[#EA580C]/70 focus:ring-[#F97316]/30 dark:focus:ring-[#EA580C]/30' : 'border-[#D6E6FA] dark:border-gray-600/50'
          } ${valid ? 'border-[#10B981]/60 dark:border-[#059669]/60' : ''}`}
        />

        <span className="pointer-events-none absolute left-11 top-4 origin-left text-[13px] font-medium text-[#64748B] dark:text-gray-400 transition-all duration-300 motion-safe:transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.12em] peer-focus:text-[#3BBDF4] dark:peer-focus:text-[#0EA5E9] peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[11px] peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-[0.12em]">
          {label}
          {required && <span aria-label="required"> *</span>}
        </span>

        {valid ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#10B981] dark:text-[#4ade80]" aria-label="Valid" aria-hidden="true">
            <CheckCircle className="h-4 w-4" />
          </span>
        ) : null}

        {invalid ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F97316] dark:text-[#fb923c]" aria-hidden="true">
            <Mail className="h-4 w-4" />
          </span>
        ) : null}
      </label>
      
      {errorMessage && invalid && (
        <p id={errorId} className="text-xs text-[#F97316] dark:text-[#fb923c] font-medium" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useAccessibilityStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success(t('auth.emailSent'));
    } catch (error: any) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title={t('auth.checkEmail')}
        subtitle={t('auth.resetInstructionsSent')}
        imageSrc="https://images.unsplash.com/photo-1495615811223-4d98c6e9c869?q=80&w=2670&auto=format&fit=crop&crop=entropy&cs=tinysrgb"
      >
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 mx-auto rounded-full bg-[#10B981]/15 dark:bg-[#059669]/20 flex items-center justify-center motion-reduce:transition-none"
          >
            <CheckCircle className="w-10 h-10 text-[#10B981] dark:text-[#4ade80]" aria-hidden="true" />
          </motion.div>

          <div className="space-y-2" role="status" aria-live="polite">
            <p className="text-center text-[#475569] dark:text-gray-400 leading-relaxed">
              {t('auth.resetInstructionsSent')}{' '}
              <span className="font-semibold text-[#1A1A2E] dark:text-white">{email}</span>
            </p>
            <p className="text-center text-sm text-[#64748B] dark:text-gray-500">
              {t('auth.checkSpamFolder')}
            </p>
          </div>

          <div className="space-y-3">
            <PremiumButton
              type="button"
              onClick={() => navigate('/login')}
              ariaLabel={t('auth.backToSignIn')}
            >
              {t('auth.backToSignIn')}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </PremiumButton>
            <button
              onClick={() => setSent(false)}
              className="w-full text-sm text-[#64748B] hover:text-[#1A1A2E] focus-visible:text-[#0EA5E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0EA5E9] rounded-lg transition-colors motion-safe:transition-colors"
              aria-label={t('auth.notReceivedEmail')}
            >
              {t('auth.notReceivedEmail')}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.resetPassword')}
      subtitle={t('auth.enterEmailReset')}
      imageSrc="https://images.unsplash.com/photo-1495615811223-4d98c6e9c869?q=80&w=2670&auto=format&fit=crop&crop=entropy&cs=tinysrgb"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FloatingInput
          id="email"
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-5 h-5" />}
          valid={email.length > 0 && isEmailValid}
          invalid={email.length > 0 && !isEmailValid}
          errorMessage={email.length > 0 && !isEmailValid ? t('auth.invalidEmail') || 'Please enter a valid email address' : undefined}
          required
        />

        <PremiumButton 
          type="submit" 
          loading={loading}
          disabled={!isEmailValid || loading}
          ariaLabel={loading ? t('auth.sending') || 'Sending reset link...' : t('auth.sendResetLink')}
        >
          {t('auth.sendResetLink')}
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </PremiumButton>

        <div className="text-center text-sm text-[#64748B] pt-2">
          {t('auth.rememberPassword')}{' '}
          <button 
            type="button"
            onClick={() => navigate('/login')} 
            className="text-[#0EA5E9] font-medium hover:text-[#0EA5E9] focus-visible:text-[#0EA5E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0EA5E9] rounded transition-colors motion-safe:transition-colors"
            aria-label={t('auth.signIn')}
          >
            {t('auth.signIn')}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
