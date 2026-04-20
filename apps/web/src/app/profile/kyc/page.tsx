'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, Clock, XCircle, ChevronRight, Upload, User, CreditCard, Camera } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/components/i18n/I18nProvider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type KYCStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

interface KYCState {
  kycStatus: KYCStatus;
  kycFirstName?: string;
  kycLastName?: string;
  kycIdType?: string;
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  kycRejectedAt?: string;
  kycRejectReason?: string;
}

const STATUS_CONFIG = {
  PENDING:   { icon: Shield,       color: 'text-gray-400',    bg: 'bg-gray-400/10' },
  SUBMITTED: { icon: Clock,        color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
  VERIFIED:  { icon: CheckCircle,  color: 'text-green-400',   bg: 'bg-green-400/10' },
  REJECTED:  { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-400/10' },
};

export default function KYCPage() {
  const router = useRouter();
  const { t } = useI18n();
  const idToken = useAuthStore((s) => s.tokens?.idToken ?? '');
  const [kyc, setKyc] = useState<KYCState | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idType, setIdType] = useState('CNI');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');

  useEffect(() => {
    if (!idToken) return;
    fetch(`${API}/users/kyc/status`, { headers: { Authorization: `Bearer ${idToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setKyc(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [idToken]);

  const handleFileChange = (file: File, type: 'idPhoto' | 'selfie') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'idPhoto') { setIdPhotoFile(file); setIdPhotoPreview(result); }
      else { setSelfieFile(file); setSelfiePreview(result); }
    };
    reader.readAsDataURL(file);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !idNumber.trim()) {
      setError(t('kyc.step1.requiredError')); return;
    }
    setSubmitting(true); setError('');
    try {
      const idPhotoUrl = idPhotoFile ? await toBase64(idPhotoFile) : undefined;
      const selfieUrl = selfieFile ? await toBase64(selfieFile) : undefined;

      const res = await fetch(`${API}/users/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), idType, idNumber: idNumber.trim(), idPhotoUrl, selfieUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la soumission');
      setKyc({ kycStatus: 'SUBMITTED', kycFirstName: firstName, kycLastName: lastName, kycIdType: idType, kycSubmittedAt: new Date().toISOString() });
      setSuccess(true);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    );
  }

  const currentStatus = kyc?.kycStatus ?? 'PENDING';
  const StatusIcon = STATUS_CONFIG[currentStatus].icon;

  if (currentStatus === 'VERIFIED') {
    return (
      <div className="min-h-screen">
        <main className="pb-12">
          <Container>
            <div className="max-w-md mx-auto mt-12">
              <div className="rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 p-8 text-center shadow-xl">
                <div className="w-20 h-20 rounded-full bg-green-400/15 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h1 className="text-2xl font-black dark:text-white text-[#00165F] mb-2">{t('kyc.verified.title')}</h1>
                <p className="text-sm dark:text-white/60 text-[#00165F]/60 mb-1">
                  {kyc?.kycFirstName} {kyc?.kycLastName}
                </p>
                <p className="text-xs text-green-400 mb-6">{t('kyc.verified.unlocked')}</p>
                <button onClick={() => router.push('/wallet')} className="w-full py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:bg-[#0097FC]/90 transition-colors">
                  {t('kyc.verified.goWallet')}
                </button>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  if (currentStatus === 'SUBMITTED' && !success) {
    return (
      <div className="min-h-screen">
        <main className="pb-12">
          <Container>
            <div className="max-w-md mx-auto mt-12">
              <div className="rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 p-8 text-center shadow-xl">
                <div className="w-20 h-20 rounded-full bg-yellow-400/15 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-yellow-400" />
                </div>
                <h1 className="text-2xl font-black dark:text-white text-[#00165F] mb-2">{t('kyc.submitted.title')}</h1>
                <p className="text-sm dark:text-white/60 text-[#00165F]/60 mb-1">
                  {kyc?.kycFirstName} {kyc?.kycLastName} · {kyc?.kycIdType}
                </p>
                <p className="text-xs text-yellow-400 mb-6">{t('kyc.submitted.processing')}</p>
                <div className="rounded-xl bg-yellow-400/5 border border-yellow-400/20 p-4 text-left text-xs dark:text-white/60 text-[#00165F]/60">
                  <p className="font-semibold mb-1 dark:text-white text-[#00165F]">{t('kyc.submitted.next')}</p>
                  <p>• {t('kyc.submitted.next.1')}</p>
                  <p>• {t('kyc.submitted.next.2')}</p>
                  <p>• {t('kyc.submitted.next.3')}</p>
                </div>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
          <div className="max-w-lg mx-auto mt-8">

            {/* Header */}
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0097FC] to-[#00165F]">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black dark:text-white text-[#00165F]">{t('kyc.title')}</h1>
                <p className="text-sm dark:text-white/60 text-[#00165F]/60">{t('kyc.subtitle')}</p>
              </div>
            </div>

            {/* Statut rejeté */}
            {currentStatus === 'REJECTED' && (
              <div className="rounded-xl bg-red-400/10 border border-red-400/30 p-4 mb-4">
                <p className="text-sm font-bold text-red-400 mb-1">{t('kyc.rejected.title')}</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">{t('kyc.rejected.reason')} {kyc?.kycRejectReason ?? t('kyc.rejected.unspecified')}</p>
                <p className="text-xs text-red-400 mt-1">{t('kyc.rejected.retry')}</p>
              </div>
            )}

            {/* Steps indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    step > s ? 'bg-green-400 text-white' : step === s ? 'bg-[#0097FC] text-white' : 'dark:bg-white/10 bg-gray-100 dark:text-white/40 text-[#00165F]/40'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 3 && <div className={`h-0.5 flex-1 transition-colors ${step > s ? 'bg-green-400' : 'dark:bg-white/10 bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <div className="rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 shadow-xl overflow-hidden">

              {/* Étape 1 — Informations personnelles */}
              {step === 1 && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-[#0097FC]" />
                    <h2 className="font-black dark:text-white text-[#00165F]">{t('kyc.step1.title')}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">{t('kyc.step1.firstName')}</label>
                      <input
                        value={firstName} onChange={e => setFirstName(e.target.value)}
                        placeholder="Jean"
                        className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] text-sm focus:outline-none focus:border-[#0097FC]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">{t('kyc.step1.lastName')}</label>
                      <input
                        value={lastName} onChange={e => setLastName(e.target.value)}
                        placeholder="Dupont"
                        className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] text-sm focus:outline-none focus:border-[#0097FC]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">{t('kyc.step1.idType')}</label>
                    <select
                      value={idType} onChange={e => setIdType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] text-sm focus:outline-none focus:border-[#0097FC] appearance-none cursor-pointer [&>option]:bg-[#00165F] [&>option]:text-white"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="CNI">{t('kyc.step1.idType.cni')}</option>
                      <option value="PASSEPORT">{t('kyc.step1.idType.passport')}</option>
                      <option value="PERMIS">{t('kyc.step1.idType.license')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">{t('kyc.step1.idNumber')}</label>
                    <input
                      value={idNumber} onChange={e => setIdNumber(e.target.value)}
                      placeholder="ex: 12345678"
                      className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] text-sm focus:outline-none focus:border-[#0097FC]"
                    />
                  </div>

                  <button
                    onClick={() => { if (!firstName.trim() || !lastName.trim() || !idNumber.trim()) { setError(t('kyc.step1.requiredError')); return; } setError(''); setStep(2); }}
                    className="w-full py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:bg-[#0097FC]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {t('kyc.step1.continue')} <ChevronRight className="w-4 h-4" />
                  </button>
                  {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                </div>
              )}

              {/* Étape 2 — Upload documents */}
              {step === 2 && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-[#0097FC]" />
                    <h2 className="font-black dark:text-white text-[#00165F]">{t('kyc.step2.title')}</h2>
                  </div>

                  {/* Photo pièce */}
                  <div>
                    <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-2 block">
                      {t('kyc.step2.idPhoto')}
                    </label>
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, 'idPhoto'); }} />
                      <div className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-colors ${
                        idPhotoPreview ? 'border-green-400/40 bg-green-400/5' : 'dark:border-white/20 border-gray-300 hover:border-[#0097FC]/50'
                      }`}>
                        {idPhotoPreview
                          ? <img src={idPhotoPreview} alt="pièce" className="max-h-32 rounded-lg object-contain" />
                          : <>
                              <Upload className="w-8 h-8 dark:text-white/30 text-gray-400 mb-2" />
                              <p className="text-xs dark:text-white/60 text-[#00165F]/60">{t('kyc.step2.upload')}</p>
                            </>
                        }
                      </div>
                    </label>
                  </div>

                  {/* Selfie */}
                  <div>
                    <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-2 block">
                      {t('kyc.step2.selfie')}
                    </label>
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, 'selfie'); }} />
                      <div className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-colors ${
                        selfiePreview ? 'border-green-400/40 bg-green-400/5' : 'dark:border-white/20 border-gray-300 hover:border-[#0097FC]/50'
                      }`}>
                        {selfiePreview
                          ? <img src={selfiePreview} alt="selfie" className="max-h-32 rounded-lg object-contain" />
                          : <>
                              <Camera className="w-8 h-8 dark:text-white/30 text-gray-400 mb-2" />
                              <p className="text-xs dark:text-white/60 text-[#00165F]/60">{t('kyc.step2.selfieHint')}</p>
                            </>
                        }
                      </div>
                    </label>
                  </div>

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border dark:border-white/20 border-gray-300 text-sm font-semibold dark:text-white/70 text-[#00165F]/70">
                      {t('kyc.step2.back')}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-2 flex-1 py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:bg-[#0097FC]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('kyc.step2.submitting')}</>
                        : t('kyc.step2.submit')}
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 3 — Confirmation */}
              {step === 3 && (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/15 flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-black dark:text-white text-[#00165F]">{t('kyc.step3.title')}</h2>
                  <p className="text-sm dark:text-white/60 text-[#00165F]/60">
                    {t('kyc.step3.processing')}<br />
                    {t('kyc.step3.delay')}
                  </p>
                  <div className="rounded-xl bg-[#0097FC]/5 border border-[#0097FC]/20 p-4 text-left space-y-1">
                    <p className="text-xs dark:text-white/50 text-[#00165F]/50">{t('kyc.step3.recap')}</p>
                    <p className="text-sm dark:text-white text-[#00165F] font-semibold">{firstName} {lastName}</p>
                    <p className="text-xs dark:text-white/60 text-[#00165F]/60">{idType} · N° {idNumber}</p>
                  </div>
                  <button onClick={() => router.push('/wallet')} className="w-full py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:bg-[#0097FC]/90 transition-colors">
                    {t('kyc.step3.backWallet')}
                  </button>
                </div>
              )}
            </div>

            {/* Info légale */}
            <p className="text-[10px] dark:text-white/30 text-[#00165F]/30 text-center mt-4">
              {t('kyc.legal')}
            </p>
          </div>
        </Container>
      </main>
    </div>
  );
}
