import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '../components/button';
import { authService } from '../../lib/services/auth.service';
import toast from 'react-hot-toast';

interface TwoFactorSettingsProps {
  onBack: () => void;
}

export function TwoFactorSettings({ onBack }: TwoFactorSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [disableMode, setDisableMode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await authService.get2FAStatus();
      setIsEnabled(status.enabled);
    } catch {
      toast.error('Erreur lors du chargement du statut 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const result = await authService.generate2FA();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setSetupMode(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la génération');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    if (code.length !== 6) return;
    setActionLoading(true);
    try {
      await authService.enable2FA(code);
      setIsEnabled(true);
      setSetupMode(false);
      setCode('');
      toast.success('2FA activé avec succès !');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Code invalide');
      setCode('');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (code.length !== 6) return;
    setActionLoading(true);
    try {
      await authService.disable2FA(code);
      setIsEnabled(false);
      setDisableMode(false);
      setCode('');
      toast.success('2FA désactivé');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Code invalide');
      setCode('');
    } finally {
      setActionLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Secret copié !');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Retour</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Authentification 2FA</h2>
          <p className="text-xs text-[#6B7280]">Renforcez la sécurité de votre compte</p>
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          rounded-2xl border-2 p-6 transition-all duration-200
          ${isEnabled
            ? 'bg-gradient-to-br from-[#10B981]/5 to-[#06B6D4]/5 border-[#10B981]/30 shadow-lg shadow-[#10B981]/5'
            : 'bg-gradient-to-br from-[#F59E0B]/5 to-[#FCD34D]/5 border-[#F59E0B]/30 shadow-lg shadow-[#F59E0B]/5'
          }
        `}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-[#10B981]/10' : 'bg-[#F59E0B]/10'}`}>
            {isEnabled ? (
              <ShieldCheck className="w-6 h-6 text-[#10B981]" />
            ) : (
              <ShieldOff className="w-6 h-6 text-[#F59E0B]" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${isEnabled ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
              {isEnabled ? '2FA Activé' : '2FA Désactivé'}
            </h3>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {isEnabled
                ? 'Votre compte est protégé par une authentification à deux facteurs'
                : 'Activez le 2FA pour une meilleure sécurité'}
            </p>
          </div>
          <AnimatePresence>
            {!setupMode && !disableMode && (
              <Button
                onClick={isEnabled ? () => setDisableMode(true) : handleGenerate}
                loading={actionLoading}
                size="sm"
                variant={isEnabled ? 'outline' : undefined}
              >
                {isEnabled ? 'Désactiver' : 'Activer'}
              </Button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Setup Mode */}
      <AnimatePresence>
        {setupMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
          >
            <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#8B5CF6]" />
              Configuration du 2FA
            </h3>

            <div className="space-y-6">
              {/* Step 1 */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <span className="ml-3 font-semibold text-[#111827]">Scannez le code QR</span>
                </div>
                <p className="text-sm text-[#6B7280] mb-4 ml-11">
                  Utilisez Google Authenticator, Authy, Microsoft Authenticator ou une autre application d'authentification
                </p>
                {qrCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-11 flex justify-center p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]"
                  >
                    <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                  </motion.div>
                )}
              </div>

              <div className="h-px bg-[#E5E7EB]" />

              {/* Step 2 */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <span className="ml-3 font-semibold text-[#111827]">Entrez le code manuellement</span>
                </div>
                <p className="text-sm text-[#6B7280] mb-3 ml-11">Si vous ne pouvez pas scanner le QR code :</p>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-11 flex items-center gap-2 p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] hover:border-[#8B5CF6]/30 transition-colors"
                >
                  <code className="flex-1 text-sm font-mono text-[#111827] break-all tracking-widest">
                    {secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-[#6B7280] hover:text-[#8B5CF6]"
                  >
                    {copied ? <Check className="w-5 h-5 text-[#10B981]" /> : <Copy className="w-5 h-5" />}
                  </button>
                </motion.div>
              </div>

              <div className="h-px bg-[#E5E7EB]" />

              {/* Step 3 */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <span className="ml-3 font-semibold text-[#111827]">Vérifiez le code</span>
                </div>
                <p className="text-sm text-[#6B7280] mb-3 ml-11">Entrez le code à 6 chiffres de votre application</p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl tracking-[0.3em] px-4 py-4 bg-white border-2 border-[#E5E7EB] rounded-xl text-[#111827] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all font-bold"
                  placeholder="000000"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setSetupMode(false);
                  setCode('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleEnable}
                loading={actionLoading}
                disabled={code.length !== 6}
                className="flex-1"
              >
                Activer le 2FA
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disable Mode */}
      <AnimatePresence>
        {disableMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
          >
            <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-[#EF4444]" />
              Désactiver le 2FA
            </h3>
            <p className="text-sm text-[#6B7280] mb-6">
              Entrez un code de votre application d'authentification pour confirmer la désactivation de la protection 2FA.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-3xl tracking-[0.3em] px-4 py-4 bg-[#FEF2F2] border-2 border-[#FED7AA] rounded-xl text-[#111827] focus:outline-none focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20 transition-all font-bold mb-6"
              placeholder="000000"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDisableMode(false);
                  setCode('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDisable}
                loading={actionLoading}
                disabled={code.length !== 6}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white"
              >
                Confirmer la désactivation
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      {!setupMode && !disableMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-2xl"
        >
          <p className="text-sm font-medium text-[#8B5CF6] mb-2">ℹ️ Qu'est-ce que l'authentification 2FA ?</p>
          <p className="text-sm text-[#6B7280]">
            L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte en requérant un code temporaire en plus de votre mot de passe lors de la connexion.
          </p>
        </motion.div>
      )}
    </div>
  );
}
