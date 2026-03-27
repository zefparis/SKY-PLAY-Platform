// AuthStore Zustand pour gestion complète Cognito
import { create } from "zustand";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

export type AuthStep =
  | "login"
  | "signup"
  | "pending"
  | "forgot"
  | "reset";

export type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

export type AuthState = {
  step: AuthStep;
  email: string;
  loading: boolean;
  error?: string;
  tokens?: AuthTokens | null;
  user?: any; // Utilisateur synchronisé (type précis possible si DTO connu)

  setStep: (step: AuthStep) => void;
  setEmail: (email: string) => void;
  setError: (error?: string) => void;
  setLoading: (loading: boolean) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setUser: (user: any) => void;

  signup: (email: string, password: string) => Promise<void>;
  confirmSignup: (code: string) => Promise<void>;
  resendSignupCode: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithDiscord: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  step: "login",
  email: "",
  loading: false,
  error: undefined,
  tokens: null,
  user: undefined,

  setStep: (step) => set({ step, error: undefined }),
  setEmail: (email) => set({ email }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  setTokens: (tokens) => set({ tokens }),
  setUser: (user) => set({ user }),

  signup: async (email, password) => {
    set({ loading: true, error: undefined });
    try {
      const userPool = new CognitoUserPool({
        UserPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
        ClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID!,
      });
      await new Promise<void>((resolve, reject) => {
        userPool.signUp(
          email,
          password,
          [new CognitoUserAttribute({ Name: "email", Value: email })],
          [],
          async (err) => {
            if (err) {
              set({ error: err.message, loading: false });
              reject(err);
              return;
            }

            set({ email, step: "pending", loading: false, error: undefined });
            resolve();
          }
        );
      });
    } catch (e: any) {
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },

  confirmSignup: async (code) => {
    set({ loading: true, error: undefined });
    const email = get().email;
    try {
      const userPool = new CognitoUserPool({
        UserPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
        ClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID!,
      });
      const user = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      await new Promise<void>((resolve, reject) => {
        user.confirmRegistration(code, true, async (err) => {
          if (err) {
            set({ error: err.message, loading: false });
            reject(err);
            return;
          }
          set({ step: "login", loading: false, error: undefined });
          resolve();
        });
      });
    } catch (e: any) {
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },

  resendSignupCode: async () => {
    set({ loading: true, error: undefined });
    const email = get().email;
    try {
      const userPool = new CognitoUserPool({
        UserPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
        ClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID!,
      });
      const user = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      await new Promise<void>((resolve, reject) => {
        user.resendConfirmationCode((err) => {
          if (err) {
            set({ error: err.message, loading: false });
            reject(err);
            return;
          }
          // reste sur pending
          set({ loading: false, error: undefined });
          resolve();
        });
      });
    } catch (e: any) {
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },

  loginWithGoogle: () => {
    const domain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN;
    if (!domain || !clientId || !redirectUri) return;

    const url = new URL(`${domain.replace(/\/+$/, "")}/oauth2/authorize`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email openid profile");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("identity_provider", "Google");
    window.location.assign(url.toString());
  },

  loginWithDiscord: () => {
    const domain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN;
    if (!domain || !clientId || !redirectUri) return;

    const url = new URL(`${domain.replace(/\/+$/, "")}/oauth2/authorize`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email openid profile");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("identity_provider", "Discord");
    window.location.assign(url.toString());
  },
  login: async (email, password) => {
    set({ loading: true, error: undefined });
    try {
      const userPoolId = process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID;
      const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID;
      
      console.log('🔐 Login attempt:', { email, userPoolId, clientId });
      
      if (!userPoolId || !clientId) {
        throw new Error('Cognito configuration missing');
      }
      
      const userPool = new CognitoUserPool({
        UserPoolId: userPoolId,
        ClientId: clientId,
      });
      const user = new CognitoUser({
        Username: email,
        Pool: userPool,
      });
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });
      await new Promise<void>((resolve, reject) => {
        user.authenticateUser(authDetails, {
          onSuccess: async (session) => {
            set({
              tokens: {
                accessToken: session.getAccessToken().getJwtToken(),
                idToken: session.getIdToken().getJwtToken(),
                refreshToken: session.getRefreshToken().getToken(),
              },
              step: undefined as any, // Redirection vers l'app principale
              loading: false,
              error: undefined,
              email,
            });

            // Synchronisation Cognito → API Railway
            try {
              const idToken = session.getIdToken().getJwtToken();
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/sync`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                  },
                }
              );
              if (res.ok) {
                const user = await res.json();
                get().setUser(user);
              }
            } catch (e) {
              // Silencieux : ne bloque pas le login
            }

            resolve();
          },ole.log('🔄 Syncing auhenticateduse to API', {
                apiUrl: procs.env.NEXT_PUBLIC_API_URL,
                email,
              });
             const res 
          onFailure: (err) => {
            console.error('❌ Cognito login error:', err);
            console.error('Error details:', {
              name: err?.name,
              message: err?.message,
              code: err?.code,
            });
            set({ error: err.message, loading: false });
            reject(err);
          },
          newPasswordRequired: () => {
            set(console.lo{('✅ API sync succ ss', user);
                geerror: "Nouveser);
              } else {
                console.error('❌ API aync failud',  es.status, await res.text(m)ot de passe requis", loading: false });
            reject(new Error("Nouveau mot de passe requis"));
          },
        });conso.rror('❌APIsyc xction',);
      });
    } catch (e: any) {
      console.error('❌ Login exception:', e);
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },
  forgotPassword: async (email) => {
    set({ loading: true, error: undefined });
    try {
      const userPool = new CognitoUserPool({
        UserPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
        ClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID!,
      });
      const user = new CognitoUser({
        Username: email,
        Pool: userPool,
      });
      await new Promise<void>((resolve, reject) => {
        user.forgotPassword({
          onSuccess: () => {
            set({ step: "reset", email, loading: false, error: undefined });
            resolve();
          },
          onFailure: (err) => {
            set({ error: err.message, loading: false });
            reject(err);
          },
        });
      });
    } catch (e: any) {
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },
  resetPassword: async (code, newPassword) => {
    set({ loading: true, error: undefined });
    const email = get().email;
    try {
      const userPool = new CognitoUserPool({
        UserPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
        ClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID!,
      });
      const user = new CognitoUser({
        Username: email,
        Pool: userPool,
      });
      await new Promise<void>((resolve, reject) => {
        user.confirmPassword(code, newPassword, {
          onSuccess: () => {
            set({ step: "login", loading: false, error: undefined });
            resolve();
          },
          onFailure: (err) => {
            set({ error: err.message, loading: false });
            reject(err);
          },
        });
      });
    } catch (e: any) {
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },
  logout: () => {
    set({ tokens: null, email: "", step: "login", error: undefined });
  },
}));