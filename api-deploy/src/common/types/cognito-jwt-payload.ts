/**
 * Claims standards / Cognito.
 * On utilise surtout `sub` comme userId Cognito.
 */
export type CognitoJwtPayload = {
  sub: string;
  iss: string;
  token_use?: 'id' | 'access';
  exp: number;
  iat: number;
  jti?: string;
  scope?: string;

  client_id?: string; // access token
  aud?: string; // id token

  email?: string;
  email_verified?: boolean;
  username?: string;
  'cognito:username'?: string;
};
