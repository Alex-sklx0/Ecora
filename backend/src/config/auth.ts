import { betterAuth } from 'better-auth'
import { pool } from './db'
import { env } from './env'

const configuredOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS
  ? env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map((o) => o.trim())
  : []

const trustedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    'https://*.vercel.app',
    'https://ecora-chi.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8000',
  ])
).filter(Boolean)

export const auth = betterAuth({
  database: pool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // 1 día
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutos
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === 'production' || env.BETTER_AUTH_URL.startsWith('https://'),
    defaultCookieAttributes: {
      sameSite: (env.NODE_ENV === 'production' || env.BETTER_AUTH_URL.startsWith('https://')) ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production' || env.BETTER_AUTH_URL.startsWith('https://'),
      httpOnly: true,
    },
  },
})
