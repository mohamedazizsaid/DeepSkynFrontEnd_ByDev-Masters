import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { authService } from '../../lib/services/auth.service';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useAccessibilityStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success(t('auth.emailSent'));
    } catch (error: any) {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            <h1 className="text-2xl font-bold mb-4">{t('auth.checkEmail')}</h1>
            <p className="text-[#6B7280] mb-8">
              {t('auth.resetInstructionsSent')}{' '}
              <span className="font-medium text-[#111827]">{email}</span>
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">{t('auth.backToSignIn')}</Button>
              <button
                onClick={() => setSent(false)}
                className="w-full text-sm text-[#6B7280] hover:text-[#0EA5E9] transition-colors"
              >
                {t('auth.notReceivedEmail')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative" style={{ zIndex: 1 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('auth.backToSignIn')}</span>
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
              DeepSkyn
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('auth.resetPassword')}</h1>
          <p className="text-[#6B7280]">{t('auth.enterEmailReset')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label={t('auth.email')}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              required
            />
            <Button type="submit" className="w-full" loading={loading}>{t('auth.sendResetLink')}</Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#6B7280]">
            {t('auth.rememberPassword')}{' '}
            <button onClick={() => navigate('/login')} className="text-[#0EA5E9] font-medium hover:underline">
              {t('auth.signIn')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
