import { Request } from 'express'

export interface AuthUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date
  token: string
  ipAddress?: string | null
  userAgent?: string | null
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
  session?: AuthSession
  empresaId?: number
  personaId?: number
}
