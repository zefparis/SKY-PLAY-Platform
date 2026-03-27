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
  | "confirm"
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
  confirm: (code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
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
          (err, result) => {
            if (err) {
              set({ error: err.message, loading: false });
              reject(err);
              return;
            }
            set({ email, step: "confirm", loading: false, error: undefined });
            resolve();
          }
        );
      });
    } catch (e: any) {
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },
  confirm: async (code) => {
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
        user.confirmRegistration(code, true, async (err, result) => {
          if (err) {
            set({ error: err.message, loading: false });
            reject(err);
            return;
          }
          // Succès : login automatique
          try {
            await get().login(email, (get() as any).lastPasswordForConfirm || "");
            set({ loading: false, error: undefined });
            resolve();
          } catch (loginErr: any) {
            set({ error: loginErr?.message || "Erreur lors du login", loading: false });
            reject(loginErr);
          }
        });
      });
    } catch (e: any) {
      set({ error: e?.message || "Erreur inconnue", loading: false });
      throw e;
    }
  },
  login: async (email, password) => {
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
          },
          onFailure: (err) => {
            set({ error: err.message, loading: false });
            reject(err);
          },
          newPasswordRequired: () => {
            set({ error: "Nouveau mot de passe requis", loading: false });
            reject(new Error("Nouveau mot de passe requis"));
          },
        });
      });
    } catch (e: any) {
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