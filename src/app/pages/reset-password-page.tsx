import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, CheckCircle, XCircle, Loader2, ArrowRight, Check, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth-layout';
import { authService } from '../../lib/services/auth.service';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import toast from 'react-hot-toast';

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
}: FloatingInputProps) {
  return (
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

      {invalid ? (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F97316] dark:text-[#fb923c]">
          <X className="h-4 w-4" />
        </span>
      ) : null}
    </label>
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

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useAccessibilityStore();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordValid = newPassword.length >= 8;
  const confirmPasswordValid = newPassword === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      return;
    }
    authService.validateResetToken(token).then((res) => {
      setTokenValid(res.valid);
      setValidating(false);
    }).catch(() => {
      setTokenValid(false);
      setValidating(false);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success(t('auth.passwordResetSuccess'));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F6FF] via-[#E8F3FF] to-[#F0F6FF] dark:from-[#0f172a] dark:via-[#1a2844] dark:to-[#16213e]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <AuthLayout
        title={t('auth.invalidLink')}
        subtitle={t('auth.invalidLinkDesc')}
      imageSrc="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2670&auto=format&fit=crop&crop=entropy&cs=tinysrgb"
        >
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 mx-auto rounded-full bg-[#EF4444]/15 dark:bg-[#DC2626]/20 flex items-center justify-center"
          >
            <XCircle className="w-10 h-10 text-[#EF4444] dark:text-[#f87171]" />
          </motion.div>

          <div>
            <p className="text-center text-[#475569] dark:text-gray-400 leading-relaxed">
              {t('auth.invalidLinkDesc')}
            </p>
          </div>

          <PremiumButton
            type="button"
            onClick={() => navigate('/forgot-password')}
          >
            {t('auth.requestNewLink')}
            <ArrowRight className="w-5 h-5" />
          </PremiumButton>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title={t('auth.passwordReset')}
        subtitle={t('auth.nowCanSignIn')}
        imageSrc="https://images.unsplash.com/photo-1495615811223-4d98c6e9c869?q=80&w=2670&auto=format&fit=crop&crop=entropy&cs=tinysrgb"
      >
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 mx-auto rounded-full bg-[#10B981]/15 dark:bg-[#059669]/20 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-[#10B981] dark:text-[#4ade80]" />
          </motion.div>

          <div>
            <p className="text-center text-[#475569] dark:text-gray-400 leading-relaxed">
              {t('auth.nowCanSignIn')}
            </p>
          </div>

          <PremiumButton
            type="button"
            onClick={() => navigate('/login')}
          >
            {t('auth.signIn')}
            <ArrowRight className="w-5 h-5" />
          </PremiumButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.newPasswordLabel')}
      subtitle={t('auth.chooseStrongPassword')}
      imageSrc="https://images.unsplash.com/photo-1633356122544-f134324ef6df?q=80&w=2670&auto=format&fit=crop&crop=entropy&cs=tinysrgb"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FloatingInput
          id="newPassword"
          label={t('auth.newPasswordLabel')}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          icon={<Lock className="w-5 h-5" />}
          valid={newPassword.length > 0 && passwordValid}
          invalid={newPassword.length > 0 && !passwordValid}
          required
        />

        <FloatingInput
          id="confirmPassword"
          label={t('auth.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-5 h-5" />}
          valid={confirmPassword.length > 0 && confirmPasswordValid}
          invalid={confirmPassword.length > 0 && !confirmPasswordValid}
          required
        />

        <PremiumButton
          type="submit"
          loading={loading}
          disabled={!passwordValid || !confirmPasswordValid || loading}
        >
          {t('auth.resetPassword')}
          <ArrowRight className="w-5 h-5" />
        </PremiumButton>

        <div className="text-center text-sm text-[#64748B] dark:text-gray-400 pt-2">
          {t('auth.rememberPassword')}{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#0EA5E9] dark:text-[#38BDF8] font-medium hover:text-[#06B6D4] dark:hover:text-[#0EA5E9] transition-colors"
          >
            {t('auth.signIn')}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
