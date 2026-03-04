import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { authService } from '../../lib/services/auth.service';
import toast from 'react-hot-toast';

export function ResetPasswordPage() {
  const navigate = useNavigate();
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
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success('Mot de passe réinitialisé !');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la réinitialisation');
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
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-white to-[#F9FAFB] flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB] text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-[#EF4444]" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Lien invalide</h1>
            <p className="text-[#6B7280] mb-8">Ce lien de réinitialisation est invalide ou a expiré.</p>
            <Button onClick={() => navigate('/forgot-password')} className="w-full">Demander un nouveau lien</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-white to-[#F9FAFB] flex items-center justify-center px-6 py-12">
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
            <h1 className="text-2xl font-bold mb-4">Mot de passe réinitialisé</h1>
            <p className="text-[#6B7280] mb-8">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            <Button onClick={() => navigate('/login')} className="w-full">Se connecter</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-white to-[#F9FAFB] flex items-center justify-center px-6 py-12">
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
          <h1 className="text-3xl font-bold mb-2">New Password</h1>
          <p className="text-[#6B7280]">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="password"
              label="New Password"
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
            />
            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              error={confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : undefined}
              required
            />
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={newPassword.length < 8 || newPassword !== confirmPassword}
            >
              Reset Password
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
