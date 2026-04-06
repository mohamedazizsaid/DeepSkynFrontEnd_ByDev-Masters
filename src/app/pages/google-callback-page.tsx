import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../components/button';
import { authService } from '../../lib/services/auth.service';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['admin', 'ADMIN', 'realm-admin', 'super_admin', 'administrator'];

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadUser } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | '2fa'>('loading');
  const [error, setError] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSubmitting2fa, setIsSubmitting2fa] = useState(false);

  const resolvePostAuthPath = () => {
    const roles = useAuthStore.getState().roles;
    const isAdmin = roles.some(role => ADMIN_ROLES.includes(role));
    const isNewUser = searchParams.get('isNewUser') === 'true';
    return isAdmin ? '/dashboard' : (isNewUser ? '/onboarding' : '/dashboard');
  };

  useEffect(() => {
    const handleCallback = async () => {
      const userId = searchParams.get('userId');
      const email = searchParams.get('email');
      const requires2fa = searchParams.get('requires_2fa') === 'true';
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (!userId || !email) {
        setStatus('error');
        setError('Paramètres manquants dans la redirection');
        return;
      }

      if (requires2fa) {
        setStatus('2fa');
        return;
      }

      try {
        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        await loadUser();
        setStatus('success');

        const nextPath = resolvePostAuthPath();
        setTimeout(() => {
          navigate(nextPath);
        }, 1500);
      } catch {
        setStatus('error');
        setError('Erreur d\'authentification.');
      }
    };

    handleCallback();
  }, [searchParams, loadUser, navigate]);

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) return;

    setIsSubmitting2fa(true);
    try {
      const email = searchParams.get('email');
      // On utilise le service pour vérifier le 2FA social
      const response = await (authService as any).verifySocial2fa(email, twoFactorCode);

      if (response.tokens) {
        localStorage.setItem('access_token', response.tokens.access_token);
        localStorage.setItem('refresh_token', response.tokens.refresh_token || '');
      }

      await loadUser();
      setStatus('success');

      const nextPath = resolvePostAuthPath();
      setTimeout(() => {
        navigate(nextPath);
      }, 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Code 2FA invalide');
      setTwoFactorCode('');
    } finally {
      setIsSubmitting2fa(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative" style={{ zIndex: 1 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB] text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-[#0EA5E9]" />
              <h1 className="text-2xl font-bold mb-2">Connexion en cours...</h1>
              <p className="text-[#6B7280]">Vérification de votre compte</p>
            </>
          )}

          {status === '2fa' && (
            <form onSubmit={handle2faSubmit} className="space-y-6">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-[#0EA5E9]" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Authentification 2FA</h1>
              <p className="text-[#6B7280] mb-6">
                Veuillez entrer le code de votre application pour confirmer la connexion.
              </p>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl tracking-[0.5em] px-4 py-4 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-2xl focus:outline-none focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 transition-all font-mono"
                placeholder="000000"
                autoFocus
                disabled={isSubmitting2fa}
              />
              <Button type="submit" className="w-full" loading={isSubmitting2fa} disabled={twoFactorCode.length !== 6}>
                Vérifier et continuer
              </Button>
            </form>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#10B981]/10 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-[#10B981]" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Connexion réussie !</h1>
              <p className="text-[#6B7280]">Redirection en cours...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-[#EF4444]" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Erreur</h1>
              <p className="text-[#6B7280] mb-6">{error}</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Retour à la connexion
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
