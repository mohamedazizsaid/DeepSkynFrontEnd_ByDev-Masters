import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

interface SignUpPageProps {
  onSignUp: () => void;
  onLogin: () => void;
  onBack: () => void;
}

export function SignUpPage({ onSignUp, onLogin, onBack }: SignUpPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: '#EF4444' };
    if (password.length < 10) return { strength: 2, label: 'Medium', color: '#F59E0B' };
    return { strength: 3, label: 'Strong', color: '#10B981' };
  };

  const strength = passwordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    
    setLoading(true);
    // Simulate signup
    setTimeout(() => {
      setLoading(false);
      onSignUp();
    }, 1500);
  };

  const handleGoogleSignUp = () => {
    setTimeout(() => {
      onSignUp();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-white to-[#F9FAFB] flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
              DeepSkyn
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-[#6B7280]">Start your journey to better skin</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={<User className="w-5 h-5" />}
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <div>
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1 rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(strength.strength / 3) * 100}%`,
                          backgroundColor: strength.color
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              icon={<Lock className="w-5 h-5" />}
              error={
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? "Passwords don't match"
                  : undefined
              }
              required
            />

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-[#E5E7EB] text-[#0EA5E9] focus:ring-[#0EA5E9] cursor-pointer"
                />
              </div>
              <span className="text-sm text-[#6B7280]">
                I agree to the{' '}
                <a href="#" className="text-[#0EA5E9] hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#0EA5E9] hover:underline">Privacy Policy</a>
              </span>
            </label>

            <Button 
              type="submit" 
              className="w-full" 
              loading={loading}
              disabled={!agreedToTerms || formData.password !== formData.confirmPassword}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#6B7280]">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignUp}
              className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-[#E5E7EB] rounded-xl hover:border-[#0EA5E9] hover:bg-[#F9FAFB] transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-[#374151]">Continue with Google</span>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <button
              onClick={onLogin}
              className="text-[#0EA5E9] font-medium hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
