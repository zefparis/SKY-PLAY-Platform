export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',

  // Cognito (public client-side settings)
  cognitoRegion: process.env.NEXT_PUBLIC_AWS_COGNITO_REGION || process.env.NEXT_PUBLIC_AWS_REGION,
  cognitoUserPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
  cognitoClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID,
  cognitoDomain: process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN,
  cognitoRedirectSignIn: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN,
  cognitoRedirectSignOut: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_OUT,
};
