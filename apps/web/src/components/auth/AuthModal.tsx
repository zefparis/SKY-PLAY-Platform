"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Eye, EyeOff, Mail, Lock,
  ArrowLeft, CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { useAuthStore } from '@/features/auth/auth.store'
import { getOAuthRedirectUri } from '@/lib/oauth'

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: View;
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

type View = 'login' | 'signup' | 'pending' | 'forgot' | 'reset'

function LoginView({ setView }: { setView: (v: View) => void }) {
  const login = useAuthStore((s) => s.login)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const loginWithGoogle = () => {
    // redirection OAuth gérée par la page /auth/callback via Cognito (déjà en place)
    const domain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
    const redirectUri = getOAuthRedirectUri()
    if (!domain || !clientId) return
    const url = new URL(`${domain.replace(/\/+$/, "")}/oauth2/authorize`)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'email openid profile')
    url.searchParams.set('redirect_uri', redirectUri)
    window.location.assign(url.toString())
  }
  const loginWithDiscord = () => {
    const domain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
    const redirectUri = getOAuthRedirectUri()
    if (!domain || !clientId) return
    const url = new URL(`${domain.replace(/\/+$/, "")}/oauth2/authorize`)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'email openid profile')
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('identity_provider', 'Discord')
    window.location.assign(url.toString())
  }
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const loading = status === 'authenticating'
  useEffect(() => {
    setEmailVal("");
    setPassword("");
    setShowPwd(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Connexion</h2>
        <p className="text-sm text-white/40">Accède à ton espace SkyPlay</p>
      </div>
      {error && <Banner type="error" message={error} />}
      <Field icon={Mail} type="email" placeholder="Email" value={emailVal} onChange={setEmailVal} autoFocus />
      <div>
        <Field icon={Lock} type="password" placeholder="Mot de passe" value={password}
          onChange={setPassword} reveal={showPwd} onToggleReveal={() => setShowPwd(!showPwd)} />
        <div className="flex justify-end mt-2">
          <button onClick={() => setView("forgot")} className={BTN_GHOST}>
            Mot de passe oublié ?
          </button>
        </div>
      </div>
      <button
        onClick={() => login({ email: emailVal, password })}
        disabled={loading || !emailVal || !password}
        className={BTN_PRIMARY}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Se connecter
      </button>

      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-white/40 mb-3">Social login</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={loginWithGoogle} className={BTN_PRIMARY}>
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.847 32.659 29.303 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 19.0 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.338 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.185 35.091 26.715 36 24 36c-5.283 0-9.82-3.324-11.29-7.957l-6.52 5.02C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.706 2.058-2.02 3.8-3.784 5.07l.003-.002 6.19 5.238C36.4 39.5 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Google
            </span>
          </button>
          <button type="button" onClick={loginWithDiscord} className={BTN_PRIMARY}>
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#5865F2" d="M19.54 0.7a19.33 19.33 0 0 0-4.76 1.47c-.2.35-.39.73-.54 1.12a18.4 18.4 0 0 0-5.48 0c-.15-.39-.34-.77-.54-1.12A19.33 19.33 0 0 0 3.46.7C.46 5.1-.32 9.4.07 13.64c1.75 1.3 3.45 2.1 5.13 2.63.41-.56.78-1.16 1.09-1.8-.6-.23-1.18-.51-1.74-.83.15-.11.3-.23.44-.35 3.36 1.58 7.0 1.58 10.32 0 .14.12.29.24.44.35-.56.32-1.14.6-1.74.83.31.64.68 1.24 1.09 1.8 1.68-.53 3.38-1.33 5.13-2.63.45-4.9-.77-9.17-3.66-12.94ZM8.68 12.65c-.95 0-1.72-.87-1.72-1.94 0-1.07.76-1.94 1.72-1.94.96 0 1.73.87 1.72 1.94 0 1.07-.76 1.94-1.72 1.94Zm6.64 0c-.95 0-1.72-.87-1.72-1.94 0-1.07.76-1.94 1.72-1.94.96 0 1.73.87 1.72 1.94 0 1.07-.76 1.94-1.72 1.94Z"/>
              </svg>
              Discord
            </span>
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-white/30">
        Pas encore de compte ?{" "}
        <button onClick={() => setView("signup")} className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
          Créer un compte
        </button>
      </p>
    </div>
  );
}

function SignupView({ setView }: { setView: (v: View) => void }) {
  const signup = useAuthStore((s) => s.signup)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const loginWithGoogle = () => {
    const domain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
    const redirectUri = getOAuthRedirectUri()
    if (!domain || !clientId) return
    const url = new URL(`${domain.replace(/\/+$/, "")}/oauth2/authorize`)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'email openid profile')
    url.searchParams.set('redirect_uri', redirectUri)
    window.location.assign(url.toString())
  }
  const loginWithDiscord = () => {
    const domain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
    const redirectUri = getOAuthRedirectUri()
    if (!domain || !clientId) return
    const url = new URL(`${domain.replace(/\/+$/, "")}/oauth2/authorize`)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'email openid profile')
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('identity_provider', 'Discord')
    window.location.assign(url.toString())
  }
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const loading = status === 'authenticating'

  useEffect(() => {
    setEmailVal("");
    setPassword("");
    setConfirm("");
    setShowPwd(false);
  }, []);

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
      <button
        onClick={() => signup({ email: emailVal, password })}
        disabled={loading || !emailVal || !password || password !== confirm} className={BTN_PRIMARY}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Créer mon compte
      </button>

      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-white/40 mb-3">Ou continuer avec</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={loginWithGoogle} className={BTN_PRIMARY}>
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.847 32.659 29.303 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 19.0 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.338 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.185 35.091 26.715 36 24 36c-5.283 0-9.82-3.324-11.29-7.957l-6.52 5.02C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.706 2.058-2.02 3.8-3.784 5.07l.003-.002 6.19 5.238C36.4 39.5 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Google
            </span>
          </button>
          <button type="button" onClick={loginWithDiscord} className={BTN_PRIMARY}>
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#5865F2" d="M19.54 0.7a19.33 19.33 0 0 0-4.76 1.47c-.2.35-.39.73-.54 1.12a18.4 18.4 0 0 0-5.48 0c-.15-.39-.34-.77-.54-1.12A19.33 19.33 0 0 0 3.46.7C.46 5.1-.32 9.4.07 13.64c1.75 1.3 3.45 2.1 5.13 2.63.41-.56.78-1.16 1.09-1.8-.6-.23-1.18-.51-1.74-.83.15-.11.3-.23.44-.35 3.36 1.58 7.0 1.58 10.32 0 .14.12.29.24.44.35-.56.32-1.14.6-1.74.83.31.64.68 1.24 1.09 1.8 1.68-.53 3.38-1.33 5.13-2.63.45-4.9-.77-9.17-3.66-12.94ZM8.68 12.65c-.95 0-1.72-.87-1.72-1.94 0-1.07.76-1.94 1.72-1.94.96 0 1.73.87 1.72 1.94 0 1.07-.76 1.94-1.72 1.94Zm6.64 0c-.95 0-1.72-.87-1.72-1.94 0-1.07.76-1.94 1.72-1.94.96 0 1.73.87 1.72 1.94 0 1.07-.76 1.94-1.72 1.94Z"/>
              </svg>
              Discord
            </span>
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-white/30">
        Déjà un compte ?{" "}
        <button onClick={() => setView("login")} className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
          Se connecter
        </button>
      </p>
    </div>
  );
}

