import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, ShieldCheck, ShieldOff, ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
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
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Retour aux paramètres</span>
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Authentification à deux facteurs</h1>
          <p className="text-[#6B7280]">Renforcez la sécurité de votre compte</p>
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border-2 mb-6 ${
          isEnabled
            ? 'bg-[#10B981]/5 border-[#10B981]/20'
            : 'bg-[#F59E0B]/5 border-[#F59E0B]/20'
        }`}
      >
        <div className="flex items-center gap-4">
          {isEnabled ? (
            <ShieldCheck className="w-10 h-10 text-[#10B981]" />
          ) : (
            <ShieldOff className="w-10 h-10 text-[#F59E0B]" />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {isEnabled ? '2FA Activé' : '2FA Désactivé'}
            </h3>
            <p className="text-sm text-[#6B7280]">
              {isEnabled
                ? 'Votre compte est protégé par une authentification à deux facteurs'
                : 'Activez le 2FA pour une meilleure sécurité'}
            </p>
          </div>
          {!setupMode && !disableMode && (
            <Button
              variant={isEnabled ? 'outline' : 'primary'}
              onClick={isEnabled ? () => setDisableMode(true) : handleGenerate}
              loading={actionLoading}
            >
              {isEnabled ? 'Désactiver' : 'Activer'}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Setup Mode */}
      {setupMode && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-lg space-y-6">
          <h3 className="text-lg font-semibold">Configuration du 2FA</h3>

          <div className="space-y-4">
            <div className="text-sm text-[#6B7280]">
              <p className="font-medium text-[#111827] mb-2">Étape 1 : Scannez le QR Code</p>
              <p>Utilisez une application d'authentification (Google Authenticator, Authy, etc.)</p>
            </div>

            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-xl border border-[#E5E7EB]">
                <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
              </div>
            )}

            <div className="text-sm text-[#6B7280]">
              <p className="font-medium text-[#111827] mb-2">Ou entrez ce code manuellement :</p>
              <div className="flex items-center gap-2 p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <code className="flex-1 text-sm font-mono text-[#111827] break-all">{secret}</code>
                <button onClick={copySecret} className="p-1 hover:bg-[#E5E7EB] rounded transition-colors">
                  {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4 text-[#6B7280]" />}
                </button>
              </div>
            </div>

            <div>
              <p className="font-medium text-[#111827] text-sm mb-2">Étape 2 : Entrez le code de vérification</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl text-[#111827] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                placeholder="000000"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setSetupMode(false); setCode(''); }} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleEnable} loading={actionLoading} disabled={code.length !== 6} className="flex-1">
              Activer le 2FA
            </Button>
          </div>
        </motion.div>
      )}

      {/* Disable Mode */}
      {disableMode && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-lg space-y-6">
          <h3 className="text-lg font-semibold text-[#EF4444]">Désactiver le 2FA</h3>
          <p className="text-sm text-[#6B7280]">
            Entrez un code de votre application d'authentification pour confirmer la désactivation.
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl text-[#111827] focus:outline-none focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20 transition-all"
            placeholder="000000"
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setDisableMode(false); setCode(''); }} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleDisable}
              loading={actionLoading}
              disabled={code.length !== 6}
              className="flex-1 !bg-[#EF4444] hover:!bg-[#DC2626]"
            >
              Confirmer la désactivation
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
