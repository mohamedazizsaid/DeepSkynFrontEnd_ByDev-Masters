import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';
import { authService } from '../../lib/services/auth.service';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import toast from 'react-hot-toast';

interface ChangePasswordSettingsProps {
  onBack: () => void;
}

export function ChangePasswordSettings({ onBack }: ChangePasswordSettingsProps) {
  const { t } = useAccessibilityStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, newPassword: value });
    calculatePasswordStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('settings.security.mismatch'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('settings.security.minLength'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );
      toast.success(t('settings.security.updateSuccess'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '12px' }
      });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('common.error'), {
        style: { borderRadius: '12px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px' }
      });
    } finally {
      setLoading(false);
    }
  };

  const strengthLabels = t('settings.security.strengthLabels') as unknown as string[];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-gray-100 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">{t('common.back')}</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-gray-100">{t('settings.security.passwordTitle')}</h2>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">{t('settings.security.passwordSubtitle')}</p>
          </div>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm p-6"
      >
        {/* Current Password */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#111827] dark:text-gray-100 mb-2">{t('settings.security.currentPassword')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              placeholder={t('settings.security.currentPassword')}
              className="w-full pl-10 pr-10 py-3 bg-[#F9FAFB] dark:bg-slate-800 border-2 border-[#E5E7EB] dark:border-slate-700 rounded-xl focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200 text-[#111827] dark:text-gray-100 placeholder-[#9CA3AF] dark:placeholder-gray-500"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="h-px bg-[#E5E7EB] dark:bg-slate-700 my-8" />

        {/* New Password */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#111827] dark:text-gray-100 mb-2">{t('settings.security.newPassword')}</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleNewPasswordChange}
              placeholder={t('settings.security.newPassword')}
              className="w-full pl-10 pr-10 py-3 bg-[#F9FAFB] dark:bg-slate-800 border-2 border-[#E5E7EB] dark:border-slate-700 rounded-xl focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200 text-[#111827] dark:text-gray-100 placeholder-[#9CA3AF] dark:placeholder-gray-500"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Strength */}
          {formData.newPassword && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#6B7280] dark:text-gray-400">{t('settings.security.strength')}</span>
                <span className="text-xs font-semibold text-[#111827] dark:text-gray-100">{strengthLabels[passwordStrength - 1]}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                  className={`h-full ${strengthColors[passwordStrength - 1]} transition-all duration-300`}
                />
              </div>
              <ul className="mt-3 space-y-2 text-xs text-[#6B7280] dark:text-gray-400">
                <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? 'text-[#10B981]' : ''}`}>
                  {formData.newPassword.length >= 8 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                  {t('settings.security.minLength')}
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? 'text-[#10B981]' : ''}`}>
                  {/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                  {t('auth.uppercaseReq')}
                </li>
                <li className={`flex items-center gap-2 ${/\d/.test(formData.newPassword) ? 'text-[#10B981]' : ''}`}>
                  {/\d/.test(formData.newPassword) ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                  {t('auth.numberReq')}
                </li>
                <li className={`flex items-center gap-2 ${/[!@#$%^&*]/.test(formData.newPassword) ? 'text-[#10B981]' : ''}`}>
                  {/[!@#$%^&*]/.test(formData.newPassword) ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                  {t('auth.specialCharReq')}
                </li>
              </ul>
            </motion.div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#111827] dark:text-gray-100 mb-2">{t('settings.security.confirmPassword')}</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder={t('settings.security.confirmPassword')}
              className="w-full pl-10 pr-10 py-3 bg-[#F9FAFB] dark:bg-slate-800 border-2 border-[#E5E7EB] dark:border-slate-700 rounded-xl focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200 text-[#111827] dark:text-gray-100 placeholder-[#9CA3AF] dark:placeholder-gray-500"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
            <p className="text-xs text-[#10B981] mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              {t('settings.security.updateSuccess')}
            </p>
          )}
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="text-xs text-[#EF4444] mt-2">{t('settings.security.mismatch')}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {t('common.save')}
          </Button>
        </div>
      </motion.form>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl"
      >
        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">💡 {t('dashboard.personalizedAdvice')}</p>
        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>{t('auth.chooseStrongPassword')}</li>
          <li>{t('settings.security.passwordSubtitle')}</li>
        </ul>
      </motion.div>
    </div>
  );
}