// ─── Nouvelle vue PendingView ────────────────────────────────────────────────
function PendingView({ setView }: { setView: (v: View) => void }) {
  const email = useAuthStore((s) => s.email)
  const confirmSignup = useAuthStore((s) => s.confirmSignup)
  const resendSignupCode = useAuthStore((s) => s.resendSignupCode)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);
  const loading = status === 'authenticating'

  useEffect(() => {
    setCode("");
    setResent(false);
  }, []);

  const handleConfirm = async () => {
    if (code.replace(/\D/g, "").length !== 6) return;
    await confirmSignup({ code: code.replace(/\D/g, "") });
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

      <button onClick={() => setView("signup")} className={`${BTN_GHOST} mx-auto`}>
        <ArrowLeft className="w-3 h-3" /> Retour
      </button>
    </div>
  );
}


function ForgotView({ setView }: { setView: (v: View) => void }) {
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const [emailVal, setEmailVal] = useState("");
  const [sent, setSent] = useState(false);
  const loading = status === 'authenticating'
  
  useEffect(() => {
    setEmailVal("");
    setSent(false);
  }, []);

  const handleSubmit = async () => {
    if (!emailVal) return;
    await forgotPassword({ email: emailVal });
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
      <button onClick={() => setView("reset")} className={BTN_PRIMARY}>Entrer mon code</button>
      <button onClick={() => setView("login")} className={`${BTN_GHOST} mx-auto`}>
        <ArrowLeft className="w-3 h-3" /> Retour à la connexion
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => setView("login")} className={BTN_GHOST}>
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

function ResetView({ setView, email }: { setView: (v: View) => void; email: string }) {
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);
  const loading = status === 'authenticating'

  useEffect(() => {
    setCode("");
    setPassword("");
    setConfirm("");
    setShowPwd(false);
    setDone(false);
  }, []);

  const handleSubmit = async () => {
    if (code.length !== 6 || !password || password !== confirm) return;
    await resetPassword({ email, code, newPassword: password });
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
      <button onClick={() => setView("login")} className={BTN_PRIMARY}>Se connecter</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => setView("forgot")} className={BTN_GHOST}>
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
  const [view, setView] = useState<View>(defaultView as View)
  const tokens = useAuthStore((s) => s.tokens)
  const storeEmail = useAuthStore((s) => s.email)

  useEffect(() => { if (tokens) onClose(); }, [tokens]);
  useEffect(() => { if (isOpen) setView(defaultView as View); }, [isOpen, defaultView]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const views: Record<View, React.ReactNode> = {
    login:   <LoginView setView={setView} />,
    signup:  <SignupView setView={setView} />,
    pending: <PendingView setView={setView} />,
    forgot:  <ForgotView setView={setView} />,
    reset:   <ResetView setView={setView} email={storeEmail || ''} />,
  };

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
                    <motion.div key={view}
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18, ease: "easeInOut" }}>
                      {views[view]}
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