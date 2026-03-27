import { registerAs } from '@nestjs/config';

/**
 * Configuration AWS Cognito (User Pool) pour validation JWT côté backend.
 *
 * Le backend NE gère pas le login/signup: il ne fait que valider le token
 * Cognito (via JWKS) et extraire les claims utiles.
 */
export const cognitoConfig = registerAs('cognito', () => {
  const region = process.env.AWS_COGNITO_REGION || process.env.AWS_REGION;
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  const clientId = process.env.AWS_COGNITO_CLIENT_ID;

  if (!region) {
    throw new Error('Missing env: AWS_COGNITO_REGION (or AWS_REGION)');
  }
  if (!userPoolId) {
    throw new Error('Missing env: AWS_COGNITO_USER_POOL_ID');
  }
  if (!clientId) {
    throw new Error('Missing env: AWS_COGNITO_CLIENT_ID');
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const jwksUri = `${issuer}/.well-known/jwks.json`;

  return {
    region,
    userPoolId,
    clientId,
    issuer,
    jwksUri,
  };
});
