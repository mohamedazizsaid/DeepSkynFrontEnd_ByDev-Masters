import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { authService } from '../../lib/services/auth.service';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import toast from 'react-hot-toast';

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 relative" style={{ zIndex: 1 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB] text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-[#EF4444]" />
            </div>
            <h1 className="text-2xl font-bold mb-4">{t('auth.invalidLink')}</h1>
            <p className="text-[#6B7280] mb-8">{t('auth.invalidLinkDesc')}</p>
            <Button onClick={() => navigate('/forgot-password')} className="w-full">{t('auth.requestNewLink')}</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 relative" style={{ zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB] text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#10B981]/10 flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-[#10B981]" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-4">{t('auth.passwordReset')}</h1>
            <p className="text-[#6B7280] mb-8">{t('auth.nowCanSignIn')}</p>
            <Button onClick={() => navigate('/login')} className="w-full">{t('auth.signIn')}</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative" style={{ zIndex: 1 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
              DeepSkyn
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('auth.newPasswordLabel')}</h1>
          <p className="text-[#6B7280]">{t('auth.chooseStrongPassword')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="password"
              label={t('auth.newPasswordLabel')}
              placeholder={t('auth.min8Chars')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
            />
            <Input
              type="password"
              label={t('auth.confirmPassword')}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              error={confirmPassword && newPassword !== confirmPassword ? t('auth.passMismatch') : undefined}
              required
            />
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={newPassword.length < 8 || newPassword !== confirmPassword}
            >
              {t('auth.resetPassword')}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
