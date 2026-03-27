import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js'
import { env } from '@/lib/env'

const normalizeIdentifier = (value: string) => value.trim().toLowerCase()

const getUserPool = () => {
  if (!env.cognitoUserPoolId || !env.cognitoClientId) {
    throw new Error(
      'Cognito config manquante: NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID / NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID'
    )
  }
  return new CognitoUserPool({
    UserPoolId: env.cognitoUserPoolId,
    ClientId: env.cognitoClientId,
  })
}

export const cognitoSignup = async (params: {
  email: string
  password: string
  username?: string
}) => {
  const pool = getUserPool()
  const email = normalizeIdentifier(params.email)

  const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })]
  if (params.username) {
    attributes.push(new CognitoUserAttribute({ Name: 'preferred_username', Value: params.username }))
  }

  return new Promise<{ userSub: string }>((resolve, reject) => {
    pool.signUp(email, params.password, attributes, [], (err, result) => {
      if (err || !result) return reject(err)
      resolve({ userSub: result.userSub })
    })
  })
}

export const cognitoConfirmSignup = async (params: { email: string; code: string }) => {
  const pool = getUserPool()
  const user = new CognitoUser({ Username: normalizeIdentifier(params.email), Pool: pool })

  return new Promise<void>((resolve, reject) => {
    user.confirmRegistration(params.code, true, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export const cognitoResendSignupCode = async (params: { email: string }) => {
  const pool = getUserPool()
  const user = new CognitoUser({ Username: normalizeIdentifier(params.email), Pool: pool })

  return new Promise<void>((resolve, reject) => {
    user.resendConfirmationCode((err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export const cognitoLogin = async (params: { email: string; password: string }) => {
  const pool = getUserPool()
  const email = normalizeIdentifier(params.email)
  const user = new CognitoUser({ Username: email, Pool: pool })
  const auth = new AuthenticationDetails({ Username: email, Password: params.password })

  return new Promise<{
    accessToken: string
    idToken: string
    refreshToken: string
  }>((resolve, reject) => {
    user.authenticateUser(auth, {
      onSuccess: (session) => {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        })
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error('NEW_PASSWORD_REQUIRED')),
    })
  })
}

export const cognitoRefresh = async (params: { email: string; refreshToken: string }) => {
  const pool = getUserPool()
  const user = new CognitoUser({ Username: normalizeIdentifier(params.email), Pool: pool })
  const token = new CognitoRefreshToken({ RefreshToken: params.refreshToken })

  return new Promise<{ accessToken: string; idToken: string }>((resolve, reject) => {
    user.refreshSession(token, (err, session) => {
      if (err || !session) return reject(err)
      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
      })
    })
  })
}

export const cognitoLogout = () => {
  const pool = getUserPool()
  const current = pool.getCurrentUser()
  current?.signOut()
}
