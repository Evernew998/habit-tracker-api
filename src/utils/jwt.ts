import { SignJWT, type JWTPayload } from 'jose'
import { createSecretKey } from 'node:crypto'
import env from '../../env.ts'

export interface JwtPayload extends JWTPayload {
  id: string
  email: string
  username: string
}

const secretKey = createSecretKey(env.JWT_SECRET, 'utf-8')

export const generateToken = async (payload: JwtPayload): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey)
}
