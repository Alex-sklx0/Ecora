import { betterAuth } from 'better-auth'
import { pool } from './db'
import { env } from './env'

export const auth = betterAuth({
  database: pool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS.split(','),
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
})
