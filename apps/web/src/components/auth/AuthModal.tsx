"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Eye, EyeOff, Mail, Lock,
  ArrowLeft, CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import type { AuthStep } from "@/lib/auth-store";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: AuthStep;
}

const INPUT_BASE =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/20";

const BTN_PRIMARY =
  "w-full py-3 px-6 rounded-xl font-semibold text-sm tracking-wide bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2";

const BTN_GHOST =
  "text-xs text-white/40 hover:text-white/70 transition-colors duration-200 flex items-center gap-1";

function Field({ icon: Icon, type = "text", placeholder, value, onChange, reveal, onToggleReveal, autoFocus }: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  reveal?: boolean; onToggleReveal?: () => void; autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
      <input
        type={type === "password" ? (reveal ? "text" : "password") : type}
        placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : undefined}
        className={INPUT_BASE}
      />
      {type === "password" && onToggleReveal && (
        <button type="button" onClick={onToggleReveal}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
          {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function Banner({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
        type === "error"
          ? "bg-red-500/10 border border-red-500/20 text-red-300"
          : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
      }`}>
      {type === "error"
        ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{message}</span>
    </motion.div>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      onChange(digits.map((d, idx) => (idx === i ? "" : d)).join(""));
      if (i > 0) inputRefs[i - 1].current?.focus();
    }
  };
  const handleChange = (i: number, v: string) => {
    const char = v.replace(/\D/g, "").slice(-1);
    onChange(digits.map((d, idx) => (idx === i ? char : d)).join("").trimEnd());
    if (char && i < 5) inputRefs[i + 1].current?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputRefs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input key={i} ref={inputRefs[i]} type="text" inputMode="numeric" maxLength={1}
          value={d} onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)} onPaste={handlePaste} autoFocus={i === 0}
          className={`w-11 h-12 rounded-xl border text-center text-lg font-bold bg-white/5 text-white outline-none transition-all duration-200 ${
            d ? "border-sky-400/60 bg-sky-400/10" : "border-white/10 focus:border-sky-400/40"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

function LoginView() {
  const { login, loading, error, setStep, setError } = useAuthStore();
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  useEffect(() => { setError(undefined); }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Connexion</h2>
        <p className="text-sm text-white/40">Accède à ton espace SkyPlay</p>
      </div>
      {error && <Banner type="error" message={error} />}
      <Field icon={Mail} type="email" placeholder="Email" value={emailVal} onChange={setEmailVal} autoFocus />
      <Field icon={Lock} type="password" placeholder="Mot de passe" value={password}
        onChange={setPassword} reveal={showPwd} onToggleReveal={() => setShowPwd(!showPwd)} />
      <button onClick={() => setStep("forgot")} className={`${BTN_GHOST} ml-auto block`}>
        Mot de passe oublié ?
      </button>
      <button onClick={() => login(emailVal, password)}
        disabled={loading || !emailVal || !password} className={BTN_PRIMARY}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Se connecter
      </button>
      <p className="text-center text-xs text-white/30">
        Pas encore de compte ?{" "}
        <button onClick={() => setStep("signup")} className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
          Créer un compte
        </button>
      </p>
    </div>
  );
}

function SignupView() {
  const { signup, loading, error, setStep, setError } = useAuthStore();
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  useEffect(() => { setError(undefined); }, []);

  const strength = !password ? 0 : [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Créer un compte</h2>
        <p className="text-sm text-white/40">Rejoins la communauté SkyPlay</p>
      </div>
      {error && <Banner type="error" message={error} />}
      <Field icon={Mail} type="email" placeholder="Email" value={emailVal} onChange={setEmailVal} autoFocus />
      <div>
        <Field icon={Lock} type="password" placeholder="Mot de passe" value={password}
          onChange={setPassword} reveal={showPwd} onToggleReveal={() => setShowPwd(!showPwd)} />
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[0,1,2,3].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  strength > i
                    ? ["bg-red-500","bg-orange-500","bg-yellow-500","bg-emerald-500"][strength - 1]
                    : "bg-white/10"
                }`} />
              ))}
            </div>
            <p className="text-xs text-white/30">
              {["Trop court","Faible","Moyen","Fort"][strength - 1] ?? "Trop court"}
            </p>
          </div>
        )}
      </div>
      <Field icon={Lock} type="password" placeholder="Confirmer le mot de passe" value={confirm}
        onChange={setConfirm} reveal={showPwd} onToggleReveal={() => setShowPwd(!showPwd)} />
      {confirm && password !== confirm && (
        <p className="text-xs text-red-400/80">Les mots de passe ne correspondent pas</p>
      )}
      {/* signup() appelle setStep("pending") en interne */}
      <button onClick={() => signup(emailVal, password)}
        disabled={loading || !emailVal || !password || password !== confirm} className={BTN_PRIMARY}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Créer mon compte
      </button>
      <p className="text-center text-xs text-white/30">
        Déjà un compte ?{" "}
        <button onClick={() => setStep("login")} className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
          Se connecter
        </button>
      </p>
    </div>
  );
}

// ─── Nouvelle vue PendingView ────────────────────────────────────────────────
function PendingView() {
  const { email, confirmSignup, resendSignupCode, loading, error, setStep, setError } = useAuthStore();
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    setError(undefined);
  }, []);

  const handleConfirm = async () => {
    if (code.replace(/\D/g, "").length !== 6) return;
    await confirmSignup(code.replace(/\D/g, ""));
  };

  const handleResend = async () => {
    await resendSignupCode();
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };
  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto">
        <Mail className="w-7 h-7 text-sky-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Vérifie ta boîte mail</h2>
        <p className="text-sm text-white/40 mt-1">
          Un code de confirmation a été envoyé à <span className="text-white/60 font-medium">{email}</span>.
        </p>
      </div>

      {error && <Banner type="error" message={error} />}
      {resent && <Banner type="success" message="Code renvoyé. Vérifie tes emails." />}

      <OtpInput value={code} onChange={setCode} />

      <button onClick={handleConfirm}
        disabled={loading || code.replace(/\D/g, "").length !== 6}
        className={BTN_PRIMARY}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirmer mon compte
      </button>

      <button onClick={handleResend} disabled={loading} className={`${BTN_GHOST} mx-auto`}>
        Renvoyer le code
      </button>

      <button onClick={() => setStep("signup")} className={`${BTN_GHOST} mx-auto`}>
        <ArrowLeft className="w-3 h-3" /> Retour
      </button>
    </div>
  );
}


function ForgotView() {
  // forgotPassword() appelle setStep("reset") en interne
  const { forgotPassword, loading, error, setStep, setError } = useAuthStore();
  const [emailVal, setEmailVal] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => { setError(undefined); }, []);

  const handleSubmit = async () => {
    if (!emailVal) return;
    await forgotPassword(emailVal);
    setSent(true);
  };

  if (sent) return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto">
        <Mail className="w-7 h-7 text-sky-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Email envoyé</h2>
        <p className="text-sm text-white/40 mt-1">Note le code reçu et clique ci-dessous.</p>
      </div>
      <button onClick={() => setStep("reset")} className={BTN_PRIMARY}>Entrer mon code</button>
      <button onClick={() => setStep("login")} className={`${BTN_GHOST} mx-auto`}>
        <ArrowLeft className="w-3 h-3" /> Retour à la connexion
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => setStep("login")} className={BTN_GHOST}>
          <ArrowLeft className="w-3 h-3" /> Retour
        </button>
        <div className="mt-4 space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Mot de passe oublié</h2>
          <p className="text-sm text-white/40">On t'envoie un code de réinitialisation</p>
        </div>
      </div>
      {error && <Banner type="error" message={error} />}
      <Field icon={Mail} type="email" placeholder="Email" value={emailVal} onChange={setEmailVal} autoFocus />
      <button onClick={handleSubmit} disabled={loading || !emailVal} className={BTN_PRIMARY}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Envoyer le code
      </button>
    </div>
  );
}

function ResetView() {
  // resetPassword(code, newPassword) utilise get().email en interne
  const { resetPassword, loading, error, setStep, setError } = useAuthStore();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { setError(undefined); }, []);

  const handleSubmit = async () => {
    if (code.length !== 6 || !password || password !== confirm) return;
    await resetPassword(code, password);
    setDone(true);
  };

  if (done) return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
        <CheckCircle className="w-7 h-7 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Mot de passe mis à jour</h2>
        <p className="text-sm text-white/40 mt-1">Tu peux maintenant te connecter.</p>
      </div>
      <button onClick={() => setStep("login")} className={BTN_PRIMARY}>Se connecter</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => setStep("forgot")} className={BTN_GHOST}>
          <ArrowLeft className="w-3 h-3" /> Retour
        </button>
        <div className="mt-4 space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Nouveau mot de passe</h2>
          <p className="text-sm text-white/40">Entre le code reçu par email</p>
        </div>
      </div>
      {error && <Banner type="error" message={error} />}
      <OtpInput value={code} onChange={setCode} />
      <Field icon={Lock} type="password" placeholder="Nouveau mot de passe" value={password}
        onChange={setPassword} reveal={showPwd} onToggleReveal={() => setShowPwd(!showPwd)} />
      <Field icon={Lock} type="password" placeholder="Confirmer" value={confirm}
        onChange={setConfirm} reveal={showPwd} onToggleReveal={() => setShowPwd(!showPwd)} />
      <button onClick={handleSubmit}
        disabled={loading || code.length !== 6 || !password || password !== confirm}
        className={BTN_PRIMARY}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Réinitialiser le mot de passe
      </button>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export function AuthModal({ isOpen, onClose, defaultView = "login" }: AuthModalProps) {
  const { tokens, step, setStep } = useAuthStore();

  useEffect(() => { if (tokens) onClose(); }, [tokens]);
  useEffect(() => { if (isOpen) setStep(defaultView); }, [isOpen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const views: Record<AuthStep, React.ReactNode> = {
    login:   <LoginView />,
    signup:  <SignupView />,
    pending: <PendingView />,
    forgot:  <ForgotView />,
    reset:   <ResetView />,
  };

  const currentView: AuthStep =
    step && (step in views) ? step : "login";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="relative rounded-2xl border border-white/10 bg-[#0a0f1e]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                <button onClick={onClose}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all duration-200">
                  <X className="w-4 h-4" />
                </button>
                <div className="px-8 pt-8 pb-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <span className="text-white font-black text-xs">SP</span>
                  </div>
                  <span className="text-white/60 text-sm font-semibold tracking-wider uppercase">SkyPlay</span>
                </div>
                <div className="px-8 pb-8 pt-4" style={{ minHeight: "340px" }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={currentView}
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18, ease: "easeInOut" }}>
                      {views[currentView]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}