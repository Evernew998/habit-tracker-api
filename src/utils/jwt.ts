import { jwtVerify, SignJWT, type JWTPayload } from 'jose'
import { createSecretKey } from 'node:crypto'
import env from '../../env.ts'
import z from 'zod'

export interface JwtPayload extends JWTPayload {
  id: string
  email: string
  username: string
}

const payloadSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
})

const secretKey = createSecretKey(env.JWT_SECRET, 'utf-8')

export const generateToken = async (payload: JwtPayload): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey)
}

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify<JwtPayload>(token, secretKey)
  const claims = payloadSchema.parse(payload)

  return { ...payload, ...claims }
}
