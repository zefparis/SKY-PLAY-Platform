export function getOAuthRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }

  const configured = process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN
  if (configured) {
    return configured
  }

  return 'http://localhost:3000/auth/callback'
}
